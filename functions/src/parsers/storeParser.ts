/**
 * Store parser for extracting store information from receipts
 */

import { BaseParser } from './baseParser';
import { Store, ParserResult, ReceiptTemplate } from '../models/receipt';

/**
 * Parser for store information from receipt text
 */
export class StoreParser extends BaseParser<Store> {
  private templates: ReceiptTemplate[] = [];
  
  /**
   * Create a new store parser
   * @param templates Optional store templates to use for recognition
   */
  constructor(templates: ReceiptTemplate[] = []) {
    super();
    this.templates = templates;
  }

  /**
   * Parse text to extract store information
   * @param text Receipt text content
   * @param context Additional parsing context
   */
  async parse(text: string, context?: Record<string, any>): Promise<ParserResult<Store>> {
    const errors: string[] = [];
    const cleanedText = this.cleanText(text);
    
    // Default store with empty name
    let store: Store = {
      name: ''
    };
    
    try {
      // First try to match against known templates
      const matchedStore = this.matchStoreTemplate(cleanedText);
      
      if (matchedStore) {
        store = matchedStore;
      } else {
        // Fallback to heuristic parsing if no template match
        store = this.extractStoreHeuristically(cleanedText);
      }
      
      // Extract additional store details
      if (store.name) {
        // Try to find address in header (typically 2-3 lines after store name)
        store.address = this.extractAddress(cleanedText, store.name);
        
        // Try to find phone number
        store.phone = this.extractPhoneNumber(cleanedText);
        
        // Try to find website
        store.website = this.extractWebsite(cleanedText);
        
        // Try to find tax ID (often near the bottom of receipts)
        store.taxId = this.extractTaxId(cleanedText);
      } else {
        errors.push('Could not determine store name');
      }
    } catch (error) {
      errors.push(`Error parsing store information: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return this.formatResult(store, errors);
  }
  
  /**
   * Match receipt against known store templates
   * @param text Cleaned receipt text
   */
  private matchStoreTemplate(text: string): Store | null {
    // Check against store templates
    for (const template of this.templates) {
      for (const pattern of template.storePatterns) {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(text)) {
          return {
            name: template.storeName
          };
        }
      }
    }
    
    return null;
  }
  
  /**
   * Extract store information using heuristics
   * @param text Cleaned receipt text
   */
  private extractStoreHeuristically(text: string): Store {
    // Common approach: store name is often in the first few lines,
    // in all caps, and/or followed by address
    const lines = text.split('\n');
    
    // Try first non-empty line that's not a date
    let storeName = '';
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      if (line && !this.isDate(line) && !this.isTime(line)) {
        storeName = line;
        break;
      }
    }
    
    // If the first line is very short, combine with next line
    if (storeName.length < 5 && lines.length > 1) {
      storeName = `${storeName} ${lines[1].trim()}`.trim();
    }
    
    // Remove common prefixes/suffixes
    storeName = storeName
      .replace(/welcome to/i, '')
      .replace(/thank you for shopping/i, '')
      .trim();
    
    return {
      name: storeName
    };
  }
  
  /**
   * Extract address from text
   * @param text Receipt text
   * @param storeName Store name to help locate address
   */
  private extractAddress(text: string, storeName: string): string | undefined {
    // Address often follows store name
    const lines = text.split('\n');
    const storeNameIndex = lines.findIndex(line => 
      line.toLowerCase().includes(storeName.toLowerCase())
    );
    
    if (storeNameIndex >= 0 && storeNameIndex + 1 < lines.length) {
      // Check next 1-2 lines for address pattern
      for (let i = 1; i <= 2; i++) {
        if (storeNameIndex + i < lines.length) {
          const line = lines[storeNameIndex + i].trim();
          
          // Address typically contains numbers and sometimes words like "street", "ave", etc.
          if (
            /\d/.test(line) && 
            !/total|subtotal|tax|item|qty|price|\$\d+\.\d+/i.test(line)
          ) {
            return line;
          }
        }
      }
    }
    
    // Try to find address by pattern
    const addressRegex = /\d+\s+[A-Za-z0-9\s,]+(?:street|st|avenue|ave|road|rd|boulevard|blvd|lane|ln|drive|dr|way|place|pl|square|sq)/i;
    const match = text.match(addressRegex);
    
    return match ? match[0] : undefined;
  }
  
  /**
   * Extract phone number from text
   * @param text Receipt text
   */
  private extractPhoneNumber(text: string): string | undefined {
    // Look for common phone number patterns
    const phoneRegex = /(?:phone|tel|telephone)[:\s]*(\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4})/i;
    const match = text.match(phoneRegex);
    
    if (match && match[1]) {
      return match[1];
    }
    
    // Try a more general pattern if the above fails
    const generalPhoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/;
    const generalMatch = text.match(generalPhoneRegex);
    
    return generalMatch ? generalMatch[0] : undefined;
  }
  
  /**
   * Extract website from text
   * @param text Receipt text
   */
  private extractWebsite(text: string): string | undefined {
    // Look for URLs or common website mentions
    const websiteRegex = /(?:www\.|https?:\/\/)[A-Za-z0-9.-]+\.[A-Za-z]{2,}/i;
    const match = text.match(websiteRegex);
    
    return match ? match[0] : undefined;
  }
  
  /**
   * Extract tax ID from text
   * @param text Receipt text
   */
  private extractTaxId(text: string): string | undefined {
    // Tax ID often labeled with GST, VAT, Tax ID, ABN, etc.
    const taxIdRegex = /(?:tax\s*id|tin|ein|gst|vat|abn)[#:]?\s*([A-Za-z0-9-]{5,})/i;
    const match = text.match(taxIdRegex);
    
    return match && match[1] ? match[1] : undefined;
  }
  
  /**
   * Check if a string represents a date
   * @param text Text to check
   */
  private isDate(text: string): boolean {
    // Check for common date patterns
    const dateRegex = /\d{1,4}[-./]\d{1,2}[-./]\d{1,4}|\d{1,2}[-./]\d{1,2}[-./]\d{2,4}/;
    return dateRegex.test(text);
  }
  
  /**
   * Check if a string represents a time
   * @param text Text to check
   */
  private isTime(text: string): boolean {
    // Check for common time patterns
    const timeRegex = /\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?/i;
    return timeRegex.test(text);
  }
  
  /**
   * Calculate confidence score specifically for store data
   * @param store Parsed store data
   * @param errors Any errors that occurred during parsing
   */
  protected calculateConfidence(store: Store, errors: string[] = []): number {
    let score = super.calculateConfidence(store, errors);
    
    // Store name is essential - heavily weight this
    if (!store.name) {
      score *= 0.3; // major reduction in confidence
    }
    
    // Additional fields increase confidence
    if (store.address) score = Math.min(1, score + 0.1);
    if (store.phone) score = Math.min(1, score + 0.05);
    if (store.website) score = Math.min(1, score + 0.05);
    if (store.taxId) score = Math.min(1, score + 0.05);
    
    return score;
  }
}