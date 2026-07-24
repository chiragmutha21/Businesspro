import sys
import re

def update_cash_bank():
    with open('src/components/CashBank.tsx', 'r', encoding='utf-8') as f:
        content = f.read()
    
    # 1. Update state declarations
    content = content.replace("const [cashLogs, setCashLogs] = useState<CashAdjustment[]>([]);", 
    "const [cashLogs, setCashLogs] = useState<any[]>(() => { const s = localStorage.getItem('cashLogs'); return s ? JSON.parse(s) : []; });")
    
    content = content.replace("const [cheques, setCheques] = useState<Cheque[]>([]);", 
    "const [cheques, setCheques] = useState<any[]>(() => { const s = localStorage.getItem('cheques'); return s ? JSON.parse(s) : []; });")
    
    content = content.replace("const [loanAccounts, setLoanAccounts] = useState<LoanAccount[]>([]);", 
    "const [loanAccounts, setLoanAccounts] = useState<any[]>(() => { const s = localStorage.getItem('loanAccounts'); return s ? JSON.parse(s) : []; });")
    
    content = content.replace("const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);", 
    "const [bankAccounts, setBankAccounts] = useState<any[]>(() => { const s = localStorage.getItem('bankAccounts'); return s ? JSON.parse(s) : []; });")
    
    # 2. Add useEffects right after bankAccounts
    hook_str = """
  React.useEffect(() => { localStorage.setItem('cashLogs', JSON.stringify(cashLogs)); }, [cashLogs]);
  React.useEffect(() => { localStorage.setItem('cheques', JSON.stringify(cheques)); }, [cheques]);
  React.useEffect(() => { localStorage.setItem('loanAccounts', JSON.stringify(loanAccounts)); }, [loanAccounts]);
  React.useEffect(() => { localStorage.setItem('bankAccounts', JSON.stringify(bankAccounts)); }, [bankAccounts]);
"""
    content = content.replace("const [searchBankQuery, setSearchBankQuery] = useState('');\n  const [showDepMenu, setShowDepMenu] = useState(false);", 
    "const [searchBankQuery, setSearchBankQuery] = useState('');\n  const [showDepMenu, setShowDepMenu] = useState(false);\n" + hook_str)
    
    # 3. Add businessId to objects when they are created
    content = content.replace("id: String(cashLogs.length + 1),", "id: String(cashLogs.length + 1),\n      businessId: activeBusiness?.id,")
    content = content.replace("id: String(cheques.length + 1),", "id: String(cheques.length + 1),\n      businessId: activeBusiness?.id,")
    content = content.replace("id: String(loanAccounts.length + 1),", "id: String(loanAccounts.length + 1),\n      businessId: activeBusiness?.id,")
    content = content.replace("id: String(bankAccounts.length + 1),", "id: String(bankAccounts.length + 1),\n      businessId: activeBusiness?.id,")
    
    # 4. Filter arrays in render
    content = content.replace("cashLogs.map", "cashLogs.filter(l => l.businessId === activeBusiness?.id).map")
    content = content.replace("cashLogs.length === 0", "cashLogs.filter(l => l.businessId === activeBusiness?.id).length === 0")
    content = content.replace("cheques.map", "cheques.filter(c => c.businessId === activeBusiness?.id).map")
    content = content.replace("cheques.length === 0", "cheques.filter(c => c.businessId === activeBusiness?.id).length === 0")
    content = content.replace("loanAccounts.map", "loanAccounts.filter(l => l.businessId === activeBusiness?.id).map")
    content = content.replace("loanAccounts.filter", "loanAccounts.filter(l => l.businessId === activeBusiness?.id).filter")
    content = content.replace("loanAccounts.length === 0", "loanAccounts.filter(l => l.businessId === activeBusiness?.id).length === 0")
    content = content.replace("bankAccounts.map", "bankAccounts.filter(b => b.businessId === activeBusiness?.id).map")
    content = content.replace("bankAccounts.filter", "bankAccounts.filter(b => b.businessId === activeBusiness?.id).filter")
    content = content.replace("bankAccounts.length === 0", "bankAccounts.filter(b => b.businessId === activeBusiness?.id).length === 0")

    # Fix the double filter bug we just introduced for existing filters
    content = content.replace(".filter(b => b.businessId === activeBusiness?.id).filter(", ".filter(b => b.businessId === activeBusiness?.id && ")
    content = content.replace(".filter(l => l.businessId === activeBusiness?.id).filter(", ".filter(l => l.businessId === activeBusiness?.id && ")
    
    with open('src/components/CashBank.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("CashBank.tsx updated")

def update_transactions():
    with open('src/components/Transactions.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update state declarations
    content = content.replace("const [estimates, setEstimates] = useState<any[]>([]);", 
    "const [estimates, setEstimates] = useState<any[]>(() => { const s = localStorage.getItem('estimates'); return s ? JSON.parse(s) : []; });")
    content = content.replace("const [proformaInvoices, setProformaInvoices] = useState<any[]>([]);", 
    "const [proformaInvoices, setProformaInvoices] = useState<any[]>(() => { const s = localStorage.getItem('proformaInvoices'); return s ? JSON.parse(s) : []; });")
    content = content.replace("const [paymentsIn, setPaymentsIn] = useState<any[]>([]);", 
    "const [paymentsIn, setPaymentsIn] = useState<any[]>(() => { const s = localStorage.getItem('paymentsIn'); return s ? JSON.parse(s) : []; });")
    content = content.replace("const [saleOrders, setSaleOrders] = useState<any[]>([]);", 
    "const [saleOrders, setSaleOrders] = useState<any[]>(() => { const s = localStorage.getItem('saleOrders'); return s ? JSON.parse(s) : []; });")
    content = content.replace("const [deliveryChallans, setDeliveryChallans] = useState<any[]>([]);", 
    "const [deliveryChallans, setDeliveryChallans] = useState<any[]>(() => { const s = localStorage.getItem('deliveryChallans'); return s ? JSON.parse(s) : []; });")
    content = content.replace("const [saleReturns, setSaleReturns] = useState<any[]>([]);", 
    "const [saleReturns, setSaleReturns] = useState<any[]>(() => { const s = localStorage.getItem('saleReturns'); return s ? JSON.parse(s) : []; });")
    
    hook_str = """
  React.useEffect(() => { localStorage.setItem('estimates', JSON.stringify(estimates)); }, [estimates]);
  React.useEffect(() => { localStorage.setItem('proformaInvoices', JSON.stringify(proformaInvoices)); }, [proformaInvoices]);
  React.useEffect(() => { localStorage.setItem('paymentsIn', JSON.stringify(paymentsIn)); }, [paymentsIn]);
  React.useEffect(() => { localStorage.setItem('saleOrders', JSON.stringify(saleOrders)); }, [saleOrders]);
  React.useEffect(() => { localStorage.setItem('deliveryChallans', JSON.stringify(deliveryChallans)); }, [deliveryChallans]);
  React.useEffect(() => { localStorage.setItem('saleReturns', JSON.stringify(saleReturns)); }, [saleReturns]);
"""
    content = content.replace("const generateUniqueId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);",
    hook_str + "\n  const generateUniqueId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);")

    content = content.replace("id: String(estimates.length + 1),", "id: String(estimates.length + 1),\n          businessId: activeBusiness?.id,")
    content = content.replace("id: String(proformaInvoices.length + 1),", "id: String(proformaInvoices.length + 1),\n          businessId: activeBusiness?.id,")
    content = content.replace("id: String(paymentsIn.length + 1),", "id: String(paymentsIn.length + 1),\n          businessId: activeBusiness?.id,")
    content = content.replace("id: String(saleOrders.length + 1),", "id: String(saleOrders.length + 1),\n          businessId: activeBusiness?.id,")
    content = content.replace("id: String(deliveryChallans.length + 1),", "id: String(deliveryChallans.length + 1),\n          businessId: activeBusiness?.id,")
    content = content.replace("id: String(saleReturns.length + 1),", "id: String(saleReturns.length + 1),\n          businessId: activeBusiness?.id,")
    
    # 4. Filter arrays in render
    arrays = ['estimates', 'proformaInvoices', 'paymentsIn', 'saleOrders', 'deliveryChallans', 'saleReturns']
    for arr in arrays:
        content = content.replace(f"{arr}.map", f"{arr}.filter(x => x.businessId === activeBusiness?.id).map")
        content = content.replace(f"{arr}.length === 0", f"{arr}.filter(x => x.businessId === activeBusiness?.id).length === 0")
        
    with open('src/components/Transactions.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Transactions.tsx updated")

update_cash_bank()
update_transactions()
