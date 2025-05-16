/**
 * Advanced template matching system for receipt recognition
 * Uses machine learning principles to identify receipt patterns
 */

import { ReceiptTemplate } from '../models/receipt';
import { TextBlock } from '../services/visionService';

/**
 * Template matching result
 */
export interface TemplateMatchResult {
  template: ReceiptTemplate;
  confidence: number;
  matchedRegions: {
    header?: RegionMatch;
    items?: RegionMatch;
    totals?: RegionMatch;
    footer?: RegionMatch;
  };
}

/**
 * Region match information
 */
interface RegionMatch {
  confidence: number;
  region: {
    top: number;
    left: number;
    bottom: number;
    right: number;
  };
  text: string;
}

/**
 * Section type in a receipt
 */
type ReceiptSection = 'header' | 'items' | 'totals' | 'footer';

/**
 * Helper for structured feature detection
 */
interface FeatureDetector {
  name: string;
  detect: (text: string, blocks?: TextBlock[]) => {
    found: boolean;
    confidence: number;
    value?: string | number | Date;
    position?: { top: number; left: number; bottom: number; right: number };
  };
}

/**
 * Advanced template matcher for receipt recognition
 * Uses multiple strategies to identify receipt patterns
 */
export class AdvancedTemplateMatcher {
  private templates: ReceiptTemplate[] = [];
  private featureDetectors: Record<string, FeatureDetector> = {};
  
  /**
   * Create a new advanced template matcher
   * @param templates Array of receipt templates
   */
  constructor(templates: ReceiptTemplate[] = []) {
    this.templates = templates;
    this.initializeFeatureDetectors();
  }
  
  /**
   * Add a template to the collection
   * @param template Template to add
   */
  public addTemplate(template: ReceiptTemplate): void {
    this.templates.push(template);
  }
  
  /**
   * Find the best matching template for the receipt text
   * @param text Receipt text
   * @param textBlocks Structured text blocks from OCR
   * @returns Best template match result or null if no match
   */
  public findBestMatch(
    text: string,
    textBlocks?: TextBlock[]
  ): TemplateMatchResult | null {
    if (!text) {
      return null;
    }
    
    const cleanedText = this.cleanText(text);
    let bestMatch: TemplateMatchResult | null = null;
    let highestScore = 0;
    
    // Try to match each template
    for (const template of this.templates) {
      const match = this.matchTemplate(template, cleanedText, textBlocks);
      
      if (match && match.confidence > highestScore) {
        bestMatch = match;
        highestScore = match.confidence;
      }
    }
    
    // If no match with templates, try feature-based detection
    if (!bestMatch || bestMatch.confidence < 0.6) {
      const genericMatch = this.detectGenericReceipt(cleanedText, textBlocks);
      
      if (genericMatch && (!bestMatch || genericMatch.confidence > bestMatch.confidence)) {
        return genericMatch;
      }
    }
    
    return bestMatch;
  }
  
