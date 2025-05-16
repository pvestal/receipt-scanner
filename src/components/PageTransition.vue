<template>
  <component :is="tag" class="page-transition-container" :class="customClass">
    <transition
      :name="transitionName"
      :mode="mode"
      :appear="appear"
      @before-enter="beforeEnter"
      @after-enter="afterEnter"
      @enter-cancelled="afterEnter"
      @before-leave="beforeLeave"
      @after-leave="afterLeave"
      @leave-cancelled="afterLeave"
    >
      <slot></slot>
    </transition>
  </component>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { useThemeStore } from '../stores/themeStore';

// Define the available transition types
type TransitionType = 'fade' | 'slide-up' | 'slide-down' | 'slide-left' | 'slide-right' | 'scale';

export default defineComponent({
  name: 'PageTransition',

  props: {
    // Type of transition effect
    type: {
      type: String as () => TransitionType,
      default: 'fade'
    },
    // Duration in milliseconds
    duration: {
      type: Number,
      default: 300
    },
    // Element tag to use
    tag: {
      type: String,
      default: 'div'
    },
    // Transition mode (in-out or out-in)
    mode: {
      type: String,
      default: 'out-in'
    },
    // Use transition on first render (appear)
    appear: {
      type: Boolean,
      default: true
    },
    // Custom CSS class to apply to the container
    customClass: {
      type: String,
      default: ''
    },
    // Enable automatic transition name based on route changes
    autoRoute: {
      type: Boolean,
      default: false
    },
    // Apply theme-based styles to animations
    themeAware: {
      type: Boolean,
      default: true
    }
  },

  setup(props, { emit }) {
    const route = useRoute();
    const themeStore = useThemeStore();
    const transitionName = ref(props.type);
    const isTransitioning = ref(false);

    // Watch for route changes to adjust transition direction
    if (props.autoRoute) {
      let lastRoutePath = '';
      watch(() => route.path, (newPath) => {
        // Skip on first load
        if (!lastRoutePath) {
          lastRoutePath = newPath;
          return;
        }

        // Determine direction based on navigation history
        const direction = determineDirection(lastRoutePath, newPath);
        transitionName.value = direction;
        lastRoutePath = newPath;
      });
    }

    // Watch for theme changes to adjust transition styles
    if (props.themeAware) {
      watch(() => themeStore.theme, () => {
        // Could adjust transitions based on theme if needed
      });
    }

    // Emit events on transition hooks
    const beforeEnter = (el: Element) => {
      isTransitioning.value = true;
      
      // Apply theme-aware transition styles
      if (props.themeAware) {
        applyThemeStyles(el as HTMLElement, 'enter');
      }
      
      // Apply custom duration
      (el as HTMLElement).style.transitionDuration = `${props.duration}ms`;
      emit('before-enter', el);
    };

    const afterEnter = (el: Element) => {
      isTransitioning.value = false;
      emit('after-enter', el);
    };

    const beforeLeave = (el: Element) => {
      isTransitioning.value = true;
      
      // Apply theme-aware transition styles
      if (props.themeAware) {
        applyThemeStyles(el as HTMLElement, 'leave');
      }
      
      // Apply custom duration
      (el as HTMLElement).style.transitionDuration = `${props.duration}ms`;
      emit('before-leave', el);
    };

    const afterLeave = (el: Element) => {
      isTransitioning.value = false;
      emit('after-leave', el);
    };

    // Apply theme-specific styles to transitions
    const applyThemeStyles = (el: HTMLElement, phase: 'enter' | 'leave') => {
      const isDark = themeStore.isDark;
      
      // Customize transitions based on theme
      if (isDark) {
        if (phase === 'enter') {
          // Darker shadow for dark mode entry
          el.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.4)';
        }
      } else {
        if (phase === 'enter') {
          // Lighter shadow for light mode
          el.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.2)';
        }
      }
    };

    // Logic to determine the transition direction based on route paths
    const determineDirection = (fromPath: string, toPath: string): TransitionType => {
      // Simple heuristic based on path depth
      const fromDepth = fromPath.split('/').length;
      const toDepth = toPath.split('/').length;

      if (toDepth > fromDepth) {
        return 'slide-left'; // Going deeper in navigation
      } else if (fromDepth > toDepth) {
        return 'slide-right'; // Going back in navigation
      } else {
        // Same level - apply default transition
        return props.type;
      }
    };

    return {
      transitionName,
      isTransitioning,
      beforeEnter,
      afterEnter,
      beforeLeave,
      afterLeave
    };
  }
});
</script>

<style>
.page-transition-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* Fade transition */
.fade-enter-active,
.fade-leave-active {
  transition-property: opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* Slide transitions */
/* Slide up */
.slide-up-enter-active,
.slide-up-leave-active {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-up-enter-from {
  transform: translateY(20px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(-20px);
  opacity: 0;
}

/* Slide down */
.slide-down-enter-active,
.slide-down-leave-active {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-down-enter-from {
  transform: translateY(-20px);
  opacity: 0;
}

.slide-down-leave-to {
  transform: translateY(20px);
  opacity: 0;
}

/* Slide left */
.slide-left-enter-active,
.slide-left-leave-active {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-left-enter-from {
  transform: translateX(30px);
  opacity: 0;
}

.slide-left-leave-to {
  transform: translateX(-30px);
  opacity: 0;
}

/* Slide right */
.slide-right-enter-active,
.slide-right-leave-active {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.slide-right-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-right-leave-to {
  transform: translateX(30px);
  opacity: 0;
}

/* Scale transition */
.scale-enter-active,
.scale-leave-active {
  transition-property: transform, opacity;
  transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1);
}

.scale-enter-from {
  transform: scale(0.95);
  opacity: 0;
}

.scale-leave-to {
  transform: scale(1.05);
  opacity: 0;
}
</style>