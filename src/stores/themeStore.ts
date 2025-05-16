import { defineStore } from 'pinia';

type Theme = 'light' | 'dark';
type ThemeMode = 'manual' | 'system' | 'time';

interface CustomColors {
  primary: string;
  secondary: string;
  accent: string;
  presetId: string;
}

interface AccessibilitySettings {
  fontSizeMultiplier: number;
  contrastLevel: number;
  reduceMotion: boolean;
  enhancedFocus: boolean;
}

interface ThemeState {
  theme: Theme;
  mode: ThemeMode;
  autoChangeEnabled: boolean;
  customColors: CustomColors | null;
  accessibilitySettings: AccessibilitySettings;
}

export const useThemeStore = defineStore('theme', {
  state: (): ThemeState => ({
    theme: 'light',
    mode: 'system',
    autoChangeEnabled: false,
    customColors: null,
    accessibilitySettings: {
      fontSizeMultiplier: 1.0,
      contrastLevel: 1.0,
      reduceMotion: false,
      enhancedFocus: false
    }
  }),

  getters: {
    isDark: (state) => state.theme === 'dark',
    currentMode: (state) => state.mode,
    currentColorTheme: (state) => state.customColors || {
      primary: '#2563EB', // Default blue-600
      secondary: '#059669', // Default emerald-600
      accent: '#8B5CF6', // Default violet-500
      presetId: 'default'
    },
    accessibilityPreferences: (state) => state.accessibilitySettings
  },

  actions: {
    setTheme(theme: Theme, savePreference = true) {
      this.theme = theme;

      // Remove any existing theme classes
      document.documentElement.classList.remove('light-theme', 'dark-theme');

      // Add the appropriate theme class with a slight delay to allow for transitions
      setTimeout(() => {
        document.documentElement.classList.add(`${theme}-theme`);
      }, 10);

      // Create a theme change event that components can listen for
      window.dispatchEvent(new CustomEvent('themechange', {
        detail: { theme, mode: this.mode }
      }));

      // Save the theme preference if requested
      if (savePreference) {
        localStorage.setItem('theme', theme);
        localStorage.setItem('themeMode', this.mode);
      }
    },

    toggleTheme() {
      const newTheme = this.theme === 'light' ? 'dark' : 'light';
      // Set mode to manual when user explicitly toggles
      this.mode = 'manual';
      this.setTheme(newTheme);
    },

    setColorTheme(colors: CustomColors) {
      this.customColors = colors;

      // Update CSS variables
      this.applyColorTheme();

      // Save color preferences
      localStorage.setItem('themeColors', JSON.stringify(colors));

      // Dispatch event
      window.dispatchEvent(new CustomEvent('themecolorchange', {
        detail: { colors }
      }));
    },

    applyColorTheme() {
      if (!this.customColors) return;

      const { primary, secondary, accent } = this.customColors;
      const root = document.documentElement;

      // Light theme colors
      root.style.setProperty('--color-primary', primary);
      root.style.setProperty('--color-primary-dark', this.adjustColor(primary, -20));
      root.style.setProperty('--color-primary-light', this.adjustColor(primary, 20));

      root.style.setProperty('--color-secondary', secondary);
      root.style.setProperty('--color-secondary-dark', this.adjustColor(secondary, -20));
      root.style.setProperty('--color-secondary-light', this.adjustColor(secondary, 20));

      root.style.setProperty('--color-accent', accent);
      root.style.setProperty('--color-accent-dark', this.adjustColor(accent, -20));
      root.style.setProperty('--color-accent-light', this.adjustColor(accent, 20));

      // Update feedback colors to match new theme
      root.style.setProperty('--color-info', primary);
      root.style.setProperty('--color-success', secondary);
    },

    // Helper to adjust color brightness/darkness
    adjustColor(color: string, amount: number): string {
      // Convert hex to RGB
      let r = parseInt(color.substring(1, 3), 16);
      let g = parseInt(color.substring(3, 5), 16);
      let b = parseInt(color.substring(5, 7), 16);

      // Adjust
      r = Math.max(0, Math.min(255, r + amount));
      g = Math.max(0, Math.min(255, g + amount));
      b = Math.max(0, Math.min(255, b + amount));

      // Convert back to hex
      return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },

    setMode(mode: ThemeMode) {
      this.mode = mode;
      localStorage.setItem('themeMode', mode);

      // Apply the appropriate theme based on the new mode
      if (mode === 'system') {
        this.applySystemTheme();
      } else if (mode === 'time') {
        this.applyTimeBasedTheme();
        // Enable auto-changing if using time-based theme
        this.enableAutoChange();
      }
    },

    applySystemTheme() {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      this.setTheme(prefersDark ? 'dark' : 'light', false);
    },

    applyTimeBasedTheme() {
      const currentHour = new Date().getHours();
      // Use dark theme from 7 PM (19) to 7 AM (7)
      const shouldBeDark = currentHour >= 19 || currentHour < 7;
      this.setTheme(shouldBeDark ? 'dark' : 'light', false);
    },

    enableAutoChange() {
      if (this.autoChangeEnabled) return;

      this.autoChangeEnabled = true;

      // Set up interval to check time if in time mode
      if (this.mode === 'time') {
        // Check every 5 minutes
        setInterval(() => {
          if (this.mode === 'time') {
            this.applyTimeBasedTheme();
          }
        }, 5 * 60 * 1000);
      }
    },

    initTheme() {
      // Check for saved mode preference first
      const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
      const savedTheme = localStorage.getItem('theme') as Theme | null;
      const savedColors = localStorage.getItem('themeColors');

      // Initialize custom colors if available
      if (savedColors) {
        try {
          this.customColors = JSON.parse(savedColors);
          this.applyColorTheme();
        } catch (e) {
          console.error('Error parsing saved theme colors', e);
        }
      }

      if (savedMode) {
        this.mode = savedMode;
      }

      // Apply theme based on the mode
      if (this.mode === 'manual' && savedTheme) {
        this.setTheme(savedTheme);
      } else if (this.mode === 'system') {
        this.applySystemTheme();

        // Listen for system theme changes
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
          if (this.mode === 'system') {
            this.setTheme(e.matches ? 'dark' : 'light', false);
          }
        });
      } else if (this.mode === 'time') {
        this.applyTimeBasedTheme();
        this.enableAutoChange();
      } else {
        // Fallback to system preference
        this.mode = 'system';
        this.applySystemTheme();
      }
    }
  }
});