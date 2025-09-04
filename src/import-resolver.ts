import * as path from 'path';
import { readFileSync, existsSync } from 'fs';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import * as t from '@babel/types';
import type { MakeStylesExtraction, StyleImport, FileStyleMapping } from './types.js';
import { ASTParser } from './parser.js';

// @ts-ignore - Handle mixed ES/CJS module imports
const traverseFn = traverse.default || traverse;

/**
 * Resolves and tracks style imports across files
 */
export class ImportResolver {
  private fileStyleMap: Map<string, MakeStylesExtraction[]> = new Map();
  private importGraph: Map<string, Set<string>> = new Map();
  
  /**
   * Resolve style imports from a source file
   */
  public resolveStyleImports(
    sourceCode: string,
    filePath: string
  ): {
    localStyles: MakeStylesExtraction[];
    importedStyles: StyleImport[];
  } {
    const ast = this.parseCode(sourceCode);
    const localStyles: MakeStylesExtraction[] = [];
    const importedStyles: StyleImport[] = [];

    const self = this;
    traverseFn(ast, {
      // Find import declarations
      ImportDeclaration(nodePath: any) {
        const importPath = nodePath.node.source.value;
        
        // Check if this is a relative import (starts with . or ..)
        if (importPath.startsWith('.') || importPath.startsWith('..')) {
          const resolvedPath = self.resolveImportPath(importPath, filePath);
          
          // Check for style hook imports (useStyles, useHeaderStyles, etc.)
          nodePath.node.specifiers.forEach((specifier: any) => {
            if (t.isImportDefaultSpecifier(specifier) || t.isImportSpecifier(specifier)) {
              const importedName = t.isImportDefaultSpecifier(specifier) 
                ? 'default'
                : specifier.imported && t.isIdentifier(specifier.imported) 
                  ? specifier.imported.name 
                  : specifier.local.name;
                  
              const localName = specifier.local.name;
              
              // Check if this looks like a style hook
              if (localName && self.isStyleHookName(localName)) {
                importedStyles.push({
                  hookName: localName,
                  importPath: importPath,
                  resolvedPath: resolvedPath,
                  sourceFile: filePath,
                  importedName: importedName || localName,
                });
              }
            }
          });
        }
      },

      // Find local makeStyles calls
      CallExpression(nodePath: any) {
        if (self.isMakeStylesCall(nodePath.node)) {
          // This is handled by the regular parser
          // We just need to know it exists locally
        }
      }
    });

    // Use the regular parser to extract local styles
    const parser = new ASTParser(sourceCode);
    const localExtractions = parser.extractMakeStylesCalls();
    
    return {
      localStyles: localExtractions,
      importedStyles,
    };
  }

  /**
   * Load and parse styles from an external file
   */
  public loadStylesFromFile(
    styleFilePath: string
  ): MakeStylesExtraction[] | null {
    try {
      // Try common extensions
      const extensions = ['', '.ts', '.tsx', '.js', '.jsx'];
      let fullPath: string | null = null;
      
      for (const ext of extensions) {
        const testPath = styleFilePath + ext;
        if (existsSync(testPath)) {
          fullPath = testPath;
          break;
        }
      }
      
      if (!fullPath) {
        console.warn(`Could not find style file: ${styleFilePath}`);
        return null;
      }
      
      // Check if we've already parsed this file
      if (this.fileStyleMap.has(fullPath)) {
        return this.fileStyleMap.get(fullPath)!;
      }
      
      const fileContent = readFileSync(fullPath, 'utf-8');
      const parser = new ASTParser(fileContent);
      const styles = parser.extractMakeStylesCalls();
      
      // Cache the result
      this.fileStyleMap.set(fullPath, styles);
      
      return styles;
    } catch (error) {
      console.error(`Error loading styles from ${styleFilePath}:`, error);
      return null;
    }
  }

  /**
   * Resolve imported styles to their definitions
   */
  public resolveImportedStyles(
    imports: StyleImport[]
  ): Map<string, MakeStylesExtraction> {
    const resolvedStyles = new Map<string, MakeStylesExtraction>();
    
    for (const styleImport of imports) {
      const styles = this.loadStylesFromFile(styleImport.resolvedPath);
      
      if (styles) {
        // Find the matching style by hook name
        const matchingStyle = styles.find(s => 
          s.hookName === styleImport.importedName ||
          s.hookName === styleImport.hookName ||
          // Handle default exports
          (styleImport.importedName === 'default' && styles.length === 1)
        );
        
        if (matchingStyle) {
          resolvedStyles.set(styleImport.hookName, matchingStyle);
        }
      }
    }
    
    return resolvedStyles;
  }

  /**
   * Analyze a directory and build a complete style import graph
   */
  public async analyzeDirectory(
    dirPath: string,
    filePatterns: string[] = ['**/*.tsx', '**/*.jsx', '**/*.ts', '**/*.js']
  ): Promise<FileStyleMapping> {
    const fileMapping: FileStyleMapping = {
      files: new Map(),
      imports: new Map(),
      exports: new Map(),
    };
    
    // This would be implemented with glob patterns
    // For now, returning the structure
    
    return fileMapping;
  }

  /**
   * Check if a name looks like a style hook
   */
  private isStyleHookName(name: string): boolean {
    return /^use[A-Z].*Styles?$/.test(name) || 
           name === 'useStyles' ||
           name === 'styles' ||
           name === 'classes' ||
           /^[a-z]+Styles?$/.test(name); // e.g., buttonStyles, headerStyles
  }

  /**
   * Check if a call expression is makeStyles
   */
  private isMakeStylesCall(node: t.CallExpression): boolean {
    return (
      t.isIdentifier(node.callee) && 
      node.callee.name === 'makeStyles'
    ) || (
      t.isCallExpression(node.callee) &&
      t.isIdentifier(node.callee.callee) &&
      node.callee.callee.name === 'makeStyles'
    );
  }

  /**
   * Resolve a relative import path to an absolute path
   */
  private resolveImportPath(importPath: string, currentFile: string): string {
    const dir = path.dirname(currentFile);
    const resolved = path.resolve(dir, importPath);
    
    // Remove extension if present
    return resolved.replace(/\.(tsx?|jsx?)$/, '');
  }

  /**
   * Parse source code into AST
   */
  private parseCode(code: string): t.File {
    return parse(code, {
      sourceType: 'module',
      plugins: [
        'typescript',
        'jsx',
        'decorators-legacy',
        'classProperties',
        'objectRestSpread'
      ],
    });
  }

  /**
   * Track import relationship between files
   */
  public trackImport(fromFile: string, toFile: string): void {
    if (!this.importGraph.has(fromFile)) {
      this.importGraph.set(fromFile, new Set());
    }
    this.importGraph.get(fromFile)!.add(toFile);
  }

  /**
   * Get all files that import from a given file
   */
  public getImporters(filePath: string): string[] {
    const importers: string[] = [];
    
    for (const [file, imports] of this.importGraph.entries()) {
      if (imports.has(filePath)) {
        importers.push(file);
      }
    }
    
    return importers;
  }

  /**
   * Clear the cache
   */
  public clearCache(): void {
    this.fileStyleMap.clear();
    this.importGraph.clear();
  }
}