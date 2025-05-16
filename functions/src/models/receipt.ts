/**
 * Types and interfaces for receipt data
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
  id?: string;  // Added to match frontend
  name: string;
  price: number;
  quantity?: number;
  unitPrice?: number;
  category?: string;
  description?: string;
  discounted?: boolean;
  taxRate?: number;
  isEdited?: boolean;  // Added to match frontend
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
  // For backward compatibility with frontend
  subtotal?: number;
  tax?: number;
  total?: number;
  date: Date;
  paymentInfo?: PaymentInfo;
  imageUrl?: string;
  rawText?: string;
  createdAt: Date;
  updatedAt: Date;
  // Overall confidence score for the parsing accuracy (0-1)
  confidence: number;
}

/**
 * Parser result with confidence levels
 */
export interface ParserResult<T> {
  data: T;
  confidence: number;
  errors?: string[];
}

/**
 * Receipt template for specific stores
 */
export interface ReceiptTemplate {
  storeId: string;
  storeName: string;
  storePatterns: string[]; // Regex patterns to identify the store
  headerPatterns?: string[]; // Patterns for header section
  itemPatterns: string[]; // Patterns for line items
  totalsPatterns: {
    subtotal?: string;
    tax?: string;
    total: string;
    tip?: string;
    discount?: string;
  };
  datePatterns: string[];
  paymentPatterns?: string[];
  // Additional metadata for parsing logic
  metadata?: Record<string, any>;
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