  /**
   * Match a specific template against receipt text
   * @param template Template to match
   * @param text Receipt text
   * @param textBlocks Structured text blocks
   * @returns Match result or null if no match
   */
  private matchTemplate(
    template: ReceiptTemplate,
    text: string,
    textBlocks?: TextBlock[]
  ): TemplateMatchResult | null {
    // Start with store name patterns
    let storeConfidence = 0;
    
    for (const pattern of template.storePatterns) {
      try {
        const regex = new RegExp(pattern, 'i');
        if (regex.test(text)) {
          storeConfidence += 0.3; // Increment confidence for each matching pattern
        }
      } catch (error) {
        console.warn(`Invalid regex pattern in template ${template.storeName}: ${pattern}`);
      }
    }
    
    // No store name match, no need to continue
    if (storeConfidence === 0) {
      return null;
    }
    
    // Match header section if available
    const headerMatch = this.matchSection(
      template, 
      'header', 
      text, 
      textBlocks
    );
    
    // Match items section
    const itemsMatch = this.matchSection(
      template, 
      'items', 
      text, 
      textBlocks
    );
    
    // Match totals section
    const totalsMatch = this.matchSection(
      template, 
      'totals', 
      text, 
      textBlocks
    );
    
    // Match footer section if available
    const footerMatch = this.matchSection(
      template, 
      'footer', 
      text, 
      textBlocks
    );
    
    // Calculate overall confidence
    const sectionConfidences = [
      storeConfidence,
      headerMatch?.confidence || 0,
      itemsMatch?.confidence || 0,
      totalsMatch?.confidence || 0,
      footerMatch?.confidence || 0
    ];
    
    const nonZeroConfidences = sectionConfidences.filter(c => c > 0);
    const overallConfidence = nonZeroConfidences.length > 0
      ? nonZeroConfidences.reduce((sum, c) => sum + c, 0) / nonZeroConfidences.length
      : 0;
    
    // Return match result if confidence is adequate
    if (overallConfidence > 0.3) {
      return {
        template,
        confidence: overallConfidence,
        matchedRegions: {
          header: headerMatch,
          items: itemsMatch,
          totals: totalsMatch,
          footer: footerMatch
        }
      };
    }
    
    return null;
  }
  
  /**
   * Match a specific section of a template
   * @param template Template to use
   * @param sectionType Section type to match
   * @param text Full receipt text
   * @param textBlocks Structured text blocks
   * @returns Section match or undefined if no match
   */
  private matchSection(
    template: ReceiptTemplate,
    sectionType: ReceiptSection,
    text: string,
    textBlocks?: TextBlock[]
  ): RegionMatch | undefined {
    let patterns: string[] = [];
    
    // Get patterns for the specific section
    switch (sectionType) {
      case 'header':
        patterns = template.headerPatterns || [];
        break;
      case 'items':
        patterns = template.itemPatterns || [];
        break;
      case 'totals':
        patterns = Object.values(template.totalsPatterns || {}).filter(p => p) as string[];
        break;
      case 'footer':
        // Many templates don't define footer patterns
        patterns = template.paymentPatterns || [];
        break;
    }
    
    if (patterns.length === 0) {
      return undefined;
    }
    
    // Match patterns against text
    let matchConfidence = 0;
    let matchedRegion: RegionMatch['region'] | undefined;
    let sectionText = '';
    
    // Try to identify the section region in the structured blocks
    if (textBlocks && textBlocks.length > 0) {
      const sectionRegion = this.identifySectionRegion(sectionType, textBlocks, patterns);
      
      if (sectionRegion) {
        matchedRegion = sectionRegion.region;
        sectionText = sectionRegion.text;
        matchConfidence = sectionRegion.confidence;
      }
    }
    
    // If structured approach failed, try with full text
    if (!matchedRegion) {
      let matchCount = 0;
      
      for (const pattern of patterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(text)) {
            matchCount++;
          }
        } catch (error) {
          // Skip invalid patterns
        }
      }
      
