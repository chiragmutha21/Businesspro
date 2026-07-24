import sys

with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update hooks
old_hook = "  const { customers, activeBusiness } = useApp();"
new_hook = """  const { 
    customers, activeBusiness, 
    bankAccounts, loanAccounts, cheques, cashLogs,
    addBankAccount, updateBankAccount, deleteBankAccount,
    addLoanAccount, deleteLoanAccount,
    addCheque, deleteCheque,
    addCashLog, deleteCashLog
  } = useApp();"""
content = content.replace(old_hook, new_hook)

# 2. Comment out state initializers
content = content.replace("""  const [cashLogs, setCashLogs] = useState<any[]>(() => {
    const s = localStorage.getItem('cashLogs');
    return s ? JSON.parse(s) : [];
  });""", "")
content = content.replace("""  const [cheques, setCheques] = useState<any[]>(() => {
    const s = localStorage.getItem('cheques');
    return s ? JSON.parse(s) : [];
  });""", "")
content = content.replace("""  const [loanAccounts, setLoanAccounts] = useState<any[]>(() => {
    const s = localStorage.getItem('loanAccounts');
    return s ? JSON.parse(s) : [];
  });""", "")
content = content.replace("""  const [bankAccounts, setBankAccounts] = useState<any[]>(() => {
    const s = localStorage.getItem('bankAccounts');
    return s ? JSON.parse(s) : [];
  });""", "")

content = content.replace("  React.useEffect(() => { localStorage.setItem('cashLogs', JSON.stringify(cashLogs)); }, [cashLogs]);", "")
content = content.replace("  React.useEffect(() => { localStorage.setItem('cheques', JSON.stringify(cheques)); }, [cheques]);", "")
content = content.replace("  React.useEffect(() => { localStorage.setItem('loanAccounts', JSON.stringify(loanAccounts)); }, [loanAccounts]);", "")
content = content.replace("  React.useEffect(() => { localStorage.setItem('bankAccounts', JSON.stringify(bankAccounts)); }, [bankAccounts]);", "")

# 3. Replace state setters with Context methods
content = content.replace("setBankAccounts([...bankAccounts, newBank]);", "addBankAccount(newBank as any);")
content = content.replace("setBankAccounts(prev => prev.filter(acc => acc.id !== id));", "deleteBankAccount(id);")

content = content.replace("setLoanAccounts([...loanAccounts, newLoan]);", "addLoanAccount(newLoan as any);")
content = content.replace("setLoanAccounts(prev => prev.filter(l => l.id !== id));", "deleteLoanAccount(id);")

content = content.replace("setCheques(prev => prev.filter(c => c.id !== id));", "deleteCheque(id);")
content = content.replace("setCashLogs(prev => prev.filter(l => l.id !== id));", "deleteCashLog(id);")

# 4. Handle Complex updates
# I will use a regex just to disable the exact lines causing syntax errors by commenting them out, 
# and replacing them with correct function calls.
# Wait, replacing them exactly using exact strings:

old_save_cheque = """      if (selectedCheque) {
        setCheques(prev => prev.map(c => c.id === selectedCheque.id ? { ...chequeForm, businessId: activeBusiness?.id } : c));
      } else {
        setCheques(prev => [...prev, { ...chequeForm, id: Date.now().toString(), businessId: activeBusiness?.id }]);
      }"""
new_save_cheque = """      if (selectedCheque) {
        deleteCheque(selectedCheque.id).then(() => addCheque(chequeForm as any));
      } else {
        addCheque(chequeForm as any);
      }"""
content = content.replace(old_save_cheque, new_save_cheque)

old_update_cheque = """    setCheques(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));"""
new_update_cheque = """    const c = cheques.find(c => c.id === id);
    if (c) {
      deleteCheque(id).then(() => addCheque({ ...c, status: newStatus } as any));
    }"""
content = content.replace(old_update_cheque, new_update_cheque)


old_cash_adj = """      setCashLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: form.adjustmentType,
        amount: form.amount,
        date: form.date,
        description: form.description,
        businessId: activeBusiness?.id
      }]);"""
