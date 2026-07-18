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
  type: 'sale' | 'purchase';
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
  paymentStatus: 'Paid' | 'Unpaid' | 'Pending';
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

interface AppContextProps {
  businesses: Business[];
  currentBusinessId: string;
  customers: Customer[];
  products: Product[];
  transactions: Transaction[];
  stockHistory: StockHistory[];
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
  globalSearch: (query: string) => {
    products: Product[];
    customers: Customer[];
    transactions: Transaction[];
  };
}

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
  const [activeBusiness, setActiveBusiness] = useState<Business | null>(null);

  // Authentication State Listener
  useEffect(() => {
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
          type: t.type,
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
          paymentStatus: t.payment_status
        })));

        // Fetch stock history
        const { data: shData } = await supabase
          .from('stock_history')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
          
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
          date: invoice.date,
          contact_name: invoice.contactName,
          contact_phone: invoice.contactPhone,
          contact_gst: invoice.contactGst,
          contact_address: invoice.contactAddress,
          products: invoice.products,
          discount: invoice.discount,
          gst_amount: invoice.gstAmount,
          total_amount: invoice.totalAmount,
          payment_status: invoice.paymentStatus
        }])
        .select()
        .single();

      if (txError) throw txError;

      // Update product stocks locally & remotely
      for (const item of invoice.products) {
        const product = products.find((p) => p.id === item.productId);
        if (product) {
          const newStock = Math.max(0, product.stock - item.quantity);
          await supabase
            .from('products')
            .update({ stock: newStock })
            .eq('id', product.id);
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
        paymentStatus: txData.payment_status
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
    if (user) {
      const { error } = await supabase
        .from('transactions')
        .update({
          invoice_no: invoice.invoiceNo,
          date: invoice.date,
          contact_name: invoice.contactName,
          contact_phone: invoice.contactPhone,
          contact_gst: invoice.contactGst,
          contact_address: invoice.contactAddress,
          products: invoice.products,
          discount: invoice.discount,
          gst_amount: invoice.gstAmount,
          total_amount: invoice.totalAmount,
          payment_status: invoice.paymentStatus
        })
        .eq('id', id);

      if (error) throw error;
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
          date: purchase.date,
          contact_name: purchase.contactName,
          contact_phone: purchase.contactPhone,
          contact_gst: purchase.contactGst,
          contact_address: purchase.contactAddress,
          products: purchase.products,
          discount: purchase.discount,
          gst_amount: purchase.gstAmount,
          total_amount: purchase.totalAmount,
          payment_status: purchase.paymentStatus
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
        date: purchase.date,
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
        type: 'purchase',
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
        paymentStatus: txData.payment_status
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

  const deleteTransaction = async (id: string) => {
    if (user) {
      const { error } = await supabase.from('transactions').delete().eq('id', id);
      if (error) throw error;
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
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

  return (
    <AppContext.Provider
      value={{
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