      if (matchCount > 0) {
        matchConfidence = matchCount / patterns.length;
        sectionText = text; // Use full text as we couldn't isolate the section
      }
    }
    
    // Return match if confidence is adequate
    if (matchConfidence > 0) {
      return {
        confidence: matchConfidence,
        region: matchedRegion || { top: 0, left: 0, bottom: 0, right: 0 },
        text: sectionText
      };
    }
    
    return undefined;
  }
  
  /**
   * Try to identify the region for a section using OCR blocks
   * @param sectionType Section type to identify
   * @param textBlocks Text blocks from OCR
   * @param patterns Patterns that identify this section
   * @returns Region information or undefined if not found
   */
  private identifySectionRegion(
    sectionType: ReceiptSection,
    textBlocks: TextBlock[],
    patterns: string[]
  ): RegionMatch | undefined {
    // Strategy depends on section type
    switch (sectionType) {
      case 'header':
        // Headers are typically at the top of the receipt
        return this.identifyHeaderRegion(textBlocks, patterns);
      
      case 'items':
        // Items section usually has a tabular structure
        return this.identifyItemsRegion(textBlocks, patterns);
      
      case 'totals':
        // Totals are typically near the bottom with specific patterns
        return this.identifyTotalsRegion(textBlocks, patterns);
      
      case 'footer':
        // Footer is at the bottom of the receipt
        return this.identifyFooterRegion(textBlocks, patterns);
    }
    
    return undefined;
  }
  
  /**
   * Identify header region in receipt
   * @param textBlocks Text blocks from OCR
   * @param patterns Header patterns
   * @returns Header region or undefined
   */
  private identifyHeaderRegion(
    textBlocks: TextBlock[],
    patterns: string[]
  ): RegionMatch | undefined {
    // Headers are typically at the top 15-20% of the receipt
    const sortedBlocks = [...textBlocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
    
    if (sortedBlocks.length === 0) {
      return undefined;
    }
    
    // Take approximately the top 20% of blocks
    const topBlockCount = Math.max(1, Math.ceil(sortedBlocks.length * 0.2));
    const topBlocks = sortedBlocks.slice(0, topBlockCount);
    
    // Check if any top blocks match header patterns
    let matchingBlocks = topBlocks.filter(block => {
      return patterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(block.text);
        } catch (error) {
          return false;
        }
      });
    });
    
    if (matchingBlocks.length === 0 && topBlocks.length > 0) {
      // If no explicit matches, just assume the top few blocks are the header
      matchingBlocks = topBlocks.slice(0, Math.min(3, topBlocks.length));
    }
    
    if (matchingBlocks.length > 0) {
      // Calculate the bounding region for all matching blocks
      const top = Math.min(...matchingBlocks.map(b => b.boundingBox.y));
      const left = Math.min(...matchingBlocks.map(b => b.boundingBox.x));
      const bottom = Math.max(...matchingBlocks.map(b => b.boundingBox.y + b.boundingBox.height));
      const right = Math.max(...matchingBlocks.map(b => b.boundingBox.x + b.boundingBox.width));
      
      return {
        confidence: matchingBlocks.length / topBlockCount,
        region: { top, left, bottom, right },
        text: matchingBlocks.map(b => b.text).join('\n')
      };
    }
    
    return undefined;
  }
  
  /**
   * Identify items region in receipt
   * @param textBlocks Text blocks from OCR
   * @param patterns Item patterns
   * @returns Items region or undefined
   */
  private identifyItemsRegion(
    textBlocks: TextBlock[],
    patterns: string[]
  ): RegionMatch | undefined {
    // Items typically occupy the middle portion of the receipt
    const sortedBlocks = [...textBlocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
    
    if (sortedBlocks.length === 0) {
      return undefined;
    }
    
    // Look for blocks that match line item patterns
    const matchingBlocks = sortedBlocks.filter(block => {
      // Check if this block contains item patterns
      return patterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(block.text);
        } catch (error) {
          return false;
        }
      });
    });
    
    if (matchingBlocks.length === 0) {
      // If no matches, guess based on position
      const middle = sortedBlocks.length / 2;
      const lowerMiddle = Math.floor(middle * 0.7);
      const upperMiddle = Math.ceil(middle * 1.3);
      const middleBlocks = sortedBlocks.slice(lowerMiddle, upperMiddle);
      
      if (middleBlocks.length > 0) {
        const top = Math.min(...middleBlocks.map(b => b.boundingBox.y));
        const left = Math.min(...middleBlocks.map(b => b.boundingBox.x));
        const bottom = Math.max(...middleBlocks.map(b => b.boundingBox.y + b.boundingBox.height));
        const right = Math.max(...middleBlocks.map(b => b.boundingBox.x + b.boundingBox.width));
        
        return {
          confidence: 0.5, // Lower confidence since this is a guess
          region: { top, left, bottom, right },
          text: middleBlocks.map(b => b.text).join('\n')
        };
      }
      
      return undefined;
    }
    
    // Calculate the bounding region for all matching blocks
    const top = Math.min(...matchingBlocks.map(b => b.boundingBox.y));
    const left = Math.min(...matchingBlocks.map(b => b.boundingBox.x));
    const bottom = Math.max(...matchingBlocks.map(b => b.boundingBox.y + b.boundingBox.height));
    const right = Math.max(...matchingBlocks.map(b => b.boundingBox.x + b.boundingBox.width));
    
    return {
      confidence: Math.min(0.9, matchingBlocks.length / 5), // Cap at 0.9
      region: { top, left, bottom, right },
      text: matchingBlocks.map(b => b.text).join('\n')
    };
  }
  
  /**
   * Identify totals region in receipt
   * @param textBlocks Text blocks from OCR
   * @param patterns Totals patterns
   * @returns Totals region or undefined
   */
  private identifyTotalsRegion(
    textBlocks: TextBlock[],
    patterns: string[]
  ): RegionMatch | undefined {
    // Totals are typically in the bottom third, above any footer
    const sortedBlocks = [...textBlocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
    
    if (sortedBlocks.length === 0) {
      return undefined;
    }
    
    // Focus on the bottom third of the receipt
    const lowerThird = Math.floor(sortedBlocks.length * 0.66);
    const bottomBlocks = sortedBlocks.slice(lowerThird);
    
    // Look for blocks that match totals patterns
    const matchingBlocks = bottomBlocks.filter(block => {
      return patterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(block.text);
        } catch (error) {
          return false;
        }
      });
    });
    
    if (matchingBlocks.length === 0) {
      // If no matches, look for "total" keyword in bottom blocks
      const totalBlocks = bottomBlocks.filter(block => 
        /total|subtotal|sub-total|sum|amount|tax/i.test(block.text)
      );
      
      if (totalBlocks.length > 0) {
        const top = Math.min(...totalBlocks.map(b => b.boundingBox.y));
        const left = Math.min(...totalBlocks.map(b => b.boundingBox.x));
        const bottom = Math.max(...totalBlocks.map(b => b.boundingBox.y + b.boundingBox.height));
        const right = Math.max(...totalBlocks.map(b => b.boundingBox.x + b.boundingBox.width));
        
        return {
          confidence: 0.6,
          region: { top, left, bottom, right },
          text: totalBlocks.map(b => b.text).join('\n')
        };
      }
      
      return undefined;
    }
    
    // Calculate the bounding region for all matching blocks
    const top = Math.min(...matchingBlocks.map(b => b.boundingBox.y));
    const left = Math.min(...matchingBlocks.map(b => b.boundingBox.x));
    const bottom = Math.max(...matchingBlocks.map(b => b.boundingBox.y + b.boundingBox.height));
    const right = Math.max(...matchingBlocks.map(b => b.boundingBox.x + b.boundingBox.width));
    
    return {
      confidence: Math.min(0.9, matchingBlocks.length / 3), // Cap at 0.9
      region: { top, left, bottom, right },
      text: matchingBlocks.map(b => b.text).join('\n')
    };
  }
  
  /**
   * Identify footer region in receipt
   * @param textBlocks Text blocks from OCR
   * @param patterns Footer patterns
   * @returns Footer region or undefined
   */
  private identifyFooterRegion(
    textBlocks: TextBlock[],
    patterns: string[]
  ): RegionMatch | undefined {
    // Footer is typically at the very bottom of the receipt
    const sortedBlocks = [...textBlocks].sort((a, b) => a.boundingBox.y - b.boundingBox.y);
    
    if (sortedBlocks.length === 0) {
      return undefined;
    }
    
    // Take the bottom 10% of blocks
    const bottomBlockCount = Math.max(1, Math.ceil(sortedBlocks.length * 0.1));
    const bottomBlocks = sortedBlocks.slice(-bottomBlockCount);
    
    // Check if any bottom blocks match footer patterns
    let matchingBlocks = bottomBlocks.filter(block => {
      return patterns.some(pattern => {
        try {
          const regex = new RegExp(pattern, 'i');
          return regex.test(block.text);
        } catch (error) {
          return false;
        }
      });
    });
    
    // If no explicit matches, look for typical footer content
    if (matchingBlocks.length === 0) {
      matchingBlocks = bottomBlocks.filter(block => 
        /thank you|come again|receipt|customer copy|merchant copy|return policy|www|http|\.com|follow us/i.test(block.text)
      );
    }
    
    if (matchingBlocks.length > 0) {
      // Calculate the bounding region for all matching blocks
      const top = Math.min(...matchingBlocks.map(b => b.boundingBox.y));
      const left = Math.min(...matchingBlocks.map(b => b.boundingBox.x));
      const bottom = Math.max(...matchingBlocks.map(b => b.boundingBox.y + b.boundingBox.height));
      const right = Math.max(...matchingBlocks.map(b => b.boundingBox.x + b.boundingBox.width));
      
      return {
        confidence: matchingBlocks.length / bottomBlockCount,
        region: { top, left, bottom, right },
        text: matchingBlocks.map(b => b.text).join('\n')
      };
    }
    
    return undefined;
  }
  
  /**
   * Detect receipt structure without a specific template
   * @param text Receipt text
   * @param textBlocks Structured text blocks
   * @returns Generic match result or null
   */
  private detectGenericReceipt(
    text: string,
    textBlocks?: TextBlock[]
  ): TemplateMatchResult | null {
    // Use feature detectors to identify key components
    const storeNameFeature = this.detectFeature('storeName', text, textBlocks);
    const dateFeature = this.detectFeature('date', text, textBlocks);
    const totalsFeature = this.detectFeature('total', text, textBlocks);
    const itemsFeature = this.detectFeature('items', text, textBlocks);
    
    // Calculate confidence based on detected features
    const detectedFeatures = [
      storeNameFeature,
      dateFeature,
      totalsFeature,
      itemsFeature
    ].filter(f => f.found);
    
    if (detectedFeatures.length === 0) {
      return null;
    }
    
    // Calculate average confidence
    const overallConfidence = detectedFeatures.reduce(
      (sum, feature) => sum + feature.confidence, 
      0
    ) / detectedFeatures.length;
    
    // Create a generic template based on detected features
    const genericTemplate: ReceiptTemplate = {
      storeId: 'generic',
      storeName: storeNameFeature.found && typeof storeNameFeature.value === 'string' 
        ? storeNameFeature.value 
        : 'Unknown Store',
      storePatterns: [],
      itemPatterns: [],
      totalsPatterns: {
        total: 'total'
      },
      datePatterns: []
    };
    
    // Determine matched regions
    const matchedRegions: TemplateMatchResult['matchedRegions'] = {};
    
    if (textBlocks && storeNameFeature.found && storeNameFeature.position) {
      matchedRegions.header = {
        confidence: storeNameFeature.confidence,
        region: storeNameFeature.position,
        text: typeof storeNameFeature.value === 'string' ? storeNameFeature.value : ''
      };
    }
    
    if (textBlocks && itemsFeature.found && itemsFeature.position) {
      matchedRegions.items = {
        confidence: itemsFeature.confidence,
        region: itemsFeature.position,
        text: typeof itemsFeature.value === 'string' ? itemsFeature.value : ''
      };
    }
    
    if (textBlocks && totalsFeature.found && totalsFeature.position) {
      matchedRegions.totals = {
        confidence: totalsFeature.confidence,
        region: totalsFeature.position,
        text: typeof totalsFeature.value === 'string' ? totalsFeature.value : ''
      };
    }
    
    return {
      template: genericTemplate,
      confidence: overallConfidence,
      matchedRegions
    };
  }
  
  /**
   * Detect a specific feature in receipt text
   * @param featureName Feature to detect
   * @param text Receipt text
   * @param textBlocks Structured text blocks
   * @returns Detection result
   */
  private detectFeature(
    featureName: string,
    text: string,
    textBlocks?: TextBlock[]
  ): { 
    found: boolean; 
    confidence: number; 
    value?: string | number | Date;
    position?: { top: number; left: number; bottom: number; right: number };
  } {
    const detector = this.featureDetectors[featureName];
    
    if (!detector) {
      return { found: false, confidence: 0 };
    }
    
    return detector.detect(text, textBlocks);
  }
  
  /**
   * Initialize feature detectors
   */
  private initializeFeatureDetectors(): void {
    // Store name detector
    this.featureDetectors.storeName = {
      name: 'Store Name Detector',
      detect: (text, blocks) => {
        // Common store names
        const commonStores = [
          'walmart', 'target', 'costco', 'kroger', 'safeway', 'cvs', 'walgreens',
          'starbucks', 'mcdonald', 'subway', 'taco bell', 'burger king',
          'home depot', 'lowes', 'best buy', 'amazon', 'ebay', 'whole foods',
          'trader joe', 'publix', 'aldi', 'dollar', 'office depot', 'staples'
        ];
        
        // Check first few lines for store name
        const lines = text.split('\n');
        const firstFewLines = lines.slice(0, Math.min(5, lines.length));
        
        // Try to find store name in first few lines
        for (const line of firstFewLines) {
          const cleanLine = line.trim().toLowerCase();
          
          // Check for common store names
          for (const store of commonStores) {
            if (cleanLine.includes(store)) {
              // Find the block containing this store name
              let position;
              if (blocks) {
                const storeBlock = blocks.find(block => 
                  block.text.toLowerCase().includes(store)
                );
                if (storeBlock) {
                  position = storeBlock.boundingBox;
                }
              }
              
              return {
                found: true,
                confidence: 0.9,
                value: line.trim(),
                position: position ? {
                  top: position.y,
                  left: position.x,
                  bottom: position.y + position.height,
                  right: position.x + position.width
                } : undefined
              };
            }
          }
        }
        
        // If no match with common stores, just take first non-empty line
        for (const line of firstFewLines) {
          if (line.trim()) {
            // Find position for this line
            let position;
            if (blocks) {
              const lineBlock = blocks.find(block => 
                block.text.includes(line.trim())
              );
              if (lineBlock) {
                position = lineBlock.boundingBox;
              }
            }
            
            return {
              found: true,
              confidence: 0.5,
              value: line.trim(),
              position: position ? {
                top: position.y,
                left: position.x,
                bottom: position.y + position.height,
                right: position.x + position.width
              } : undefined
            };
          }
        }
        
        return { found: false, confidence: 0 };
      }
    };
    
    // Date detector
    this.featureDetectors.date = {
      name: 'Date Detector',
      detect: (text) => {
        // Common date patterns
        const datePatterns = [
          // MM/DD/YYYY
          /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-](19|20)\d{2}\b/,
          // MM/DD/YY
          /\b(0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])[\/\-]\d{2}\b/,
          // DD/MM/YYYY
          /\b(0?[1-9]|[12][0-9]|3[01])[\/\-](0?[1-9]|1[0-2])[\/\-](19|20)\d{2}\b/,
          // YYYY/MM/DD
          /\b(19|20)\d{2}[\/\-](0?[1-9]|1[0-2])[\/\-](0?[1-9]|[12][0-9]|3[01])\b/,
          // Month DD, YYYY
          /\b(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[,.\s]+(\d{1,2})[,.\s]+(19|20)\d{2}\b/i
        ];
        
        for (const pattern of datePatterns) {
          const match = text.match(pattern);
          if (match) {
            const dateStr = match[0];
            try {
              const date = new Date(dateStr);
              if (!isNaN(date.getTime())) {
                return {
                  found: true,
                  confidence: 0.9,
                  value: date
                };
              }
            } catch (error) {
              // Invalid date format, continue to next pattern
            }
          }
        }
        
        // Look for lines with date-related keywords
        const lines = text.split('\n');
        for (const line of lines) {
          if (/date|time/i.test(line) && /\d{1,2}[\/\-]\d{1,2}/.test(line)) {
            // Extract date-like string from line
            const dateMatch = line.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]?\d{0,4}/);
            if (dateMatch) {
              return {
                found: true,
                confidence: 0.7,
                value: dateMatch[0]
              };
            }
          }
        }
        
        return { found: false, confidence: 0 };
      }
    };
    
    // Total amount detector
    this.featureDetectors.total = {
      name: 'Total Amount Detector',
      detect: (text, blocks) => {
        // Look for total amount patterns
        const totalPatterns = [
          /total[:\s]*[$€£]?(\d+\.\d{2})/i,
          /amount\s*due[:\s]*[$€£]?(\d+\.\d{2})/i,
          /grand\s*total[:\s]*[$€£]?(\d+\.\d{2})/i,
          /balance\s*due[:\s]*[$€£]?(\d+\.\d{2})/i
        ];
        
        for (const pattern of totalPatterns) {
          const match = text.match(pattern);
          if (match && match[1]) {
            const amount = parseFloat(match[1]);
            
            // Find position if blocks available
            let position;
            if (blocks) {
              const totalBlock = blocks.find(block => 
                block.text.match(pattern)
              );
              if (totalBlock) {
                position = totalBlock.boundingBox;
              }
            }
            
            return {
              found: true,
              confidence: 0.9,
              value: amount,
              position: position ? {
                top: position.y,
                left: position.x,
                bottom: position.y + position.height,
                right: position.x + position.width
              } : undefined
            };
          }
        }
        
        // Look for money amounts near the bottom
        const lines = text.split('\n');
        const lowerThird = Math.floor(lines.length * 0.66);
        const bottomLines = lines.slice(lowerThird);
        
        for (const line of bottomLines) {
          // Look for dollar amounts (assuming USD)
          const amountMatch = line.match(/\$?\s?(\d+\.\d{2})/);
          if (amountMatch && amountMatch[1]) {
            const amount = parseFloat(amountMatch[1]);
            
            // If amount is reasonably large (probably a total, not an item)
            if (amount > 5) {
              // Find position if blocks available
              let position;
              if (blocks) {
                const lineBlock = blocks.find(block => 
                  block.text.includes(line.trim())
                );
                if (lineBlock) {
                  position = lineBlock.boundingBox;
                }
              }
              
              return {
                found: true,
                confidence: 0.6,
                value: amount,
                position: position ? {
                  top: position.y,
                  left: position.x,
                  bottom: position.y + position.height,
                  right: position.x + position.width
                } : undefined
              };
            }
          }
        }
        
        return { found: false, confidence: 0 };
      }
    };
    
    // Items detector
    this.featureDetectors.items = {
      name: 'Items Detector',
      detect: (text, blocks) => {
        // Split text into lines
        const lines = text.split('\n');
        
        // Look for item patterns (price at end of line)
        const itemLines = lines.filter(line => 
          /(.+?)\s+\$?(\d+\.\d{2})$/.test(line)
        );
        
        if (itemLines.length > 2) {
          // Find the region containing these items
          let position;
          if (blocks) {
            // Get start and end item lines
            const firstItem = itemLines[0];
            const lastItem = itemLines[itemLines.length - 1];
            
            // Find blocks containing these lines
            const firstBlock = blocks.find(block => 
              block.text.includes(firstItem.trim())
            );
            
            const lastBlock = blocks.find(block => 
              block.text.includes(lastItem.trim())
            );
            
            if (firstBlock && lastBlock) {
              position = {
                top: Math.min(firstBlock.boundingBox.y, lastBlock.boundingBox.y),
                left: Math.min(firstBlock.boundingBox.x, lastBlock.boundingBox.x),
                bottom: Math.max(
                  firstBlock.boundingBox.y + firstBlock.boundingBox.height,
                  lastBlock.boundingBox.y + lastBlock.boundingBox.height
                ),
                right: Math.max(
                  firstBlock.boundingBox.x + firstBlock.boundingBox.width,
                  lastBlock.boundingBox.x + lastBlock.boundingBox.width
                )
              };
            }
          }
          
          return {
            found: true,
            confidence: Math.min(0.9, itemLines.length / 10), // Cap at 0.9
            value: itemLines.join('\n'),
            position
          };
        }
        
        return { found: false, confidence: 0 };
      }
    };
  }
  
  /**
   * Clean up text for matching
   * @param text Text to clean
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }
}