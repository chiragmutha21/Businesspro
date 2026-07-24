import sys
import re

def update_cashbank():
    with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update destructuring from useApp to get new functions
    old_useapp = "  const { customers, activeBusiness } = useApp();"
    new_useapp = """  const { 
    customers, activeBusiness, 
    bankAccounts, loanAccounts, cheques, cashLogs,
    addBankAccount, updateBankAccount, deleteBankAccount,
    addLoanAccount, deleteLoanAccount,
    addCheque, deleteCheque,
    addCashLog, deleteCashLog
  } = useApp();"""
    content = content.replace(old_useapp, new_useapp)

    # 2. Remove the useState for these 4 lists that use localStorage
    # We will use regex to find and replace the useState(() => {...}) blocks

    # Find and remove bankAccounts state
    bank_regex = r"const \[bankAccounts, setBankAccounts\] = useState<BankAccount\[\]>\(\(\) => \{.*?\n  \}\);"
    content = re.sub(bank_regex, "", content, flags=re.DOTALL)
    
    # Find and remove loanAccounts state
    loan_regex = r"const \[loanAccounts, setLoanAccounts\] = useState<LoanAccount\[\]>\(\(\) => \{.*?\n  \}\);"
    content = re.sub(loan_regex, "", content, flags=re.DOTALL)
    
    # Find and remove cheques state
    cheque_regex = r"const \[cheques, setCheques\] = useState<Cheque\[\]>\(\(\) => \{.*?\n  \}\);"
    content = re.sub(cheque_regex, "", content, flags=re.DOTALL)
    
    # Find and remove cashLogs state
    cash_regex = r"const \[cashLogs, setCashLogs\] = useState<CashAdjustment\[\]>\(\(\) => \{.*?\n  \}\);"
    content = re.sub(cash_regex, "", content, flags=re.DOTALL)

    # 3. Replace the useEffect that saves to localStorage
    effect_regex = r"useEffect\(\(\) => \{[\s\n]*localStorage\.setItem\('bankAccounts'.*?\}, \[bankAccounts, loanAccounts, cheques, cashLogs\]\);"
    content = re.sub(effect_regex, "", content, flags=re.DOTALL)

    # 4. Update the logic functions to use the new add/update/delete DB functions
    # Instead of setBankAccounts(prev => ...), we need to call the context functions.
    
    # Add Bank Account
    # const newAccount: BankAccount = { ... form, id: ... } -> setBankAccounts(prev => [...prev, newAccount])
    content = content.replace("setBankAccounts(prev => [...prev, { ...form, id: Date.now().toString(), businessId: activeBusiness?.id, currentBalance: form.openingBalance }]);", 
                              "addBankAccount({ ...form, currentBalance: form.openingBalance });")

    # Bank to Bank Transfer
    # Needs to be awaited, but it's okay if it runs async in the UI for now.
    # Actually, we need to call updateBankAccount(id, { currentBalance, transactions })
    bank_to_bank_str = """
      setBankAccounts(prev => prev.map(acc => {
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
      }));
"""
    new_bank_to_bank = """
      const fromAcc = bankAccounts.find(b => b.id === form.fromAccount);
      const toAcc = bankAccounts.find(b => b.id === form.toAccount);
      if (fromAcc) {
        updateBankAccount(fromAcc.id, {
          currentBalance: fromAcc.currentBalance - form.amount,
          transactions: [...(fromAcc.transactions||[]), { id: Date.now().toString(), type: 'Bank to Bank', name: 'Transfer to ' + (toAcc?.displayName || ''), date: form.date, amount: -form.amount }]
        });
      }
      if (toAcc) {
        updateBankAccount(toAcc.id, {
          currentBalance: toAcc.currentBalance + form.amount,
          transactions: [...(toAcc.transactions||[]), { id: (Date.now() + 1).toString(), type: 'Bank to Bank', name: 'Transfer from ' + (fromAcc?.displayName || ''), date: form.date, amount: form.amount }]
        });
      }
"""
    content = content.replace(bank_to_bank_str, new_bank_to_bank)

    # Cash to Bank / Bank to Cash
    cash_to_bank_str = """
      setBankAccounts(prev => prev.map(acc => {
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
      }));
      setCashLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: form.type === 'Cash to Bank' ? 'Reduce' : 'Add',
        amount: form.amount,
        date: form.date,
        description: form.type === 'Cash to Bank' ? `Deposited to ${bankAccounts.find(b => b.id === form.account)?.displayName}` : `Withdrawn from ${bankAccounts.find(b => b.id === form.account)?.displayName}`,
        businessId: activeBusiness?.id
      }]);
"""
    new_cash_to_bank = """
      const acc = bankAccounts.find(b => b.id === form.account);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + (form.type === 'Cash to Bank' ? form.amount : -form.amount),
          transactions: [...(acc.transactions||[]), { id: Date.now().toString(), type: form.type, name: form.type, date: form.date, amount: form.type === 'Cash to Bank' ? form.amount : -form.amount }]
        });
      }
      addCashLog({
        type: form.type === 'Cash to Bank' ? 'Reduce' : 'Add',
        amount: form.amount,
        date: form.date,
        description: form.type === 'Cash to Bank' ? `Deposited to ${acc?.displayName}` : `Withdrawn from ${acc?.displayName}`
      });
"""
    content = content.replace(cash_to_bank_str, new_cash_to_bank)
    
    # Adjust Bank Balance
    adj_bank_str = """
      setBankAccounts(prev => prev.map(acc => {
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
      }));
"""
    new_adj_bank = """
      const acc = bankAccounts.find(b => b.id === form.account);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + (form.adjustmentType === 'Add' ? form.amount : -form.amount),
          transactions: [...(acc.transactions||[]), { id: Date.now().toString(), type: 'Adjustment', name: form.description || 'Manual Adjustment', date: form.date, amount: form.adjustmentType === 'Add' ? form.amount : -form.amount }]
        });
      }
"""
    content = content.replace(adj_bank_str, new_adj_bank)

    # Adjust Cash Balance
    adj_cash_str = """
      setCashLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: form.adjustmentType,
        amount: form.amount,
        date: form.date,
        description: form.description,
        businessId: activeBusiness?.id
      }]);
"""
    new_adj_cash = """
      addCashLog({
        type: form.adjustmentType,
        amount: form.amount,
        date: form.date,
        description: form.description
      });
"""
    content = content.replace(adj_cash_str, new_adj_cash)
    
    # Delete Account
    content = content.replace("setBankAccounts(prev => prev.filter(acc => acc.id !== id));", "deleteBankAccount(id);")
    
    # Save Cheque
    save_cheque_str = """
      if (selectedCheque) {
        setCheques(prev => prev.map(c => c.id === selectedCheque.id ? { ...chequeForm, businessId: activeBusiness?.id } : c));
      } else {
        setCheques(prev => [...prev, { ...chequeForm, id: Date.now().toString(), businessId: activeBusiness?.id }]);
      }
"""
    new_save_cheque = """
      if (selectedCheque) {
        // Technically missing updateCheque in context, so delete and add
        deleteCheque(selectedCheque.id).then(() => addCheque(chequeForm));
      } else {
        addCheque(chequeForm);
      }
"""
    content = content.replace(save_cheque_str, new_save_cheque)
    
    # Update Cheque Status
    upd_cheque_str = """
    setCheques(prev => prev.map(c => c.id === id ? { ...c, status: newStatus } : c));
"""
    new_upd_cheque = """
    // Missing updateCheque in context, we will ignore for a moment or implement delete-add
    const chq = cheques.find(c => c.id === id);
    if (chq) {
      deleteCheque(id).then(() => addCheque({ ...chq, status: newStatus }));
    }
"""
    content = content.replace(upd_cheque_str, new_upd_cheque)
    
    # Delete Cheque
    content = content.replace("setCheques(prev => prev.filter(c => c.id !== id));", "deleteCheque(id);")
    
    # Save Loan Account
    save_loan_str = "setLoanAccounts(prev => [...prev, { ...loanForm, id: Date.now().toString(), businessId: activeBusiness?.id, currentBalance: loanForm.currentBalance }]);"
    new_save_loan = "addLoanAccount({ ...loanForm, currentBalance: loanForm.currentBalance, transactions: [] });"
    content = content.replace(save_loan_str, new_save_loan)
    
    # Add Loan Payment
    # We missed updateLoanAccount in AppContext! We should just delete and add to update.
    loan_pay_str = """
    setLoanAccounts(prev => prev.map(loan => {
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
    }));
    
    // Reduce balance from bank or cash
    if (paymentForm.paymentMode === 'Cash') {
      setCashLogs(prev => [...prev, {
        id: Date.now().toString(),
        type: 'Reduce',
        amount: paymentForm.principal + paymentForm.interest,
        date: paymentForm.date,
        description: `Loan Payment: ${selectedLoan.name}`,
        businessId: activeBusiness?.id
      }]);
    } else if (paymentForm.paymentMode === 'Bank') {
      setBankAccounts(prev => prev.map(acc => {
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
      }));
    }
"""
    new_loan_pay = """
    const loan = loanAccounts.find(l => l.id === selectedLoan.id);
    if (loan) {
      deleteLoanAccount(loan.id).then(() => {
        addLoanAccount({
          ...loan,
          currentBalance: loan.currentBalance - paymentForm.principal,
          transactions: [...(loan.transactions||[]), { id: Date.now().toString(), type: 'Payment', date: paymentForm.date, principal: paymentForm.principal, interest: paymentForm.interest, total: paymentForm.principal + paymentForm.interest }]
        });
      });
    }
    
    if (paymentForm.paymentMode === 'Cash') {
      addCashLog({ type: 'Reduce', amount: paymentForm.principal + paymentForm.interest, date: paymentForm.date, description: `Loan Payment: ${selectedLoan.name}` });
    } else if (paymentForm.paymentMode === 'Bank') {
      const acc = bankAccounts.find(b => b.id === paymentForm.bankAccount);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance - (paymentForm.principal + paymentForm.interest),
          transactions: [...(acc.transactions||[]), { id: Date.now().toString(), type: 'Loan Payment', name: `Loan: ${selectedLoan.name}`, date: paymentForm.date, amount: -(paymentForm.principal + paymentForm.interest) }]
        });
      }
    }
"""
    content = content.replace(loan_pay_str, new_loan_pay)

    # Delete Loan
    content = content.replace("setLoanAccounts(prev => prev.filter(l => l.id !== id));", "deleteLoanAccount(id);")

    with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_cashbank()
