import { readFile } from 'fs/promises';
import { resolve, basename } from 'path';
import { glob } from 'glob';
import { ASTParser } from '../../src/parser.js';
import { StyleConverter } from '../../src/converter.js';
import { CodeTransformer } from '../../src/transformer.js';
import type { TailwindConversion } from '../../src/types.js';

interface MigrationTestCase {
  name: string;
  inputFile: string;
  expectedFile: string;
}

interface TestResult {
  name: string;
  passed: boolean;
  actual: string;
  expected: string;
  diff?: string[];
  errors: string[];
}

export class MigrationTestRunner {
  private converter: StyleConverter;
  private testCases: MigrationTestCase[] = [];

  constructor() {
    this.converter = new StyleConverter();
  }

  /**
   * Discover test cases by scanning for .input.tsx and .expected.tsx pairs
   */
  async discoverTests(testDir: string = '__tests__/integration/migration-tests'): Promise<void> {
    const inputFiles = await glob(`${testDir}/**/*.input.tsx`, { absolute: true });
    
    this.testCases = [];
    
    for (const inputFile of inputFiles) {
      const expectedFile = inputFile.replace('.input.tsx', '.expected.tsx');
      const name = basename(inputFile, '.input.tsx');
      
      try {
        await readFile(expectedFile, 'utf-8');
        this.testCases.push({
          name,
          inputFile,
          expectedFile,
        });
      } catch {
        console.warn(`⚠️ Missing expected file for ${name}: ${expectedFile}`);
      }
    }
  }

  /**
   * Add a test case manually
   */
  addTestCase(name: string, inputFile: string, expectedFile: string): void {
    this.testCases.push({ name, inputFile, expectedFile });
  }

  /**
   * Run all discovered tests
   */
  async runAllTests(): Promise<TestResult[]> {
    const results: TestResult[] = [];
    
    console.log(`🧪 Running ${this.testCases.length} migration tests...\n`);

    for (const testCase of this.testCases) {
      const result = await this.runSingleTest(testCase);
      results.push(result);
      
      if (result.passed) {
        console.log(`✅ ${result.name}`);
      } else {
        console.log(`❌ ${result.name}`);
        if (result.errors.length > 0) {
          result.errors.forEach(error => console.log(`   Error: ${error}`));
        }
        if (result.diff && result.diff.length > 0) {
          console.log(`   Differences found:`);
          result.diff.forEach(line => console.log(`   ${line}`));
        }
      }
    }

    return results;
  }

  /**
   * Run a single test case
   */
  private async runSingleTest(testCase: MigrationTestCase): Promise<TestResult> {
    const errors: string[] = [];
    
    try {
      // Read input and expected files
      const inputCode = await readFile(testCase.inputFile, 'utf-8');
      const expectedCode = await readFile(testCase.expectedFile, 'utf-8');

      // Run migration on input
      const actualCode = await this.migrateCode(inputCode);

      // Compare results
      const passed = this.compareCode(actualCode, expectedCode);
      const diff = passed ? [] : this.generateDiff(actualCode, expectedCode);

      return {
        name: testCase.name,
        passed,
        actual: actualCode,
        expected: expectedCode,
        diff,
        errors,
      };

    } catch (error) {
      errors.push(`Failed to run test: ${error}`);
      return {
        name: testCase.name,
        passed: false,
        actual: '',
        expected: '',
        errors,
      };
    }
  }

  /**
   * Migrate code using the same logic as the main migration tool
   */
  private async migrateCode(sourceCode: string): Promise<string> {
    // Parse and extract styles
    const parser = new ASTParser(sourceCode);
    const extractions = parser.extractMakeStylesCalls();

    if (extractions.length === 0) {
      return sourceCode; // No styles to migrate
    }

    // Convert styles to Tailwind
    const conversions = new Map<string, TailwindConversion>();
    
    for (const extraction of extractions) {
      for (const style of extraction.styles) {
        const conversion = this.converter.convertStyles(style.properties);
        conversions.set(`${extraction.hookName}.${style.name}`, conversion);
      }
    }

    // Transform the code
    const transformer = new CodeTransformer(sourceCode);
    const result = transformer.transform(extractions, conversions);

    return result.migratedCode;
  }

