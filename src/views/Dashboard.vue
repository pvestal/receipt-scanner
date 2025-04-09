<template>
    <div>
      <div class="flex justify-between items-center mb-6">
        <h1 class="text-2xl font-bold text-gray-800">My Receipts</h1>
        
        <router-link 
          to="/scan" 
          class="bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <span class="flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
            </svg>
            Scan New Receipt
          </span>
        </router-link>
      </div>
      
      <!-- Search and filter -->
      <div class="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div class="flex flex-col md:flex-row md:items-center md:space-x-4 space-y-2 md:space-y-0">
          <div class="flex-1">
            <label for="search" class="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input
              id="search"
              v-model="searchQuery"
              type="text"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
              placeholder="Search by store or item..."
            />
          </div>
          
          <div class="md:w-1/4">
            <label for="dateFrom" class="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <input
              id="dateFrom"
              v-model="dateFrom"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
          
          <div class="md:w-1/4">
            <label for="dateTo" class="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <input
              id="dateTo"
              v-model="dateTo"
              type="date"
              class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            />
          </div>
        </div>
      </div>
      
      <!-- Receipts list -->
      <div v-if="filteredReceipts.length > 0" class="space-y-4">
        <div
          v-for="receipt in filteredReceipts"
          :key="receipt.id"
          class="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow p-4"
        >
          <router-link :to="`/receipt/${receipt.id}`" class="block">
            <div class="flex justify-between items-start">
              <div>
                <h2 class="text-xl font-semibold text-gray-800">{{ receipt.store }}</h2>
                <p class="text-gray-600">
                  {{ formatDate(receipt.date) }} • 
                  {{ receipt.items.length }} items • 
                  ${{ receipt.total.toFixed(2) }}
                </p>
              </div>
              
              <div class="flex space-x-2">
                <router-link 
                  :to="`/receipt/${receipt.id}/edit`" 
                  class="text-primary hover:text-primary-dark"
                  @click.stop
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </router-link>
                
                <button 
                  @click.stop.prevent="confirmDelete(receipt)" 
                  class="text-red-500 hover:text-red-700"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                  </svg>
                </button>
              </div>
            </div>
            
            <!-- Preview of receipt items -->
            <div class="mt-2">
              <p v-if="receipt.items.length === 0" class="text-gray-500 italic">No items</p>
              <ul v-else class="text-sm text-gray-600">
                <li v-for="(item, index) in getPreviewItems(receipt)" :key="item.id" class="truncate">
                  {{ item.quantity }}x {{ item.name }} - ${{ (item.price * item.quantity).toFixed(2) }}
                </li>
                <li v-if="receipt.items.length > 3" class="text-gray-400 italic">
                  ...and {{ receipt.items.length - 3 }} more items
                </li>
              </ul>
            </div>
          </router-link>
        </div>
      </div>
      
      <!-- Empty state -->
      <div 
        v-else-if="!receiptStore.loading" 
        class="bg-white rounded-lg shadow-sm p-8 text-center"
      >
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 sm:h-8 sm:w-8 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        
        <h2 class="text-xl font-medium text-gray-800 mb-2">No receipts found</h2>
        
        <p v-if="searchQuery || dateFrom || dateTo" class="text-gray-600 mb-4">
          Try changing your search or date filters
        </p>
        <p v-else class="text-gray-600 mb-4">
          Get started by scanning your first receipt
        </p>
        
        <router-link 
          to="/scan" 
          class="inline-flex items-center bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-dark transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
            <path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-1.121-1.121A2 2 0 0011.172 3H8.828a2 2 0 00-1.414.586L6.293 4.707A1 1 0 015.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />
          </svg>
          Scan New Receipt
        </router-link>
      </div>
      
      <!-- Delete confirmation modal -->
      <div 
        v-if="showDeleteModal" 
        class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      >
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Delete Receipt</h2>
          <p class="mb-4">
            Are you sure you want to delete the receipt from 
            <span class="font-medium">{{ receiptToDelete?.store }}</span> 
            on {{ formatDate(receiptToDelete?.date) }}?
          </p>
          <p class="text-gray-600 mb-6">This action cannot be undone.</p>
          
          <div class="flex justify-end space-x-2">
            <button
              @click="showDeleteModal = false"
              class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            >
              Cancel
            </button>
            <button
              @click="deleteReceipt"
              class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref, computed, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/authStore';
  import { useReceiptStore } from '../stores/receiptStore';
  import { Receipt, ReceiptItem } from '../types';
  
  export default defineComponent({
    name: 'Dashboard',
    setup() {
      const router = useRouter();
      const authStore = useAuthStore();
      const receiptStore = useReceiptStore();
      
      // Search and filter state
      const searchQuery = ref('');
      const dateFrom = ref('');
      const dateTo = ref('');
      
      // Delete modal state
      const showDeleteModal = ref(false);
      const receiptToDelete = ref<Receipt | null>(null);
      
      // Load receipts on component mount
      onMounted(async () => {
        if (authStore.currentUserId) {
          await receiptStore.fetchReceipts(authStore.currentUserId);
        }
      });
      
      // Computed property for filtered receipts
      const filteredReceipts = computed(() => {
        let result = [...receiptStore.receipts];
        
        // Apply search filter
        if (searchQuery.value) {
          const query = searchQuery.value.toLowerCase();
          result = result.filter(receipt => {
            // Check store name
            if (receipt.store.toLowerCase().includes(query)) {
              return true;
            }
            
            // Check items
            return receipt.items.some(item => 
              item.name.toLowerCase().includes(query)
            );
          });
        }
        
        // Apply date filters
        if (dateFrom.value) {
          const fromDate = new Date(dateFrom.value);
          result = result.filter(receipt => {
            const receiptDate = receipt.date instanceof Date 
              ? receipt.date 
              : new Date(receipt.date);
            
            return receiptDate >= fromDate;
          });
        }
        
        if (dateTo.value) {
          const toDate = new Date(dateTo.value);
          // Set time to end of day for the to-date
          toDate.setHours(23, 59, 59, 999);
          
          result = result.filter(receipt => {
            const receiptDate = receipt.date instanceof Date 
              ? receipt.date 
              : new Date(receipt.date);
            
            return receiptDate <= toDate;
          });
        }
        
        return result;
      });
      
      // Format date for display
      const formatDate = (date: Date | string | undefined) => {
        if (!date) return '';
        
        const d = date instanceof Date ? date : new Date(date);
        return d.toLocaleDateString(undefined, { 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      };
      
      // Get preview items (first 3)
      const getPreviewItems = (receipt: Receipt) => {
        return receipt.items.slice(0, 3);
      };
      
      // Confirmation modal for delete
      const confirmDelete = (receipt: Receipt) => {
        receiptToDelete.value = receipt;
        showDeleteModal.value = true;
      };
      
      // Delete receipt
      const deleteReceipt = async () => {
        if (!receiptToDelete.value || !authStore.currentUserId) return;
        
        const success = await receiptStore.deleteReceipt(
          receiptToDelete.value.id,
          authStore.currentUserId
        );
        
        if (success) {
          showDeleteModal.value = false;
          receiptToDelete.value = null;
        }
      };
      
      return {
        authStore,
        receiptStore,
        searchQuery,
        dateFrom,
        dateTo,
        filteredReceipts,
        showDeleteModal,
        receiptToDelete,
        formatDate,
        getPreviewItems,
        confirmDelete,
        deleteReceipt
      };
    }
  });
  </script>