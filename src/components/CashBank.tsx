import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  X, 
  Coins, 
  CheckCircle, 
  Clock, 
  FileCheck2, 
  Trash2, 
  AlertCircle, 
  Search, 
  Building, 
  Sliders, 
  DollarSign,
  Printer,
  QrCode,
  Smartphone,
  ChevronDown,
  Upload,
  Edit
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';

interface CashBankProps {
  activeSection: string; // 'bank-accounts' | 'cash-in-hand' | 'cheques' | 'loan-accounts'
}

interface Cheque {
  id: string;
  partyName: string;
  chequeNumber: string;
  amount: number;
  isPostDated: boolean;
  chequeDate: string;
  status: 'Pending' | 'Cleared';
  businessId?: string;
}

interface CashAdjustment {
  id: string;
  type: 'Add' | 'Reduce';
  amount: number;
  date: string;
  description: string;
  businessId?: string;
}

interface LoanTransaction {
  id: string;
  type: string; // 'Opening Loan' | 'Payment'
  date: string;
  principal: number;
  interest: number;
  total: number;
}

interface LoanAccount {
  id: string;
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
  transactions: LoanTransaction[];
  businessId?: string;
}

interface BankTransaction {
  id: string;
  type: string; // 'Opening Balance' | 'Bank to Cash' | 'Cash to Bank' | 'Bank to Bank' | 'Adjustment'
  name: string;
  date: string;
  amount: number;
}

interface BankAccount {
  id: string;
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
  transactions: BankTransaction[];
  businessId?: string;
}

