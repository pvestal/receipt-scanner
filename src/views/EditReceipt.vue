<template>
    <div>
      <div class="mb-6">
        <div class="flex items-center">
          <router-link 
            :to="`/receipt/${receiptId}`" 
            class="text-primary mr-2"
            aria-label="Back to receipt details"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </router-link>
          <h1 class="text-2xl font-bold text-gray-800">Edit Receipt</h1>
        </div>
      </div>
      
      <!-- Loading state -->
      <div v-if="receiptStore.loading" class="bg-white rounded-lg shadow-sm p-6 text-center">
        <div class="animate-pulse">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-primary mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h2 class="text-xl font-medium text-gray-800 mb-2">Loading receipt...</h2>
        </div>
      </div>
      
      <!-- Not found state -->
      <div 
        v-else-if="!receipt" 
        class="bg-white rounded-lg shadow-sm p-6 text-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
        </svg>
        <h2 class="text-xl font-medium text-gray-800 mb-2">Receipt not found</h2>
        <p class="text-gray-600 mb-4">The receipt you're looking for doesn't exist or you don't have permission to view it.</p>
        <router-link 
          to="/dashboard" 
          class="inline-flex items-center text-primary hover:underline"
        >
          Return to Dashboard
        </router-link>
      </div>
      
      <!-- Edit form -->
      <div v-else class="bg-white rounded-lg shadow-sm p-6">
        <div class="grid gap-6 md:grid-cols-3">
          <!-- Receipt image preview with option to change -->
          <div>
            <div v-if="imagePreview || receipt.imageUrl" class="mb-2 relative rounded-lg overflow-hidden">
              <img 
                :src="imagePreview || receipt.imageUrl" 
                alt="Receipt" 
                class="w-full rounded-lg"
              />
              <div class="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-50 transition-opacity flex items-center justify-center">
                <label 
                  class="hidden hover:block cursor-pointer bg-white text-primary rounded-full p-2"
                  :class="{ 'hidden': !isHoveringImage }"
                  @mouseenter="isHoveringImage = true"
                  @mouseleave="isHoveringImage = false"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <input 
                    type="file" 
                    accept="image/*" 
                    @change="handleImageChange" 
                    class="hidden" 
                  />
                </label>
              </div>
            </div>
            <div 
              v-else 
              class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center"
            >
              <label class="cursor-pointer block">
                <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span class="block text-sm text-gray-500">Add Receipt Image</span>
                <input 
                  type="file" 
                  accept="image/*" 
                  @change="handleImageChange" 
                  class="hidden" 
                />
              </label>
            </div>
            
            <div class="mt-4">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Receipt Options</h3>
              <button 
                type="button" 
                @click="showEmailModal = true"
                class="w-full mb-2 flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                </svg>
                Email Receipt
              </button>
              
              <button 
                type="button" 
                @click="exportAsPdf"
                class="w-full flex items-center justify-center bg-gray-100 hover:bg-gray-200 text-gray-800 px-3 py-2 rounded-md text-sm"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path fill-rule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm5 6a1 1 0 10-2 0v3.586l-1.293-1.293a1 1 0 10-1.414 1.414l3 3a1 1 0 001.414 0l3-3a1 1 0 00-1.414-1.414L11 11.586V8z" clip-rule="evenodd" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
          
          <!-- Receipt details form -->
          <div class="md:col-span-2">
            <form @submit.prevent="saveChanges" class="space-y-4">
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
                  No items added. Add items using the button above.
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
                <router-link
                  :to="`/receipt/${receiptId}`"
                  class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Cancel
                </router-link>
                
                <button
                  type="submit"
                  class="flex-1 px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      
      <!-- Email Modal -->
      <div 
        v-if="showEmailModal" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Email Receipt</h2>
          
          <form @submit.prevent="sendEmailReceipt" class="space-y-4">
            <div>
              <label for="emailAddress" class="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
              <input
                id="emailAddress"
                v-model="emailAddress"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="recipient@example.com"
              />
            </div>
            
            <div>
              <label for="emailMessage" class="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
              <textarea
                id="emailMessage"
                v-model="emailMessage"
                rows="3"
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="Add a personal message..."
              ></textarea>
            </div>
            
            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="showEmailModal = false"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                :disabled="emailSending"
              >
                {{ emailSending ? 'Sending...' : 'Send' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Success toast -->
      <div 
        v-if="showSuccessToast" 
        class="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md"
      >
        <div class="flex items-center">
          <div class="py-1">
            <svg class="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
          </div>
          <div>
            <p>{{ successMessage }}</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  
  <script lang="ts">
  import { defineComponent, ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/authStore';
  import { useReceiptStore } from '../stores/receiptStore';
  import receiptService from '../services/receiptService';
  import { Receipt, ReceiptItem } from '../types';
  import { v4 as uuidv4 } from 'uuid';
  
  export default defineComponent({
    name: 'EditReceipt',
    props: {
      id: {
        type: String,
        required: false
      }
    },
    setup(props) {
      const route = useRoute();
      const router = useRouter();
      const authStore = useAuthStore();
      const receiptStore = useReceiptStore();
      
      // Get receipt ID from props or route params
      const receiptId = computed(() => props.id || route.params.id as string);
      
      // Receipt state
      const receipt = ref<Receipt | null>(null);
      const newImage = ref<File | null>(null);
      const imagePreview = ref<string | null>(null);
      const isHoveringImage = ref(false);
      
      // Email state
      const showEmailModal = ref(false);
      const emailAddress = ref('');
      const emailMessage = ref('');
      const emailSending = ref(false);
      
      // Toast state
      const showSuccessToast = ref(false);
      const successMessage = ref('');
      
      // Format date for input
      const receiptDate = computed({
        get: () => {
          if (!receipt.value || !receipt.value.date) return '';
          
          const date = receipt.value.date instanceof Date 
            ? receipt.value.date 
            : new Date(receipt.value.date);
          
          return date.toISOString().split('T')[0];
        },
        set: (value: string) => {
          if (receipt.value) {
            receipt.value.date = new Date(value);
          }
        }
      });
      
      // Load receipt data
      onMounted(async () => {
        if (authStore.currentUserId && receiptId.value) {
          await loadReceipt();
        }
      });
      
      // Load the receipt
      const loadReceipt = async () => {
        if (!authStore.currentUserId || !receiptId.value) return;
        
        const loadedReceipt = await receiptStore.fetchReceipt(
          receiptId.value,
          authStore.currentUserId
        );
        
        if (loadedReceipt) {
          receipt.value = { ...loadedReceipt };
        }
      };
      
      // Handle image change
      const handleImageChange = (event: Event) => {
        const input = event.target as HTMLInputElement;
        
        if (!input.files || input.files.length === 0) {
          return;
        }
        
        // Set the new image
        newImage.value = input.files[0];
        
        // Create preview URL
        imagePreview.value = URL.createObjectURL(newImage.value);
      };
      
      // Add a new item to the receipt
      const addNewItem = () => {
        if (!receipt.value) return;
        
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
        if (!receipt.value) return;
        
        receipt.value.items.splice(index, 1);
        recalculateTotal();
      };
      
      // Recalculate subtotal and total
      const recalculateTotal = () => {
        if (!receipt.value) return;
        
        // Calculate subtotal
        receipt.value.subtotal = receipt.value.items.reduce(
          (sum, item) => sum + (item.price * item.quantity), 
          0
        );
        
        // Update total (subtotal + tax)
        receipt.value.total = receipt.value.subtotal + (receipt.value.tax || 0);
      };
      
      // Watch for changes to items to update totals
      watch(
        () => receipt.value?.items,
        () => recalculateTotal(),
        { deep: true }
      );
      
      // Save changes to the receipt
      const saveChanges = async () => {
        if (!receipt.value || !authStore.currentUserId) return;
        
        // Recalculate totals before saving
        recalculateTotal();
        
        // Update the receipt
        const updatedReceipt = await receiptStore.updateReceipt(
          receiptId.value,
          receipt.value,
          authStore.currentUserId,
          newImage.value || undefined
        );
        
        if (updatedReceipt) {
          // Show success toast
          successMessage.value = 'Receipt updated successfully!';
          showSuccessToast.value = true;
          
          // Hide toast after 3 seconds
          setTimeout(() => {
            showSuccessToast.value = false;
          }, 3000);
          
          // Navigate back to the receipt view
          router.push(`/receipt/${receiptId.value}`);
        }
      };
      
      // Send receipt by email
      const sendEmailReceipt = async () => {
        if (!receipt.value || !emailAddress.value) return;
        
        emailSending.value = true;
        
        try {
          const success = await receiptService.emailReceipt(receipt.value, emailAddress.value);
          
          if (success) {
            // Close modal
            showEmailModal.value = false;
            emailAddress.value = '';
            emailMessage.value = '';
            
            // Show success toast
            successMessage.value = 'Receipt sent by email successfully!';
            showSuccessToast.value = true;
            
            // Hide toast after 3 seconds
            setTimeout(() => {
              showSuccessToast.value = false;
            }, 3000);
          } else {
            throw new Error('Failed to send email');
          }
        } catch (error) {
          console.error('Error sending email:', error);
          alert('Failed to send email. Please try again.');
        } finally {
          emailSending.value = false;
        }
      };
      
      // Export receipt as PDF
      const exportAsPdf = () => {
        // In a real implementation, you would use a library like jsPDF to generate a PDF
        // For this example, we'll just show a success message
        alert('PDF export functionality would be implemented here');
        
        // Example implementation with jsPDF would be:
        // const doc = new jsPDF();
        // doc.text(`Receipt from ${receipt.value.store}`, 10, 10);
        // doc.text(`Date: ${new Date(receipt.value.date).toLocaleDateString()}`, 10, 20);
        // // Add more content...
        // doc.save(`receipt-${receipt.value.id}.pdf`);
      };
      
      return {
        receiptId,
        receipt,
        receiptDate,
        newImage,
        imagePreview,
        isHoveringImage,
        showEmailModal,
        emailAddress,
        emailMessage,
        emailSending,
        showSuccessToast,
        successMessage,
        handleImageChange,
        addNewItem,
        removeItem,
        recalculateTotal,
        saveChanges,
        sendEmailReceipt,
        exportAsPdf,
        authStore,
        receiptStore
      };
    }
  });
  </script>