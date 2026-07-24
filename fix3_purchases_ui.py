import sys
import re

with open('src/components/Purchases.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix setX for status updates
text = re.sub(r'setPurchaseBills\(\s*prev =>\s*prev\.map\(\s*item =>\s*item\.id === statusToEdit\.id \? updatedData : item\s*\)\s*\);', 'updateTransaction(statusToEdit.id, updatedData);', text)
text = re.sub(r'setPaymentsOut\(\s*prev =>\s*prev\.map\(\s*item =>\s*item\.id === statusToEdit\.id \? updatedData : item\s*\)\s*\);', 'updateTransaction(statusToEdit.id, updatedData);', text)
text = re.sub(r'setExpenses\(\s*prev =>\s*prev\.map\(\s*item =>\s*item\.id === statusToEdit\.id \? updatedData : item\s*\)\s*\);', 'updateTransaction(statusToEdit.id, updatedData);', text)
text = re.sub(r'setPurchaseOrders\(\s*prev =>\s*prev\.map\(\s*item =>\s*item\.id === statusToEdit\.id \? updatedData : item\s*\)\s*\);', 'updateTransaction(statusToEdit.id, updatedData);', text)
text = re.sub(r'setDebitNotes\(\s*prev =>\s*prev\.map\(\s*item =>\s*item\.id === statusToEdit\.id \? updatedData : item\s*\)\s*\);', 'updateTransaction(statusToEdit.id, updatedData);', text)

# Fix paymentDate undefined
text = text.replace('formatDateDDMMYYYY(o.paymentDate)', 'formatDateDDMMYYYY(o.paymentDate || "")')

# Fix missed total
text = text.replace('.total}', '.totalAmount}')
text = text.replace('.total<', '.totalAmount<')
text = text.replace('.total.', '.totalAmount.')
text = text.replace('o.total.toFixed', 'o.totalAmount.toFixed')
text = text.replace('n.total.toFixed', 'n.totalAmount.toFixed')

with open('src/components/Purchases.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
