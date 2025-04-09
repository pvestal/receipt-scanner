/**
 * Item parser for extracting line items from receipts
 */

import { BaseParser } from './baseParser';
import { ReceiptItem, ParserResult, ReceiptTemplate } from '../models/receipt';

/**
 * Parser for line items from receipt text
 */
export class ItemParser extends BaseParser<ReceiptItem[]> {
  private templates: ReceiptTemplate[] = [];
  
  /**
   * Create a new item parser
   * @param templates Optional store templates to use for recognition
   */
  constructor(templates: ReceiptTemplate[] = []) {
    super();
    this.templates = templates;
  }

  /**
   * Parse text to extract line items
   * @param text Receipt text content
   * @param context Additional parsing context
   */
  async parse(text: string, context?: Record<string, any>): Promise<ParserResult<ReceiptItem[]>> {
    const errors: string[] = [];
    const items: ReceiptItem[] = [];
    const cleanedText = this.cleanText(text);
    
    try {
      // Try to identify line items section
      const itemsSection = this.extractItemsSection(cleanedText);
      
      if (!itemsSection) {
        errors.push('Could not identify items section in receipt');
        return this.formatResult([], errors);
      }
      
      // Check for store-specific template
      let storeTemplate: ReceiptTemplate | undefined;
      
      if (context?.storeName) {
        storeTemplate = this.templates.find(t => 
          t.storeName.toLowerCase() === context.storeName.toLowerCase()
        );
      }
      
      if (storeTemplate) {
        // Use template-specific parsing
        this.parseWithTemplate(storeTemplate, itemsSection, items, errors);
      } else {
        // Use generic parsing
        this.parseGeneric(itemsSection, items, errors);
      }
      
      // Post-process items (calculate missing values, apply heuristics)
      this.postProcessItems(items);
      
      // Check results
      if (items.length === 0) {
        errors.push('No items found in receipt');
      }
    } catch (error) {
      errors.push(`Error parsing items: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return this.formatResult(items, errors);
  }
  
  /**
   * Extract the section containing line items
   * @param text Receipt text
   */
  private extractItemsSection(text: string): string | null {
    const lines = text.split('\n');
    
    // Find start and end indices of items section
    let startIdx = -1;
    let endIdx = -1;
    
    // Items section often starts with headers like "Item", "Description", "Qty", "Price"
    // and ends with totals like "Subtotal", "Tax", "Total"
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      
      // Look for item section start
      if (startIdx === -1) {
        if (
          /item.*qty.*price|description.*amount|item.*price|qty.*description|product.*price/i.test(line) ||
          /^[-=]{5,}$/.test(line) // Separator line
        ) {
          startIdx = i + 1; // Start from next line
          continue;
        }
      }
      
      // Look for item section end
      if (startIdx !== -1 && endIdx === -1) {
        if (
          /subtotal|sub-total|sub total|total|tax|balance|amount due|due amount|payment/i.test(line) ||
          /^[-=]{5,}$/.test(line) // Separator line
        ) {
          endIdx = i - 1;
          break;
        }
      }
    }
    
    // If couldn't detect start/end, make educated guesses
    if (startIdx === -1) {
      // Items often start after the first few lines (store info, date, etc.)
      startIdx = Math.min(5, Math.floor(lines.length * 0.2));
    }
    
    if (endIdx === -1 || endIdx <= startIdx) {
      // Items often end before the last few lines (totals, thank you message, etc.)
      endIdx = Math.max(startIdx + 1, lines.length - 5);
    }
    
    // Extract and return the items section
    return lines.slice(startIdx, endIdx + 1).join('\n');
  }
  
  /**
   * Parse items using a store-specific template
   * @param template Store template
   * @param text Items section text
   * @param items Array to populate with items
   * @param errors Array to populate with errors
   */
  private parseWithTemplate(
    template: ReceiptTemplate,
    text: string,
    items: ReceiptItem[],
    errors: string[]
  ): void {
    const lines = text.split('\n');
    
    // Try each pattern from the template
    for (const pattern of template.itemPatterns) {
      const regex = new RegExp(pattern, 'i');
      
      for (const line of lines) {
        if (!line.trim() || this.isHeaderOrFooter(line)) {
          continue;
        }
        
        const match = line.match(regex);
        if (match) {
          try {
            const item = this.createItemFromMatch(match, pattern);
            if (item) {
              items.push(item);
            }
          } catch (error) {
            // Skip this line if there's an error
            continue;
          }
        }
      }
      
      // If we found items with this pattern, we're done
      if (items.length > 0) {
        break;
      }
    }
  }
  
  /**
   * Parse items using generic patterns
   * @param text Items section text
   * @param items Array to populate with items
   * @param errors Array to populate with errors
   */
  private parseGeneric(
    text: string,
    items: ReceiptItem[],
    errors: string[]
  ): void {
    const lines = text.split('\n');
    
    // Common item patterns
    const patterns = [
      // Pattern: <quantity> <item name> <price>
      /(\d+)\s+(.+?)\s+(\$?\d+\.\d{2})$/,
      
      // Pattern: <item name> <price>
      /(.+?)\s+(\$?\d+\.\d{2})$/,
      
      // Pattern: <item name> <quantity> @ <unit price> <price>
      /(.+?)\s+(\d+)\s*@\s*(\$?\d+\.\d{2})\s+(\$?\d+\.\d{2})$/,
      
      // Pattern: <item name> <quantity>*<unit price> <price>
      /(.+?)\s+(\d+)\s*\*\s*(\$?\d+\.\d{2})\s+(\$?\d+\.\d{2})$/,
    ];
    
    for (const line of lines) {
      if (!line.trim() || this.isHeaderOrFooter(line)) {
        continue;
      }
      
      let parsed = false;
      
      // Try each pattern
      for (const pattern of patterns) {
        const match = line.match(pattern);
        if (match) {
          try {
            const item = this.createItemFromGenericMatch(match, pattern);
            if (item) {
              items.push(item);
              parsed = true;
              break;
            }
          } catch (error) {
            // Continue to next pattern
            continue;
          }
        }
      }
      
      // If no pattern matched, try a more aggressive approach
      if (!parsed && /\$?\d+\.\d{2}/.test(line)) {
        try {
          const item = this.parseUnstructuredLine(line);
          if (item) {
            items.push(item);
          }
        } catch (error) {
          // Skip this line
          continue;
        }
      }
    }
  }
  
  /**
   * Create item from template match
   * @param match Regex match
   * @param pattern Pattern string
   */
  private createItemFromMatch(match: RegExpMatchArray, pattern: string): ReceiptItem | null {
    // Template-specific handling based on capture groups
    // This would need to be customized based on the template format
    // Here's a generic example
    
    let name = '';
    let price = 0;
    let quantity = 1;
    
    // Extract values based on pattern
    if (pattern.includes('(?<name>') && pattern.includes('(?<price>')) {
      // Named capture groups
      name = match.groups?.name || '';
      price = this.parsePrice(match.groups?.price || '0');
      quantity = match.groups?.quantity ? parseFloat(match.groups.quantity) : 1;
    } else {
      // Positional capture groups (simplified example)
      name = match[1] || '';
      price = this.parsePrice(match[match.length - 1] || '0');
      
      // If there's a quantity, use it
      if (match.length > 3) {
        quantity = parseFloat(match[2]);
      }
    }
    
    // Validate
    if (!name || price <= 0) {
      return null;
    }
    
    // Clean up name
    name = this.cleanItemName(name);
    
    return {
      name,
      price,
      quantity,
      confidence: 0.8 // Template match has good confidence
    };
  }
  
  /**
   * Create item from generic pattern match
   * @param match Regex match
   * @param pattern Pattern regex
   */
  private createItemFromGenericMatch(match: RegExpMatchArray, pattern: RegExp): ReceiptItem | null {
    const patternStr = pattern.toString();
    
    let name = '';
    let price = 0;
    let quantity = 1;
    let unitPrice = 0;
    
    // Handle different patterns
    if (patternStr.includes('<quantity> <item name> <price>')) {
      quantity = parseFloat(match[1]);
      name = match[2];
      price = this.parsePrice(match[3]);
    } else if (patternStr.includes('<item name> <price>')) {
      name = match[1];
      price = this.parsePrice(match[2]);
    } else if (patternStr.includes('<item name> <quantity> @ <unit price> <price>')) {
      name = match[1];
      quantity = parseFloat(match[2]);
      unitPrice = this.parsePrice(match[3]);
      price = this.parsePrice(match[4]);
    } else if (patternStr.includes('<item name> <quantity>*<unit price> <price>')) {
      name = match[1];
      quantity = parseFloat(match[2]);
      unitPrice = this.parsePrice(match[3]);
      price = this.parsePrice(match[4]);
    } else {
      // Unknown pattern
      return null;
    }
    
    // Validate
    if (!name || price <= 0) {
      return null;
    }
    
    // Clean up name
    name = this.cleanItemName(name);
    
    return {
      name,
      price,
      quantity,
      unitPrice: unitPrice || (quantity > 0 ? price / quantity : 0),
      confidence: 0.7 // Generic match has decent confidence
    };
  }
  
  /**
   * Parse an unstructured line for item information
   * @param line Text line
   */
  private parseUnstructuredLine(line: string): ReceiptItem | null {
    // First find the price (most reliable indicator)
    const priceMatch = line.match(/(\$?\d+\.\d{2})[^0-9]*$/);
    if (!priceMatch) {
      return null;
    }
    
    const price = this.parsePrice(priceMatch[1]);
    
    // Extract name as everything before the price
    let name = line.substring(0, line.lastIndexOf(priceMatch[1])).trim();
    
    // Try to extract quantity if present
    let quantity = 1;
    const qtyMatch = name.match(/(\d+(\.\d+)?)\s*(x|@|ea\.?|each)/i);
    
    if (qtyMatch) {
      quantity = parseFloat(qtyMatch[1]);
      name = name.replace(qtyMatch[0], '').trim();
    }
    
    // Clean up name
    name = this.cleanItemName(name);
    
    // Validate
    if (!name || price <= 0) {
      return null;
    }
    
    return {
      name,
      price,
      quantity,
      confidence: 0.5 // Unstructured match has lower confidence
    };
  }
  
  /**
   * Parse price string to number
   * @param priceStr Price string
   */
  private parsePrice(priceStr: string): number {
    // Remove currency symbol and any non-numeric chars except decimal point
    const cleaned = priceStr.replace(/[^\d.]/g, '');
    return parseFloat(cleaned);
  }
  
  /**
   * Clean up item name
   * @param name Raw item name
   */
  private cleanItemName(name: string): string {
    return name
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s&()\-.,]/g, '') // Remove unwanted chars
      .trim();
  }
  
  /**
   * Post-process parsed items
   * @param items Items to process
   */
  private postProcessItems(items: ReceiptItem[]): void {
    // Fill in missing values, adjust confidence, etc.
    for (const item of items) {
      // Calculate missing unit price
      if (!item.unitPrice && item.quantity > 0) {
        item.unitPrice = item.price / item.quantity;
      }
      
      // Look for discounted items
      if (item.name.toLowerCase().includes('discount') || 
          item.price < 0 ||
          (item.unitPrice && item.unitPrice * item.quantity > item.price)) {
        item.discounted = true;
      }
      
      // Categorize items based on name keywords (simple approach)
      const name = item.name.toLowerCase();
      if (/milk|cheese|yogurt|cream/.test(name)) {
        item.category = 'Dairy';
      } else if (/bread|bagel|roll|bun|pastry|cake/.test(name)) {
        item.category = 'Bakery';
      } else if (/beef|chicken|pork|turkey|fish|meat/.test(name)) {
        item.category = 'Meat';
      } else if (/apple|banana|orange|fruit|vegetable/.test(name)) {
        item.category = 'Produce';
      } else if (/soda|water|coffee|tea|juice|drink/.test(name)) {
        item.category = 'Beverages';
      }
    }
  }
  
  /**
   * Check if a line is a header or footer
   * @param line Text line
   */
  private isHeaderOrFooter(line: string): boolean {
    const l = line.toLowerCase();
    return (
      /header|footer|item|qty|quantity|description|price|amount|subtotal|total|tax/i.test(l) ||
      /^[-=*]{5,}$/.test(l) || // Separator line
      l.length < 5 // Too short to be an item
    );
  }
  
  /**
   * Calculate confidence score specifically for items data
   * @param items Parsed items data
   * @param errors Any errors that occurred during parsing
   */
  protected calculateConfidence(items: ReceiptItem[], errors: string[] = []): number {
    let score = super.calculateConfidence(items, errors);
    
    // No items found means low confidence
    if (items.length === 0) {
      return 0.2;
    }
    
    // Penalize for small number of items when there are errors
    if (items.length < 3 && errors.length > 0) {
      score *= 0.7;
    }
    
    // Calculate average confidence of individual items
    const avgItemConfidence = items.reduce((sum, item) => sum + item.confidence, 0) / items.length;
    
    // Final score is weighted average
    return 0.4 * score + 0.6 * avgItemConfidence;
  }
}