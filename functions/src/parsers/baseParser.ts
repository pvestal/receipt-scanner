/**
 * Base parser class for receipt parsing
 * Provides the foundation for specific parsers
 */

import { ParserResult } from '../models/receipt';

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
   */
  protected calculateConfidence(data: T, errors: string[] = []): number {
    // Basic implementation - to be overridden by specific parsers
    // Error count negatively affects confidence
    const errorPenalty = errors.length * 0.1;
    
    // Default confidence level
    let confidence = 1.0;
    
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
   */
  protected formatResult(data: T, errors: string[] = []): ParserResult<T> {
    const confidence = this.calculateConfidence(data, errors);
    return {
      data,
      confidence,
      errors: errors.length > 0 ? errors : undefined
    };
  }
}