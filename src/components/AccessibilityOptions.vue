<template>
  <div class="accessibility-options">
    <h3 class="options-title">{{ title }}</h3>
    
    <div class="options-container">
      <!-- Font size controls -->
      <div class="option-group">
        <h4 class="option-group-title">Font Size</h4>
        <div class="font-size-controls">
          <button 
            class="font-size-btn" 
            @click="decreaseFontSize" 
            aria-label="Decrease font size"
            :disabled="fontSizeMultiplier <= 0.8"
          >
            A-
          </button>
          <div class="font-size-display">{{ Math.round(fontSizeMultiplier * 100) }}%</div>
          <button 
            class="font-size-btn" 
            @click="increaseFontSize" 
            aria-label="Increase font size"
            :disabled="fontSizeMultiplier >= 1.5"
          >
            A+
          </button>
        </div>
      </div>
      
      <!-- Contrast options -->
      <div class="option-group">
        <h4 class="option-group-title">Contrast</h4>
        <div class="contrast-options">
          <button 
            v-for="option in contrastOptions" 
            :key="option.value" 
            class="contrast-option"
            :class="{ active: currentContrast === option.value }"
            @click="setContrast(option.value)"
            :aria-label="`Set ${option.label} contrast`"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      
      <!-- Motion reduction -->
      <div class="option-group">
        <h4 class="option-group-title">Motion</h4>
        <div class="toggle-option">
          <label class="toggle-label">
            <span>Reduce animations</span>
            <div class="toggle-switch-container">
              <input 
                type="checkbox" 
                v-model="reduceMotion" 
                @change="toggleReduceMotion"
                id="reduce-motion"
              />
              <div class="toggle-switch"></div>
            </div>
          </label>
        </div>
      </div>
      
      <!-- Focus indicators -->
      <div class="option-group">
        <h4 class="option-group-title">Focus Indicators</h4>
        <div class="focus-options">
          <button 
            v-for="option in focusOptions" 
            :key="option.value" 
            class="focus-option"
            :class="{ active: currentFocus === option.value }"
            @click="setFocusStyle(option.value)"
            :aria-label="`Set ${option.label} focus style`"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Reset button -->
    <button 
      class="reset-button" 
      @click="resetAll" 
      aria-label="Reset all accessibility options to default"
    >
      Reset to Defaults
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { useThemeStore } from '../stores/themeStore';

export default defineComponent({
  name: 'AccessibilityOptions',
  
  props: {
    title: {
      type: String,
      default: 'Accessibility Options'
    }
  },
  
  setup(props, { emit }) {
    const themeStore = useThemeStore();
    
    // Font size controls
    const fontSizeMultiplier = ref(1.0);
    
    // Contrast settings
    const contrastOptions = [
      { label: 'Normal', value: 'normal' },
      { label: 'High', value: 'high' },
      { label: 'Very High', value: 'very-high' }
    ];
    const currentContrast = ref('normal');
    
    // Motion settings
    const reduceMotion = ref(false);
    
    // Focus style settings
    const focusOptions = [
      { label: 'Default', value: 'default' },
      { label: 'Enhanced', value: 'enhanced' },
      { label: 'High Visibility', value: 'high-visibility' }
    ];
    const currentFocus = ref('default');
    
    // Initialize from localStorage or user preferences
    onMounted(() => {
      // Font size
      const savedFontSize = localStorage.getItem('a11y-font-size');
      if (savedFontSize) {
        fontSizeMultiplier.value = parseFloat(savedFontSize);
        applyFontSize();
      }
      
      // Check for prefers-reduced-motion
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        reduceMotion.value = true;
        applyReduceMotion();
      } else {
        // Check for saved preference
        const savedMotion = localStorage.getItem('a11y-reduce-motion');
        if (savedMotion && savedMotion === 'true') {
          reduceMotion.value = true;
          applyReduceMotion();
        }
      }
      
      // Contrast
      const savedContrast = localStorage.getItem('a11y-contrast');
      if (savedContrast) {
        currentContrast.value = savedContrast;
        applyContrast();
      }
      
      // Focus style
      const savedFocus = localStorage.getItem('a11y-focus-style');
      if (savedFocus) {
        currentFocus.value = savedFocus;
        applyFocusStyle();
      }
    });
    
    // Font size methods
    const increaseFontSize = () => {
      if (fontSizeMultiplier.value < 1.5) {
        fontSizeMultiplier.value += 0.1;
        applyFontSize();
      }
    };
    
    const decreaseFontSize = () => {
      if (fontSizeMultiplier.value > 0.8) {
        fontSizeMultiplier.value -= 0.1;
        applyFontSize();
      }
    };
    
    const applyFontSize = () => {
      document.documentElement.style.setProperty('--a11y-font-size-multiplier', fontSizeMultiplier.value.toString());
      localStorage.setItem('a11y-font-size', fontSizeMultiplier.value.toString());
      emit('font-size-changed', fontSizeMultiplier.value);
    };
    
    // Contrast methods
    const setContrast = (contrast: string) => {
      currentContrast.value = contrast;
      applyContrast();
    };
    
    const applyContrast = () => {
      // Remove existing contrast classes
      document.documentElement.classList.remove('contrast-normal', 'contrast-high', 'contrast-very-high');
      
      // Add the new class
      document.documentElement.classList.add(`contrast-${currentContrast.value}`);
      
      localStorage.setItem('a11y-contrast', currentContrast.value);
      emit('contrast-changed', currentContrast.value);
      
      // Apply special contrast styles based on the level
      if (currentContrast.value === 'high' || currentContrast.value === 'very-high') {
        // Increase text contrast, border widths, etc.
        const contrastLevel = currentContrast.value === 'high' ? 1.5 : 2;
        themeStore.applyContrastEnhancement(contrastLevel);
      } else {
        themeStore.applyContrastEnhancement(1.0);
      }
    };
    
    // Motion methods
    const toggleReduceMotion = () => {
      applyReduceMotion();
    };
    
    const applyReduceMotion = () => {
      if (reduceMotion.value) {
        document.documentElement.classList.add('reduce-motion');
      } else {
        document.documentElement.classList.remove('reduce-motion');
      }
      
      localStorage.setItem('a11y-reduce-motion', reduceMotion.value.toString());
      emit('motion-changed', reduceMotion.value);
    };
    
    // Focus style methods
    const setFocusStyle = (style: string) => {
      currentFocus.value = style;
      applyFocusStyle();
    };
    
    const applyFocusStyle = () => {
      // Remove existing focus classes
      document.documentElement.classList.remove('focus-default', 'focus-enhanced', 'focus-high-visibility');
      
      // Add the new class
      document.documentElement.classList.add(`focus-${currentFocus.value}`);
      
      localStorage.setItem('a11y-focus-style', currentFocus.value);
      emit('focus-changed', currentFocus.value);
    };
    
    // Reset all settings
    const resetAll = () => {
      fontSizeMultiplier.value = 1.0;
      currentContrast.value = 'normal';
      reduceMotion.value = false;
      currentFocus.value = 'default';
      
      applyFontSize();
      applyContrast();
      applyReduceMotion();
      applyFocusStyle();
      
      emit('reset-a11y');
    };
    
    return {
      fontSizeMultiplier,
      increaseFontSize,
      decreaseFontSize,
      
      contrastOptions,
      currentContrast,
      setContrast,
      
      reduceMotion,
      toggleReduceMotion,
      
      focusOptions,
      currentFocus,
      setFocusStyle,
      
      resetAll
    };
  }
});
</script>