new_cash_adj = """      addCashLog({
        type: form.adjustmentType,
        amount: form.amount,
        date: form.date,
        description: form.description
      } as any);"""
content = content.replace(old_cash_adj, new_cash_adj)

old_bank_adj = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === form.account) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + (form.adjustmentType === 'Add' ? form.amount : -form.amount),
            transactions: [...acc.transactions, {
              id: Date.now().toString(),
              type: 'Adjustment',
              name: form.description || 'Manual Adjustment',
              date: form.date,
              amount: form.adjustmentType === 'Add' ? form.amount : -form.amount
            }]
          };
        }
        return acc;
      }));"""
new_bank_adj = """      const acc = bankAccounts.find(b => b.id === form.account);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + (form.adjustmentType === 'Add' ? form.amount : -form.amount),
          transactions: [...(acc.transactions||[]), {
            id: Date.now().toString(),
            type: 'Adjustment',
            name: form.description || 'Manual Adjustment',
            date: form.date,
            amount: form.adjustmentType === 'Add' ? form.amount : -form.amount
          }]
        });
      }"""
content = content.replace(old_bank_adj, new_bank_adj)


old_cash_to_bank1 = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === form.account) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + (form.type === 'Cash to Bank' ? form.amount : -form.amount),
            transactions: [...acc.transactions, {
              id: Date.now().toString(),
              type: form.type,
              name: form.type,
              date: form.date,
              amount: form.type === 'Cash to Bank' ? form.amount : -form.amount
            }]
          };
        }
        return acc;
      }));"""
new_cash_to_bank1 = """      const acc = bankAccounts.find(b => b.id === form.account);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + (form.type === 'Cash to Bank' ? form.amount : -form.amount),
          transactions: [...(acc.transactions||[]), {
            id: Date.now().toString(),
            type: form.type,
            name: form.type,
            date: form.date,
            amount: form.type === 'Cash to Bank' ? form.amount : -form.amount
          }]
        });
      }"""
content = content.replace(old_cash_to_bank1, new_cash_to_bank1)


old_cash_to_bank2 = """      setCashLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: form.type === 'Cash to Bank' ? 'Reduce' : 'Add',
        amount: form.amount,
        date: form.date,
        description: form.type === 'Cash to Bank' ? `Deposited to ${bankAccounts.find(b => b.id === form.account)?.displayName}` : `Withdrawn from ${bankAccounts.find(b => b.id === form.account)?.displayName}`,
        businessId: activeBusiness?.id
      }]);"""
new_cash_to_bank2 = """      addCashLog({
        type: form.type === 'Cash to Bank' ? 'Reduce' : 'Add',
        amount: form.amount,
        date: form.date,
        description: form.type === 'Cash to Bank' ? `Deposited to ${bankAccounts.find(b => b.id === form.account)?.displayName}` : `Withdrawn from ${bankAccounts.find(b => b.id === form.account)?.displayName}`
      } as any);"""
content = content.replace(old_cash_to_bank2, new_cash_to_bank2)


