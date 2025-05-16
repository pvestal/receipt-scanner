/**
 * Controller for receipt-related HTTP endpoints
 */

import { Request, Response } from 'express';
import { ReceiptService } from '../services/receiptService';
import { Receipt, ReceiptFilter } from '../models/receipt';
import { sanitizeReceipt, sanitizeString } from '../utils/sanitizer';

/**
 * Error response interface
 */
interface ErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

/**
 * Controller for handling receipt-related HTTP requests
 */
export class ReceiptController {
  private receiptService: ReceiptService;
  
  /**
   * Create a new receipt controller
   */
  constructor() {
    this.receiptService = new ReceiptService();
  }
  
  /**
   * Process a receipt image
   * @param req HTTP request
   * @param res HTTP response
   */
  async processReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { imageUrl, userId } = req.body as { imageUrl?: string; userId?: string };
      
      // Validate required parameters
      if (!imageUrl || typeof imageUrl !== 'string') {
        this.sendError(res, 400, 'Missing or invalid parameter: imageUrl');
        return;
      }
      
      if (!userId || typeof userId !== 'string') {
        this.sendError(res, 400, 'Missing or invalid parameter: userId');
        return;
      }
      
      // Sanitize inputs
      const sanitizedImageUrl = sanitizeString(imageUrl);
      const sanitizedUserId = sanitizeString(userId);
      
      // Process the receipt
      const result = await this.receiptService.processReceipt(sanitizedImageUrl, sanitizedUserId);
      
