<template>
    <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
      <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">Login</h1>
      
      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label for="email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            id="email"
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="your@email.com"
          />
        </div>
        
        <div>
          <label for="password" class="block text-sm font-medium text-gray-700 mb-1">Password</label>
          <input
            id="password"
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="••••••••"
          />
        </div>
        
        <div class="flex items-center justify-between">
          <div class="flex items-center">
            <input
              id="remember-me"
              v-model="rememberMe"
              type="checkbox"
              class="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
            />
            <label for="remember-me" class="ml-2 block text-sm text-gray-700">
              Remember me
            </label>
          </div>
          
          <button
            type="button"
            @click="forgotPassword"
            class="text-sm font-medium text-primary hover:text-primary-dark"
          >
            Forgot password?
          </button>
        </div>
        
        <div>
          <button
            type="submit"
            class="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
            :disabled="authStore.loading"
          >
            {{ authStore.loading ? 'Logging in...' : 'Login' }}
          </button>
        </div>
      </form>
      
      <div class="mt-6 text-center">
        <p class="text-sm text-gray-600">
          Don't have an account?
          <router-link to="/register" class="font-medium text-primary hover:text-primary-dark">
            Sign up
          </router-link>
        </p>
      </div>
      
      <!-- Password Reset Modal -->
      <div v-if="showResetModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
          <h2 class="text-xl font-bold mb-4">Reset Password</h2>
          <p class="mb-4">Enter your email address and we'll send you a link to reset your password.</p>
          
          <form @submit.prevent="handleResetPassword" class="space-y-4">
            <div>
              <label for="reset-email" class="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                id="reset-email"
                v-model="resetEmail"
                type="email"
                required
                class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
                placeholder="your@email.com"
              />
            </div>
            
            <div class="flex justify-end space-x-2">
              <button
                type="button"
                @click="showResetModal = false"
                class="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                Cancel
              </button>
              <button
                type="submit"
                class="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                :disabled="resetLoading"
              >
                {{ resetLoading ? 'Sending...' : 'Send Reset Link' }}
              </button>
            </div>
          </form>
        </div>
      </div>
      
      <!-- Success toast -->
      <div 
        v-if="resetSuccess" 
        class="fixed bottom-4 right-4 bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded shadow-md transition-opacity duration-500"
        :class="{ 'opacity-0': resetSuccessFading }"
      >
        <div class="flex items-center">
          <div class="py-1">
            <svg class="fill-current h-6 w-6 text-green-500 mr-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"/>
            </svg>
          </div>
          <div>
            <p>Password reset email sent successfully!</p>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, ref } from 'vue';
  import { useRouter } from 'vue-router';
  import { useAuthStore } from '../stores/authStore';
  
  export default defineComponent({
    name: 'Login',
    setup() {
      const router = useRouter();
      const authStore = useAuthStore();
      
      // Form state
      const email = ref('');
      const password = ref('');
      const rememberMe = ref(false);
      
      // Password reset
      const showResetModal = ref(false);
      const resetEmail = ref('');
      const resetLoading = ref(false);
      const resetSuccess = ref(false);
      const resetSuccessFading = ref(false);
      
      // Login handler
      const handleLogin = async () => {
        if (!email.value || !password.value) return;
        
        const success = await authStore.login(email.value, password.value);
        
        if (success) {
          router.push('/');
        }
      };
      
      // Forgot password handler
      const forgotPassword = () => {
        resetEmail.value = email.value;
        showResetModal.value = true;
      };
      
      // Reset password handler
      const handleResetPassword = async () => {
        if (!resetEmail.value) return;
        
        resetLoading.value = true;
        
        try {
          await authStore.resetPassword(resetEmail.value);
          resetSuccess.value = true;
          showResetModal.value = false;
          
          // Hide success message after 5 seconds
          setTimeout(() => {
            resetSuccessFading.value = true;
          }, 4000);
          
          setTimeout(() => {
            resetSuccess.value = false;
            resetSuccessFading.value = false;
          }, 4500);
        } catch (error) {
          console.error('Reset password error:', error);
        } finally {
          resetLoading.value = false;
        }
      };
      
      return {
        authStore,
        email,
        password,
        rememberMe,
        showResetModal,
        resetEmail,
        resetLoading,
        resetSuccess,
        resetSuccessFading,
        handleLogin,
        forgotPassword,
        handleResetPassword
      };
    }
  });
  </script>