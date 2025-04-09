import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Receipt } from '../models/receipt'
import { receiptService } from '../services/receiptService'

export const useReceiptStore = defineStore('receipt', () => {
  const receipts = ref<Receipt[]>([])
  const currentReceipt = ref<Receipt | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  async function loadReceipts() {
    loading.value = true
    error.value = null
    
    try {
      receipts.value = await receiptService.getReceipts()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load receipts'
      console.error('Error loading receipts:', err)
    } finally {
      loading.value = false
    }
  }

  async function loadReceiptById(id: string) {
    loading.value = true
    error.value = null
    
    try {
      currentReceipt.value = await receiptService.getReceiptById(id)
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load receipt'
      console.error(`Error loading receipt ${id}:`, err)
    } finally {
      loading.value = false
    }
  }

  function clearCurrentReceipt() {
    currentReceipt.value = null
  }

  return {
    receipts,
    currentReceipt,
    loading,
    error,
    loadReceipts,
    loadReceiptById,
    clearCurrentReceipt
  }
})