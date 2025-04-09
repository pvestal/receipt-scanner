/**
 * Service for processing receipts with OCR and parsing
 */

import { ReceiptParser } from '../parsers/receiptParser';
import { createInitialTemplates } from '../parsers/templateMatcher';
import { Receipt } from '../models/receipt';
import { ImageAnnotatorClient } from '@google-cloud/vision';

/**
 * Service for receipt processing operations
 */
export class ReceiptService {
  private receiptParser: ReceiptParser;
  private visionClient: ImageAnnotatorClient;
  
  /**
   * Create a new receipt service
   */
  constructor() {
    // Initialize with default templates
    const templates = createInitialTemplates();
    this.receiptParser = new ReceiptParser(templates);
    
    // Initialize Vision API client
    this.visionClient = new ImageAnnotatorClient();
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
      const ocrText = await this.extractTextFromImage(imageUrl);
      
      if (!ocrText) {
        throw new Error('No text extracted from receipt image');
      }
      
      // Step 2: Parse the extracted text
      const parseResult = await this.receiptParser.parse(ocrText, {
        userId,
        imageUrl
      });
      
      // Extract the parsed receipt
      const receipt = parseResult.data;
      
      // Check confidence level
      if (receipt.confidence < 0.4) {
        console.warn(`Low confidence (${receipt.confidence.toFixed(2)}) for receipt parsing: ${JSON.stringify(parseResult.errors)}`);
      }
      
      return receipt;
    } catch (error) {
      console.error('Error processing receipt:', error);
      throw error;
    }
  }
  
  /**
   * Extract text from an image using Google Cloud Vision
   * @param imageUrl URL of the image
   * @returns Extracted text
   */
  private async extractTextFromImage(imageUrl: string): Promise<string> {
    try {
      // Detect text in the image
      const [result] = await this.visionClient.textDetection(imageUrl);
      const detections = result.textAnnotations;
      
      if (!detections || detections.length === 0) {
        throw new Error('No text detected in the image');
      }
      
      // The first annotation contains the entire text
      const fullText = detections[0].description;
      
      if (!fullText) {
        throw new Error('Empty text detected in the image');
      }
      
      return fullText;
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
   * Retrieve receipts for a user
   * @param userId User ID
   * @returns Array of receipts
   */
  async getReceiptsForUser(userId: string): Promise<Receipt[]> {
    // Implementation would depend on your database setup
    // For example, using Firestore:
    /*
    const db = admin.firestore();
    const snapshot = await db.collection('receipts')
      .where('userId', '==', userId)
      .orderBy('date', 'desc')
      .get();
    
    return snapshot.docs.map(doc => doc.data() as Receipt);
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