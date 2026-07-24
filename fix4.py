import sys
import re

with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any lingering setLoanAccounts(prev => prev.map)
def replace_loan(match):
    block = match.group(0)
    return """      const loan = loanAccounts.find(l => l.id === selectedLoanId);
      if (loan) {
        updateLoanAccount(loan.id, {
          currentBalance: loan.currentBalance - payPrincipal,
          transactions: [...(loan.transactions||[]), { id: Date.now().toString(), type: 'Payment', date: payDate, principal: payPrincipal, interest: payInterest, total: payPrincipal + payInterest }]
        });
      }"""
content = re.sub(r'setLoanAccounts\(prev => prev\.map\(acc => \{.*?\n      \}\)\);', replace_loan, content, flags=re.DOTALL)

# Delete sets
content = re.sub(r'setLoanAccounts\(.*?\);', '', content)
content = re.sub(r'setBankAccounts\(.*?\);', '', content)
content = re.sub(r'setCheques\(.*?\);', '', content)
content = re.sub(r'setCashLogs\(.*?\);', '', content)

with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
