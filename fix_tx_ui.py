import sys
import re

# 1. Update Transaction type in AppContext.tsx
with open('src/context/AppContext.tsx', 'r', encoding='utf-8') as f:
    app_text = f.read()

app_text = app_text.replace("  type: 'sale' | 'purchase';", "  type: string;")

with open('src/context/AppContext.tsx', 'w', encoding='utf-8') as f:
    f.write(app_text)

# 2. Fix Transactions.tsx remaining setX logic
with open('src/components/Transactions.tsx', 'r', encoding='utf-8') as f:
    tx_text = f.read()

# Replace the edit save logic block
edit_save_old = """    if (editingTransactionId) {
      if (activeSection === 'estimate-quotation') {
        setEstimates((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'proforma-invoice') {
        setProformaInvoices((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'payment-in') {
        setPaymentsIn((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'sale-order') {
        setSaleOrders((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'delivery-challan') {
        setDeliveryChallans((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'sale-return') {
        setSaleReturns((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else {
        updateSaleInvoice(editingTransactionId, payload);
      }"""
edit_save_new = """    if (editingTransactionId) {
      if (activeSection === 'sale-invoice') {
        updateSaleInvoice(editingTransactionId, payload);
      } else {
        updateTransaction(editingTransactionId, payload);
      }"""
tx_text = tx_text.replace(edit_save_old, edit_save_new)

# Replace convert block sets
for convert_old in [
    "setEstimates(prev => prev.map(item => item.id === t.id ? updated : item));",
    "setProformaInvoices(prev => prev.map(item => item.id === t.id ? updated : item));",
    "setPaymentsIn(prev => prev.map(item => item.id === t.id ? updated : item));",
    "setSaleOrders(prev => prev.map(item => item.id === t.id ? updated : item));",
    "setDeliveryChallans(prev => prev.map(item => item.id === t.id ? updated : item));",
    "setSaleReturns(prev => prev.map(item => item.id === t.id ? updated : item));"
]:
    tx_text = tx_text.replace(convert_old, "updateTransaction(t.id, updated);")

# Replace status save block sets
for convert_old in [
    "setEstimates(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));",
    "setProformaInvoices(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));",
    "setPaymentsIn(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));",
    "setSaleOrders(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));",
    "setDeliveryChallans(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));",
    "setSaleReturns(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));"
]:
    tx_text = tx_text.replace(convert_old, "updateTransaction(statusToEdit.id, updatedData);")


with open('src/components/Transactions.tsx', 'w', encoding='utf-8') as f:
    f.write(tx_text)
