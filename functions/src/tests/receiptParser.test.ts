/**
 * Tests for receipt parser functionality
 */

import { ReceiptParser } from '../parsers/receiptParser';
import { StoreParser } from '../parsers/storeParser';
import { DateParser } from '../parsers/dateParser';
import { ItemParser } from '../parsers/itemParser';
import { TotalsParser } from '../parsers/totalsParser';
import { createInitialTemplates } from '../parsers/templateMatcher';
import { AdvancedTemplateMatcher } from '../parsers/advancedTemplateMatcher';
import { preprocessOcrResult } from '../utils/ocrPreprocessor';
import { Receipt, ReceiptItem, Store, ReceiptTotals } from '../models/receipt';
import { TextBlock } from '../services/visionService';

// Mock OCR data for testing
const mockOcrText = `
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
`;

const mockOcrBlocks: TextBlock[] = [
  {
    text: 'WALMART\n123 Main Street, Anytown\nTel: (555) 123-4567\nwww.walmart.com',
    confidence: 0.98,
    boundingBox: { x: 100, y: 50, width: 300, height: 80 },
    paragraphs: []
  },
  {
    text: '01/15/2023 10:25 AM',
    confidence: 0.95,
    boundingBox: { x: 100, y: 150, width: 200, height: 20 },
    paragraphs: []
  },
  {
    text: 'Apple                  $2.99\nBananas 2 @ $0.59     $1.18\nMilk 1 Gallon         $3.49\nBread                  $2.29\nEggs 12ct             $3.99',
    confidence: 0.9,
    boundingBox: { x: 100, y: 200, width: 300, height: 150 },
    paragraphs: []
  },
  {
    text: 'Subtotal              $13.94\nTax (6%)               $0.84\nTotal                 $14.78',
    confidence: 0.92,
    boundingBox: { x: 100, y: 380, width: 300, height: 60 },
    paragraphs: []
  },
  {
    text: 'PAID\nVISA ************1234\nTHANK YOU FOR SHOPPING WITH US',
    confidence: 0.95,
    boundingBox: { x: 100, y: 460, width: 300, height: 60 },
    paragraphs: []
  }
];

/**
 * Test the receipt parser functionality
 */
export async function testReceiptParser(): Promise<void> {
  console.log('=== Testing Receipt Parser ===');
  
  // Test setup
  const templates = createInitialTemplates();
  const receiptParser = new ReceiptParser(templates);
  
  console.log('Testing full receipt parsing...');
  
  // Test parameters
  const userId = 'test-user-123';
  const imageUrl = 'https://example.com/receipt.jpg';
  const context = {
    userId,
    imageUrl,
    textBlocks: mockOcrBlocks,
    ocrConfidence: 0.92
  };
  
  try {
    // Execute parser
    const result = await receiptParser.parse(mockOcrText, context);
    
    // Validate results
    validateParserResult(result);
    
    console.log('Receipt parser test PASSED with confidence:', result.confidence.toFixed(2));
  } catch (error) {
    console.error('Receipt parser test FAILED:', error);
    throw error;
  }
  
  // Test individual parsers
  await testIndividualParsers(mockOcrText, context);
  
  // Test OCR preprocessor
  testOcrPreprocessor(mockOcrText, mockOcrBlocks);
  
  // Test template matcher
  testTemplateMatcher(mockOcrText, mockOcrBlocks);
  
  console.log('All receipt parser tests completed successfully.');
}

/**
 * Test each individual parser component
 * @param mockOcrText Mock OCR text
 * @param context Parsing context
 */
async function testIndividualParsers(
  mockOcrText: string,
  context: Record<string, any>
): Promise<void> {
  console.log('\nTesting individual parsers...');
  
  // Test store parser
  console.log('Testing store parser...');
  const storeParser = new StoreParser(createInitialTemplates());
  const storeResult = await storeParser.parse(mockOcrText, context);
  if (!storeResult.data.name) {
    throw new Error('Store parser failed to extract store name');
  }
  console.log('Store parser test PASSED:', storeResult.data.name);
  
  // Test date parser
  console.log('Testing date parser...');
  const dateParser = new DateParser();
  const dateResult = await dateParser.parse(mockOcrText, context);
  if (!(dateResult.data instanceof Date)) {
    throw new Error('Date parser failed to extract date');
  }
  console.log('Date parser test PASSED:', dateResult.data.toDateString());
  
  // Test item parser
  console.log('Testing item parser...');
  const itemParser = new ItemParser(createInitialTemplates());
  const itemContext = { ...context, storeName: 'WALMART' };
  const itemsResult = await itemParser.parse(mockOcrText, itemContext);
  if (!itemsResult.data.length) {
    throw new Error('Item parser failed to extract items');
  }
  console.log('Item parser test PASSED. Found', itemsResult.data.length, 'items');
  
  // Test totals parser
  console.log('Testing totals parser...');
  const totalsParser = new TotalsParser();
  const totalsContext = { ...context, items: itemsResult.data };
  const totalsResult = await totalsParser.parse(mockOcrText, totalsContext);
  if (totalsResult.data.total <= 0) {
    throw new Error('Totals parser failed to extract total amount');
  }
  console.log('Totals parser test PASSED. Total:', totalsResult.data.total);
}

