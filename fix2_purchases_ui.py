import sys
import re

with open('src/components/Purchases.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix property access in UI lists that were missed or are inside strings/modals
text = text.replace('.description', '.contactAddress')
text = text.replace('.paid', '.totalAmount')
text = text.replace('.receiptNo', '.invoiceNo')
text = text.replace('.expenseNo', '.invoiceNo')
text = text.replace('.category', '.contactName')
text = text.replace('.dueDate', '.paymentDate')
text = text.replace('.orderNo', '.invoiceNo')
text = text.replace('.returnNo', '.invoiceNo')
text = text.replace('.total}', '.totalAmount}')
text = text.replace('.total<', '.totalAmount<')

# Replace status save logic block sets
for set_func in ['setPurchaseBills', 'setPaymentsOut', 'setExpenses', 'setPurchaseOrders', 'setDebitNotes']:
    text = re.sub(rf'{set_func}\(prev => prev\.map\(item => item\.id === statusToEdit\.id \? updatedData : item\)\);', 'updateTransaction(statusToEdit.id, updatedData);', text)

with open('src/components/Purchases.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
