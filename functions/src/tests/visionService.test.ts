/**
 * Tests for the Vision API service
 */

import { VisionService, OcrResult } from '../services/visionService';

// Mock data for testing
const mockImageUrl = 'https://example.com/receipt.jpg';

// Mock for ImageAnnotatorClient
class MockImageAnnotatorClient {
  async annotateImage(request: any): Promise<any> {
    // Return mock OCR data
    return [{
      fullTextAnnotation: {
        text: `
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
        pages: [
          {
            blocks: [
              {
                boundingBox: { vertices: [{ x: 100, y: 50 }, { x: 400, y: 50 }, { x: 400, y: 130 }, { x: 100, y: 130 }] },
                paragraphs: [{ words: [] }],
                confidence: 0.98,
                text: 'WALMART\n123 Main Street, Anytown\nTel: (555) 123-4567\nwww.walmart.com'
              },
              {
                boundingBox: { vertices: [{ x: 100, y: 150 }, { x: 300, y: 150 }, { x: 300, y: 170 }, { x: 100, y: 170 }] },
                paragraphs: [{ words: [] }],
                confidence: 0.95,
                text: '01/15/2023 10:25 AM'
              },
              {
                boundingBox: { vertices: [{ x: 100, y: 200 }, { x: 400, y: 200 }, { x: 400, y: 350 }, { x: 100, y: 350 }] },
                paragraphs: [{ words: [] }],
                confidence: 0.9,
                text: 'Apple                  $2.99\nBananas 2 @ $0.59     $1.18\nMilk 1 Gallon         $3.49\nBread                  $2.29\nEggs 12ct             $3.99'
              },
              {
                boundingBox: { vertices: [{ x: 100, y: 380 }, { x: 400, y: 380 }, { x: 400, y: 440 }, { x: 100, y: 440 }] },
                paragraphs: [{ words: [] }],
                confidence: 0.92,
                text: 'Subtotal              $13.94\nTax (6%)               $0.84\nTotal                 $14.78'
              },
              {
                boundingBox: { vertices: [{ x: 100, y: 460 }, { x: 400, y: 460 }, { x: 400, y: 520 }, { x: 100, y: 520 }] },
                paragraphs: [{ words: [] }],
                confidence: 0.95,
                text: 'PAID\nVISA ************1234\nTHANK YOU FOR SHOPPING WITH US'
              }
            ],
            property: {
              detectedLanguages: [{ languageCode: 'en' }]
            }
          }
        ]
      },
      textAnnotations: [
        {
          description: `WALMART
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
THANK YOU FOR SHOPPING WITH US`,
          boundingPoly: { vertices: [{ x: 100, y: 50 }, { x: 400, y: 50 }, { x: 400, y: 520 }, { x: 100, y: 520 }] },
          confidence: 0.92
        }
      ]
    }];
  }
  
  async textDetection(imageSource: any): Promise<any> {
    return [
      {
        textAnnotations: [
          {
            description: `WALMART
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
THANK YOU FOR SHOPPING WITH US`,
            boundingPoly: { vertices: [{ x: 100, y: 50 }, { x: 400, y: 50 }, { x: 400, y: 520 }, { x: 100, y: 520 }] }
          }
        ]
      }
    ];
  }
}

// Create a subclass of VisionService that uses the mock client
class TestVisionService extends VisionService {
  constructor() {
    super();
    // @ts-ignore - Override the client with our mock
    this.client = new MockImageAnnotatorClient();
  }
  
  // Override the downloadImage method to avoid actual downloads
  protected async downloadImage(imageUrl: string): Promise<Buffer> {
    return Buffer.from('mock image data');
  }
}

/**
 * Test the Vision API service
 */
export async function testVisionService(): Promise<void> {
  console.log('=== Testing Vision Service ===');
  
  // Create test service instance
  const visionService = new TestVisionService();
  
  console.log('Testing text extraction...');
  
  try {
    // Test basic text extraction
    const basicResult = await visionService.extractTextFromImage(mockImageUrl);
    validateOcrResult(basicResult, 'Basic text extraction');
    
    // Test enhanced receipt processing
    console.log('Testing receipt processing...');
    const receiptResult = await visionService.processReceiptImage(mockImageUrl);
    validateOcrResult(receiptResult, 'Enhanced receipt processing');
    
    // Validate that receipt processing extracted structured data
    if (!receiptResult.blocks || receiptResult.blocks.length === 0) {
      throw new Error('Receipt processing should extract structured text blocks');
    }
    
    console.log('Vision service tests PASSED');
  } catch (error) {
    console.error('Vision service tests FAILED:', error);
    throw error;
  }
}

/**
 * Validate an OCR result
 * @param result OCR result to validate
 * @param testName Name of the test for logging
 */
function validateOcrResult(result: OcrResult, testName: string): void {
  console.log(`Validating result for "${testName}"...`);
  
  // Check that text was extracted
  if (!result.text) {
    throw new Error(`${testName}: No text extracted`);
  }
  
  // Check that confidence score is present
  if (typeof result.confidence !== 'number') {
    throw new Error(`${testName}: Missing confidence score`);
  }
  
  // Check that text contains expected content
  if (!result.text.includes('WALMART') || !result.text.includes('$14.78')) {
    throw new Error(`${testName}: Text doesn't contain expected content`);
  }
  
  console.log(`${testName} validation PASSED`);
}

// If running directly, execute the tests
if (require.main === module) {
  testVisionService()
    .then(() => console.log('Tests completed successfully'))
    .catch(error => {
      console.error('Tests failed:', error);
      process.exit(1);
    });
}