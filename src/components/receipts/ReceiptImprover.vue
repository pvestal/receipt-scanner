<template>
  <div class="receipt-improver">
    <h2>Receipt Text Improver</h2>
    
    <!-- Original OCR Text Section -->
    <div class="content-section">
      <h3>Original OCR Text</h3>
      <textarea 
        v-model="ocrText" 
        placeholder="Paste the raw OCR text from your receipt here"
        rows="8"
        class="content-textarea"
      ></textarea>
    </div>
    
    <!-- Improvement Options Section -->
    <div class="options-section" v-if="ocrText && !improved">
      <h3>Improvement Options</h3>
      
      <div class="options-grid">
        <div class="option">
          <input type="checkbox" id="fix-ocr-errors" v-model="options.fixOcrErrors" checked>
          <label for="fix-ocr-errors">Fix common OCR errors</label>
        </div>
        
        <div class="option">
          <input type="checkbox" id="improve-store" v-model="options.improveStore" checked>
          <label for="improve-store">Improve store identification</label>
        </div>
        
        <div class="option">
          <input type="checkbox" id="format-prices" v-model="options.formatPrices" checked>
          <label for="format-prices">Standardize price formatting</label>
        </div>
        
        <div class="option">
          <input type="checkbox" id="format-items" v-model="options.formatItems" checked>
          <label for="format-items">Improve item detection</label>
        </div>
        
        <div class="option">
          <input type="checkbox" id="format-totals" v-model="options.formatTotals" checked>
          <label for="format-totals">Enhance totals section</label>
        </div>
      </div>

      <button
        @click="improveReceiptText"
        class="improve-button"
        :disabled="!canImprove"
      >
        Improve Receipt Text
      </button>
    </div>
    
    <!-- Improved Text Section -->
    <div class="result-section" v-if="improved">
      <h3>Improved Receipt Text</h3>
      <div class="improvements-list">
        <h4>Improvements Made:</h4>
        <ul>
          <li v-for="(improvement, index) in improvements" :key="index">
            {{ improvement }}
          </li>
        </ul>
      </div>
      
      <textarea 
        v-model="improvedText" 
        rows="8"
        class="content-textarea improved"
      ></textarea>
      
      <div class="quality-indicators" v-if="textAnalysis">
        <div class="quality-bar">
          <div class="quality-label">Text Quality:</div>
          <div class="quality-track">
            <div 
              class="quality-fill" 
              :style="{width: `${textAnalysis.quality * 100}%`}"
              :class="getQualityClass(textAnalysis.quality)"
            ></div>
          </div>
          <div class="quality-score">{{ Math.round(textAnalysis.quality * 100) }}%</div>
        </div>
        
        <div class="quality-stats">
          <div class="stat">
            <div class="stat-label">Items Detected:</div>
            <div class="stat-value">{{ textAnalysis.possibleItemCount || 0 }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Store Name:</div>
            <div class="stat-value">{{ textAnalysis.hasStoreName ? 'Detected' : 'Missing' }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Total:</div>
            <div class="stat-value">{{ textAnalysis.hasTotal ? 'Detected' : 'Missing' }}</div>
          </div>
          <div class="stat">
            <div class="stat-label">Date:</div>
            <div class="stat-value">{{ textAnalysis.hasDate ? 'Detected' : 'Missing' }}</div>
          </div>
        </div>
      </div>
      
      <div class="action-buttons">
        <button @click="useImprovedText" class="action-button">
          Use Improved Text
        </button>
        <button @click="resetContent" class="action-button secondary">
          Start Over
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed } from 'vue';
import {
  analyzeReceiptText,
  fixCommonOcrErrors,
  improveStoreIdentification,
  improvePriceFormatting,
  improveItemFormatting,
  improveTotalsSection,
  improveReceiptText,
  convertToReceipt
} from '@/utils/receiptImproverFunctions';
import { Receipt } from '@/types';

export default defineComponent({
  name: 'ReceiptImprover',
  
  props: {
    initialText: {
      type: String,
      default: ''
    }
  },
  
  emits: ['improved', 'receipt-data', 'analysis-complete'],
  
  setup(props, { emit }) {
    // Content state
    const ocrText = ref(props.initialText);
    const improvedText = ref('');
    const improved = ref(false);
    const improvements = ref<string[]>([]);
    const textAnalysis = ref<Record<string, any> | null>(null);
    
    // Improvement options
    const options = ref({
      fixOcrErrors: true,
      improveStore: true,
      formatPrices: true,
      formatItems: true,
      formatTotals: true
    });
    
    // Validation
    const canImprove = computed(() => {
      return ocrText.value.trim().length > 20; // Require a reasonable amount of text
    });
    
    // Methods
    const improveReceiptText = () => {
      // First analyze the text
      textAnalysis.value = analyzeReceiptText(ocrText.value);
      
      // Apply selected improvements in sequence
      let currentText = ocrText.value;
      const appliedImprovements: string[] = [];
      
      if (options.value.fixOcrErrors) {
        const result = fixCommonOcrErrors(currentText);
        currentText = result.content;
        appliedImprovements.push(result.improvement);
      }
      
      if (options.value.improveStore) {
        const result = improveStoreIdentification(currentText);
        currentText = result.content;
        appliedImprovements.push(result.improvement);
      }
      
      if (options.value.formatPrices) {
        const result = improvePriceFormatting(currentText);
        currentText = result.content;
        appliedImprovements.push(result.improvement);
      }
      
      if (options.value.formatItems) {
        const result = improveItemFormatting(currentText);
        currentText = result.content;
        appliedImprovements.push(result.improvement);
      }
      
      if (options.value.formatTotals) {
        const result = improveTotalsSection(currentText);
        currentText = result.content;
        appliedImprovements.push(result.improvement);
      }
      
      // Update state
      improvedText.value = currentText;
      improvements.value = appliedImprovements;
      improved.value = true;
      
      // Emit event
      emit('improved', currentText);
      emit('analysis-complete', textAnalysis.value);
    };
    
    const resetContent = () => {
      improved.value = false;
      improvedText.value = '';
      improvements.value = [];
      textAnalysis.value = null;
    };
    
    const useImprovedText = () => {
      emit('receipt-data', {
        text: improvedText.value,
        analysis: textAnalysis.value
      });
    };
    
    const getQualityClass = (quality: number) => {
      if (quality < 0.3) return 'quality-low';
      if (quality < 0.7) return 'quality-medium';
      return 'quality-high';
    };
    
    return {
      ocrText,
      improvedText,
      improved,
      improvements,
      options,
      textAnalysis,
      canImprove,
      improveReceiptText,
      resetContent,
      useImprovedText,
      getQualityClass
    };
  }
});
</script>

<style scoped>
.receipt-improver {
  font-family: var(--font-family);
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  color: var(--color-text);
  background-color: var(--color-background);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

h2 {
  text-align: center;
  margin-bottom: 20px;
  color: var(--color-primary);
}

h3 {
  margin-bottom: 10px;
  border-bottom: 1px solid var(--color-border);
  padding-bottom: 5px;
  color: var(--color-text);
}

.content-section, .options-section, .result-section {
  margin-bottom: 30px;
}

.content-textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  font-size: 14px;
  line-height: 1.5;
  background-color: var(--color-surface);
  color: var(--color-text);
}

.content-textarea.improved {
  background-color: var(--color-success-light, #f0fff4);
  border-color: var(--color-success, #48bb78);
}

.options-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.option {
  display: flex;
  align-items: center;
  gap: 8px;
}

.option input[type="checkbox"] {
  width: 18px;
  height: 18px;
}

.improve-button {
  background-color: var(--color-primary);
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: var(--radius-md);
  font-size: 16px;
  cursor: pointer;
  display: block;
  margin: 20px auto;
  transition: background-color 0.2s ease;
}

.improve-button:hover {
  background-color: var(--color-primary-dark);
}

.improve-button:disabled {
  background-color: var(--color-gray-400);
  cursor: not-allowed;
}

.improvements-list {
  background-color: var(--color-gray-100);
  padding: 15px;
  border-radius: var(--radius-md);
  margin-bottom: 20px;
}

.improvements-list h4 {
  margin-top: 0;
  margin-bottom: 10px;
  color: var(--color-text);
}

.improvements-list ul {
  margin: 0;
  padding-left: 20px;
}

.improvements-list li {
  margin-bottom: 5px;
  color: var(--color-text-secondary);
}

.quality-indicators {
  margin: 20px 0;
  padding: 15px;
  background-color: var(--color-gray-100);
  border-radius: var(--radius-md);
}

.quality-bar {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 15px;
}

.quality-label {
  min-width: 100px;
  font-weight: bold;
}

.quality-track {
  flex-grow: 1;
  height: 10px;
  background-color: var(--color-gray-200);
  border-radius: 5px;
  overflow: hidden;
}

.quality-fill {
  height: 100%;
  border-radius: 5px;
}

.quality-low {
  background-color: var(--color-error, #e53e3e);
}

.quality-medium {
  background-color: var(--color-warning, #ed8936);
}

.quality-high {
  background-color: var(--color-success, #48bb78);
}

.quality-score {
  min-width: 50px;
  text-align: right;
  font-weight: bold;
}

.quality-stats {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 15px;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-weight: bold;
}

.action-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 20px;
}

.action-button {
  padding: 10px 20px;
  border: none;
  border-radius: var(--radius-md);
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
}

.action-button:first-child {
  background-color: var(--color-primary);
  color: white;
}

.action-button:first-child:hover {
  background-color: var(--color-primary-dark);
}

.action-button.secondary {
  background-color: var(--color-gray-200);
  color: var(--color-text);
}

.action-button.secondary:hover {
  background-color: var(--color-gray-300);
}
</style>