/**
 * Tests for input sanitization utilities
 */

import { 
  sanitizeString, 
  sanitizeNumber, 
  sanitizeStore,
  sanitizeReceiptItem,
  sanitizeReceipt
} from '../utils/sanitizer';
import { Receipt, Store, ReceiptItem } from '../models/receipt';

/**
 * Test sanitization utilities
 */
export async function testSanitization(): Promise<void> {
  console.log('=== Testing Input Sanitization ===');
  
  // Test string sanitization
  testSanitizeString();
  
  // Test number sanitization
  testSanitizeNumber();
  
  // Test store sanitization
  testSanitizeStore();
  
  // Test item sanitization
  testSanitizeReceiptItem();
  
  // Test receipt sanitization
  testSanitizeReceipt();
  
  console.log('All sanitization tests PASSED');
}

/**
 * Test string sanitization
 */
function testSanitizeString(): void {
  console.log('Testing string sanitization...');
  
  // Test valid strings
  expect(sanitizeString('Hello World'), 'Hello World', 'Should preserve normal text');
  expect(sanitizeString(' Trim Me '), 'Trim Me', 'Should trim whitespace');
  
  // Test null/undefined handling
  expect(sanitizeString(null), '', 'Should handle null values');
  expect(sanitizeString(undefined), '', 'Should handle undefined values');
  
  // Test HTML sanitization
  expect(
    sanitizeString('<script>alert("XSS")</script>Hello'), 
    'Hello', 
    'Should remove script tags'
  );
  
  expect(
    sanitizeString('<b>Bold Text</b>'), 
    'Bold Text', 
    'Should remove HTML tags but preserve content'
  );
  
  console.log('String sanitization tests PASSED');
}

/**
 * Test number sanitization
 */
function testSanitizeNumber(): void {
  console.log('Testing number sanitization...');
  
  // Test valid numbers
  expect(sanitizeNumber(123), 123, 'Should preserve valid numbers');
  expect(sanitizeNumber(0), 0, 'Should handle zero');
  expect(sanitizeNumber(-5), -5, 'Should handle negative numbers');
  
  // Test string conversion
  expect(sanitizeNumber('42'), 42, 'Should convert numeric strings to numbers');
  expect(sanitizeNumber('3.14'), 3.14, 'Should handle decimal numbers');
  expect(sanitizeNumber('$9.99'), 9.99, 'Should handle currency format');
  
  // Test invalid inputs
  expect(sanitizeNumber(null), 0, 'Should handle null values');
  expect(sanitizeNumber(undefined), 0, 'Should handle undefined values');
  expect(sanitizeNumber('not a number'), 0, 'Should handle non-numeric strings');
  expect(sanitizeNumber(NaN), 0, 'Should handle NaN');
  
  // Test with custom default
  expect(sanitizeNumber(null, 10), 10, 'Should use provided default value');
  
  console.log('Number sanitization tests PASSED');
}

/**
 * Test store sanitization
 */
function testSanitizeStore(): void {
  console.log('Testing store sanitization...');
  
  // Test valid store object
  const validStore: Store = {
    name: 'Test Store',
    address: '123 Main St',
    phone: '555-123-4567',
    website: 'example.com'
  };
  
  const sanitizedStore = sanitizeStore(validStore);
  expect(sanitizedStore.name, 'Test Store', 'Should preserve valid store name');
  expect(sanitizedStore.address, '123 Main St', 'Should preserve valid address');
  
  // Test string conversion
  const stringStore = sanitizeStore('String Store');
  expect(stringStore.name, 'String Store', 'Should convert string to store object');
  
  // Test sanitizing HTML in store fields
  const storeWithHtml: Store = {
    name: '<b>Malicious</b> Store',
    address: '<script>alert("XSS");</script>123 Main St',
    website: 'javascript:alert("hack")'
  };
  
  const sanitizedHtmlStore = sanitizeStore(storeWithHtml);
  expect(sanitizedHtmlStore.name, 'Malicious Store', 'Should sanitize HTML in store name');
  expect(sanitizedHtmlStore.address, '123 Main St', 'Should sanitize HTML in address');
  
  // Test null/undefined handling
  expect(sanitizeStore(null).name, '', 'Should handle null store');
  expect(sanitizeStore(undefined).name, '', 'Should handle undefined store');
  
  console.log('Store sanitization tests PASSED');
}

/**
 * Test receipt item sanitization
 */
