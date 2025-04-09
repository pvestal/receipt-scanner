/**
 * Application configuration
 */

/**
 * Application configuration
 */
export const appConfig = {
    /**
     * Google Cloud Vision API settings
     */
    vision: {
      /**
       * Features to request from the Vision API
       */
      features: [
        {
          type: 'TEXT_DETECTION',
          maxResults: 1
        }
      ],
      
      /**
       * Image settings
       */
      imageContext: {
        languageHints: ['en-US', 'en-GB', 'en']
      }
    },
    
    /**
     * Receipt parser settings
     */
    parser: {
      /**
       * Minimum confidence threshold for accepting parsed results
       */
      confidenceThreshold: 0.5,
      
      /**
       * Maximum age of receipts to accept (in days)
       */
      maxReceiptAge: 365,
      
      /**
       * Enable/disable ML-based parsing
       */
      enableMlParsing: false,
      
      /**
       * Enable/disable store templates
       */
      enableTemplates: true
    },
    
    /**
     * Storage settings
     */
    storage: {
      /**
       * Receipt images bucket path
       */
      receiptImagePath: 'receipts',
      
      /**
       * URL expiration time for signed URLs (in minutes)
       */
      urlExpirationMinutes: 15
    },
    
    /**
     * Database settings
     */
    database: {
      /**
       * Receipts collection name
       */
      receiptsCollection: 'receipts',
      
      /**
       * Templates collection name
       */
      templatesCollection: 'receipt-templates',
      
      /**
       * User profiles collection name
       */
      usersCollection: 'users'
    }
  };