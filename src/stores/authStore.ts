import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  updateProfile,
  updateEmail,
  updatePassword,
  GoogleAuthProvider,
  signInWithPopup,
  type User,
  type UserCredential
} from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const auth = getAuth()

  // Initialize auth state from localStorage
  const storedUser = localStorage.getItem('user')
  if (storedUser) {
    try {
      const parsedUser = JSON.parse(storedUser)
      if (parsedUser && parsedUser.uid) {
        // We don't have the actual User object, but we know the user was logged in
        // The actual User object will be set by onAuthStateChanged
      }
    } catch (err) {
      console.error('Error parsing stored user:', err)
      localStorage.removeItem('user')
    }
  }

  // Login with email/password method
  async function login(email: string, password: string): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to login'
      console.error('Login error:', err)
      return false
    } finally {
      loading.value = false
    }
  }
  
  // Login with Google method
  async function loginWithGoogle(): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      const provider = new GoogleAuthProvider()
      const userCredential = await signInWithPopup(auth, provider)
      user.value = userCredential.user
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to login with Google'
      console.error('Google login error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Register method
  async function register(email: string, password: string, displayName?: string): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      
      // Set display name if provided
      if (displayName && user.value) {
        await updateProfile(user.value, { displayName })
      }
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to register'
      console.error('Register error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Logout method
  async function logout(): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      await firebaseSignOut(auth)
      user.value = null
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to logout'
      console.error('Logout error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Reset password method
  async function resetPassword(email: string): Promise<boolean> {
    loading.value = true
    error.value = null
    
    try {
      await sendPasswordResetEmail(auth, email)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to send password reset email'
      console.error('Reset password error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Update user profile method
  async function updateUserProfile(displayName?: string, photoURL?: string): Promise<boolean> {
    if (!user.value) {
      error.value = 'No user logged in'
      return false
    }
    
    loading.value = true
    error.value = null
    
    try {
      await updateProfile(user.value, { 
        displayName: displayName ?? user.value.displayName,
        photoURL: photoURL ?? user.value.photoURL
      })
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile'
      console.error('Update profile error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Update user email method
  async function updateUserEmail(newEmail: string): Promise<boolean> {
    if (!user.value) {
      error.value = 'No user logged in'
      return false
    }
    
    loading.value = true
    error.value = null
    
    try {
      await updateEmail(user.value, newEmail)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update email'
      console.error('Update email error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Update user password method
  async function updateUserPassword(newPassword: string): Promise<boolean> {
    if (!user.value) {
      error.value = 'No user logged in'
      return false
    }
    
    loading.value = true
    error.value = null
    
    try {
      await updatePassword(user.value, newPassword)
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update password'
      console.error('Update password error:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  // Getters
  const isAuthenticated = (): boolean => !!user.value
  const currentUser = (): User | null => user.value
  const userDisplayName = (): string => user.value?.displayName || user.value?.email?.split('@')[0] || 'User'
  const userEmail = (): string | null => user.value?.email || null
  const userId = (): string | null => user.value?.uid || null

  return {
    user,
    loading,
    error,
    login,
    loginWithGoogle,
    register,
    logout,
    resetPassword,
    updateUserProfile,
    updateUserEmail,
    updateUserPassword,
    isAuthenticated,
    currentUser,
    userDisplayName,
    userEmail,
    userId
  }
})