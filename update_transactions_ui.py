import sys
import re

with open('src/components/Transactions.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# Replace useApp
old_useapp = '  const { customers, activeBusiness } = useApp();'
new_useapp = '  const { customers, activeBusiness, transactions, addTransaction, updateTransaction, deleteTransaction } = useApp();'
text = text.replace(old_useapp, new_useapp)

# Remove useEffects
text = re.sub(r"React\.useEffect\(\(\) => \{ localStorage\.setItem\('.*?\}\);", "", text)

# Remove local states and replace with computed properties
def repl_state(m):
    var_name = m.group(1)
    # The regex captured `const [estimates, setEstimates] = useState<any[]>(...);`
    # We want to replace it with `const estimates = transactions.filter(t => t.type === 'Estimate');`
    # But wait, the transaction type names match exactly what was in our migration script.
    # Estimates -> Estimate, Proforma Invoices -> Proforma Invoice
    type_map = {
        'estimates': 'Estimate',
        'proformaInvoices': 'Proforma Invoice',
        'paymentsIn': 'Payment In',
        'saleOrders': 'Sale Order',
        'deliveryChallans': 'Delivery Challan',
        'saleReturns': 'Sale Return'
    }
    tx_type = type_map.get(var_name, var_name)
    return f"const {var_name} = transactions.filter(t => t.type === '{tx_type}');"

text = re.sub(r'const \[(\w+), set\w+\] = useState<any\[\]>\(\(\) => \{.*?\n  \}\);', repl_state, text, flags=re.DOTALL)

# Replace sets
text = text.replace('setEstimates([newEstimate, ...estimates]);', 'addTransaction(newEstimate as any);')
text = text.replace('setProformaInvoices([newProforma, ...proformaInvoices]);', 'addTransaction(newProforma as any);')
text = text.replace('setPaymentsIn([newPayment, ...paymentsIn]);', 'addTransaction(newPayment as any);')
text = text.replace('setSaleOrders([newOrder, ...saleOrders]);', 'addTransaction(newOrder as any);')
text = text.replace('setDeliveryChallans([newChallan, ...deliveryChallans]);', 'addTransaction(newChallan as any);')
text = text.replace('setSaleReturns([newReturn, ...saleReturns]);', 'addTransaction(newReturn as any);')

# Replace deletes
text = re.sub(r'setEstimates\(prev => prev\.filter\(e => e\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setProformaInvoices\(prev => prev\.filter\(p => p\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setPaymentsIn\(prev => prev\.filter\(p => p\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setSaleOrders\(prev => prev\.filter\(o => o\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setDeliveryChallans\(prev => prev\.filter\(c => c\.id !== id\)\);', 'deleteTransaction(id);', text)
text = re.sub(r'setSaleReturns\(prev => prev\.filter\(r => r\.id !== id\)\);', 'deleteTransaction(id);', text)

with open('src/components/Transactions.tsx', 'w', encoding='utf-8') as f:
    f.write(text)
