/**
 * Theme Testing Utility
 * 
 * This script verifies that our theme implementation works correctly.
 * It checks:
 * 1. Dark theme CSS variables
 * 2. Theme toggle component
 * 3. Smooth transition implementation
 * 4. Component updates for dark mode
 */

const fs = require('fs');
const path = require('path');

// Files to check
const files = {
  themeCss: '/home/patrick/Documents/receipt-scanner/src/assets/theme.css',
  themeToggle: '/home/patrick/Documents/receipt-scanner/src/components/ThemeToggle.vue',
  themeStore: '/home/patrick/Documents/receipt-scanner/src/stores/themeStore.ts',
  appVue: '/home/patrick/Documents/receipt-scanner/src/App.vue',
  scanReceiptVue: '/home/patrick/Documents/receipt-scanner/src/views/ScanReceipt.vue'
};

// Patterns to verify
const patterns = {
  darkThemeClass: /\.dark-theme\s*{/,
  themeTransitions: /transition.*theme-transition-duration/g,
  toggleComponent: /<button\s+@click="toggleTheme"/,
  themeStoreToggle: /toggleTheme\(\)\s*{[^}]*}/,
  semanticColors: /--color-(background|surface|text|text-secondary|border|shadow)/g,
  appClassBinding: /:\s*class="appClass"/,
  componentsUsingVars: /var\(--color-[a-z0-9-]+\)/g,
  themePreference: /localStorage\.setItem\('theme'/
};

// Results storage
const results = {
  success: [],
  warnings: [],
  errors: []
};

// Utility functions
function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (error) {
    results.errors.push(`Could not read file ${filePath}: ${error.message}`);
    return null;
  }
}

function countMatches(content, pattern) {
  const matches = content.match(pattern);
  return matches ? matches.length : 0;
}

// Test dark theme variables
function testDarkThemeVariables() {
  const content = readFile(files.themeCss);
  if (!content) return;
  
  if (patterns.darkThemeClass.test(content)) {
    results.success.push('✅ Dark theme class properly defined in theme.css');
  } else {
    results.errors.push('❌ Dark theme class missing in theme.css');
  }
  
  const semanticColorCount = countMatches(content, patterns.semanticColors);
  if (semanticColorCount >= 6) {
    results.success.push(`✅ Found ${semanticColorCount} semantic color variables for theming`);
  } else {
    results.warnings.push(`⚠️ Only found ${semanticColorCount} semantic color variables - expected at least 6`);
  }
}

// Test smooth transitions
function testSmoothTransitions() {
  const content = readFile(files.themeCss);
  if (!content) return;
  
  const transitionCount = countMatches(content, patterns.themeTransitions);
  if (transitionCount > 0) {
    results.success.push(`✅ Found ${transitionCount} theme transition implementations`);
  } else {
    results.errors.push('❌ No theme transitions found in theme.css');
  }
}

// Test theme toggle
function testThemeToggle() {
  const toggleContent = readFile(files.themeToggle);
  const storeContent = readFile(files.themeStore);
  
  if (!toggleContent || !storeContent) return;
  
  if (patterns.toggleComponent.test(toggleContent)) {
    results.success.push('✅ Theme toggle button properly implemented');
  } else {
    results.errors.push('❌ Theme toggle button implementation missing or incorrect');
  }
  
  if (patterns.themeStoreToggle.test(storeContent)) {
    results.success.push('✅ Theme toggle functionality properly implemented in store');
  } else {
    results.errors.push('❌ Theme toggle functionality missing in store');
  }
  
  if (patterns.themePreference.test(storeContent)) {
    results.success.push('✅ Theme preference saving functionality implemented');
  } else {
    results.warnings.push('⚠️ Theme preference may not be saved to localStorage');
  }
}

// Test component updates
function testComponentUpdates() {
  const appContent = readFile(files.appVue);
  const scanContent = readFile(files.scanReceiptVue);
  
  if (!appContent || !scanContent) return;
  
  if (patterns.appClassBinding.test(appContent)) {
    results.success.push('✅ App component correctly binds theme class');
  } else {
    results.errors.push('❌ App component does not properly bind theme class');
  }
  
  const componentVarCount = countMatches(scanContent, patterns.componentsUsingVars);
  if (componentVarCount > 5) {
    results.success.push(`✅ ScanReceipt component uses ${componentVarCount} CSS variables for theme support`);
  } else {
    results.warnings.push(`⚠️ ScanReceipt component may not have enough theme variables (found ${componentVarCount})`);
  }
}

// Run all tests
function runThemeTests() {
  console.log('🔍 Running theme tests...\n');
  
  testDarkThemeVariables();
  testSmoothTransitions();
  testThemeToggle();
  testComponentUpdates();
  
  // Print results
  console.log('\n=== Test Results ===\n');
  
  if (results.success.length > 0) {
    console.log('Successes:');
    results.success.forEach(msg => console.log(`  ${msg}`));
    console.log('');
  }
  
  if (results.warnings.length > 0) {
    console.log('Warnings:');
    results.warnings.forEach(msg => console.log(`  ${msg}`));
    console.log('');
  }
  
  if (results.errors.length > 0) {
    console.log('Errors:');
    results.errors.forEach(msg => console.log(`  ${msg}`));
    console.log('');
  }
  
  // Summary
  const testsPassed = results.errors.length === 0;
  console.log(`${testsPassed ? '✅' : '❌'} Theme tests ${testsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Success: ${results.success.length} | Warnings: ${results.warnings.length} | Errors: ${results.errors.length}`);
}

// Run the tests
runThemeTests();