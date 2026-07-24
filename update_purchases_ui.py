import sys
import re

with open('src/components/Purchases.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace useApp
old_useapp = '  const { customers, activeBusiness } = useApp();'
new_useapp = '  const { customers, activeBusiness, transactions, addTransaction, deleteTransaction, createPurchaseEntry } = useApp();'
text = text.replace(old_useapp, new_useapp)

# Remove useEffects
text = re.sub(r"React\.useEffect\(\(\) => \{ localStorage\.setItem\('.*?\}\);", "", text)

# Remove local states and replace with computed properties
def repl_state(m):
    var_name = m.group(1)
    type_map = {
        'purchaseBills': 'Purchase',
        'paymentsOut': 'Payment Out',
        'expenses': 'Expense',
        'purchaseOrders': 'Purchase Order',
        'debitNotes': 'Debit Note'
    }
    tx_type = type_map.get(var_name, var_name)
    return f"const {var_name} = transactions.filter(t => t.type === '{tx_type}');"

text = re.sub(r'const \[(\w+), set\w+\] = useState<any\[\]>\(\(\) => \{.*?\n  \}\);', repl_state, text, flags=re.DOTALL)

# Replace sets (adding)
text = text.replace('setPurchaseBills([newBill, ...purchaseBills]);', 'createPurchaseEntry(newBill as any);')
text = text.replace('setPaymentsOut([newPayment, ...paymentsOut]);', 'addTransaction(newPayment as any);')
text = text.replace('setExpenses([newExpense, ...expenses]);', 'addTransaction(newExpense as any);')
text = text.replace('setPurchaseOrders([newOrder, ...purchaseOrders]);', 'addTransaction(newOrder as any);')
text = text.replace('setDebitNotes([newNote, ...debitNotes]);', 'addTransaction(newNote as any);')

# Replace sets (deleting)
text = re.sub(r'setPurchaseBills\(prev => prev\.filter\(b => b\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setPaymentsOut\(prev => prev\.filter\(p => p\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setExpenses\(prev => prev\.filter\(e => e\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setPurchaseOrders\(prev => prev\.filter\(o => o\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setDebitNotes\(prev => prev\.filter\(n => n\.id !== id\)\);', 'deleteTransaction(id);', text)

with open('src/components/Purchases.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
