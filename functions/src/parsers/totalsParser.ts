/**
 * Totals parser for extracting receipt totals (subtotal, tax, total)
 */

import { BaseParser } from './baseParser';
import { ReceiptTotals, ParserResult, ReceiptItem } from '../models/receipt';

/**
 * Parser for extracting receipt totals information
 */
export class TotalsParser extends BaseParser<ReceiptTotals> {
  /**
   * Parse text to extract receipt totals
   * @param text Receipt text content
   * @param context Additional parsing context (e.g., parsed items)
   */
  async parse(text: string, context?: Record<string, any>): Promise<ParserResult<ReceiptTotals>> {
    const errors: string[] = [];
    const cleanedText = this.cleanText(text);
    
    // Default values
    let totals: ReceiptTotals = {
      subtotal: 0,
      tax: 0,
      total: 0
    };
    
    try {
      // Extract the totals section
      const totalsSection = this.extractTotalsSection(cleanedText);
      
      if (totalsSection) {
        // Extract individual total values
        const extractedTotals = this.extractTotalValues(totalsSection);
        totals = { ...totals, ...extractedTotals };
      } else {
        errors.push('Could not identify totals section in receipt');
      }
      
      // Validate and reconcile totals
      this.validateAndReconcileTotals(totals, errors, context);
      
    } catch (error) {
      errors.push(`Error parsing totals: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return this.formatResult(totals, errors);
  }
  
  /**
   * Extract the section containing total information
   * @param text Receipt text
   */
  private extractTotalsSection(text: string): string | null {
    const lines = text.split('\n');
    
    // Totals usually appear near the end of the receipt
    // Look for the first occurrence of "subtotal", "tax", or "total" keywords
    let startIdx = -1;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      if (/subtotal|sub-total|sub total/i.test(line)) {
        startIdx = i;
        break;
      }
    }
    
    // If no subtotal found, try finding total directly
    if (startIdx === -1) {
      for (let i = Math.floor(lines.length * 0.7); i < lines.length; i++) {
        const line = lines[i].toLowerCase();
        if (/total(?!:items)/i.test(line)) {
          startIdx = Math.max(0, i - 3); // Include a few lines before "total"
          break;
        }
      }
    }
    
    // If still not found, assume totals are in the last ~30% of receipt
    if (startIdx === -1) {
      startIdx = Math.floor(lines.length * 0.7);
    }
    
    // Extract totals section (from start index to the end)
    // but limit to ~10 lines to avoid including unrelated content
    const endIdx = Math.min(startIdx + 10, lines.length);
    
    return lines.slice(startIdx, endIdx).join('\n');
  }
  
  /**
   * Extract individual total values
   * @param text Totals section text
   */
  private extractTotalValues(text: string): Partial<ReceiptTotals> {
    const totals: Partial<ReceiptTotals> = {};
    const lines = text.split('\n');
    
    // Extract subtotal
    const subtotalLine = lines.find(line => 
      /subtotal|sub-total|sub total/i.test(line)
    );
    if (subtotalLine) {
      totals.subtotal = this.extractAmountFromLine(subtotalLine);
    }
    
    // Extract tax
    const taxLine = lines.find(line => 
      /tax|vat|gst|hst|pst/i.test(line) &&
      !/tax exempt|tax free/i.test(line)
    );
    if (taxLine) {
      totals.tax = this.extractAmountFromLine(taxLine);
    }
    
    // Extract total
    const totalLine = lines.find(line => 
      /total(?!:items)|balance|amount due|due amount|grand total/i.test(line) &&
      !/subtotal|sub-total|sub total/i.test(line)
    );
    if (totalLine) {
      totals.total = this.extractAmountFromLine(totalLine);
    }
    
    // Extract tip if present
    const tipLine = lines.find(line => 
      /tip|gratuity/i.test(line)
    );
    if (tipLine) {
      totals.tip = this.extractAmountFromLine(tipLine);
    }
    
    // Extract discount if present
    const discountLine = lines.find(line => 
      /discount|savings|coupon|promo|promotion/i.test(line)
    );
    if (discountLine) {
      totals.discount = this.extractAmountFromLine(discountLine);
    }
    
    return totals;
  }
  
  /**
   * Extract amount from a line containing a total
   * @param line Line of text
   */
  private extractAmountFromLine(line: string): number {
    // Look for amounts like $123.45
    const amountMatch = line.match(/[$€£]?(\d+\.\d{2})/);
    
    if (amountMatch && amountMatch[1]) {
      return parseFloat(amountMatch[1]);
    }
    
    // If no match, try to extract any number with decimal point
    const numberMatch = line.match(/(\d+\.\d+)/);
    if (numberMatch && numberMatch[1]) {
      return parseFloat(numberMatch[1]);
    }
    
    return 0;
  }
  
  /**
   * Validate and reconcile totals
   * @param totals Totals object to validate
   * @param errors Errors array to append to
   * @param context Additional context
   */
  private validateAndReconcileTotals(
    totals: ReceiptTotals,
    errors: string[],
    context?: Record<string, any>
  ): void {
    // If we have items, calculate sum and compare
    if (context?.items && Array.isArray(context.items)) {
      const items = context.items as ReceiptItem[];
      const itemsSum = items.reduce((sum, item) => sum + item.price, 0);
      
      // If no subtotal extracted, use items sum
      if (totals.subtotal === 0 && itemsSum > 0) {
        totals.subtotal = parseFloat(itemsSum.toFixed(2));
      }
      // If there's a large discrepancy between items sum and extracted subtotal
      else if (totals.subtotal > 0 && Math.abs(itemsSum - totals.subtotal) > 1) {
        errors.push(`Subtotal ($${totals.subtotal.toFixed(2)}) doesn't match sum of items ($${itemsSum.toFixed(2)})`);
      }
    }
    
    // Check for missing values
    if (totals.subtotal === 0) {
      errors.push('Subtotal amount not found');
    }
    
    if (totals.total === 0) {
      errors.push('Total amount not found');
      
      // If we have subtotal and tax but no total, calculate it
      if (totals.subtotal > 0) {
        totals.total = parseFloat((totals.subtotal + (totals.tax || 0) - (totals.discount || 0) + (totals.tip || 0)).toFixed(2));
      }
    }
    
    // If we have subtotal and total but no tax, calculate it
    if (totals.tax === 0 && totals.subtotal > 0 && totals.total > 0) {
      const calculatedTax = totals.total - totals.subtotal - (totals.tip || 0) + (totals.discount || 0);
      if (calculatedTax > 0) {
        totals.tax = parseFloat(calculatedTax.toFixed(2));
      }
    }
    
    // Check for reasonable values
    if (totals.subtotal > 0 && totals.total > 0) {
      // Total should be greater than or equal to subtotal (unless there's a large discount)
      if (totals.total < totals.subtotal && !totals.discount) {
        errors.push('Total is less than subtotal without a discount');
      }
      
      // Tax should be a reasonable percentage of subtotal (typically 5-25%)
      if (totals.tax > 0) {
        const taxRate = (totals.tax / totals.subtotal) * 100;
        if (taxRate < 1 || taxRate > 30) {
          errors.push(`Unusual tax rate: ${taxRate.toFixed(1)}%`);
        }
      }
    }
  }
  
  /**
   * Calculate confidence score specifically for totals data
   * @param totals Parsed totals data
   * @param errors Any errors that occurred during parsing
   */
  protected calculateConfidence(totals: ReceiptTotals, errors: string[] = []): number {
    let score = super.calculateConfidence(totals, errors);
    
    // Check for missing essential values
    if (totals.total === 0) {
      score *= 0.5; // Major reduction in confidence
    }
    
    if (totals.subtotal === 0) {
      score *= 0.7; // Significant reduction in confidence
    }
    
    // Check for mathematical consistency
    const calculatedTotal = totals.subtotal + (totals.tax || 0) - (totals.discount || 0) + (totals.tip || 0);
    
    if (totals.total > 0 && Math.abs(calculatedTotal - totals.total) < 0.05) {
      // Mathematically consistent totals boost confidence
      score = Math.min(1, score + 0.2);
    } else if (totals.total > 0 && Math.abs(calculatedTotal - totals.total) > 1) {
      // Large discrepancy reduces confidence
      score *= 0.7;
    }
    
    return score;
  }
}