  /**
   * Compare two code strings (normalized)
   */
  private compareCode(actual: string, expected: string): boolean {
    const normalizeCode = (code: string): string => {
      return code
        .trim()
        .replace(/\r\n/g, '\n')         // Normalize line endings
        .replace(/\n+/g, '\n')          // Remove extra newlines
        .replace(/\s+/g, ' ')           // Normalize all whitespace to single spaces
        .replace(/;\s*}/g, '}')         // Remove trailing semicolons
        .replace(/,\s*}/g, '}')         // Remove trailing commas
        .replace(/\s*,\s*/g, ', ')      // Normalize comma spacing
        .replace(/\s*{\s*/g, ' { ')     // Normalize brace spacing
        .replace(/\s*}\s*/g, ' } ')     // Normalize brace spacing
        .replace(/\s*<\s*/g, '<')       // Remove spaces around JSX tags
        .replace(/\s*>\s*/g, '>')       // Remove spaces around JSX tags
        .replace(/\s*\/\s*>/g, '/>')    // Normalize self-closing tags
        .replace(/\(\s*</g, '(<')       // Normalize return statements
        .replace(/>\s*\)/g, '>)')       // Normalize return statements
        .replace(/;\s*$/g, ';');        // Normalize semicolons at end
    };

    const normalizedActual = normalizeCode(actual);
    const normalizedExpected = normalizeCode(expected);
    
    return normalizedActual === normalizedExpected;
  }

  /**
   * Generate a simple diff between actual and expected
   */
  private generateDiff(actual: string, expected: string): string[] {
    const actualLines = actual.split('\n').map(line => line.trim()).filter(line => line);
    const expectedLines = expected.split('\n').map(line => line.trim()).filter(line => line);
    
    const diff: string[] = [];
    const maxLines = Math.max(actualLines.length, expectedLines.length);

    for (let i = 0; i < maxLines; i++) {
      const actualLine = actualLines[i] || '';
      const expectedLine = expectedLines[i] || '';
      
      if (actualLine !== expectedLine) {
        diff.push(`Line ${i + 1}:`);
        diff.push(`- Expected: ${expectedLine}`);
        diff.push(`+ Actual:   ${actualLine}`);
      }
    }

    return diff;
  }

  /**
   * Print test summary
   */
  printSummary(results: TestResult[]): void {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    
    console.log(`\n📊 Test Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total:  ${results.length}`);
    
    if (failed > 0) {
      console.log(`\n🔍 Failed tests:`);
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   • ${r.name}`);
      });
    }
  }
}

/**
 * Jest test integration
 */
export function createMigrationTests(testDir: string = '__tests__/integration/migration-tests'): void {
  describe('Migration Tests', () => {
    let runner: MigrationTestRunner;
    let testCases: MigrationTestCase[] = [];

    beforeAll(async () => {
      runner = new MigrationTestRunner();
      await runner.discoverTests(testDir);
      testCases = runner['testCases']; // Access private property for Jest
    });

    test('all migration tests should be discovered', async () => {
      // Ensure discovery has happened
      if (testCases.length === 0) {
        runner = new MigrationTestRunner();
        await runner.discoverTests(testDir);
        testCases = runner['testCases'];
      }
      expect(testCases.length).toBeGreaterThan(0);
    });

    test('all migration tests should pass', async () => {
      // Run all tests
      const results = await runner.runAllTests();
      
      // Check for failures
      const failedTests = results.filter(r => !r.passed);
      
      if (failedTests.length > 0) {
        console.log(`\nFailed migrations:`);
        failedTests.forEach(result => {
          console.log(`❌ ${result.name}`);
          if (result.errors.length > 0) {
            result.errors.forEach(error => console.log(`  Error: ${error}`));
          }
          if (result.diff && result.diff.length > 0) {
            console.log(`  Differences:`);
            result.diff.forEach(line => console.log(`  ${line}`));
          }
        });
      }

      expect(failedTests.length).toBe(0);
    });
  });
}