import sys
import re

with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# Replace any remaining setCashLogs(prev => [...prev, item])
content = re.sub(r'setCashLogs\(prev => \[\.\.\.prev, (\{.*?\})\]\);', r'addCashLog(\1);', content, flags=re.DOTALL)
# Replace setCheques(prev => [...prev, item])
content = re.sub(r'setCheques\(prev => \[\.\.\.prev, (\{.*?\})\]\);', r'addCheque(\1);', content, flags=re.DOTALL)
# Replace setLoanAccounts(prev => [...prev, item])
content = re.sub(r'setLoanAccounts\(prev => \[\.\.\.prev, (\{.*?\})\]\);', r'addLoanAccount(\1);', content, flags=re.DOTALL)
# Replace setBankAccounts(prev => [...prev, item])
content = re.sub(r'setBankAccounts\(prev => \[\.\.\.prev, (\{.*?\})\]\);', r'addBankAccount(\1);', content, flags=re.DOTALL)

# Delete operations
content = re.sub(r'setCashLogs\(prev => prev\.filter\(.*? !== id\)\);', r'deleteCashLog(id);', content)
content = re.sub(r'setCheques\(prev => prev\.filter\(.*? !== id\)\);', r'deleteCheque(id);', content)
content = re.sub(r'setLoanAccounts\(prev => prev\.filter\(.*? !== id\)\);', r'deleteLoanAccount(id);', content)
content = re.sub(r'setBankAccounts\(prev => prev\.filter\(.*? !== id\)\);', r'deleteBankAccount(id);', content)

# Map operations (like updates) - Since I can't catch all edge cases easily with regex for map,
# I will just write a general patch for the exact line numbers

# Let's fix the specific lines by replacing the whole setX map blocks.
# Actually, it's easier to view the file around those lines and use multi_replace_file_content.
# Or I can just write a targeted python script.

with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
