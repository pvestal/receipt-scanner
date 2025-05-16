/**
 * Utilities for preprocessing OCR results for improved receipt recognition
 */

import { TextBlock } from '../services/visionService';

/**
 * Preprocessed OCR result
 */
export interface PreprocessedOcrResult {
  enhancedText: string;
  sections: {
    header?: string;
    items?: string;
    totals?: string;
    footer?: string;
  };
  lineItems: LineItem[];
  confidence: number;
}

/**
 * Detected line item
 */
export interface LineItem {
  name: string;
  price: number;
  quantity?: number;
  unitPrice?: number;
  confidence: number;
}

/**
 * Preprocess OCR result for better receipt parsing
 * @param text Raw OCR text
 * @param textBlocks Structured text blocks from OCR
 * @returns Preprocessed OCR result
 */
export function preprocessOcrResult(
  text: string,
  textBlocks?: TextBlock[]
): PreprocessedOcrResult {
  // Clean the raw text
  const cleanedText = cleanOcrText(text);
  
  // Default result
  const result: PreprocessedOcrResult = {
    enhancedText: cleanedText,
    sections: {},
    lineItems: [],
    confidence: 0.5
  };
  
  // If we have structured text blocks, use them for better analysis
  if (textBlocks && textBlocks.length > 0) {
    // Identify receipt sections
    const sections = identifySections(textBlocks, cleanedText);
    result.sections = sections;
    
    // Extract line items
    result.lineItems = extractLineItems(cleanedText, textBlocks);
    
    // Calculate confidence based on section detection and line items
    result.confidence = calculateConfidence(sections, result.lineItems);
  } else {
    // Without structured blocks, fall back to heuristic processing
    result.sections = identifySectionsFromText(cleanedText);
    result.lineItems = extractLineItemsFromText(cleanedText);
    result.confidence = 0.4; // Lower confidence with text-only processing
  }
  
  // Enhance the text with detected information
  result.enhancedText = enhanceText(cleanedText, result.sections, result.lineItems);
  
  return result;
}

/**
 * Clean and normalize OCR text
 * @param text OCR text to clean
 * @returns Cleaned text
 */
function cleanOcrText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    // Fix common OCR errors
    .replace(/l(?=\d)/g, '1') // Replace 'l' with '1' when followed by digits
    .replace(/O(?=\d)/g, '0') // Replace 'O' with '0' when followed by digits
    .replace(/S(?=\d)/g, '5') // Replace 'S' with '5' when followed by digits
    // Normalize money symbols
    .replace(/[Ss](\d+\.\d{2})/g, '$$$1') // Replace S with $ in prices
    // Clean up excess whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Identify receipt sections from structured text blocks
 * @param textBlocks Structured text blocks from OCR
 * @param text Full OCR text
 * @returns Identified sections
 */
