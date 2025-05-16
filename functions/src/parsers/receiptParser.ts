/**
 * Main receipt parser that orchestrates the parsing process
 */

import { BaseParser } from './baseParser';
import { StoreParser } from './storeParser';
import { DateParser } from './dateParser';
import { ItemParser } from './itemParser';
import { TotalsParser } from './totalsParser';
import { Receipt, ParserResult, ReceiptTemplate } from '../models/receipt';

/**
 * Main parser for complete receipt data
 */
export class ReceiptParser extends BaseParser<Receipt> {
  private storeParser: StoreParser;
  private dateParser: DateParser;
  private itemParser: ItemParser;
  private totalsParser: TotalsParser;
  
  /**
   * Create a new receipt parser with all necessary components
   * @param templates Optional store templates to use for recognition
   */
  constructor(templates: ReceiptTemplate[] = []) {
    super();
    this.storeParser = new StoreParser(templates);
    this.dateParser = new DateParser();
    this.itemParser = new ItemParser(templates);
    this.totalsParser = new TotalsParser();
  }
  
  /**
   * Parse complete receipt from OCR text
   * @param text Receipt text content
   * @param context Additional context (userId, imageUrl, OCR data, etc.)
   */
  async parse(text: string, context?: Record<string, any>): Promise<ParserResult<Receipt>> {
    const errors: string[] = [];
    const cleanedText = this.cleanText(text);
    
    // Initialize result with required fields
    const userId = context?.userId || '';
    const imageUrl = context?.imageUrl || '';
    const ocrConfidence = context?.ocrConfidence || 0;
    const textBlocks = context?.textBlocks || [];
    
    // Default receipt data
    let receipt: Receipt = {
      userId,
      store: { name: '' },
      items: [],
      totals: { subtotal: 0, tax: 0, total: 0 },
      date: new Date(),
      rawText: cleanedText,
      imageUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
      confidence: 0
    };
    
    try {
      // Create the enhanced parser context with OCR data
      const enhancedContext = {
        ocrConfidence,
        textBlocks,
        userId,
        imageUrl
      };
      
      // Preprocess the OCR result using the advanced OCR preprocessor
      const preprocessor = await import('../utils/ocrPreprocessor');
      const preprocessed = preprocessor.preprocessOcrResult(cleanedText, textBlocks);
      
      // Use advanced template matching to identify the receipt structure
      const templateMatcher = await import('../parsers/advancedTemplateMatcher');
      const advancedMatcher = new templateMatcher.AdvancedTemplateMatcher(this.templates);
      const templateMatch = advancedMatcher.findBestMatch(cleanedText, textBlocks);
      
      // Update the context with preprocessed data
      const advancedContext = {
        ...enhancedContext,
        preprocessed,
        templateMatch,
        // Extract detected sections if available
        sections: preprocessed.sections,
        lineItems: preprocessed.lineItems
      };
      
      // Step 1: Parse store information
      const storeResult = await this.storeParser.parse(cleanedText, advancedContext);
      receipt.store = storeResult.data;
      errors.push(...(storeResult.errors || []));
      
      // Step 2: Parse date
      const dateResult = await this.dateParser.parse(cleanedText, advancedContext);
      receipt.date = dateResult.data;
      errors.push(...(dateResult.errors || []));
      
      // Pass store name to item parser for template matching
      const itemContext = { 
        ...advancedContext,
        storeName: receipt.store.name 
      };
      
      // Step 3: Parse items
      // If we have preprocessed line items with good confidence, use them
      if (preprocessed.lineItems.length > 0 && preprocessed.confidence > 0.7) {
        receipt.items = preprocessed.lineItems.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice,
          confidence: item.confidence
        }));
        
        // Still run the parser to capture any items that might be missed
        const itemsResult = await this.itemParser.parse(cleanedText, itemContext);
        
        // Compare and merge items if needed
        if (itemsResult.data.length > receipt.items.length) {
          console.log(`Merged ${itemsResult.data.length - receipt.items.length} additional items from parser`);
          receipt.items = this.mergeItems(receipt.items, itemsResult.data);
        }
        
