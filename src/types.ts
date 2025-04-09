// Receipt item interface
export interface ReceiptItem {
    id: string;
    name: string;
    price: number;
    quantity: number;
    category?: string;
    isEdited?: boolean;
  }
  
  // Full receipt interface
  export interface Receipt {
    id: string;
    store: string;
    date: Date;
    items: ReceiptItem[];
    subtotal: number;
    tax: number;
    total: number;
    imageUrl?: string;
    userId: string;
    createdAt: Date;
    updatedAt: Date;
  }
  
  // Partial receipt for extraction results
  export interface ExtractedReceipt {
    store?: string;
    date?: string;
    items?: Partial<ReceiptItem>[];
    subtotal?: number;
    tax?: number;
    total?: number;
    rawText?: string;
  }
  
  // User interface
  export interface User {
    uid: string;
    email: string;
    displayName?: string;
  }
  
  // Receipt parsing response from Cloud Function
  export interface ReceiptParsingResponse {
    success: boolean;
    extractedData?: ExtractedReceipt;
    rawText?: string;
    error?: string;
  }