function identifySections(
  textBlocks: TextBlock[],
  text: string
): PreprocessedOcrResult['sections'] {
  const sections: PreprocessedOcrResult['sections'] = {};
  
  // Sort blocks vertically
  const sortedBlocks = [...textBlocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
  
  if (sortedBlocks.length === 0) {
    return sections;
  }
  
  // Estimate section boundaries based on receipt layout
  const totalHeight = sortedBlocks[sortedBlocks.length - 1].boundingBox.y + 
                      sortedBlocks[sortedBlocks.length - 1].boundingBox.height - 
                      sortedBlocks[0].boundingBox.y;
  
  // Approximate section boundaries as percentages of total height
  const headerEnd = sortedBlocks[0].boundingBox.y + totalHeight * 0.2;
  const itemsStart = sortedBlocks[0].boundingBox.y + totalHeight * 0.15;
  const itemsEnd = sortedBlocks[0].boundingBox.y + totalHeight * 0.7;
  const totalsStart = sortedBlocks[0].boundingBox.y + totalHeight * 0.65;
  const totalsEnd = sortedBlocks[0].boundingBox.y + totalHeight * 0.85;
  const footerStart = sortedBlocks[0].boundingBox.y + totalHeight * 0.8;
  
  // Identify header (top part of receipt)
  const headerBlocks = sortedBlocks.filter(block => 
    block.boundingBox.y < headerEnd
  );
  if (headerBlocks.length > 0) {
    sections.header = headerBlocks.map(block => block.text).join('\n');
  }
  
  // Identify items section (middle part, may overlap with header)
  const itemsBlocks = sortedBlocks.filter(block => 
    block.boundingBox.y >= itemsStart && block.boundingBox.y <= itemsEnd
  );
  if (itemsBlocks.length > 0) {
    sections.items = itemsBlocks.map(block => block.text).join('\n');
  }
  
  // Identify totals section (lower part, may overlap with items)
  const totalsBlocks = sortedBlocks.filter(block => 
    block.boundingBox.y >= totalsStart && block.boundingBox.y <= totalsEnd
  );
  if (totalsBlocks.length > 0) {
    sections.totals = totalsBlocks.map(block => block.text).join('\n');
  }
  
  // Identify footer (bottom part, may overlap with totals)
  const footerBlocks = sortedBlocks.filter(block => 
    block.boundingBox.y >= footerStart
  );
  if (footerBlocks.length > 0) {
    sections.footer = footerBlocks.map(block => block.text).join('\n');
  }
  
  // If sections are still undefined, refine by content patterns
  if (!sections.totals) {
    // Look for blocks with total/subtotal keywords
    const totalBlocks = sortedBlocks.filter(block => 
      /total|subtotal|tax|balance|sum|amount due/i.test(block.text)
    );
    if (totalBlocks.length > 0) {
      sections.totals = totalBlocks.map(block => block.text).join('\n');
    }
  }
  
  return sections;
}

/**
 * Identify receipt sections from plain text
 * @param text OCR text
 * @returns Identified sections
 */
function identifySectionsFromText(text: string): PreprocessedOcrResult['sections'] {
  const sections: PreprocessedOcrResult['sections'] = {};
  const lines = text.split('\n');
  
  if (lines.length === 0) {
    return sections;
  }
  
  // Header is typically first 20% of lines
  const headerEndIndex = Math.ceil(lines.length * 0.2);
  const headerLines = lines.slice(0, headerEndIndex);
  sections.header = headerLines.join('\n');
  
  // Items section typically in middle ~50% of receipt
  const itemsStartIndex = Math.floor(lines.length * 0.15);
  const itemsEndIndex = Math.ceil(lines.length * 0.7);
  const itemsLines = lines.slice(itemsStartIndex, itemsEndIndex);
  sections.items = itemsLines.join('\n');
  
  // Look for totals section - typically has "total", "subtotal", etc.
  const totalsLines: string[] = [];
  for (let i = Math.floor(lines.length * 0.5); i < lines.length; i++) {
    if (/total|subtotal|tax|balance|sum|amount due/i.test(lines[i])) {
      // Include a few lines around this line
      const startIdx = Math.max(i - 2, Math.floor(lines.length * 0.5));
      const endIdx = Math.min(i + 3, lines.length);
      totalsLines.push(...lines.slice(startIdx, endIdx));
      break;
    }
  }
  
  if (totalsLines.length > 0) {
    sections.totals = totalsLines.join('\n');
  } else {
    // If no totals found, assume bottom 20-30% of receipt
    const totalsStartIndex = Math.floor(lines.length * 0.7);
    const totalsEndIndex = Math.ceil(lines.length * 0.9);
    sections.totals = lines.slice(totalsStartIndex, totalsEndIndex).join('\n');
  }
  
  // Footer is typically last 10-15% of lines
  const footerStartIndex = Math.floor(lines.length * 0.85);
  const footerLines = lines.slice(footerStartIndex);
  sections.footer = footerLines.join('\n');
  
  return sections;
}

/**
 * Extract line items from structured text blocks
 * @param text Full OCR text
 * @param textBlocks Structured text blocks from OCR
 * @returns Extracted line items
 */
function extractLineItems(
  text: string,
  textBlocks: TextBlock[]
): LineItem[] {
  const items: LineItem[] = [];
  
  // Common patterns for line items
  const itemPatterns = [
    // Name followed by price
    /(.+?)\s+\$?(\d+\.\d{2})$/,
    // Name with quantity and price
    /(.+?)\s+(\d+)\s*[xX]\s*\$?(\d+\.\d{2})\s*\$?(\d+\.\d{2})$/,
    // Name with quantity as @
    /(.+?)\s+(\d+)\s*@\s*\$?(\d+\.\d{2})\s*\$?(\d+\.\d{2})$/
  ];
  
  // Look for potential item blocks in the middle part of the receipt
  const sortedBlocks = [...textBlocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
  const totalBlocks = sortedBlocks.length;
  
  if (totalBlocks === 0) {
    return items;
  }
  
  // Focus on middle section of the receipt
  const startIdx = Math.floor(totalBlocks * 0.2);
  const endIdx = Math.ceil(totalBlocks * 0.7);
  const middleBlocks = sortedBlocks.slice(startIdx, endIdx);
  
  // Analyze potential item lines
  for (const block of middleBlocks) {
    const blockLines = block.text.split('\n');
    
    for (const line of blockLines) {
      // Try each pattern
      for (const pattern of itemPatterns) {
        const match = line.match(pattern);
        
        if (match) {
          try {
            // First pattern: name and price
            if (match.length === 3) {
              const name = match[1].trim();
              const price = parseFloat(match[2]);
              
              if (name && !isNaN(price)) {
                items.push({
                  name,
                  price,
                  confidence: 0.8
                });
                break; // Break pattern loop
              }
            }
            // Second and third patterns: name, quantity, unit price, total price
            else if (match.length === 5) {
              const name = match[1].trim();
              const quantity = parseInt(match[2], 10);
              const unitPrice = parseFloat(match[3]);
              const price = parseFloat(match[4]);
              
              if (name && !isNaN(quantity) && !isNaN(unitPrice) && !isNaN(price)) {
                items.push({
                  name,
                  price,
                  quantity,
                  unitPrice,
                  confidence: 0.9
                });
                break; // Break pattern loop
              }
            }
          } catch (error) {
            // Skip this line if parsing fails
            continue;
          }
        }
      }
    }
  }
  
  return items;
}

/**
 * Extract line items from plain text
 * @param text OCR text
 * @returns Extracted line items
 */
function extractLineItemsFromText(text: string): LineItem[] {
  const items: LineItem[] = [];
  const lines = text.split('\n');
  
  // Common patterns for line items
  const itemPatterns = [
    // Name followed by price
    /(.+?)\s+\$?(\d+\.\d{2})$/,
    // Name with quantity and price
    /(.+?)\s+(\d+)\s*[xX]\s*\$?(\d+\.\d{2})\s*\$?(\d+\.\d{2})$/,
    // Name with quantity as @
    /(.+?)\s+(\d+)\s*@\s*\$?(\d+\.\d{2})\s*\$?(\d+\.\d{2})$/
  ];
  
  // Estimate where items section starts and ends
  const itemsStartIndex = Math.floor(lines.length * 0.2);
  const itemsEndIndex = Math.ceil(lines.length * 0.7);
  
  // Look for lines that match item patterns
  for (let i = itemsStartIndex; i < itemsEndIndex; i++) {
    const line = lines[i];
    
    for (const pattern of itemPatterns) {
      const match = line.match(pattern);
      
      if (match) {
        try {
          // First pattern: name and price
          if (match.length === 3) {
            const name = match[1].trim();
            const price = parseFloat(match[2]);
            
            if (name && !isNaN(price)) {
              items.push({
                name,
                price,
                confidence: 0.7
              });
              break; // Break pattern loop
            }
          }
          // Second and third patterns: name, quantity, unit price, total price
          else if (match.length === 5) {
            const name = match[1].trim();
            const quantity = parseInt(match[2], 10);
            const unitPrice = parseFloat(match[3]);
            const price = parseFloat(match[4]);
            
            if (name && !isNaN(quantity) && !isNaN(unitPrice) && !isNaN(price)) {
              items.push({
                name,
                price,
                quantity,
                unitPrice,
                confidence: 0.8
              });
              break; // Break pattern loop
            }
          }
        } catch (error) {
          // Skip this line if parsing fails
          continue;
        }
      }
    }
  }
  
  return items;
}

/**
 * Enhance OCR text with detected information
 * @param text Raw OCR text
 * @param sections Detected sections
 * @param lineItems Detected line items
 * @returns Enhanced text
 */
function enhanceText(
  text: string,
  sections: PreprocessedOcrResult['sections'],
  lineItems: LineItem[]
): string {
  // If we have detected all the needed information, we can create
  // a more structured version of the receipt
  if (sections.header && sections.items && sections.totals) {
    // Return enhanced version with clear section markers
    return [
      '--- RECEIPT HEADER ---',
      sections.header,
      '',
      '--- RECEIPT ITEMS ---',
      lineItems.map(item => {
        let itemStr = item.name;
        if (item.quantity && item.unitPrice) {
          itemStr += ` ${item.quantity} @ $${item.unitPrice.toFixed(2)}`;
        }
        itemStr += ` $${item.price.toFixed(2)}`;
        return itemStr;
      }).join('\n'),
      '',
      '--- RECEIPT TOTALS ---',
      sections.totals,
      '',
      sections.footer ? `--- RECEIPT FOOTER ---\n${sections.footer}` : ''
    ].join('\n');
  }
  
  // Otherwise, return the original text with maybe some minor enhancements
  return text;
}

/**
 * Calculate confidence score for the preprocessed result
 * @param sections Detected sections
 * @param lineItems Detected line items
 * @returns Confidence score (0-1)
 */
function calculateConfidence(
  sections: PreprocessedOcrResult['sections'],
  lineItems: LineItem[]
): number {
  let score = 0.5; // Start with medium confidence
  
  // Confidence increases with detected sections
  if (sections.header) score += 0.1;
  if (sections.items) score += 0.1;
  if (sections.totals) score += 0.1;
  if (sections.footer) score += 0.05;
  
  // Confidence increases with line items
  if (lineItems.length > 0) {
    // More items means more confidence (up to a point)
    score += Math.min(0.2, lineItems.length * 0.02);
  } else {
    // No items is a significant issue
    score -= 0.2;
  }
  
  // Ensure score is within valid range
  return Math.max(0, Math.min(1, score));
}