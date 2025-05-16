/**
 * Functions for improving receipt OCR text based on context
 */

import { Receipt, ReceiptItem } from '../types';

interface ImprovementResult {
  content: string;
  improvement: string;
}

/**
 * Analyze receipt text to determine structure and areas for improvement
 * @param text Original OCR text to analyze
 * @returns Analysis results object
 */
export function analyzeReceiptText(text: string): Record<string, any> {
  const lines = text.split('\n');
  const wordCount = text.split(/\s+/).length;
  const lineCount = lines.length;

  // Count lines that look like items (have numbers that could be prices)
  const possibleItemLines = lines.filter(line => 
    /\d+\.\d{2}/.test(line) || 
    /\$\s*\d+(\.\d{2})?/.test(line)
  );
  
  // Try to detect header (usually first 3-5 lines)
  const headerLines = lines.slice(0, Math.min(5, lines.length));
  
  // Try to detect footer (usually last 3-5 lines)
  const footerLines = lines.slice(Math.max(0, lines.length - 5));
  
  // Check for key receipt components
  const hasTotal = /total|sum|amount due/i.test(text);
  const hasDate = /\d{1,2}\/\d{1,2}\/\d{2,4}|\d{1,2}-\d{1,2}-\d{2,4}|january|february|march|april|may|june|july|august|september|october|november|december/i.test(text);
  const hasStoreName = headerLines.some(line => line.trim().length > 3);
  const hasTax = /tax|vat|gst/i.test(text);

  return {
    lineCount,
    wordCount,
    possibleItemCount: possibleItemLines.length,
    hasTotal,
    hasDate,
    hasStoreName,
    hasTax,
    quality: calculateTextQuality(text, {
      hasTotal,
      hasDate,
      hasStoreName,
      hasTax,
      itemCount: possibleItemLines.length
    }),
    headerText: headerLines.join('\n'),
    footerText: footerLines.join('\n')
  };
}

/**
 * Calculate overall quality score for OCR text
 */
function calculateTextQuality(text: string, indicators: Record<string, any>): number {
  let score = 0;
  
  // Base score based on text length
  if (text.length > 50) score += 0.1;
  if (text.length > 200) score += 0.1;
  if (text.length > 500) score += 0.1;
  
  // Score key components
  if (indicators.hasStoreName) score += 0.15;
  if (indicators.hasDate) score += 0.15;
  if (indicators.hasTotal) score += 0.15;
  if (indicators.hasTax) score += 0.1;
  
  // Items are crucial
  if (indicators.itemCount > 0) score += 0.1;
  if (indicators.itemCount > 3) score += 0.1;
  if (indicators.itemCount > 5) score += 0.1;
  
  return Math.min(1, score);
}

/**
 * Fix common OCR errors in receipt text
 * @param text OCR text to correct
 * @returns Improved text and description
 */
export function fixCommonOcrErrors(text: string): ImprovementResult {
  let newText = text;
  
  // Fix letter/number confusions
  newText = newText
    .replace(/l(\d)/g, '1$1') // Replace l followed by number with 1
    .replace(/(\d)l/g, '$11') // Replace number followed by l with number followed by 1
    .replace(/O/g, '0')       // Replace capital O with 0 in contexts that look numerical
    .replace(/s\./g, '5.')    // Replace s. with 5.
    .replace(/\bS\b/g, '5')   // Replace standalone S with 5
    .replace(/\bI\b/g, '1')   // Replace standalone I with 1
    .replace(/\bZ\b/g, '2')   // Replace standalone Z with 2
    .replace(/\bG\b/g, '6')   // Replace standalone G with 6
    
  // Fix dollar sign issues
  newText = newText
    .replace(/\$([\s]+)(\d)/g, '$$$2') // Remove space between $ and number
    .replace(/\s\.\s(\d{2})/g, '.$1')  // Fix decimal points with spaces
    
  // Fix spaces and formatting
  newText = newText
    .replace(/\s+/g, ' ')              // Normalize spaces
    .replace(/(\d),(\d)/g, '$1.$2')    // Replace commas with periods in numbers
    .replace(/(\d) \. (\d)/g, '$1.$2') // Fix spaced periods in numbers
  
  return {
    content: newText,
    improvement: "Fixed common OCR errors: number confusions, spaces, and formatting"
  };
}

