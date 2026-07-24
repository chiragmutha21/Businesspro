import sys

with open('src/components/Purchases.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Fix property access in UI lists
text = text.replace('.billNumber}', '.invoiceNo}')
text = text.replace('.partyName}', '.contactName}')
text = text.replace('.phone}', '.contactPhone}')
text = text.replace('.total.', '.totalAmount.')
text = text.replace('.total}', '.totalAmount}')
text = text.replace('.receiptNo}', '.invoiceNo}')
text = text.replace('.paid.', '.totalAmount.')
text = text.replace('.paid}', '.totalAmount}')
text = text.replace('.expenseNo}', '.invoiceNo}')
text = text.replace('.category}', '.contactName}')
text = text.replace('.orderNo}', '.invoiceNo}')
text = text.replace('.dueDate}', '.paymentDate}')
text = text.replace('.returnNo}', '.invoiceNo}')
text = text.replace('.description}', '.contactAddress}')

# Replace creation logic which my regex didn't catch because it might have been different
text = text.replace('setPurchaseBills([record, ...purchaseBills]);', 'createPurchaseEntry(record as any);')
text = text.replace('setPaymentsOut([record, ...paymentsOut]);', 'addTransaction(record as any);')
text = text.replace('setExpenses([record, ...expenses]);', 'addTransaction(record as any);')
text = text.replace('setPurchaseOrders([record, ...purchaseOrders]);', 'addTransaction(record as any);')
text = text.replace('setDebitNotes([record, ...debitNotes]);', 'addTransaction(record as any);')

# Wait, the creation arrays might be named different in Purchases
# Let's check what we did with addTransaction previously.
# Actually I'll just regex replace ALL `setSomething([..., ...something])` 
import re
text = re.sub(r'setPurchaseBills\(\[.*?, \.\.\.purchaseBills\]\);', 'createPurchaseEntry(record as any);', text)
text = re.sub(r'setPaymentsOut\(\[.*?, \.\.\.paymentsOut\]\);', 'addTransaction(record as any);', text)
text = re.sub(r'setExpenses\(\[.*?, \.\.\.expenses\]\);', 'addTransaction(record as any);', text)
text = re.sub(r'setPurchaseOrders\(\[.*?, \.\.\.purchaseOrders\]\);', 'addTransaction(record as any);', text)
text = re.sub(r'setDebitNotes\(\[.*?, \.\.\.debitNotes\]\);', 'addTransaction(record as any);', text)

# Replace delete logic block which has `(prev) => prev.filter`
text = text.replace('setPurchaseBills((prev) => prev.filter((b) => b.id !== id));', 'deleteTransaction(id);')
text = text.replace('setPaymentsOut((prev) => prev.filter((p) => p.id !== id));', 'deleteTransaction(id);')
text = text.replace('setExpenses((prev) => prev.filter((e) => e.id !== id));', 'deleteTransaction(id);')
text = text.replace('setPurchaseOrders((prev) => prev.filter((o) => o.id !== id));', 'deleteTransaction(id);')
text = text.replace('setDebitNotes((prev) => prev.filter((d) => d.id !== id));', 'deleteTransaction(id);')


with open('src/components/Purchases.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
