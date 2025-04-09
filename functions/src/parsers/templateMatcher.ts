/**
 * Template matcher for identifying and applying store-specific receipt templates
 */

import { ReceiptTemplate } from '../models/receipt';

/**
 * Service for managing and applying store-specific receipt templates
 */
export class TemplateMatcher {
  private templates: ReceiptTemplate[];
  
  /**
   * Create a new template matcher with provided templates
   * @param templates Array of store templates
   */
  constructor(templates: ReceiptTemplate[] = []) {
    this.templates = templates;
  }
  
  /**
   * Add a new template to the collection
   * @param template Template to add
   */
  public addTemplate(template: ReceiptTemplate): void {
    this.templates.push(template);
  }
  
  /**
   * Add multiple templates to the collection
   * @param templates Templates to add
   */
  public addTemplates(templates: ReceiptTemplate[]): void {
    this.templates.push(...templates);
  }
  
  /**
   * Find matching template for the given receipt text
   * @param text Receipt text to match
   * @returns Matching template or null if no match found
   */
  public findMatchingTemplate(text: string): ReceiptTemplate | null {
    if (!text || this.templates.length === 0) {
      return null;
    }
    
    // Clean up text for matching
    const cleanedText = this.cleanText(text);
    
    // Try to find a match among templates
    for (const template of this.templates) {
      for (const pattern of template.storePatterns) {
        try {
          const regex = new RegExp(pattern, 'i');
          if (regex.test(cleanedText)) {
            return template;
          }
        } catch (error) {
          // Skip invalid patterns
          console.error(`Invalid regex pattern in template ${template.storeName}: ${pattern}`);
          continue;
        }
      }
    }
    
    return null;
  }
  
  /**
   * Get all templates for a specific store ID or name
   * @param storeIdentifier Store ID or name
   * @returns Array of matching templates
   */
  public getTemplatesForStore(storeIdentifier: string): ReceiptTemplate[] {
    return this.templates.filter(template => 
      template.storeId === storeIdentifier || 
      template.storeName.toLowerCase() === storeIdentifier.toLowerCase()
    );
  }
  
  /**
   * Clean up text for template matching
   * @param text Text to clean
   */
  private cleanText(text: string): string {
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\s+/g, ' ')
      .trim();
  }
}

/**
 * Create a collection of initial receipt templates for common stores
 * @returns Array of receipt templates
 */
export function createInitialTemplates(): ReceiptTemplate[] {
  return [
    // Walmart template
    {
      storeId: 'walmart',
      storeName: 'Walmart',
      storePatterns: [
        'walmart',
        'wal-mart',
        'save money\\. live better'
      ],
      itemPatterns: [
        '(.+?)\\s+([0-9]+)\\s+([0-9]+\\.[0-9]{2})\\s+([0-9]+\\.[0-9]{2})',
        '(.+?)\\s+([0-9]+\\.[0-9]{2})\\s?([A-Z])?$'
      ],
      totalsPatterns: {
        subtotal: 'subtotal',
        tax: 'tax',
        total: 'total'
      },
      datePatterns: [
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})',
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})\\s+([0-9]{2}:[0-9]{2}:[0-9]{2})'
      ]
    },
    // Target template
    {
      storeId: 'target',
      storeName: 'Target',
      storePatterns: [
        'target',
        'expect more\\. pay less'
      ],
      itemPatterns: [
        '(.+?)\\s+([0-9]+\\.[0-9]{2})\\s?([A-Z])?$',
        '(.+?)\\s+([0-9]+)\\s+@\\s+([0-9]+\\.[0-9]{2})\\s+([0-9]+\\.[0-9]{2})'
      ],
      totalsPatterns: {
        subtotal: 'subtotal',
        tax: 'tax',
        total: 'total'
      },
      datePatterns: [
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})',
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})\\s+([0-9]{2}:[0-9]{2})'
      ]
    },
    // Costco template
    {
      storeId: 'costco',
      storeName: 'Costco',
      storePatterns: [
        'costco',
        'costco wholesale',
        'wholesale'
      ],
      itemPatterns: [
        '([0-9]+)\\s+(.+?)\\s+([0-9]+\\.[0-9]{2})',
        '(.+?)\\s+([0-9]+\\.[0-9]{2})'
      ],
      totalsPatterns: {
        subtotal: 'subtotal',
        tax: 'tax',
        total: 'total'
      },
      datePatterns: [
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})',
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})\\s+([0-9]{2}:[0-9]{2}:[0-9]{2})'
      ]
    },
    // Kroger/Ralph's template
    {
      storeId: 'kroger',
      storeName: 'Kroger',
      storePatterns: [
        'kroger',
        'ralphs',
        'dillons',
        'smith\'s',
        'king soopers',
        'city market',
        'fred meyer'
      ],
      itemPatterns: [
        '(.+?)\\s+([0-9]+)\\s+([0-9]+\\.[0-9]{2})\\s?([A-Z])?$',
        '(.+?)\\s+([0-9]+\\.[0-9]{2})\\s?([A-Z])?$'
      ],
      totalsPatterns: {
        subtotal: 'subtotal',
        tax: 'tax',
        total: 'total'
      },
      datePatterns: [
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})',
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})\\s+([0-9]{2}:[0-9]{2})'
      ]
    },
    // Starbucks template
    {
      storeId: 'starbucks',
      storeName: 'Starbucks',
      storePatterns: [
        'starbucks',
        'starbucks coffee'
      ],
      itemPatterns: [
        '(.+?)\\s+([0-9]+\\.[0-9]{2})',
        '([0-9]+)\\s+(.+?)\\s+([0-9]+\\.[0-9]{2})'
      ],
      totalsPatterns: {
        subtotal: 'subtotal',
        tax: 'tax',
        total: 'total'
      },
      datePatterns: [
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})',
        '([0-9]{2}/[0-9]{2}/[0-9]{2,4})\\s+([0-9]{2}:[0-9]{2})'
      ]
    },
    // Amazon template (for online receipts)
    {
      storeId: 'amazon',
      storeName: 'Amazon',
      storePatterns: [
        'amazon\\.com',
        'amazon',
        'prime'
      ],
      itemPatterns: [
        '(.+?)\\s+([0-9]+\\.[0-9]{2})',
        '(.+?)\\s+([0-9]+)\\s+([0-9]+\\.[0-9]{2})\\s+([0-9]+\\.[0-9]{2})'
      ],
      totalsPatterns: {
        subtotal: 'subtotal|item\\(s\\) subtotal',
        tax: 'tax|sales tax',
        total: 'total|grand total|order total'
      },
      datePatterns: [
        'order date:\\s+([a-z]+ [0-9]{1,2}, [0-9]{4})',
        'order placed:\\s+([a-z]+ [0-9]{1,2}, [0-9]{4})'
      ],
      paymentPatterns: [
        'payment method:\\s+(.+?)\\s',
        'payment information\\s+(.+?)\\s+([0-9]{4})'
      ]
    }
  ];
}