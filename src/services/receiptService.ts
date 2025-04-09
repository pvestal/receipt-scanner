/**
 * Service for interacting with the receipt API
 */

import { httpsCallable, getFunctions } from "firebase/functions";
import { ref, uploadBytes, getDownloadURL, getStorage } from "firebase/storage";
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  getDocs, 
  getDoc, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  Timestamp,
  getFirestore 
} from "firebase/firestore";
import type { Receipt, ReceiptFilter } from "../models/receipt";
import { auth } from "../../src/firebase/firebase";

/**
 * Service for receipt-related operations
 */
export class ReceiptService {
  private db = getFirestore();
  private storage = getStorage();
  private functions = getFunctions();
  
  /**
   * Upload a receipt image and process it
   * @param file Image file to upload
   * @returns Processed receipt data
   */
  async uploadAndProcessReceipt(file: File): Promise<Receipt> {
    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be signed in to upload receipts");
      }
      
      // Upload image to Firebase Storage
      const storageRef = ref(this.storage, `users/${currentUser.uid}/receipts/${Date.now()}_${file.name}`);
      const snapshot = await uploadBytes(storageRef, file);
      
      // Get download URL
      const downloadURL = await getDownloadURL(snapshot.ref);
      
      // Process receipt using Cloud Function
      const processReceipt = httpsCallable<{ imageUrl: string }, Receipt>(
        this.functions, 
        'processReceipt'
      );
      
      const result = await processReceipt({ imageUrl: downloadURL });
      
