/**
 * Google Cloud Vision API service for OCR and image analysis
 */

import { ImageAnnotatorClient } from '@google-cloud/vision';
import * as admin from 'firebase-admin';

/**
 * Result from OCR text detection
 */
export interface OcrResult {
  text: string;
  confidence: number;
  blocks?: TextBlock[];
  language?: string;
}

/**
 * Text block with position information
 */
export interface TextBlock {
  text: string;
  confidence: number;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  paragraphs: TextParagraph[];
}

/**
 * Text paragraph within a block
 */
export interface TextParagraph {
  text: string;
  confidence: number;
  words: TextWord[];
}

/**
 * Word with detailed information
 */
export interface TextWord {
  text: string;
  confidence: number;
  symbols: TextSymbol[];
}

/**
 * Character/symbol in a word
 */
export interface TextSymbol {
  text: string;
  confidence: number;
}

/**
 * Service for image processing with Google Cloud Vision API
 */
export class VisionService {
  private client: ImageAnnotatorClient;
  
  /**
   * Initialize the Vision API client
   */
  constructor() {
    // Initialize the client - credentials are loaded from environment
    // or the default service account if running on Google Cloud
    this.client = new ImageAnnotatorClient();
  }
  
  /**
   * Process an image to extract text using OCR
   * @param imageUrl URL of the image to process
   * @param options Additional processing options
   * @returns OCR result with text and confidence
   */
  async extractTextFromImage(
    imageUrl: string,
    options: { 
      language?: string; 
      enhancedModel?: boolean;
      extractStructure?: boolean;
    } = {}
  ): Promise<OcrResult> {
    try {
      // Configure features to request from the Vision API
      const features = [
        { type: 'TEXT_DETECTION' as const },
        { type: 'DOCUMENT_TEXT_DETECTION' as const }
      ];
      
      if (options.enhancedModel) {
        // Request additional image properties if needed
        features.push({ type: 'IMAGE_PROPERTIES' as const });
      }
      
      let imageSource: {imageUri?: string; content?: string} = { imageUri: imageUrl };
      
      // Check if we need to download the image first (for some processing options)
      if (imageUrl.startsWith('gs://') || (options.enhancedModel && !imageUrl.startsWith('http'))) {
        // If the image is in Cloud Storage, or we need the raw content,
        // download it and use the content directly
        const imageBuffer = await this.downloadImage(imageUrl);
        imageSource = { content: imageBuffer.toString('base64') };
      }
      
      // Use Cloud Vision API to detect text in the image
      const [result] = await this.client.annotateImage({
        image: imageSource,
        features,
        imageContext: options.language ? {
          languageHints: [options.language]
        } : undefined
      });
      
      // Handle errors
      if (result.error) {
        throw new Error(`Vision API error: ${result.error.message}`);
      }
      
      // Extract results
      const fullTextAnnotation = result.fullTextAnnotation;
      const textAnnotations = result.textAnnotations || [];
      
      if (!fullTextAnnotation && (!textAnnotations || textAnnotations.length === 0)) {
        return {
          text: '',
          confidence: 0,
          blocks: []
        };
      }
      
      // Use full text annotation if available (more detailed)
      if (fullTextAnnotation) {
        // Extract structured text if requested
        const blocks = options.extractStructure ? this.extractTextBlocks(fullTextAnnotation) : undefined;
        
        // Calculate average confidence across all pages
        const confidence = fullTextAnnotation.pages?.reduce((sum, page) => {
          const pageConfidence = page.blocks?.reduce((blockSum, block) => {
            return blockSum + (block.confidence || 0);
          }, 0) || 0;
          
          return sum + (page.blocks?.length ? pageConfidence / page.blocks.length : 0);
        }, 0) || 0;
        
        const avgConfidence = fullTextAnnotation.pages?.length 
          ? confidence / fullTextAnnotation.pages.length 
          : 0;
        
        return {
          text: fullTextAnnotation.text || '',
          confidence: avgConfidence,
          blocks,
          language: fullTextAnnotation.pages?.[0]?.property?.detectedLanguages?.[0]?.languageCode
        };
      }
      
      // Fallback to simple text annotations
      return {
        text: textAnnotations[0]?.description || '',
        confidence: textAnnotations[0]?.confidence || 0
      };
    } catch (error) {
      console.error('Error in Vision API text extraction:', error);
      throw error;
    }
  }
  
