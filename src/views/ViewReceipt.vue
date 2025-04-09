<template>
    <div>
      <div class="mb-6">
        <div class="flex items-center">
          <router-link 
            to="/dashboard" 
            class="text-primary mr-2"
            aria-label="Back to dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd" />
            </svg>
          </router-link>
          <h1 class="text-2xl font-bold text-gray-800">Receipt Details</h1>
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
      
      <!-- Receipt details -->
      <div v-else class="bg-white rounded-lg shadow-sm p-6">
        <div class="grid gap-6 md:grid-cols-3">
          <!-- Receipt image preview -->
          <div>
            <img 
              v-if="receipt.imageUrl" 
              :src="receipt.imageUrl" 
              alt="Receipt" 
              class="w-full rounded-lg shadow-sm" 
            />
            <div 
              v-else 
              class="border-2 border-dashed border-gray-200 rounded-lg p-4 text-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-10 w-10 mx-auto text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span class="block text-sm text-gray-500">No receipt image</span>
            </div>
            
            <div class="mt-4">
              <h3 class="text-sm font-medium text-gray-700 mb-2">Receipt Options</h3>
              
              <router-link 
                :to="`/receipt/${receiptId}/edit`" 
                class="w-full mb-2 flex items-center justify-center bg-primary text-white px-3 py-2 rounded-md text-sm hover:bg-primary-dark"
              >
                <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                </svg>
                Edit Receipt
              </router-link>
              
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
          
          <!-- Receipt details -->
          <div class="md:col-span-2">
            <div class="border-b border-gray-200 pb-4 mb-4">
              <h2 class="text-2xl font-semibold text-gray-800">{{ receipt.store }}</h2>
              <p class="text-gray-600">
                {{ formatDate(receipt.date) }}
              </p>
            </div>
            
            <!-- Items -->
            <div class="mb-6">
              <h3 class="text-lg font-medium text-gray-800 mb-2">Items</h3>
              
              <div v-if="receipt.items.length === 0" class="text-gray-500 italic">
                No items recorded for this receipt.
              </div>
              
              <table v-else class="w-full text-left">
                <thead class="bg-gray-50 text-xs uppercase text-gray-700">
                  <tr>
                    <th class="py-2 px-3">Item</th>
                    <th class="py-2 px-3 text-right">Qty</th>
                    <th class="py-2 px-3 text-right">Price</th>
                    <th class="py-2 px-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="item in receipt.items" :key="item.id" class="bg-white">
                    <td class="py-3 px-3">{{ item.name }}</td>
                    <td class="py-3 px-3 text-right">{{ item.quantity }}</td>
                    <td class="py-3 px-3 text-right">${{ item.price.toFixed(2) }}</td>
                    <td class="py-3 px-3 text-right">${{ (item.quantity * item.price).toFixed(2) }}</td>
                  </tr>
                </tbody>
                <tfoot class="bg-gray-50">
                  <tr>
                    <td class="py-2 px-3 font-medium" colspan="3">Subtotal</td>
                    <td class="py-2 px-3 text-right">${{ receipt.subtotal.toFixed(2) }}</td>
                  </tr>
                  <tr>
                    <td class="py-2 px-3 font-medium" colspan="3">Tax</td>
                    <td class="py-2 px-3 text-right">${{ receipt.tax.toFixed(2) }}</td>
                  </tr>
                  <tr class="font-semibold">
                    <td class="py-2 px-3" colspan="3">Total</td>
                    <td class="py-2 px-3 text-right">${{ receipt.total.toFixed(2) }}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
            
            <!-- Receipt metadata -->
            <div class="text-xs text-gray-500">
              <p>Receipt ID: {{ receipt.id }}</p>
              <p>Created: {{ formatDateTime(receipt.createdAt) }}</p>
              <p>Last updated: {{ formatDateTime(receipt.updatedAt) }}</p>
            </div>
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
  import { defineComponent, ref, computed, onMounted } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/authStore';
  import { useReceiptStore } from '../stores/receiptStore';
  import receiptService from '../services/receiptService';
  import { Receipt } from '../types';
  
  export default defineComponent({
    name: 'ViewReceipt',
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
      
      // Email state
      const showEmailModal = ref(false);
      const emailAddress = ref('');
      const emailMessage = ref('');
      const emailSending = ref(false);
      
      // Toast state
      const showSuccessToast = ref(false);
      const successMessage = ref('');
      
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
          receipt.value = loadedReceipt;
        }
      };
      
      // Format date for display
      const formatDate = (date: Date | string | undefined) => {
        if (!date) return '';
        
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString(undefined, {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      };
      
      // Format datetime for display
      const formatDateTime = (date: Date | string | undefined) => {
        if (!date) return '';
        
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleString();
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
      };
      
      return {
        receiptId,
        receipt,
        showEmailModal,
        emailAddress,
        emailMessage,
        emailSending,
        showSuccessToast,
        successMessage,
        formatDate,
        formatDateTime,
        sendEmailReceipt,
        exportAsPdf,
        authStore,
        receiptStore
      };
    }
  });
  </script>