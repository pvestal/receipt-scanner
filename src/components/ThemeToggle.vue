<template>
  <div class="theme-toggle-container">
    <button
      @click="toggleTheme"
      class="theme-toggle"
      :class="{ 'theme-toggle-active': isAnimating }"
      :title="currentTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
      aria-label="Toggle theme"
      @mouseenter="hoverEffect = true"
      @mouseleave="hoverEffect = false"
    >
      <div class="icon-container" :class="{ 'rotate': isAnimating }">
        <!-- Sun icon for dark mode -->
        <transition
          name="theme-icon-transition"
          mode="out-in"
        >
          <svg v-if="currentTheme === 'dark'" key="sun" xmlns="http://www.w3.org/2000/svg" class="icon icon-md icon-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>

          <!-- Moon icon for light mode -->
          <svg v-else key="moon" xmlns="http://www.w3.org/2000/svg" class="icon icon-md icon-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
          </svg>
        </transition>
      </div>

      <!-- Visual indicator for current theme -->
      <span class="sr-only">{{ currentTheme === 'dark' ? 'Dark' : 'Light' }} mode active</span>
    </button>

    <!-- Theme name label (optional, can be hidden with CSS) -->
    <span class="theme-label" v-if="showLabel">{{ currentTheme === 'dark' ? 'Dark' : 'Light' }}</span>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { useThemeStore } from '../stores/themeStore';

export default defineComponent({
  name: 'ThemeToggle',

  props: {
    showLabel: {
      type: Boolean,
      default: false
    },
    animationDuration: {
      type: Number,
      default: 800 // milliseconds
    }
  },

  setup(props) {
    const themeStore = useThemeStore();
    const currentTheme = ref(themeStore.theme);
    const isAnimating = ref(false);
    const hoverEffect = ref(false);

    // Initialize theme from localStorage if available
    onMounted(() => {
      themeStore.initTheme();
      currentTheme.value = themeStore.theme;
    });

    // Toggle between light and dark themes with animation
    const toggleTheme = () => {
      isAnimating.value = true;

      // Slight delay before actually changing theme to allow animation to start
      setTimeout(() => {
        themeStore.toggleTheme();
        currentTheme.value = themeStore.theme;

        // Reset animation state after duration
        setTimeout(() => {
          isAnimating.value = false;
        }, props.animationDuration);
      }, 150);
    };

    // Watch for theme changes from other components
    watch(() => themeStore.theme, (newTheme) => {
      if (currentTheme.value !== newTheme) {
        currentTheme.value = newTheme;
        isAnimating.value = true;

        setTimeout(() => {
          isAnimating.value = false;
        }, props.animationDuration);
      }
    });

    return {
      currentTheme,
      toggleTheme,
      isAnimating,
      hoverEffect
    };
  }
});
</script>

<style scoped>
.theme-toggle-container {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.theme-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.5rem;
  background-color: transparent;
  border: none;
  border-radius: var(--radius-full);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  width: 2.5rem;
  height: 2.5rem;
  transition: background-color var(--transition-fast), transform var(--transition-fast);
}

.theme-toggle:hover {
  background-color: var(--color-gray-100);
  transform: scale(1.05);
}

.dark-theme .theme-toggle:hover {
  background-color: var(--color-gray-800);
}

.theme-toggle:active {
  transform: scale(0.95);
}

.theme-toggle-active {
  animation: pulse 0.5s cubic-bezier(0.4, 0, 0.6, 1);
}

.icon-container {
  display: flex;
  justify-content: center;
  align-items: center;
  transition: transform 0.3s ease;
}

.icon-container.rotate {
  transform: rotate(180deg);
}

.theme-icon-transition-enter-active,
.theme-icon-transition-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
}

.theme-icon-transition-enter-from {
  opacity: 0;
  transform: translateY(20px) scale(0.7);
}

.theme-icon-transition-leave-to {
  opacity: 0;
  transform: translateY(-20px) scale(0.7);
}

.theme-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text-secondary);
  transition: color var(--transition-normal);
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.15);
    opacity: 0.85;
  }
}
</style>