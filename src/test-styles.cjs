/**
 * Style Testing Utility
 * 
 * This script verifies that our theme variables and styles are properly applied.
 * It checks:
 * 1. CSS imports in App.vue
 * 2. CSS classes in icon elements
 * 3. Theme variable usage in components
 */

const fs = require('fs');
const path = require('path');

// Files to check
const files = {
  appVue: '/home/patrick/Documents/receipt-scanner/src/App.vue',
  scanReceiptVue: '/home/patrick/Documents/receipt-scanner/src/views/ScanReceipt.vue',
  receiptDisplayVue: '/home/patrick/Documents/receipt-scanner/src/components/receipts/ReceiptDisplay.vue',
  iconStylesCss: '/home/patrick/Documents/receipt-scanner/src/assets/icon-styles.css',
  themeCss: '/home/patrick/Documents/receipt-scanner/src/assets/theme.css'
};

// Patterns to verify
const patterns = {
  themeImport: /@import '.\/assets\/theme.css';/,
  iconClasses: {
    base: /class="icon/g,
    sizes: /(icon-sm|icon-md|icon-lg|icon-xl)/g,
    colors: /(icon-primary|icon-secondary|icon-gray)/g,
    specialIcons: /(camera-icon|upload-icon)/g
  },
  themeVariables: /var\(--color-[a-z0-9-]+\)/g,
  transitions: /var\(--transition-[a-z0-9-]+\)/g,
  radius: /var\(--radius-[a-z0-9-]+\)/g
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

// Check App.vue imports
function checkAppImports() {
  const content = readFile(files.appVue);
  if (!content) return;
  
  if (patterns.themeImport.test(content)) {
    results.success.push('✅ theme.css is properly imported in App.vue');
  } else {
    results.errors.push('❌ theme.css import missing in App.vue');
  }
}

// Check icon classes in ScanReceipt.vue
function checkIconClasses() {
  const content = readFile(files.scanReceiptVue);
  if (!content) return;
  
  const baseIconCount = countMatches(content, patterns.iconClasses.base);
  const sizeClassCount = countMatches(content, patterns.iconClasses.sizes);
  const colorClassCount = countMatches(content, patterns.iconClasses.colors);
  const specialIconCount = countMatches(content, patterns.iconClasses.specialIcons);
  
  results.success.push(`✅ Found ${baseIconCount} base icon classes in ScanReceipt.vue`);
  
  if (baseIconCount === sizeClassCount + specialIconCount) {
    results.success.push('✅ All icons have proper size classes or special icon classes');
  } else {
    results.warnings.push(`⚠️ Some icons may be missing size classes - found ${baseIconCount} icons but only ${sizeClassCount + specialIconCount} size/special classes`);
  }
  
  if (colorClassCount > 0) {
    results.success.push(`✅ Found ${colorClassCount} color classes for icons`);
  } else {
    results.warnings.push('⚠️ No icon color classes found - icons may be using default colors');
  }
}

// Check theme variables usage in components
function checkThemeVariables() {
  const content = readFile(files.receiptDisplayVue);
  if (!content) return;
  
  const colorVarCount = countMatches(content, patterns.themeVariables);
  const transitionVarCount = countMatches(content, patterns.transitions);
  const radiusVarCount = countMatches(content, patterns.radius);
  
  if (colorVarCount > 0) {
    results.success.push(`✅ Found ${colorVarCount} theme color variables in ReceiptDisplay.vue`);
  } else {
    results.errors.push('❌ No theme color variables found in ReceiptDisplay.vue');
  }
  
  if (transitionVarCount > 0) {
    results.success.push(`✅ Found ${transitionVarCount} transition variables in ReceiptDisplay.vue`);
  } else {
    results.warnings.push('⚠️ No transition variables found in ReceiptDisplay.vue');
  }
  
  if (radiusVarCount > 0) {
    results.success.push(`✅ Found ${radiusVarCount} radius variables in ReceiptDisplay.vue`);
  } else {
    results.warnings.push('⚠️ No radius variables found in ReceiptDisplay.vue');
  }
}

// Run all checks
function runStyleTests() {
  console.log('🔍 Running style tests...\n');
  
  checkAppImports();
  checkIconClasses();
  checkThemeVariables();
  
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
  console.log(`${testsPassed ? '✅' : '❌'} Style tests ${testsPassed ? 'PASSED' : 'FAILED'}`);
  console.log(`Success: ${results.success.length} | Warnings: ${results.warnings.length} | Errors: ${results.errors.length}`);
}

// Run the tests
runStyleTests();