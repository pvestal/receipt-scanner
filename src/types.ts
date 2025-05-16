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
  id: string;
  name: string;
  price: number;
  quantity: number;
  unitPrice?: number;
  category?: string;
  description?: string;
  discounted?: boolean;
  taxRate?: number;
  confidence?: number;
  isEdited?: boolean;
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
  store: Store | string; // Support both new structured data and legacy string
  items: ReceiptItem[];
  totals?: ReceiptTotals;
  subtotal: number;  // Legacy support
  tax: number;       // Legacy support
  total: number;     // Legacy support
  date: Date;
  paymentInfo?: PaymentInfo;
  imageUrl?: string;
  rawText?: string;
  createdAt: Date;
  updatedAt: Date;
  confidence?: number;
}

/**
 * Partial receipt for extraction results
 */
export interface ExtractedReceipt {
  store?: Store | string;
  date?: Date | string;
  items?: Partial<ReceiptItem>[];
  totals?: Partial<ReceiptTotals>;
  subtotal?: number;
  tax?: number;
  total?: number;
  paymentInfo?: Partial<PaymentInfo>;
  rawText?: string;
  confidence?: number;
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

/**
 * User interface
 */
export interface User {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  preferences?: UserPreferences;
}

/**
 * User preferences
 */
export interface UserPreferences {
  defaultView?: 'list' | 'grid';
  theme?: 'light' | 'dark' | 'system';
  currency?: string;
  dateFormat?: string;
}

/**
 * Receipt parsing response from Cloud Function
 */
export interface ReceiptParsingResponse {
  success: boolean;
  data?: ExtractedReceipt;
  rawText?: string;
  confidence?: number;
  errors?: string[];
}