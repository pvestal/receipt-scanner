/**
 * Tests for template detection functionality
 */

import { AdvancedTemplateMatcher, TemplateMatchResult } from '../parsers/advancedTemplateMatcher';
import { createInitialTemplates } from '../parsers/templateMatcher';
import { ReceiptTemplate } from '../models/receipt';
import { TextBlock } from '../services/visionService';

// Sample receipt texts for different stores
const sampleReceipts = {
  walmart: `
WALMART
123 Main Street, Anytown
Tel: (555) 123-4567
www.walmart.com

01/15/2023 10:25 AM

Apple                  $2.99
Bananas 2 @ $0.59     $1.18
Milk 1 Gallon         $3.49
Bread                  $2.29
Eggs 12ct             $3.99

Subtotal              $13.94
Tax (6%)               $0.84
Total                 $14.78

PAID
VISA ************1234
THANK YOU FOR SHOPPING WITH US
`,
  target: `
TARGET
Expect More. Pay Less.
456 Market St, Somewhere
Tel: (555) 987-6543

05/20/2023 3:45 PM
Trans #: 7890123

Cereal                 $4.29
Coffee                $11.99
Shampoo                $3.79
Paper Towels           $6.49

SUBTOTAL              $26.56
SALES TAX (7.5%)       $1.99
TOTAL                 $28.55

THANK YOU FOR SHOPPING AT TARGET
`,
  costco: `
COSTCO WHOLESALE
789 Warehouse Ave.
Big City, ST 12345

MEMBERSHIP # 1234567890
03/10/2023 11:30 AM

3 PAPER TOWELS 24PK    $19.99
BANANAS 3LBS            $1.99
ROTISSERIE CHICKEN      $4.99
KIRKLAND WATER 40PK    $3.99
GROUND BEEF 5LB        $21.99

SUBTOTAL               $52.95
TAX                     $4.24
TOTAL                  $57.19

*** MEMBER SAVINGS: $12.50 ***

XXXXXXXXXXXX5678 VISA
TOTAL PAYMENT          $57.19

WAREHOUSE #123 REGISTER #7 CASHIER #456
`
};

// Mock text blocks
const mockTextBlocks: Record<string, TextBlock[]> = {
  walmart: [
    { text: 'WALMART', confidence: 0.95, boundingBox: { x: 10, y: 10, width: 100, height: 20 }, paragraphs: [] },
    { text: 'Subtotal $13.94', confidence: 0.9, boundingBox: { x: 10, y: 200, width: 150, height: 20 }, paragraphs: [] },
    { text: 'Total $14.78', confidence: 0.92, boundingBox: { x: 10, y: 240, width: 150, height: 20 }, paragraphs: [] }
  ],
  target: [
    { text: 'TARGET\nExpect More. Pay Less.', confidence: 0.95, boundingBox: { x: 10, y: 10, width: 200, height: 30 }, paragraphs: [] },
    { text: 'SUBTOTAL $26.56', confidence: 0.9, boundingBox: { x: 10, y: 200, width: 150, height: 20 }, paragraphs: [] },
    { text: 'TOTAL $28.55', confidence: 0.92, boundingBox: { x: 10, y: 240, width: 150, height: 20 }, paragraphs: [] }
  ],
  costco: [
    { text: 'COSTCO WHOLESALE', confidence: 0.95, boundingBox: { x: 10, y: 10, width: 200, height: 20 }, paragraphs: [] },
    { text: 'SUBTOTAL $52.95', confidence: 0.9, boundingBox: { x: 10, y: 200, width: 150, height: 20 }, paragraphs: [] },
    { text: 'TOTAL $57.19', confidence: 0.92, boundingBox: { x: 10, y: 240, width: 150, height: 20 }, paragraphs: [] }
  ]
};

/**
 * Test the template detection functionality
 */
export async function testTemplateDetection(): Promise<void> {
  console.log('=== Testing Template Detection ===');
  
  // Test with default templates
  await testDefaultTemplates();
  
  // Test with custom templates
  await testCustomTemplates();
  
  // Test edge cases
  await testEdgeCases();
  
  console.log('All template detection tests PASSED');
}

/**
 * Test matching with default templates
 */
async function testDefaultTemplates(): Promise<void> {
  console.log('Testing default templates...');
  
  // Create matcher with default templates
  const templates = createInitialTemplates();
  const matcher = new AdvancedTemplateMatcher(templates);
  
  // Test Walmart receipt
  const walmartMatch = matcher.findBestMatch(sampleReceipts.walmart, mockTextBlocks.walmart);
  expectMatch(walmartMatch, 'walmart', 'Walmart');
  
  // Test Target receipt
  const targetMatch = matcher.findBestMatch(sampleReceipts.target, mockTextBlocks.target);
  expectMatch(targetMatch, 'target', 'Target');
  
  // Test Costco receipt
  const costcoMatch = matcher.findBestMatch(sampleReceipts.costco, mockTextBlocks.costco);
  expectMatch(costcoMatch, 'costco', 'Costco');
  
  console.log('Default template tests PASSED');
}

