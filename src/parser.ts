import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import type { NodePath } from '@babel/traverse';

// @ts-ignore - Handle mixed ES/CJS module imports
const traverseFn = traverse.default || traverse;
import * as t from '@babel/types';
import type {
  MakeStylesExtraction,
  StyleDefinition,
  CSSProperties,
  CSSValue,
  ThemeReference,
  ClassNameUsage
} from './types.js';

export class ASTParser {
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
   * Extract all makeStyles calls from the AST
   */
  public extractMakeStylesCalls(): MakeStylesExtraction[] {
    const extractions: MakeStylesExtraction[] = [];

    traverseFn(this.ast, {
      VariableDeclarator: (path: NodePath<t.VariableDeclarator>) => {
        const { node } = path;
        
        // Check if this is a makeStyles call: const useStyles = makeStyles(...)
        if (
          t.isIdentifier(node.id) &&
          node.id.name.startsWith('use') &&
          node.id.name.endsWith('Styles') &&
          t.isCallExpression(node.init) &&
          t.isIdentifier(node.init.callee) &&
          node.init.callee.name === 'makeStyles'
        ) {
          const extraction = this.processMakeStylesCall(node.id.name, node.init, path);
          if (extraction) {
            extractions.push(extraction);
          }
        }
      }
    });

    return extractions;
  }

  private processMakeStylesCall(
    hookName: string,
    callExpr: t.CallExpression,
    path: NodePath<t.VariableDeclarator>
  ): MakeStylesExtraction | null {
    const arg = callExpr.arguments[0];
    
    if (!arg) return null;

    // Handle makeStyles((theme) => ({ ... }))
    if (t.isArrowFunctionExpression(arg) || t.isFunctionExpression(arg)) {
      const themeParam = arg.params[0] && t.isIdentifier(arg.params[0]) 
        ? arg.params[0].name 
        : undefined;

      if (t.isObjectExpression(arg.body)) {
        return {
          importName: 'makeStyles',
          hookName,
          styles: this.extractStylesFromObject(arg.body),
          themeParam,
          sourceFile: '', // Will be set by caller
        };
      }
    }
    
    // Handle makeStyles({ ... })
    if (t.isObjectExpression(arg)) {
      return {
        importName: 'makeStyles',
        hookName,
        styles: this.extractStylesFromObject(arg),
        sourceFile: '', // Will be set by caller
      };
    }

    return null;
  }

  private extractStylesFromObject(objExpr: t.ObjectExpression): StyleDefinition[] {
    const styles: StyleDefinition[] = [];

    for (const prop of objExpr.properties) {
      if (t.isObjectProperty(prop) && (t.isIdentifier(prop.key) || t.isStringLiteral(prop.key))) {
        const styleName = t.isIdentifier(prop.key) ? prop.key.name : prop.key.value;
        
        if (t.isObjectExpression(prop.value) || t.isArrowFunctionExpression(prop.value)) {
          const properties = this.extractCSSProperties(prop.value);
          
          styles.push({
            name: styleName,
            properties,
            sourceLocation: {
              start: prop.start || 0,
              end: prop.end || 0,
              line: prop.loc?.start.line || 0,
              column: prop.loc?.start.column || 0,
            }
          });
        }
      }
    }

    return styles;
  }

  private extractCSSProperties(node: t.Node): CSSProperties {
    const properties: CSSProperties = {};

    // Handle object expressions: { color: 'red', padding: 16 }
    if (t.isObjectExpression(node)) {
      for (const prop of node.properties) {
        if (t.isObjectProperty(prop)) {
          const key = this.getPropertyKey(prop.key);
          if (key) {
            properties[key] = this.extractCSSValue(prop.value);
          }
        }
      }
    }

    // Handle arrow functions: ({ theme }) => ({ color: theme.palette.primary.main })
    if (t.isArrowFunctionExpression(node) && t.isObjectExpression(node.body)) {
      return this.extractCSSProperties(node.body);
    }

    // Handle function expressions
    if (t.isFunctionExpression(node) && t.isBlockStatement(node.body)) {
      // Look for return statements
      for (const stmt of node.body.body) {
        if (t.isReturnStatement(stmt) && stmt.argument && t.isObjectExpression(stmt.argument)) {
          return this.extractCSSProperties(stmt.argument);
        }
      }
    }

    return properties as CSSProperties;
  }

  private getPropertyKey(key: t.Expression | t.PrivateName): string | null {
    if (t.isIdentifier(key)) {
      return key.name;
    }
    if (t.isStringLiteral(key)) {
      return key.value;
    }
    if (t.isTemplateLiteral(key) && key.quasis.length === 1) {
      return key.quasis[0].value.raw;
    }
    
    // Handle computed breakpoint keys like [theme.breakpoints.up('md')]
    if (t.isMemberExpression(key)) {
      const path = this.getMemberExpressionPath(key);
      if (path.length >= 3 && path[0] === 'theme' && path[1] === 'breakpoints') {
        // This is a breakpoint key, return a formatted string
        return `[theme.breakpoints.${path.slice(2).join('.')}]`;
      }
    }
    
    // Handle call expressions like [theme.breakpoints.up('md')]
    if (t.isCallExpression(key) && t.isMemberExpression(key.callee)) {
      const path = this.getMemberExpressionPath(key.callee);
      if (path.length >= 3 && path[0] === 'theme' && path[1] === 'breakpoints') {
        const method = path[2]; // 'up', 'down', 'between'
        const args = key.arguments;
        
        if (method === 'between' && args.length === 2) {
          const arg1 = t.isStringLiteral(args[0]) ? args[0].value : 'unknown';
          const arg2 = t.isStringLiteral(args[1]) ? args[1].value : 'unknown';
          return `[theme.breakpoints.between('${arg1}', '${arg2}')]`;
        } else if ((method === 'up' || method === 'down') && args.length === 1) {
          const arg = t.isStringLiteral(args[0]) ? args[0].value : 'unknown';
          return `[theme.breakpoints.${method}('${arg}')]`;
        }
      }
    }
    
    return null;
  }

