/**
 * Controller for receipt-related HTTP endpoints
 */

import { Request, Response } from 'express';
import { ReceiptService } from '../services/receiptService';
import { Receipt } from '../models/receipt';

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
      const { imageUrl, userId } = req.body;
      
      // Validate required parameters
      if (!imageUrl) {
        res.status(400).json({ error: 'Missing required parameter: imageUrl' });
        return;
      }
      
      if (!userId) {
        res.status(400).json({ error: 'Missing required parameter: userId' });
        return;
      }
      
      // Process the receipt
      const result = await this.receiptService.processReceipt(imageUrl, userId);
      
      // Return the result
      res.status(200).json(result);
    } catch (error) {
      console.error('Error processing receipt:', error);
      res.status(500).json({ 
        error: 'Failed to process receipt',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  /**
   * Save a receipt to the database
   * @param req HTTP request
   * @param res HTTP response
   */
  async saveReceipt(req: Request, res: Response): Promise<void> {
    try {
      const receipt: Receipt = req.body;
      
      // Validate the receipt data
      if (!receipt.userId || !receipt.store || !receipt.items || !receipt.totals) {
        res.status(400).json({ error: 'Invalid receipt data' });
        return;
      }
      
      // Save the receipt
      const savedReceipt = await this.receiptService.saveReceipt(receipt);
      
      // Return the saved receipt
      res.status(201).json(savedReceipt);
    } catch (error) {
      console.error('Error saving receipt:', error);
      res.status(500).json({ 
        error: 'Failed to save receipt',
        message: error instanceof Error ? error.message : String(error)
      });
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
      
      if (!userId) {
        res.status(400).json({ error: 'Missing required parameter: userId' });
        return;
      }
      
      // Get receipts for the user
      const receipts = await this.receiptService.getReceiptsForUser(userId);
      
      // Return the receipts
      res.status(200).json(receipts);
    } catch (error) {
      console.error('Error getting receipts:', error);
      res.status(500).json({ 
        error: 'Failed to get receipts',
        message: error instanceof Error ? error.message : String(error)
      });
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
      
      if (!receiptId) {
        res.status(400).json({ error: 'Missing required parameter: receiptId' });
        return;
      }
      
      // Get the receipt
      const receipt = await this.receiptService.getReceiptById(receiptId);
      
      if (!receipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }
      
      // Return the receipt
      res.status(200).json(receipt);
    } catch (error) {
      console.error('Error getting receipt:', error);
      res.status(500).json({ 
        error: 'Failed to get receipt',
        message: error instanceof Error ? error.message : String(error)
      });
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
      const updates = req.body;
      
      if (!receiptId) {
        res.status(400).json({ error: 'Missing required parameter: receiptId' });
        return;
      }
      
      // Update the receipt
      const updatedReceipt = await this.receiptService.updateReceipt(receiptId, updates);
      
      if (!updatedReceipt) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }
      
      // Return the updated receipt
      res.status(200).json(updatedReceipt);
    } catch (error) {
      console.error('Error updating receipt:', error);
      res.status(500).json({ 
        error: 'Failed to update receipt',
        message: error instanceof Error ? error.message : String(error)
      });
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
      
      if (!receiptId) {
        res.status(400).json({ error: 'Missing required parameter: receiptId' });
        return;
      }
      
      // Delete the receipt
      const success = await this.receiptService.deleteReceipt(receiptId);
      
      if (!success) {
        res.status(404).json({ error: 'Receipt not found' });
        return;
      }
      
      // Return success
      res.status(204).end();
    } catch (error) {
      console.error('Error deleting receipt:', error);
      res.status(500).json({ 
        error: 'Failed to delete receipt',
        message: error instanceof Error ? error.message : String(error)
      });
    }
  }
}