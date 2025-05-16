/**
 * Main test runner for receipt scanner functionality
 */

import { testReceiptParser } from './receiptParser.test';
import { testVisionService } from './visionService.test';
import { testSanitization } from './sanitization.test';
import { testTemplateDetection } from './templateDetection.test';

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  console.log('======================================');
  console.log('=== Receipt Scanner System Tests ===');
  console.log('======================================\n');
  
  const startTime = Date.now();
  let passed = 0;
  let failed = 0;
  const testResults: Array<{ name: string; passed: boolean; error?: any }> = [];
  
  // Define tests to run
  const tests = [
    { name: 'Receipt Parser', run: testReceiptParser },
    { name: 'Vision Service', run: testVisionService },
    { name: 'Input Sanitization', run: testSanitization },
    { name: 'Template Detection', run: testTemplateDetection }
  ];
  
  // Run each test
  for (const test of tests) {
    console.log(`\n>>> Running ${test.name} tests...\n`);
    
    try {
      await test.run();
      console.log(`\n✅ ${test.name} tests PASSED`);
      testResults.push({ name: test.name, passed: true });
      passed++;
    } catch (error) {
      console.error(`\n❌ ${test.name} tests FAILED:`, error);
      testResults.push({ name: test.name, passed: false, error });
      failed++;
    }
    
    console.log('\n--------------------------------------');
  }
  
  // Print summary
  const endTime = Date.now();
  const duration = (endTime - startTime) / 1000;
  
  console.log('\n======================================');
  console.log(`Test Summary: ${passed} passed, ${failed} failed (${duration.toFixed(2)}s)`);
  console.log('======================================\n');
  
  // Print detailed results
  console.log('Test Results:');
  testResults.forEach(result => {
    const status = result.passed ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`   Error: ${result.error.message || result.error}`);
    }
  });
  
  // Exit with appropriate code
  if (failed > 0) {
    process.exit(1);
  }
}

// Execute tests when run directly
if (require.main === module) {
  runAllTests()
    .then(() => console.log('All tests completed'))
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}

export default runAllTests;