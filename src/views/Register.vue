<template>
  <div class="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
    <h1 class="text-2xl font-bold text-gray-800 mb-6 text-center">Create Account</h1>
    
    <form @submit.prevent="handleRegister" class="space-y-4">
      <div>
        <label for="name" class="block text-sm font-medium text-gray-700 mb-1">Name</label>
        <input
          id="name"
          v-model="name"
          type="text"
          required
          autocomplete="name"
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
          autocomplete="new-password"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="••••••••"
        />
        <p class="mt-1 text-xs text-gray-500">Password must be at least 6 characters long</p>
      </div>
      
      <div>
        <label for="confirmPassword" class="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
        <input
          id="confirmPassword"
          v-model="confirmPassword"
          type="password"
          required
          autocomplete="new-password"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-primary focus:border-primary"
          placeholder="••••••••"
        />
      </div>
      
      <div v-if="passwordError" class="text-red-500 text-sm mt-1">
        {{ passwordError }}
      </div>
      
      <div>
        <button
          type="submit"
          class="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          :disabled="authStore.loading"
        >
          {{ authStore.loading ? 'Creating Account...' : 'Create Account' }}
        </button>
      </div>
    </form>
    
    <div class="mt-6 text-center">
      <p class="text-sm text-gray-600">
        Already have an account?
        <router-link to="/login" class="font-medium text-primary hover:text-primary-dark">
          Sign in
        </router-link>
      </p>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/authStore';

export default defineComponent({
  name: 'Register',
  setup() {
    const router = useRouter();
    const authStore = useAuthStore();
    
    // Form state
    const name = ref('');
    const email = ref('');
    const password = ref('');
    const confirmPassword = ref('');
    
    const passwordError = computed(() => {
      if (password.value && password.value.length < 6) {
        return 'Password must be at least 6 characters long';
      }
      if (password.value && confirmPassword.value && password.value !== confirmPassword.value) {
        return 'Passwords do not match';
      }
      return '';
    });
    
    // Register handler
    const handleRegister = async () => {
      if (!email.value || !password.value || password.value !== confirmPassword.value) {
        return;
      }
      
      if (password.value.length < 6) {
        return;
      }
      
      const success = await authStore.register(email.value, password.value, name.value);
      
      if (success) {
        router.push('/dashboard');
      }
    };
    
    return {
      authStore,
      name,
      email,
      password,
      confirmPassword,
      passwordError,
      handleRegister
    };
  }
});
</script>