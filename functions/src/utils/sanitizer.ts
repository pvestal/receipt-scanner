/**
 * Input sanitization utilities for cloud functions
 */

import * as sanitizeHtml from 'sanitize-html';
import { Receipt, ReceiptItem, Store } from '../models/receipt';

/**
 * Sanitize a string to prevent XSS attacks
 * @param input String to sanitize
 * @returns Sanitized string
 */
export function sanitizeString(input: string | undefined | null): string {
  if (input === undefined || input === null) {
    return '';
  }
  
  // Remove HTML tags and potentially dangerous content
  const sanitized = sanitizeHtml(input, {
    allowedTags: [],      // No HTML tags allowed
    allowedAttributes: {}, // No attributes allowed
    disallowedTagsMode: 'recursiveEscape',
  });
  
  return sanitized.trim();
}

/**
 * Sanitize a number to ensure it's valid
 * @param input Number or string to sanitize
 * @param defaultValue Default value if input is invalid
 * @returns Sanitized number
 */
export function sanitizeNumber(
  input: number | string | undefined | null, 
  defaultValue = 0
): number {
  if (input === undefined || input === null) {
    return defaultValue;
  }
  
  let num: number;
  
  // Parse string to number if needed
  if (typeof input === 'string') {
    // Remove any non-numeric characters except decimal point
    const cleaned = input.replace(/[^\d.-]/g, '');
    num = parseFloat(cleaned);
  } else {
    num = input;
  }
  
  // Check if result is a valid number
  if (isNaN(num) || !isFinite(num)) {
    return defaultValue;
  }
  
  return num;
}

/**
 * Sanitize store information
 * @param store Store object to sanitize
 * @returns Sanitized store object
 */
export function sanitizeStore(store: Store | string | undefined): Store {
  // If store is undefined or null, return empty store
  if (!store) {
    return { name: '' };
  }
  
  // If store is a string (backward compatibility), convert to Store object
  if (typeof store === 'string') {
    return { name: sanitizeString(store) };
  }
  
  // Return sanitized store object
  return {
    name: sanitizeString(store.name),
    address: sanitizeString(store.address),
    phone: sanitizeString(store.phone),
    website: sanitizeString(store.website),
    taxId: sanitizeString(store.taxId),
  };
}

/**
 * Sanitize a receipt item
 * @param item Receipt item to sanitize
 * @returns Sanitized receipt item
 */
export function sanitizeReceiptItem(item: Partial<ReceiptItem>): ReceiptItem {
  return {
    id: item.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    name: sanitizeString(item.name) || 'Unknown Item',
    price: sanitizeNumber(item.price),
    quantity: sanitizeNumber(item.quantity, 1),
    unitPrice: item.unitPrice !== undefined ? sanitizeNumber(item.unitPrice) : undefined,
    category: sanitizeString(item.category),
    description: sanitizeString(item.description),
    discounted: !!item.discounted,
    taxRate: item.taxRate !== undefined ? sanitizeNumber(item.taxRate) : undefined,
    isEdited: !!item.isEdited,
    confidence: item.confidence !== undefined ? Math.min(1, Math.max(0, sanitizeNumber(item.confidence))) : 0.5,
  };
}

/**
 * Sanitize an entire receipt object
 * @param receipt Receipt to sanitize
 * @returns Sanitized receipt
 */
export function sanitizeReceipt(receipt: Partial<Receipt>): Receipt {
  // Ensure items is an array
  const items = Array.isArray(receipt.items) 
    ? receipt.items.map(item => sanitizeReceiptItem(item))
    : [];
  
  // Calculate totals if not provided or incomplete
  const subtotal = receipt.subtotal !== undefined 
    ? sanitizeNumber(receipt.subtotal) 
    : (receipt.totals?.subtotal !== undefined 
        ? sanitizeNumber(receipt.totals.subtotal) 
        : items.reduce((sum, item) => sum + item.price, 0));
  
  const tax = receipt.tax !== undefined 
    ? sanitizeNumber(receipt.tax) 
    : (receipt.totals?.tax !== undefined 
        ? sanitizeNumber(receipt.totals.tax) 
        : 0);
  
  const total = receipt.total !== undefined 
    ? sanitizeNumber(receipt.total) 
    : (receipt.totals?.total !== undefined 
        ? sanitizeNumber(receipt.totals.total) 
        : subtotal + tax);
  
  // Create sanitized receipt object
  return {
    id: receipt.id,
    userId: sanitizeString(receipt.userId) || '',
    store: sanitizeStore(receipt.store),
    items,
    totals: {
      subtotal,
      tax,
      total,
      tip: receipt.totals?.tip !== undefined ? sanitizeNumber(receipt.totals.tip) : undefined,
      discount: receipt.totals?.discount !== undefined ? sanitizeNumber(receipt.totals.discount) : undefined,
    },
    // Include legacy fields for backward compatibility
    subtotal,
    tax,
    total,
    date: receipt.date instanceof Date ? receipt.date : new Date(receipt.date || Date.now()),
    paymentInfo: receipt.paymentInfo ? {
      method: sanitizeString(receipt.paymentInfo.method) || 'OTHER',
      cardType: sanitizeString(receipt.paymentInfo.cardType),
      cardLast4: sanitizeString(receipt.paymentInfo.cardLast4),
      transactionId: sanitizeString(receipt.paymentInfo.transactionId),
    } : undefined,
    imageUrl: sanitizeString(receipt.imageUrl),
    rawText: sanitizeString(receipt.rawText),
    createdAt: receipt.createdAt instanceof Date ? receipt.createdAt : new Date(receipt.createdAt || Date.now()),
    updatedAt: receipt.updatedAt instanceof Date ? receipt.updatedAt : new Date(receipt.updatedAt || Date.now()),
    confidence: receipt.confidence !== undefined ? Math.min(1, Math.max(0, sanitizeNumber(receipt.confidence))) : 0.5,
  };
}