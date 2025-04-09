<template>
  <div>
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-800">Account Settings</h1>
    </div>
    
    <div class="bg-white rounded-lg shadow-sm p-6">
      <form @submit.prevent="updateProfile" class="space-y-4">
        <div>
          <label for="displayName" class="block text-sm font-medium text-gray-700 mb-1">Display Name</label>
          <input
            id="displayName"
            v-model="displayName"
            type="text"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Your Name"
          />
        </div>
        
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            disabled
            class="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
          />
          <p class="mt-1 text-xs text-gray-500">Email cannot be changed</p>
        </div>
        
        <div>
          <button
            type="submit"
            class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            :disabled="authStore.loading || !isProfileChanged"
          >
            {{ authStore.loading ? 'Saving...' : 'Save Changes' }}
          </button>
        </div>
      </form>
      
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h2 class="text-lg font-medium text-gray-800 mb-4">Account Statistics</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-gray-500 mb-1">Total Receipts</h3>
            <p class="text-2xl font-semibold">{{ receiptStore.receipts.length }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-gray-500 mb-1">Total Spent</h3>
            <p class="text-2xl font-semibold">${{ totalSpent.toFixed(2) }}</p>
          </div>
          
          <div class="bg-gray-50 p-4 rounded-lg">
            <h3 class="text-sm font-medium text-gray-500 mb-1">Avg. Receipt</h3>
            <p class="text-2xl font-semibold">${{ averageReceipt.toFixed(2) }}</p>
          </div>
        </div>
      </div>
      
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h2 class="text-lg font-medium text-gray-800 mb-4">Password</h2>
        
        <button 
          type="button" 
          @click="handleResetPassword"
          class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
        >
          Reset Password
        </button>
      </div>
      
      <div class="mt-8 pt-6 border-t border-gray-200">
        <h2 class="text-lg font-medium text-red-600 mb-4">Danger Zone</h2>
        
        <button 
          type="button" 
          @click="confirmLogout"
          class="px-4 py-2 border border-red-300 rounded-md text-red-700 bg-white hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 mb-4"
        >
          Logout from all devices
        </button>
        
        <div>
          <button 
            type="button" 
            @click="confirmDeleteAccount"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            Delete Account
          </button>
          <p class="mt-1 text-xs text-gray-500">This action cannot be undone. All your data will be permanently deleted.</p>
        </div>
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
    
    <!-- Confirmation modal -->
    <div 
      v-if="showConfirmationModal" 
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
    >
      <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 class="text-xl font-bold mb-4">{{ confirmationTitle }}</h2>
        <p class="mb-6">{{ confirmationMessage }}</p>
        
        <div class="flex justify-end space-x-2">
          <button
            type="button"
            @click="showConfirmationModal = false"
            class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            Cancel
          </button>
          <button
            type="button"
            @click="handleConfirmation"
            class="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
          >
            {{ confirmationAction }}
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

export default defineComponent({
  name: 'UserProfile',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    const receiptStore = useReceiptStore();
    
    // User profile data
    const displayName = ref('');
    const email = ref('');
    
    // Original display name to detect changes
    const originalDisplayName = ref('');
    
    // Toast state
    const showSuccessToast = ref(false);
    const successMessage = ref('');
    
    // Confirmation modal state
    const showConfirmationModal = ref(false);
    const confirmationTitle = ref('');
    const confirmationMessage = ref('');
    const confirmationAction = ref('');
    const confirmationType = ref<'logout' | 'delete' | ''>('');
    
    // Computed properties
    const isProfileChanged = computed(() => {
      return displayName.value !== originalDisplayName.value;
    });
    
    const totalSpent = computed(() => {
      return receiptStore.receipts.reduce((sum, receipt) => sum + receipt.total, 0);
    });
    
    const averageReceipt = computed(() => {
      if (receiptStore.receipts.length === 0) return 0;
      return totalSpent.value / receiptStore.receipts.length;
    });
    
    // Load user data
    onMounted(() => {
      if (authStore.user) {
        displayName.value = authStore.user.displayName || '';
        originalDisplayName.value = authStore.user.displayName || '';
        email.value = authStore.user.email || '';
      }
    });
    
    // Update user profile
    const updateProfile = async () => {
      if (!isProfileChanged.value) return;
      
      const success = await authStore.updateUserProfile(displayName.value);
      
      if (success) {
        originalDisplayName.value = displayName.value;
        
        // Show success toast
        successMessage.value = 'Profile updated successfully!';
        showSuccessToast.value = true;
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          showSuccessToast.value = false;
        }, 3000);
      }
    };
    
    // Handle password reset
    const handleResetPassword = async () => {
      if (!email.value) return;
      
      const success = await authStore.resetPassword(email.value);
      
      if (success) {
        // Show success toast
        successMessage.value = 'Password reset email sent!';
        showSuccessToast.value = true;
        
        // Hide toast after 3 seconds
        setTimeout(() => {
          showSuccessToast.value = false;
        }, 3000);
      }
    };
    
    // Confirm logout from all devices
    const confirmLogout = () => {
      confirmationTitle.value = 'Logout from all devices';
      confirmationMessage.value = 'Are you sure you want to logout from all devices? You will need to login again on all your devices.';
      confirmationAction.value = 'Logout';
      confirmationType.value = 'logout';
      showConfirmationModal.value = true;
    };
    
    // Confirm account deletion
    const confirmDeleteAccount = () => {
      confirmationTitle.value = 'Delete Account';
      confirmationMessage.value = 'Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently deleted.';
      confirmationAction.value = 'Delete Account';
      confirmationType.value = 'delete';
      showConfirmationModal.value = true;
    };
    
    // Handle confirmation action
    const handleConfirmation = async () => {
      showConfirmationModal.value = false;
      
      if (confirmationType.value === 'logout') {
        // In a real implementation, you would call an API to invalidate all sessions
        await authStore.logout();
        router.push('/login');
      } else if (confirmationType.value === 'delete') {
        // In a real implementation, you would call an API to delete the account
        alert('Account deletion would be implemented here');
        await authStore.logout();
        router.push('/login');
      }
      
      confirmationType.value = '';
    };
    
    return {
      displayName,
      email,
      isProfileChanged,
      totalSpent,
      averageReceipt,
      showSuccessToast,
      successMessage,
      showConfirmationModal,
      confirmationTitle,
      confirmationMessage,
      confirmationAction,
      updateProfile,
      handleResetPassword,
      confirmLogout,
      confirmDeleteAccount,
      handleConfirmation,
      authStore,
      receiptStore
    };
  }
});
</script>