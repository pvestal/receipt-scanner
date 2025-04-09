/**
 * TypeScript interfaces for receipt data models
 */

/**
 * Receipt store information
 */
export interface Store {
    name: string;
    address?: string;
    phone?: string;
    website?: string;
    taxId?: string;
  }
  
  /**
   * Receipt item with price and optional details
   */
  export interface ReceiptItem {
    name: string;
    price: number;
    quantity?: number;
    unitPrice?: number;
    category?: string;
    description?: string;
    discounted?: boolean;
    taxRate?: number;
    // Confidence score for parsing accuracy (0-1)
    confidence: number;
  }
  
  /**
   * Receipt summary totals
   */
  export interface ReceiptTotals {
    subtotal: number;
    tax: number;
    total: number;
    tip?: number;
    discount?: number;
  }
  
  /**
   * Payment information
   */
  export interface PaymentInfo {
    method: 'CASH' | 'CREDIT' | 'DEBIT' | 'OTHER' | string;
    cardType?: string;
    cardLast4?: string;
    transactionId?: string;
  }
  
  /**
   * Complete receipt data model
   */
  export interface Receipt {
    id?: string;
    userId: string;
    store: Store;
    items: ReceiptItem[];
    totals: ReceiptTotals;
    date: Date | string;
    paymentInfo?: PaymentInfo;
    imageUrl?: string;
    rawText?: string;
    createdAt: Date | string;
    updatedAt: Date | string;
    // Overall confidence score for the parsing accuracy (0-1)
    confidence: number;
  }
  
  /**
   * Receipt filter options
   */
  export interface ReceiptFilter {
    startDate?: Date;
    endDate?: Date;
    storeName?: string;
    minTotal?: number;
    maxTotal?: number;
    categories?: string[];
    sortBy?: 'date' | 'total' | 'store';
    sortDirection?: 'asc' | 'desc';
  }
  
  /**
   * Receipt statistics
   */
  export interface ReceiptStatistics {
    totalSpent: number;
    receiptCount: number;
    averageTotal: number;
    mostFrequentStore?: string;
    topCategories: { category: string; amount: number }[];
    spendingByMonth: { month: string; amount: number }[];
  }