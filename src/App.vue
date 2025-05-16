<script setup lang="ts">
// App root component
import { computed, ref } from 'vue';
import ThemeToggle from './components/ThemeToggle.vue';
import ThemeOptions from './components/ThemeOptions.vue';
import ThemeColorPicker from './components/ThemeColorPicker.vue';
import AccessibilityOptions from './components/AccessibilityOptions.vue';
import PageTransition from './components/PageTransition.vue';
import { useThemeStore } from './stores/themeStore';

// Access theme store
const themeStore = useThemeStore();

// Compute CSS class based on current theme
const appClass = computed(() => {
  return `app-container ${themeStore.theme}-theme`;
});

// Control theme options display
const showThemeOptions = ref(false);
const activeTab = ref('mode'); // 'mode' or 'colors'

const toggleThemeOptions = () => {
  showThemeOptions.value = !showThemeOptions.value;
};
</script>

<template>
  <div :class="appClass">
    <!-- Skip to content link for keyboard accessibility -->
    <a href="#main-content" class="skip-to-content">Skip to content</a>

    <!-- Add backdrop when theme options are shown to handle click-away -->
    <div
      v-if="showThemeOptions"
      class="theme-backdrop"
      @click="showThemeOptions = false"
    ></div>

    <!-- Theme controls positioned at top-right -->
    <div class="theme-controls-container">
      <ThemeToggle @click="toggleThemeOptions" showLabel />

      <!-- Theme options panel with animation -->
      <transition name="slide-fade">
        <div v-if="showThemeOptions" class="theme-options-panel animate-scale-in">
          <div class="theme-options-tabs">
            <button
              class="theme-tab"
              :class="{ active: activeTab === 'mode' }"
              @click="activeTab = 'mode'"
              aria-label="Theme mode options"
            >
              Mode
            </button>
            <button
              class="theme-tab"
              :class="{ active: activeTab === 'colors' }"
              @click="activeTab = 'colors'"
              aria-label="Theme color options"
            >
              Colors
            </button>
            <button
              class="theme-tab"
              :class="{ active: activeTab === 'a11y' }"
              @click="activeTab = 'a11y'"
              aria-label="Accessibility options"
            >
              Accessibility
            </button>
          </div>

          <div class="theme-options-content">
            <ThemeOptions
              v-if="activeTab === 'mode'"
              @mode-changed="showThemeOptions = false"
            />
            <ThemeColorPicker
              v-else-if="activeTab === 'colors'"
              @theme-changed="showThemeOptions = false"
            />
            <AccessibilityOptions
              v-else-if="activeTab === 'a11y'"
              @reset-a11y="showThemeOptions = false"
            />
          </div>
        </div>
      </transition>
    </div>

    <!-- Main content with page transitions -->
    <PageTransition type="fade" :duration="400" themeAware autoRoute>
      <main id="main-content" tabindex="-1" class="main-content">
        <router-view v-slot="{ Component }">
          <component :is="Component" />
        </router-view>
      </main>
    </PageTransition>

    <!-- Hidden div used for screen reader announcements -->
    <div aria-live="polite" class="sr-live" id="sr-announcements"></div>
  </div>
</template>

<style>
@import './style.css';
@import './assets/icon-styles.css';
@import './assets/theme.css';
@import './assets/transitions.css';
@import './assets/accessibility.css';

.app-container {
  width: 100%;
  min-height: 100vh;
  background-color: var(--color-background);
  color: var(--color-text);
}

.theme-controls-container {
  position: fixed;
  top: 1rem;
  right: 1rem;
  z-index: 1000;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .theme-controls-container {
    top: 0.5rem;
    right: 0.5rem;
  }
}

.theme-options-panel {
  margin-top: 0.5rem;
  position: absolute;
  top: 100%;
  right: 0;
  z-index: 1000;
  width: max-content;
  max-width: 90vw; /* Prevent overflow on mobile */
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  box-shadow: 0 4px 12px var(--color-shadow);
  overflow: hidden;
  border: 1px solid var(--color-border);
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .theme-options-panel {
    position: fixed;
    top: 4rem !important;
    right: 0.5rem;
    left: 0.5rem;
    width: auto;
    max-width: 100%;
  }
}

.theme-options-tabs {
  display: flex;
  border-bottom: 1px solid var(--color-border);
}

.theme-tab {
  flex: 1;
  padding: 0.75rem;
  background-color: var(--color-surface);
  border: none;
  color: var(--color-text-secondary);
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.theme-tab:hover {
  background-color: var(--color-gray-100);
  color: var(--color-text);
}

.dark-theme .theme-tab:hover {
  background-color: var(--color-gray-700);
}

.theme-tab.active {
  color: var(--color-primary);
  border-bottom: 2px solid var(--color-primary);
  background-color: var(--color-surface-secondary);
}

.theme-options-content {
  padding: 0;
}

/* Slide fade animation for theme options panel */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateY(-10px);
  opacity: 0;
}

/* Click away handler that covers the screen when theme options are open */
.theme-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: transparent;
  z-index: 999;
}

/* Main content area for mobile spacing */
.main-content {
  padding: 1rem;
  min-height: 100vh;
}

/* Mobile adjustments */
@media (max-width: 640px) {
  .main-content {
    padding: 0.5rem;
    padding-top: 3.5rem; /* Space for theme toggle */
  }
}

@media (max-width: 768px) {
  .theme-tab {
    padding: 0.5rem;
    font-size: 0.8rem;
  }
  
  .theme-options-content {
    max-height: 60vh;
    overflow-y: auto;
  }
}
</style>