      // Return the sanitized result
      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing receipt:', error);
      this.handleError(res, error, 'Failed to process receipt');
    }
  }
  
  /**
   * Save a receipt to the database
   * @param req HTTP request
   * @param res HTTP response
   */
  async saveReceipt(req: Request, res: Response): Promise<void> {
    try {
      const receipt = req.body as Partial<Receipt>;
      
      // Basic validation before sanitization
      if (!receipt) {
        this.sendError(res, 400, 'Missing receipt data');
        return;
      }
      
      // Perform detailed validation
      if (!receipt.userId || typeof receipt.userId !== 'string') {
        this.sendError(res, 400, 'Missing or invalid userId');
        return;
      }
      
      if (!receipt.store) {
        this.sendError(res, 400, 'Missing store information');
        return;
      }
      
      if (!receipt.items || !Array.isArray(receipt.items) || receipt.items.length === 0) {
        this.sendError(res, 400, 'Missing or invalid items array');
        return;
      }
      
      // Sanitize the receipt data
      const sanitizedReceipt = sanitizeReceipt(receipt);
      
      // Save the sanitized receipt
      const savedReceipt = await this.receiptService.saveReceipt(sanitizedReceipt);
      
      // Return the saved receipt
      res.status(201).json(savedReceipt);
    } catch (error) {
      console.error('Error saving receipt:', error);
      this.handleError(res, error, 'Failed to save receipt');
    }
  }
  
  /**
   * Get all receipts for a user
   * @param req HTTP request
   * @param res HTTP response
   */
  async getReceiptsForUser(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      if (!userId || typeof userId !== 'string') {
        this.sendError(res, 400, 'Missing or invalid parameter: userId');
        return;
      }
      
      const sanitizedUserId = sanitizeString(userId);
      
      // Get filter parameters and sanitize them
      const filter: ReceiptFilter = {};
      
      // Parse and sanitize query parameters
      try {
        if (req.query.startDate) {
          const startDate = new Date(req.query.startDate as string);
          // Check if the date is valid
          if (!isNaN(startDate.getTime())) {
            filter.startDate = startDate;
          }
        }
        
        if (req.query.endDate) {
          const endDate = new Date(req.query.endDate as string);
          // Check if the date is valid
          if (!isNaN(endDate.getTime())) {
            filter.endDate = endDate;
          }
        }
        
        if (req.query.storeName) {
          filter.storeName = sanitizeString(req.query.storeName as string);
        }
        
        if (req.query.minTotal) {
          const minTotal = parseFloat(req.query.minTotal as string);
          // Check if the number is valid
          if (!isNaN(minTotal)) {
            filter.minTotal = minTotal;
          }
        }
        
        if (req.query.maxTotal) {
          const maxTotal = parseFloat(req.query.maxTotal as string);
          // Check if the number is valid
          if (!isNaN(maxTotal)) {
            filter.maxTotal = maxTotal;
          }
        }
        
        if (req.query.categories) {
          // Split by comma and sanitize each category
          filter.categories = (req.query.categories as string)
            .split(',')
            .map(category => sanitizeString(category))
            .filter(category => category.length > 0); // Remove empty categories
        }
        
        // Validate sort parameters
        if (req.query.sortBy) {
          const sortBy = req.query.sortBy as string;
          if (['date', 'total', 'store'].includes(sortBy)) {
            filter.sortBy = sortBy as 'date' | 'total' | 'store';
          }
        }
        
        if (req.query.sortDirection) {
          const sortDirection = req.query.sortDirection as string;
          if (['asc', 'desc'].includes(sortDirection)) {
            filter.sortDirection = sortDirection as 'asc' | 'desc';
          }
        }
      } catch (filterError) {
        // Log the error but continue with default filter
        console.warn('Error parsing filter parameters:', filterError);
      }
      
      // Get receipts for the user
      const receipts = await this.receiptService.getReceiptsForUser(sanitizedUserId, filter);
      
      // Return the receipts
      res.status(200).json(receipts);
    } catch (error) {
      console.error('Error getting receipts:', error);
      this.handleError(res, error, 'Failed to get receipts');
    }
  }
  
  /**
   * Get a receipt by ID
   * @param req HTTP request
   * @param res HTTP response
   */
  async getReceiptById(req: Request, res: Response): Promise<void> {
    try {
      const { receiptId } = req.params;
      
      if (!receiptId || typeof receiptId !== 'string') {
        this.sendError(res, 400, 'Missing or invalid parameter: receiptId');
        return;
      }
      
      // Sanitize the receipt ID
      const sanitizedReceiptId = sanitizeString(receiptId);
      
      // Get the receipt
      const receipt = await this.receiptService.getReceiptById(sanitizedReceiptId);
      
      if (!receipt) {
        this.sendError(res, 404, 'Receipt not found');
        return;
      }
      
      // Return the receipt
      res.status(200).json(receipt);
    } catch (error) {
      console.error('Error getting receipt:', error);
      this.handleError(res, error, 'Failed to get receipt');
    }
  }
  
  /**
   * Update a receipt
   * @param req HTTP request
   * @param res HTTP response
   */
  async updateReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { receiptId } = req.params;
      const updates = req.body as Partial<Receipt>;
      
      // Validate parameters
      if (!receiptId || typeof receiptId !== 'string') {
        this.sendError(res, 400, 'Missing or invalid parameter: receiptId');
        return;
      }
      
      const sanitizedReceiptId = sanitizeString(receiptId);
      
      // Validate update data
      if (!updates || Object.keys(updates).length === 0) {
        this.sendError(res, 400, 'No updates provided');
        return;
      }
      
      // Sanitize all updates
      // For partial updates, we only sanitize the fields that are provided
      const sanitizedUpdates: Partial<Receipt> = {};
      
      // Sanitize primitive fields
      if ('userId' in updates) {
        sanitizedUpdates.userId = sanitizeString(updates.userId);
      }
      
      if ('imageUrl' in updates) {
        sanitizedUpdates.imageUrl = sanitizeString(updates.imageUrl);
      }
      
      if ('rawText' in updates) {
        sanitizedUpdates.rawText = sanitizeString(updates.rawText);
      }
      
      // Handle date conversion if it's a string
      if (updates.date) {
        sanitizedUpdates.date = typeof updates.date === 'string' 
          ? new Date(updates.date) 
          : updates.date;
      }
      
      // Handle complex objects
      if (updates.store) {
        sanitizedUpdates.store = typeof updates.store === 'string'
          ? { name: sanitizeString(updates.store) }
          : {
              name: sanitizeString(updates.store.name),
              address: sanitizeString(updates.store.address),
              phone: sanitizeString(updates.store.phone),
              website: sanitizeString(updates.store.website),
              taxId: sanitizeString(updates.store.taxId)
            };
      }
      
      // Handle items array if present
      if (updates.items && Array.isArray(updates.items)) {
        sanitizedUpdates.items = updates.items.map(item => ({
          id: item.id || `item-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
          name: sanitizeString(item.name) || 'Unknown Item',
          price: typeof item.price === 'number' ? item.price : parseFloat(item.price as string) || 0,
          quantity: typeof item.quantity === 'number' ? item.quantity : parseFloat(item.quantity as string) || 1,
          unitPrice: item.unitPrice !== undefined 
            ? (typeof item.unitPrice === 'number' ? item.unitPrice : parseFloat(item.unitPrice as string) || 0)
            : undefined,
          category: sanitizeString(item.category),
          description: sanitizeString(item.description),
          discounted: !!item.discounted,
          taxRate: item.taxRate !== undefined 
            ? (typeof item.taxRate === 'number' ? item.taxRate : parseFloat(item.taxRate as string) || 0)
            : undefined,
          isEdited: !!item.isEdited,
          confidence: item.confidence !== undefined 
            ? Math.min(1, Math.max(0, typeof item.confidence === 'number' 
                ? item.confidence 
                : parseFloat(item.confidence as string) || 0.5))
            : 0.5
        }));
      }
      
      // Always update the timestamp
      sanitizedUpdates.updatedAt = new Date();
      
      // Update the receipt
      const updatedReceipt = await this.receiptService.updateReceipt(sanitizedReceiptId, sanitizedUpdates);
      
      if (!updatedReceipt) {
        this.sendError(res, 404, 'Receipt not found');
        return;
      }
      
      // Return the updated receipt
      res.status(200).json(updatedReceipt);
    } catch (error) {
      console.error('Error updating receipt:', error);
      this.handleError(res, error, 'Failed to update receipt');
    }
  }
  
  /**
   * Delete a receipt
   * @param req HTTP request
   * @param res HTTP response
   */
  async deleteReceipt(req: Request, res: Response): Promise<void> {
    try {
      const { receiptId } = req.params;
      
      if (!receiptId || typeof receiptId !== 'string') {
        this.sendError(res, 400, 'Missing or invalid parameter: receiptId');
        return;
      }
      
      // Sanitize the receipt ID
      const sanitizedReceiptId = sanitizeString(receiptId);
      
      // Delete the receipt
      const success = await this.receiptService.deleteReceipt(sanitizedReceiptId);
      
      if (!success) {
        this.sendError(res, 404, 'Receipt not found');
        return;
      }
      
      // Return success
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      this.handleError(res, error, 'Failed to delete receipt');
    }
  }
  
  /**
   * Helper method to send standardized error responses
   * @param res HTTP response
   * @param statusCode HTTP status code
   * @param message Error message
   * @param details Additional error details
   */
  private sendError(res: Response, statusCode: number, message: string, details?: unknown): void {
    const errorResponse: ErrorResponse = {
      error: message
    };
    
    if (details) {
      errorResponse.details = details;
    }
    
    res.status(statusCode).json(errorResponse);
  }
  
  /**
   * Helper method to handle errors consistently
   * @param res HTTP response
   * @param error Error object
   * @param defaultMessage Default error message
   */
  private handleError(res: Response, error: unknown, defaultMessage: string): void {
    if (error instanceof Error) {
      this.sendError(res, 500, defaultMessage, {
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      });
    } else {
      this.sendError(res, 500, defaultMessage, { message: String(error) });
    }
  }
}