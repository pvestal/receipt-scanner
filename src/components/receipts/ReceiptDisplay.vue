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
    border: 1px solid #ddd;
    border-radius: 8px;
    padding: 20px;
    max-width: 500px;
    margin: 0 auto;
    font-family: 'Courier New', monospace;
    background-color: #fff;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }
  
  .receipt-header {
    text-align: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px dashed #ccc;
  }
  
  .store-name {
    margin: 0 0 10px;
    font-size: 1.5rem;
  }
  
  .store-address, .store-phone {
    margin: 4px 0;
    font-size: 0.9rem;
  }
  
  .receipt-date {
    margin-top: 10px;
    font-size: 0.9rem;
    opacity: 0.8;
  }
  
  .confidence-indicator {
    margin: 15px 0;
  }
  
  .confidence-bar {
    height: 8px;
    background-color: #eee;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .confidence-fill {
    height: 100%;
    background-color: #4caf50;
  }
  
  .confidence-text {
    font-size: 0.8rem;
    text-align: right;
    margin-top: 4px;
    opacity: 0.7;
  }
  
  .receipt-items {
    margin: 20px 0;
  }
  
  .receipt-items h3 {
    margin-bottom: 10px;
    font-size: 1.1rem;
  }
  
  table {
    width: 100%;
    border-collapse: collapse;
  }
  
  th, td {
    padding: 8px 4px;
    text-align: left;
  }
  
  th {
    border-bottom: 1px solid #ddd;
    font-size: 0.9rem;
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
  
  .low-confidence {
    background-color: #fff9c4;
  }
  
  .receipt-totals {
    margin-top: 20px;
    border-top: 1px dashed #ccc;
    padding-top: 10px;
  }
  
  .total-row {
    display: flex;
    justify-content: space-between;
    padding: 4px 0;
  }
  
  .grand-total {
    font-weight: bold;
    margin-top: 5px;
    padding-top: 5px;
    border-top: 1px solid #ddd;
  }
  
  .payment-info {
    margin-top: 15px;
    padding-top: 10px;
    border-top: 1px dashed #ccc;
    font-size: 0.9rem;
  }
  
  .receipt-actions {
    margin-top: 20px;
    text-align: center;
  }
  
  .edit-button {
    background-color: #2196f3;
    color: white;
    border: none;
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 0.9rem;
  }
  
  .edit-button:hover {
    background-color: #1976d2;
  }
  
  @media (max-width: 500px) {
    .receipt-display {
      border-radius: 0;
      box-shadow: none;
      padding: 15px;
    }
    
    .store-name {
      font-size: 1.3rem;
    }
    
    th, td {
      padding: 6px 3px;
      font-size: 0.9rem;
    }
  }
  </style>