function testSanitizeReceiptItem(): void {
  console.log('Testing receipt item sanitization...');
  
  // Test valid item
  const validItem: Partial<ReceiptItem> = {
    name: 'Test Item',
    price: 9.99,
    quantity: 2,
    confidence: 0.8
  };
  
  const sanitizedItem = sanitizeReceiptItem(validItem);
  expect(sanitizedItem.name, 'Test Item', 'Should preserve valid item name');
  expect(sanitizedItem.price, 9.99, 'Should preserve valid price');
  expect(sanitizedItem.quantity, 2, 'Should preserve valid quantity');
  
  // Test with invalid values
  const invalidItem: Partial<ReceiptItem> = {
    name: '<script>alert("XSS")</script>Malicious Item',
    price: NaN,
    quantity: undefined,
    confidence: 2.5 // Out of range
  };
  
  const sanitizedInvalidItem = sanitizeReceiptItem(invalidItem);
  expect(sanitizedInvalidItem.name, 'Malicious Item', 'Should sanitize HTML in item name');
  expect(sanitizedInvalidItem.price, 0, 'Should replace NaN with default');
  expect(sanitizedInvalidItem.quantity, 1, 'Should use default quantity');
  expect(sanitizedInvalidItem.confidence, 1, 'Should clamp confidence to valid range');
  
  // Test minimal item
  const minimalItem: Partial<ReceiptItem> = {
    name: 'Minimal Item'
  };
  
  const sanitizedMinimalItem = sanitizeReceiptItem(minimalItem);
  expect(sanitizedMinimalItem.name, 'Minimal Item', 'Should handle minimal item');
  expect(sanitizedMinimalItem.price, 0, 'Should provide default price');
  expect(sanitizedMinimalItem.quantity, 1, 'Should provide default quantity');
  expect(sanitizedMinimalItem.confidence, 0.5, 'Should provide default confidence');
  
  console.log('Receipt item sanitization tests PASSED');
}

/**
 * Test receipt sanitization
 */
function testSanitizeReceipt(): void {
  console.log('Testing receipt sanitization...');
  
  // Test valid receipt
  const validReceipt: Partial<Receipt> = {
    userId: 'user123',
    store: { name: 'Test Store' },
    items: [
      { name: 'Item 1', price: 10.99, quantity: 1, confidence: 0.8 },
      { name: 'Item 2', price: 5.99, quantity: 2, confidence: 0.9 }
    ],
    totals: { subtotal: 22.97, tax: 1.15, total: 24.12 },
    date: new Date('2023-01-15'),
    confidence: 0.85
  };
  
  const sanitizedReceipt = sanitizeReceipt(validReceipt);
  expect(sanitizedReceipt.userId, 'user123', 'Should preserve valid userId');
  expect(sanitizedReceipt.store.name, 'Test Store', 'Should preserve valid store name');
  expect(sanitizedReceipt.items.length, 2, 'Should preserve valid items');
  expect(sanitizedReceipt.totals.total, 24.12, 'Should preserve valid total');
  
  // Test receipt with missing/invalid values
  const invalidReceipt: Partial<Receipt> = {
    userId: '<script>alert("XSS")</script>user456',
    store: 'Malicious Store<script>',
    items: [],
    date: 'Invalid Date' as any,
    confidence: 2.5 // Out of range
  };
  
  const sanitizedInvalidReceipt = sanitizeReceipt(invalidReceipt);
  expect(sanitizedInvalidReceipt.userId, 'user456', 'Should sanitize userId');
  expect(sanitizedInvalidReceipt.store.name, 'Malicious Store', 'Should sanitize store name');
  expect(sanitizedInvalidReceipt.items.length, 0, 'Should handle empty items array');
  expect(sanitizedInvalidReceipt.date instanceof Date, true, 'Should convert invalid date to valid Date object');
  expect(sanitizedInvalidReceipt.confidence, 1, 'Should clamp confidence to valid range');
  
  // Test that default totals are calculated
  expect(sanitizedInvalidReceipt.totals.subtotal, 0, 'Should provide default subtotal');
  expect(sanitizedInvalidReceipt.totals.tax, 0, 'Should provide default tax');
  expect(sanitizedInvalidReceipt.totals.total, 0, 'Should provide default total');
  
  console.log('Receipt sanitization tests PASSED');
}

/**
 * Simple expect function for testing
 * @param actual Actual value
 * @param expected Expected value
 * @param message Error message if values don't match
 */
function expect<T>(actual: T, expected: T, message: string): void {
  if (actual !== expected) {
    throw new Error(`${message}: Expected ${expected}, got ${actual}`);
  }
}

// If running directly, execute the tests
if (require.main === module) {
  testSanitization()
    .then(() => console.log('Tests completed successfully'))
    .catch(error => {
      console.error('Tests failed:', error);
      process.exit(1);
    });
}