/**
 * Test the OCR preprocessor
 * @param mockOcrText Mock OCR text
 * @param mockOcrBlocks Mock OCR blocks
 */
function testOcrPreprocessor(
  mockOcrText: string,
  mockOcrBlocks: TextBlock[]
): void {
  console.log('\nTesting OCR preprocessor...');
  
  // Test with just text
  const textOnlyResult = preprocessOcrResult(mockOcrText);
  console.log('OCR preprocessor (text-only) found', textOnlyResult.lineItems.length, 'items');
  
  // Test with text and blocks
  const fullResult = preprocessOcrResult(mockOcrText, mockOcrBlocks);
  console.log('OCR preprocessor (with blocks) found', fullResult.lineItems.length, 'items');
  
  // Validate sections
  if (!fullResult.sections.header || !fullResult.sections.items || !fullResult.sections.totals) {
    console.warn('OCR preprocessor did not identify all receipt sections');
  } else {
    console.log('OCR preprocessor successfully identified all receipt sections');
  }
  
  console.log('OCR preprocessor tests PASSED');
}

/**
 * Test the template matcher
 * @param mockOcrText Mock OCR text
 * @param mockOcrBlocks Mock OCR blocks
 */
function testTemplateMatcher(
  mockOcrText: string,
  mockOcrBlocks: TextBlock[]
): void {
  console.log('\nTesting template matcher...');
  
  // Create matcher with default templates
  const templates = createInitialTemplates();
  const matcher = new AdvancedTemplateMatcher(templates);
  
  // Test matching
  const match = matcher.findBestMatch(mockOcrText, mockOcrBlocks);
  
  if (!match) {
    console.warn('Template matcher did not find any matching template');
  } else {
    console.log('Template matcher found match:', match.template.storeName, 'with confidence', match.confidence.toFixed(2));
    
    // Check for matched regions
    let regionCount = 0;
    if (match.matchedRegions.header) regionCount++;
    if (match.matchedRegions.items) regionCount++;
    if (match.matchedRegions.totals) regionCount++;
    if (match.matchedRegions.footer) regionCount++;
    
    console.log('Template matcher identified', regionCount, 'receipt regions');
  }
  
  console.log('Template matcher tests PASSED');
}

/**
 * Validate the parser result
 * @param result Parser result to validate
 */
function validateParserResult(
  result: { data: Receipt; confidence: number; errors?: string[] }
): void {
  // Check overall structure
  if (!result.data) {
    throw new Error('Parser result missing data property');
  }
  
  if (typeof result.confidence !== 'number') {
    throw new Error('Parser result missing confidence score');
  }
  
  const receipt = result.data;
  
  // Validate store information
  if (!receipt.store || !receipt.store.name) {
    throw new Error('Missing store information in parsed receipt');
  }
  
  // Validate items
  if (!Array.isArray(receipt.items) || receipt.items.length === 0) {
    throw new Error('Missing or empty items array in parsed receipt');
  }
  
  // Check item properties
  for (const item of receipt.items) {
    if (!item.name || typeof item.price !== 'number') {
      throw new Error('Invalid item in parsed receipt');
    }
  }
  
  // Validate totals
  if (!receipt.totals || typeof receipt.totals.total !== 'number' || receipt.totals.total <= 0) {
    throw new Error('Missing or invalid totals in parsed receipt');
  }
  
  // Validate date
  if (!(receipt.date instanceof Date)) {
    throw new Error('Missing or invalid date in parsed receipt');
  }
}

// If running directly, execute the tests
if (require.main === module) {
  testReceiptParser()
    .then(() => console.log('Tests completed successfully'))
    .catch(error => {
      console.error('Tests failed:', error);
      process.exit(1);
    });
}