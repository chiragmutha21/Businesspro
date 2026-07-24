import sys
import re

with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace bank to bank
old_bank_to_bank = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === bankTxFromAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          const newTx: BankTransaction = {
            id: nextTxId,
            type: 'Bank to Bank',
            name: bankTxDescription || `Transfer to ${bankAccounts.find(b => b.id === bankTxToAcc)?.displayName}`,
            date: bankTxDate,
            amount: -amt
          };
          return {
            ...acc,
            currentBalance: acc.currentBalance - amt,
            transactions: [...acc.transactions, newTx]
          };
        }
        if (acc.id === bankTxToAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          const newTx: BankTransaction = {
            id: nextTxId,
            type: 'Bank to Bank',
            name: bankTxDescription || `Transfer from ${bankAccounts.find(b => b.id === bankTxFromAcc)?.displayName}`,
            date: bankTxDate,
            amount: amt
          };
          return {
            ...acc,
            currentBalance: acc.currentBalance + amt,
            transactions: [...acc.transactions, newTx]
          };
        }
        return acc;
      }));"""
new_bank_to_bank = """      const fromAcc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (fromAcc) {
        updateBankAccount(fromAcc.id, {
          currentBalance: fromAcc.currentBalance - amt,
          transactions: [...(fromAcc.transactions||[]), { id: String((fromAcc.transactions?.length||0) + 1), type: 'Bank to Bank', name: bankTxDescription || `Transfer to ${bankAccounts.find(b => b.id === bankTxToAcc)?.displayName}`, date: bankTxDate, amount: -amt }]
        });
      }
      const toAcc = bankAccounts.find(b => b.id === bankTxToAcc);
      if (toAcc) {
        updateBankAccount(toAcc.id, {
          currentBalance: toAcc.currentBalance + amt,
          transactions: [...(toAcc.transactions||[]), { id: String((toAcc.transactions?.length||0) + 1), type: 'Bank to Bank', name: bankTxDescription || `Transfer from ${fromAcc?.displayName}`, date: bankTxDate, amount: amt }]
        });
      }"""
content = content.replace(old_bank_to_bank, new_bank_to_bank)


# Replace adjustment
old_adj = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === bankTxFromAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          const newTx: BankTransaction = {
            id: nextTxId,
            type: 'Adjustment',
            name: bankTxDescription || `Adjustment (${bankTxAdjType})`,
            date: bankTxDate,
            amount: actualAmt
          };
          return {
            ...acc,
            currentBalance: acc.currentBalance + actualAmt,
            transactions: [...acc.transactions, newTx]
          };
        }
        return acc;
      }));"""
new_adj = """      const acc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + actualAmt,
          transactions: [...(acc.transactions||[]), { id: String((acc.transactions?.length||0) + 1), type: 'Adjustment', name: bankTxDescription || `Adjustment (${bankTxAdjType})`, date: bankTxDate, amount: actualAmt }]
        });
      }"""
content = content.replace(old_adj, new_adj)


with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
