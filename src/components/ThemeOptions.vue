<template>
  <div class="theme-options">
    <h3 class="theme-options-title">{{ title }}</h3>
    
    <div class="theme-modes">
      <button 
        v-for="mode in themeModes" 
        :key="mode.value"
        class="theme-mode-button"
        :class="{ 'active': currentMode === mode.value }"
        @click="setThemeMode(mode.value)"
        :title="`Use ${mode.label} theme mode`"
      >
        <div class="icon-container">
          <component :is="mode.icon" class="icon" :class="iconClass" />
        </div>
        <span class="mode-label">{{ mode.label }}</span>
      </button>
    </div>
    
    <div v-if="showPreview" class="theme-preview">
      <div class="preview-light" @click="quickPreview('light')">
        <div class="preview-circle"></div>
        <span>Light</span>
      </div>
      <div class="preview-dark" @click="quickPreview('dark')">
        <div class="preview-circle"></div>
        <span>Dark</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, h } from 'vue';
import { useThemeStore } from '../stores/themeStore';

interface Props {
  title?: string;
  showPreview?: boolean;
  iconClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Theme Settings',
  showPreview: true,
  iconClass: 'icon-md icon-primary'
});

const emit = defineEmits(['mode-changed']);

const themeStore = useThemeStore();
const currentMode = ref(themeStore.mode);
const previewTimer = ref<number | null>(null);
const originalTheme = ref(themeStore.theme);

// Icon components using functional components with h() function
const LightDarkIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
}, [
  h('path', { d: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z' }),
  h('path', { d: 'M12 2v2' }),
  h('path', { d: 'M12 20v2' }),
  h('path', { d: 'M4.93 4.93l1.41 1.41' }),
  h('path', { d: 'M17.66 17.66l1.41 1.41' }),
  h('path', { d: 'M2 12h2' }),
  h('path', { d: 'M20 12h2' }),
  h('path', { d: 'M6.34 17.66l-1.41 1.41' }),
  h('path', { d: 'M19.07 4.93l-1.41 1.41' })
]);

const SystemIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
}, [
  h('rect', { x: '2', y: '3', width: '20', height: '14', rx: '2' }),
  h('line', { x1: '8', y1: '21', x2: '16', y2: '21' }),
  h('line', { x1: '12', y1: '17', x2: '12', y2: '21' })
]);

const TimeIcon = () => h('svg', {
  xmlns: 'http://www.w3.org/2000/svg',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  'stroke-width': '2',
  'stroke-linecap': 'round',
  'stroke-linejoin': 'round'
}, [
  h('circle', { cx: '12', cy: '12', r: '10' }),
  h('polyline', { points: '12 6 12 12 16 14' })
]);

const themeModes = [
  { value: 'light', label: 'Light', icon: LightDarkIcon },
  { value: 'dark', label: 'Dark', icon: LightDarkIcon },
  { value: 'system', label: 'System', icon: SystemIcon },
  { value: 'time', label: 'Auto (Time)', icon: TimeIcon },
];

// Initialize current mode from store
onMounted(() => {
  currentMode.value = themeStore.mode;
});

// Watch for external mode changes
watch(() => themeStore.mode, (newMode) => {
  currentMode.value = newMode;
});

const setThemeMode = (mode: typeof themeStore.mode) => {
  currentMode.value = mode;
  themeStore.setMode(mode);
  emit('mode-changed', mode);
};

const quickPreview = (theme: 'light' | 'dark') => {
  // Store original theme if not already stored
  if (!originalTheme.value) {
    originalTheme.value = themeStore.theme;
  }
  
  // Clear existing timer
  if (previewTimer.value) {
    clearTimeout(previewTimer.value);
  }
  
  // Apply preview theme
  themeStore.setTheme(theme);
  
  // Revert after 2 seconds
  previewTimer.value = setTimeout(() => {
    themeStore.setTheme(originalTheme.value);
    originalTheme.value = themeStore.theme;
  }, 2000) as unknown as number;
};
</script>

<style scoped>
.theme-options {
  padding: 1rem;
}

.theme-options-title {
  font-size: 1rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: var(--color-text);
}

.theme-modes {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

.theme-mode-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background-color: var(--color-gray-100);
  border: 2px solid transparent;
  border-radius: 12px;
  cursor: pointer;
  transition: all 200ms ease;
  min-height: 100px;
}

.theme-mode-button:hover {
  background-color: var(--color-gray-200);
  transform: translateY(-2px);
}

.theme-mode-button.active {
  background-color: var(--color-primary);
  background-color: rgba(59, 130, 246, 0.1);
  border-color: var(--color-primary);
}

.icon-container {
  width: 32px;
  height: 32px;
  margin-bottom: 0.5rem;
}

.icon {
  width: 100%;
  height: 100%;
}

.mode-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-text);
}

.theme-mode-button.active .mode-label {
  color: var(--color-primary);
}

/* Theme preview section */
.theme-preview {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--color-border);
  display: flex;
  gap: 1rem;
  justify-content: center;
}

.preview-light,
.preview-dark {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 8px;
  transition: all 200ms ease;
}

.preview-light:hover,
.preview-dark:hover {
  background-color: var(--color-gray-100);
}

.preview-circle {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: 2px solid var(--color-border);
}

.preview-light .preview-circle {
  background-color: #ffffff;
}

.preview-dark .preview-circle {
  background-color: #1f2937;
}

.preview-light span,
.preview-dark span {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

/* Dark theme adjustments */
.dark-theme .theme-mode-button {
  background-color: var(--color-gray-800);
}

.dark-theme .theme-mode-button:hover {
  background-color: var(--color-gray-700);
}

.dark-theme .theme-mode-button.active {
  background-color: rgba(59, 130, 246, 0.15);
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .theme-modes {
    grid-template-columns: repeat(2, 1fr);
    gap: 0.5rem;
  }
  
  .theme-mode-button {
    padding: 0.75rem;
    min-height: 80px;
  }
  
  .icon-container {
    width: 28px;
    height: 28px;
  }
  
  .mode-label {
    font-size: 0.8rem;
  }
}
</style>