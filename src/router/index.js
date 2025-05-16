import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/authStore'
// Import the theme store to handle theme transitions during navigation
import { nextTick } from 'vue'

const routes = [
  {
    path: '/',
    name: 'Dashboard',
    component: () => import('../views/DashboardView.vue')
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/LoginView.vue')
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/RegisterView.vue')
  },
  {
    path: '/scan',
    name: 'ScanReceipt',
    component: () => import('../views/ScanReceipt.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'UserProfile',
    component: () => import('../views/UserProfile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/receipt/:id',
    name: 'ViewReceipt',
    component: () => import('../views/ViewReceipt.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/receipt/:id/edit',
    name: 'EditReceipt',
    component: () => import('../views/EditReceipt.vue'),
    meta: { requiresAuth: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// Navigation guard for auth-required routes
router.beforeEach((to, from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const authStore = useAuthStore()
  const isAuthenticated = authStore.isAuthenticated()

  // Set a custom transition based on navigation direction
  if (to.meta.transition) {
    // Use predefined transition if specified in the route
    to.meta.transitionName = to.meta.transition;
  } else {
    // Try to intelligently determine the direction
    const toDepth = to.path.split('/').length
    const fromDepth = from.path.split('/').length

    if (toDepth > fromDepth) {
      to.meta.transitionName = 'slide-left'
    } else if (fromDepth > toDepth) {
      to.meta.transitionName = 'slide-right'
    } else {
      to.meta.transitionName = 'fade'
    }
  }

  if (requiresAuth && !isAuthenticated) {
    next('/login')
  } else if ((to.path === '/login' || to.path === '/register') && isAuthenticated) {
    // Redirect to dashboard if trying to access login/register while already logged in
    next('/')
  } else {
    next()
  }
})

// After navigation is complete
router.afterEach((to) => {
  // Apply page-specific transitions or animations after navigation completes
  nextTick(() => {
    // You could dispatch a custom event or perform additional
    // transition-related logic here after the route changes
    document.dispatchEvent(new CustomEvent('route-changed', {
      detail: { route: to, transitionName: to.meta.transitionName }
    }));
  });
})

export default router