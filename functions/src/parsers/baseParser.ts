/**
 * Base parser class for receipt parsing
 * Provides the foundation for specific parsers
 */

import { ParserResult } from '../models/receipt';
import { TextBlock } from '../services/visionService';

/**
 * OCR context for parsing
 */
export interface OcrContext {
  ocrConfidence?: number;
  textBlocks?: TextBlock[];
  boundingBoxes?: Array<{
    text: string;
    box: { x: number; y: number; width: number; height: number };
  }>;
}

/**
 * Interface for all parsers to implement
 */
export interface Parser<T> {
  /**
   * Parse text and return result with confidence score
   * @param text Text to parse
   * @param context Optional additional context for parsing
   */
  parse(text: string, context?: Record<string, any>): Promise<ParserResult<T>>;
}

/**
 * Base abstract class for parsers
 */
export abstract class BaseParser<T> implements Parser<T> {
  /**
   * Parse text and return result with confidence score
   * @param text Text to parse
   * @param context Optional additional context for parsing
   */
  abstract parse(text: string, context?: Record<string, any>): Promise<ParserResult<T>>;

  /**
   * Calculate confidence score based on parsed data
   * @param data Parsed data
   * @param errors Any errors that occurred during parsing
   * @param context Optional parsing context with OCR confidence
   */
  protected calculateConfidence(
    data: T, 
    errors: string[] = [], 
    context?: Record<string, any>
  ): number {
    // Basic implementation - to be overridden by specific parsers
    // Error count negatively affects confidence
    const errorPenalty = errors.length * 0.1;
    
    // Default confidence level
    let confidence = 1.0;
    
    // If we have OCR confidence from the context, factor it in
    if (context?.ocrConfidence !== undefined) {
      // OCR confidence should be weighted heavily
      confidence = context.ocrConfidence * 0.7 + 0.3;
    }
    
    // Reduce confidence based on errors
    confidence = Math.max(0, confidence - errorPenalty);
    
    return confidence;
  }

  /**
   * Clean up text for parsing
   * @param text Text to clean
   */
  protected cleanText(text: string): string {
    // Remove excess whitespace
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Format the result with calculated confidence
   * @param data Parsed data
   * @param errors Any errors that occurred
   * @param context Optional parsing context
   */
  protected formatResult(
    data: T, 
    errors: string[] = [], 
    context?: Record<string, any>
  ): ParserResult<T> {
    const confidence = this.calculateConfidence(data, errors, context);
    return {
      data,
      confidence,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Find text blocks in a specific region based on coordinates
   * @param blocks Text blocks from OCR
   * @param region Region to search in {top, left, bottom, right}
   * @returns Text blocks in the region, sorted top to bottom
   */
  protected findBlocksInRegion(
    blocks: TextBlock[] = [],
    region: { top: number; left: number; bottom: number; right: number }
  ): TextBlock[] {
    return blocks
      .filter(block => {
        const box = block.boundingBox;
        // Check if the block is within or overlaps the region
        return (
          box.x < region.right &&
          box.x + box.width > region.left &&
          box.y < region.bottom &&
          box.y + box.height > region.top
        );
      })
      // Sort blocks by vertical position (top to bottom)
      .sort((a, b) => a.boundingBox.y - b.boundingBox.y);
  }
  
  /**
   * Extract text from a specific region
   * @param blocks Text blocks from OCR
   * @param region Region to extract from {top, left, bottom, right}
   * @returns Extracted text
   */
  protected extractTextFromRegion(
    blocks: TextBlock[] = [],
    region: { top: number; left: number; bottom: number; right: number }
  ): string {
    const blocksInRegion = this.findBlocksInRegion(blocks, region);
    return blocksInRegion.map(block => block.text).join('\n');
  }
}