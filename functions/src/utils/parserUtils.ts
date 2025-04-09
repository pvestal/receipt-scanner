/**
 * Utility functions for receipt parsing
 */

/**
 * Clean up text for parsing
 * @param text Text to clean
 */
export function cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  /**
   * Extract amount from a text with potential currency symbols and formatting
   * @param text Text containing an amount
   * @returns Parsed amount as a number, or null if no amount found
   */
  export function extractAmount(text: string): number | null {
    // Look for amount patterns like $123.45 or 123,45 € or 123.45
    const amountPatterns = [
      // Currency symbol + amount
      /[\$€£¥₹]([0-9]+[.,][0-9]{2})/,
      
      // Amount + currency symbol
      /([0-9]+[.,][0-9]{2})[\$€£¥₹]/,
      
      // Amount with comma as decimal separator
      /([0-9]+,[0-9]{2})/,
      
      // Amount with period as decimal separator
      /([0-9]+\.[0-9]{2})/
    ];
    
    for (const pattern of amountPatterns) {
      const match = text.match(pattern);
      if (match && match[1]) {
        // Normalize: replace comma with period for decimal
        const normalized = match[1].replace(',', '.');
        return parseFloat(normalized);
      }
    }
    
    return null;
  }
  
  /**
   * Check if text is likely a header or footer line
   * @param text Text line to check
   */
  export function isHeaderOrFooter(text: string): boolean {
    // Lowercase for case-insensitive comparison
    const lowered = text.toLowerCase();
    
    // Check for common header/footer terms
    const headerFooterTerms = [
      'receipt', 'invoice', 'order', 'transaction',
      'date', 'time', 'store', 'customer', 'cashier',
      'item', 'description', 'qty', 'quantity', 'price',
      'subtotal', 'tax', 'total', 'amount', 'payment',
      'thank you', 'thanks for', 'come again', 'www.',
      'tel', 'phone', 'address', 'receipt no', 'receipt#',
      'transaction id', 'order number', 'register'
    ];
    
    // Check if any of the header/footer terms are present
    for (const term of headerFooterTerms) {
      if (lowered.includes(term)) {
        return true;
      }
    }
    
    // Check for separator lines (e.g., -------, =======)
    if (/^[-=*_]{5,}$/g.test(text)) {
      return true;
    }
    
    // Check for very short lines (likely not content)
    if (text.trim().length < 5) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Check if a string contains a date
   * @param text Text to check
   */
  export function containsDate(text: string): boolean {
    // Common date formats
    const datePatterns = [
      // MM/DD/YYYY or DD/MM/YYYY
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/,
      
      // YYYY-MM-DD
      /\b\d{4}-\d{1,2}-\d{1,2}\b/,
      
      // Month DD, YYYY
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i,
      
      // DD Month YYYY
      /\b\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4}\b/i
    ];
    
    for (const pattern of datePatterns) {
      if (pattern.test(text)) {
        return true;
      }
    }
    
    return false;
  }
  
  /**
   * Check if a string looks like a valid product/item line
   * @param text Line of text
   */
  export function isItemLine(text: string): boolean {
    // Check for common item line patterns
    
    // Don't consider headers or footers as items
    if (isHeaderOrFooter(text)) {
      return false;
    }
    
    // Don't consider dates as items
    if (containsDate(text)) {
      return false;
    }
    
    // Look for price pattern at the end of the line
    if (/[\$€£¥₹]?[0-9]+[.,][0-9]{2}\s*$/.test(text)) {
      return true;
    }
    
    // Look for quantity and unit price pattern
    if (/\d+\s*(?:x|@|ea\.?|each)\s*[\$€£¥₹]?[0-9]+[.,][0-9]{2}/i.test(text)) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Normalize a monetary amount
   * @param amount Amount to normalize
   * @param precision Decimal precision
   */
  export function normalizeAmount(amount: number, precision: number = 2): number {
    return parseFloat(amount.toFixed(precision));
  }
  
  /**
   * Clean up item description text
   * @param text Item description text
   */
  export function cleanItemText(text: string): string {
    return text
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s&()\-.,]/g, '') // Remove unwanted chars
      .trim();
  }
  
  /**
   * Try to categorize an item based on its name
   * @param itemName Item name to categorize
   */
  export function categorizeItem(itemName: string): string | undefined {
    const name = itemName.toLowerCase();
    
    // Common categories and their keywords
    const categories: { [key: string]: string[] } = {
      'Dairy': ['milk', 'cheese', 'yogurt', 'cream', 'butter'],
      'Bakery': ['bread', 'bagel', 'roll', 'bun', 'pastry', 'cake', 'cookie'],
      'Meat': ['beef', 'chicken', 'pork', 'turkey', 'fish', 'meat', 'burger'],
      'Produce': ['apple', 'banana', 'orange', 'fruit', 'vegetable', 'salad'],
      'Beverages': ['soda', 'water', 'coffee', 'tea', 'juice', 'drink', 'beer', 'wine'],
      'Snacks': ['chips', 'snack', 'candy', 'chocolate', 'cookie', 'crackers'],
      'Household': ['paper', 'soap', 'detergent', 'cleaner', 'cleaning', 'tissue'],
      'Personal Care': ['shampoo', 'soap', 'toothpaste', 'deodorant', 'lotion'],
      'Electronics': ['battery', 'charger', 'cable', 'headphone', 'speaker']
    };
    
    // Check each category for matching keywords
    for (const [category, keywords] of Object.entries(categories)) {
      for (const keyword of keywords) {
        if (name.includes(keyword)) {
          return category;
        }
      }
    }
    
    return undefined;
  }
  
  /**
   * Calculate tax rate based on subtotal and tax amount
   * @param subtotal Subtotal amount
   * @param tax Tax amount
   */
  export function calculateTaxRate(subtotal: number, tax: number): number | undefined {
    if (subtotal <= 0 || tax <= 0) {
      return undefined;
    }
    
    const taxRate = (tax / subtotal) * 100;
    
    // Check if tax rate is reasonable (typically between 3% and 25%)
    if (taxRate >= 3 && taxRate <= 25) {
      return normalizeAmount(taxRate, 2);
    }
    
    return undefined;
  }