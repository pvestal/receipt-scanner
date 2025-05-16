<!-- src/components/receipts/ReceiptDisplay.vue -->
<template>
    <div class="receipt-display">
      <!-- Receipt header with store info and date -->
      <div class="receipt-header">
        <h2 class="store-name">{{ receipt.store.name }}</h2>
        <div v-if="receipt.store.address" class="store-address">{{ receipt.store.address }}</div>
        <div v-if="receipt.store.phone" class="store-phone">{{ receipt.store.phone }}</div>
        <div class="receipt-date">{{ formattedDate }}</div>
      </div>
  
      <!-- Confidence indicator -->
      <div class="confidence-indicator" v-if="showConfidence">
        <div class="confidence-bar">
          <div class="confidence-fill" :style="{ width: `${receipt.confidence * 100}%` }"></div>
        </div>
        <div class="confidence-text">
          Confidence: {{ (receipt.confidence * 100).toFixed(0) }}%
        </div>
      </div>
  
      <!-- Items section -->
      <div class="receipt-items">
        <h3>Items</h3>
        <table>
          <thead>
            <tr>
              <th class="item-name">Item</th>
              <th class="item-quantity">Qty</th>
              <th class="item-price">Price</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(item, index) in receipt.items" :key="index" :class="{ 'low-confidence': item.confidence < 0.6 }">
              <td class="item-name">{{ item.name }}</td>
              <td class="item-quantity">{{ item.quantity || 1 }}</td>
              <td class="item-price">${{ formatPrice(item.price) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
  
      <!-- Totals section -->
      <div class="receipt-totals">
        <div class="total-row">
          <span class="total-label">Subtotal:</span>
          <span class="total-value">${{ formatPrice(receipt.totals.subtotal) }}</span>
        </div>
        <div class="total-row">
          <span class="total-label">Tax:</span>
          <span class="total-value">${{ formatPrice(receipt.totals.tax) }}</span>
        </div>
        <div v-if="receipt.totals.discount" class="total-row">
          <span class="total-label">Discount:</span>
          <span class="total-value">-${{ formatPrice(receipt.totals.discount) }}</span>
        </div>
        <div v-if="receipt.totals.tip" class="total-row">
          <span class="total-label">Tip:</span>
          <span class="total-value">${{ formatPrice(receipt.totals.tip) }}</span>
        </div>
        <div class="total-row grand-total">
          <span class="total-label">Total:</span>
          <span class="total-value">${{ formatPrice(receipt.totals.total) }}</span>
        </div>
      </div>
  
      <!-- Payment info if available -->
      <div v-if="receipt.paymentInfo" class="payment-info">
        <div class="payment-method">
          Payment: {{ receipt.paymentInfo.method }}
          <span v-if="receipt.paymentInfo.cardLast4">
            ({{ receipt.paymentInfo.cardType || 'Card' }} ending in {{ receipt.paymentInfo.cardLast4 }})
          </span>
        </div>
      </div>
  
      <!-- Edit button -->
      <div class="receipt-actions" v-if="editable">
        <button @click="$emit('edit')" class="edit-button">Edit Receipt</button>
      </div>
    </div>
  </template>
  
  <script lang="ts">
  import { defineComponent, computed, PropType } from 'vue';
  import { Receipt } from '@/models/receipt';
  
  export default defineComponent({
    name: 'ReceiptDisplay',
    
    props: {
      receipt: {
        type: Object as PropType<Receipt>,
        required: true
      },
      editable: {
        type: Boolean,
        default: true
      },
      showConfidence: {
        type: Boolean,
        default: false
      }
    },
    
    emits: ['edit'],
    
    setup(props) {
      // Format date for display
      const formattedDate = computed(() => {
        const date = props.receipt.date instanceof Date 
          ? props.receipt.date 
          : new Date(props.receipt.date);
        
        return date.toLocaleDateString('en-US', {
          weekday: 'short',
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      });
      
      // Format price to always show 2 decimal places
      const formatPrice = (price: number): string => {
        return price.toFixed(2);
      };
      
      return {
        formattedDate,
        formatPrice
      };
    }
  });
  </script>
  
  <style scoped>
  .receipt-display {
    border: 1px solid var(--color-gray-200);
    border-radius: var(--radius-lg);
    padding: 1.5rem;
    max-width: 600px;
    margin: 0 auto;
    font-family: 'Courier New', monospace;
    background-color: var(--color-surface);
    box-shadow: 0 2px 8px var(--color-shadow);
    transition: box-shadow var(--transition-normal);
  }
  
  .receipt-header {
    text-align: center;
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
    border-bottom: 1px dashed var(--color-gray-300);
  }
  
  .store-name {
    margin: 0 0 0.75rem;
    font-size: 1.5rem;
    font-weight: bold;
    color: var(--color-text);
  }
  
  .store-address, .store-phone {
    margin: 0.25rem 0;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }
  
  .receipt-date {
    margin-top: 0.75rem;
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }
  
  .confidence-indicator {
    margin: 1rem 0;
  }
  
  .confidence-bar {
    height: 8px;
    background-color: var(--color-gray-100);
    border-radius: var(--radius-sm);
    overflow: hidden;
  }
  
  .confidence-fill {
    height: 100%;
    background-color: var(--color-success);
    transition: width var(--transition-normal);
  }
  
  .confidence-text {
    font-size: 0.8rem;
    text-align: right;
    margin-top: 0.25rem;
    color: var(--color-text-secondary);
  }
  
  .receipt-items {
    margin: 1.5rem 0;
  }
  
  .receipt-items h3 {
    margin-bottom: 0.75rem;
    font-size: 1.1rem;
    color: var(--color-text);
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 0.5rem 0.25rem;
    text-align: left;
    color: var(--color-text);
  }
  
  th {
    border-bottom: 1px solid var(--color-gray-200);
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  
  .item-name {
    width: 60%;
  }
  
  .item-quantity {
    width: 15%;
    text-align: center;
  }
  
  .item-price {
    width: 25%;
    text-align: right;
  }
  
  tr:has(.low-confidence) {
    background-color: var(--color-warning);
    opacity: 0.2;
  }
  
  .receipt-totals {
    margin-top: 1.5rem;
    border-top: 1px dashed var(--color-gray-300);
    padding-top: 0.75rem;
  }
  
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 0.25rem 0;
    color: var(--color-text);
  }
  
  .grand-total {
    font-weight: bold;
    margin-top: 0.5rem;
    padding-top: 0.5rem;
    border-top: 1px solid var(--color-gray-200);
    font-size: 1.1rem;
  }
  
  .payment-info {
    margin-top: 1rem;
    padding-top: 0.75rem;
    border-top: 1px dashed var(--color-gray-300);
    font-size: 0.9rem;
    color: var(--color-text-secondary);
  }
  
  .receipt-actions {
    margin-top: 1.5rem;
    text-align: center;
  }
  
  .edit-button {
    background-color: var(--color-primary);
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: var(--radius-md);
    cursor: pointer;
    font-size: 1rem;
    font-weight: 500;
    transition: background-color var(--transition-fast);
    width: 100%;
    max-width: 200px;
  }
  
  .edit-button:hover {
    background-color: var(--color-primary-dark);
  }
  
  /* Mobile optimizations */
  @media (max-width: 640px) {
    .receipt-display {
      border-radius: var(--radius-lg);
      box-shadow: 0 1px 3px var(--color-shadow);
      padding: 1rem;
      margin: 0;
      max-width: 100%;
    }
    
    .store-name {
      font-size: 1.25rem;
    }
    
    .store-address, .store-phone {
      font-size: 0.875rem;
    }
    
    .receipt-date {
      font-size: 0.875rem;
    }
    
    .receipt-items h3 {
      font-size: 1rem;
    }
    
    table {
      font-size: 0.875rem;
    }
    
    th, td {
      padding: 0.5rem 0.25rem;
    }
    
    th {
      font-size: 0.8rem;
    }
    
    .item-name {
      width: 55%;
      font-size: 0.875rem;
    }
    
    .item-quantity {
      width: 15%;
    }
    
    .item-price {
      width: 30%;
    }
    
    .total-row {
      font-size: 0.9rem;
    }
    
    .grand-total {
      font-size: 1rem;
    }
    
    .payment-info {
      font-size: 0.875rem;
    }
    
    .edit-button {
      padding: 0.75rem 1.25rem;
      font-size: 0.9rem;
      width: 100%;
      max-width: none;
    }
  }
  
  /* Small phone adjustments */
  @media (max-width: 380px) {
    .receipt-display {
      padding: 0.75rem;
    }
    
    .store-name {
      font-size: 1.1rem;
    }
    
    table {
      font-size: 0.8rem;
    }
    
    th, td {
      padding: 0.4rem 0.2rem;
    }
    
    .item-name {
      width: 50%;
    }
    
    .item-price {
      width: 35%;
    }
  }
  
  /* Dark theme support */
  .dark-theme .receipt-display {
    background-color: var(--color-surface);
    border-color: var(--color-border);
  }
  </style>