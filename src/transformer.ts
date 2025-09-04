import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';

// @ts-ignore - Handle mixed ES/CJS module imports
const traverseFn = traverse.default || traverse;
import generate from '@babel/generator';

// @ts-ignore - Handle mixed ES/CJS module imports
const generateFn = generate.default || generate;
import * as t from '@babel/types';
import type { 
  MakeStylesExtraction,
  ClassNameUsage,
  MigrationResult,
  TailwindConversion,
  MigrationError,
  ConversionWarning
} from './types.js';

export class CodeTransformer {
  private sourceCode: string;
  private ast: t.File;

  constructor(sourceCode: string) {
    this.sourceCode = sourceCode;
    this.ast = this.parseSourceCode(sourceCode);
  }

  private parseSourceCode(code: string): t.File {
    try {
      return parse(code, {
        sourceType: 'module',
        plugins: [
          'typescript',
          'jsx',
          'decorators-legacy',
          'classProperties',
          'objectRestSpread'
        ],
        allowImportExportEverywhere: true,
        allowReturnOutsideFunction: true,
      });
    } catch (error) {
      throw new Error(`Failed to parse source code: ${error}`);
    }
  }

  /**
   * Transform the code by replacing makeStyles with Tailwind classes
   */
  public transform(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>
  ): MigrationResult {
    const errors: MigrationError[] = [];
    const warnings: ConversionWarning[] = [];
    const classNameReplacements = new Map<string, string>();
    const removedImports: string[] = [];

    try {
      // Determine which extractions can be fully migrated
      const fullyMigratableExtractions = this.getFullyMigratableExtractions(extractions, conversions);
      
      // 1. Replace className usages with Tailwind classes (only for successfully converted styles)
      this.replaceClassNameUsages(fullyMigratableExtractions, conversions, classNameReplacements);

      // 2. Remove makeStyles hooks and their calls (only for fully migratable extractions)
      if (fullyMigratableExtractions.length > 0) {
        this.removeMakeStylesCalls(fullyMigratableExtractions, removedImports);

        // 3. Remove or update imports (only after successful migrations)
        this.updateImports(fullyMigratableExtractions, removedImports);
      }

      // 4. Add cn() utility for dynamic classes if needed
      this.addClsxImportIfNeeded(classNameReplacements);

      // Generate the transformed code
      const migratedCode = generateFn(this.ast, {
        retainLines: false,
        compact: false,
        concise: false,
      }).code;

      // Collect warnings from conversions
      for (const conversion of conversions.values()) {
        warnings.push(...conversion.warnings);
      }

      // Calculate statistics
      const totalStyles = Array.from(conversions.values()).reduce(
        (sum, conv) => sum + Object.keys(conv.original).length,
        0
      );
      const convertedStyles = Array.from(conversions.values()).reduce(
        (sum, conv) => sum + conv.tailwindClasses.length,
        0
      );
      const unconvertibleStyles = Array.from(conversions.values()).reduce(
        (sum, conv) => sum + conv.unconvertible.length,
        0
      );

      return {
        originalFile: this.sourceCode,
        migratedCode,
        conversions: Array.from(conversions.values()),
        classNameReplacements,
        removedImports,
        errors,
        warnings,
        stats: {
          totalStyles,
          convertedStyles,
          unconvertibleStyles,
          classNameReplacements: classNameReplacements.size,
        }
      };

    } catch (error) {
      errors.push({
        type: 'error',
        message: `Transformation failed: ${error}`,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        originalFile: this.sourceCode,
        migratedCode: this.sourceCode, // Return original on error
        conversions: [],
        classNameReplacements,
        removedImports,
        errors,
        warnings,
        stats: {
          totalStyles: 0,
          convertedStyles: 0,
          unconvertibleStyles: 0,
          classNameReplacements: 0,
        }
      };
    }
  }

  /**
   * Determine which extractions can be fully migrated (all styles have successful conversions)
   */
  private getFullyMigratableExtractions(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>
  ): MakeStylesExtraction[] {
    return extractions.filter(extraction => {
      // Check if all styles in this extraction have successful conversions
      return extraction.styles.every(style => {
        const styleKey = `${extraction.hookName}.${style.name}`;
        const conversion = conversions.get(styleKey);
        
        // Consider it migratable if it has Tailwind classes OR if it's an empty style
        return conversion && (
          conversion.tailwindClasses.length > 0 || 
          Object.keys(style.properties).length === 0
        );
      });
    });
  }

  private replaceClassNameUsages(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): void {
    for (const extraction of extractions) {
      const classesVarName = this.getClassesVariableName(extraction.hookName);

      traverseFn(this.ast, {
        JSXAttribute: (path: NodePath<t.JSXAttribute>) => {
          const { node } = path;
          
          if (
            t.isJSXIdentifier(node.name) &&
            node.name.name === 'className' &&
            node.value &&
            t.isJSXExpressionContainer(node.value)
          ) {
            const expr = node.value.expression;
            
            // Skip empty expressions
            if (t.isJSXEmptyExpression(expr)) {
              return;
            }
            const replacement = this.transformClassNameExpression(
              expr,
              classesVarName,
              extraction,
              conversions,
              classNameReplacements
            );

            if (replacement) {
              // If replacement is a simple string literal, use it directly without expression container
              if (t.isStringLiteral(replacement)) {
                node.value = replacement;
              } else {
                // For complex expressions, keep the expression container
                node.value.expression = replacement;
              }
            }
          }
        }
      });
    }
  }

  private transformClassNameExpression(
    expr: t.Expression,
    classesVarName: string,
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): t.Expression | null {
    // Handle simple member access: classes.root
    if (
      t.isMemberExpression(expr) &&
      t.isIdentifier(expr.object) &&
      expr.object.name === classesVarName &&
      t.isIdentifier(expr.property)
    ) {
      const styleName = expr.property.name;
      const styleKey = `${extraction.hookName}.${styleName}`;
      const conversion = conversions.get(styleKey);
      
      if (conversion && conversion.tailwindClasses.length > 0) {
        const tailwindString = conversion.tailwindClasses.join(' ');
        classNameReplacements.set(`${classesVarName}.${styleName}`, tailwindString);
        return t.stringLiteral(tailwindString);
      }
    }

    // Handle optional chaining: classes?.root
    if (
      t.isOptionalMemberExpression(expr) &&
      t.isIdentifier(expr.object) &&
      expr.object.name === classesVarName &&
      t.isIdentifier(expr.property)
    ) {
      const styleName = expr.property.name;
      const styleKey = `${extraction.hookName}.${styleName}`;
      const conversion = conversions.get(styleKey);
      
      if (conversion && conversion.tailwindClasses.length > 0) {
        const tailwindString = conversion.tailwindClasses.join(' ');
        classNameReplacements.set(`${classesVarName}?.${styleName}`, tailwindString);
        return t.stringLiteral(tailwindString);
      }
    }

    // Handle template literals: `${classes.root} additional-class`
    if (t.isTemplateLiteral(expr)) {
      return this.transformTemplateLiteral(
        expr,
        classesVarName,
        extraction,
        conversions,
        classNameReplacements
      );
    }

    // Handle function calls like clsx(classes.root, condition && 'extra')
    if (t.isCallExpression(expr)) {
      return this.transformCallExpression(
        expr,
        classesVarName,
        extraction,
        conversions,
        classNameReplacements
      );
    }

    // Handle binary expressions: classes.root + ' additional'
    if (t.isBinaryExpression(expr) && expr.operator === '+') {
      return this.transformBinaryExpression(
        expr,
        classesVarName,
        extraction,
        conversions,
        classNameReplacements
      );
    }

    return null;
  }

  private transformTemplateLiteral(
    expr: t.TemplateLiteral,
    classesVarName: string,
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): t.Expression {
    const newExpressions: t.Expression[] = [];
    
    for (const expression of expr.expressions) {
      const transformed = this.transformClassNameExpression(
        expression as t.Expression,
        classesVarName,
        extraction,
        conversions,
        classNameReplacements
      );
      newExpressions.push(transformed || (expression as t.Expression));
    }

    return t.templateLiteral(expr.quasis, newExpressions);
  }

  private transformCallExpression(
    expr: t.CallExpression,
    classesVarName: string,
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): t.Expression {
    // Check if it's clsx, cn, or similar utility
    const isClassUtility = t.isIdentifier(expr.callee) && 
      ['clsx', 'cn', 'classNames', 'classnames'].includes(expr.callee.name);

    if (isClassUtility) {
      const newArgs: (t.Expression | t.SpreadElement)[] = [];
      
      for (const arg of expr.arguments) {
        if (t.isSpreadElement(arg)) {
          newArgs.push(arg);
          continue;
        }

        const transformed = this.transformClassNameExpression(
          arg as t.Expression,
          classesVarName,
          extraction,
          conversions,
          classNameReplacements
        );
        newArgs.push(transformed || (arg as t.Expression));
      }

      return t.callExpression(expr.callee, newArgs);
    }

    return expr;
  }

  private transformBinaryExpression(
    expr: t.BinaryExpression,
    classesVarName: string,
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): t.Expression {
    const left = this.transformClassNameExpression(
      expr.left as t.Expression,
      classesVarName,
      extraction,
      conversions,
      classNameReplacements
    ) || (expr.left as t.Expression);

    const right = this.transformClassNameExpression(
      expr.right,
      classesVarName,
      extraction,
      conversions,
      classNameReplacements
    ) || expr.right;

    return t.binaryExpression(expr.operator, left, right);
  }

  private removeMakeStylesCalls(
    extractions: MakeStylesExtraction[],
    removedImports: string[]
  ): void {
    const hookNamesToRemove = new Set(extractions.map(e => e.hookName));

    traverseFn(this.ast, {
      // Remove variable declarations: const useStyles = makeStyles(...)
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        const { node } = path;
        
        if (
          t.isIdentifier(node.id) &&
          hookNamesToRemove.has(node.id.name) &&
          t.isCallExpression(node.init) &&
          t.isIdentifier(node.init.callee) &&
          node.init.callee.name === 'makeStyles'
        ) {
          // If this is the only declaration in the statement, remove the entire statement
          const parent = path.parentPath;
          if (
            parent &&
            t.isVariableDeclaration(parent.node) &&
            parent.node.declarations.length === 1
          ) {
            parent.remove();
          } else {
            // Otherwise just remove this declarator
            path.remove();
          }
        }
      },

      // Remove hook calls: const classes = useStyles(props);  
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const { node } = path;
        
        // Check if this is a useStyles() call in a variable declarator
        if (
          t.isIdentifier(node.callee) &&
          hookNamesToRemove.has(node.callee.name)
        ) {
          // Check if this CallExpression is the init value of a VariableDeclarator
          const parent = path.parentPath;
          if (parent && parent.isVariableDeclarator() && parent.node.init === node) {
            const grandParent = parent.parentPath;
            if (
              grandParent &&
              t.isVariableDeclaration(grandParent.node) &&
              grandParent.node.declarations.length === 1
            ) {
              grandParent.remove();
            } else {
              parent.remove();
            }
          }
        }
      }

    });
  }

  private updateImports(
    extractions: MakeStylesExtraction[],
    removedImports: string[]
  ): void {
    const usedImports = new Set(['makeStyles']);

    traverseFn(this.ast, {
      ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
        const { node } = path;
        
        // Handle Material-UI imports
        if (
          t.isStringLiteral(node.source) &&
          (node.source.value === '@material-ui/core/styles' ||
           node.source.value === '@mui/styles' ||
           node.source.value === '@material-ui/styles')
        ) {
          // Filter out makeStyles import
          const newSpecifiers = node.specifiers.filter(spec => {
            if (
              t.isImportSpecifier(spec) &&
              t.isIdentifier(spec.imported) &&
              spec.imported.name === 'makeStyles'
            ) {
              removedImports.push('makeStyles');
              return false;
            }
            return true;
          });

          if (newSpecifiers.length === 0) {
            // Remove entire import if no specifiers left
            path.remove();
          } else {
            // Update import with remaining specifiers
            node.specifiers = newSpecifiers;
          }
        }
      }
    });
  }

  private addClsxImportIfNeeded(classNameReplacements: Map<string, string>): void {
    // Check if we need to add cn utility for conditional classes
    let needsClsxUtility = false;

    // Analyze existing className expressions to see if they're dynamic
    traverseFn(this.ast, {
      JSXAttribute: (path: NodePath<t.JSXAttribute>) => {
        const { node } = path;
        
        if (
          t.isJSXIdentifier(node.name) &&
          node.name.name === 'className' &&
          node.value &&
          t.isJSXExpressionContainer(node.value)
        ) {
          const expr = node.value.expression;
          
          // Check for complex expressions that might benefit from cn()
          if (
            t.isConditionalExpression(expr) ||
            t.isLogicalExpression(expr) ||
            t.isCallExpression(expr) ||
            (t.isTemplateLiteral(expr) && expr.expressions.length > 0)
          ) {
            needsClsxUtility = true;
          }
        }
      }
    });

    if (needsClsxUtility) {
      // Check if cn is already imported
      let hasCnImport = false;

      traverseFn(this.ast, {
        ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
          const { node } = path;
          
          if (
            t.isStringLiteral(node.source) &&
            node.source.value.includes('lib/utils')
          ) {
            const hasCnSpecifier = node.specifiers.some(spec => 
              t.isImportSpecifier(spec) &&
              t.isIdentifier(spec.imported) &&
              spec.imported.name === 'cn'
            );
            
            if (hasCnSpecifier) {
              hasCnImport = true;
            }
          }
        }
      });

      if (!hasCnImport) {
        // Add cn import at the top
        const cnImport = t.importDeclaration(
          [t.importSpecifier(t.identifier('cn'), t.identifier('cn'))],
          t.stringLiteral('@/lib/utils')
        );

        // Find the last import and add after it
        let lastImportIndex = -1;
        for (let i = 0; i < this.ast.program.body.length; i++) {
          if (t.isImportDeclaration(this.ast.program.body[i])) {
            lastImportIndex = i;
          }
        }

        this.ast.program.body.splice(lastImportIndex + 1, 0, cnImport);
      }
    }
  }

  private getClassesVariableName(hookName: string): string {
    // Convert useStyles -> classes, useButtonStyles -> buttonClasses, etc.
    const baseName = hookName.replace(/^use/, '').replace(/Styles$/, '');
    return baseName.charAt(0).toLowerCase() + baseName.slice(1) + (baseName === '' ? 'classes' : 'Classes');
  }

  /**
   * Generate a preview of the transformation without modifying the AST
   */
  public generatePreview(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>
  ): string {
    const preview: string[] = [];
    preview.push('# Migration Preview\n');

    for (const extraction of extractions) {
      preview.push(`## ${extraction.hookName}\n`);

      for (const style of extraction.styles) {
        const conversion = conversions.get(`${extraction.hookName}.${style.name}`);
        
        if (conversion) {
          preview.push(`### ${style.name}`);
          preview.push('**Original:**');
          preview.push('```css');
          preview.push(JSON.stringify(style.properties, null, 2));
          preview.push('```');
          
          preview.push('**Tailwind:**');
          preview.push('```');
          preview.push(conversion.tailwindClasses.join(' '));
          preview.push('```');

          if (conversion.warnings.length > 0) {
            preview.push('**Warnings:**');
            conversion.warnings.forEach(w => preview.push(`- ${w.message}`));
          }

          if (conversion.unconvertible.length > 0) {
            preview.push('**Manual Review Required:**');
            conversion.unconvertible.forEach(u => 
              preview.push(`- ${u.property}: ${u.value} (${u.reason})`)
            );
          }

          preview.push('');
        }
      }
    }

    return preview.join('\n');
  }
}