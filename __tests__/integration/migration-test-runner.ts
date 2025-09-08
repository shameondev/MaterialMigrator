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
   * Generate a comprehensive diff between actual and expected
   */
  private generateDiff(actual: string, expected: string): string[] {
    const actualLines = actual.split('\n');
    const expectedLines = expected.split('\n');
    
    const diff: string[] = [];
    const maxLines = Math.max(actualLines.length, expectedLines.length);

    let diffCount = 0;
    for (let i = 0; i < maxLines; i++) {
      const actualLine = actualLines[i] || '';
      const expectedLine = expectedLines[i] || '';
      
      if (actualLine.trim() !== expectedLine.trim()) {
        diffCount++;
        if (diffCount === 1) {
          diff.push('📝 Code Differences:');
        }
        
        diff.push(`\n🔍 Line ${i + 1}:`);
        diff.push(`❌ Expected: ${expectedLine}`);
        diff.push(`✅ Actual:   ${actualLine}`);
        
        // Show context (2 lines before and after)
        const context: string[] = [];
        for (let j = Math.max(0, i - 2); j <= Math.min(maxLines - 1, i + 2); j++) {
          if (j !== i) {
            const contextLine = j < actualLines.length ? actualLines[j] : (expectedLines[j] || '');
            context.push(`   ${j + 1}: ${contextLine}`);
          }
        }
        if (context.length > 0) {
          diff.push(`📋 Context:`);
          diff.push(...context);
        }
      }
    }

    return diff;
  }

  /**
   * Generate detailed failure report with actionable guidance
   */
  private generateDetailedFailureReport(results: TestResult[]): string[] {
    const failedTests = results.filter(r => !r.passed);
    if (failedTests.length === 0) return [];

    const report: string[] = [];
    
    report.push('\n🚨 DETAILED FAILURE REPORT');
    report.push('=' .repeat(50));
    
    failedTests.forEach((result, index) => {
      report.push(`\n${index + 1}. ❌ ${result.name}`);
      report.push('-'.repeat(30));
      
      if (result.errors.length > 0) {
        report.push('🔥 Errors:');
        result.errors.forEach(error => report.push(`   ${error}`));
        report.push('');
      }
      
      if (result.diff && result.diff.length > 0) {
        report.push(...result.diff);
      }
      
      // Show file paths for easy fixing
      report.push('\n📁 Files to check:');
      const testCaseFile = this.testCases.find(tc => tc.name === result.name);
      if (testCaseFile) {
        report.push(`   Input:    ${testCaseFile.inputFile}`);
        report.push(`   Expected: ${testCaseFile.expectedFile}`);
      }
      
      // Show actual vs expected code side by side
      if (result.actual && result.expected) {
        report.push('\n📄 Full Code Comparison:');
        report.push('EXPECTED OUTPUT:');
        report.push('```tsx');
        report.push(result.expected);
        report.push('```');
        report.push('\nACTUAL OUTPUT:');
        report.push('```tsx');
        report.push(result.actual);
        report.push('```');
      }
      
      report.push('\n💡 How to fix:');
      report.push(`   1. Review the differences above`);
      report.push(`   2. Update the expected file: ${testCaseFile?.expectedFile || 'N/A'}`);
      report.push(`   3. Or fix the migration logic if the actual output is wrong`);
      report.push(`   4. Re-run: npm run test:integration`);
      
      if (index < failedTests.length - 1) {
        report.push('\n' + '='.repeat(50));
      }
    });
    
    return report;
  }

  /**
   * Print comprehensive test summary with detailed failure information
   */
  printSummary(results: TestResult[]): void {
    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;
    
    console.log(`\n📊 Test Summary:`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📋 Total:  ${results.length}`);
    
    if (failed > 0) {
      // Show basic failed test list
      console.log(`\n🔍 Failed tests:`);
      results.filter(r => !r.passed).forEach(r => {
        console.log(`   • ${r.name}`);
      });
      
      // Show detailed failure report
      const detailedReport = this.generateDetailedFailureReport(results);
      detailedReport.forEach(line => console.log(line));
      
      // Show actionable summary
      console.log('\n🎯 QUICK FIX SUMMARY');
      console.log('='.repeat(30));
      console.log('To fix failing tests:');
      console.log('1. Check the detailed differences above');
      console.log('2. Update .expected.tsx files with correct output, OR');
      console.log('3. Fix migration logic if actual output is wrong');
      console.log('4. Re-run: npm run test:integration');
      console.log('');
      console.log('💡 Tip: If actual output looks correct, update expected files');
      console.log('💡 Tip: If actual output looks wrong, debug migration logic');
    } else {
      console.log('\n🎉 All migration tests passed!');
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
      
      // Always print comprehensive summary (including failures if any)
      runner.printSummary(results);
      
      // Check for failures
      const failedTests = results.filter(r => !r.passed);
      
      if (failedTests.length > 0) {
        // Additional Jest-specific failure info
        console.log(`\n🚨 JEST TEST FAILURE - ${failedTests.length} migration test(s) failed`);
        console.log('See detailed failure report above for specific issues.');
        
        // Create a descriptive error message for Jest
        const failureMessage = failedTests
          .map(test => `❌ ${test.name}: Migration output doesn't match expected`)
          .join('\n');
        
        throw new Error(`Migration tests failed:\n${failureMessage}\n\nSee console output above for detailed failure analysis.`);
      }
    });
  });
}