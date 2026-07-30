import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../utils/supabaseClient';

export interface Business {
  id: string;
  name: string;
  logo: string;
  gst: string;
  pan: string;
  type: string;
  address: string;
  phone: string;
  email: string;
  invoicePrefix: string;
  financialYear: string;
  currency: string;
  taxPreference: string;
  category?: string;
  state?: string;
  pincode?: string;
  booksBeginningDate?: string;
  signature?: string;
}

export interface Customer {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  gst: string;
  address: string;
  email: string;
}

export interface Product {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  purchasePrice: number;
  sellingPrice: number;
  gst: number; // percentage, e.g. 18
  unit: string;
  stock: number;
  minStock: number;
  image?: string;
}

export interface TransactionProduct {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  gst: number;
  total: number;
  unit?: string;
  hsn?: string;
  discountPercentage?: number;
}

export interface Transaction {
  id: string;
  businessId: string;
  type: string;
  invoiceNo: string;
  date: string;
  contactName: string;
  contactPhone?: string;
  contactGst?: string;
  contactAddress?: string;
  products: TransactionProduct[];
  discount: number;
  gstAmount: number;
  totalAmount: number;
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending' | 'Paid by Cash' | 'Paid by Cheque' | string;
  paymentType?: string;
  paymentDate?: string;
  chequeNo?: string;
  bankName?: string;
  ifscCode?: string;
  receivedAmount?: number;
  balanceAmount?: number;
  createdAt?: string;
}

export interface StockHistory {
  id: string;
  businessId: string;
  productId: string;
  productName: string;
  type: 'sale' | 'purchase' | 'manual';
  quantityChange: number; // negative for sales, positive for purchases
  date: string;
  referenceNo: string;
}


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
  transactions: any[];
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
  transactions: any[];
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

interface AppContextProps {
  businesses: Business[];
  currentBusinessId: string;
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  stockHistory: StockHistory[];
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

  activeBusiness: Business | null;
  user: any;
  authLoading: boolean;
  dataLoading: boolean;
  signOut: () => Promise<void>;
  addBusiness: (business: Omit<Business, 'id'>) => Promise<Business>;
  updateBusiness: (business: Business) => Promise<void>;
  switchBusiness: (id: string) => void;
  addCustomer: (customer: Omit<Customer, 'id' | 'businessId'>) => Promise<void>;
  updateCustomer: (customer: Customer) => Promise<void>;
  deleteCustomer: (id: string) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'businessId'>) => Promise<void>;
  updateProduct: (product: Product) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  createSaleInvoice: (invoice: Omit<Transaction, 'id' | 'businessId' | 'type'>) => Promise<void>;
  updateSaleInvoice: (id: string, invoice: Omit<Transaction, 'id' | 'businessId' | 'type'>) => Promise<void>;
  createPurchaseEntry: (purchase: Omit<Transaction, 'id' | 'businessId' | 'type'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'businessId'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;
  deleteStockHistory: (id: string) => Promise<void>;
  globalSearch: (query: string) => {
    products: Product[];
    customers: Customer[];
    transactions: Transaction[];
  };
}

const typeUIMap: Record<string, string> = {
  'sale': 'sale',
  'purchase': 'Purchase',
  'expense': 'Expense',
  'payment_in': 'Payment In',
  'payment_out': 'Payment Out',
  'estimate': 'Estimate',
  'proforma': 'Proforma Invoice',
  'delivery_challan': 'Delivery Challan',
  'sale_order': 'Sale Order',
  'sale_return': 'Sale Return',
  'purchase_order': 'Purchase Order',
  'debit_note': 'Debit Note'
};

const typeDBMap: Record<string, string> = {
  'sale': 'sale',
  'Purchase': 'purchase',
  'Expense': 'expense',
  'Payment In': 'payment_in',
  'Payment Out': 'payment_out',
  'Estimate': 'estimate',
  'Proforma Invoice': 'proforma',
  'Delivery Challan': 'delivery_challan',
  'Sale Order': 'sale_order',
  'Sale Return': 'sale_return',
  'Purchase Order': 'purchase_order',
  'Debit Note': 'debit_note',
  'Estimate/Quotation': 'estimate',
  'Sale Return/ Credit Note': 'sale_return',
  'Debit Note (Purchase Return)': 'debit_note'
};

const toUIDbType = (type: string): string => {
  return typeDBMap[type] || type.toLowerCase();
};

const toUIFrontendType = (type: string): string => {
  return typeUIMap[type] || type;
};