/**
 * Improve store name detection
 * @param text Full receipt text
 * @returns Improved text with better store identification
 */
export function improveStoreIdentification(text: string): ImprovementResult {
  // Common store name patterns (usually at the top of receipt)
  const lines = text.split('\n');
  
  // Check first 5 lines for store names
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Look for lines that might be store names (not dates, not just numbers)
    if (line.length > 3 && 
        !/^\d+$/.test(line) && 
        !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line)) {
      
      // Capitalize appropriately if it looks like a store name
      if (!/receipt|invoice|order/i.test(line)) {
        lines[i] = line.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
      }
    }
  }
  
  return {
    content: lines.join('\n'),
    improvement: "Enhanced store name identification and formatting"
  };
}

/**
 * Improve price and amount formatting
 * @param text Receipt text
 * @returns Text with standardized price formats
 */
export function improvePriceFormatting(text: string): ImprovementResult {
  // Find price-like patterns and standardize them
  let newText = text;
  
  // Match price patterns and standardize to $XX.XX format
  newText = newText.replace(/(\d+)[\.,](\d{2})/g, (match, dollars, cents) => {
    return `$${dollars}.${cents}`;
  });
  
  // Fix prices without dollar signs (context-aware)
  // Only apply to lines that look like they contain items and prices
  const lines = newText.split('\n');
  const improvedLines = lines.map(line => {
    // If line has a number that looks like a price but no $ sign
    if (/\d+\.\d{2}/.test(line) && !line.includes('$') && 
        !/\d{1,2}\/\d{1,2}\//.test(line)) { // avoid changing dates
      
      return line.replace(/(\d+\.\d{2})/g, '$$$1');
    }
    return line;
  });
  
  return {
    content: improvedLines.join('\n'),
    improvement: "Standardized price formatting throughout receipt"
  };
}

/**
 * Improve detection of receipt items
 * @param text Receipt text
 * @returns Receipt with better formatted items
 */
export function improveItemFormatting(text: string): ImprovementResult {
  const lines = text.split('\n');
  const improvedLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check if line might contain an item with price
    if (/\$?\s?\d+\.\d{2}/.test(line) && 
        !/total|subtotal|tax|balance|change|payment|date|time/i.test(line)) {
      
      // Try to clean up and format item lines
      // This basic version just ensures the format "Item $Price"
      const pricePart = line.match(/(\$?\s?\d+\.\d{2})/)?.[0] || '';
      
      if (pricePart) {
        // Extract item name (everything before the price)
        const priceIndex = line.lastIndexOf(pricePart);
        if (priceIndex > 0) {
          let itemName = line.substring(0, priceIndex).trim();
          // Capitalize first letter of item name
          if (itemName && itemName.length > 0) {
            itemName = itemName.charAt(0).toUpperCase() + itemName.slice(1);
          }
          
          // Format consistently
          const formattedPrice = pricePart.startsWith('$') 
            ? pricePart.replace(/\s+/g, '') 
            : '$' + pricePart.replace(/\s+/g, '');
            
          improvedLines.push(`${itemName} ${formattedPrice}`);
          continue;
        }
      }
    }
    
    // Keep non-item lines unchanged
    improvedLines.push(line);
  }
  
  return {
    content: improvedLines.join('\n'),
    improvement: "Improved formatting of receipt item lines"
  };
}

/**
 * Improve total section detection and formatting
 * @param text Receipt text
 * @returns Receipt with enhanced totals section
 */