/**
 * Test matching with custom templates
 */
async function testCustomTemplates(): Promise<void> {
  console.log('Testing custom templates...');
  
  // Create custom templates
  const customTemplates: ReceiptTemplate[] = [
    {
      storeId: 'custom-store',
      storeName: 'Custom Store',
      storePatterns: ['Custom Store'],
      itemPatterns: ['.+\\s+\\d+\\.\\d{2}'],
      totalsPatterns: {
        subtotal: 'subtotal',
        tax: 'tax',
        total: 'total'
      },
      datePatterns: ['\\d{2}/\\d{2}/\\d{4}']
    }
  ];
  
  // Custom receipt text
  const customReceipt = `
Custom Store
123 Special Ave.

04/15/2023

Item A                 $5.99
Item B                 $7.99

Subtotal              $13.98
Tax                    $1.02
Total                 $15.00
`;

  // Custom text blocks
  const customBlocks: TextBlock[] = [
    { text: 'Custom Store', confidence: 0.95, boundingBox: { x: 10, y: 10, width: 100, height: 20 }, paragraphs: [] },
    { text: 'Subtotal $13.98', confidence: 0.9, boundingBox: { x: 10, y: 100, width: 150, height: 20 }, paragraphs: [] },
    { text: 'Total $15.00', confidence: 0.92, boundingBox: { x: 10, y: 140, width: 150, height: 20 }, paragraphs: [] }
  ];
  
  // Create matcher with custom templates
  const matcher = new AdvancedTemplateMatcher(customTemplates);
  
  // Test custom receipt
  const customMatch = matcher.findBestMatch(customReceipt, customBlocks);
  expectMatch(customMatch, 'custom-store', 'Custom Store');
  
  // Test that it doesn't match standard receipts
  const walmartMatch = matcher.findBestMatch(sampleReceipts.walmart, mockTextBlocks.walmart);
  if (walmartMatch && walmartMatch.template.storeId === 'custom-store') {
    throw new Error('Custom template incorrectly matched Walmart receipt');
  }
  
  console.log('Custom template tests PASSED');
}

/**
 * Test edge cases and error handling
 */
async function testEdgeCases(): Promise<void> {
  console.log('Testing edge cases...');
  
  // Create matcher with default templates
  const templates = createInitialTemplates();
  const matcher = new AdvancedTemplateMatcher(templates);
  
  // Test empty text
  const emptyMatch = matcher.findBestMatch('', []);
  if (emptyMatch) {
    throw new Error('Empty text should not match any template');
  }
  
  // Test very short text
  const shortTextMatch = matcher.findBestMatch('Short text', []);
  if (shortTextMatch && shortTextMatch.confidence > 0.5) {
    throw new Error('Very short text should have low confidence');
  }
  
  // Test text without any store identification
  const noStoreMatch = matcher.findBestMatch('This is a random text with no store information', []);
  if (noStoreMatch && noStoreMatch.confidence > 0.5) {
    throw new Error('Text without store info should have low confidence');
  }
  
  // Test with invalid regex pattern
  // Create a template with an invalid pattern
  const badTemplate: ReceiptTemplate = {
    storeId: 'bad-template',
    storeName: 'Bad Template',
    storePatterns: ['[invalid regex'],
    itemPatterns: [],
    totalsPatterns: {
      total: 'total'
    },
    datePatterns: []
  };
  
  const badMatcher = new AdvancedTemplateMatcher([...templates, badTemplate]);
  
  // This shouldn't crash, it should gracefully handle the invalid pattern
  const shouldStillWork = badMatcher.findBestMatch(sampleReceipts.walmart, mockTextBlocks.walmart);
  expectMatch(shouldStillWork, 'walmart', 'Walmart');
  
  console.log('Edge case tests PASSED');
}

/**
 * Helper to validate a template match
 * @param match Template match result
 * @param expectedStoreId Expected store ID
 * @param expectedStoreName Expected store name
 */
function expectMatch(
  match: TemplateMatchResult | null,
  expectedStoreId: string,
  expectedStoreName: string
): void {
  if (!match) {
    throw new Error(`Expected match for ${expectedStoreName} but got no match`);
  }
  
  if (match.template.storeId !== expectedStoreId) {
    throw new Error(`Expected storeId ${expectedStoreId} but got ${match.template.storeId}`);
  }
  
  if (match.template.storeName !== expectedStoreName) {
    throw new Error(`Expected storeName ${expectedStoreName} but got ${match.template.storeName}`);
  }
  
  if (match.confidence < 0.5) {
    throw new Error(`Match confidence is too low: ${match.confidence.toFixed(2)}`);
  }
  
  console.log(`✓ Successfully matched ${expectedStoreName} with confidence ${match.confidence.toFixed(2)}`);
}

// If running directly, execute the tests
if (require.main === module) {
  testTemplateDetection()
    .then(() => console.log('Tests completed successfully'))
    .catch(error => {
      console.error('Tests failed:', error);
      process.exit(1);
    });
}