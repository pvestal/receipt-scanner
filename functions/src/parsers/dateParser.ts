/**
 * Date parser for extracting receipt dates
 */

import { BaseParser } from './baseParser';
import { ParserResult } from '../models/receipt';

/**
 * Parser for extracting the date from receipt text
 */
export class DateParser extends BaseParser<Date> {
  // Common date formats to try
  private dateFormats = [
    // MM/DD/YYYY
    /(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2}|\d{2})/,
    // DD/MM/YYYY
    /(\d{1,2})[\/-](\d{1,2})[\/-](20\d{2}|\d{2})/,
    // YYYY/MM/DD
    /(20\d{2}|\d{2})[\/-](\d{1,2})[\/-](\d{1,2})/,
    // Month DD, YYYY
    /(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.,\s]+(\d{1,2})(?:st|nd|rd|th)?[.,\s]+(20\d{2}|\d{2})/i,
    // DD Month YYYY
    /(\d{1,2})(?:st|nd|rd|th)?[.,\s]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[.,\s]+(20\d{2}|\d{2})/i,
  ];

  // Map of month names to their numeric values
  private monthMap: { [key: string]: number } = {
    'jan': 0, 'january': 0,
    'feb': 1, 'february': 1,
    'mar': 2, 'march': 2,
    'apr': 3, 'april': 3,
    'may': 4,
    'jun': 5, 'june': 5,
    'jul': 6, 'july': 6,
    'aug': 7, 'august': 7,
    'sep': 8, 'september': 8,
    'oct': 9, 'october': 9,
    'nov': 10, 'november': 10,
    'dec': 11, 'december': 11
  };

  /**
   * Parse text to extract date
   * @param text Receipt text content
   * @param context Additional parsing context
   */
  async parse(text: string, context?: Record<string, any>): Promise<ParserResult<Date>> {
    const errors: string[] = [];
    const cleanedText = this.cleanText(text);
    
    let receiptDate: Date = new Date(); // Default to current date if parsing fails
    let confidence = 0.5; // Default confidence
    
    try {
      // First look for date with context labels
      const labeledDate = this.findDateWithLabel(cleanedText);
      
      if (labeledDate) {
        receiptDate = labeledDate;
        confidence = 0.9; // High confidence when found with label
      } else {
        // Try all date formats on each line
        const lines = cleanedText.split('\n');
        let found = false;
        
        for (const line of lines) {
          const parsedDate = this.parseLineForDate(line);
          if (parsedDate) {
            receiptDate = parsedDate;
            confidence = 0.8; // Good confidence for pattern match
            found = true;
            break;
          }
        }
        
        if (!found) {
          // If still not found, try looking for dates anywhere in the text
          const generalDate = this.extractDateFromText(cleanedText);
          if (generalDate) {
            receiptDate = generalDate;
            confidence = 0.7; // Lower confidence for general extraction
          } else {
            errors.push('No date found in receipt');
          }
        }
      }
      
      // Validate the parsed date
      if (!this.isValidDate(receiptDate)) {
        errors.push('Parsed date is invalid');
        receiptDate = new Date(); // Reset to current date
        confidence = 0.3;
      }
      
      // Sanity check - date should not be in the future or too far in the past
      const now = new Date();
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(now.getFullYear() - 1);
      
      if (receiptDate > now) {
        errors.push('Parsed date is in the future');
        confidence *= 0.5;
      } else if (receiptDate < oneYearAgo) {
        // Not an error, but lower confidence for old receipts
        confidence *= 0.8;
      }
    } catch (error) {
      errors.push(`Error parsing date: ${error instanceof Error ? error.message : String(error)}`);
      confidence = 0.3;
    }
    
    return {
      data: receiptDate,
      confidence,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Find a date with a contextual label (e.g., "Date: 01/02/2023")
   * @param text Receipt text
   */
  private findDateWithLabel(text: string): Date | null {
    // Look for common date labels
    const dateLabels = [
      /date\s*:?\s*(\d{1,2}[\/-]\d{1,2}[\/-](?:20\d{2}|\d{2}))/i,
      /(?:receipt|invoice|transaction)\s*date\s*:?\s*(\d{1,2}[\/-]\d{1,2}[\/-](?:20\d{2}|\d{2}))/i,
      /date\s*:?\s*([A-Za-z]{3,9}\.?\s+\d{1,2},?\s+(?:20\d{2}|\d{2}))/i,
      /(\d{1,2}[\/-]\d{1,2}[\/-](?:20\d{2}|\d{2}))\s*(?:receipt|invoice|transaction|date)/i,
    ];
    
    for (const pattern of dateLabels) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Extract the date part and try to parse it
        const datePart = match[1];
        const parsed = this.parseLineForDate(datePart);
        if (parsed) {
          return parsed;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Parse a specific line for date formats
   * @param line Text line to parse
   */
  private parseLineForDate(line: string): Date | null {
    // Try all date formats
    for (const format of this.dateFormats) {
      const match = line.match(format);
      if (match) {
        try {
          return this.createDateFromMatch(match, format);
        } catch (e) {
          // Continue to next format on error
          continue;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Create a date object from regex match
   * @param match Regex match
   * @param format Format used to match
   */
  private createDateFromMatch(match: RegExpMatchArray, format: RegExp): Date {
    // Determine which format matched and create date accordingly
    const formatStr = format.toString();
    
    let year: number;
    let month: number;
    let day: number;
    
    if (formatStr.includes('MM/DD/YYYY')) {
      // MM/DD/YYYY format
      month = parseInt(match[1], 10) - 1;
      day = parseInt(match[2], 10);
      year = this.expandYear(parseInt(match[3], 10));
    } else if (formatStr.includes('DD/MM/YYYY')) {
      // DD/MM/YYYY format
      day = parseInt(match[1], 10);
      month = parseInt(match[2], 10) - 1;
      year = this.expandYear(parseInt(match[3], 10));
    } else if (formatStr.includes('YYYY/MM/DD')) {
      // YYYY/MM/DD format
      year = this.expandYear(parseInt(match[1], 10));
      month = parseInt(match[2], 10) - 1;
      day = parseInt(match[3], 10);
    } else if (formatStr.includes('Month DD, YYYY')) {
      // Month DD, YYYY format
      const monthName = match[1].toLowerCase().substring(0, 3);
      month = this.monthMap[monthName];
      day = parseInt(match[2], 10);
      year = this.expandYear(parseInt(match[3], 10));
    } else if (formatStr.includes('DD Month YYYY')) {
      // DD Month YYYY format
      day = parseInt(match[1], 10);
      const monthName = match[2].toLowerCase().substring(0, 3);
      month = this.monthMap[monthName];
      year = this.expandYear(parseInt(match[3], 10));
    } else {
      throw new Error(`Unsupported date format: ${formatStr}`);
    }
    
    // Create and return the date
    return new Date(year, month, day);
  }
  
  /**
   * Extract date from any part of the text
   * @param text Receipt text
   */
  private extractDateFromText(text: string): Date | null {
    // For each line in the text, try to find a date
    const lines = text.split('\n');
    
    for (const line of lines) {
      const date = this.parseLineForDate(line);
      if (date) {
        return date;
      }
    }
    
    return null;
  }
  
  /**
   * Expand 2-digit year to 4-digit year
   * @param year Year to expand
   */
  private expandYear(year: number): number {
    // If it's already 4 digits, return as is
    if (year > 999) {
      return year;
    }
    
    // Expand 2-digit year
    // Years 00-49 are considered 2000-2049
    // Years 50-99 are considered 1950-1999
    return year < 50 ? year + 2000 : year + 1900;
  }
  
  /**
   * Check if a date is valid
   * @param date Date to check
   */
  private isValidDate(date: Date): boolean {
    // Check if the date is valid (not NaN)
    if (isNaN(date.getTime())) {
      return false;
    }
    
    // Check if date is within reasonable range
    const now = new Date();
    const hundredYearsAgo = new Date();
    hundredYearsAgo.setFullYear(now.getFullYear() - 100);
    
    return date >= hundredYearsAgo && date <= now;
  }
}