export const CashBank: React.FC<CashBankProps> = ({ activeSection }) => {
  const { 
    customers, activeBusiness, 
    bankAccounts, loanAccounts, cheques, cashLogs, transactions,
    addBankAccount, updateBankAccount,
    addLoanAccount, deleteLoanAccount,
    addCheque, deleteCheque,
    addCashLog
  } = useApp();

  // State to manage showing modals
  const [showCashModal, setShowCashModal] = useState(false);
  const [showChequeModal, setShowChequeModal] = useState(false);
  const [showAddLoanModal, setShowAddLoanModal] = useState(false);
  const [showMakePaymentModal, setShowMakePaymentModal] = useState(false);
  
  // Bank Account Modal States
  const [showAddBankModal, setShowAddBankModal] = useState(false);
  const [showBankTxModal, setShowBankTxModal] = useState(false);
  const [bankTxType, setBankTxType] = useState<'Bank to Cash' | 'Cash to Bank' | 'Bank to Bank' | 'Adjustment'>('Adjustment');

  // Cash In Hand States
  const [adjustType, setAdjustType] = useState<'Add' | 'Reduce'>('Add');
  const [cashAmount, setCashAmount] = useState('');
  const [adjustDate, setAdjustDate] = useState('12/07/2026');
  const [cashDescription, setCashDescription] = useState('');
  const cashBalance = React.useMemo(() => {
    const activeCashLogs = cashLogs.filter(l => l.businessId === activeBusiness?.id);
    const manualCash = activeCashLogs.reduce((sum, log) => {
      return log.type === 'Add' ? sum + log.amount : sum - log.amount;
    }, 0);

    const activeTransactions = transactions.filter(t => t.businessId === activeBusiness?.id);
    const transCash = activeTransactions.reduce((sum, t) => {
      const pType = t.paymentType || '';
      const isCash = pType === 'Cash' || t.paymentStatus === 'Paid by Cash';
      const isSplit = pType.startsWith('Split:');
      const cashSplitVal = isSplit ? (Number(pType.split(':')[1]) || 0) : 0;
      const amt = t.receivedAmount !== undefined ? t.receivedAmount : (t.totalAmount || 0);

      if (t.type === 'sale' || t.type === 'payment_in' || t.type === 'sale_return') {
        if (isCash) return sum + amt;
        if (isSplit) return sum + cashSplitVal;
      }
      if (t.type === 'purchase' || t.type === 'Purchase' || t.type === 'expense' || t.type === 'Expense' || t.type === 'payment_out' || t.type === 'purchase_return') {
        const expenseAmt = (t as any).total || t.totalAmount || 0;
        if (isCash) return sum - expenseAmt;
        if (isSplit) return sum - cashSplitVal;
      }
      return sum;
    }, 0);

    return manualCash + transCash;
  }, [cashLogs, transactions, activeBusiness]);


  // Cheque Form States
  const [chequePartyId, setChequePartyId] = useState('');
  const [chequeNumber, setChequeNumber] = useState('');
  const [chequeAmount, setChequeAmount] = useState('');
  const [isPostDated, setIsPostDated] = useState(false);
  const [chequeDate, setChequeDate] = useState('12/07/2026');


  // Loan Account Form States
  const [loanAccName, setLoanAccName] = useState('');
  const [loanLenderBank, setLoanLenderBank] = useState('');
  const [loanAccNumber, setLoanAccNumber] = useState('');
  const [loanDesc, setLoanDesc] = useState('');
  const [loanBalance, setLoanBalance] = useState('');
  const [loanBalanceDate, setLoanBalanceDate] = useState('12/07/2026');
  const [loanReceivedIn, setLoanReceivedIn] = useState('Cash');
  const [loanInterestRate, setLoanInterestRate] = useState('');
  const [loanTermDuration, setLoanTermDuration] = useState('');
  const [loanProcessingFee, setLoanProcessingFee] = useState('');
  const [loanFeePaidFrom, setLoanFeePaidFrom] = useState('Cash');

  // Make Payment Form States
  const [payPrincipal, setPayPrincipal] = useState('');
  const [payInterest, setPayInterest] = useState('');
  const [payDate, setPayDate] = useState('12/07/2026');
  const [payPaidFrom, setPayPaidFrom] = useState('Cash');

  // Bank Account Form States
  const [bankDispName, setBankDispName] = useState('');
  const [bankOpeningBal, setBankOpeningBal] = useState('');
  const [bankAsOfDate, setBankAsOfDate] = useState('12/07/2026');
  const [bankNumber, setBankNumber] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');
  const [bankUpi, setBankUpi] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankHolderName, setBankHolderName] = useState('');
  const [bankPrintQr, setBankPrintQr] = useState(false);
  const [bankPrintDetails, setBankPrintDetails] = useState(false);
  const [bankAcceptOnline, setBankAcceptOnline] = useState(false);

  // Bank Tx Form States
  const [bankTxAmt, setBankTxAmt] = useState('');
  const [bankTxDate, setBankTxDate] = useState('12/07/2026');
  const [bankTxFromAcc, setBankTxFromAcc] = useState('');
  const [bankTxToAcc, setBankTxToAcc] = useState('');
  const [bankTxAdjType, setBankTxAdjType] = useState<'Increase balance' | 'Reduce balance'>('Increase balance');
  const [bankTxDescription, setBankTxDescription] = useState('');
  const [destBankName, setDestBankName] = useState('');
  const [destAccountNo, setDestAccountNo] = useState('');
  const [destIfsc, setDestIfsc] = useState('');
  const [destReceivableName, setDestReceivableName] = useState('');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);

  // Lists saved in memory

  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [searchLoanQuery, setSearchLoanQuery] = useState('');

  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [searchBankQuery, setSearchBankQuery] = useState('');
  const [editingBankId, setEditingBankId] = useState<string | null>(null);

  const handleStartEditBank = (bank: any) => {
    setEditingBankId(bank.id);
    setBankDispName(bank.displayName || '');
    setBankOpeningBal(String(bank.openingBalance || '0'));
    setBankAsOfDate(bank.balanceDate || '');
    setBankNumber(bank.accountNumber || '');
    setBankIfsc(bank.ifscCode || '');
    setBankUpi(bank.upiId || '');
    setBankName(bank.bankName || '');
    setBankHolderName(bank.holderName || '');
    setBankPrintQr(bank.printQr || false);
    setBankPrintDetails(bank.printDetails || false);
    setBankAcceptOnline(bank.acceptOnline || false);
    setShowAddBankModal(true);
  };

  const handleOpenAddBankModal = () => {
    setEditingBankId(null);
    setBankDispName('');
    setBankOpeningBal('');
    setBankAsOfDate(new Date().toLocaleDateString('en-GB'));
    setBankNumber('');
    setBankIfsc('');
    setBankUpi('');
    setBankName('');
    setBankHolderName('');
    setBankPrintQr(false);
    setBankPrintDetails(false);
    setBankAcceptOnline(false);
    setShowAddBankModal(true);
  };
  const activeCashLogs = cashLogs.filter(l => l.businessId === activeBusiness?.id);
  const activeCheques = cheques.filter(c => c.businessId === activeBusiness?.id);
  const activeLoanAccounts = loanAccounts.filter(l => l.businessId === activeBusiness?.id);
  const activeBankAccounts = bankAccounts.filter(b => b.businessId === activeBusiness?.id);

  const [showDepMenu, setShowDepMenu] = useState(false);

  const handleSaveCashAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(cashAmount) || 0;
    if (amt <= 0) {
      alert('Enter a valid amount');
      return;
    }

    const log: CashAdjustment = {
      id: String(cashLogs.length + 1),
      businessId: activeBusiness?.id,
      type: adjustType,
      amount: amt,
      date: adjustDate,
      description: cashDescription
    };

    addCashLog(log as any);
    setShowCashModal(false);
    setCashAmount('');
    setCashDescription('');
    alert('Cash balance adjusted successfully!');
  };

  const handleSaveCheque = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(chequeAmount) || 0;
    const party = customers.filter(c => c.businessId === activeBusiness?.id).find(c => c.id === chequePartyId);
    
    if (!chequeNumber || amt <= 0) {
      alert('Please fill all mandatory cheque details correctly.');
      return;
    }

    const newCheque: Cheque = {
      id: String(cheques.length + 1),
      businessId: activeBusiness?.id,
      partyName: party ? party.name : 'Unknown Party',
      chequeNumber,
      amount: amt,
      isPostDated,
      chequeDate: isPostDated ? chequeDate : new Date().toISOString().split('T')[0],
      status: 'Pending'
    };

    addCheque(newCheque as any);
    setShowChequeModal(false);
    setChequePartyId('');
    setChequeNumber('');
    setChequeAmount('');
    setIsPostDated(false);
    alert('Cheque registered successfully! Payment status is marked as Pending.');
  };

  const handleClearCheque = (id: string) => {
    const chq = cheques.find(c => c.id === id);
    if (chq) {
      alert(`Cheque No: ${chq.chequeNumber} cleared successfully! Payment completed.`);
      deleteCheque(id).then(() => addCheque({ ...chq, status: 'Cleared' } as any));
    }
  };

  const handleDeleteCheque = (id: string) => {
    if (confirm('Are you sure you want to delete this cheque log?')) {
      deleteCheque(id);
    }
  };

  // Loan Save
  const handleSaveLoanAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const balanceVal = parseFloat(loanBalance) || 0;
    if (!loanAccName || balanceVal <= 0) {
      alert('Account Name and Current Balance are required.');
      return;
    }

    const initialTx: LoanTransaction = {
      id: '1',
      type: 'Opening Loan',
      date: loanBalanceDate,
      principal: balanceVal,
      interest: 0,
      total: balanceVal
    };

    const newLoan: LoanAccount = {
      id: String(loanAccounts.length + 1),
      businessId: activeBusiness?.id,
      name: loanAccName,
      lenderBank: loanLenderBank,
      accountNumber: loanAccNumber,
      description: loanDesc,
      currentBalance: balanceVal,
      balanceDate: loanBalanceDate,
      receivedIn: loanReceivedIn,
      interestRate: parseFloat(loanInterestRate) || 0,
      termDuration: parseInt(loanTermDuration) || 0,
      processingFee: parseFloat(loanProcessingFee) || 0,
      feePaidFrom: loanFeePaidFrom,
      transactions: [initialTx]
    };

    addLoanAccount(newLoan as any);
    setSelectedLoanId(newLoan.id);
    setShowAddLoanModal(false);
    
    // Clear states
    setLoanAccName('');
    setLoanLenderBank('');
    setLoanAccNumber('');
    setLoanDesc('');
    setLoanBalance('');
    setLoanInterestRate('');
    setLoanTermDuration('');
    setLoanProcessingFee('');
    alert('Loan Account added successfully!');
  };

  // Payment Loan
  const handleSavePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId) return;

    const princVal = parseFloat(payPrincipal) || 0;
    const intVal = parseFloat(payInterest) || 0;
    const totalVal = princVal + intVal;

    if (totalVal <= 0) {
      alert('Enter valid payment amount.');
      return;
    }

    const acc = loanAccounts.find(a => a.id === selectedLoanId);
    if (acc) {
      deleteLoanAccount(acc.id).then(() => {
        addLoanAccount({
          ...acc,
          currentBalance: acc.currentBalance - princVal,
          transactions: [...(acc.transactions || []), {
            id: Date.now().toString(),
            type: 'Payment',
            date: payDate,
            principal: princVal,
            interest: intVal,
            total: totalVal
          }]
        } as any);
      });
    }

    setShowMakePaymentModal(false);
    setPayPrincipal('');
    setPayInterest('');
    alert('Payment transaction added successfully!');
  };

  // Bank Save
  const handleSaveBankAccount = (e: React.FormEvent) => {
    e.preventDefault();
    const opBal = parseFloat(bankOpeningBal) || 0;
    if (!bankDispName) {
      alert('Account Display Name is required.');
      return;
    }

    if (editingBankId) {
      const currentBank = bankAccounts.find(b => b.id === editingBankId);
      const otherTxsSum = (currentBank?.transactions || [])
        .filter((tx: any) => tx.type !== 'Opening Balance' && tx.id !== '1')
        .reduce((sum: number, tx: any) => sum + tx.amount, 0);
      const newBalance = opBal + otherTxsSum;

      // Update the "Opening Balance" transaction in the transactions list
      const updatedTransactions = (currentBank?.transactions || []).map((tx: any) => {
        if (tx.type === 'Opening Balance' || tx.id === '1') {
          return {
            ...tx,
            amount: opBal,
            date: bankAsOfDate
          };
        }
        return tx;
      });

      const updates = {
        displayName: bankDispName,
        openingBalance: opBal,
        balanceDate: bankAsOfDate,
        accountNumber: bankNumber,
        ifscCode: bankIfsc,
        upiId: bankUpi,
        bankName,
        holderName: bankHolderName,
        printQr: bankPrintQr,
        printDetails: bankPrintDetails,
        acceptOnline: bankAcceptOnline,
        currentBalance: newBalance,
        transactions: updatedTransactions,
      };

      (updateBankAccount(editingBankId, updates) as Promise<any>)
        .then(() => {
          setShowAddBankModal(false);
          setEditingBankId(null);
          // Reset states
          setBankDispName('');
          setBankOpeningBal('');
          setBankNumber('');
          setBankIfsc('');
          setBankUpi('');
          setBankName('');
          setBankHolderName('');
          setBankPrintQr(false);
          setBankPrintDetails(false);
          setBankAcceptOnline(false);
          alert('Bank Account updated successfully!');
        })
        .catch((err) => {
          console.error(err);
          alert('Failed to update bank account: ' + (err.message || err));
        });
      return;
    }

    const initialTx: BankTransaction = {
      id: '1',
      type: 'Opening Balance',
      name: 'Opening Balance',
      date: bankAsOfDate,
      amount: opBal
    };

    const newBank: BankAccount = {
      id: String(bankAccounts.length + 1),
      businessId: activeBusiness?.id,
      displayName: bankDispName,
      openingBalance: opBal,
      balanceDate: bankAsOfDate,
      accountNumber: bankNumber,
      ifscCode: bankIfsc,
      upiId: bankUpi,
      bankName,
      holderName: bankHolderName,
      printQr: bankPrintQr,
      printDetails: bankPrintDetails,
      acceptOnline: bankAcceptOnline,
      currentBalance: opBal,
      transactions: [initialTx]
    };

    (addBankAccount(newBank as any) as Promise<any>)
      .then((inserted) => {
        if (inserted) {
          setSelectedBankId(inserted.id);
        }
        setShowAddBankModal(false);
        // Reset states
        setBankDispName('');
        setBankOpeningBal('');
        setBankNumber('');
        setBankIfsc('');
        setBankUpi('');
        setBankName('');
        setBankHolderName('');
        setBankPrintQr(false);
        setBankPrintDetails(false);
        setBankAcceptOnline(false);
        alert('Bank Account linked successfully!');
      })
      .catch((err) => {
        console.error(err);
        alert('Failed to save bank account: ' + (err.message || err));
      });
  };

  // Bank transaction save
  const handleSaveBankTx = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(bankTxAmt) || 0;
    if (amt <= 0) {
      alert('Please enter a valid amount.');
      return;
    }

    const newTxAmount = (bankTxType === 'Bank to Cash' || bankTxType === 'Bank to Bank' || (bankTxType === 'Adjustment' && bankTxAdjType === 'Reduce balance')) ? -amt : amt;

    if (editingTxId) {
      const accId = bankTxFromAcc;
      const acc = bankAccounts.find(b => b.id === accId);
      if (!acc) return;

      const originalTx = (acc.transactions || []).find((t: any) => t.id === editingTxId);
      if (!originalTx) return;

      const balanceDiff = newTxAmount - originalTx.amount;
      const updatedTx = {
        ...originalTx,
        amount: newTxAmount,
        date: bankTxDate,
        name: bankTxType === 'Bank to Bank' ? `Transfer to ${destBankName}` : (bankTxDescription || originalTx.name),
        description: bankTxDescription,
        ...(bankTxType === 'Bank to Bank' ? { destBankName, destAccountNo, destIfsc, destReceivableName } : {})
      };

      const newTransactions = (acc.transactions || []).map((t: any) => t.id === editingTxId ? updatedTx : t);

      updateBankAccount(acc.id, {
        currentBalance: acc.currentBalance + balanceDiff,
        transactions: newTransactions
      }).then(() => {
        setShowBankTxModal(false);
        setBankTxAmt('');
        setBankTxDescription('');
        setEditingTxId(null);
        setDestBankName('');
        setDestAccountNo('');
        setDestIfsc('');
        setDestReceivableName('');
        alert('Transaction updated successfully!');
      }).catch((err) => {
        alert('Failed to update transaction: ' + err.message);
      });
      return;
    }

    if (bankTxType === 'Bank to Cash') {
      if (!bankTxFromAcc) {
        alert('Please select a valid From account.');
        return;
      }
      const acc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance - amt,
          transactions: [...(acc.transactions||[]), { id: String((acc.transactions?.length||0) + 1), type: 'Bank to Cash', name: bankTxDescription || 'Withdrawal (Bank to Cash)', date: bankTxDate, amount: -amt }]
        });
      }
      addCashLog({
        type: 'Add',
        amount: amt,
        date: bankTxDate,
        description: bankTxDescription || 'Withdrawal (Bank to Cash)'
      } as any);
    } 
    else if (bankTxType === 'Cash to Bank') {
      if (!bankTxToAcc) {
        alert('Please select a valid To account.');
        return;
      }
      const acc = bankAccounts.find(b => b.id === bankTxToAcc);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + amt,
          transactions: [...(acc.transactions||[]), { id: String((acc.transactions?.length||0) + 1), type: 'Cash to Bank', name: bankTxDescription || 'Deposit (Cash to Bank)', date: bankTxDate, amount: amt }]
        });
      }
      addCashLog({
        type: 'Reduce',
        amount: amt,
        date: bankTxDate,
        description: bankTxDescription || 'Deposit (Cash to Bank)'
      } as any);
    }
    else if (bankTxType === 'Bank to Bank') {
      if (!bankTxFromAcc) {
        alert('Please select a valid From account.');
        return;
      }
      if (!destBankName) {
        alert('Please enter the destination bank name.');
        return;
      }
      const fromAcc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (fromAcc) {
        updateBankAccount(fromAcc.id, {
          currentBalance: fromAcc.currentBalance - amt,
          transactions: [
            ...(fromAcc.transactions||[]), 
            { 
              id: String((fromAcc.transactions?.length||0) + 1), 
              type: 'Bank to Bank', 
              name: `Transfer to ${destBankName}`, 
              date: bankTxDate, 
              amount: -amt,
              destBankName,
              destAccountNo,
              destIfsc,
              destReceivableName,
              description: bankTxDescription
            }
          ]
        });
      }
    }
    else if (bankTxType === 'Adjustment') {
      if (!bankTxFromAcc) {
        alert('Please select a bank account to adjust.');
        return;
      }
      const isIncrease = bankTxAdjType === 'Increase balance';
      const actualAmt = isIncrease ? amt : -amt;
      const acc = bankAccounts.find(b => b.id === bankTxFromAcc);
      if (acc) {
        updateBankAccount(acc.id, {
          currentBalance: acc.currentBalance + actualAmt,
          transactions: [...(acc.transactions||[]), { id: String((acc.transactions?.length||0) + 1), type: 'Adjustment', name: bankTxDescription || `Adjustment (${bankTxAdjType})`, date: bankTxDate, amount: actualAmt }]
        });
      }
    }

    setShowBankTxModal(false);
    setBankTxAmt('');
    setBankTxDescription('');
    setDestBankName('');
    setDestAccountNo('');
    setDestIfsc('');
    setDestReceivableName('');
    alert('Bank Transaction completed!');
  };

  const handleDeleteTransaction = (bank: BankAccount, txToDelete: any) => {
    if (!window.confirm('Are you sure you want to delete this transaction?')) return;
    
    // Reverse balance
    const newBalance = bank.currentBalance - txToDelete.amount;
    const newTransactions = (bank.transactions || []).filter((tx: any) => tx.id !== txToDelete.id);
    
    updateBankAccount(bank.id, {
      currentBalance: newBalance,
      transactions: newTransactions
    }).then(() => {
      alert('Transaction deleted successfully!');
    }).catch((err) => {
      alert('Failed to delete transaction: ' + err.message);
    });
  };

  const handleStartEditTransaction = (bank: BankAccount, tx: any) => {
    setEditingTxId(tx.id);
    setBankTxFromAcc(bank.id);
    setBankTxType(tx.type);
    setBankTxAmt(String(Math.abs(tx.amount)));
    setBankTxDate(tx.date || '');
    setBankTxDescription(tx.description || tx.name || '');
    
    if (tx.type === 'Bank to Bank') {
      setDestBankName(tx.destBankName || '');
      setDestAccountNo(tx.destAccountNo || '');
      setDestIfsc(tx.destIfsc || '');
      setDestReceivableName(tx.destReceivableName || '');
    } else {
      setDestBankName('');
      setDestAccountNo('');
      setDestIfsc('');
      setDestReceivableName('');
    }
    
    setShowBankTxModal(true);
  };

  const selectedBank = bankAccounts.find(b => b.id === selectedBankId) || activeBankAccounts[0];
  const selectedLoan = loanAccounts.find(l => l.id === selectedLoanId) || activeLoanAccounts[0];

  const filteredLoanAccounts = activeLoanAccounts.filter(l => 
    l.name.toLowerCase().includes(searchLoanQuery.toLowerCase()) || 
    l.currentBalance.toString().includes(searchLoanQuery)
  );

  const filteredBankAccounts = activeBankAccounts.filter(b => 
    b.displayName.toLowerCase().includes(searchBankQuery.toLowerCase()) || 
    b.currentBalance.toString().includes(searchBankQuery)
  );

  return (
    <div style={styles.container}>

      {/* 1. BANK ACCOUNTS MODULE */}
      {activeSection === 'bank-accounts' && (
        <div style={{ width: '100%' }}>
          
          {activeBankAccounts.length === 0 ? (
            <div style={styles.emptyContainer}>
              <h2 style={styles.emptyTextHeader}>Manage Multiple Bank Accounts</h2>
              <p style={styles.emptyTextSub}>With Vyapar you can manage multiple banks and payment types like UPI, Net Banking and Credit Card</p>
              
              <div style={styles.bankIllustrationWrapper}>
                <div style={styles.bankTempleIcon}>🏛️</div>
                <div style={styles.floatingCoins}>🪙 🪙 🪙</div>
              </div>

              <div style={styles.benefitsGrid}>
                <div style={styles.benefitCard}>
                  <div style={styles.benefitIconBox}><Printer size={16} color="#3B82F6" /></div>
                  <div>
                    <h4 style={styles.benefitTitle}>Print Bank Details on Invoices</h4>
                    <p style={styles.benefitDesc}>Print account details on invoices and get payments via NEFT/RTGS/IMPS.</p>
                  </div>
                </div>
                <div style={styles.benefitCard}>
                  <div style={styles.benefitIconBox}><Sliders size={16} color="#3B82F6" /></div>
                  <div>
                    <h4 style={styles.benefitTitle}>Unlimited Payment Types</h4>
                    <p style={styles.benefitDesc}>Record transactions by methods like Banks, UPI, Net Banking and Cards.</p>
                  </div>
                </div>
                <div style={styles.benefitCard}>
                  <div style={styles.benefitIconBox}><QrCode size={16} color="#3B82F6" /></div>
                  <div>
                    <h4 style={styles.benefitTitle}>Print UPI QR Code on Invoices</h4>
                    <p style={styles.benefitDesc}>Print QR code on your invoices or send payment links to your customers.</p>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-danger" 
                style={{ backgroundColor: '#EF4444', color: '#FFFFFF', borderRadius: '24px', padding: '10px 32px', marginTop: '24px' }}
                onClick={handleOpenAddBankModal}
              >
                + Add Bank Account
              </button>
            </div>
          ) : (
            <div style={styles.loanDashboard}>
              <div style={styles.sectionHeaderRow}>
                <h2 style={styles.sectionTitle}>Banks</h2>
                <button className="btn btn-danger" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }} onClick={handleOpenAddBankModal}>
                  + Add Bank
                </button>
              </div>

              <div style={styles.loanGridSplit}>
                <div style={styles.loanListCard}>
                  <div style={styles.searchBox}>
                    <Search size={14} color="#9CA3AF" />
                    <input 
                      type="text" 
                      placeholder="Search by Account/Amount" 
                      style={styles.searchInput}
                      value={searchBankQuery}
                      onChange={(e) => setSearchBankQuery(e.target.value)}
                    />
                  </div>

                  <table style={styles.loanTableLeft}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Account Name</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredBankAccounts.map((acc) => (
                        <tr 
                          key={acc.id} 
                          style={{
                            ...styles.loanLeftRow,
                            backgroundColor: acc.id === selectedBank?.id ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                          }}
                          onClick={() => {
                            setSelectedBankId(acc.id);
                            setBankTxFromAcc(acc.id);
                          }}
                        >
                          <td style={{ fontWeight: '600', fontSize: '13px' }}>{acc.displayName}</td>
                          <td style={{ fontWeight: '700', fontSize: '13px', textAlign: 'right' }}>₹{acc.currentBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  
                  <div style={styles.promoCard}>
                    <Smartphone size={24} color="#3B82F6" />
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '11px', color: '#1F2937', display: 'block' }}>Introducing POS Integration</strong>
                      <span style={{ fontSize: '9px', color: '#6B7280' }}>Now collect payments seamlessly using a EDC Machine</span>
                    </div>
                  </div>
                </div>

                <div style={styles.loanLedgerCard}>
                  {selectedBank ? (
                    <>
                      <div style={styles.ledgerHeader}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <h3 style={{ margin: 0, fontSize: '18px', color: '#1E293B', fontWeight: '700' }}>{selectedBank.displayName}</h3>
                            <button 
                              type="button"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#3B82F6', transition: 'color 0.2s' }}
                              onClick={() => handleStartEditBank(selectedBank)}
                              title="Edit Bank Account Details"
                            >
                              <Edit size={15} />
                            </button>
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748B', display: 'block', marginTop: '2px' }}>Bank: {selectedBank.bankName || '-'}</span>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '14px', position: 'relative' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block' }}>Balance Amount</span>
                            <strong style={{ fontSize: '15px', color: '#1F2937' }}>₹ {selectedBank.currentBalance.toFixed(2)}</strong>
                          </div>

                          <div style={{ position: 'relative' }}>
                            <button 
                              className="btn btn-danger" 
                              style={{ border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}
                              onClick={() => setShowDepMenu(!showDepMenu)}
                            >
                              <span>Deposit / Withdraw</span>
                              <ChevronDown size={12} />
                            </button>

                            {showDepMenu && (
                              <div style={styles.depDropdown}>
                                <button style={styles.depItem} onClick={() => { setEditingTxId(null); setBankTxType('Bank to Cash'); setBankTxFromAcc(selectedBank.id); setBankTxAmt(''); setBankTxDescription(''); setShowBankTxModal(true); setShowDepMenu(false); }}>Withdraw</button>
                                <button style={styles.depItem} onClick={() => { setEditingTxId(null); setBankTxType('Cash to Bank'); setBankTxToAcc(selectedBank.id); setBankTxAmt(''); setBankTxDescription(''); setShowBankTxModal(true); setShowDepMenu(false); }}>Deposit</button>
                                <button style={styles.depItem} onClick={() => { setEditingTxId(null); setBankTxType('Bank to Bank'); setBankTxFromAcc(selectedBank.id); setBankTxAmt(''); setBankTxDescription(''); setDestBankName(''); setDestAccountNo(''); setDestIfsc(''); setDestReceivableName(''); setShowBankTxModal(true); setShowDepMenu(false); }}>Bank to Bank Transfer</button>
                                <button style={styles.depItem} onClick={() => { setEditingTxId(null); setBankTxType('Adjustment'); setBankTxFromAcc(selectedBank.id); setBankTxAmt(''); setBankTxDescription(''); setShowBankTxModal(true); setShowDepMenu(false); }}>Adjust Bank Balance</button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {(() => {
                        const parseDate = (dateStr: string) => {
                          if (!dateStr) return new Date(0);
                          const parts = dateStr.split('/');
                          if (parts.length === 3) {
                            const day = parseInt(parts[0], 10);
                            const month = parseInt(parts[1], 10) - 1;
                            const year = parseInt(parts[2], 10);
                            return new Date(year, month, day);
                          }
                          const d = new Date(dateStr);
                          return isNaN(d.getTime()) ? new Date(0) : d;
                        };
                        const sortedTxs = [...(selectedBank.transactions || [])].sort((a: any, b: any) => {
                          return parseDate(a.date).getTime() - parseDate(b.date).getTime();
                        });
                        let currentRunningBal = 0;
                        const txsWithRunningBalance = sortedTxs.map((tx: any) => {
                          currentRunningBal += tx.amount;
                          return {
                            ...tx,
                            runningBalance: currentRunningBal
                          };
                        });

                        return (
                          <div style={{ marginTop: '20px' }}>
                            <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>Transactions</h4>
                            <table style={styles.ledgerTable}>
                              <thead>
                                <tr>
                                  <th style={{ textAlign: 'center' }}>Date</th>
                                  <th style={{ textAlign: 'left' }}>Type</th>
                                  <th style={{ textAlign: 'left' }}>Details</th>
                                  <th style={{ textAlign: 'right' }}>Deposit (+)</th>
                                  <th style={{ textAlign: 'right' }}>Withdrawal (-)</th>
                                  <th style={{ textAlign: 'right' }}>Balance</th>
                                  <th style={{ textAlign: 'right', width: '80px' }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {txsWithRunningBalance.map((tx: any) => {
                                  const isDeposit = tx.amount >= 0;
                                  return (
                                    <tr key={tx.id}>
                                      <td style={{ textAlign: 'center' }}>{formatDateDDMMYYYY(tx.date)}</td>
                                      <td style={{ fontWeight: '600' }}>{tx.type}</td>
                                      <td>
                                        <div>{tx.name}</div>
                                        {tx.destBankName && (
                                          <div style={{ fontSize: '10.5px', color: '#6B7280', marginTop: '2px', backgroundColor: '#F8FAFC', padding: '4px 8px', borderRadius: '4px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <div>🏦 Destination: <strong>{tx.destBankName}</strong></div>
                                            {tx.destReceivableName && <div>👤 Receivable Name: <strong>{tx.destReceivableName}</strong></div>}
                                            <div>A/C: <strong>{tx.destAccountNo || '-'}</strong> | IFSC: <strong>{tx.destIfsc || '-'}</strong></div>
                                          </div>
                                        )}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#10B981' }}>
                                        {isDeposit ? `₹${tx.amount.toFixed(2)}` : '-'}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#EF4444' }}>
                                        {!isDeposit ? `₹${Math.abs(tx.amount).toFixed(2)}` : '-'}
                                      </td>
                                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#1F2937' }}>
                                        ₹{tx.runningBalance.toFixed(2)}
                                      </td>
                                      <td style={{ textAlign: 'right' }}>
                                        {tx.type !== 'Opening Balance' && (
                                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                                            <button 
                                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#3B82F6' }}
                                              onClick={() => handleStartEditTransaction(selectedBank, tx)}
                                              title="Edit Transaction"
                                            >
                                              <Edit size={14} />
                                            </button>
                                            <button 
                                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#EF4444' }}
                                              onClick={() => handleDeleteTransaction(selectedBank, tx)}
                                              title="Delete Transaction"
                                            >
                                              <Trash2 size={14} />
                                            </button>
                                          </div>
                                        )}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                      Select a Bank Account from the list to view transactions.
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      )}

      {/* 2. CASH IN HAND */}
      {activeSection === 'cash-in-hand' && (
        <div style={{ width: '100%' }}>
          <div style={styles.sectionHeaderRow}>
            <div>
              <h2 style={styles.sectionTitle}>Cash In Hand</h2>
              <p style={{ fontSize: '13px', color: '#6B7280', marginTop: '4px' }}>
                Current Balance: <strong style={{ color: '#10B981', fontSize: '14.5px' }}>₹ {cashBalance.toFixed(2)}</strong>
              </p>
            </div>
            <button className="btn btn-danger" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }} onClick={() => setShowCashModal(true)}>
              Adjust Cash
            </button>
          </div>

          {activeCashLogs.length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.iconCircleGreen}>
                <Coins size={48} color="#10B981" />
              </div>
              <p style={styles.emptyText}>
                Whenever you choose payment type as cash in your invoices, that amount will be reflected in cash in hand.
              </p>
              <button 
                className="btn btn-danger" 
                style={{ backgroundColor: '#EF4444', color: '#FFFFFF', borderRadius: '20px', padding: '10px 24px' }}
                onClick={() => setShowCashModal(true)}
              >
                Adjust Cash
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Type</th>
                    <th>Adjusted Amount (₹)</th>
                    <th>Description</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCashLogs.map((log) => (
                    <tr key={log.id}>
                      <td>{formatDateDDMMYYYY(log.date)}</td>
                      <td style={{ fontWeight: '700', color: log.type === 'Add' ? '#10B981' : '#EF4444' }}>
                        {log.type === 'Add' ? 'Added Cash' : 'Reduced Cash'}
                      </td>
                      <td style={{ fontWeight: '700' }}>₹{log.amount.toFixed(2)}</td>
                      <td>{log.description || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 3. CHEQUES SECTION */}
      {activeSection === 'cheques' && (
        <div style={{ width: '100%' }}>
          <div style={styles.sectionHeaderRow}>
            <h2 style={styles.sectionTitle}>Cheque Details</h2>
            <button className="btn btn-primary" onClick={() => setShowChequeModal(true)}>
              + Add Cheque Transaction
            </button>
          </div>

          {activeCheques.length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.iconCircleBlue}>
                <FileCheck2 size={48} color="#3B82F6" />
              </div>
              <p style={styles.emptyTextHeader}>No Cheques to Show</p>
              <p style={styles.emptyTextSub}>You haven't added any Cheque transactions yet.</p>
              <button 
                className="btn btn-primary" 
                onClick={() => setShowChequeModal(true)}
              >
                Add Cheque
              </button>
            </div>
          ) : (
            <div className="table-wrapper">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Cheque Number</th>
                    <th>Party Name</th>
                    <th>Cheque Date</th>
                    <th>Type</th>
                    <th>Amount (₹)</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {activeCheques.map((c) => (
                    <tr key={c.id}>
                      <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{c.chequeNumber}</td>
                      <td style={{ fontWeight: '600' }}>{c.partyName}</td>
                      <td>{formatDateDDMMYYYY(c.chequeDate)}</td>
                      <td>
                        <span className={`badge ${c.isPostDated ? 'badge-warning' : 'badge-success'}`}>
                          {c.isPostDated ? 'Post-Dated' : 'Regular'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>₹{c.amount.toFixed(2)}</td>
                      <td>
                        <span style={{ 
                          display: 'inline-flex', 
                          alignItems: 'center', 
                          gap: '4px',
                          color: c.status === 'Cleared' ? '#10B981' : '#F59E0B',
                          fontWeight: '700',
                          fontSize: '12px'
                        }}>
                          {c.status === 'Cleared' ? (
                            <CheckCircle size={14} />
                          ) : (
                            <Clock size={14} />
                          )}
                          {c.status}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          {c.status === 'Pending' && (
                            <button 
                              className="btn btn-success" 
                              style={{ padding: '4px 10px', fontSize: '11px', gap: '4px' }}
                              onClick={() => handleClearCheque(c.id)}
                              title="Clear Cheque"
                            >
                              <CheckCircle size={11} />
                              <span>Pass Cheque</span>
                            </button>
                          )}
                          <button 
                            style={styles.trashBtn}
                            onClick={() => handleDeleteCheque(c.id)}
                            title="Delete Log"
                          >
                            <Trash2 size={12} color="#EF4444" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* 4. LOAN ACCOUNTS */}
      {activeSection === 'loan-accounts' && (
        <div style={{ width: '100%' }}>
          
          {activeLoanAccounts.length === 0 ? (
            <div style={styles.emptyContainer}>
              <h2 style={styles.emptyTextHeader}>Manage Your Loan Accounts</h2>
              <p style={styles.emptyTextSub}>Add your loan accounts and check all loan transactions at one place</p>
              
              <div style={styles.bankIllustrationWrapper}>
                <div style={styles.bankTempleIcon}>🏛️</div>
                <div style={styles.floatingCoins}>🪙 🪙 🪙</div>
              </div>

              <div style={styles.benefitsGrid}>
                <div style={styles.benefitCard}>
                  <div style={styles.benefitIconBox}><Building size={16} color="#3B82F6" /></div>
                  <div>
                    <h4 style={styles.benefitTitle}>All Loans, One Dashboard</h4>
                    <p style={styles.benefitDesc}>Easily track business loans kept separate from the daily transactions</p>
                  </div>
                </div>
                <div style={styles.benefitCard}>
                  <div style={styles.benefitIconBox}><Sliders size={16} color="#3B82F6" /></div>
                  <div>
                    <h4 style={styles.benefitTitle}>Auto EMI Calculation</h4>
                    <p style={styles.benefitDesc}>Add loan details and the system instantly breaks it down into EMIs</p>
                  </div>
                </div>
                <div style={styles.benefitCard}>
                  <div style={styles.benefitIconBox}><DollarSign size={16} color="#3B82F6" /></div>
                  <div>
                    <h4 style={styles.benefitTitle}>Manual Flexibility</h4>
                    <p style={styles.benefitDesc}>Add notes, interest details etc. Keeps it flexible for varied use cases</p>
                  </div>
                </div>
              </div>

              <button 
                className="btn btn-danger" 
                style={{ backgroundColor: '#EF4444', color: '#FFFFFF', borderRadius: '24px', padding: '10px 32px', marginTop: '24px' }}
                onClick={() => setShowAddLoanModal(true)}
              >
                + Add Loan Account
              </button>
            </div>
          ) : (
            <div style={styles.loanDashboard}>
              <div style={styles.sectionHeaderRow}>
                <h2 style={styles.sectionTitle}>Loan Accounts</h2>
                <button className="btn btn-danger" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }} onClick={() => setShowAddLoanModal(true)}>
                  + Add Loan Account
                </button>
              </div>

              <div style={styles.loanGridSplit}>
                <div style={styles.loanListCard}>
                  <div style={styles.searchBox}>
                    <Search size={14} color="#9CA3AF" />
                    <input 
                      type="text" 
                      placeholder="Search by Account/Amount" 
                      style={styles.searchInput}
                      value={searchLoanQuery}
                      onChange={(e) => setSearchLoanQuery(e.target.value)}
                    />
                  </div>

                  <table style={styles.loanTableLeft}>
                    <thead>
                      <tr>
                        <th style={{ textAlign: 'left' }}>Account Name</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredLoanAccounts.map((acc) => (
                        <tr 
                          key={acc.id} 
                          style={{
                            ...styles.loanLeftRow,
                            backgroundColor: acc.id === selectedLoanId ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                          }}
                          onClick={() => setSelectedLoanId(acc.id)}
                        >
                          <td style={{ fontWeight: '600', fontSize: '13px' }}>{acc.name}</td>
                          <td style={{ fontWeight: '700', fontSize: '13px', textAlign: 'right' }}>₹{acc.currentBalance.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div style={styles.loanLedgerCard}>
                  {selectedLoan ? (
                    <>
                      <div style={styles.ledgerHeader}>
                        <div>
                          <h3 style={{ margin: 0, fontSize: '18px', color: '#1F2937' }}>{selectedLoan.name}</h3>
                          <span style={{ fontSize: '11px', color: '#9CA3AF' }}>Lender: {selectedLoan.lenderBank || '-'}</span>
                        </div>

                        <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '14px' }}>
                          <div>
                            <span style={{ fontSize: '11px', color: '#9CA3AF', display: 'block' }}>Balance Amount</span>
                            <strong style={{ fontSize: '15px', color: '#1F2937' }}>₹ {selectedLoan.currentBalance.toFixed(2)}</strong>
                          </div>
                          
                          <button 
                            className="btn btn-danger" 
                            style={{ border: '1.5px solid #EF4444', background: 'none', color: '#EF4444', fontSize: '12px' }}
                            onClick={() => setShowMakePaymentModal(true)}
                          >
                            Make Payment
                          </button>
                        </div>
                      </div>

                      <div style={{ marginTop: '20px' }}>
                        <h4 style={{ fontSize: '13px', fontWeight: '700', color: '#374151', marginBottom: '10px' }}>Transactions</h4>
                        <table style={styles.ledgerTable}>
                          <thead>
                            <tr>
                              <th style={{ textAlign: 'left' }}>Type</th>
                              <th style={{ textAlign: 'center' }}>Date</th>
                              <th style={{ textAlign: 'right' }}>Principal</th>
                              <th style={{ textAlign: 'right' }}>Interest & Other Charges</th>
                              <th style={{ textAlign: 'right' }}>Total Amount</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedLoan.transactions.map((tx: any) => (
                              <tr key={tx.id}>
                                <td style={{ fontWeight: '600' }}>{tx.type}</td>
                                <td style={{ textAlign: 'center' }}>{formatDateDDMMYYYY(tx.date)}</td>
                                <td style={{ textAlign: 'right' }}>₹{tx.principal.toFixed(2)}</td>
                                <td style={{ textAlign: 'right' }}>₹{tx.interest.toFixed(2)}</td>
                                <td style={{ textAlign: 'right', fontWeight: '700' }}>₹{tx.total.toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  ) : (
                    <div style={{ padding: '40px', textAlign: 'center', color: '#9CA3AF' }}>
                      Select a Loan Account from the sidebar to view transactions.
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      )}

      {/* A. ADJUST CASH MODAL */}
      {showCashModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.adjustCashModal}>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>Adjust Cash</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowCashModal(false)} />
            </div>

            <form onSubmit={handleSaveCashAdjustment} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '20px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#374151' }}>
                  <input type="radio" name="adjustType" checked={adjustType === 'Add'} onChange={() => setAdjustType('Add')} />
                  <span>Add Cash</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13.5px', color: '#374151' }}>
                  <input type="radio" name="adjustType" checked={adjustType === 'Reduce'} onChange={() => setAdjustType('Reduce')} />
                  <span>Reduce Cash</span>
                </label>
              </div>

              <div className="form-group">
                <label style={styles.fieldLabel}>Enter Amount *</label>
                <div style={{ position: 'relative' }}>
                  <span style={styles.prefixSymbol}>₹</span>
                  <input type="number" className="form-control" style={styles.adjustInput} placeholder="0" value={cashAmount} onChange={(e) => setCashAmount(e.target.value)} required />
                </div>
              </div>

              <div style={{ fontSize: '12px', color: '#6B7280' }}>
                Updated Cash: <strong>₹ {
                  adjustType === 'Add' ? (cashBalance + (parseFloat(cashAmount) || 0)).toFixed(2) : (cashBalance - (parseFloat(cashAmount) || 0)).toFixed(2)
                }</strong>
              </div>

              <div className="form-group">
                <label style={styles.fieldLabel}>Adjustment Date</label>
                <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={adjustDate} onChange={(e) => setAdjustDate(e.target.value)} />
              </div>

              <div className="form-group">
                <label style={styles.fieldLabel}>Description</label>
                <textarea className="form-control" style={{ ...styles.modalInput, height: '70px', resize: 'none' }} placeholder="Enter Description" value={cashDescription} onChange={(e) => setCashDescription(e.target.value)} />
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCashModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* B. ADD CHEQUE FORM MODAL */}
      {showChequeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.adjustCashModal}>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>Add Cheque Transaction</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowChequeModal(false)} />
            </div>

            <form onSubmit={handleSaveCheque} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={styles.fieldLabel}>Party Name *</label>
                <select className="form-control" style={styles.modalSelect} value={chequePartyId} onChange={(e) => setChequePartyId(e.target.value)} required>
                  <option value="">Select Party</option>
                  {customers.filter(c => c.businessId === activeBusiness?.id).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label style={styles.fieldLabel}>Cheque Number *</label>
                <input type="text" className="form-control" style={styles.modalInput} placeholder="Enter Cheque Number" value={chequeNumber} onChange={(e) => setChequeNumber(e.target.value)} required />
              </div>
              <div className="form-group">
                <label style={styles.fieldLabel}>Amount (₹) *</label>
                <input type="number" className="form-control" style={styles.modalInput} placeholder="0.00" value={chequeAmount} onChange={(e) => setChequeAmount(e.target.value)} required />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                <span style={{ fontSize: '13px', fontWeight: '600', color: '#374151' }}>Is Post-Dated Cheque?</span>
                <input type="checkbox" checked={isPostDated} onChange={(e) => setIsPostDated(e.target.checked)} style={{ width: '16px', height: '16px' }} />
              </div>
              {isPostDated && (
                <div className="form-group">
                  <label style={styles.fieldLabel}>Cheque Date (Post Date)</label>
                  <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={chequeDate} onChange={(e) => setChequeDate(e.target.value)} />
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', color: '#F59E0B' }}>
                    <AlertCircle size={12} /><span style={{ fontSize: '11px' }}>Payment stays marked as Pending until cleared.</span>
                  </div>
                </div>
              )}
              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowChequeModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* C. ADD LOAN ACCOUNT MODAL */}
      {showAddLoanModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.loanModalContent}>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>Add Loan Account</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowAddLoanModal(false)} />
            </div>

            <form onSubmit={handleSaveLoanAccount} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Account Name *</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Account Name" value={loanAccName} onChange={(e) => setLoanAccName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Lender Bank</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Lender Bank" value={loanLenderBank} onChange={(e) => setLoanLenderBank(e.target.value)} />
                </div>
              </div>
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Account Number</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Account Number" value={loanAccNumber} onChange={(e) => setLoanAccNumber(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Description</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Description" value={loanDesc} onChange={(e) => setLoanDesc(e.target.value)} />
                </div>
              </div>
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Current Balance *</label>
                  <input type="number" className="form-control" style={styles.modalInput} placeholder="₹ 0" value={loanBalance} onChange={(e) => setLoanBalance(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Balance as of</label>
                  <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={loanBalanceDate} onChange={(e) => setLoanBalanceDate(e.target.value)} />
                </div>
              </div>
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Loan received In</label>
                  <select className="form-control" style={styles.modalSelect} value={loanReceivedIn} onChange={(e) => setLoanReceivedIn(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
                <div style={{ flex: 1 }} />
              </div>
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Interest Rate (% per annum)</label>
                  <input type="number" className="form-control" style={styles.modalInput} placeholder="Interest Rate" value={loanInterestRate} onChange={(e) => setLoanInterestRate(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Term Duration(in Months)</label>
                  <input type="number" className="form-control" style={styles.modalInput} placeholder="Term Duration" value={loanTermDuration} onChange={(e) => setLoanTermDuration(e.target.value)} />
                </div>
              </div>
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Processing Fee</label>
                  <input type="number" className="form-control" style={styles.modalInput} placeholder="Processing Fee" value={loanProcessingFee} onChange={(e) => setLoanProcessingFee(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Processing Fee Paid from</label>
                  <select className="form-control" style={styles.modalSelect} value={loanFeePaidFrom} onChange={(e) => setLoanFeePaidFrom(e.target.value)}>
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank</option>
                  </select>
                </div>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddLoanModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ backgroundColor: '#3B82F6' }}>SAVE</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* D. MAKE PAYMENT MODAL */}
      {showMakePaymentModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.adjustCashModal}>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>Make Payment</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowMakePaymentModal(false)} />
            </div>

            <form onSubmit={handleSavePayment} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={styles.fieldLabel}>Principal Amount</label>
                <input type="number" className="form-control" style={styles.modalInput} value={payPrincipal} onChange={(e) => setPayPrincipal(e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label style={styles.fieldLabel}>Interest Amount</label>
                <input type="number" className="form-control" style={styles.modalInput} value={payInterest} onChange={(e) => setPayInterest(e.target.value)} placeholder="0" />
              </div>
              <div className="form-group">
                <label style={styles.fieldLabel}>Total Amount</label>
                <input type="text" className="form-control" style={{ ...styles.modalInput, backgroundColor: '#F3F4F6', color: '#9CA3AF' }} value={(parseFloat(payPrincipal) || 0) + (parseFloat(payInterest) || 0)} disabled />
              </div>
              <div className="form-group">
                <label style={styles.fieldLabel}>Date</label>
                <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={payDate} onChange={(e) => setPayDate(e.target.value)} />
              </div>
              <div className="form-group">
                <label style={styles.fieldLabel}>Paid From</label>
                <select className="form-control" style={styles.modalSelect} value={payPaidFrom} onChange={(e) => setPayPaidFrom(e.target.value)}>
                  <option value="Cash">Cash</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>
              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowMakePaymentModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* E. ADD BANK ACCOUNT MODAL */}
      {showAddBankModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.bankModalContent}>
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>{editingBankId ? 'Edit Bank Account' : 'Add Bank Account'}</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowAddBankModal(false)} />
            </div>

            <form onSubmit={handleSaveBankAccount} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Account Display Name *</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Display Name" value={bankDispName} onChange={(e) => setBankDispName(e.target.value)} required />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Opening Balance</label>
                  <input type="number" className="form-control" style={styles.modalInput} placeholder="Opening Balance" value={bankOpeningBal} onChange={(e) => setBankOpeningBal(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>As of Date</label>
                  <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={bankAsOfDate} onChange={(e) => setBankAsOfDate(e.target.value)} />
                </div>
              </div>

              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Account Number</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Account Number" value={bankNumber} onChange={(e) => setBankNumber(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>IFSC Code</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="IFSC Code" value={bankIfsc} onChange={(e) => setBankIfsc(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>UPI ID for QR Code</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="UPI ID" value={bankUpi} onChange={(e) => setBankUpi(e.target.value)} />
                </div>
              </div>

              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Bank Name</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Bank Name" value={bankName} onChange={(e) => setBankName(e.target.value)} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Account Holder Name</label>
                  <input type="text" className="form-control" style={styles.modalInput} placeholder="Holder Name" value={bankHolderName} onChange={(e) => setBankHolderName(e.target.value)} />
                </div>
                <div style={{ flex: 1 }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input type="checkbox" checked={bankPrintQr} onChange={(e) => setBankPrintQr(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span>Print offline UPI QR on Invoices (Only UPI, No automatic reconciliation)</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input type="checkbox" checked={bankPrintDetails} onChange={(e) => setBankPrintDetails(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span>Print Bank Details on Invoices</span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '13px', color: '#374151' }}>
                  <input type="checkbox" checked={bankAcceptOnline} onChange={(e) => setBankAcceptOnline(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                  <span>Accept Payments Online</span>
                </label>
              </div>

              <div style={styles.bankMessageBox}>
                <AlertCircle size={16} color="#4B5563" />
                <span style={{ fontSize: '12px', color: '#4B5563' }}>Accept UPI, debit cards, credit cards, and net banking to boost revenue and reconcile incoming payments with invoices directly</span>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowAddBankModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>Save Details</button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* F. DEPOSIT / WITHDRAWAL MODAL (Screenshots 1, 2, 3, 4) */}
      {showBankTxModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.bankTxModalContent}>
            
            {/* Dynamic Modal Headers */}
            <div style={styles.modalHeader}>
              <span style={{ fontSize: '16px', fontWeight: '700', color: '#1F2937' }}>
                {bankTxType === 'Bank to Cash' && 'Bank To Cash Transfer'}
                {bankTxType === 'Cash to Bank' && 'Cash To Bank Transfer'}
                {bankTxType === 'Bank to Bank' && 'Bank To Bank Transfer'}
                {bankTxType === 'Adjustment' && 'Bank Adjustment Entry'}
              </span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowBankTxModal(false)} />
            </div>

            <form onSubmit={handleSaveBankTx} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
              
              {/* LAYOUT A: Bank to Cash */}
              {bankTxType === 'Bank to Cash' && (
                <div style={styles.modalFormRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>From:</label>
                    <select className="form-control" style={styles.modalSelect} value={bankTxFromAcc} onChange={(e) => setBankTxFromAcc(e.target.value)} required>
                      <option value="">Select Source Bank</option>
                      {activeBankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>To:</label>
                    <input type="text" className="form-control" style={{ ...styles.modalInput, backgroundColor: '#F3F4F6' }} value="Cash" disabled />
                  </div>
                </div>
              )}

              {/* LAYOUT B: Cash to Bank */}
              {bankTxType === 'Cash to Bank' && (
                <div style={styles.modalFormRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>From:</label>
                    <input type="text" className="form-control" style={{ ...styles.modalInput, backgroundColor: '#F3F4F6' }} value="Cash" disabled />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>To:</label>
                    <select className="form-control" style={styles.modalSelect} value={bankTxToAcc} onChange={(e) => setBankTxToAcc(e.target.value)} required>
                      <option value="">Select Destination Bank</option>
                      {activeBankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.displayName}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* LAYOUT C: Bank to Bank */}
              {bankTxType === 'Bank to Bank' && (
                <>
                  <div style={styles.modalFormRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={styles.fieldLabel}>From (Source Bank):</label>
                      <select className="form-control" style={styles.modalSelect} value={bankTxFromAcc} onChange={(e) => setBankTxFromAcc(e.target.value)} required>
                        <option value="">Select Source Bank</option>
                        {activeBankAccounts.map(b => (
                          <option key={b.id} value={b.id}>{b.displayName}</option>
                        ))}
                      </select>
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={styles.fieldLabel}>To (Destination Bank Name):</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter Destination Bank Name" 
                        style={styles.modalInput} 
                        value={destBankName} 
                        onChange={(e) => setDestBankName(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  <div style={styles.modalFormRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={styles.fieldLabel}>Destination Account Number:</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter Account Number" 
                        style={styles.modalInput} 
                        value={destAccountNo} 
                        onChange={(e) => setDestAccountNo(e.target.value)} 
                      />
                    </div>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={styles.fieldLabel}>Destination IFSC Code:</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter IFSC Code" 
                        style={styles.modalInput} 
                        value={destIfsc} 
                        onChange={(e) => setDestIfsc(e.target.value)} 
                      />
                    </div>
                  </div>
                  <div style={styles.modalFormRow}>
                    <div className="form-group" style={{ flex: 1 }}>
                      <label style={styles.fieldLabel}>Receivable Name (Account Holder Name) *:</label>
                      <input 
                        type="text" 
                        className="form-control" 
                        placeholder="Enter Receivable Name" 
                        style={styles.modalInput} 
                        value={destReceivableName} 
                        onChange={(e) => setDestReceivableName(e.target.value)} 
                        required
                      />
                    </div>
                    <div style={{ flex: 1 }} />
                  </div>
                </>
              )}

              {/* LAYOUT D: Bank Adjustment */}
              {bankTxType === 'Adjustment' && (
                <div style={styles.modalFormRow}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Account Name</label>
                    <select className="form-control" style={styles.modalSelect} value={bankTxFromAcc} onChange={(e) => setBankTxFromAcc(e.target.value)} required>
                      <option value="">Select Bank Account</option>
                      {activeBankAccounts.map(b => (
                        <option key={b.id} value={b.id}>{b.displayName}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Type</label>
                    <select className="form-control" style={styles.modalSelect} value={bankTxAdjType} onChange={(e) => setBankTxAdjType(e.target.value as any)}>
                      <option value="Increase balance">Increase balance</option>
                      <option value="Reduce balance">Reduce balance</option>
                    </select>
                  </div>
                </div>
              )}

              {/* General Bottom Fields: Amount, Date, Description, Image Upload */}
              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Amount</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    style={styles.modalInput} 
                    value={bankTxAmt} 
                    onChange={(e) => setBankTxAmt(e.target.value)} 
                    placeholder="0"
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Adjustment Date</label>
                  <input 
                    type="text" 
                    placeholder="DD/MM/YYYY"
                    className="form-control" 
                    style={styles.modalInput} 
                    value={bankTxDate} 
                    onChange={(e) => setBankTxDate(e.target.value)} 
                  />
                </div>
              </div>

              <div style={styles.modalFormRow}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Description</label>
                  <textarea 
                    className="form-control" 
                    style={{ ...styles.modalInput, height: '70px', resize: 'none' }} 
                    placeholder="Add description" 
                    value={bankTxDescription}
                    onChange={(e) => setBankTxDescription(e.target.value)}
                  />
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Image</label>
                  <div style={styles.uploadImageBorder} onClick={() => alert('Image capture placeholder')}>
                    <Upload size={16} color="#3B82F6" />
                    <span style={{ fontSize: '12px', color: '#3B82F6', fontWeight: '600' }}>Add Image</span>
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowBankTxModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-danger" style={{ backgroundColor: '#EF4444', color: '#FFFFFF' }}>Save</button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
  },
  sectionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1.5px solid #F0F4F8',
    marginTop: '20px',
    width: '100%',
  },
  iconCircleGreen: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  iconCircleBlue: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6B7280',
    maxWidth: '440px',
    lineHeight: '1.6',
    marginBottom: '24px',
  },
  emptyTextHeader: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: '8px',
  },
  emptyTextSub: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '20px',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  adjustCashModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '380px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  loanModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '640px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  bankModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '840px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  bankTxModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '620px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: '6px',
    display: 'block',
  },
  prefixSymbol: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '13.5px',
    color: '#374151',
    fontWeight: '600',
  },
  adjustInput: {
    padding: '10px 12px 10px 28px',
    border: '1.5px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '13.5px',
    color: '#374151',
    width: '100%',
    outline: 'none',
  },
  modalInput: {
    padding: '8px 12px',
    border: '1.5px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '12.5px',
    color: '#374151',
    width: '100%',
    outline: 'none',
  },
  modalSelect: {
    padding: '8px 12px',
    border: '1.5px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '12.5px',
    color: '#374151',
    width: '100%',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #E5E7EB',
    paddingTop: '14px',
    marginTop: '10px',
  },
  trashBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  bankIllustrationWrapper: {
    position: 'relative' as const,
    margin: '20px 0',
  },
  bankTempleIcon: {
    fontSize: '72px',
  },
  floatingCoins: {
    position: 'absolute' as const,
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    fontSize: '18px',
    letterSpacing: '10px',
  },
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
    marginTop: '20px',
    width: '100%',
    maxWidth: '860px',
  },
  benefitCard: {
    backgroundColor: '#FAFBFD',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '16px',
    display: 'flex',
    gap: '12px',
    alignItems: 'flex-start',
    textAlign: 'left' as const,
  },
  benefitIconBox: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#EFF6FF',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  benefitTitle: {
    margin: 0,
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#1F2937',
  },
  benefitDesc: {
    margin: '4px 0 0 0',
    fontSize: '11px',
    color: '#6B7280',
    lineHeight: '1.4',
  },
  modalFormRow: {
    display: 'flex',
    gap: '16px',
  },
  loanDashboard: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  loanGridSplit: {
    display: 'grid',
    gridTemplateColumns: '260px 1fr',
    gap: '20px',
    marginTop: '10px',
  },
  loanListCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1.5px solid #F0F4F8',
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    minHeight: '400px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '6px 10px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    width: '100%',
  },
  loanTableLeft: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  loanLeftRow: {
    cursor: 'pointer',
    borderBottom: '1px solid #F3F4F6',
    transition: 'background 0.2s',
  },
  loanLedgerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1.5px solid #F0F4F8',
    padding: '20px',
    minHeight: '400px',
  },
  ledgerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '16px',
  },
  ledgerTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  bankMessageBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: '6px',
    padding: '10px 14px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginTop: '10px',
  },
  promoCard: {
    marginTop: 'auto',
    backgroundColor: '#EFF6FF',
    borderRadius: '8px',
    border: '1px solid #BFDBFE',
    padding: '10px 12px',
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  depDropdown: {
    position: 'absolute' as const,
    top: '36px',
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
    border: '1px solid #E5E7EB',
    width: '180px',
    zIndex: 1000,
    display: 'flex',
    flexDirection: 'column',
    padding: '6px 0',
  },
  depItem: {
    border: 'none',
    background: 'none',
    padding: '8px 16px',
    fontSize: '12px',
    color: '#374151',
    textAlign: 'left' as const,
    width: '100%',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  uploadImageBorder: {
    border: '1.5px dashed #D1D5DB',
    borderRadius: '6px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    cursor: 'pointer',
    gap: '8px',
    height: '70px',
  }
};