export function improveTotalsSection(text: string): ImprovementResult {
  const lines = text.split('\n');
  const totals = {
    subtotal: null,
    tax: null,
    total: null
  };
  
  // First pass: find important total values
  for (const line of lines) {
    // Look for subtotal
    if (/subtotal|sub[ -]?total/i.test(line)) {
      const match = line.match(/\$?\s?(\d+\.\d{2})/);
      if (match) totals.subtotal = match[1];
    }
    
    // Look for tax
    if (/tax|vat|gst/i.test(line) && !/taxable/i.test(line)) {
      const match = line.match(/\$?\s?(\d+\.\d{2})/);
      if (match) totals.tax = match[1];
    }
    
    // Look for total (prioritize lines with just "total" over "subtotal")
    if (/\btotal\b|\btot\b/i.test(line) && !/sub|item/i.test(line)) {
      const match = line.match(/\$?\s?(\d+\.\d{2})/);
      if (match) totals.total = match[1];
    }
  }
  
  // Don't modify if we couldn't find the necessary values
  if (!totals.total) {
    return {
      content: text,
      improvement: "No changes to totals section (could not identify key values)"
    };
  }
  
  // Second pass: enhance or reconstruct totals section
  let improvedText = text;
  let totalsSectionFound = false;
  
  // Try to locate the totals section
  const totalLines = [];
  
  if (totals.subtotal) {
    totalLines.push(`Subtotal: $${totals.subtotal}`);
  }
  
  if (totals.tax) {
    totalLines.push(`Tax: $${totals.tax}`);
  }
  
  if (totals.total) {
    totalLines.push(`Total: $${totals.total}`);
  }
  
  // If we have multiple total lines, try to replace the existing totals section
  // or append a clean one
  if (totalLines.length > 1) {
    // First try to find and replace an existing totals section
    const totalsRegex = /(subtotal|sub[ -]?total|tax|vat|gst|total).*?(\n|$)/gi;
    const matches = [...improvedText.matchAll(totalsRegex)];
    
    if (matches.length >= 2) {
      // We have what looks like a totals section, try to find its boundaries
      const startIdx = improvedText.indexOf(matches[0][0]);
      const lastMatch = matches[matches.length - 1][0];
      const endIdx = improvedText.indexOf(lastMatch) + lastMatch.length;
      
      if (startIdx >= 0 && endIdx > startIdx) {
        // Replace the totals section with our cleaned version
        improvedText = 
          improvedText.substring(0, startIdx) + 
          totalLines.join('\n') + 
          improvedText.substring(endIdx);
          
        totalsSectionFound = true;
      }
    }
    
    // If we couldn't find and replace, append the totals section
    if (!totalsSectionFound) {
      improvedText += '\n\n' + totalLines.join('\n');
    }
    
    return {
      content: improvedText,
      improvement: "Enhanced totals section with consistent formatting"
    };
  }
  
  return {
    content: improvedText,
    improvement: "Attempted to improve totals section"
  };
}

/**
 * Apply all receipt improvements in sequence
 * @param text Original OCR text
 * @returns Fully improved text with list of improvements
 */
export function improveReceiptText(text: string): { 
  text: string; 
  improvements: string[];
  analysis: Record<string, any>;
} {
  // Analyze the text
  const analysis = analyzeReceiptText(text);
  
  // Apply improvements in sequence
  let improvedText = text;
  const improvements: string[] = [];
  
  // Fix common OCR errors first
  const ocrResult = fixCommonOcrErrors(improvedText);
  improvedText = ocrResult.content;
  improvements.push(ocrResult.improvement);
  
  // Improve store identification
  const storeResult = improveStoreIdentification(improvedText);
  improvedText = storeResult.content;
  improvements.push(storeResult.improvement);
  
  // Improve price formatting
  const priceResult = improvePriceFormatting(improvedText);
  improvedText = priceResult.content;
  improvements.push(priceResult.improvement);
  
  // Improve item formatting
  const itemResult = improveItemFormatting(improvedText);
  improvedText = itemResult.content;
  improvements.push(itemResult.improvement);
  
  // Improve totals section
  const totalsResult = improveTotalsSection(improvedText);
  improvedText = totalsResult.content;
  improvements.push(totalsResult.improvement);
  
  return {
    text: improvedText,
    improvements,
    analysis
  };
}

/**
 * Extract receipt items from improved text
 * @param text Improved receipt text
 * @returns Array of receipt items
 */
export function extractReceiptItems(text: string): ReceiptItem[] {
  const lines = text.split('\n');
  const items: ReceiptItem[] = [];
  const uuid = () => Math.random().toString(36).substring(2, 15);
  
  for (const line of lines) {
    // Skip lines that are likely header, total, or metadata
    if (/total|subtotal|tax|balance|change|payment|date|time/i.test(line)) {
      continue;
    }
    
    // Look for item price pattern
    const priceMatch = line.match(/\$(\d+\.\d{2})/);
    if (priceMatch) {
      const price = parseFloat(priceMatch[1]);
      
      // Everything before the price is the item name
      const priceStartIdx = line.lastIndexOf(priceMatch[0]);
      if (priceStartIdx > 0) {
        const name = line.substring(0, priceStartIdx).trim();
        
        // Only add if we have both name and price
        if (name && price > 0) {
          items.push({
            id: uuid(),
            name,
            price,
            quantity: 1,
            confidence: 0.8,
            isEdited: false
          });
        }
      }
    }
  }
  
  return items;
}

