import sys
import re

with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

content = re.sub(r'const \[cashLogs, setCashLogs\] = useState<any\[\]>\(\(\) => \{.*?\n  \}\);', '', content, flags=re.DOTALL)
content = re.sub(r'const \[cheques, setCheques\] = useState<any\[\]>\(\(\) => \{.*?\n  \}\);', '', content, flags=re.DOTALL)
content = re.sub(r'const \[loanAccounts, setLoanAccounts\] = useState<any\[\]>\(\(\) => \{.*?\n  \}\);', '', content, flags=re.DOTALL)
content = re.sub(r'const \[bankAccounts, setBankAccounts\] = useState<any\[\]>\(\(\) => \{.*?\n  \}\);', '', content, flags=re.DOTALL)

content = re.sub(r"React\.useEffect\(\(\) => \{ localStorage\.setItem\('.*?\}\);", "", content)

with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