  /**
   * Process a receipt image to enhance OCR accuracy
   * @param imageUrl URL of the receipt image
   * @returns Enhanced OCR result
   */
  async processReceiptImage(imageUrl: string): Promise<OcrResult> {
    try {
      // Process with optimizations specific to receipts
      // 1. Use document text detection (better for printed text)
      // 2. Extract structure for better parsing
      // 3. Use enhanced model for better quality
      return this.extractTextFromImage(imageUrl, {
        enhancedModel: true,
        extractStructure: true
      });
    } catch (error) {
      console.error('Error processing receipt image:', error);
      throw error;
    }
  }
  
  /**
   * Extract text blocks from full text annotation
   * @param annotation Full text annotation from Vision API
   * @returns Structured text blocks
   */
  private extractTextBlocks(annotation: any): TextBlock[] {
    if (!annotation.pages || annotation.pages.length === 0) {
      return [];
    }
    
    // Process all pages
    const blocks: TextBlock[] = [];
    
    for (const page of annotation.pages) {
      if (!page.blocks) continue;
      
      for (const block of page.blocks) {
        // Extract bounding box
        const boundingBox = this.extractBoundingBox(block.boundingBox);
        
        // Extract paragraphs
        const paragraphs: TextParagraph[] = [];
        
        for (const paragraph of (block.paragraphs || [])) {
          const words: TextWord[] = [];
          
          // Extract words
          for (const word of (paragraph.words || [])) {
            const symbols: TextSymbol[] = [];
            
            // Extract symbols (characters)
            for (const symbol of (word.symbols || [])) {
              symbols.push({
                text: symbol.text || '',
                confidence: symbol.confidence || 0
              });
            }
            
            // Combine symbols into word
            const wordText = symbols.map(s => s.text).join('');
            words.push({
              text: wordText,
              confidence: word.confidence || 0,
              symbols
            });
          }
          
          // Combine words into paragraph
          const paragraphText = words.map(w => w.text).join(' ');
          paragraphs.push({
            text: paragraphText,
            confidence: paragraph.confidence || 0,
            words
          });
        }
        
        // Combine paragraphs into block
        const blockText = paragraphs.map(p => p.text).join('\n');
        blocks.push({
          text: blockText,
          confidence: block.confidence || 0,
          boundingBox,
          paragraphs
        });
      }
    }
    
    return blocks;
  }
  
  /**
   * Extract bounding box from Vision API format
   * @param boundingBox Bounding box from Vision API
   * @returns Simplified bounding box
   */
  private extractBoundingBox(boundingBox: any): TextBlock['boundingBox'] {
    if (!boundingBox || !boundingBox.vertices || boundingBox.vertices.length < 4) {
      return { x: 0, y: 0, width: 0, height: 0 };
    }
    
    // Get vertices
    const vertices = boundingBox.vertices;
    
    // Calculate dimensions
    const minX = Math.min(...vertices.map((v: any) => v.x || 0));
    const maxX = Math.max(...vertices.map((v: any) => v.x || 0));
    const minY = Math.min(...vertices.map((v: any) => v.y || 0));
    const maxY = Math.max(...vertices.map((v: any) => v.y || 0));
    
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  /**
   * Download an image from a URL or Cloud Storage
   * @param imageUrl URL of the image (http://, https://, or gs://)
   * @returns Image buffer
   */
  private async downloadImage(imageUrl: string): Promise<Buffer> {
    if (imageUrl.startsWith('gs://')) {
      // Download from Cloud Storage
      const storage = admin.storage();
      const match = imageUrl.match(/gs:\/\/([^\/]+)\/(.+)/);
      
      if (!match) {
        throw new Error(`Invalid Cloud Storage URL: ${imageUrl}`);
      }
      
      const [, bucketName, filePath] = match;
      const bucket = storage.bucket(bucketName);
      const file = bucket.file(filePath);
      
      const [buffer] = await file.download();
      return buffer;
    } else if (imageUrl.startsWith('http')) {
      // Download from HTTP URL
      const response = await fetch(imageUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download image: ${response.statusText}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      return Buffer.from(arrayBuffer);
    } else {
      throw new Error(`Unsupported image URL format: ${imageUrl}`);
    }
  }
}

// Export a singleton instance
export const visionService = new VisionService();