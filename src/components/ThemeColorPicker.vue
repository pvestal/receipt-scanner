<template>
  <div class="theme-color-picker">
    <h3 class="color-picker-title">{{ title }}</h3>
    
    <div class="color-presets">
      <div
        v-for="(preset, index) in colorPresets"
        :key="index"
        class="color-preset"
        :style="{ backgroundColor: preset.primary }"
        :title="preset.name"
        @click="selectPreset(preset)"
        :class="{ 'active': isCurrentPreset(preset) }"
      >
        <div class="preset-colors">
          <div class="preset-color" :style="{ backgroundColor: preset.primary }"></div>
          <div class="preset-color" :style="{ backgroundColor: preset.secondary }"></div>
          <div class="preset-color" :style="{ backgroundColor: preset.accent }"></div>
        </div>
        <span class="preset-name">{{ preset.name }}</span>
      </div>
    </div>
    
    <div class="custom-colors-section" v-if="allowCustom">
      <h4 class="custom-section-title">Custom Colors</h4>
      
      <div class="color-pickers">
        <div class="color-picker-group">
          <label>Primary</label>
          <div class="color-input-wrapper">
            <div class="color-preview" :style="{ backgroundColor: customColors.primary }"></div>
            <input 
              type="color" 
              v-model="customColors.primary" 
              @change="applyCustomColors"
            />
          </div>
        </div>
        
        <div class="color-picker-group">
          <label>Secondary</label>
          <div class="color-input-wrapper">
            <div class="color-preview" :style="{ backgroundColor: customColors.secondary }"></div>
            <input 
              type="color" 
              v-model="customColors.secondary" 
              @change="applyCustomColors"
            />
          </div>
        </div>
        
        <div class="color-picker-group">
          <label>Accent</label>
          <div class="color-input-wrapper">
            <div class="color-preview" :style="{ backgroundColor: customColors.accent }"></div>
            <input 
              type="color" 
              v-model="customColors.accent" 
              @change="applyCustomColors"
            />
          </div>
        </div>
      </div>
      
      <button 
        class="reset-button" 
        @click="resetToDefault"
      >
        Reset to Default
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, reactive, onMounted, watch } from 'vue';
import { useThemeStore } from '../stores/themeStore';

interface ColorPreset {
  name: string;
  primary: string;
  secondary: string;
  accent: string;
  id: string;
}

export default defineComponent({
  name: 'ThemeColorPicker',
  
  props: {
    title: {
      type: String,
      default: 'Color Theme'
    },
    allowCustom: {
      type: Boolean,
      default: true
    }
  },
  
  setup(props, { emit }) {
    const themeStore = useThemeStore();
    const currentPresetId = ref('default');
    
    // Color presets
    const colorPresets: ColorPreset[] = [
      {
        name: 'Default',
        primary: '#2563EB', // blue-600
        secondary: '#059669', // emerald-600
        accent: '#8B5CF6', // violet-500
        id: 'default'
      },
      {
        name: 'Ocean',
        primary: '#0284C7', // sky-600
        secondary: '#0891B2', // cyan-600
        accent: '#4F46E5', // indigo-600
        id: 'ocean'
      },
      {
        name: 'Forest',
        primary: '#047857', // emerald-700
        secondary: '#15803D', // green-700
        accent: '#92400E', // amber-800
        id: 'forest'
      },
      {
        name: 'Ruby',
        primary: '#BE123C', // rose-700
        secondary: '#9F1239', // rose-800
        accent: '#6D28D9', // violet-700
        id: 'ruby'
      },
      {
        name: 'Sunset',
        primary: '#EA580C', // orange-600
        secondary: '#D97706', // amber-600
        accent: '#7C2D12', // orange-900
        id: 'sunset'
      },
      {
        name: 'Monochrome',
        primary: '#404040', // neutral-700
        secondary: '#525252', // neutral-600
        accent: '#737373', // neutral-500
        id: 'monochrome'
      },
    ];
    
    // Custom colors
    const customColors = reactive({
      primary: themeStore.customColors?.primary || colorPresets[0].primary,
      secondary: themeStore.customColors?.secondary || colorPresets[0].secondary,
      accent: themeStore.customColors?.accent || colorPresets[0].accent
    });
    
    // Check if a preset is the current one
    const isCurrentPreset = (preset: ColorPreset) => {
      return currentPresetId.value === preset.id;
    };
    
    // Select a preset
    const selectPreset = (preset: ColorPreset) => {
      currentPresetId.value = preset.id;
      
      themeStore.setColorTheme({
        primary: preset.primary,
        secondary: preset.secondary,
        accent: preset.accent,
        presetId: preset.id
      });
      
      // Update custom colors to match preset
      customColors.primary = preset.primary;
      customColors.secondary = preset.secondary;
      customColors.accent = preset.accent;
      
      emit('theme-changed', preset.id);
    };
    
    // Apply custom colors
    const applyCustomColors = () => {
      themeStore.setColorTheme({
        primary: customColors.primary,
        secondary: customColors.secondary,
        accent: customColors.accent,
        presetId: 'custom'
      });
      
      currentPresetId.value = 'custom';
      emit('theme-changed', 'custom');
    };
    
    // Reset to default
    const resetToDefault = () => {
      selectPreset(colorPresets[0]);
    };
    
    // Initialize
    onMounted(() => {
      // Set initial state based on stored values
      if (themeStore.customColors) {
        customColors.primary = themeStore.customColors.primary;
        customColors.secondary = themeStore.customColors.secondary;
        customColors.accent = themeStore.customColors.accent;
        currentPresetId.value = themeStore.customColors.presetId || 'default';
      }
    });
    
    return {
      colorPresets,
      customColors,
      currentPresetId,
      isCurrentPreset,
      selectPreset,
      applyCustomColors,
      resetToDefault
    };
  }
});
</script>

<style scoped>
.theme-color-picker {
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

.color-picker-title {
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 0.5rem 0;
}

.color-presets {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 0.75rem;
}

.color-preset {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background-color: var(--color-surface-secondary);
  border: 2px solid transparent;
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  overflow: hidden;
}

.color-preset:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 4px var(--color-shadow);
}

.color-preset.active {
  border-color: var(--color-primary);
}

.preset-colors {
  display: flex;
  width: 100%;
  height: 1.5rem;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preset-color {
  flex: 1;
  height: 100%;
}

.preset-name {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--color-text);
  margin-top: 0.25rem;
  text-align: center;
}

.custom-colors-section {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid var(--color-border);
}

.custom-section-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text-secondary);
  margin: 0 0 0.75rem 0;
}

.color-pickers {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 1rem;
}

.color-picker-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.color-picker-group label {
  font-size: 0.75rem;
  color: var(--color-text-secondary);
}

.color-input-wrapper {
  position: relative;
  height: 2rem;
  border-radius: var(--radius-md);
  overflow: hidden;
}

.color-preview {
  position: absolute;
  inset: 0;
  border-radius: var(--radius-md);
  pointer-events: none;
  border: 1px solid var(--color-border);
}

input[type="color"] {
  width: 100%;
  height: 100%;
  border: none;
  background: transparent;
  cursor: pointer;
  padding: 0;
  opacity: 0;
}

.reset-button {
  margin-top: 1rem;
  padding: 0.5rem;
  font-size: 0.75rem;
  background-color: var(--color-surface-secondary);
  color: var(--color-text-secondary);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.reset-button:hover {
  background-color: var(--color-gray-200);
  color: var(--color-text);
}

.dark-theme .reset-button:hover {
  background-color: var(--color-gray-700);
}
</style>