old_bank_to_bank = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === form.fromAccount) {
          return {
            ...acc,
            currentBalance: acc.currentBalance - form.amount,
            transactions: [...acc.transactions, {
              id: Date.now().toString(),
              type: 'Bank to Bank',
              name: 'Transfer to ' + (bankAccounts.find(b => b.id === form.toAccount)?.displayName || ''),
              date: form.date,
              amount: -form.amount
            }]
          };
        }
        if (acc.id === form.toAccount) {
          return {
            ...acc,
            currentBalance: acc.currentBalance + form.amount,
            transactions: [...acc.transactions, {
              id: (Date.now() + 1).toString(),
              type: 'Bank to Bank',
              name: 'Transfer from ' + (bankAccounts.find(b => b.id === form.fromAccount)?.displayName || ''),
              date: form.date,
              amount: form.amount
            }]
          };
        }
        return acc;
      }));"""
new_bank_to_bank = """      const fromAcc = bankAccounts.find(b => b.id === form.fromAccount);
      if (fromAcc) {
        updateBankAccount(fromAcc.id, {
          currentBalance: fromAcc.currentBalance - form.amount,
          transactions: [...(fromAcc.transactions||[]), {
            id: Date.now().toString(),
            type: 'Bank to Bank',
            name: 'Transfer to ' + (bankAccounts.find(b => b.id === form.toAccount)?.displayName || ''),
            date: form.date,
            amount: -form.amount
          }]
        });
      }
      const toAcc = bankAccounts.find(b => b.id === form.toAccount);
      if (toAcc) {
        updateBankAccount(toAcc.id, {
          currentBalance: toAcc.currentBalance + form.amount,
          transactions: [...(toAcc.transactions||[]), {
            id: (Date.now() + 1).toString(),
            type: 'Bank to Bank',
            name: 'Transfer from ' + (bankAccounts.find(b => b.id === form.fromAccount)?.displayName || ''),
            date: form.date,
            amount: form.amount
          }]
        });
      }"""
content = content.replace(old_bank_to_bank, new_bank_to_bank)


old_loan_pay = """    setLoanAccounts(prev => prev.map(loan => {
      if (loan.id === selectedLoan.id) {
        return {
          ...loan,
          currentBalance: loan.currentBalance - paymentForm.principal,
          transactions: [...loan.transactions, {
            id: Date.now().toString(),
            type: 'Payment',
            date: paymentForm.date,
            principal: paymentForm.principal,
            interest: paymentForm.interest,
            total: paymentForm.principal + paymentForm.interest
          }]
        };
      }
      return loan;
    }));"""
new_loan_pay = """    const loan = loanAccounts.find(l => l.id === selectedLoan.id);
    if (loan) {
      deleteLoanAccount(loan.id).then(() => {
        addLoanAccount({
          ...loan,
          currentBalance: loan.currentBalance - paymentForm.principal,
          transactions: [...(loan.transactions||[]), {
            id: Date.now().toString(),
            type: 'Payment',
            date: paymentForm.date,
            principal: paymentForm.principal,
            interest: paymentForm.interest,
            total: paymentForm.principal + paymentForm.interest
          }]
        } as any);
      });
    }"""
content = content.replace(old_loan_pay, new_loan_pay)

old_loan_pay_cash = """      setCashLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: 'Reduce',
        amount: paymentForm.principal + paymentForm.interest,
        date: paymentForm.date,
        description: `Loan Payment: ${selectedLoan.name}`,
        businessId: activeBusiness?.id
      }]);"""
new_loan_pay_cash = """      addCashLog({
        type: 'Reduce',
        amount: paymentForm.principal + paymentForm.interest,
        date: paymentForm.date,
        description: `Loan Payment: ${selectedLoan.name}`
      } as any);"""
content = content.replace(old_loan_pay_cash, new_loan_pay_cash)

old_loan_pay_bank = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === paymentForm.bankAccount) {
          return {
            ...acc,
            currentBalance: acc.currentBalance - (paymentForm.principal + paymentForm.interest),
            transactions: [...acc.transactions, {
              id: Date.now().toString(),
              type: 'Loan Payment',
              name: `Loan: ${selectedLoan.name}`,
              date: paymentForm.date,
              amount: -(paymentForm.principal + paymentForm.interest)
            }]
          };
        }
        return acc;
      }));"""
new_loan_pay_bank = """      const acc = bankAccounts.find(b => b.id === paymentForm.bankAccount);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance - (paymentForm.principal + paymentForm.interest),
          transactions: [...(acc.transactions||[]), {
            id: Date.now().toString(),
            type: 'Loan Payment',
            name: `Loan: ${selectedLoan.name}`,
            date: paymentForm.date,
            amount: -(paymentForm.principal + paymentForm.interest)
          }]
        });
      }"""
content = content.replace(old_loan_pay_bank, new_loan_pay_bank)


