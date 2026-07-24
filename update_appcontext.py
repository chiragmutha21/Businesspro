import sys

def update_appcontext():
    with open('src/context/AppContext.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Add Interfaces for the new tables (above AppContextProps)
    interfaces_str = """
export interface BankAccount {
  id: string;
  businessId: string;
  displayName: string;
  openingBalance: number;
  balanceDate: string;
  accountNumber: string;
  ifscCode: string;
  upiId: string;
  bankName: string;
  holderName: string;
  printQr: boolean;
  printDetails: boolean;
  acceptOnline: boolean;
  currentBalance: number;
}

export interface LoanAccount {
  id: string;
  businessId: string;
  name: string;
  lenderBank: string;
  accountNumber: string;
  description: string;
  currentBalance: number;
  balanceDate: string;
  receivedIn: string;
  interestRate: number;
  termDuration: number;
  processingFee: number;
  feePaidFrom: string;
}

export interface Cheque {
  id: string;
  businessId: string;
  partyName: string;
  chequeNumber: string;
  amount: number;
  isPostDated: boolean;
  chequeDate: string;
  status: string;
}

export interface CashLog {
  id: string;
  businessId: string;
  type: string;
  amount: number;
  date: string;
  description: string;
}
"""
    content = content.replace("interface AppContextProps {", interfaces_str + "\ninterface AppContextProps {")

    # 2. Add arrays and methods to AppContextProps
    appcontext_props_add = """
  bankAccounts: BankAccount[];
  loanAccounts: LoanAccount[];
  cheques: Cheque[];
  cashLogs: CashLog[];
  addBankAccount: (bank: Omit<BankAccount, 'id' | 'businessId'>) => Promise<void>;
  updateBankAccount: (id: string, bank: Partial<BankAccount>) => Promise<void>;
  deleteBankAccount: (id: string) => Promise<void>;
  addLoanAccount: (loan: Omit<LoanAccount, 'id' | 'businessId'>) => Promise<void>;
  deleteLoanAccount: (id: string) => Promise<void>;
  addCheque: (cheque: Omit<Cheque, 'id' | 'businessId'>) => Promise<void>;
  deleteCheque: (id: string) => Promise<void>;
  addCashLog: (log: Omit<CashLog, 'id' | 'businessId'>) => Promise<void>;
  deleteCashLog: (id: string) => Promise<void>;
"""
    content = content.replace("stockHistory: StockHistory[];", "stockHistory: StockHistory[];" + appcontext_props_add)

    # 3. Add state variables inside AppProvider
    state_vars = """
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loanAccounts, setLoanAccounts] = useState<LoanAccount[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [cashLogs, setCashLogs] = useState<CashLog[]>([]);
"""
    content = content.replace("const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);", 
                              "const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);\n" + state_vars)

    # 4. Add fetching logic inside loadData
    fetch_logic = """
        // Fetch Bank Accounts
        const { data: bankData } = await supabase.from('bank_accounts').select('*').eq('user_id', user.id);
        setBankAccounts((bankData || []).map((b) => ({
          id: b.id, businessId: b.business_id, displayName: b.display_name, openingBalance: Number(b.opening_balance),
          balanceDate: b.balance_date, accountNumber: b.account_number, ifscCode: b.ifsc_code, upiId: b.upi_id,
          bankName: b.bank_name, holderName: b.holder_name, printQr: b.print_qr, printDetails: b.print_details,
          acceptOnline: b.accept_online, currentBalance: Number(b.current_balance)
        })));

        // Fetch Loan Accounts
        const { data: loanData } = await supabase.from('loan_accounts').select('*').eq('user_id', user.id);
        setLoanAccounts((loanData || []).map((l) => ({
          id: l.id, businessId: l.business_id, name: l.name, lenderBank: l.lender_bank, accountNumber: l.account_number,
          description: l.description, currentBalance: Number(l.current_balance), balanceDate: l.balance_date,
          receivedIn: l.received_in, interestRate: Number(l.interest_rate), termDuration: Number(l.term_duration),
          processingFee: Number(l.processing_fee), feePaidFrom: l.fee_paid_from
        })));

        // Fetch Cheques
        const { data: chequeData } = await supabase.from('cheques').select('*').eq('user_id', user.id);
        setCheques((chequeData || []).map((c) => ({
          id: c.id, businessId: c.business_id, partyName: c.party_name, chequeNumber: c.cheque_number,
          amount: Number(c.amount), isPostDated: c.is_post_dated, chequeDate: c.cheque_date, status: c.status
        })));

        // Fetch Cash Logs
        const { data: cashData } = await supabase.from('cash_logs').select('*').eq('user_id', user.id);
        setCashLogs((cashData || []).map((c) => ({
          id: c.id, businessId: c.business_id, type: c.type, amount: Number(c.amount), date: c.date, description: c.description
        })));
"""
    # Insert right after fetch stock history block finishes
    content = content.replace("setStockHistory((shData || []).map((sh) => ({", fetch_logic + "\n        setStockHistory((shData || []).map((sh) => ({")

    # 5. Add methods for adding/deleting
    methods_logic = """
  const addBankAccount = async (bank: Omit<BankAccount, 'id' | 'businessId'>) => {
    if (!user || !activeBusiness) return;
    const { data, error } = await supabase.from('bank_accounts').insert([{
      user_id: user.id, business_id: activeBusiness.id, display_name: bank.displayName, opening_balance: bank.openingBalance,
      balance_date: bank.balanceDate, account_number: bank.accountNumber, ifsc_code: bank.ifscCode, upi_id: bank.upiId,
      bank_name: bank.bankName, holder_name: bank.holderName, print_qr: bank.printQr, print_details: bank.printDetails,
      accept_online: bank.acceptOnline, current_balance: bank.currentBalance
    }]).select().single();
    if (error) throw error;
    setBankAccounts([...bankAccounts, { ...bank, id: data.id, businessId: activeBusiness.id }]);
  };

  const updateBankAccount = async (id: string, updates: Partial<BankAccount>) => {
    if (!user) return;
    const dbUpdates: any = {};
    if (updates.currentBalance !== undefined) dbUpdates.current_balance = updates.currentBalance;
    const { error } = await supabase.from('bank_accounts').update(dbUpdates).eq('id', id);
    if (error) throw error;
    setBankAccounts(bankAccounts.map(b => b.id === id ? { ...b, ...updates } : b));
  };

  const deleteBankAccount = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (error) throw error;
    setBankAccounts(bankAccounts.filter(b => b.id !== id));
  };

  const addLoanAccount = async (loan: Omit<LoanAccount, 'id' | 'businessId'>) => {
    if (!user || !activeBusiness) return;
    const { data, error } = await supabase.from('loan_accounts').insert([{
      user_id: user.id, business_id: activeBusiness.id, name: loan.name, lender_bank: loan.lenderBank,
      account_number: loan.accountNumber, description: loan.description, current_balance: loan.currentBalance,
      balance_date: loan.balanceDate, received_in: loan.receivedIn, interest_rate: loan.interestRate,
      term_duration: loan.termDuration, processing_fee: loan.processingFee, fee_paid_from: loan.feePaidFrom
    }]).select().single();
    if (error) throw error;
    setLoanAccounts([...loanAccounts, { ...loan, id: data.id, businessId: activeBusiness.id }]);
  };

  const deleteLoanAccount = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('loan_accounts').delete().eq('id', id);
    if (error) throw error;
    setLoanAccounts(loanAccounts.filter(b => b.id !== id));
  };

  const addCheque = async (cheque: Omit<Cheque, 'id' | 'businessId'>) => {
    if (!user || !activeBusiness) return;
    const { data, error } = await supabase.from('cheques').insert([{
      user_id: user.id, business_id: activeBusiness.id, party_name: cheque.partyName, cheque_number: cheque.chequeNumber,
      amount: cheque.amount, is_post_dated: cheque.isPostDated, cheque_date: cheque.chequeDate, status: cheque.status
    }]).select().single();
    if (error) throw error;
    setCheques([...cheques, { ...cheque, id: data.id, businessId: activeBusiness.id }]);
  };

  const deleteCheque = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('cheques').delete().eq('id', id);
    if (error) throw error;
    setCheques(cheques.filter(b => b.id !== id));
  };

  const addCashLog = async (log: Omit<CashLog, 'id' | 'businessId'>) => {
    if (!user || !activeBusiness) return;
    const { data, error } = await supabase.from('cash_logs').insert([{
      user_id: user.id, business_id: activeBusiness.id, type: log.type, amount: log.amount, date: log.date, description: log.description
    }]).select().single();
    if (error) throw error;
    setCashLogs([...cashLogs, { ...log, id: data.id, businessId: activeBusiness.id }]);
  };

  const deleteCashLog = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from('cash_logs').delete().eq('id', id);
    if (error) throw error;
    setCashLogs(cashLogs.filter(b => b.id !== id));
  };
"""
    
    # insert before the return block of AppProvider
    content = content.replace("return (\n    <AppContext.Provider", methods_logic + "\n  return (\n    <AppContext.Provider")
    
    # Finally, add the new variables and methods to the context provider value
    context_vals = "bankAccounts, loanAccounts, cheques, cashLogs, addBankAccount, updateBankAccount, deleteBankAccount, addLoanAccount, deleteLoanAccount, addCheque, deleteCheque, addCashLog, deleteCashLog,"
    content = content.replace("value={{\n        businesses,", "value={{\n        " + context_vals + "\n        businesses,")

    with open('src/context/AppContext.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_appcontext()
