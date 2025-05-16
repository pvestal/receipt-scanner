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
    
    const filePath = object.name || '';
    const pathParts = filePath.split('/');
    
    // Validate path format: userId/receipts/filename
    if (pathParts.length < 3) {
      console.error(`Invalid file path format: ${filePath}`);
      return null;
    }
    
    const userId = pathParts[0]; // Assuming format: userId/receipts/filename
    
    // Validate userId
    if (!userId || userId.length < 5) {
      console.error(`Invalid userId in path: ${filePath}`);
      return null;
    }
    
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
      
      // Validate receipt data before saving
      if (!receipt || 
          !receipt.store || 
          !receipt.items || 
          receipt.items.length === 0 || 
          !receipt.totals || 
          receipt.confidence < 0.3) {
        
        console.error(`Low quality receipt data, not saving: ${JSON.stringify({
          fileName: filePath,
          confidence: receipt?.confidence || 0,
          itemCount: receipt?.items?.length || 0
        })}`);
        
        // Store this failed processing attempt in a separate collection for review
        const db = admin.firestore();
        await db.collection('failedReceipts').add({
          userId,
          imageUrl: signedUrl,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          reason: 'Low quality OCR result',
          rawData: receipt
        });
        
        return null;
      }
      
      // Save receipt to database
      const savedReceipt = await service.saveReceipt(receipt);
      
      console.log(`Successfully processed receipt: ${filePath}, id: ${savedReceipt.id}`);
      
      // Optionally notify user via FCM that their receipt is ready
      try {
        const message = {
          notification: {
            title: 'Receipt Processed',
            body: `Your receipt from ${receipt.store.name} has been processed.`
          },
          data: {
            receiptId: savedReceipt.id || '',
            store: receipt.store.name,
            total: receipt.totals.total.toString()
          },
          token: await getUserFcmToken(userId)
        };
        
        if (message.token) {
          await admin.messaging().send(message);
        }
      } catch (notificationError) {
        console.warn('Failed to send notification:', notificationError);
        // Continue even if notification fails
      }
      
      return null;
    } catch (error) {
      console.error(`Error processing uploaded receipt ${filePath}:`, error);
      
      // Log the error to Firestore for monitoring
      try {
        const db = admin.firestore();
        await db.collection('errors').add({
          type: 'receipt_processing',
          userId,
          filePath,
          timestamp: admin.firestore.FieldValue.serverTimestamp(),
          error: error instanceof Error ? {
            message: error.message,
            stack: error.stack
          } : String(error)
        });
      } catch (dbError) {
        console.error('Failed to log error to database:', dbError);
      }
      
      return null;
    }
  });

/**
 * Helper function to get a user's FCM token for notifications
 * @param userId User ID
 * @returns FCM token or null if not found
 */
async function getUserFcmToken(userId: string): Promise<string | null> {
  try {
    const db = admin.firestore();
    const userDoc = await db.collection('users').doc(userId).get();
    
    if (!userDoc.exists) {
      return null;
    }
    
    const userData = userDoc.data();
    return userData?.fcmToken || null;
  } catch (error) {
    console.warn('Error getting user FCM token:', error);
    return null;
  }
}