<style scoped>
.accessibility-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 1rem;
  background-color: var(--color-surface);
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  box-shadow: 0 2px 4px var(--color-shadow);
  transition: all var(--transition-normal);
  max-width: 400px;
}

.options-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.options-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.option-group {
  padding: 0.75rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface-secondary);
  border: 1px solid var(--color-border);
}

.option-group-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.font-size-controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.5rem;
}

.font-size-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.font-size-btn:hover:not(:disabled) {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.font-size-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.font-size-display {
  flex: 1;
  text-align: center;
  font-weight: 500;
  padding: 0.25rem 0.5rem;
  background-color: var(--color-surface);
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border);
}

.contrast-options,
.focus-options {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.contrast-option,
.focus-option {
  padding: 0.5rem 0.75rem;
  border-radius: var(--radius-md);
  background-color: var(--color-surface);
  border: 1px solid var(--color-border);
  color: var(--color-text);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.contrast-option:hover,
.focus-option:hover {
  background-color: var(--color-primary-light);
  color: var(--color-primary-dark);
}

.contrast-option.active,
.focus-option.active {
  background-color: var(--color-primary);
  color: white;
  border-color: var(--color-primary-dark);
}

.toggle-option {
  display: flex;
  justify-content: space-between;
}

.toggle-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  cursor: pointer;
}

.toggle-switch-container {
  position: relative;
  width: 3rem;
  height: 1.5rem;
}

.toggle-switch-container input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-switch {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-gray-300);
  border-radius: 1rem;
  transition: all var(--transition-fast);
}

.toggle-switch:before {
  position: absolute;
  content: "";
  height: 1.2rem;
  width: 1.2rem;
  left: 0.15rem;
  bottom: 0.15rem;
  background-color: white;
  border-radius: 50%;
  transition: all var(--transition-fast);
}

input:checked + .toggle-switch {
  background-color: var(--color-primary);
}

input:checked + .toggle-switch:before {
  transform: translateX(1.5rem);
}

.reset-button {
  margin-top: 0.5rem;
  padding: 0.5rem 1rem;
  background-color: var(--color-surface-secondary);
  color: var(--color-text);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 0.875rem;
  cursor: pointer;
  transition: all var(--transition-fast);
  align-self: center;
}

.reset-button:hover {
  background-color: var(--color-gray-200);
  color: var(--color-text);
}

.dark-theme .reset-button:hover {
  background-color: var(--color-gray-700);
}
</style>