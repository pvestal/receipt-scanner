/**
 * Service for processing receipts with OCR and parsing
 */

import { ReceiptParser } from '../parsers/receiptParser';
import { createInitialTemplates } from '../parsers/templateMatcher';
import { Receipt, ReceiptFilter } from '../models/receipt';
import { visionService, OcrResult } from './visionService';
import { sanitizeReceipt } from '../utils/sanitizer';

/**
 * Service for receipt processing operations
 */
export class ReceiptService {
  private receiptParser: ReceiptParser;
  
  /**
   * Create a new receipt service
   */
  constructor() {
    // Initialize with default templates
    const templates = createInitialTemplates();
    this.receiptParser = new ReceiptParser(templates);
  }
  
  /**
   * Process a receipt image with OCR and parsing
   * @param imageUrl URL of the receipt image
   * @param userId User ID of the owner
   * @returns Processed receipt data
   */
  async processReceipt(imageUrl: string, userId: string): Promise<Receipt> {
    try {
      // Step 1: Extract text from image using Google Cloud Vision
      const ocrResult = await this.performOcr(imageUrl);
      
      if (!ocrResult.text) {
        throw new Error('No text extracted from receipt image');
      }
      
      // Step 2: Parse the extracted text
      const parseResult = await this.receiptParser.parse(ocrResult.text, {
        userId,
        imageUrl,
        ocrConfidence: ocrResult.confidence,
        textBlocks: ocrResult.blocks
      });
      
      // Extract the parsed receipt
      const receipt = parseResult.data;
      
      // Check confidence level
      if (receipt.confidence < 0.4) {
        console.warn(`Low confidence (${receipt.confidence.toFixed(2)}) for receipt parsing: ${JSON.stringify(parseResult.errors)}`);
      }
      
      // Sanitize receipt data before returning
      const sanitizedReceipt = sanitizeReceipt({
        ...receipt,
        rawText: ocrResult.text
      });
      
      return sanitizedReceipt;
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw error;
    }
  }
  
  /**
   * Perform OCR on a receipt image
   * @param imageUrl URL of the image
   * @returns OCR result with text and confidence
   */
  private async performOcr(imageUrl: string): Promise<OcrResult> {
    try {
      // Use the specialized receipt processing method
      const result = await visionService.processReceiptImage(imageUrl);
      
      // Log OCR statistics for monitoring
      console.log(`OCR completed for ${imageUrl}: ${result.text.length} characters, ${result.confidence.toFixed(2)} confidence`);
      
      return result;
    } catch (error) {
      console.error('Error in OCR processing:', error);
      throw error;
    }
  }
  
  /**
   * Save processed receipt to database
   * @param receipt Receipt data to save
   * @returns Saved receipt with ID
   */
  async saveReceipt(receipt: Receipt): Promise<Receipt> {
    // Implementation would depend on your database setup
    // For example, using Firestore:
    /*
    const db = admin.firestore();
    const receiptRef = db.collection('receipts').doc();
    
    // Add ID to receipt
    const receiptWithId = {
      ...receipt,
      id: receiptRef.id
    };
    
    // Save to Firestore
    await receiptRef.set(receiptWithId);
    
    return receiptWithId;
    */
    
    // Placeholder implementation
    return {
      ...receipt,
      id: 'generated-id-' + Date.now()
    };
  }
  
  /**
   * Retrieve receipts for a user with optional filtering
   * @param userId User ID
   * @param filter Optional filter criteria
   * @returns Array of receipts
   */
  async getReceiptsForUser(userId: string, filter?: ReceiptFilter): Promise<Receipt[]> {
    // Implementation would depend on your database setup
    // For example, using Firestore:
    /*
    const db = admin.firestore();
    let query = db.collection('receipts').where('userId', '==', userId);
    
    // Apply filters
    if (filter?.startDate) {
      query = query.where('date', '>=', Timestamp.fromDate(filter.startDate));
    }
    
    if (filter?.endDate) {
      query = query.where('date', '<=', Timestamp.fromDate(filter.endDate));
    }
    
    if (filter?.storeName) {
      // Using 'array-contains' for structure.name or direct match for string
      query = query.where(new admin.firestore.FieldPath('store', 'name'), '>=', filter.storeName)
                   .where(new admin.firestore.FieldPath('store', 'name'), '<=', filter.storeName + '\uf8ff');
    }
    
    // Apply sorting
    const sortField = filter?.sortBy || 'date';
    const sortDir = filter?.sortDirection || 'desc';
    
    // For some fields like store, we need to specify the path
    if (sortField === 'store') {
      query = query.orderBy(new admin.firestore.FieldPath('store', 'name'), sortDir);
    } else {
      query = query.orderBy(sortField, sortDir);
    }
    
    const snapshot = await query.get();
    
    // Convert documents to Receipt objects
    let receipts = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        // Convert Timestamps to Date objects
        date: data.date.toDate(),
        createdAt: data.createdAt.toDate(),
        updatedAt: data.updatedAt.toDate()
      } as Receipt;
    });
    
    // Apply additional filters that can't be done in Firestore query
    if (filter?.minTotal) {
      receipts = receipts.filter(receipt => 
        receipt.totals.total >= (filter.minTotal as number));
    }
    
    if (filter?.maxTotal) {
      receipts = receipts.filter(receipt => 
        receipt.totals.total <= (filter.maxTotal as number));
    }
    
    if (filter?.categories && filter.categories.length > 0) {
      receipts = receipts.filter(receipt => 
        receipt.items.some(item => 
          item.category && filter.categories?.includes(item.category)
        )
      );
    }
    
    return receipts;
    */
    
    // Placeholder implementation
    return [];
  }
  
  /**
   * Get receipt by ID
   * @param receiptId Receipt ID
   * @returns Receipt data or null if not found
   */
  async getReceiptById(receiptId: string): Promise<Receipt | null> {
    // Implementation would depend on your database setup
    // For example, using Firestore:
    /*
    const db = admin.firestore();
    const doc = await db.collection('receipts').doc(receiptId).get();
    
    if (!doc.exists) {
      return null;
    }
    
    return doc.data() as Receipt;
    */
    
    // Placeholder implementation
    return null;
  }
  
  /**
   * Update a receipt with corrections
   * @param receiptId Receipt ID
   * @param updates Fields to update
   * @returns Updated receipt
   */
  async updateReceipt(receiptId: string, updates: Partial<Receipt>): Promise<Receipt | null> {
    // Implementation would depend on your database setup
    // For example, using Firestore:
    /*
    const db = admin.firestore();
    const receiptRef = db.collection('receipts').doc(receiptId);
    
    // Add updatedAt timestamp
    const updatedFields = {
      ...updates,
      updatedAt: new Date()
    };
    
    await receiptRef.update(updatedFields);
    
    // Get the updated document
    const updatedDoc = await receiptRef.get();
    
    if (!updatedDoc.exists) {
      return null;
    }
    
    return updatedDoc.data() as Receipt;
    */
    
    // Placeholder implementation
    return null;
  }
  
  /**
   * Delete a receipt
   * @param receiptId Receipt ID
   * @returns Success flag
   */
  async deleteReceipt(receiptId: string): Promise<boolean> {
    // Implementation would depend on your database setup
    // For example, using Firestore:
    /*
    const db = admin.firestore();
    await db.collection('receipts').doc(receiptId).delete();
    return true;
    */
    
    // Placeholder implementation
    return true;
  }
}