  private extractCSSValue(node: t.Node): CSSValue {
    // String literals
    if (t.isStringLiteral(node)) {
      return node.value;
    }

    // Numeric literals
    if (t.isNumericLiteral(node)) {
      return node.value;
    }

    // Boolean literals
    if (t.isBooleanLiteral(node)) {
      return node.value;
    }

    // Template literals (simple ones)
    if (t.isTemplateLiteral(node)) {
      if (node.expressions.length === 0) {
        return node.quasis.map(q => q.value.cooked).join('');
      }
      // For now, return as string representation for complex templates
      return `\${template-literal}`;
    }

    // Member expressions (theme.custom.color)
    if (t.isMemberExpression(node)) {
      const path = this.getMemberExpressionPath(node);
      if (path.length > 0 && path[0] === 'theme') {
        return {
          type: 'theme',
          path: path.slice(1),
        } as ThemeReference;
      }
      return path.join('.');
    }

    // Function calls (rgba(), calc(), theme.spacing(), etc.)
    if (t.isCallExpression(node)) {
      // Handle theme.spacing() calls specifically
      if (t.isMemberExpression(node.callee)) {
        const path = this.getMemberExpressionPath(node.callee);
        if (path.length >= 2 && path[0] === 'theme' && path[1] === 'spacing') {
          // Extract the spacing multiplier (e.g., 3 from theme.spacing(3))
          const multiplier = node.arguments[0];
          if (t.isNumericLiteral(multiplier)) {
            const spacingValue = multiplier.value * 8; // Material-UI default: 8px per unit
            return `${spacingValue}px`;
          }
          // Handle non-numeric arguments (variables, expressions)
          return {
            type: 'theme-spacing',
            multiplier: this.extractCSSValue(multiplier),
          };
        }
      }
      
      // Handle other function calls (rgba(), calc(), etc.)
      if (t.isIdentifier(node.callee)) {
        return {
          type: 'function',
          name: node.callee.name,
          args: node.arguments.map(arg => this.extractCSSValue(arg)),
        };
      }
    }

    // Object expressions (nested styles, breakpoints)
    if (t.isObjectExpression(node)) {
      return this.extractCSSProperties(node);
    }

    // Array expressions
    if (t.isArrayExpression(node)) {
      return node.elements
        .filter((el): el is t.Expression => el !== null && !t.isSpreadElement(el))
        .map(el => this.extractCSSValue(el));
    }

    // Conditional expressions (ternary operators)
    if (t.isConditionalExpression(node)) {
      const consequent = this.extractCSSValue(node.consequent);
      const alternate = this.extractCSSValue(node.alternate);
      return {
        type: 'conditional' as const,
        condition: `{condition}`,
        consequent,
        alternate,
      };
    }

    // Logical expressions (&&, ||)
    if (t.isLogicalExpression(node)) {
      const left = this.extractCSSValue(node.left);
      const right = this.extractCSSValue(node.right);
      return {
        type: 'logical' as const,
        operator: node.operator,
        left,
        right,
      };
    }

    // Fallback: return string representation with more context
    if (t.isIdentifier(node)) {
      return `prop(${node.name})`;
    }
    
    return `{${node.type}}`;
  }

  private getMemberExpressionPath(node: t.MemberExpression): string[] {
    const path: string[] = [];

    let current: t.Node = node;
    while (t.isMemberExpression(current)) {
      if (t.isIdentifier(current.property)) {
        path.unshift(current.property.name);
      } else if (t.isStringLiteral(current.property)) {
        path.unshift(current.property.value);
      }
      current = current.object;
    }

    if (t.isIdentifier(current)) {
      path.unshift(current.name);
    }

    return path;
  }

  /**
   * Find all className usages that reference the extracted styles
   */
  public findClassNameUsages(hookName: string): ClassNameUsage[] {
    const usages: ClassNameUsage[] = [];

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
          
          // Handle classes.styleName or classes?.styleName
          if (
            (t.isMemberExpression(expr) && 
             t.isIdentifier(expr.object) && 
             expr.object.name === hookName.replace('use', '').replace('Styles', '').toLowerCase()) ||
            (t.isOptionalMemberExpression(expr) &&
             t.isIdentifier(expr.object) &&
             expr.object.name === hookName.replace('use', '').replace('Styles', '').toLowerCase())
          ) {
            const propertyName = t.isIdentifier(expr.property) 
              ? expr.property.name 
              : t.isStringLiteral(expr.property) 
                ? expr.property.value 
                : '';

            usages.push({
              property: propertyName,
              location: {
                start: node.start || 0,
                end: node.end || 0,
                line: node.loc?.start.line || 0,
                column: node.loc?.start.column || 0,
              },
              expression: expr,
            });
          }
        }
      }
    });

    return usages;
  }

  /**
   * Get the source code for debugging
   */
  public getSourceCode(): string {
    return this.sourceCode;
  }

  /**
   * Get line and column for a character position
   */
  public getLocationInfo(position: number): { line: number; column: number } {
    const lines = this.sourceCode.slice(0, position).split('\n');
    return {
      line: lines.length,
      column: lines[lines.length - 1].length + 1,
    };
  }
}