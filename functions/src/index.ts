/**
 * Firebase Cloud Functions entry point
 */

import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as express from 'express';
import * as cors from 'cors';
import { ReceiptController } from './controllers/receiptController';

// Initialize Firebase Admin
admin.initializeApp();

// Create Express app
const app = express();

// Enable CORS
app.use(cors({ origin: true }));

// Parse JSON request bodies
app.use(express.json());

// Create controllers
const receiptController = new ReceiptController();

// Receipt processing endpoints
app.post('/process-receipt', (req, res) => receiptController.processReceipt(req, res));
app.post('/receipts', (req, res) => receiptController.saveReceipt(req, res));
app.get('/receipts/user/:userId', (req, res) => receiptController.getReceiptsForUser(req, res));
app.get('/receipts/:receiptId', (req, res) => receiptController.getReceiptById(req, res));
app.put('/receipts/:receiptId', (req, res) => receiptController.updateReceipt(req, res));
app.delete('/receipts/:receiptId', (req, res) => receiptController.deleteReceipt(req, res));

// Export the API as a Firebase Cloud Function
export const api = functions.https.onRequest(app);

// Direct function for processing a receipt (alternative to Express route)
export const processReceipt = functions.https.onCall(async (data, context) => {
  // Verify authentication
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  
  const { imageUrl } = data;
  
  if (!imageUrl) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'The function requires an "imageUrl" argument.'
    );
  }
  
  try {
    const service = new (require('./services/receiptService').ReceiptService)();
    return await service.processReceipt(imageUrl, context.auth.uid);
  } catch (error) {
    console.error('Error in processReceipt function:', error);
    throw new functions.https.HttpsError(
      'internal',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
});

// Function triggered when a new image is uploaded to Firebase Storage
export const processReceiptOnUpload = functions.storage
  .object()
  .onFinalize(async (object) => {
    // Only process images
    if (!object.contentType?.startsWith('image/')) {
      console.log('Not an image, skipping processing');
      return null;
    }
    
    // Check path to ensure it's a receipt image
    if (!object.name?.includes('receipts/')) {
      console.log('Not in receipts folder, skipping processing');
      return null;
    }
    
    const filePath = object.name;
    const userId = filePath.split('/')[0]; // Assuming format: userId/receipts/filename
    
    // Get download URL
    const storage = admin.storage();
    const bucket = storage.bucket(object.bucket);
    const file = bucket.file(filePath);
    
    try {
      const [signedUrl] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + 15 * 60 * 1000 // 15 minutes
      });
      
      // Process receipt
      const service = new (require('./services/receiptService').ReceiptService)();
      const receipt = await service.processReceipt(signedUrl, userId);
      
      // Save receipt to database
      await service.saveReceipt(receipt);
      
      console.log(`Successfully processed receipt: ${filePath}`);
      return null;
    } catch (error) {
      console.error(`Error processing uploaded receipt ${filePath}:`, error);
      return null;
    }
  });