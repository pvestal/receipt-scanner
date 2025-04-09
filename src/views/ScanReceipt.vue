<template>
    <div>
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-800">Scan Receipt</h1>
        <p class="text-gray-600">Upload or take a photo of your receipt to extract details</p>
      </div>
      
      <!-- Step 1: Capture/Upload -->
      <div v-if="currentStep === 1" class="bg-white rounded-lg shadow-sm p-6">
        <div class="grid gap-6 sm:grid-cols-2">
          <!-- Camera capture option -->
          <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <label for="camera-capture" class="block cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <span class="block font-medium text-gray-700 mb-1">Take a Photo</span>
              <span class="block text-sm text-gray-500">Use your device's camera</span>
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
          <div class="bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer">
            <label for="file-upload" class="block cursor-pointer">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span class="block font-medium text-gray-700 mb-1">Upload a Photo</span>
              <span class="block text-sm text-gray-500">Select from your device</span>
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
        
        <div v-if="processingError" class="mt-4 text-red-600 text-sm">
          {{ processingError }}
        </div>
      </div>
      
      <!-- Step 2: Processing -->
      <div v-if="currentStep === 2" class="bg-white rounded-lg shadow-sm p-6 text-center">
        <div class="animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 class="text-xl font-medium text-gray-800 mb-2">Processing your receipt</h2>
          <p class="text-gray-600">Extracting receipt details, please wait...</p>
        </div>
      </div>
      
      <!-- Step 3: Edit/Confirm -->
      <div v-if="currentStep === 3" class="bg-white rounded-lg shadow-sm p-6">
        <div class="grid gap-6 md:grid-cols-3">
          <!-- Receipt image preview -->
          <div>
            <img v-if="imagePreview" :src="imagePreview" alt="Receipt" class="w-full rounded-lg shadow-sm" />
          </div>
          
          <!-- Receipt details form -->
          <div class="md:col-span-2">
            <h2 class="text-xl font-medium text-gray-800 mb-4">Review Receipt Details</h2>
            
            <form @submit.prevent="saveReceipt" class="space-y-4">
              <!-- Store name -->
              <div>
                <label for="store" class="block text-sm font-medium text-gray-700 mb-1">Store Name</label>
                <input
                  id="store"
                  v-model="receipt.store"
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
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
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
                  <span>${{ receipt.subtotal.toFixed(2) }}</span>
                </div>
                
                <div class="flex justify-between items-center mb-2">
                  <span class="text-gray-700">Tax:</span>
                  <div class="w-24 relative">
                    <span class="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500">$</span>
                    <input
                      v-model.number="receipt.tax"
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
                  <span>${{ receipt.total.toFixed(2) }}</span>
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
  
  export default defineComponent({
    name: 'ScanReceipt',
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
              // Process the OCR results further with custom parsing
              const enhancedData = receiptService.enhanceOcrResults(extractedData.rawText || '');
              
              // Convert to receipt
              receipt.value = receiptStore.extractedDataToReceipt({
                ...extractedData,
                ...enhancedData
              }, authStore.currentUserId);
              
              // Move to edit step
              currentStep.value = 3;
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
      
      // Add a new item to the receipt
      const addNewItem = () => {
        receipt.value.items.push({
          id: uuidv4(),
          name: '',
          price: 0,
          quantity: 1,
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
        receipt.value.subtotal = receipt.value.items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        );
        
        // Update total (subtotal + tax)
        receipt.value.total = receipt.value.subtotal + receipt.value.tax;
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
        handleFileInput,
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