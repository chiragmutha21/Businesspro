import sys

with open('src/components/Purchases.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix setX for status updates
text = text.replace('setPurchaseBills(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));', 'updateTransaction(statusToEdit.id, updatedData);')
text = text.replace('setPaymentsOut(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));', 'updateTransaction(statusToEdit.id, updatedData);')
text = text.replace('setExpenses(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));', 'updateTransaction(statusToEdit.id, updatedData);')
text = text.replace('setPurchaseOrders(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));', 'updateTransaction(statusToEdit.id, updatedData);')
text = text.replace('setDebitNotes(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));', 'updateTransaction(statusToEdit.id, updatedData);')

# Fix paymentDate undefined
text = text.replace('formatDateDDMMYYYY(o.paymentDate)', 'formatDateDDMMYYYY(o.paymentDate || "")')

# Fix missed total
text = text.replace('.total}', '.totalAmount}')
text = text.replace('o.total<', 'o.totalAmount<')
text = text.replace('.total.', '.totalAmount.')

with open('src/components/Purchases.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