      return result.data;
    } catch (error) {
      console.error("Error uploading and processing receipt:", error);
      throw error;
    }
  }
  
  /**
   * Save a receipt to Firestore
   * @param receipt Receipt to save
   * @returns Saved receipt with ID
   */
  async saveReceipt(receipt: Receipt): Promise<Receipt> {
    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be signed in to save receipts");
      }
      
      // Add user ID if not present
      if (!receipt.userId) {
        receipt.userId = currentUser.uid;
      }
      
      // Add timestamps if not present
      if (!receipt.createdAt) {
        receipt.createdAt = new Date();
      }
      
      receipt.updatedAt = new Date();
      
      // Convert Date objects to Firestore Timestamps
      const receiptToSave = this.convertDatesToTimestamps(receipt);
      
      // If receipt has an ID, update it
      if (receipt.id) {
        const receiptRef = doc(this.db, "receipts", receipt.id);
        await updateDoc(receiptRef, receiptToSave);
        return receipt;
      } 
      // Otherwise create a new receipt
      else {
        const receiptsCollection = collection(this.db, "receipts");
        const docRef = await addDoc(receiptsCollection, receiptToSave);
        return { ...receipt, id: docRef.id };
      }
    } catch (error) {
      console.error("Error saving receipt:", error);
      throw error;
    }
  }
  
  /**
   * Get receipts for the current user with optional filtering
   * @param filter Optional filter criteria
   * @returns Array of receipts
   */
  async getReceipts(filter?: ReceiptFilter): Promise<Receipt[]> {
    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be signed in to view receipts");
      }
      
      // Start with base query for user's receipts
      let q = query(
        collection(this.db, "receipts"),
        where("userId", "==", currentUser.uid)
      );
      
      // Apply date filters if provided
      if (filter?.startDate) {
        q = query(q, where("date", ">=", Timestamp.fromDate(filter.startDate)));
      }
      
      if (filter?.endDate) {
        q = query(q, where("date", "<=", Timestamp.fromDate(filter.endDate)));
      }
      
      // Apply sorting
      const sortField = filter?.sortBy || "date";
      const sortDir = filter?.sortDirection || "desc";
      q = query(q, orderBy(sortField, sortDir));
      
      // Execute query
      const querySnapshot = await getDocs(q);
      
      // Convert documents to Receipt objects
      const receipts: Receipt[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        // Convert Firestore Timestamps to Date objects
        const receipt = this.convertTimestampsToDate({
          ...data,
          id: doc.id
        } as Receipt);
        
        // Apply additional filtering in memory (not in Firestore query)
        if (this.matchesFilter(receipt, filter)) {
          receipts.push(receipt);
        }
      });
      
      return receipts;
    } catch (error) {
      console.error("Error getting receipts:", error);
      throw error;
    }
  }
  
  /**
   * Get a single receipt by ID
   * @param id Receipt ID
   * @returns Receipt or null if not found
   */
  async getReceiptById(id: string): Promise<Receipt | null> {
    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be signed in to view receipts");
      }
      
      // Get the receipt document
      const receiptRef = doc(this.db, "receipts", id);
      const receiptDoc = await getDoc(receiptRef);
      
      if (!receiptDoc.exists()) {
        return null;
      }
      
      // Get the data and check ownership
      const data = receiptDoc.data() as Receipt;
      
      if (data.userId !== currentUser.uid) {
        throw new Error("You don't have permission to view this receipt");
      }
      
      // Convert timestamps and return
      return this.convertTimestampsToDate({
        ...data,
        id: receiptDoc.id
      });
    } catch (error) {
      console.error("Error getting receipt:", error);
      throw error;
    }
  }
  
  /**
   * Update a receipt
   * @param id Receipt ID
   * @param updates Fields to update
   * @returns Updated receipt
   */
  async updateReceipt(id: string, updates: Partial<Receipt>): Promise<Receipt> {
    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be signed in to update receipts");
      }
      
      // Get the receipt first to verify ownership
      const receiptRef = doc(this.db, "receipts", id);
      const receiptDoc = await getDoc(receiptRef);
      
      if (!receiptDoc.exists()) {
        throw new Error("Receipt not found");
      }
      
      const existingReceipt = receiptDoc.data() as Receipt;
      
      if (existingReceipt.userId !== currentUser.uid) {
        throw new Error("You don't have permission to update this receipt");
      }
      
      // Add updated timestamp
      updates.updatedAt = new Date();
      
      // Convert dates to timestamps
      const updatesToSave = this.convertDatesToTimestamps(updates);
      
      // Update the document
      await updateDoc(receiptRef, updatesToSave);
      
      // Get and return the updated receipt
      const updatedDoc = await getDoc(receiptRef);
      
      return this.convertTimestampsToDate({
        ...updatedDoc.data() as Receipt,
        id: updatedDoc.id
      });
    } catch (error) {
      console.error("Error updating receipt:", error);
      throw error;
    }
  }
  
  /**
   * Delete a receipt
   * @param id Receipt ID
   */
  async deleteReceipt(id: string): Promise<void> {
    try {
      // Ensure user is authenticated
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error("You must be signed in to delete receipts");
      }
      
      // Get the receipt first to verify ownership
      const receiptRef = doc(this.db, "receipts", id);
      const receiptDoc = await getDoc(receiptRef);
      
      if (!receiptDoc.exists()) {
        throw new Error("Receipt not found");
      }
      
      const receipt = receiptDoc.data() as Receipt;
      
      if (receipt.userId !== currentUser.uid) {
        throw new Error("You don't have permission to delete this receipt");
      }
      
      // Delete the receipt
      await deleteDoc(receiptRef);
      
      // If there's an image, delete it from storage
      if (receipt.imageUrl) {
        try {
          const imageRef = ref(this.storage, receipt.imageUrl);
          await deleteDoc(receiptRef);
        } catch (storageError) {
          console.warn("Could not delete receipt image:", storageError);
          // Continue even if image deletion fails
        }
      }
    } catch (error) {
      console.error("Error deleting receipt:", error);
      throw error;
    }
  }
  
  /**
   * Check if a receipt matches the provided filter
   * @param receipt Receipt to check
   * @param filter Filter criteria
   */
  private matchesFilter(receipt: Receipt, filter?: ReceiptFilter): boolean {
    if (!filter) return true;
    
    // Store name filter
    if (filter.storeName && 
        !receipt.store.name.toLowerCase().includes(filter.storeName.toLowerCase())) {
      return false;
    }
    
    // Total amount filters
    if (filter.minTotal !== undefined && receipt.totals.total < filter.minTotal) {
      return false;
    }
    
    if (filter.maxTotal !== undefined && receipt.totals.total > filter.maxTotal) {
      return false;
    }
    
    // Category filters
    if (filter.categories && filter.categories.length > 0) {
      // Check if any item has a matching category
      const hasMatchingCategory = receipt.items.some(item => 
        item.category && filter.categories?.includes(item.category)
      );
      
      if (!hasMatchingCategory) {
        return false;
      }
    }
    
    return true;
  }
  
  /**
   * Convert Date objects to Firestore Timestamps for storage
   * @param receipt Receipt or partial receipt with Date objects
   */
  private convertDatesToTimestamps(receipt: Partial<Receipt>): Record<string, any> {
    const result: Record<string, any> = { ...receipt };
    
    // Convert date fields to Firestore Timestamps
    if (receipt.date instanceof Date) {
      result.date = Timestamp.fromDate(receipt.date);
    }
    
    if (receipt.createdAt instanceof Date) {
      result.createdAt = Timestamp.fromDate(receipt.createdAt);
    }
    
    if (receipt.updatedAt instanceof Date) {
      result.updatedAt = Timestamp.fromDate(receipt.updatedAt);
    }
    
    return result;
  }
  
  /**
   * Convert Firestore Timestamps to JavaScript Date objects
   * @param receipt Receipt with Firestore Timestamps
   */
  private convertTimestampsToDate(receipt: Receipt): Receipt {
    // Convert Firestore Timestamps to Date objects
    if (receipt.date && typeof receipt.date !== 'string') {
      receipt.date = (receipt.date as unknown as Timestamp).toDate();
    }
    
    if (receipt.createdAt && typeof receipt.createdAt !== 'string') {
      receipt.createdAt = (receipt.createdAt as unknown as Timestamp).toDate();
    }
    
    if (receipt.updatedAt && typeof receipt.updatedAt !== 'string') {
      receipt.updatedAt = (receipt.updatedAt as unknown as Timestamp).toDate();
    }
    
    return receipt;
  }
}

// Export a singleton instance
export const receiptService = new ReceiptService();