/**
 * Extract receipt totals from improved text
 * @param text Improved receipt text
 * @returns Receipt totals object
 */
export function extractReceiptTotals(text: string): { 
  subtotal: number; 
  tax: number; 
  total: number;
} {
  const lines = text.split('\n');
  const totals = {
    subtotal: 0,
    tax: 0,
    total: 0
  };
  
  for (const line of lines) {
    const priceMatch = line.match(/\$(\d+\.\d{2})/);
    if (!priceMatch) continue;
    
    const amount = parseFloat(priceMatch[1]);
    
    if (/subtotal|sub[ -]?total/i.test(line)) {
      totals.subtotal = amount;
    } else if (/tax|vat|gst/i.test(line) && !/taxable/i.test(line)) {
      totals.tax = amount;
    } else if (/\btotal\b|\btot\b/i.test(line) && !/sub|item/i.test(line)) {
      totals.total = amount;
    }
  }
  
  // If we have subtotal and tax but no total, calculate it
  if (totals.subtotal > 0 && totals.tax > 0 && totals.total === 0) {
    totals.total = totals.subtotal + totals.tax;
  }
  
  // If we only have total, use that for subtotal too
  if (totals.total > 0 && totals.subtotal === 0) {
    totals.subtotal = totals.total - totals.tax;
  }
  
  return totals;
}

/**
 * Extract store name from improved text
 * @param text Improved receipt text
 * @returns Store name
 */
export function extractStoreName(text: string): string {
  const lines = text.split('\n');
  
  // Check first 3 lines for store name (skip empty lines)
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    const line = lines[i].trim();
    
    // Look for lines that might be store names (not dates, not numbers, not too short)
    if (line.length > 3 && 
        !/^\d+$/.test(line) && 
        !/\d{1,2}\/\d{1,2}\/\d{2,4}/.test(line) &&
        !/receipt|invoice|order/i.test(line)) {
      
      return line;
    }
  }
  
  return 'Unknown Store';
}

/**
 * Extract date from receipt text
 * @param text Improved receipt text
 * @returns Date object or current date if not found
 */
export function extractReceiptDate(text: string): Date {
  const lines = text.split('\n');
  
  // Common date patterns
  const datePatterns = [
    // MM/DD/YYYY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/,
    // MM/DD/YY
    /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/,
    // Words like "Date: 01/02/2022"
    /date\s*:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](20\d{2})/i,
    /date\s*:?\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})/i,
  ];
  
  for (const line of lines) {
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        // Note: interpretation depends on locale, assuming MM/DD/YYYY for now
        const month = parseInt(match[1]) - 1; // 0-indexed months
        const day = parseInt(match[2]);
        let year = parseInt(match[3]);
        
        // Handle 2-digit years
        if (year < 100) {
          year += year < 50 ? 2000 : 1900;
        }
        
        // Validate date components
        if (month >= 0 && month < 12 && day >= 1 && day <= 31) {
          return new Date(year, month, day);
        }
      }
    }
  }
  
  // If no date found, return current date
  return new Date();
}

/**
 * Convert improved OCR text to full Receipt object
 * @param text Improved receipt text
 * @param userId User ID
 * @returns Complete Receipt object
 */
export function convertToReceipt(text: string, userId: string): Receipt {
  const items = extractReceiptItems(text);
  const totals = extractReceiptTotals(text);
  const storeName = extractStoreName(text);
  const date = extractReceiptDate(text);
  
  return {
    userId,
    store: { name: storeName },
    items,
    totals: {
      subtotal: totals.subtotal,
      tax: totals.tax,
      total: totals.total
    },
    subtotal: totals.subtotal,
    tax: totals.tax,
    total: totals.total,
    date,
    rawText: text,
    createdAt: new Date(),
    updatedAt: new Date(),
    confidence: 0.8 // Base confidence for improved text
  };
}