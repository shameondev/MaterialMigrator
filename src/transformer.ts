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
  TransformResult,
  TailwindConversion,
  MigrationError,
  ConversionWarning,
  StyleImport
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
  ): TransformResult {
    const errors: MigrationError[] = [];
    const warnings: ConversionWarning[] = [];
    const classNameReplacements = new Map<string, string>();
    const removedImports: string[] = [];

    try {
      // Determine which extractions can be fully or partially migrated
      const fullyMigratableExtractions = this.getFullyMigratableExtractions(extractions, conversions);
      const partiallyMigratableExtractions = this.getPartiallyMigratableExtractions(extractions, conversions);
      
      // 1. Replace className usages with mixed Tailwind + makeStyles classes
      this.replaceMixedClassNameUsages([...fullyMigratableExtractions, ...partiallyMigratableExtractions], conversions, classNameReplacements);

      // 2. Remove makeStyles hooks and their calls (only for fully migratable extractions)
      if (fullyMigratableExtractions.length > 0) {
        this.removeMakeStylesCalls(fullyMigratableExtractions, removedImports);
        this.updateImports(fullyMigratableExtractions, removedImports);
      }

      // 3. Update makeStyles calls for partially migratable extractions (remove converted properties)
      if (partiallyMigratableExtractions.length > 0) {
        this.updatePartialMakeStylesCalls(partiallyMigratableExtractions, conversions);
      }

      // 4. Add cn() utility for dynamic classes if needed
      this.addClsxImportIfNeeded(classNameReplacements);

      // Generate the transformed code - always generate to count remaining classes properly
      const migratedCode = generateFn(this.ast, {
        retainLines: true,
        compact: false,
        concise: false,
        minified: false,
        shouldPrintComment: () => true,
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
        originalCode: this.sourceCode,
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
          remainingClassesUsages: this.countRemainingClassesUsages(migratedCode),
        }
      };

    } catch (error) {
      errors.push({
        type: 'error',
        message: `Transformation failed: ${error}`,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        originalCode: this.sourceCode,
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
          remainingClassesUsages: 0,
        }
      };
    }
  }

  /**
   * Transform the code with support for imported styles
   */
  public transformWithImports(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>,
    importedStyles: StyleImport[]
  ): TransformResult {
    const errors: MigrationError[] = [];
    const warnings: ConversionWarning[] = [];
    const classNameReplacements = new Map<string, string>();
    const removedImports: string[] = [];

    try {
      // Separate local and imported extractions
      const localExtractions = extractions.filter(ext => 
        !importedStyles.some(imp => imp.hookName === ext.hookName)
      );
      const importedExtractions = extractions.filter(ext => 
        importedStyles.some(imp => imp.hookName === ext.hookName)
      );

      // Determine which extractions can be fully or partially migrated
      const fullyMigratableLocalExtractions = this.getFullyMigratableExtractions(localExtractions, conversions);
      const fullyMigratableImportedExtractions = this.getFullyMigratableExtractions(importedExtractions, conversions);
      const partiallyMigratableLocalExtractions = this.getPartiallyMigratableExtractions(localExtractions, conversions);
      const partiallyMigratableImportedExtractions = this.getPartiallyMigratableExtractions(importedExtractions, conversions);
      
      // Replace className usages with mixed Tailwind + makeStyles classes
      this.replaceMixedClassNameUsages([
        ...fullyMigratableLocalExtractions, 
        ...fullyMigratableImportedExtractions,
        ...partiallyMigratableLocalExtractions,
        ...partiallyMigratableImportedExtractions
      ], conversions, classNameReplacements);

      // Remove local makeStyles calls and hooks
      if (fullyMigratableLocalExtractions.length > 0) {
        this.removeMakeStylesCalls(fullyMigratableLocalExtractions, removedImports);
        this.updateImports(fullyMigratableLocalExtractions, removedImports);
      }

      // Remove imported style hooks that are no longer needed
      if (fullyMigratableImportedExtractions.length > 0) {
        this.removeImportedStyleUsages(fullyMigratableImportedExtractions, importedStyles, removedImports);
      }

      // Update makeStyles calls for partially migratable local extractions
      if (partiallyMigratableLocalExtractions.length > 0) {
        this.updatePartialMakeStylesCalls(partiallyMigratableLocalExtractions, conversions);
      }

      // Add cn() utility for dynamic classes if needed
      this.addClsxImportIfNeeded(classNameReplacements);

      // Generate the transformed code
      const migratedCode = generateFn(this.ast, {
        retainLines: true,
        compact: false,
        concise: false,
        minified: false,
        shouldPrintComment: () => true,
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
        originalCode: this.sourceCode,
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
          remainingClassesUsages: this.countRemainingClassesUsages(migratedCode),
        }
      };

    } catch (error) {
      errors.push({
        type: 'error',
        message: `Transformation failed: ${error}`,
        stack: error instanceof Error ? error.stack : undefined,
      });

      return {
        originalCode: this.sourceCode,
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
          remainingClassesUsages: 0,
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
      const hasConvertibleStyles = extraction.styles.every(style => {
        const styleKey = `${extraction.hookName}.${style.name}`;
        const conversion = conversions.get(styleKey);
        
        // Only consider fully migratable if ALL properties are convertible (no unconvertible properties)
        // Empty styles (0 properties) are also considered fully migratable since they can be removed
        return conversion && 
               conversion.unconvertible.length === 0 &&
               (conversion.tailwindClasses.length > 0 || Object.keys(conversion.original).length === 0);
      });

      if (!hasConvertibleStyles) {
        return false;
      }

      // CRITICAL FIX: Also verify that ALL className usages in the AST can be converted
      // This prevents removing makeStyles when there are still unconverted classes.xxx references
      return this.validateAllClassUsagesConvertible(extraction, conversions);
    });
  }

  /**
   * FIXED: Validates that all classes.xxx usages in the AST can be successfully converted
   * This prevents broken references when makeStyles is removed
   * 
   * The previous version only checked MemberExpression but missed:
   * - OptionalMemberExpression (classes?.xxx) 
   * - Computed properties in objects ([classes.xxx]: condition)
   * - Nested expressions in function calls, templates, etc.
   */
  private validateAllClassUsagesConvertible(
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>
  ): boolean {
    const classesVarName = this.findClassesVariableName(extraction.hookName);
    if (!classesVarName) return false;

    let allUsagesConvertible = true;
    const unconvertibleUsages: string[] = [];

    // Comprehensive AST traversal that matches transformation logic patterns
    traverseFn(this.ast, {
      // Pattern 1: Direct member expressions (classes.xxx)
      MemberExpression: (path: NodePath<t.MemberExpression>) => {
        const { node } = path;
        
        if (
          t.isIdentifier(node.object) &&
          node.object.name === classesVarName &&
          t.isIdentifier(node.property)
        ) {
          if (!this.checkStyleConvertible(extraction.hookName, node.property.name, conversions, unconvertibleUsages)) {
            allUsagesConvertible = false;
          }
        }
      },

      // Pattern 2: Optional member expressions (classes?.xxx) - PREVIOUSLY MISSING
      OptionalMemberExpression: (path: NodePath<t.OptionalMemberExpression>) => {
        const { node } = path;
        
        if (
          t.isIdentifier(node.object) &&
          node.object.name === classesVarName &&
          t.isIdentifier(node.property)
        ) {
          if (!this.checkStyleConvertible(extraction.hookName, node.property.name, conversions, unconvertibleUsages)) {
            allUsagesConvertible = false;
          }
        }
      },

      // Pattern 3: Computed properties in objects ([classes.xxx]: condition) - PREVIOUSLY MISSING  
      ObjectProperty: (path: NodePath<t.ObjectProperty>) => {
        const { node } = path;
        
        // Check computed properties with member expressions
        if (node.computed && t.isMemberExpression(node.key)) {
          const keyExpr = node.key;
          if (
            t.isIdentifier(keyExpr.object) &&
            keyExpr.object.name === classesVarName &&
            t.isIdentifier(keyExpr.property)
          ) {
            if (!this.checkStyleConvertible(extraction.hookName, keyExpr.property.name, conversions, unconvertibleUsages)) {
              allUsagesConvertible = false;
            }
          }
        }
        
        // Check computed properties with optional member expressions
        if (node.computed && t.isOptionalMemberExpression(node.key)) {
          const keyExpr = node.key;
          if (
            t.isIdentifier(keyExpr.object) &&
            keyExpr.object.name === classesVarName &&
            t.isIdentifier(keyExpr.property)
          ) {
            if (!this.checkStyleConvertible(extraction.hookName, keyExpr.property.name, conversions, unconvertibleUsages)) {
              allUsagesConvertible = false;
            }
          }
        }
      }
    });

    // Log details for debugging if validation fails
    if (!allUsagesConvertible) {
      console.log(`❌ Validation failed for ${extraction.hookName}:`);
      console.log(`   Unconvertible usages found: ${unconvertibleUsages.join(', ')}`);
      console.log(`   This extraction will be marked as PARTIALLY migratable to prevent broken references`);
    }

    return allUsagesConvertible;
  }

  /**
   * Helper method to check if a specific style is convertible
   * CROSS-FILE FIX: Search across all possible hookNames for imported styles
   */
  private checkStyleConvertible(
    hookName: string, 
    styleName: string, 
    conversions: Map<string, TailwindConversion>,
    unconvertibleUsages: string[]
  ): boolean {
    // First try the direct hookName (for local styles)
    let styleKey = `${hookName}.${styleName}`;
    let conversion = conversions.get(styleKey);
    
    // CROSS-FILE FIX: If not found, search all conversions for this style name
    // This handles imported styles where hookName differs between files
    if (!conversion) {
      for (const [key, conv] of conversions.entries()) {
        if (key.endsWith(`.${styleName}`)) {
          conversion = conv;
          styleKey = key;
          break;
        }
      }
    }
    
    // If this usage doesn't have a conversion or has unconvertible properties,
    // mark as not fully migratable
    if (!conversion || conversion.unconvertible.length > 0) {
      unconvertibleUsages.push(`${styleName} (${!conversion ? 'no conversion found in any file' : `${conversion.unconvertible.length} unconvertible properties in ${styleKey}`})`);
      return false;
    }
    
    return true;
  }

  /**
   * Find the actual variable name used for classes (e.g., "classes" from "const classes = useStyles()")
   */
  private findClassesVariableName(hookName: string): string | null {
    let classesVarName: string | null = null;

    traverseFn(this.ast, {
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        const { node } = path;
        
        if (
          t.isIdentifier(node.id) &&
          t.isCallExpression(node.init) &&
          t.isIdentifier(node.init.callee) &&
          node.init.callee.name === hookName
        ) {
          classesVarName = node.id.name;
          path.stop(); // Found it, stop searching
        }
      }
    });

    return classesVarName;
  }

  private getPartiallyMigratableExtractions(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>
  ): MakeStylesExtraction[] {
    return extractions.filter(extraction => {
      // Include extractions where at least one style has convertible properties
      // but some styles may have unconvertible properties too
      return extraction.styles.some(style => {
        const styleKey = `${extraction.hookName}.${style.name}`;
        const conversion = conversions.get(styleKey);
        return conversion && conversion.tailwindClasses.length > 0;
      });
    });
  }

  private replaceMixedClassNameUsages(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): void {
    // First, build a map of hook names to their actual variable names
    const hookToVariableMap = this.buildHookToVariableMap(extractions);

    for (const extraction of extractions) {
      const classesVarName = hookToVariableMap.get(extraction.hookName) || 
                            this.getClassesVariableName(extraction.hookName);

      traverseFn(this.ast, {
        JSXAttribute: (path: NodePath<t.JSXAttribute>) => {
          const { node } = path;
          
          if (
            t.isJSXIdentifier(node.name) &&
            (node.name.name === 'className' || node.name.name.endsWith('ClassName')) &&
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
        
        // If there are unconvertible properties, combine Tailwind classes with original makeStyles class using cn()
        if (conversion.unconvertible.length > 0) {
          const originalClassExpr = t.memberExpression(
            t.identifier(classesVarName),
            t.identifier(styleName)
          );
          
          // Create cn(classes.styleName, "tailwindClasses") call
          const cnCall = t.callExpression(
            t.identifier('cn'),
            [
              originalClassExpr,
              t.stringLiteral(tailwindString)
            ]
          );
          
          classNameReplacements.set(`${classesVarName}.${styleName}`, `cn(${classesVarName}.${styleName}, "${tailwindString}")`);
          return cnCall;
        } else {
          // Fully convertible - use only Tailwind classes
          classNameReplacements.set(`${classesVarName}.${styleName}`, tailwindString);
          return t.stringLiteral(tailwindString);
        }
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
        
        // If there are unconvertible properties, combine Tailwind classes with original makeStyles class using cn()
        if (conversion.unconvertible.length > 0) {
          const originalClassExpr = t.optionalMemberExpression(
            t.identifier(classesVarName),
            t.identifier(styleName),
            false,
            true
          );
          
          // Create cn(classes?.styleName, "tailwindClasses") call
          const cnCall = t.callExpression(
            t.identifier('cn'),
            [
              originalClassExpr,
              t.stringLiteral(tailwindString)
            ]
          );
          
          classNameReplacements.set(`${classesVarName}?.${styleName}`, `cn(${classesVarName}?.${styleName}, "${tailwindString}")`);
          return cnCall;
        } else {
          // Fully convertible - use only Tailwind classes
          classNameReplacements.set(`${classesVarName}?.${styleName}`, tailwindString);
          return t.stringLiteral(tailwindString);
        }
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

    // Handle object expressions: { [classes.unscrollable]: isDrawerVisible }
    if (t.isObjectExpression(expr)) {
      return this.transformObjectExpression(
        expr,
        classesVarName,
        extraction,
        conversions,
        classNameReplacements
      );
    }

    return null;
  }

  /**
   * Update only makeStyles calls for external files, returning transformed code
   */
  public updatePartialMakeStylesCallsAndGetCode(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>
  ): TransformResult {
    const errors: MigrationError[] = [];
    const warnings: ConversionWarning[] = [];
    const classNameReplacements = new Map<string, string>();
    const removedImports: string[] = [];

    try {
      // Update the makeStyles calls
      this.updatePartialMakeStylesCalls(extractions, conversions);

      // Generate the transformed code
      const generated = generateFn(this.ast, {
        retainLines: true,
        compact: false,
      });
      const migratedCode = generated.code || generated;

      return {
        originalCode: this.sourceCode,
        migratedCode,
        conversions: Array.from(conversions.values()),
        classNameReplacements,
        removedImports,
        errors,
        warnings,
        stats: {
          totalStyles: extractions.reduce((sum, ext) => sum + ext.styles.length, 0),
          convertedStyles: 0, // Not tracked for external files
          unconvertibleStyles: 0, // Not tracked for external files
          classNameReplacements: 0,
          remainingClassesUsages: 0,
        }
      };
    } catch (error) {
      errors.push({
        type: 'error',
        message: error instanceof Error ? error.message : 'Failed to update makeStyles calls'
      });

      return {
        originalCode: this.sourceCode,
        migratedCode: this.sourceCode,
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
          remainingClassesUsages: 0,
        }
      };
    }
  }

  /**
   * Update makeStyles calls for partially migratable extractions
   * Remove converted properties, keep unconvertible ones
   */
  private updatePartialMakeStylesCalls(
    extractions: MakeStylesExtraction[],
    conversions: Map<string, TailwindConversion>
  ): void {
    for (const extraction of extractions) {
      traverseFn(this.ast, {
        VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
          if (
            t.isCallExpression(path.node.init) &&
            t.isIdentifier(path.node.init.callee) &&
            path.node.init.callee.name === 'makeStyles'
          ) {
            const callExpr = path.node.init;
            const arg = callExpr.arguments[0];
            
            if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
              const body = arg.body;
              let objExpr: t.ObjectExpression | null = null;
              
              if (t.isObjectExpression(body)) {
                objExpr = body;
                // Update the object expression to remove converted properties
                this.updateStylesObjectExpression(objExpr, extraction, conversions);
              } else if (t.isBlockStatement(body)) {
                // Handle function body with return statement
                const returnStatement = body.body.find(stmt => t.isReturnStatement(stmt)) as t.ReturnStatement;
                if (returnStatement && t.isObjectExpression(returnStatement.argument)) {
                  objExpr = returnStatement.argument;
                  this.updateStylesObjectExpression(objExpr, extraction, conversions);
                }
              }
              
              // If all styles were removed, remove the entire makeStyles call
              if (objExpr && objExpr.properties.length === 0) {
                // Remove the entire variable declaration
                if (path.parent && t.isVariableDeclaration(path.parent) && path.parent.declarations.length === 1) {
                  path.parentPath.remove();
                } else {
                  // Remove just this declaration if there are multiple in the statement
                  path.remove();
                }
              }
            }
          }
        }
      });
    }
  }

  /**
   * Update a styles object expression to remove converted properties
   */
  private updateStylesObjectExpression(
    objExpr: t.ObjectExpression,
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>
  ): void {
    objExpr.properties = objExpr.properties.filter(prop => {
      if (t.isObjectProperty(prop) || t.isObjectMethod(prop)) {
        let key: string | null = null;
        
        if (t.isIdentifier(prop.key)) {
          key = prop.key.name;
        } else if (t.isStringLiteral(prop.key)) {
          key = prop.key.value;
        }
        
        if (key) {
          const styleKey = `${extraction.hookName}.${key}`;
          const conversion = conversions.get(styleKey);
          
          // Keep the style if it has unconvertible properties
          if (conversion && conversion.unconvertible.length > 0) {
            // Remove converted properties from this style object
            if (t.isObjectProperty(prop) && t.isObjectExpression(prop.value)) {
              this.removeConvertedProperties(prop.value, conversion);
            }
            return true; // Keep the style object
          } else if (conversion && conversion.tailwindClasses.length > 0 && conversion.unconvertible.length === 0) {
            // Remove ONLY fully converted styles (no unconvertible properties)
            return false;
          } else if (conversion && conversion.tailwindClasses.length === 0 && conversion.unconvertible.length === 0) {
            // Remove empty styles (no properties to convert)
            return false;
          }
        }
      }
      
      return true; // Keep non-style properties
    });
  }

  /**
   * Remove converted CSS properties from a style object
   */
  private removeConvertedProperties(
    styleObj: t.ObjectExpression,
    conversion: TailwindConversion
  ): void {
    const unconvertibleProps = new Set(conversion.unconvertible.map(u => u.property));
    
    styleObj.properties = styleObj.properties.filter(prop => {
      if (t.isObjectProperty(prop) || t.isObjectMethod(prop)) {
        let propName: string | null = null;
        
        if (t.isIdentifier(prop.key)) {
          propName = prop.key.name;
        } else if (t.isStringLiteral(prop.key)) {
          propName = prop.key.value;
        }
        
        if (propName) {
          // Keep only unconvertible properties
          return unconvertibleProps.has(propName);
        }
      }
      
      return true; // Keep non-property items
    });
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

        // Transform the argument, passing context that we're inside a cn() call
        const transformed = this.transformClassNameExpressionInCnContext(
          arg as t.Expression,
          classesVarName,
          extraction,
          conversions,
          classNameReplacements
        );
        
        if (transformed) {
          // If transformation happened and returned additional classes, add them
          if (Array.isArray(transformed)) {
            newArgs.push(...transformed);
          } else {
            newArgs.push(transformed);
          }
        } else {
          newArgs.push(arg as t.Expression);
        }
      }

      return t.callExpression(expr.callee, newArgs);
    }

    return expr;
  }

  private transformClassNameExpressionInCnContext(
    expr: t.Expression,
    classesVarName: string,
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): t.Expression | t.Expression[] | null {
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
        
        // If there are unconvertible properties, keep original class and add Tailwind classes as separate argument
        if (conversion.unconvertible.length > 0) {
          const originalClassExpr = t.memberExpression(
            t.identifier(classesVarName),
            t.identifier(styleName)
          );
          
          classNameReplacements.set(`${classesVarName}.${styleName}`, `${classesVarName}.${styleName}, "${tailwindString}"`);
          // Return both the original expression and the Tailwind string
          return [originalClassExpr, t.stringLiteral(tailwindString)];
        } else {
          // Fully convertible - use only Tailwind classes
          classNameReplacements.set(`${classesVarName}.${styleName}`, tailwindString);
          return t.stringLiteral(tailwindString);
        }
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
        
        // If there are unconvertible properties, keep original class and add Tailwind classes as separate argument
        if (conversion.unconvertible.length > 0) {
          const originalClassExpr = t.optionalMemberExpression(
            t.identifier(classesVarName),
            t.identifier(styleName),
            false,
            true
          );
          
          classNameReplacements.set(`${classesVarName}?.${styleName}`, `${classesVarName}?.${styleName}, "${tailwindString}"`);
          // Return both the original expression and the Tailwind string
          return [originalClassExpr, t.stringLiteral(tailwindString)];
        } else {
          // Fully convertible - use only Tailwind classes
          classNameReplacements.set(`${classesVarName}?.${styleName}`, tailwindString);
          return t.stringLiteral(tailwindString);
        }
      }
    }

    // For other expression types, fall back to normal transformation
    return this.transformClassNameExpression(
      expr,
      classesVarName,
      extraction,
      conversions,
      classNameReplacements
    );
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

  private transformObjectExpression(
    expr: t.ObjectExpression,
    classesVarName: string,
    extraction: MakeStylesExtraction,
    conversions: Map<string, TailwindConversion>,
    classNameReplacements: Map<string, string>
  ): t.Expression {
    const transformedProperties: (t.ObjectMethod | t.ObjectProperty | t.SpreadElement)[] = [];

    for (const prop of expr.properties) {
      if (t.isObjectProperty(prop)) {
        // Handle computed properties like [classes.unscrollable]: condition
        if (prop.computed && t.isMemberExpression(prop.key)) {
          const transformedKey = this.transformClassNameExpression(
            prop.key,
            classesVarName,
            extraction,
            conversions,
            classNameReplacements
          );
          
          if (transformedKey && t.isStringLiteral(transformedKey)) {
            const tailwindClasses = transformedKey.value;
            
            // Check if the Tailwind classes contain pseudo-selectors or complex combinations
            // that should not be used in conditional objects
            const hasPseudoSelectors = tailwindClasses.includes('hover:') || 
                                     tailwindClasses.includes('focus:') || 
                                     tailwindClasses.includes('active:') ||
                                     tailwindClasses.includes('visited:') ||
                                     tailwindClasses.includes('disabled:');
            
            const hasMultipleClasses = tailwindClasses.trim().split(/\s+/).length > 1;
            
            // If the converted classes contain pseudo-selectors or multiple classes,
            // keep the original to avoid confusing conditional logic
            if (hasPseudoSelectors || hasMultipleClasses) {
              transformedProperties.push(prop);
            } else {
              // Convert { [classes.unscrollable]: condition } to { 'tailwind-classes': condition }
              transformedProperties.push(
                t.objectProperty(
                  transformedKey,
                  prop.value,
                  false // computed: false since we now have a string literal
                )
              );
            }
          } else {
            // Keep original if transformation failed
            transformedProperties.push(prop);
          }
        } else {
          // Handle non-computed properties (regular object properties)
          transformedProperties.push(prop);
        }
      } else {
        // Keep methods and spread elements as-is
        transformedProperties.push(prop);
      }
    }

    return t.objectExpression(transformedProperties);
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
    let needsCnUtility = false;

    // Check if any className replacements use cn()
    for (const replacement of classNameReplacements.values()) {
      if (replacement.includes('cn(')) {
        needsCnUtility = true;
        break;
      }
    }

    // Also analyze existing className expressions to see if they're dynamic
    if (!needsCnUtility) {
      traverseFn(this.ast, {
        JSXAttribute: (path: NodePath<t.JSXAttribute>) => {
          const { node } = path;
          
          if (
            t.isJSXIdentifier(node.name) &&
            (node.name.name === 'className' || node.name.name.endsWith('ClassName')) &&
            node.value &&
            t.isJSXExpressionContainer(node.value)
          ) {
            const expr = node.value.expression;
            
            // Check for cn() calls or complex expressions that might benefit from cn()
            if (
              (t.isCallExpression(expr) && t.isIdentifier(expr.callee) && expr.callee.name === 'cn') ||
              t.isConditionalExpression(expr) ||
              t.isLogicalExpression(expr) ||
              (t.isTemplateLiteral(expr) && expr.expressions.length > 0)
            ) {
              needsCnUtility = true;
            }
          }
        }
      });
    }

    if (needsCnUtility) {
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
        // Find the last import and add after it
        let lastImportIndex = -1;
        for (let i = 0; i < this.ast.program.body.length; i++) {
          if (t.isImportDeclaration(this.ast.program.body[i])) {
            lastImportIndex = i;
          }
        }

        // Add cn import at the top
        const cnImport = t.importDeclaration(
          [t.importSpecifier(t.identifier('cn'), t.identifier('cn'))],
          t.stringLiteral('@/lib/utils')
        );
        
        // Add proper line breaks for formatting
        if (lastImportIndex >= 0) {
          cnImport.leadingComments = [];
          cnImport.trailingComments = [];
        }

        // If we found imports, insert after the last one, otherwise insert at the beginning
        const insertIndex = lastImportIndex >= 0 ? lastImportIndex + 1 : 0;
        this.ast.program.body.splice(insertIndex, 0, cnImport);
      }
    }
  }

  /**
   * Build a map of hook names to their actual variable names by analyzing the AST
   */
  private buildHookToVariableMap(extractions: MakeStylesExtraction[]): Map<string, string> {
    const hookNames = new Set(extractions.map(e => e.hookName));
    const hookToVariableMap = new Map<string, string>();

    traverseFn(this.ast, {
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        const { node } = path;
        
        // Check if this is a variable assignment from a hook call
        if (
          t.isIdentifier(node.id) &&
          t.isCallExpression(node.init) &&
          t.isIdentifier(node.init.callee) &&
          hookNames.has(node.init.callee.name)
        ) {
          // Map the hook name to the variable name
          hookToVariableMap.set(node.init.callee.name, node.id.name);
        }
      }
    });

    return hookToVariableMap;
  }

  /**
   * Remove imported style hook usages that have been successfully migrated
   */
  private removeImportedStyleUsages(
    migratedExtractions: MakeStylesExtraction[],
    importedStyles: StyleImport[],
    removedImports: string[]
  ): void {
    const migratedHookNames = new Set(migratedExtractions.map(e => e.hookName));
    const migratedImports = importedStyles.filter(imp => migratedHookNames.has(imp.hookName));

    traverseFn(this.ast, {
      // Remove hook calls: const classes = useStyles(props);
      CallExpression: (path: NodePath<t.CallExpression>) => {
        const { node } = path;
        
        if (
          t.isIdentifier(node.callee) &&
          migratedHookNames.has(node.callee.name)
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
      },

      // Update import declarations
      ImportDeclaration: (path: NodePath<t.ImportDeclaration>) => {
        const { node } = path;
        
        if (!t.isStringLiteral(node.source)) return;

        const importPath = node.source.value;
        const migratedFromThisFile = migratedImports.filter(imp => 
          imp.importPath === importPath || imp.resolvedPath.endsWith(importPath.replace('./', ''))
        );

        if (migratedFromThisFile.length === 0) return;

        // Filter out migrated style imports
        const newSpecifiers = node.specifiers.filter(spec => {
          if (t.isImportDefaultSpecifier(spec)) {
            const isStyleImport = migratedFromThisFile.some(imp => 
              imp.importedName === 'default' && imp.hookName === spec.local.name
            );
            if (isStyleImport) {
              removedImports.push(`${spec.local.name} (default from ${importPath})`);
              return false;
            }
          } else if (t.isImportSpecifier(spec)) {
            const importedName = t.isIdentifier(spec.imported) ? spec.imported.name : spec.local.name;
            const isStyleImport = migratedFromThisFile.some(imp => 
              imp.importedName === importedName
            );
            if (isStyleImport) {
              removedImports.push(`${importedName} from ${importPath}`);
              return false;
            }
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
    });
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
            conversion.warnings.forEach(w => preview.push(`- ⚠️ ${w.message}`));
          }

          if (conversion.unconvertible.length > 0) {
            preview.push('**Manual Review Required:**');
            conversion.unconvertible.forEach(u => 
              preview.push(`- ❌ ${u.property}: ${u.value} (${u.reason})`)
            );
          }

          preview.push('');
        }
      }
    }

    return preview.join('\n');
  }

  /**
   * Count remaining classes.x usages in the migrated code
   */
  private countRemainingClassesUsages(code: string): number {
    // Use regex to find classes.property or classes?.property patterns
    // Fixed: removed double escaping (was \\., should be \.)
    const classesUsageRegex = /classes\.\w+|classes\?\.\w+/g;
    const matches = code.match(classesUsageRegex);
    return matches ? matches.length : 0;
  }
}