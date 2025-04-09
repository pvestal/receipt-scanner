import { defineStore } from 'pinia'
import { ref } from 'vue'
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  type User
} from 'firebase/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  const auth = getAuth()

  // Initialize auth state
  onAuthStateChanged(auth, (firebaseUser) => {
    user.value = firebaseUser
    if (firebaseUser) {
      localStorage.setItem('user', JSON.stringify({
        uid: firebaseUser.uid,
        email: firebaseUser.email
      }))
    } else {
      localStorage.removeItem('user')
    }
  })

  async function signIn(email: string, password: string) {
    loading.value = true
    error.value = null
    
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return userCredential.user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sign in'
      console.error('Sign in error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signUp(email: string, password: string) {
    loading.value = true
    error.value = null
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password)
      user.value = userCredential.user
      return userCredential.user
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create account'
      console.error('Sign up error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    error.value = null
    
    try {
      await firebaseSignOut(auth)
      user.value = null
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to sign out'
      console.error('Sign out error:', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    user,
    loading,
    error,
    signIn,
    signUp,
    signOut
  }
})