const toISODate = (dateStr: string | null | undefined): string | null => {
  if (!dateStr) return null;
  const str = dateStr.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;
  
  // DD-MM-YYYY
  let parts = str.split('-');
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  // DD/MM/YYYY
  parts = str.split('/');
  if (parts.length === 3) {
    if (parts[2].length === 4) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  
  return str;
};

const AppContext = createContext<AppContextProps | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [dataLoading, setDataLoading] = useState(false);

  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [currentBusinessId, setCurrentBusinessId] = useState<string>('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stockHistory, setStockHistory] = useState<StockHistory[]>([]);

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loanAccounts, setLoanAccounts] = useState<LoanAccount[]>([]);
  const [cheques, setCheques] = useState<Cheque[]>([]);
  const [cashLogs, setCashLogs] = useState<CashLog[]>([]);

  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);

  // Authentication State Listener
  useEffect(() => {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (isLocalhost) {
      setUser({
        id: '00000000-0000-0000-0000-000000000000',
        email: 'admin@mahavir.com',
        user_metadata: { name: 'New Mahavir' },
        aud: 'authenticated',
        role: 'authenticated'
      } as any);
      setAuthLoading(false);
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch data when authenticated user changes
  useEffect(() => {
    if (!user) {
      setBusinesses([]);
      setCustomers([]);
      setProducts([]);
      setTransactions([]);
      setStockHistory([]);
      setCurrentBusinessId('');
      return;
    }

    const loadData = async () => {
      setDataLoading(true);
      try {
        // Fetch businesses
        const { data: bizData } = await supabase
          .from('businesses')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true });

        const mappedBiz: Business[] = (bizData || []).map((b) => ({
          id: b.id,
          name: b.name,
          logo: b.logo || '',
          gst: b.gst || '',
          pan: b.pan || '',
          type: b.type || '',
          address: b.address || '',
          phone: b.phone || '',
          email: b.email || '',
          invoicePrefix: b.invoice_prefix || '',
          financialYear: b.financial_year || '',
          currency: b.currency || 'INR',
          taxPreference: b.tax_preference || '',
          category: b.category || '',
          state: b.state || '',
          pincode: b.pincode || '',
          booksBeginningDate: b.books_beginning_date || '',
          signature: b.signature || '',
        }));

        setBusinesses(mappedBiz);

        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        if (isLocalhost && mappedBiz.length === 0) {
          const mockBiz: Business[] = [{
            id: 'mock-business-id',
            name: 'NEW MAHAVIR ENTERPRISES',
            logo: '/logo.jpg',
            gst: '22AAAAA0000A1Z5',
            pan: 'AAAAA0000A',
            type: 'Retailer',
            address: '123, Mahavir Nagar, Near Station, Mumbai',
            phone: '9876543210',
            email: 'newmahavir@gmail.com',
            invoicePrefix: 'INV',
            financialYear: '2025-2026',
            currency: 'INR',
            taxPreference: 'Taxable',
            category: 'Grocery',
            state: 'Maharashtra',
            pincode: '400001',
            booksBeginningDate: '2025-04-01',
            signature: ''
          }];
          setBusinesses(mockBiz);
          setCurrentBusinessId('mock-business-id');

          const mockCustomers = [
            { id: 'c1', businessId: 'mock-business-id', name: 'Sagar Traders', phone: '9812345678', gst: '22BBBBB0000B1Z6', address: 'Mumbai', email: 'sagar@gmail.com' },
            { id: 'c2', businessId: 'mock-business-id', name: 'Shree Enterprises', phone: '9823456789', gst: '', address: 'Pune', email: 'shree@gmail.com' },
            { id: 'c3', businessId: 'mock-business-id', name: 'Patel Retail Store', phone: '9834567890', gst: '22CCCCC0000C1Z7', address: 'Thane', email: 'patel@gmail.com' },
            { id: 'c4', businessId: 'mock-business-id', name: 'Riddhi Stores', phone: '9845678901', gst: '', address: 'Navi Mumbai', email: 'riddhi@gmail.com' },
            { id: 'c5', businessId: 'mock-business-id', name: 'Om Provision', phone: '9856789012', gst: '', address: 'Kalyan', email: 'om@gmail.com' }
          ];
          setCustomers(mockCustomers);

          const mockProductsList = [
            { id: 'p1', businessId: 'mock-business-id', name: 'Santoor Soap 4 x 100g', sku: 'SAN100', barcode: '890123', category: 'Soap', purchasePrice: 90, sellingPrice: 120, gst: 18, unit: 'pcs', stock: 15, minStock: 10, image: '' },
            { id: 'p2', businessId: 'mock-business-id', name: 'Surf Excel Matic 1kg', sku: 'SURF1', barcode: '890456', category: 'Detergent', purchasePrice: 180, sellingPrice: 250, gst: 18, unit: 'pcs', stock: 8, minStock: 10, image: '' },
            { id: 'p3', businessId: 'mock-business-id', name: 'Parle-G Biscuit 800g', sku: 'PARLE800', barcode: '890789', category: 'Biscuits', purchasePrice: 60, sellingPrice: 80, gst: 0, unit: 'pcs', stock: 25, minStock: 20, image: '' },
            { id: 'p4', businessId: 'mock-business-id', name: 'Colgate Strong Teeth 200g', sku: 'COLG200', barcode: '890321', category: 'Oral Care', purchasePrice: 85, sellingPrice: 110, gst: 18, unit: 'pcs', stock: 5, minStock: 10, image: '' },
            { id: 'p5', businessId: 'mock-business-id', name: 'Harpic Toilet Cleaner 1L', sku: 'HARP1L', barcode: '890654', category: 'Cleaner', purchasePrice: 140, sellingPrice: 180, gst: 18, unit: 'pcs', stock: 2, minStock: 8, image: '' },
            { id: 'p6', businessId: 'mock-business-id', name: 'Lays Classic Salted 52g', sku: 'LAYS52', barcode: '890987', category: 'Snacks', purchasePrice: 15, sellingPrice: 20, gst: 12, unit: 'pcs', stock: 2, minStock: 12, image: '' },
            { id: 'p7', businessId: 'mock-business-id', name: 'Maggi 2-Minute Noodles 70g', sku: 'MAG70', barcode: '890213', category: 'Noodles', purchasePrice: 11, sellingPrice: 14, gst: 18, unit: 'pcs', stock: 1, minStock: 8, image: '' },
            { id: 'p8', businessId: 'mock-business-id', name: 'Ariel Matic Detergent 1kg', sku: 'ARIEL1', barcode: '890543', category: 'Detergent', purchasePrice: 170, sellingPrice: 220, gst: 18, unit: 'pcs', stock: 0, minStock: 10, image: '' }
          ];
          setProducts(mockProductsList);

          const mockTxs = [
            {
              id: 't1',
              businessId: 'mock-business-id',
              type: 'sale',
              invoiceNo: 'INV-00548',
              date: '31-05-2025',
              contactName: 'Sagar Traders',
              products: [{ productId: 'p1', productName: 'Santoor Soap 4 x 100g', quantity: 20, price: 120, gst: 18, total: 2400 }],
              discount: 0,
              gstAmount: 432,
              totalAmount: 2832,
              paymentStatus: 'Paid',
              paymentType: 'Online'
            },
            {
              id: 't2',
              businessId: 'mock-business-id',
              type: 'sale',
              invoiceNo: 'INV-00547',
              date: '31-05-2025',
              contactName: 'Patel Retail Store',
              products: [{ productId: 'p2', productName: 'Surf Excel Matic 1kg', quantity: 10, price: 250, gst: 18, total: 2500 }],
              discount: 610,
              gstAmount: 340,
              totalAmount: 2230,
              paymentStatus: 'Paid',
              paymentType: 'Cash'
            },
            {
              id: 't3',
              businessId: 'mock-business-id',
              type: 'sale',
              invoiceNo: 'INV-00546',
              date: '30-05-2025',
              contactName: 'Shree Enterprises',
              products: [{ productId: 'p3', productName: 'Parle-G Biscuit 800g', quantity: 40, price: 80, gst: 0, total: 3200 }],
              discount: 75,
              gstAmount: 0,
              totalAmount: 3125,
              paymentStatus: 'Paid',
              paymentType: 'Online'
            },
            {
              id: 't4',
              businessId: 'mock-business-id',
              type: 'sale',
              invoiceNo: 'INV-00545',
              date: '30-05-2025',
              contactName: 'Riddhi Stores',
              products: [{ productId: 'p4', productName: 'Colgate Strong Teeth 200g', quantity: 9, price: 110, gst: 18, total: 990 }],
              discount: 10,
              gstAmount: 176,
              totalAmount: 1156,
              paymentStatus: 'Paid',
              paymentType: 'Cash'
            },
            {
              id: 't5',
              businessId: 'mock-business-id',
              type: 'sale',
              invoiceNo: 'INV-00544',
              date: '29-05-2025',
              contactName: 'Om Provision',
              products: [{ productId: 'p5', productName: 'Harpic Toilet Cleaner 1L', quantity: 10, price: 180, gst: 18, total: 1800 }],
              discount: 40,
              gstAmount: 316,
              totalAmount: 2076,
              paymentStatus: 'Paid',
              paymentType: 'Online'
            }
          ];
          setTransactions(mockTxs);
          setDataLoading(false);
          return;
        }

        if (mappedBiz.length > 0) {
          const storedActiveId = localStorage.getItem('saas_billing_current_id');
          if (storedActiveId && mappedBiz.some((b) => b.id === storedActiveId)) {
            setCurrentBusinessId(storedActiveId);
          } else {
            setCurrentBusinessId(mappedBiz[0].id);
          }
        }

        // Fetch customers
        const { data: custData } = await supabase
          .from('customers')
          .select('*')
          .eq('user_id', user.id);
          
        setCustomers((custData || []).map((c) => ({
          id: c.id,
          businessId: c.business_id,
          name: c.name,
          phone: c.phone || '',
          gst: c.gst || '',
          address: c.address || '',
          email: c.email || ''
        })));

        // Fetch products
        const { data: prodData } = await supabase
          .from('products')
          .select('*')
          .eq('user_id', user.id);
          
        setProducts((prodData || []).map((p) => ({
          id: p.id,
          businessId: p.business_id,
          name: p.name,
          sku: p.sku || '',
          barcode: p.barcode || '',
          category: p.category || '',
          purchasePrice: Number(p.purchase_price) || 0,
          sellingPrice: Number(p.selling_price) || 0,
          gst: Number(p.gst) || 0,
          unit: p.unit || '',
          stock: Number(p.stock) || 0,
          minStock: Number(p.min_stock) || 0,
          image: p.image || ''
        })));

        // Fetch transactions
        const { data: txData } = await supabase
          .from('transactions')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        setTransactions((txData || []).map((t) => ({
          id: t.id,
          businessId: t.business_id,
          type: toUIFrontendType(t.type),
          invoiceNo: t.invoice_no,
          date: t.date,
          contactName: t.contact_name,
          contactPhone: t.contact_phone || '',
          contactGst: t.contact_gst || '',
          contactAddress: t.contact_address || '',
          products: t.products || [],
          discount: Number(t.discount) || 0,
          gstAmount: Number(t.gst_amount) || 0,
          totalAmount: Number(t.total_amount) || 0,
          paymentStatus: t.payment_status,
          paymentType: t.payment_type || '',
          paymentDate: (t.payment_date || '').split('||')[0] || '',
          receivedAmount: (t.payment_date || '').includes('||') ? Number((t.payment_date || '').split('||')[1]) : undefined,
          chequeNo: t.cheque_no || '',
          bankName: t.bank_name || '',
          ifscCode: t.ifsc_code || '',
          createdAt: t.created_at
        })));

        // Fetch stock history
        const { data: shData } = await supabase
          .from('stock_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
        
        // Fetch Bank Accounts
        const { data: bankData } = await supabase.from('bank_accounts').select('*').eq('user_id', user.id);
        setBankAccounts((bankData || []).map((b) => ({
          id: b.id, businessId: b.business_id, displayName: b.display_name, openingBalance: Number(b.opening_balance),
          balanceDate: b.balance_date, accountNumber: b.account_number, ifscCode: b.ifsc_code, upiId: b.upi_id,
          bankName: b.bank_name, holderName: b.holder_name, printQr: b.print_qr, printDetails: b.print_details,
          acceptOnline: b.accept_online, currentBalance: Number(b.current_balance), transactions: b.transactions || []
        })));

        // Fetch Loan Accounts
        const { data: loanData } = await supabase.from('loan_accounts').select('*').eq('user_id', user.id);
        setLoanAccounts((loanData || []).map((l) => ({
          id: l.id, businessId: l.business_id, name: l.name, lenderBank: l.lender_bank, accountNumber: l.account_number,
          description: l.description, currentBalance: Number(l.current_balance), balanceDate: l.balance_date,
          receivedIn: l.received_in, interestRate: Number(l.interest_rate), termDuration: Number(l.term_duration),
          processingFee: Number(l.processing_fee), feePaidFrom: l.fee_paid_from, transactions: l.transactions || []
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

        setStockHistory((shData || []).map((sh) => ({
          id: sh.id,
          businessId: sh.business_id,
          productId: sh.product_id,
          productName: sh.product_name,
          type: sh.type,
          quantityChange: Number(sh.quantity_change),
          date: sh.date,
          referenceNo: sh.reference_no || ''
        })));

      } catch (err) {
        console.error('Error loading Supabase data:', err);
      } finally {
        setDataLoading(false);
      }
    };

    loadData();
  }, [user]);

  // Sync active business state
  useEffect(() => {
    const found = businesses.find((b) => b.id === currentBusinessId);
    setActiveBusiness(found || null);
    if (currentBusinessId) {
      localStorage.setItem('saas_billing_current_id', currentBusinessId);
    }
  }, [currentBusinessId, businesses]);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const addBusiness = async (biz: Omit<Business, 'id'>) => {
    if (user) {
      const { data, error } = await supabase
        .from('businesses')
        .insert([{
          user_id: user.id,
          name: biz.name,
          logo: biz.logo,
          gst: biz.gst,
          pan: biz.pan,
          type: biz.type,
          address: biz.address,
          phone: biz.phone,
          email: biz.email,
          invoice_prefix: biz.invoicePrefix,
          financial_year: biz.financialYear,
          currency: biz.currency,
          tax_preference: biz.taxPreference,
          category: biz.category,
          state: biz.state,
          pincode: biz.pincode,
          books_beginning_date: biz.booksBeginningDate,
          signature: biz.signature,
        }])
        .select()
        .single();

      if (error) throw error;

      const newBiz: Business = {
        id: data.id,
        name: data.name,
        logo: data.logo || '',
        gst: data.gst || '',
        pan: data.pan || '',
        type: data.type || '',
        address: data.address || '',
        phone: data.phone || '',
        email: data.email || '',
        invoicePrefix: data.invoice_prefix || '',
        financialYear: data.financial_year || '',
        currency: data.currency || 'INR',
        taxPreference: data.tax_preference || '',
        category: data.category || '',
        state: data.state || '',
        pincode: data.pincode || '',
        booksBeginningDate: data.books_beginning_date || '',
        signature: data.signature || '',
      };

      setBusinesses((prev) => [...prev, newBiz]);
      setCurrentBusinessId(newBiz.id);
      return newBiz;
    } else {
      const id = `b_${Date.now()}`;
      const newBiz = { ...biz, id };
      setBusinesses((prev) => [...prev, newBiz]);
      setCurrentBusinessId(id);
      return newBiz;
    }
  };

  const updateBusiness = async (biz: Business) => {
    if (user) {
      const { error } = await supabase
        .from('businesses')
        .update({
          name: biz.name,
          logo: biz.logo,
          gst: biz.gst,
          pan: biz.pan,
          type: biz.type,
          address: biz.address,
          phone: biz.phone,
          email: biz.email,
          invoice_prefix: biz.invoicePrefix,
          financial_year: biz.financialYear,
          currency: biz.currency,
          tax_preference: biz.taxPreference,
          category: biz.category,
          state: biz.state,
          pincode: biz.pincode,
          books_beginning_date: biz.booksBeginningDate,
          signature: biz.signature,
        })
        .eq('id', biz.id);

      if (error) throw error;
    }
    setBusinesses((prev) => prev.map((item) => (item.id === biz.id ? biz : item)));
  };

  const switchBusiness = (id: string) => {
    setCurrentBusinessId(id);
  };

  // Customers CRUD
  const addCustomer = async (cust: Omit<Customer, 'id' | 'businessId'>) => {
    if (user) {
      const { data, error } = await supabase
        .from('customers')
        .insert([{
          user_id: user.id,
          business_id: currentBusinessId,
          name: cust.name,
          phone: cust.phone,
          gst: cust.gst,
          address: cust.address,
          email: cust.email
        }])
        .select()
        .single();

      if (error) throw error;

      const newCust: Customer = {
        id: data.id,
        businessId: data.business_id,
        name: data.name,
        phone: data.phone || '',
        gst: data.gst || '',
        address: data.address || '',
        email: data.email || ''
      };
      setCustomers((prev) => [...prev, newCust]);
    } else {
      const id = `c_${Date.now()}`;
      const newCust: Customer = {
        ...cust,
        id,
        businessId: currentBusinessId
      };
      setCustomers((prev) => [...prev, newCust]);
    }
  };

  const updateCustomer = async (cust: Customer) => {
    if (user) {
      const { error } = await supabase
        .from('customers')
        .update({
          name: cust.name,
          phone: cust.phone,
          gst: cust.gst,
          address: cust.address,
          email: cust.email
        })
        .eq('id', cust.id);

      if (error) throw error;
    }
    setCustomers((prev) => prev.map((item) => (item.id === cust.id ? cust : item)));
  };

  const deleteCustomer = async (id: string) => {
    if (user) {
      const { error } = await supabase.from('customers').delete().eq('id', id);
      if (error) throw error;
    }
    setCustomers((prev) => prev.filter((item) => item.id !== id));
  };

  // Products CRUD
  const addProduct = async (prod: Omit<Product, 'id' | 'businessId'>) => {
    if (user) {
      const { data, error } = await supabase
        .from('products')
        .insert([{
          user_id: user.id,
          business_id: currentBusinessId,
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          category: prod.category,
          purchase_price: prod.purchasePrice,
          selling_price: prod.sellingPrice,
          gst: prod.gst,
          unit: prod.unit,
          stock: prod.stock,
          min_stock: prod.minStock,
          image: prod.image
        }])
        .select()
        .single();

      if (error) throw error;

      const newProd: Product = {
        id: data.id,
        businessId: data.business_id,
        name: data.name,
        sku: data.sku || '',
        barcode: data.barcode || '',
        category: data.category || '',
        purchasePrice: Number(data.purchase_price) || 0,
        sellingPrice: Number(data.selling_price) || 0,
        gst: Number(data.gst) || 0,
        unit: data.unit || '',
        stock: Number(data.stock) || 0,
        minStock: Number(data.min_stock) || 0,
        image: data.image || ''
      };
      setProducts((prev) => [...prev, newProd]);
    } else {
      const id = `p_${Date.now()}`;
      const newProd: Product = {
        ...prod,
        id,
        businessId: currentBusinessId
      };
      setProducts((prev) => [...prev, newProd]);
    }
  };

  const updateProduct = async (prod: Product) => {
    if (user) {
      const { error } = await supabase
        .from('products')
        .update({
          name: prod.name,
          sku: prod.sku,
          barcode: prod.barcode,
          category: prod.category,
          purchase_price: prod.purchasePrice,
          selling_price: prod.sellingPrice,
          gst: prod.gst,
          unit: prod.unit,
          stock: prod.stock,
          min_stock: prod.minStock,
          image: prod.image
        })
        .eq('id', prod.id);

      if (error) throw error;
    }
    setProducts((prev) => prev.map((item) => (item.id === prod.id ? prod : item)));
  };

  const deleteProduct = async (id: string) => {
    if (user) {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    }
    setProducts((prev) => prev.filter((item) => item.id !== id));
  };

  // Transactions (Sales Invoices & Purchases)
  const createSaleInvoice = async (invoice: Omit<Transaction, 'id' | 'businessId' | 'type'>) => {
    if (user) {
      // Insert Transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          business_id: currentBusinessId,
          type: 'sale',
          invoice_no: invoice.invoiceNo,
          date: toISODate(invoice.date),
          contact_name: invoice.contactName,
          contact_phone: invoice.contactPhone,
          contact_gst: invoice.contactGst,
          contact_address: invoice.contactAddress,
          products: invoice.products,
          discount: invoice.discount,
          gst_amount: invoice.gstAmount,
          total_amount: invoice.totalAmount,
          payment_status: invoice.paymentStatus,
          ...(invoice.paymentType ? { payment_type: invoice.paymentType } : {}),
          ...((invoice.paymentDate || invoice.receivedAmount !== undefined) ? { payment_date: invoice.receivedAmount !== undefined ? `${toISODate(invoice.paymentDate) || ''}||${invoice.receivedAmount}` : toISODate(invoice.paymentDate) } : {}),
          ...(invoice.chequeNo ? { cheque_no: invoice.chequeNo } : {}),
          ...(invoice.bankName ? { bank_name: invoice.bankName } : {}),
          ...(invoice.ifscCode ? { ifsc_code: invoice.ifscCode } : {})
        }])
        .select()
        .single();

      if (txError) throw txError;

      // Update product stocks locally & remotely
      for (const item of invoice.products) {
        if (item.productId && item.productId !== 'custom') {
          const { data: pData } = await supabase
            .from('products')
            .select('stock')
            .eq('id', item.productId)
            .single();
          if (pData) {
            const newStock = Math.max(0, pData.stock - item.quantity);
            await supabase
              .from('products')
              .update({ stock: newStock })
              .eq('id', item.productId);
          }
        }
      }

      // Insert stock history records
      const historyInserts = invoice.products.map((p) => ({
        user_id: user.id,
        business_id: currentBusinessId,
        product_id: p.productId,
        product_name: p.productName,
        type: 'sale',
        quantity_change: -p.quantity,
        date: invoice.date,
        reference_no: invoice.invoiceNo
      }));

      const { data: shData, error: shError } = await supabase
        .from('stock_history')
        .insert(historyInserts)
        .select();

      if (shError) throw shError;

      // Update local states
      const newTransaction: Transaction = {
        id: txData.id,
        businessId: txData.business_id,
        type: 'sale',
        invoiceNo: txData.invoice_no,
        date: txData.date,
        contactName: txData.contact_name,
        contactPhone: txData.contact_phone || '',
        contactGst: txData.contact_gst || '',
        contactAddress: txData.contact_address || '',
        products: txData.products || [],
        discount: Number(txData.discount) || 0,
        gstAmount: Number(txData.gst_amount) || 0,
        totalAmount: Number(txData.total_amount) || 0,
        paymentStatus: txData.payment_status,
        paymentType: txData.payment_type || '',
        paymentDate: txData.payment_date || '',
        chequeNo: txData.cheque_no || '',
        bankName: txData.bank_name || '',
        ifscCode: txData.ifsc_code || ''
      };

      const newHistoryRecords: StockHistory[] = (shData || []).map((sh) => ({
        id: sh.id,
        businessId: sh.business_id,
        productId: sh.product_id,
        productName: sh.product_name,
        type: sh.type,
        quantityChange: Number(sh.quantity_change),
        date: sh.date,
        referenceNo: sh.reference_no || ''
      }));

      setProducts((prev) =>
        prev.map((p) => {
          const matched = invoice.products.find((ip) => ip.productId === p.id);
          return matched ? { ...p, stock: Math.max(0, p.stock - matched.quantity) } : p;
        })
      );
      setStockHistory((prev) => [...newHistoryRecords, ...prev]);
      setTransactions((prev) => [newTransaction, ...prev]);

    } else {
      const id = `t_${Date.now()}`;
      const newTransaction: Transaction = {
        ...invoice,
        id,
        businessId: currentBusinessId,
        type: 'sale'
      };

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const itemInInvoice = invoice.products.find((ip) => ip.productId === p.id);
          if (itemInInvoice) {
            return { ...p, stock: Math.max(0, p.stock - itemInInvoice.quantity) };
          }
          return p;
        })
      );

      const newHistoryRecords: StockHistory[] = invoice.products.map((p, idx) => ({
        id: `sh_${Date.now()}_${idx}`,
        businessId: currentBusinessId,
        productId: p.productId,
        productName: p.productName,
        type: 'sale',
        quantityChange: -p.quantity,
        date: invoice.date,
        referenceNo: invoice.invoiceNo
      }));

      setStockHistory((prev) => [...newHistoryRecords, ...prev]);
      setTransactions((prev) => [newTransaction, ...prev]);
    }
  };

  const updateSaleInvoice = async (id: string, invoice: Omit<Transaction, 'id' | 'businessId' | 'type'>) => {
    const oldTx = transactions.find(t => t.id === id);

    if (user) {
      if (oldTx) {
        // Revert old stock
        for (const oldItem of oldTx.products || []) {
          if (oldItem.productId && oldItem.productId !== 'custom') {
            const { data: pData } = await supabase.from('products').select('stock').eq('id', oldItem.productId).single();
            if (pData) {
              await supabase.from('products').update({ stock: pData.stock + oldItem.quantity }).eq('id', oldItem.productId);
            }
          }
        }
        // Apply new stock
        for (const newItem of invoice.products || []) {
          if (newItem.productId && newItem.productId !== 'custom') {
            const { data: pData } = await supabase.from('products').select('stock').eq('id', newItem.productId).single();
            if (pData) {
              await supabase.from('products').update({ stock: Math.max(0, pData.stock - newItem.quantity) }).eq('id', newItem.productId);
            }
          }
        }
      }

      const { error } = await supabase
        .from('transactions')
        .update({
          invoice_no: invoice.invoiceNo,
          date: toISODate(invoice.date),
          contact_name: invoice.contactName,
          contact_phone: invoice.contactPhone,
          contact_gst: invoice.contactGst,
          contact_address: invoice.contactAddress,
          products: invoice.products,
          discount: invoice.discount,
          gst_amount: invoice.gstAmount,
          total_amount: invoice.totalAmount,
          payment_status: invoice.paymentStatus,
          ...(invoice.paymentType ? { payment_type: invoice.paymentType } : {}),
          ...((invoice.paymentDate || invoice.receivedAmount !== undefined) ? { payment_date: invoice.receivedAmount !== undefined ? `${toISODate(invoice.paymentDate) || ''}||${invoice.receivedAmount}` : toISODate(invoice.paymentDate) } : {}),
          ...(invoice.chequeNo ? { cheque_no: invoice.chequeNo } : {}),
          ...(invoice.bankName ? { bank_name: invoice.bankName } : {}),
          ...(invoice.ifscCode ? { ifsc_code: invoice.ifscCode } : {})
        })
        .eq('id', id);

      if (error) throw error;
    }

    if (oldTx) {
      setProducts((prev) => {
        let updated = [...prev];
        for (const oldItem of oldTx.products || []) {
          const idx = updated.findIndex((p) => p.id === oldItem.productId);
          if (idx !== -1) updated[idx] = { ...updated[idx], stock: updated[idx].stock + oldItem.quantity };
        }
        for (const newItem of invoice.products || []) {
          const idx = updated.findIndex((p) => p.id === newItem.productId);
          if (idx !== -1) updated[idx] = { ...updated[idx], stock: Math.max(0, updated[idx].stock - newItem.quantity) };
        }
        return updated;
      });
    }

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, ...invoice }
          : t
      )
    );
  };

  const createPurchaseEntry = async (purchase: Omit<Transaction, 'id' | 'businessId' | 'type'>) => {
    if (user) {
      // Insert Transaction
      const { data: txData, error: txError } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          business_id: currentBusinessId,
          type: 'purchase',
          invoice_no: purchase.invoiceNo,
          date: toISODate(purchase.date),
          contact_name: purchase.contactName,
          contact_phone: purchase.contactPhone,
          contact_gst: purchase.contactGst,
          contact_address: purchase.contactAddress,
          products: purchase.products,
          discount: purchase.discount,
          gst_amount: purchase.gstAmount,
          total_amount: purchase.totalAmount,
          payment_status: purchase.paymentStatus,
          payment_type: purchase.paymentType,
          payment_date: toISODate(purchase.paymentDate),
          cheque_no: purchase.chequeNo,
          bank_name: purchase.bankName,
          ifsc_code: purchase.ifscCode
        }])
        .select()
        .single();

      if (txError) throw txError;

      // Update product stocks locally & remotely
      for (const item of purchase.products) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const newStock = product.stock + item.quantity;
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', product.id);
        }
      }

      // Insert stock history records
      const historyInserts = purchase.products.map((p) => ({
        user_id: user.id,
        business_id: currentBusinessId,
        product_id: p.productId,
        product_name: p.productName,
        type: 'purchase',
        quantity_change: p.quantity,
        date: toISODate(purchase.date) || '',
        reference_no: purchase.invoiceNo
      }));

      const { data: shData, error: shError } = await supabase
        .from('stock_history')
        .insert(historyInserts)
        .select();

      if (shError) throw shError;

      // Update local states
      const newTransaction: Transaction = {
        id: txData.id,
        businessId: txData.business_id,
        type: toUIFrontendType(txData.type),
        invoiceNo: txData.invoice_no,
        date: txData.date,
        contactName: txData.contact_name,
        contactPhone: txData.contact_phone || '',
        contactGst: txData.contact_gst || '',
        contactAddress: txData.contact_address || '',
        products: txData.products || [],
        discount: Number(txData.discount) || 0,
        gstAmount: Number(txData.gst_amount) || 0,
        totalAmount: Number(txData.total_amount) || 0,
        paymentStatus: txData.payment_status,
        paymentType: txData.payment_type || '',
        paymentDate: txData.payment_date || '',
        chequeNo: txData.cheque_no || '',
        bankName: txData.bank_name || '',
        ifscCode: txData.ifsc_code || ''
      };

      const newHistoryRecords: StockHistory[] = (shData || []).map((sh) => ({
        id: sh.id,
        businessId: sh.business_id,
        productId: sh.product_id,
        productName: sh.product_name,
        type: sh.type,
        quantityChange: Number(sh.quantity_change),
        date: sh.date,
        referenceNo: sh.reference_no || ''
      }));

      setProducts((prev) =>
        prev.map((p) => {
          const matched = purchase.products.find((ip) => ip.productId === p.id);
          return matched ? { ...p, stock: p.stock + matched.quantity } : p;
        })
      );
      setStockHistory((prev) => [...newHistoryRecords, ...prev]);
      setTransactions((prev) => [newTransaction, ...prev]);

    } else {
      const id = `t_${Date.now()}`;
      const newTransaction: Transaction = {
        ...purchase,
        id,
        businessId: currentBusinessId,
        type: 'purchase'
      };

      setProducts((prevProducts) =>
        prevProducts.map((p) => {
          const itemInPurchase = purchase.products.find((ip) => ip.productId === p.id);
          if (itemInPurchase) {
            return { ...p, stock: p.stock + itemInPurchase.quantity };
          }
          return p;
        })
      );

      const newHistoryRecords: StockHistory[] = purchase.products.map((p, idx) => ({
        id: `sh_${Date.now()}_${idx}`,
        businessId: currentBusinessId,
        productId: p.productId,
        productName: p.productName,
        type: 'purchase',
        quantityChange: p.quantity,
        date: purchase.date,
        referenceNo: purchase.invoiceNo
      }));

      setStockHistory((prev) => [...newHistoryRecords, ...prev]);
      setTransactions((prev) => [newTransaction, ...prev]);
    }
  };

  const addTransaction = async (tx: Omit<Transaction, 'id' | 'businessId'>) => {
    if (user) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          business_id: currentBusinessId,
          type: toUIDbType(tx.type),
          invoice_no: tx.invoiceNo || null,
          date: toISODate(tx.date) || null,
          contact_name: tx.contactName || null,
          contact_phone: tx.contactPhone || null,
          contact_gst: tx.contactGst || null,
          contact_address: tx.contactAddress || null,
          products: tx.products || [],
          discount: tx.discount || 0,
          gst_amount: tx.gstAmount || 0,
          total_amount: tx.totalAmount || 0,
          payment_status: tx.paymentStatus || null,
          payment_type: tx.paymentType || null,
          payment_date: tx.receivedAmount !== undefined ? `${toISODate(tx.paymentDate) || ''}||${tx.receivedAmount}` : (toISODate(tx.paymentDate) || null),
          cheque_no: tx.chequeNo || null,
          bank_name: tx.bankName || null,
          ifsc_code: tx.ifscCode || null
        }])
        .select()
        .single();
        
      if (error) throw error;
      
      const newTx: Transaction = {
        id: data.id,
        businessId: data.business_id,
        type: toUIFrontendType(data.type),
        invoiceNo: data.invoice_no,
        date: data.date,
        contactName: data.contact_name,
        contactPhone: data.contact_phone,
        contactGst: data.contact_gst,
        contactAddress: data.contact_address,
        products: data.products || [],
        discount: Number(data.discount),
        gstAmount: Number(data.gst_amount),
        totalAmount: Number(data.total_amount),
        paymentStatus: data.payment_status as any,
        paymentType: data.payment_type as any,
        paymentDate: (data.payment_date || '').split('||')[0] || '',
        receivedAmount: (data.payment_date || '').includes('||') ? Number((data.payment_date || '').split('||')[1]) : undefined,
        chequeNo: data.cheque_no,
        bankName: data.bank_name,
        ifscCode: data.ifsc_code,
        createdAt: data.created_at
      };
      setTransactions(prev => [newTx, ...prev]);
    } else {
      const newTx: Transaction = { ...tx, id: Date.now().toString(), businessId: activeBusiness?.id, createdAt: new Date().toISOString() } as Transaction;
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (user) {
      const dbUpdates: any = {};
      if (updates.type !== undefined) dbUpdates.type = toUIDbType(updates.type);
      if (updates.invoiceNo !== undefined) dbUpdates.invoice_no = updates.invoiceNo;
      if (updates.date !== undefined) dbUpdates.date = toISODate(updates.date);
      if (updates.contactName !== undefined) dbUpdates.contact_name = updates.contactName;
      if (updates.contactPhone !== undefined) dbUpdates.contact_phone = updates.contactPhone;
      if (updates.contactGst !== undefined) dbUpdates.contact_gst = updates.contactGst;
      if (updates.contactAddress !== undefined) dbUpdates.contact_address = updates.contactAddress;
      if (updates.products !== undefined) dbUpdates.products = updates.products;
      if (updates.discount !== undefined) dbUpdates.discount = updates.discount;
      if (updates.gstAmount !== undefined) dbUpdates.gst_amount = updates.gstAmount;
      if (updates.totalAmount !== undefined) dbUpdates.total_amount = updates.totalAmount;
      if (updates.paymentStatus !== undefined) dbUpdates.payment_status = updates.paymentStatus;
      if (updates.paymentType !== undefined) dbUpdates.payment_type = updates.paymentType;
      
      if (updates.paymentDate !== undefined || updates.receivedAmount !== undefined) {
        if (updates.receivedAmount !== undefined) {
          dbUpdates.payment_date = `${toISODate(updates.paymentDate) || ''}||${updates.receivedAmount}`;
        } else {
          dbUpdates.payment_date = toISODate(updates.paymentDate);
        }
      }
      
      if (updates.chequeNo !== undefined) dbUpdates.cheque_no = updates.chequeNo;
      if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
      if (updates.ifscCode !== undefined) dbUpdates.ifsc_code = updates.ifscCode;
      
      const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
      if (error) throw error;
    }
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = async (id: string) => {
    const tx = transactions.find((t) => t.id === id);
    if (user) {
      if (tx) {
        for (const item of tx.products || []) {
          if (item.productId && item.productId !== 'custom') {
            const { data: pData } = await supabase.from('products').select('stock').eq('id', item.productId).single();
            if (pData) {
              const modifier = tx.type === 'sale' ? item.quantity : -item.quantity;
              const newStock = Math.max(0, pData.stock + modifier);
              await supabase.from('products').update({ stock: newStock }).eq('id', item.productId);
            }
          }
        }
      }

      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;

      if (tx) {
        await supabase.from('stock_history').delete().eq('reference_no', tx.invoiceNo);
      }
    }

    if (tx) {
      setProducts((prev) =>
        prev.map((p) => {
          const item = (tx.products || []).find((ip) => ip.productId === p.id);
          if (item) {
            const modifier = tx.type === 'sale' ? item.quantity : -item.quantity;
            return { ...p, stock: Math.max(0, p.stock + modifier) };
          }
          return p;
        })
      );
      setStockHistory((prev) => prev.filter((sh) => sh.referenceNo !== tx.invoiceNo));
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  const deleteStockHistory = async (id: string) => {
    const sh = stockHistory.find((s) => s.id === id);
    if (!sh) return;

    if (user) {
      if (sh.productId && sh.productId !== 'custom') {
        const { data: pData } = await supabase.from('products').select('stock').eq('id', sh.productId).single();
        if (pData) {
          const newStock = Math.max(0, pData.stock - sh.quantityChange);
          await supabase.from('products').update({ stock: newStock }).eq('id', sh.productId);
        }
      }

      const { error } = await supabase.from('stock_history').delete().eq('id', id);
      if (error) throw error;
    }

    setProducts((prev) =>
      prev.map((p) => {
        if (p.id === sh.productId) {
          return { ...p, stock: Math.max(0, p.stock - sh.quantityChange) };
        }
        return p;
      })
    );

    setStockHistory((prev) => prev.filter((s) => s.id !== id));
  };

  // Global Search
  const globalSearch = (query: string) => {
    const cleanQuery = query.toLowerCase().trim();
    if (!cleanQuery) return { products: [], customers: [], transactions: [] };

    const activeProducts = products.filter((p) => p.businessId === currentBusinessId);
    const activeCustomers = customers.filter((c) => c.businessId === currentBusinessId);
    const activeTransactions = transactions.filter((t) => t.businessId === currentBusinessId);

    return {
      products: activeProducts.filter(
        (p) =>
          p.name.toLowerCase().includes(cleanQuery) ||
          p.sku.toLowerCase().includes(cleanQuery) ||
          p.barcode.toLowerCase().includes(cleanQuery) ||
          p.category.toLowerCase().includes(cleanQuery)
      ),
      customers: activeCustomers.filter(
        (c) =>
          c.name.toLowerCase().includes(cleanQuery) ||
          c.phone.toLowerCase().includes(cleanQuery) ||
          c.email.toLowerCase().includes(cleanQuery) ||
          (c.gst && c.gst.toLowerCase().includes(cleanQuery))
      ),
      transactions: activeTransactions.filter(
        (t) =>
          t.invoiceNo.toLowerCase().includes(cleanQuery) ||
          t.contactName.toLowerCase().includes(cleanQuery)
      )
    };
  };

  
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
    if (updates.transactions !== undefined) dbUpdates.transactions = updates.transactions;
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

  return (
    <AppContext.Provider
      value={{
        addTransaction,
        updateTransaction,
        bankAccounts, loanAccounts, cheques, cashLogs, addBankAccount, updateBankAccount, deleteBankAccount, addLoanAccount, deleteLoanAccount, addCheque, deleteCheque, addCashLog, deleteCashLog,
        businesses,
        currentBusinessId,
        customers,
        products,
        transactions,
        stockHistory,
        activeBusiness,
        user,
        authLoading,
        dataLoading,
        signOut,
        addBusiness,
        updateBusiness,
        switchBusiness,
        addCustomer,
        updateCustomer,
        deleteCustomer,
        addProduct,
        updateProduct,
        deleteProduct,
        createSaleInvoice,
        updateSaleInvoice,
        createPurchaseEntry,
        deleteTransaction,
        deleteStockHistory,
        globalSearch
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
