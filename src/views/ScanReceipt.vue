<template>
    <div class="scan-receipt-container">
      <div class="header-section">
        <h1 class="page-title">Scan Receipt</h1>
        <p class="page-subtitle">Upload or take a photo of your receipt to extract details</p>
      </div>
      
      <!-- Step 1: Capture/Upload -->
      <div v-if="currentStep === 1" class="card step-container">
        <div class="upload-grid">
          <!-- Camera capture option -->
          <div class="upload-option">
            <label for="camera-capture" class="block cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="option-title">Take a Photo</span>
              <span class="option-description">Use your device's camera</span>
              <input 
                id="camera-capture" 
                type="file" 
                accept="image/*" 
                capture="environment" 
                @change="handleFileInput" 
                class="hidden" 
              />
            </label>
          </div>
          
          <!-- File upload option -->
          <div class="upload-option">
            <label for="file-upload" class="block cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="upload-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span class="option-title">Upload a Photo</span>
              <span class="option-description">Select from your device</span>
              <input 
                id="file-upload" 
                type="file" 
                accept="image/*" 
                @change="handleFileInput" 
                class="hidden" 
              />
            </label>
          </div>
        </div>
        
        <div v-if="processingError" class="mt-4 error-message text-sm">
          {{ processingError }}
        </div>
      </div>
      
      <!-- Step 2: Processing -->
      <div v-if="currentStep === 2" class="card step-container processing-container">
        <div class="animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="processing-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 class="processing-title">Processing your receipt</h2>
          <p class="processing-text">Extracting receipt details, please wait...</p>
        </div>
      </div>
      
      <!-- Step 2.5: OCR Improvement (New) -->
      <div v-if="currentStep === 2.5" class="card step-container ocr-improvement-container">
        <h2 class="text-xl font-medium mb-4 text-center" style="color: var(--color-text);">Improve Receipt Text</h2>
        <p class="text-center mb-6" style="color: var(--color-text-secondary);">Our OCR detected the following text. You can improve it before proceeding.</p>
        
        <!-- Receipt Improver Component -->
        <ReceiptImprover 
          :initialText="extractedText" 
          @improved="onTextImproved"
          @receipt-data="useImprovedReceiptData"
        />
        
        <!-- Skip button -->
        <div class="flex justify-center mt-4">
          <button
            @click="skipImprovement"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Skip and Continue with Original Text
          </button>
        </div>
      </div>
      
      <!-- Step 3: Edit/Confirm -->
      <div v-if="currentStep === 3" class="card step-container edit-container">
        <div class="edit-grid">
          <!-- Receipt image preview -->
          <div class="receipt-preview">
            <img v-if="imagePreview" :src="imagePreview" alt="Receipt" class="receipt-image" />
          </div>
          
          <!-- Receipt details form -->
          <div class="receipt-form">
            <h2 class="section-title">Review Receipt Details</h2>
            
            <form @submit.prevent="saveReceipt" class="space-y-4">
              <!-- Store name -->
              <div>
                <label for="store" class="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  id="store"
                  v-model="receipt.store.name"
                  type="text"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <!-- Date -->
              <div>
                <label for="date" class="block text-sm font-medium text-gray-700 mb-1">Receipt Date</label>
                <input
                  id="date"
                  v-model="receiptDate"
                  type="date"
                  required
                  class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                />
              </div>
              
              <!-- Items -->
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-sm font-medium text-gray-700">Items</label>
                  <button 
                    type="button" 
                    @click="addNewItem" 
                    class="text-sm text-primary hover:text-primary-dark"
                  >
                    + Add Item
                  </button>
                </div>
                
                <div v-if="receipt.items.length === 0" class="text-gray-500 italic text-sm mb-2">
                  No items detected. Add items manually.
                </div>
                
                <div v-for="(item, index) in receipt.items" :key="item.id" class="mb-2 border border-gray-200 rounded-md p-3">
                  <div class="grid gap-2 md:grid-cols-5">
                    <div class="md:col-span-3">
                      <label :for="`item-name-${index}`" class="block text-xs font-medium text-gray-700 mb-1">Item Name</label>
                      <input
                        :id="`item-name-${index}`"
                        v-model="item.name"
                        type="text"
                        required
                        class="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div>
                      <label :for="`item-quantity-${index}`" class="block text-xs font-medium text-gray-700 mb-1">Quantity</label>
                      <input
                        :id="`item-quantity-${index}`"
                        v-model.number="item.quantity"
                        type="number"
                        min="1"
                        step="1"
                        required
                        class="w-full px-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      />
                    </div>
                    
                    <div class="relative">
                      <label :for="`item-price-${index}`" class="block text-xs font-medium text-gray-700 mb-1">Price</label>
                      <div class="relative">
                        <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                        <input
                          :id="`item-price-${index}`"
                          v-model.number="item.price"
                          type="number"
                          min="0"
                          step="0.01"
                          required
                          class="w-full pl-7 pr-3 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                        />
                      </div>
                      
                      <button 
                        type="button" 
                        @click="removeItem(index)"
                        class="absolute -top-1 -right-1 bg-red-100 rounded-full p-1 text-red-500 hover:text-red-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" class="icon icon-sm" viewBox="0 0 20 20" fill="currentColor">
                          <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Summary -->
              <div class="pt-4 border-t border-gray-200">
                <div class="flex justify-between mb-2">
                  <span class="text-gray-700">Subtotal:</span>
                  <span>${{ receipt.totals.subtotal.toFixed(2) }}</span>
                </div>
                
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-700">Tax:</span>
                  <div class="w-24 relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                    <input
                      v-model.number="receipt.totals.tax"
                      type="number"
                      min="0"
                      step="0.01"
                      class="w-full pl-7 pr-3 py-1 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                      @input="recalculateTotal"
                    />
                  </div>
                </div>
                
                <div class="flex justify-between font-semibold">
                  <span>Total:</span>
                  <span>${{ receipt.totals.total.toFixed(2) }}</span>
                </div>
              </div>
              
              <!-- Raw Text (toggle to show) -->
              <div class="mt-4 pt-4 border-t border-gray-200">
                <div 
                  @click="showRawText = !showRawText" 
                  class="flex items-center cursor-pointer text-primary"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    class="icon icon-sm mr-1" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                    :class="{ 'transform rotate-90': showRawText }"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                  </svg>
                  <span>{{ showRawText ? 'Hide Raw Text' : 'Show Raw Text' }}</span>
                </div>
                
                <div v-if="showRawText" class="mt-2">
                  <textarea 
                    v-model="receipt.rawText" 
                    rows="5" 
                    class="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary bg-gray-50"
                    readonly
                  ></textarea>
                </div>
              </div>
              
              <!-- Action buttons -->
              <div class="flex space-x-3 pt-4">
                <button
                  type="button"
                  @click="currentStep = 1"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Scan Again
                </button>
                
                <button
                  type="submit"
                  class="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Save Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, computed, watch } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/authStore';
  import { useReceiptStore } from '../stores/receiptStore';
  import receiptService from '../services/receiptService';
  import { Receipt, ReceiptItem } from '../types';
  import { v4 as uuidv4 } from 'uuid';
  import ReceiptImprover from '../components/receipts/ReceiptImprover.vue';
  import { improveReceiptText, convertToReceipt } from '../utils/receiptImproverFunctions';
  
  export default defineComponent({
    name: 'ScanReceipt',
    components: {
      ReceiptImprover
    },
    setup() {
      const router = useRouter();
      const authStore = useAuthStore();
      const receiptStore = useReceiptStore();
      
      // Step state
      const currentStep = ref(1);
      
      // File and processing state
      const selectedFile = ref<File | null>(null);
      const imagePreview = ref<string | null>(null);
      const processingError = ref<string | null>(null);
      
      // Receipt state
      const receipt = ref<Receipt>(receiptStore.createEmptyReceipt(authStore.currentUserId || ''));
      const extractedText = ref('');
      const showRawText = ref(false);
      
      // Format date for input
      const receiptDate = computed({
        get: () => {
          if (!receipt.value.date) return '';
          
          const date = receipt.value.date instanceof Date 
            ? receipt.value.date 
            : new Date(receipt.value.date);
          
          return date.toISOString().split('T')[0];
        },
        set: (value: string) => {
          receipt.value.date = new Date(value);
        }
      });
      
      // Handle file input from camera or upload
      const handleFileInput = async (event: Event) => {
        const input = event.target as HTMLInputElement;
        
        if (!input.files || input.files.length === 0) {
          return;
        }
        
        // Get the selected file
        selectedFile.value = input.files[0];
        
        // Create preview URL
        imagePreview.value = URL.createObjectURL(selectedFile.value);
        
        // Move to processing step
        currentStep.value = 2;
        processingError.value = null;
        
        try {
          // Process the receipt image
          if (authStore.currentUserId) {
            const extractedData = await receiptService.processReceiptImage(
              selectedFile.value,
              authStore.currentUserId
            );
            
            if (extractedData) {
              // Store the raw OCR text for improvement
              extractedText.value = extractedData.rawText || '';
              
              // Go to the improvement step with the extracted text
              currentStep.value = 2.5;
            } else {
              throw new Error('Failed to extract data from receipt');
            }
          } else {
            throw new Error('User not authenticated');
          }
        } catch (error) {
          console.error('Error processing receipt:', error);
          processingError.value = 'Failed to process receipt. Please try again.';
          currentStep.value = 1;
        }
      };
      
      // Handle improved text from ReceiptImprover
      const onTextImproved = (improvedText: string) => {
        extractedText.value = improvedText;
      };
      
      // Use improved receipt data
      const useImprovedReceiptData = (data: { text: string; analysis: Record<string, any> }) => {
        // Set the improved text as raw text
        extractedText.value = data.text;
        
        // Convert the improved text to a receipt object
        if (authStore.currentUserId) {
          // First try to extract structured data from the improved text
          const convertedReceipt = convertToReceipt(data.text, authStore.currentUserId);
          
          // Merge with an empty receipt to ensure we have all required fields
          receipt.value = {
            ...receiptStore.createEmptyReceipt(authStore.currentUserId),
            ...convertedReceipt,
            rawText: data.text
          };
          
          // Use the analysis data for confidence scoring
          if (data.analysis && typeof data.analysis.quality === 'number') {
            receipt.value.confidence = data.analysis.quality;
          }
          
          // Move to edit step
          currentStep.value = 3;
        }
      };
      
      // Skip the improvement step
      const skipImprovement = async () => {
        // Process the original OCR text without user improvements
        if (authStore.currentUserId) {
          try {
            // Process the OCR results with default enhancement
            const enhancedData = receiptService.enhanceOcrResults(extractedText.value);
            
            // Convert to receipt
            receipt.value = receiptStore.extractedDataToReceipt({
              rawText: extractedText.value,
              ...enhancedData
            }, authStore.currentUserId);
            
            // Move to edit step
            currentStep.value = 3;
          } catch (error) {
            console.error('Error processing OCR text:', error);
            processingError.value = 'Failed to process receipt text. Please try again.';
            currentStep.value = 1;
          }
        }
      };
      
      // Add a new item to the receipt
      const addNewItem = () => {
        receipt.value.items.push({
          id: uuidv4(),
          name: '',
          price: 0,
          quantity: 1,
          confidence: 1, // User added items have full confidence
          isEdited: true
        });
      };
      
      // Remove an item from the receipt
      const removeItem = (index: number) => {
        receipt.value.items.splice(index, 1);
        recalculateTotal();
      };
      
      // Recalculate subtotal and total
      const recalculateTotal = () => {
        // Calculate subtotal
        receipt.value.totals.subtotal = receipt.value.items.reduce(
          (sum, item) => sum + (item.price * (item.quantity || 1)), 
          0
        );
        
        // Update total (subtotal + tax)
        receipt.value.totals.total = receipt.value.totals.subtotal + receipt.value.totals.tax;
        
        // Update deprecated fields for backward compatibility
        receipt.value.subtotal = receipt.value.totals.subtotal;
        receipt.value.tax = receipt.value.totals.tax;
        receipt.value.total = receipt.value.totals.total;
      };
      
      // Watch for changes to items to update totals
      watch(
        () => receipt.value.items,
        () => recalculateTotal(),
        { deep: true }
      );
      
      // Save the receipt
      const saveReceipt = async () => {
        if (!authStore.currentUserId) return;
        
        try {
          // Before saving, recalculate totals
          recalculateTotal();
          
          // Save the receipt with the image
          const savedReceipt = await receiptStore.saveReceipt(
            receipt.value,
            authStore.currentUserId,
            selectedFile.value || undefined
          );
          
          if (savedReceipt) {
            // Navigate to the receipt view
            router.push(`/receipt/${savedReceipt.id}`);
          } else {
            throw new Error('Failed to save receipt');
          }
        } catch (error) {
          console.error('Error saving receipt:', error);
          processingError.value = 'Failed to save receipt. Please try again.';
        }
      };
      
      return {
        currentStep,
        selectedFile,
        imagePreview,
        processingError,
        receipt,
        receiptDate,
        extractedText,
        showRawText,
        handleFileInput,
        onTextImproved,
        useImprovedReceiptData,
        skipImprovement,
        addNewItem,
        removeItem,
        recalculateTotal,
        saveReceipt,
        authStore,
        receiptStore
      };
    }
  });
  </script>
  
  <style scoped>
  /* Container styles */
  .scan-receipt-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0;
  }
  
  .header-section {
    margin-bottom: 2rem;
    text-align: center;
  }
  
  .page-title {
    font-size: 2rem;
    font-weight: bold;
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }
  
  .page-subtitle {
    color: var(--color-text-secondary);
    font-size: 1rem;
  }
  
  /* Step containers */
  .step-container {
    padding: 1.5rem;
    background-color: var(--color-surface);
    border-radius: var(--radius-lg);
    box-shadow: 0 1px 3px var(--color-shadow);
  }
  
  /* Upload grid */
  .upload-grid {
    display: grid;
    gap: 1.5rem;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  }
  
  .upload-option {
    background-color: var(--color-gray-100);
    border: 2px dashed var(--color-gray-200);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    text-align: center;
    cursor: pointer;
    transition: border-color var(--transition-normal);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 180px;
  }
  
  .upload-option:hover {
    border-color: var(--color-primary);
    background-color: var(--color-gray-50);
  }
  
  .upload-icon {
    width: 48px;
    height: 48px;
    color: var(--color-gray-400);
    margin-bottom: 1rem;
  }
  
  .option-title {
    display: block;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.25rem;
    font-size: 1.1rem;
  }
  
  .option-description {
    display: block;
    color: var(--color-text-secondary);
    font-size: 0.875rem;
  }
  
  /* Processing container */
  .processing-container {
    text-align: center;
    padding: 3rem 1.5rem;
  }
  
  .processing-icon {
    width: 64px;
    height: 64px;
    color: var(--color-primary);
    margin: 0 auto 1.5rem;
    animation: pulse 2s ease-in-out infinite;
  }
  
  .processing-title {
    font-size: 1.5rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 0.5rem;
  }
  
  .processing-text {
    color: var(--color-text-secondary);
  }
  
  /* OCR improvement container */
  .ocr-improvement-container {
    padding: 2rem 1.5rem;
  }
  
  /* Edit container */
  .edit-container {
    padding: 1.5rem;
  }
  
  .edit-grid {
    display: grid;
    gap: 2rem;
    grid-template-columns: 1fr;
  }
  
  .receipt-preview {
    text-align: center;
  }
  
  .receipt-image {
    max-width: 100%;
    height: auto;
    border-radius: var(--radius-lg);
    box-shadow: 0 2px 8px var(--color-shadow);
  }
  
  .receipt-form {
    width: 100%;
  }
  
  .section-title {
    font-size: 1.25rem;
    font-weight: 600;
    color: var(--color-text);
    margin-bottom: 1.5rem;
  }
  
  /* Form elements */
  .error-message {
    color: var(--color-error);
    margin-top: 1rem;
    text-align: center;
  }
  
  label {
    color: var(--color-text-secondary);
    font-size: 0.875rem;
    font-weight: 500;
  }
  
  input, textarea {
    background-color: var(--color-surface);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    font-size: 1rem;
    width: 100%;
  }
  
  input:focus, textarea:focus {
    border-color: var(--color-primary);
    outline: none;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.25);
  }
  
  /* Item card */
  .item-card {
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: 1rem;
    margin-bottom: 0.75rem;
    background-color: var(--color-surface);
  }
  
  .item-grid {
    display: grid;
    gap: 0.75rem;
    grid-template-columns: 1fr;
  }
  
  /* Action buttons */
  .action-buttons {
    display: flex;
    gap: 1rem;
    margin-top: 2rem;
  }
  
  .btn {
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    font-weight: 500;
    text-align: center;
    cursor: pointer;
    transition: all var(--transition-fast);
    border: none;
    font-size: 1rem;
  }
  
  .btn-primary {
    background-color: var(--color-primary);
    color: white;
    flex: 2;
  }
  
  .btn-primary:hover {
    background-color: var(--color-primary-dark);
  }
  
  .btn-secondary {
    background-color: var(--color-gray-100);
    color: var(--color-text);
    border: 1px solid var(--color-gray-300);
    flex: 1;
  }
  
  .btn-secondary:hover {
    background-color: var(--color-gray-200);
  }
  
  /* Animations */
  @keyframes pulse {
    0% {
      transform: scale(1);
      opacity: 1;
    }
    50% {
      transform: scale(1.05);
      opacity: 0.8;
    }
    100% {
      transform: scale(1);
      opacity: 1;
    }
  }
  
  /* Mobile adjustments */
  @media (max-width: 640px) {
    .page-title {
      font-size: 1.5rem;
    }
    
    .page-subtitle {
      font-size: 0.875rem;
    }
    
    .step-container {
      padding: 1rem;
    }
    
    .upload-grid {
      grid-template-columns: 1fr;
      gap: 1rem;
    }
    
    .upload-option {
      min-height: 150px;
      padding: 1rem;
    }
    
    .upload-icon {
      width: 40px;
      height: 40px;
    }
    
    .option-title {
      font-size: 1rem;
    }
    
    .processing-container {
      padding: 2rem 1rem;
    }
    
    .processing-icon {
      width: 48px;
      height: 48px;
    }
    
    .processing-title {
      font-size: 1.25rem;
    }
    
    .edit-container {
      padding: 1rem;
    }
    
    .receipt-image {
      max-height: 300px;
      object-fit: contain;
    }
    
    .item-grid {
      gap: 0.5rem;
    }
    
    .item-card {
      padding: 0.75rem;
    }
    
    .action-buttons {
      flex-direction: column;
    }
    
    .btn {
      width: 100%;
      flex: none !important;
    }
    
    input[type="number"] {
      font-size: 16px; /* Prevents zoom on iOS */
    }
  }
  
  /* Tablet adjustments */
  @media (min-width: 641px) and (max-width: 1024px) {
    .edit-grid {
      grid-template-columns: 300px 1fr;
      gap: 1.5rem;
    }
    
    .receipt-image {
      max-height: 400px;
      object-fit: contain;
    }
    
    .item-grid {
      grid-template-columns: 2fr 1fr 1fr;
      align-items: center;
    }
  }
  
  /* Desktop adjustments */
  @media (min-width: 1025px) {
    .edit-grid {
      grid-template-columns: 350px 1fr;
      gap: 2rem;
    }
    
    .receipt-image {
      max-height: 500px;
      object-fit: contain;
    }
    
    .item-grid {
      grid-template-columns: 3fr 1fr 1fr;
      align-items: center;
    }
  }
  </style>