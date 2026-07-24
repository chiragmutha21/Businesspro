import sys
import re

with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace setBankAccounts([...bankAccounts, newBank]);
content = content.replace("setBankAccounts([...bankAccounts, newBank]);", "addBankAccount(newBank);")

# Find and replace setBankAccounts(prev => prev.map(...)
def replace_bank_tx(match):
    block = match.group(0)
    # This is for Bank to Cash
    if "bankTxType === 'Bank to Cash'" in content[match.start()-200:match.start()]:
        return """      const fromAcc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (fromAcc) {
          updateBankAccount(fromAcc.id, {
              currentBalance: fromAcc.currentBalance - amt,
              transactions: [...(fromAcc.transactions||[]), { id: String((fromAcc.transactions||[]).length + 1), type: 'Bank to Cash', name: bankTxDescription || 'Bank to Cash Transfer', date: bankTxDate, amount: -amt }]
          });
      }"""
    # Cash to Bank
    if "bankTxType === 'Cash to Bank'" in content[match.start()-200:match.start()]:
        return """      const toAcc = bankAccounts.find(b => b.id === bankTxToAcc);
      if (toAcc) {
          updateBankAccount(toAcc.id, {
              currentBalance: toAcc.currentBalance + amt,
              transactions: [...(toAcc.transactions||[]), { id: String((toAcc.transactions||[]).length + 1), type: 'Cash to Bank', name: bankTxDescription || 'Cash to Bank Transfer', date: bankTxDate, amount: amt }]
          });
      }"""
    # Bank to Bank
    if "bankTxType === 'Bank to Bank'" in content[match.start()-200:match.start()]:
        return """      const fromAcc = bankAccounts.find(b => b.id === bankTxFromAcc);
      const toAcc = bankAccounts.find(b => b.id === bankTxToAcc);
      if (fromAcc) {
          updateBankAccount(fromAcc.id, {
              currentBalance: fromAcc.currentBalance - amt,
              transactions: [...(fromAcc.transactions||[]), { id: String((fromAcc.transactions||[]).length + 1), type: 'Bank to Bank', name: bankTxDescription || ('Transfer to ' + (toAcc?.displayName||'')), date: bankTxDate, amount: -amt }]
          });
      }
      if (toAcc) {
          updateBankAccount(toAcc.id, {
              currentBalance: toAcc.currentBalance + amt,
              transactions: [...(toAcc.transactions||[]), { id: String((toAcc.transactions||[]).length + 1), type: 'Bank to Bank', name: bankTxDescription || ('Transfer from ' + (fromAcc?.displayName||'')), date: bankTxDate, amount: amt }]
          });
      }"""
    # Adjustment
    if "bankTxType === 'Adjustment'" in content[match.start()-200:match.start()]:
        return """      const adjAcc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (adjAcc) {
          const adjAmt = bankTxAdjType === 'Increase balance' ? amt : -amt;
          updateBankAccount(adjAcc.id, {
              currentBalance: adjAcc.currentBalance + adjAmt,
              transactions: [...(adjAcc.transactions||[]), { id: String((adjAcc.transactions||[]).length + 1), type: 'Adjustment', name: bankTxDescription || 'Manual Adjustment', date: bankTxDate, amount: adjAmt }]
          });
      }"""
    return block

content = re.sub(r'setBankAccounts\(prev => prev\.map\(acc => \{.*?\n      \}\)\);', replace_bank_tx, content, flags=re.DOTALL)

# For addCashLog instead of setCashLogs
content = content.replace("setCashLogs([...cashLogs, {", "addCashLog({")
content = re.sub(r'setCashLogs\(prev => \[\.\.\.prev, \{.*?\}]\);', r'', content, flags=re.DOTALL)

# Let's use multi_replace_file_content for the other precise errors.
with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