old_bank_tx1 = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === bankTxFromAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          const newTx: BankTransaction = {
            id: nextTxId,
            type: 'Bank to Cash',
            name: bankTxDescription || 'Bank to Cash Transfer',
            date: bankTxDate,
            amount: -amt
          };
          return {
            ...acc,
            currentBalance: acc.currentBalance - amt,
            transactions: [...acc.transactions, newTx]
          };
        }
        return acc;
      }));"""
new_bank_tx1 = """      const acc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance - amt,
          transactions: [...(acc.transactions||[]), { id: String((acc.transactions?.length||0) + 1), type: 'Bank to Cash', name: bankTxDescription || 'Bank to Cash Transfer', date: bankTxDate, amount: -amt }]
        });
      }"""
content = content.replace(old_bank_tx1, new_bank_tx1)


old_bank_tx2 = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === bankTxToAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          const newTx: BankTransaction = {
            id: nextTxId,
            type: 'Cash to Bank',
            name: bankTxDescription || 'Cash to Bank Transfer',
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
new_bank_tx2 = """      const acc = bankAccounts.find(b => b.id === bankTxToAcc);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + amt,
          transactions: [...(acc.transactions||[]), { id: String((acc.transactions?.length||0) + 1), type: 'Cash to Bank', name: bankTxDescription || 'Cash to Bank Transfer', date: bankTxDate, amount: amt }]
        });
      }"""
content = content.replace(old_bank_tx2, new_bank_tx2)


old_bank_tx3 = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === bankTxFromAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          return {
            ...acc,
            currentBalance: acc.currentBalance - amt,
            transactions: [...acc.transactions, {
              id: nextTxId,
              type: 'Bank to Bank',
              name: bankTxDescription || ('Transfer to ' + (bankAccounts.find(b => b.id === bankTxToAcc)?.displayName || '')),
              date: bankTxDate,
              amount: -amt
            }]
          };
        }
        if (acc.id === bankTxToAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          return {
            ...acc,
            currentBalance: acc.currentBalance + amt,
            transactions: [...acc.transactions, {
              id: nextTxId,
              type: 'Bank to Bank',
              name: bankTxDescription || ('Transfer from ' + (bankAccounts.find(b => b.id === bankTxFromAcc)?.displayName || '')),
              date: bankTxDate,
              amount: amt
            }]
          };
        }
        return acc;
      }));"""
new_bank_tx3 = """      const fromAcc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (fromAcc) {
        updateBankAccount(fromAcc.id, {
          currentBalance: fromAcc.currentBalance - amt,
          transactions: [...(fromAcc.transactions||[]), { id: String((fromAcc.transactions?.length||0) + 1), type: 'Bank to Bank', name: bankTxDescription || ('Transfer to ' + (bankAccounts.find(b => b.id === bankTxToAcc)?.displayName || '')), date: bankTxDate, amount: -amt }]
        });
      }
      const toAcc = bankAccounts.find(b => b.id === bankTxToAcc);
      if (toAcc) {
        updateBankAccount(toAcc.id, {
          currentBalance: toAcc.currentBalance + amt,
          transactions: [...(toAcc.transactions||[]), { id: String((toAcc.transactions?.length||0) + 1), type: 'Bank to Bank', name: bankTxDescription || ('Transfer from ' + (bankAccounts.find(b => b.id === bankTxFromAcc)?.displayName || '')), date: bankTxDate, amount: amt }]
        });
      }"""
content = content.replace(old_bank_tx3, new_bank_tx3)


old_bank_tx4 = """      setBankAccounts(prev => prev.map(acc => {
        if (acc.id === bankTxFromAcc) {
          const nextTxId = String(acc.transactions.length + 1);
          const adjAmt = bankTxAdjType === 'Increase balance' ? amt : -amt;
          return {
            ...acc,
            currentBalance: acc.currentBalance + adjAmt,
            transactions: [...acc.transactions, {
              id: nextTxId,
              type: 'Adjustment',
              name: bankTxDescription || 'Manual Adjustment',
              date: bankTxDate,
              amount: adjAmt
            }]
          };
        }
        return acc;
      }));"""
new_bank_tx4 = """      const acc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (acc) {
        const adjAmt = bankTxAdjType === 'Increase balance' ? amt : -amt;
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + adjAmt,
          transactions: [...(acc.transactions||[]), { id: String((acc.transactions?.length||0) + 1), type: 'Adjustment', name: bankTxDescription || 'Manual Adjustment', date: bankTxDate, amount: adjAmt }]
        });
      }"""
content = content.replace(old_bank_tx4, new_bank_tx4)


with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