        errors.push(...(itemsResult.errors || []));
      } else {
        // Otherwise use the regular item parser
        const itemsResult = await this.itemParser.parse(cleanedText, itemContext);
        receipt.items = itemsResult.data;
        errors.push(...(itemsResult.errors || []));
      }
      
      // Pass items to totals parser for validation
      const totalsContext = { 
        ...advancedContext,
        items: receipt.items 
      };
      
      // Step 4: Parse totals
      const totalsResult = await this.totalsParser.parse(cleanedText, totalsContext);
      receipt.totals = totalsResult.data;
      errors.push(...(totalsResult.errors || []));
      
      // Step 5: Extract payment information if available
      receipt.paymentInfo = this.extractPaymentInfo(cleanedText);
      
      // Step 6: Cross-validate and reconcile data
      this.crossValidate(receipt, errors);
      
    } catch (error) {
      errors.push(`Error in receipt parsing: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return this.formatResult(receipt, errors, context);
  }
  
  /**
   * Merge two sets of items, avoiding duplicates
   * @param baseItems Base set of items
   * @param additionalItems Additional items to merge in
   * @returns Merged items array
   */
  private mergeItems(baseItems: ReceiptItem[], additionalItems: ReceiptItem[]): ReceiptItem[] {
    const result = [...baseItems];
    const existingItemNames = new Set(baseItems.map(item => item.name.toLowerCase()));
    
    // Add items that aren't in the base set
    for (const item of additionalItems) {
      const lowercaseName = item.name.toLowerCase();
      
      // Check if item has a similar name to an existing item
      const hasSimilarName = Array.from(existingItemNames).some(name => 
        name.includes(lowercaseName) || lowercaseName.includes(name)
      );
      
      if (!hasSimilarName) {
        result.push(item);
        existingItemNames.add(lowercaseName);
      }
    }
    
    return result;
  }
  
  /**
   * Extract payment information from receipt text
   * @param text Receipt text
   */
  private extractPaymentInfo(text: string): { method: string; cardLast4?: string } | undefined {
    // Check for common payment methods
    if (/paid in cash|cash payment|cash tender|tendered cash/i.test(text)) {
      return { method: 'CASH' };
    }
    
    // Check for credit card
    if (/visa|mastercard|master card|amex|american express|discover|credit/i.test(text)) {
      let method = 'CREDIT';
      
      // Determine card type
      if (/visa/i.test(text)) {
        method = 'VISA';
      } else if (/mastercard|master card/i.test(text)) {
        method = 'MASTERCARD';
      } else if (/amex|american express/i.test(text)) {
        method = 'AMEX';
      } else if (/discover/i.test(text)) {
        method = 'DISCOVER';
      }
      
      // Try to extract last 4 digits
      const last4Match = text.match(/x{4}[^0-9]*(\d{4})|card\s*#?\s*\*+(\d{4})|card ending (?:in )?(\d{4})/i);
      let cardLast4: string | undefined;
      
      if (last4Match) {
        cardLast4 = last4Match[1] || last4Match[2] || last4Match[3];
      }
      
      return { method, cardLast4 };
    }
    
    // Check for debit card
    if (/debit|interac/i.test(text)) {
      return { method: 'DEBIT' };
    }
    
    // Check for digital payments
    if (/paypal|venmo|apple pay|google pay|samsung pay/i.test(text)) {
      const methodMatch = text.match(/(paypal|venmo|apple pay|google pay|samsung pay)/i);
      const method = methodMatch ? methodMatch[1].toUpperCase() : 'DIGITAL';
      return { method };
    }
    
    // If nothing specific found
    return undefined;
  }
  
  /**
   * Cross-validate all receipt data for consistency
   * @param receipt Receipt object to validate
   * @param errors Errors array to append to
   */
  private crossValidate(receipt: Receipt, errors: string[]): void {
    // Check for essential data
    if (!receipt.store.name) {
      errors.push('Store name is missing');
    }
    
    if (receipt.items.length === 0) {
      errors.push('No items found in receipt');
    }
    
    if (receipt.totals.total === 0) {
      errors.push('Receipt total amount is missing');
    }
    
    // Cross-check items total with subtotal
    if (receipt.items.length > 0 && receipt.totals.subtotal > 0) {
      const itemsTotal = receipt.items.reduce((sum, item) => sum + item.price, 0);
      const difference = Math.abs(itemsTotal - receipt.totals.subtotal);
      
      // If difference is more than 5% of subtotal, flag as issue
      if (difference > (receipt.totals.subtotal * 0.05) && difference > 1) {
        errors.push(`Sum of items ($${itemsTotal.toFixed(2)}) doesn't match subtotal ($${receipt.totals.subtotal.toFixed(2)})`);
      }
    }
    
    // Check date reasonability
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    if (receipt.date > now) {
      errors.push('Receipt date is in the future');
    } else if (receipt.date < oneYearAgo) {
      errors.push('Receipt date is more than a year old');
    }
  }
  
  /**
   * Calculate overall confidence score for the entire receipt
   * @param receipt Parsed receipt data
   * @param errors Any errors that occurred during parsing
   * @param context Additional context (OCR confidence, etc.)
   */
  protected calculateConfidence(
    receipt: Receipt, 
    errors: string[] = [],
    context?: Record<string, any>
  ): number {
    // Calculate weighted confidence score based on component confidences
    
    // Start with base confidence that includes OCR confidence
    let score = super.calculateConfidence(receipt, errors, context);
    
    // Get individual component confidence scores
    let storeConfidence = 0;
    let dateConfidence = 0;
    let itemsConfidence = 0;
    let totalsConfidence = 0;
    
    // Calculate store confidence
    if (receipt.store.name) {
      storeConfidence = 0.7;
      if (receipt.store.address) storeConfidence += 0.1;
      if (receipt.store.phone || receipt.store.website) storeConfidence += 0.1;
    }
    
    // Calculate date confidence (based on validation)
    const now = new Date();
    const oneYearAgo = new Date();
    oneYearAgo.setFullYear(now.getFullYear() - 1);
    
    if (receipt.date <= now && receipt.date >= oneYearAgo) {
      dateConfidence = 0.8;
    } else if (receipt.date <= now) {
      dateConfidence = 0.6;
    } else {
      dateConfidence = 0.3;
    }
    
    // Calculate items confidence
    if (receipt.items.length > 0) {
      itemsConfidence = receipt.items.reduce((sum, item) => sum + item.confidence, 0) / receipt.items.length;
    }
    
    // Calculate totals confidence
    if (receipt.totals.total > 0) {
      totalsConfidence = 0.7;
      
      // Check for mathematical consistency
      const calculatedTotal = receipt.totals.subtotal + receipt.totals.tax - (receipt.totals.discount || 0) + (receipt.totals.tip || 0);
      if (Math.abs(calculatedTotal - receipt.totals.total) < 0.05) {
        totalsConfidence = 0.9;
      }
    }
    
    // Weighted average of component confidences
    const componentConfidence = 
      (storeConfidence * 0.2) +
      (dateConfidence * 0.1) +
      (itemsConfidence * 0.4) +
      (totalsConfidence * 0.3);
    
    // OCR confidence is highly important
    const ocrConfidence = context?.ocrConfidence || 0;
    
    // Final confidence is weighted combination of base, component, and OCR confidence
    // OCR confidence is weighted more heavily as it's fundamental to the process
    const finalConfidence = 
      (score * 0.2) + 
      (componentConfidence * 0.5) + 
      (ocrConfidence * 0.3);
    
    // Additional penalties for severe issues
    let adjustedConfidence = finalConfidence;
    
    // If no items found, severely reduce confidence
    if (receipt.items.length === 0) {
      adjustedConfidence *= 0.3;
    }
    
    // If no store name, reduce confidence
    if (!receipt.store.name) {
      adjustedConfidence *= 0.7;
    }
    
    // If total amount is zero, reduce confidence
    if (receipt.totals.total === 0) {
      adjustedConfidence *= 0.7;
    }
    
    // Adjust based on OCR text length - very short text is likely poor quality
    const textLength = (receipt.rawText || '').length;
    if (textLength < 50) {
      adjustedConfidence *= 0.5;
    } else if (textLength < 100) {
      adjustedConfidence *= 0.8;
    }
    
    return Math.max(0, Math.min(1, adjustedConfidence));
  }
}