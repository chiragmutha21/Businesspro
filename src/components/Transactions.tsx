import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import type { TransactionProduct } from '../context/AppContext';
import { 
  Plus, 
  Eye, 
  Receipt,
  FileSpreadsheet,
  X,
  Coins,
  Trash2
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';

interface BilledItem {
  id: string;
  name: string;
  quantity: number;
  priceUnit: number;
  taxRateType: string;
  taxPercentage: number;
  taxAmount: number;
  amount: number;
  priceTaxMode: 'Without Tax' | 'With Tax';
  discountPercentage?: number;
}

function numberToWords(num: number): string {
  const a = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  if (num === 0) return 'Zero';

  const makeWords = (n: number): string => {
    if (n < 20) return a[n];
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
    if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + makeWords(n % 100) : '');
    if (n < 100000) return makeWords(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + makeWords(n % 1000) : '');
    if (n < 10000000) return makeWords(Math.floor(n / 100000)) + ' Lakh' + (n % 100000 !== 0 ? ' ' + makeWords(n % 100000) : '');
    return makeWords(Math.floor(n / 10000000)) + ' Crore' + (n % 10000000 !== 0 ? ' ' + makeWords(n % 10000000) : '');
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let words = makeWords(integerPart) + ' Rupees';
  if (decimalPart > 0) {
    words += ' and ' + makeWords(decimalPart) + ' Paise';
  }
  return words + ' Only';
}

interface TransactionsProps {
  activeSection?: string;
}

export const Transactions: React.FC<TransactionsProps> = ({ activeSection = 'transactions' }) => {
  const { 
    transactions, 
    activeBusiness, 
    createSaleInvoice,
    updateSaleInvoice,
    deleteTransaction,
    products,
    customers
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'list' | 'new-sale'>('list');
  const [selectedInvoice, setSelectedInvoice] = useState<any | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [editingTransactionId, setEditingTransactionId] = useState<string | null>(null);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [statusToEdit, setStatusToEdit] = useState<any | null>(null);
  const [statusForm, setStatusForm] = useState({
    paymentStatus: '',
    paymentDate: '',
    chequeNo: '',
    bankName: '',
    ifscCode: ''
  });

  // Local list states for sub-sections
  const [estimates, setEstimates] = useState<any[]>([]);
  const [proformaInvoices, setProformaInvoices] = useState<any[]>([]);
  const [paymentsIn, setPaymentsIn] = useState<any[]>([]);
  const [saleOrders, setSaleOrders] = useState<any[]>([]);
  const [deliveryChallans, setDeliveryChallans] = useState<any[]>([]);
  const [saleReturns, setSaleReturns] = useState<any[]>([]);

  useEffect(() => {
    const directForm = localStorage.getItem('open_sale_form_direct');
    if (directForm && (directForm === activeSection || (!activeSection && directForm === 'transactions'))) {
      setActiveSubTab('new-sale');
      localStorage.removeItem('open_sale_form_direct');
    } else {
      setActiveSubTab('list');
    }
  }, [activeSection]);

  const getSectionTitle = () => {
    switch (activeSection) {
      case 'estimate-quotation': return 'Estimate/Quotation';
      case 'proforma-invoice': return 'Proforma Invoice';
      case 'payment-in': return 'Payment-In';
      case 'sale-order': return 'Sale Order';
      case 'delivery-challan': return 'Delivery Challan';
      case 'sale-return': return 'Sale Return/ Credit Note';
      default: return 'Sale Invoice';
    }
  };

  const getActiveList = () => {
    switch (activeSection) {
      case 'estimate-quotation': return estimates;
      case 'proforma-invoice': return proformaInvoices;
      case 'payment-in': return paymentsIn;
      case 'sale-order': return saleOrders;
      case 'delivery-challan': return deliveryChallans;
      case 'sale-return': return saleReturns;
      default: return activeTransactions;
    }
  };

  // Form states
  const [customerName, setCustomerName] = useState('');
  const [selectedPartyId, setSelectedPartyId] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState<number>(0);
  const [receivedAmount, setReceivedAmount] = useState<number>(0);
  const [invoiceDate, setInvoiceDate] = useState(() => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  });
  const [invoiceNumber, setInvoiceNumber] = useState('01');
  const [roundOff, setRoundOff] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [showDescription, setShowDescription] = useState(false);
  const [descriptionText, setDescriptionText] = useState('');
  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);
  const [searchItemQuery, setSearchItemQuery] = useState('');

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Item List Modal states
  const [showItemModal, setShowItemModal] = useState(false);
  const generateUniqueId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  const [billedItems, setBilledItems] = useState<BilledItem[]>([
    {
      id: generateUniqueId(),
      name: 'Sample Item',
      quantity: 10,
      priceUnit: 100,
      taxRateType: 'None',
      taxPercentage: 0,
      taxAmount: 0,
      amount: 1000,
      priceTaxMode: 'Without Tax'
    }
  ]);

  const activeTransactions = transactions.filter((t) => t.businessId === activeBusiness?.id);

  // Auto increment invoice sequence
  useEffect(() => {
    if (activeBusiness && !editingTransactionId) {
      const dateParts = invoiceDate.split('-');
      const year = dateParts.length === 3 ? dateParts[2] : String(new Date().getFullYear());
      
      const bizTrans = transactions.filter((t) => t.businessId === activeBusiness.id && t.type === 'sale');
      const currentYearSales = bizTrans.filter((t) => t.date && t.date.includes(year));
      const saleCount = currentYearSales.length + 1;
      
      setInvoiceNumber(`${String(saleCount).padStart(2, '0')}/${year}`);
    }
  }, [activeSubTab, activeBusiness, transactions, invoiceDate, editingTransactionId]);

  // Sync totals whenever billedItems changes
  useEffect(() => {
    let totalAmt = 0;
    billedItems.forEach(item => {
      totalAmt += item.amount + item.taxAmount;
    });
    setInvoiceAmount(totalAmt);
  }, [billedItems]);

  const handleAddModalRow = () => {
    setBilledItems([
      ...billedItems,
      {
        id: generateUniqueId(),
        name: '',
        quantity: 1,
        priceUnit: 0,
        taxRateType: 'None',
        taxPercentage: 0,
        taxAmount: 0,
        amount: 0,
        priceTaxMode: 'Without Tax'
      }
    ]);
  };

  const handleRemoveModalRow = (id: string) => {
    if (billedItems.length > 1) {
      setBilledItems(billedItems.filter((item) => item.id !== id));
    } else {
      // If only 1 row remains, just clear it instead of deleting
      setBilledItems([
        {
          id: generateUniqueId(),
          name: '',
          quantity: 1,
          priceUnit: 0,
          taxRateType: 'None',
          taxPercentage: 0,
          taxAmount: 0,
          amount: 0,
          priceTaxMode: 'Without Tax'
        }
      ]);
    }
  };

  const handleUpdateModalRow = (id: string, field: keyof BilledItem, value: any) => {
    const updated = billedItems.map((item) => {
      if (item.id === id) {
        const tempItem = { ...item, [field]: value };
        
        // Parse tax percentage from select type
        if (field === 'taxRateType') {
          const typeStr = value as string;
          let pct = 0;
          if (typeStr !== 'None' && typeStr !== 'Exempt') {
            const matches = typeStr.match(/(\d+(\.\d+)?)/);
            if (matches) pct = parseFloat(matches[1]);
          }
          tempItem.taxPercentage = pct;
        }

        // Recalculate calculations
        const baseVal = tempItem.quantity * tempItem.priceUnit;
        const discPct = tempItem.discountPercentage || 0;
        const discountedBase = baseVal * (1 - discPct / 100);
        let taxAmt = 0;

        if (tempItem.taxPercentage > 0) {
          taxAmt = discountedBase * (tempItem.taxPercentage / 100);
        }
        
        tempItem.taxAmount = Math.round(taxAmt * 100) / 100;
        tempItem.amount = Math.round(discountedBase * 100) / 100;

        return tempItem;
      }
      return item;
    });
    setBilledItems(updated);
  };

  const handleSaveInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName) {
      alert('Customer Name is required');
      return;
    }
    if (activeSection !== 'payment-in' && invoiceAmount <= 0) {
      alert('Billed item list cannot be empty or zero total value');
      return;
    }

    const productsPayload: TransactionProduct[] = billedItems
      .filter(item => item.name)
      .map(item => {
        const prodMatch = products.find(p => p.name.toLowerCase() === item.name.toLowerCase());
        return {
          productId: prodMatch?.id || 'custom',
          productName: item.name,
          quantity: item.quantity,
          price: item.priceUnit,
          gst: item.taxPercentage,
          total: item.amount,
          unit: prodMatch?.unit || 'PCS',
          hsn: prodMatch?.barcode || '96081019',
          discountPercentage: item.discountPercentage || 0
        };
      });

    const selectedParty = customers.find(c => c.id === selectedPartyId);
    const payload = {
      invoiceNo: invoiceNumber,
      date: invoiceDate,
      contactName: customerName,
      contactPhone: selectedParty?.phone || '',
      contactGst: selectedParty?.gst || '',
      contactAddress: selectedParty?.address || '',
      products: productsPayload,
      discount: 0,
      gstAmount: billedItems.reduce((acc, curr) => acc + curr.taxAmount, 0),
      totalAmount: roundOff ? Math.round(invoiceAmount) : invoiceAmount,
      paymentStatus: receivedAmount >= (roundOff ? Math.round(invoiceAmount) : invoiceAmount) ? 'Paid' as const : (receivedAmount > 0 ? 'Pending' as const : 'Unpaid' as const)
    };

    if (editingTransactionId) {
      if (activeSection === 'estimate-quotation') {
        setEstimates((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'proforma-invoice') {
        setProformaInvoices((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'payment-in') {
        setPaymentsIn((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'sale-order') {
        setSaleOrders((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'delivery-challan') {
        setDeliveryChallans((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else if (activeSection === 'sale-return') {
        setSaleReturns((prev) => prev.map(item => item.id === editingTransactionId ? { ...item, ...payload } : item));
      } else {
        updateSaleInvoice(editingTransactionId, payload);
      }
      setEditingTransactionId(null);
      alert(`${getSectionTitle()} updated successfully!`);
    } else {
      if (activeSection === 'estimate-quotation') {
        const record = {
          id: String(estimates.length + 1),
          invoiceNo: invoiceNumber,
          date: invoiceDate,
          contactName: customerName,
          contactPhone: selectedParty?.phone || '',
          contactAddress: selectedParty?.address || '',
          totalAmount: roundOff ? Math.round(invoiceAmount) : invoiceAmount,
          paymentStatus: 'Unpaid',
          paymentType: 'Cash',
          products: productsPayload,
          gstAmount: billedItems.reduce((acc, curr) => acc + curr.taxAmount, 0),
          type: 'Estimate/Quotation'
        };
        setEstimates([record, ...estimates]);
      } else if (activeSection === 'proforma-invoice') {
        const record = {
          id: String(proformaInvoices.length + 1),
          invoiceNo: invoiceNumber,
          date: invoiceDate,
          contactName: customerName,
          contactPhone: selectedParty?.phone || '',
          contactAddress: selectedParty?.address || '',
          totalAmount: roundOff ? Math.round(invoiceAmount) : invoiceAmount,
          paymentStatus: 'Unpaid',
          paymentType: 'Cash',
          products: productsPayload,
          gstAmount: billedItems.reduce((acc, curr) => acc + curr.taxAmount, 0),
          type: 'Proforma Invoice'
        };
        setProformaInvoices([record, ...proformaInvoices]);
      } else if (activeSection === 'payment-in') {
        const record = {
          id: String(paymentsIn.length + 1),
          invoiceNo: invoiceNumber,
          date: invoiceDate,
          contactName: customerName,
          contactPhone: selectedParty?.phone || '',
          contactAddress: selectedParty?.address || '',
          totalAmount: receivedAmount,
          paymentStatus: 'Paid',
          paymentType: 'Cash',
          products: [],
          gstAmount: 0,
          type: 'Payment-In'
        };
        setPaymentsIn([record, ...paymentsIn]);
      } else if (activeSection === 'sale-order') {
        const record = {
          id: String(saleOrders.length + 1),
          invoiceNo: invoiceNumber,
          date: invoiceDate,
          contactName: customerName,
          contactPhone: selectedParty?.phone || '',
          contactAddress: selectedParty?.address || '',
          totalAmount: roundOff ? Math.round(invoiceAmount) : invoiceAmount,
          paymentStatus: 'Pending',
          paymentType: 'Cash',
          products: productsPayload,
          gstAmount: billedItems.reduce((acc, curr) => acc + curr.taxAmount, 0),
          type: 'Sale Order'
        };
        setSaleOrders([record, ...saleOrders]);
      } else if (activeSection === 'delivery-challan') {
        const record = {
          id: String(deliveryChallans.length + 1),
          invoiceNo: invoiceNumber,
          date: invoiceDate,
          contactName: customerName,
          contactPhone: selectedParty?.phone || '',
          contactAddress: selectedParty?.address || '',
          totalAmount: roundOff ? Math.round(invoiceAmount) : invoiceAmount,
          paymentStatus: 'Paid',
          paymentType: 'Cash',
          products: productsPayload,
          gstAmount: billedItems.reduce((acc, curr) => acc + curr.taxAmount, 0),
          type: 'Delivery Challan'
        };
        setDeliveryChallans([record, ...deliveryChallans]);
      } else if (activeSection === 'sale-return') {
        const record = {
          id: String(saleReturns.length + 1),
          invoiceNo: invoiceNumber,
          date: invoiceDate,
          contactName: customerName,
          contactPhone: selectedParty?.phone || '',
          contactAddress: selectedParty?.address || '',
          totalAmount: roundOff ? Math.round(invoiceAmount) : invoiceAmount,
          paymentStatus: 'Paid',
          paymentType: 'Cash',
          products: productsPayload,
          gstAmount: billedItems.reduce((acc, curr) => acc + curr.taxAmount, 0),
          type: 'Sale Return/ Credit Note'
        };
        setSaleReturns([record, ...saleReturns]);
      } else {
        createSaleInvoice(payload);
      }
      alert(`${getSectionTitle()} generated successfully!`);
    }
    
    // Clear and return
    setCustomerName('');
    setSelectedPartyId('');
    setReceivedAmount(0);
    setBilledItems([
      {
        id: generateUniqueId(),
        name: 'Sample Item',
        quantity: 10,
        priceUnit: 100,
        taxRateType: 'None',
        taxPercentage: 0,
        taxAmount: 0,
        amount: 1000,
        priceTaxMode: 'Without Tax'
      }
    ]);
    setActiveSubTab('list');
  };

  // Switch to sale view
  const triggerNewSale = () => {
    setEditingTransactionId(null);
    setCustomerName('');
    setSelectedPartyId('');
    setReceivedAmount(0);
    setBilledItems([
      {
        id: generateUniqueId(),
        name: 'Sample Item',
        quantity: 10,
        priceUnit: 100,
        taxRateType: 'None',
        taxPercentage: 0,
        taxAmount: 0,
        amount: 1000,
        priceTaxMode: 'Without Tax'
      }
    ]);
    setActiveSubTab('new-sale');
  };

  const triggerEditInvoice = (invoice: any) => {
    setEditingTransactionId(invoice.id);
    setInvoiceNumber(invoice.invoiceNo);
    setInvoiceDate(formatDateDDMMYYYY(invoice.date));
    
    const cust = customers.find(c => c.name === invoice.contactName);
    if (cust) {
      setSelectedPartyId(cust.id);
      setCustomerName(cust.name);
    } else {
      setSelectedPartyId('');
      setCustomerName(invoice.contactName);
    }
    
    setReceivedAmount(invoice.paymentStatus === 'Paid' ? invoice.totalAmount : (invoice.paymentStatus === 'Pending' ? invoice.totalAmount / 2 : 0));
    
    const mappedItems = (invoice.products || []).map((p: any) => {
      const gstPct = p.gst || 0;
      const taxRateStr = gstPct > 0 ? `GST@${gstPct}%` : 'None';
      return {
        id: generateUniqueId(),
        name: p.productName,
        quantity: p.quantity,
        priceUnit: p.price,
        taxRateType: taxRateStr,
        taxPercentage: gstPct,
        taxAmount: (p.price * p.quantity) * (gstPct / 100),
        amount: p.total,
        priceTaxMode: 'Without Tax' as const,
        discountPercentage: p.discountPercentage || 0
      };
    });
    
    setBilledItems(mappedItems.length > 0 ? mappedItems : [
      {
        id: generateUniqueId(),
        name: '',
        quantity: 1,
        priceUnit: 0,
        taxRateType: 'None',
        taxPercentage: 0,
        taxAmount: 0,
        amount: 0,
        priceTaxMode: 'Without Tax'
      }
    ]);
    
    setActiveSubTab('new-sale');
  };

  const handleStatusChange = (t: any, newStatus: string) => {
    if (newStatus === 'Paid by Cash' || newStatus === 'Paid by Cheque') {
      setStatusToEdit(t);
      setStatusForm({
        paymentStatus: newStatus,
        paymentDate: t.paymentDate || '',
        chequeNo: t.chequeNo || '',
        bankName: t.bankName || '',
        ifscCode: t.ifscCode || ''
      });
      setShowStatusModal(true);
    } else {
      const updated = { ...t, paymentStatus: newStatus };
      if (activeSection === 'estimate-quotation') {
        setEstimates(prev => prev.map(item => item.id === t.id ? updated : item));
      } else if (activeSection === 'proforma-invoice') {
        setProformaInvoices(prev => prev.map(item => item.id === t.id ? updated : item));
      } else if (activeSection === 'payment-in') {
        setPaymentsIn(prev => prev.map(item => item.id === t.id ? updated : item));
      } else if (activeSection === 'sale-order') {
        setSaleOrders(prev => prev.map(item => item.id === t.id ? updated : item));
      } else if (activeSection === 'delivery-challan') {
        setDeliveryChallans(prev => prev.map(item => item.id === t.id ? updated : item));
      } else if (activeSection === 'sale-return') {
        setSaleReturns(prev => prev.map(item => item.id === t.id ? updated : item));
      } else {
        updateSaleInvoice(t.id, updated);
      }
    }
  };

  const handleSaveStatusDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!statusToEdit) return;

    const updatedData = {
      ...statusToEdit,
      paymentStatus: statusForm.paymentStatus,
      paymentType: statusForm.paymentStatus === 'Paid by Cash' ? 'Cash' : (statusForm.paymentStatus === 'Paid by Cheque' ? 'Cheque' : ''),
      paymentDate: statusForm.paymentDate,
      chequeNo: statusForm.chequeNo,
      bankName: statusForm.bankName,
      ifscCode: statusForm.ifscCode
    };

    try {
      if (activeSection === 'estimate-quotation') {
        setEstimates(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));
      } else if (activeSection === 'proforma-invoice') {
        setProformaInvoices(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));
      } else if (activeSection === 'payment-in') {
        setPaymentsIn(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));
      } else if (activeSection === 'sale-order') {
        setSaleOrders(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));
      } else if (activeSection === 'delivery-challan') {
        setDeliveryChallans(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));
      } else if (activeSection === 'sale-return') {
        setSaleReturns(prev => prev.map(item => item.id === statusToEdit.id ? updatedData : item));
      } else {
        await updateSaleInvoice(statusToEdit.id, updatedData);
      }

      setShowStatusModal(false);
      setStatusToEdit(null);
    } catch (err: any) {
      console.error(err);
      alert('Error updating status: ' + (err.message || 'Unknown error occurred. Please make sure the new columns are created in your Supabase database.'));
    }
  };

  const downloadInvoiceAsPDF = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPreviewModal(true);
    
    setTimeout(() => {
      const element = document.getElementById('print-area');
      if (!element) {
        return;
      }
      
      const runDownload = () => {
        const opt = {
          margin:       10,
          filename:     `Invoice-${invoice.invoiceNo}.pdf`,
          image:        { type: 'jpeg', quality: 0.98 },
          html2canvas:  { scale: 2, useCORS: true },
          jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };
        
        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
          setShowPreviewModal(false);
        });
      };

      // @ts-ignore
      if (window.html2pdf) {
        runDownload();
      } else {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js';
        script.onload = () => {
          runDownload();
        };
        document.body.appendChild(script);
      }
    }, 500);
  };
  const printInvoice = (invoice: any) => {
    setSelectedInvoice(invoice);
    setShowPreviewModal(true);
    setTimeout(() => {
      window.print();
    }, 300);
  };
  const calculateSumQty = () => billedItems.reduce((acc, item) => acc + item.quantity, 0);
  const calculateSumTax = () => billedItems.reduce((acc, item) => acc + item.taxAmount, 0);
  const calculateSumSubtotal = () => invoiceAmount - calculateSumTax();

  // GST options list (4th screenshot)
  const gstOptions = [
    'None',
    'IGST@0%', 'GST@0%',
    'IGST@0.25%', 'GST@0.25%',
    'IGST@3%', 'GST@3%',
    'IGST@5%', 'GST@5%',
    'IGST@12%', 'GST@12%',
    'IGST@18%', 'GST@18%',
    'IGST@28%', 'GST@28%',
    'IGST@40%', 'GST@40%',
    'Exempt'
  ];

  return (
    <div style={styles.container}>
      {activeSubTab === 'list' ? (
        <>
          {/* Top action block */}
          <div className="responsive-top-row">
            <div>
              <h1 style={styles.title}>{getSectionTitle()}</h1>
              <p style={styles.subtitle}>Manage your {getSectionTitle().toLowerCase()} records and balances.</p>
            </div>

            <button className="btn btn-primary" onClick={triggerNewSale}>
              <Plus size={16} />
              <span>Add {getSectionTitle()}</span>
            </button>
          </div>

          {/* Transactions list */}
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Number</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  {activeSection !== 'payment-in' && <th>Items Billed</th>}
                  {activeSection !== 'payment-in' && <th>Gst Tax (₹)</th>}
                  <th>Total Amount (₹)</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {getActiveList().map((t: any) => (
                  <tr key={t.id}>
                    <td style={{ fontWeight: '700', fontFamily: 'monospace' }}>{t.invoiceNo}</td>
                    <td>{formatDateDDMMYYYY(t.date)}</td>
                    <td style={{ fontWeight: '600' }}>{t.contactName}</td>
                    {activeSection !== 'payment-in' && <td>{(t.products || []).length} Products</td>}
                    {activeSection !== 'payment-in' && <td>₹{(t.gstAmount || 0).toFixed(2)}</td>}
                    <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>₹{t.totalAmount.toFixed(2)}</td>
                    <td>
                      <select
                        className={`badge ${
                          t.paymentStatus === 'Paid' || (t.paymentStatus || '').startsWith('Paid') ? 'badge-success' : 
                          t.paymentStatus === 'Pending' ? 'badge-warning' : 'badge-danger'
                        }`}
                        style={{ border: 'none', outline: 'none', cursor: 'pointer', appearance: 'none', background: 'transparent' }}
                        value={t.paymentStatus || 'Unpaid'}
                        onChange={(e) => handleStatusChange(t, e.target.value)}
                      >
                        <option value="Paid">Paid</option>
                        <option value="Paid by Cash">Paid by Cash</option>
                        <option value="Paid by Cheque">Paid by Cheque</option>
                        <option value="Pending">Pending</option>
                        <option value="Unpaid">Unpaid</option>
                      </select>
                    </td>
                    <td style={{ textAlign: 'right', display: 'flex', gap: '8px', justifyContent: 'flex-end', alignItems: 'center' }}>
                      <button 
                        style={styles.actionBtn}
                        onClick={() => {
                          setSelectedInvoice(t);
                          setShowPreviewModal(true);
                        }}
                        title="View Invoice"
                      >
                        <Eye size={14} color="var(--color-primary)" />
                      </button>
                      <button
                        type="button"
                        style={{ backgroundColor: '#F59E0B', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '6px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => triggerEditInvoice(t)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        style={{ backgroundColor: '#10B981', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '6px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => downloadInvoiceAsPDF(t)}
                      >
                        Download
                      </button>
                      <button
                        type="button"
                        style={{ backgroundColor: '#0B1A30', color: '#FFFFFF', border: 'none', borderRadius: '20px', padding: '6px 16px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => printInvoice(t)}
                      >
                        Print
                      </button>
                      <button
                        type="button"
                        style={{ backgroundColor: '#F04444', color: '#FFFFFF', border: 'none', borderRadius: '6px', padding: '6px 12px', fontWeight: '700', fontSize: '12px', cursor: 'pointer' }}
                        onClick={() => {
                          if (confirm('Are you sure you want to delete this record?')) {
                            deleteTransaction(t.id);
                            alert('Record deleted successfully!');
                          }
                        }}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {getActiveList().length === 0 && (
                  <tr>
                    <td colSpan={activeSection === 'payment-in' ? 6 : 8} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                      No {getSectionTitle().toLowerCase()} records yet. Click "Add {getSectionTitle()}" to log one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* New Sale Screen (1st & 2nd Screenshots) */
        <div style={styles.newSaleContainer}>
          <div style={styles.newSaleHeader}>
            <h2 style={styles.newSaleTitle}>Enter details to make your first {getSectionTitle()} 🚀</h2>
            <p style={styles.newSaleSubtitle}>Logged in less than a minute on Vyapar</p>
          </div>

          <form onSubmit={handleSaveInvoice} style={styles.saleForm}>
            {activeSection === 'payment-in' ? (
              <div style={{ backgroundColor: '#FFFFFF', borderRadius: '8px', padding: '24px', border: '1px solid #E5E7EB' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '20px' }}>
                  
                  {/* Left Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 300px', maxWidth: '350px' }}>
                    <div className="form-group">
                      <label style={{ ...styles.fieldLabel, fontWeight: '600' }}>Party *</label>
                      <select
                        style={{ ...styles.modalInput, border: '1px solid #3B82F6', outline: 'none' }}
                        value={selectedPartyId}
                        onChange={(e) => {
                          const cid = e.target.value;
                          setSelectedPartyId(cid);
                          const c = customers.find(item => item.id === cid);
                          if (c) {
                            setCustomerName(c.name);
                          } else {
                            setCustomerName('');
                          }
                        }}
                        required
                      >
                        <option value="">Select Party / Customer</option>
                        {customers.filter(c => c.businessId === activeBusiness?.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    </div>

                    <div className="form-group">
                      <label style={{ ...styles.fieldLabel, fontWeight: '600' }}>Payment Type</label>
                      <select className="form-control" style={styles.modalInput}>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                      </select>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '10px' }}>
                      <span style={{ color: '#3B82F6', fontSize: '13px', cursor: 'pointer', fontWeight: '600', textAlign: 'left' }}>+ Add Payment type</span>
                      <button 
                        type="button" 
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 12px', border: '1px solid #E5E7EB', borderRadius: '6px', backgroundColor: '#FFFFFF', color: '#6B7280', fontSize: '12px', fontWeight: '700', width: 'fit-content' }}
                        onClick={() => setShowDescription(!showDescription)}
                      >
                        + ADD DESCRIPTION
                      </button>
                      {showDescription && (
                        <textarea
                          className="form-control"
                          style={{ width: '100%', minHeight: '60px', border: '1px solid #CBD5E1', borderRadius: '6px', padding: '8px', fontSize: '13px', marginTop: '4px' }}
                          placeholder="Enter description/notes here..."
                          value={descriptionText}
                          onChange={(e) => setDescriptionText(e.target.value)}
                        />
                      )}
                      <label style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px dashed #CBD5E1', borderRadius: '6px', width: '40px', height: '40px', cursor: 'pointer', overflow: 'hidden', color: '#6B7280', margin: 0 }}>
                        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} />
                        {uploadedImage ? (
                          <img src={uploadedImage} alt="Attachment" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <span>📷</span>
                        )}
                      </label>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: '1 1 300px', maxWidth: '350px', alignSelf: 'flex-start' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>Receipt No</span>
                      <input
                        type="text"
                        className="form-control"
                        style={{ width: '150px', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', textAlign: 'right' }}
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>Date</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="DD-MM-YYYY"
                        style={{ width: '150px', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', textAlign: 'right' }}
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        required
                      />
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginTop: '30px' }}>
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>Received</span>
                      <input
                        type="number"
                        className="form-control"
                        style={{ width: '150px', border: '1px solid #CBD5E1', padding: '6px 12px', borderRadius: '6px', fontSize: '14px', textAlign: 'right' }}
                        placeholder="0.00"
                        value={receivedAmount || ''}
                        onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                        required
                      />
                    </div>
                  </div>

                </div>

                {/* Footer Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '40px', borderTop: '1px solid #F3F4F6', paddingTop: '20px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setActiveSubTab('list')}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    style={{ minWidth: '100px' }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Top Layout: Invoice Details & Bill To */}
                <div style={styles.saleGrid}>
                  
                  {/* Left Column: Invoice Details */}
                  <div style={styles.saleCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <div style={styles.cardBlueIcon}><FileSpreadsheet size={16} color="#FFFFFF" /></div>
                      <span style={styles.cardHeaderTitle}>{activeSection === 'payment-in' ? 'Receipt Details :' : 'Document Details :'}</span>
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>{activeSection === 'payment-in' ? 'Receipt Number :' : 'Document Number :'}</span>
                      <input
                        type="text"
                        className="form-control"
                        style={{ border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', width: '120px', textAlign: 'right' }}
                        value={invoiceNumber}
                        onChange={(e) => setInvoiceNumber(e.target.value)}
                        required
                      />
                    </div>
                    <div style={styles.detailRow}>
                      <span style={styles.detailLabel}>Date :</span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="DD-MM-YYYY"
                        style={{ border: '1px solid #CBD5E1', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', width: '135px', textAlign: 'right' }}
                        value={invoiceDate}
                        onChange={(e) => setInvoiceDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  {/* Right Column: Bill To */}
                  <div style={styles.saleCard}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
                      <div style={styles.cardBlueIcon}><Coins size={16} color="#FFFFFF" /></div>
                      <span style={styles.cardHeaderTitle}>Bill To :</span>
                    </div>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Customer Name*</label>
                      <select
                        style={styles.modalInput}
                        value={selectedPartyId}
                        onChange={(e) => {
                          const cid = e.target.value;
                          setSelectedPartyId(cid);
                          const c = customers.find(item => item.id === cid);
                          if (c) {
                            setCustomerName(c.name);
                          } else {
                            setCustomerName('');
                          }
                        }}
                        required
                      >
                        <option value="">Select Party / Customer</option>
                        {customers.filter(c => c.businessId === activeBusiness?.id).map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* Middle: Items Action Card */}
                {billedItems.length === 0 || (billedItems.length === 1 && !billedItems[0].name) ? (
                  <button 
                    type="button" 
                    style={styles.dashedAddBox}
                    onClick={() => setShowItemModal(true)}
                  >
                    <Plus size={20} color="#3B82F6" />
                    <span style={{ fontSize: '14px', color: '#3B82F6', fontWeight: '600' }}>Add Sample Item</span>
                  </button>
                ) : (
                  <div style={styles.itemsSummaryCard}>
                    <div style={styles.itemsSummaryHeader}>
                      <span style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>Sample Item</span>
                      <button 
                        type="button" 
                        style={styles.editItemsLink}
                        onClick={() => setShowItemModal(true)}
                      >
                        Edit Item/s ✎
                      </button>
                    </div>
                    
                    <div style={styles.summaryGrid}>
                      <div style={styles.summaryCol}>
                        <span style={styles.summaryLabel}>Quantity</span>
                        <span style={styles.summaryVal}>{calculateSumQty()}</span>
                      </div>
                      <div style={styles.summaryCol}>
                        <span style={styles.summaryLabel}>Subtotal</span>
                        <span style={styles.summaryVal}>₹ {calculateSumSubtotal().toFixed(2)}</span>
                      </div>
                      <div style={styles.summaryCol}>
                        <span style={styles.summaryLabel}>Tax Amt</span>
                        <span style={styles.summaryVal}>₹ {calculateSumTax().toFixed(2)}</span>
                      </div>
                      <div style={styles.summaryCol}>
                        <span style={styles.summaryLabel}>Total Amount</span>
                        <span style={styles.summaryVal}>₹ {invoiceAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom: Invoice Calculation */}
                <div style={styles.calcCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                    <div style={styles.cardBlueIcon}><Receipt size={16} color="#FFFFFF" /></div>
                    <span style={styles.cardHeaderTitle}>{activeSection === 'payment-in' ? 'Payment Details :' : 'Invoice Calculation :'}</span>
                  </div>

                  {activeSection === 'payment-in' ? (
                    <>
                      <div style={styles.calcRow}>
                        <span style={styles.calcFieldLabel}>Payment Type</span>
                        <select className="form-control" style={styles.calcInput}>
                          <option value="Cash">Cash</option>
                          <option value="Cheque">Cheque</option>
                          <option value="Bank Transfer">Bank Transfer</option>
                        </select>
                      </div>
                      <div style={styles.calcRow}>
                        <span style={styles.calcFieldLabel}>Received Amount*</span>
                        <div style={styles.calcInputWrapper}>
                          <span style={styles.rupeePrefix}>₹</span>
                          <input
                            type="number"
                            className="form-control"
                            style={styles.calcInput}
                            placeholder="0.00"
                            value={receivedAmount || ''}
                            onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                            required
                          />
                        </div>
                      </div>
                    </>
                  ) : (
                    <>
                      <div style={styles.calcRow}>
                        <span style={styles.calcFieldLabel}>Invoice Amount*</span>
                        <div style={styles.calcInputWrapper}>
                          <span style={styles.rupeePrefix}>₹</span>
                          <input
                            type="text"
                            className="form-control"
                            style={{ ...styles.calcInput, color: '#9CA3AF' }}
                            value={invoiceAmount.toFixed(2)}
                            disabled
                          />
                        </div>
                      </div>

                      <div style={styles.calcRow}>
                        <span style={styles.calcFieldLabel}>Received</span>
                        <div style={styles.calcInputWrapper}>
                          <span style={styles.rupeePrefix}>₹</span>
                          <input
                            type="number"
                            className="form-control"
                            style={styles.calcInput}
                            placeholder="0.00"
                            value={receivedAmount || ''}
                            onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                          />
                        </div>
                      </div>

                      <div style={styles.calcRow}>
                        <span style={styles.calcFieldLabel}>Round Off</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <input type="checkbox" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} style={{ width: '16px', height: '16px' }} />
                          <span style={{ fontSize: '12px', color: '#6B7280' }}>
                            {roundOff ? (Math.round(invoiceAmount) - invoiceAmount).toFixed(2) : "0.00"}
                          </span>
                        </div>
                      </div>

                      <div style={styles.calcRow}>
                        <span style={styles.calcFieldLabel}>Grand Total</span>
                        <div style={styles.calcInputWrapper}>
                          <span style={styles.rupeePrefix}>₹</span>
                          <input
                            type="text"
                            className="form-control"
                            style={{ ...styles.calcInput, color: '#1F2937', fontWeight: '700' }}
                            value={(roundOff ? Math.round(invoiceAmount) : invoiceAmount).toFixed(2)}
                            disabled
                          />
                        </div>
                      </div>

                      {/* Balance Banner */}
                      <div style={styles.balanceBanner}>
                        <span style={{ fontSize: '14px', color: '#1F2937', fontWeight: '500' }}>Balance</span>
                        <span style={{ fontSize: '15px', color: '#10B981', fontWeight: '700' }}>₹ {((roundOff ? Math.round(invoiceAmount) : invoiceAmount) - receivedAmount).toFixed(2)}</span>
                      </div>
                    </>
                  )}

                </div>

                {/* Form Footer */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', marginTop: '24px' }}>
                  <button 
                    type="button" 
                    className="btn btn-secondary"
                    onClick={() => setActiveSubTab('list')}
                  >
                    Back to List
                  </button>
                  <button 
                    type="submit" 
                    style={styles.createInvoiceBtn}
                  >
                    Create Your First Invoice
                  </button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* Payment Status Modal */}
      {showStatusModal && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: '400px' }}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Enter Payment Details</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowStatusModal(false)} />
            </div>
            <form onSubmit={handleSaveStatusDetails} style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div className="form-group">
                <label style={styles.fieldLabel}>Payment Status</label>
                <input
                  type="text"
                  className="form-control"
                  style={{ ...styles.modalInput, backgroundColor: '#F3F4F6' }}
                  value={statusForm.paymentStatus}
                  disabled
                />
              </div>

              {statusForm.paymentStatus === 'Paid by Cash' && (
                <div className="form-group">
                  <label style={styles.fieldLabel}>Date Cash Received *</label>
                  <input
                    type="text"
                    className="form-control"
                    style={styles.modalInput}
                    placeholder="DD/MM/YYYY"
                    value={statusForm.paymentDate}
                    onChange={(e) => setStatusForm({ ...statusForm, paymentDate: e.target.value })}
                    required
                  />
                </div>
              )}

              {statusForm.paymentStatus === 'Paid by Cheque' && (
                <>
                  <div className="form-group">
                    <label style={styles.fieldLabel}>Date on Cheque *</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="DD/MM/YYYY"
                      value={statusForm.paymentDate}
                      onChange={(e) => setStatusForm({ ...statusForm, paymentDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={styles.fieldLabel}>Cheque Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="e.g. 000123"
                      value={statusForm.chequeNo}
                      onChange={(e) => setStatusForm({ ...statusForm, chequeNo: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={styles.fieldLabel}>Bank Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="e.g. HDFC Bank"
                      value={statusForm.bankName}
                      onChange={(e) => setStatusForm({ ...statusForm, bankName: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label style={styles.fieldLabel}>IFSC Code</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="e.g. HDFC0001234"
                      value={statusForm.ifscCode}
                      onChange={(e) => setStatusForm({ ...statusForm, ifscCode: e.target.value })}
                    />
                  </div>
                </>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '14px', marginTop: '10px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowStatusModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Details</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Billed Item/s List Modal (3rd Screenshot) */}
      {showItemModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Billed Item/s List</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowItemModal(false)} />
            </div>

            {/* Modal Body Table Grid */}
            <div style={{ padding: '20px' }}>
              <table style={styles.gridTable}>
                <thead>
                  <tr>
                    <th style={styles.gridTh}></th>
                    <th style={styles.gridTh}>ITEM NAME</th>
                    <th style={styles.gridTh}>QUANTITY</th>
                    <th style={styles.gridTh}>PRICE/UNIT (₹)</th>
                    <th style={styles.gridTh}>DISCOUNT (%)</th>
                    <th style={styles.gridTh} colSpan={2}>TAX</th>
                    <th style={styles.gridTh}>AMOUNT (₹)</th>
                    <th style={styles.gridTh}>ACTIONS</th>
                  </tr>
                  <tr>
                    <th style={styles.gridThSub} colSpan={5}></th>
                    <th style={styles.gridThSub}>in (%)</th>
                    <th style={styles.gridThSub}>in (₹)</th>
                    <th style={styles.gridThSub}></th>
                    <th style={styles.gridThSub}></th>
                  </tr>
                </thead>
                <tbody>
                  {billedItems.map((item, idx) => (
                    <tr key={item.id}>
                      <td style={styles.gridTdIndex}>{idx + 1}</td>
                      <td style={{ ...styles.gridTd, position: 'relative' }}>
                        <input
                          type="text"
                          className="form-control"
                          style={styles.gridInput}
                          placeholder="Item Name"
                          value={item.name}
                          onChange={(e) => {
                            const val = e.target.value;
                            handleUpdateModalRow(item.id, 'name', val);
                            setActiveSearchRowId(item.id);
                            setSearchItemQuery(val);
                          }}
                          onBlur={() => {
                            // Delay hiding so onMouseDown triggers first
                            setTimeout(() => {
                              setActiveSearchRowId(null);
                              setSearchItemQuery('');
                            }, 200);
                          }}
                        />
                        {activeSearchRowId === item.id && searchItemQuery && (
                          <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 99, maxHeight: '150px', overflowY: 'auto', textAlign: 'left' }}>
                            {products
                              .filter(p => 
                                p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) || 
                                (p.barcode && p.barcode.includes(searchItemQuery))
                              )
                              .map(p => (
                                <div
                                  key={p.id}
                                  style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '12px', color: '#1F2937' }}
                                  onMouseDown={() => {
                                    const gstPct = p.gst || 0;
                                    const taxRateStr = gstPct > 0 ? `GST@${gstPct}%` : 'None';
                                    const priceVal = p.sellingPrice || 0;
                                    
                                    const baseVal = item.quantity * priceVal;
                                    const discPct = item.discountPercentage || 0;
                                    const discountedBase = baseVal * (1 - discPct / 100);
                                    const taxAmt = gstPct > 0 ? (discountedBase * gstPct / 100) : 0;
 
                                    const updatedRows = billedItems.map(row => {
                                      if (row.id === item.id) {
                                        return {
                                          ...row,
                                          name: p.name,
                                          priceUnit: priceVal,
                                          taxRateType: taxRateStr,
                                          taxPercentage: gstPct,
                                          taxAmount: Math.round(taxAmt * 100) / 100,
                                          amount: Math.round(discountedBase * 100) / 100
                                        };
                                      }
                                      return row;
                                    });
                                    setBilledItems(updatedRows);
                                    setActiveSearchRowId(null);
                                    setSearchItemQuery('');
                                  }}
                                  onMouseEnter={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F3F4F6';
                                  }}
                                  onMouseLeave={(e) => {
                                    (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFFFFF';
                                  }}
                                >
                                  <strong>{p.name}</strong> <span style={{ color: '#6B7280' }}>({p.barcode || 'No HSN'})</span> - ₹{p.sellingPrice || 0}
                                </div>
                              ))}
                            {products.filter(p => 
                              p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) || 
                              (p.barcode && p.barcode.includes(searchItemQuery))
                            ).length === 0 && (
                              <div style={{ padding: '8px 12px', fontSize: '11px', color: '#9CA3AF' }}>No products match</div>
                            )}
                          </div>
                        )}
                      </td>
                      <td style={styles.gridTd}>
                        <input
                          type="number"
                          className="form-control"
                          style={styles.gridInput}
                          placeholder="Qty"
                          value={item.quantity || ''}
                          onChange={(e) => handleUpdateModalRow(item.id, 'quantity', parseInt(e.target.value) || 0)}
                        />
                      </td>
                      <td style={styles.gridTd}>
                        <div style={{ display: 'flex', alignItems: 'center' }}>
                          <input
                            type="number"
                            className="form-control"
                            style={{ ...styles.gridInput, flex: 1 }}
                            placeholder="Price"
                            value={item.priceUnit || ''}
                            onChange={(e) => handleUpdateModalRow(item.id, 'priceUnit', parseFloat(e.target.value) || 0)}
                          />
                          <select
                            style={styles.gridSelectInline}
                            value={item.priceTaxMode}
                            onChange={(e) => handleUpdateModalRow(item.id, 'priceTaxMode', e.target.value)}
                          >
                            <option value="Without Tax">Without Tax</option>
                            <option value="With Tax">With Tax</option>
                          </select>
                        </div>
                      </td>
                      <td style={styles.gridTd}>
                        <input
                          type="number"
                          className="form-control"
                          style={styles.gridInput}
                          placeholder="0"
                          value={item.discountPercentage || ''}
                          onChange={(e) => handleUpdateModalRow(item.id, 'discountPercentage', parseFloat(e.target.value) || 0)}
                        />
                      </td>
                      <td style={styles.gridTd}>
                        <select
                          style={styles.gridSelect}
                          value={item.taxRateType}
                          onChange={(e) => handleUpdateModalRow(item.id, 'taxRateType', e.target.value)}
                        >
                          {gstOptions.map(option => (
                            <option key={option} value={option}>{option}</option>
                          ))}
                        </select>
                      </td>
                      <td style={styles.gridTdCalc}>
                        ₹{item.taxAmount.toFixed(2)}
                      </td>
                      <td style={styles.gridTdCalc}>
                        {item.amount.toFixed(2)}
                      </td>
                      <td style={{ border: '1px solid #E5E7EB', padding: '4px', textAlign: 'center' }}>
                        <button 
                          type="button" 
                          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                          onClick={() => handleRemoveModalRow(item.id)}
                        >
                          <Trash2 size={14} color="#EF4444" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Action row */}
              <div style={styles.gridActionRow}>
                <button 
                  type="button" 
                  style={styles.addGridRowBtn}
                  onClick={handleAddModalRow}
                >
                  + Add Item
                </button>
                
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: '700', alignItems: 'center' }}>
                  <span style={{ color: '#6B7280' }}>Subtotal: ₹{billedItems.reduce((acc, curr) => acc + ((curr.quantity || 0) * (curr.priceUnit || 0) - (curr.priceTaxMode === 'With Tax' ? (curr.taxAmount || 0) : 0)), 0).toFixed(2)}</span>
                  <span style={{ color: '#6B7280' }}>GST: ₹{billedItems.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0).toFixed(2)}</span>
                  <span style={{ color: '#1F2937' }}>TOTAL: ₹ {invoiceAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Modal Footer */}
              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.saveBtn}
                  onClick={() => setShowItemModal(false)}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showPreviewModal && selectedInvoice && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '800px', width: '95%' }}>
            
            {/* Action Bar (Top of modal) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: '12px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <span style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937' }}>Invoice Preview</span>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowPreviewModal(false)} />
            </div>

            {/* Premium Invoice Layout */}
            <div id="print-area" className="print-section" style={{ padding: '30px', backgroundColor: '#FFFFFF', color: '#1F2937', fontFamily: "'Inter', sans-serif" }}>
              
              {/* Header Badging */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <span style={{ backgroundColor: '#0B2545', color: '#FFFFFF', padding: '8px 36px', borderRadius: '4px', fontSize: '16px', fontWeight: '800', letterSpacing: '2px' }}>
                  TAX INVOICE
                </span>
              </div>

              {/* Main Company & Invoice Details Header */}
              <div className="invoice-grid" style={{ marginBottom: '24px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                    {activeBusiness?.logo ? (
                      <img src={activeBusiness.logo} style={{ maxHeight: '50px', maxWidth: '120px', objectFit: 'contain' }} alt="Logo" />
                    ) : (
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0B2545' }}>M</div>
                    )}
                    <div>
                      <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#0B2545', textTransform: 'uppercase' }}>
                        {activeBusiness?.name || 'Mahavir Book Depot'}
                      </h2>
                    </div>
                  </div>
                  <div style={{ fontSize: '11px', color: '#4B5563', lineHeight: '1.6' }}>
                    <div>📍 {activeBusiness?.address || 'Shop No. 12, Nashik - 422009'}</div>
                    <div>📞 {activeBusiness?.phone || '+91 98765 43210'}</div>
                    <div>✉️ {activeBusiness?.email || 'billing@mahavir.com'}</div>
                    {activeBusiness?.gst && <div style={{ marginTop: '4px' }}><strong>GSTIN:</strong> {activeBusiness.gst}</div>}
                    {activeBusiness?.pan && <div><strong>PAN:</strong> {activeBusiness.pan}</div>}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FCFBF7', border: '1px solid #F3EFE0', borderRadius: '8px', padding: '16px', fontSize: '11px' }}>
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#8F5B1E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Invoice Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Invoice No:</span>
                      <strong style={{ color: '#1F2937' }}>{selectedInvoice.invoiceNo}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Invoice Date:</span>
                      <strong>{formatDateDDMMYYYY(selectedInvoice.date)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>State:</span>
                      <strong>{activeBusiness?.state || 'Maharashtra'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To Section */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '14px', marginBottom: '20px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', color: '#000000', fontWeight: '800', textTransform: 'uppercase' }}>BILL TO</h4>
                <div style={{ fontSize: '12px', color: '#1F2937' }}>
                  <div style={{ fontSize: '15px', fontWeight: '500', color: '#1F2937', marginTop: '2px', marginBottom: '4px' }}>{selectedInvoice.contactName}</div>
                  {selectedInvoice.contactPhone && <div style={{ color: '#4B5563', marginTop: '2px' }}>📞 {selectedInvoice.contactPhone}</div>}
                  {selectedInvoice.contactAddress && <div style={{ color: '#4B5563' }}>📍 {selectedInvoice.contactAddress}</div>}
                  {selectedInvoice.contactGst && <div style={{ color: '#4B5563', marginTop: '2px' }}><strong>GSTIN:</strong> {selectedInvoice.contactGst}</div>}
                </div>
              </div>

              {/* Items Table Grid */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0B2545', color: '#FFFFFF', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 8px', textAlign: 'left', borderRadius: '4px 0 0 4px' }}>SI No.</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Description of Goods</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>HSN/SAC</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Quantity</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>per</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>GST Rate</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Disc. %</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right', borderRadius: '0 4px 4px 0' }}>Amount</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '12px' }}>
                  {(selectedInvoice.products || []).map((p: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '10px 8px' }}>{idx + 1}</td>
                      <td style={{ padding: '10px 8px', fontWeight: '600' }}>{p.productName}</td>
                      <td style={{ padding: '10px 8px' }}>{p.hsn || '96081019'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.quantity} {p.unit || 'PCS'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{p.price.toFixed(2)}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'center' }}>{p.unit || 'PCS'}</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{p.gst}%</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right' }}>{p.discountPercentage || 0}%</td>
                      <td style={{ padding: '10px 8px', textAlign: 'right', fontWeight: '700' }}>{p.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary Rows (Subtotal & Taxes) */}
              <div className="invoice-grid" style={{ marginTop: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'flex-start', gap: '8px' }}>
                  <div style={{ fontSize: '11px', color: '#1F2937', textAlign: 'left', width: '100%' }}>
                    <strong>Amount in Words:</strong>
                    <div style={{ color: '#4B5563', fontStyle: 'italic', marginTop: '4px', textTransform: 'capitalize', lineHeight: '1.4' }}>
                      {numberToWords(selectedInvoice.totalAmount)}
                    </div>
                  </div>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', fontStyle: 'italic', marginTop: '10px' }}>
                    "Thank you for doing business with us. Please pay within due terms."
                  </div>
                </div>

                <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '4px' }}>
                    <span style={{ color: '#6B7280' }}>Total Amount</span>
                    <span>₹{(selectedInvoice.products || []).reduce((acc: number, p: any) => acc + p.total, 0).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '4px' }}>
                    <span style={{ color: '#6B7280' }}>CGST (₹)</span>
                    <span>₹{(selectedInvoice.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '4px' }}>
                    <span style={{ color: '#6B7280' }}>SGST (₹)</span>
                    <span>₹{(selectedInvoice.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 4px', borderTop: '1.5px solid #000000', borderBottom: '3px double #000000', color: '#000000', fontSize: '16px', fontWeight: '900', marginTop: '10px' }}>
                    <span>GRAND TOTAL (₹)</span>
                    <span>₹{selectedInvoice.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Premium Footer section */}
              <div className="invoice-grid" style={{ borderTop: '1px solid #E5E7EB', marginTop: '30px', paddingTop: '16px', fontSize: '10px', color: '#4B5563' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#8F5B1E', textTransform: 'uppercase' }}>Terms & Conditions</h4>
                  <ul style={{ paddingLeft: '14px', margin: 0, lineHeight: '1.5' }}>
                    <li>Goods once sold will not be taken back without prior approval.</li>
                    <li>Subject to local jurisdiction.</li>
                    <li>This is a computer-generated invoice and requires no physical signature.</li>
                  </ul>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'space-between' }}>
                  <div>
                    <span>For <strong>{activeBusiness?.name || 'Mahavir Book Depot'}</strong></span>
                    {activeBusiness?.signature ? (
                      <div style={{ marginTop: '8px' }}>
                        <img src={activeBusiness.signature} style={{ maxHeight: '40px', objectFit: 'contain' }} alt="Signature" />
                      </div>
                    ) : (
                      <div style={{ height: '40px' }} />
                    )}
                    <div style={{ borderTop: '1px solid #D1D5DB', width: '150px', marginTop: '6px', paddingTop: '4px' }}>Authorized Signatory</div>
                  </div>
                </div>
              </div>

            </div>
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
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--color-primary)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  actionBtn: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#FAF8F5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  newSaleContainer: {
    width: '100%',
    maxWidth: '960px',
    margin: '0 auto',
    padding: '10px 0 40px 0',
  },
  newSaleHeader: {
    marginBottom: '24px',
    borderBottom: '1px solid #E5E7EB',
    paddingBottom: '12px',
  },
  newSaleTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: '#1F2937',
  },
  newSaleSubtitle: {
    fontSize: '13.5px',
    color: '#6B7280',
    marginTop: '4px',
  },
  saleForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  saleGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  saleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1.5px solid #F0F4F8',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
  },
  cardBlueIcon: {
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#3B82F6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardHeaderTitle: {
    fontSize: '14.5px',
    fontWeight: '700',
    color: '#1F2937',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    fontSize: '13px',
    borderBottom: '1px dashed #F3F4F6',
  },
  detailLabel: {
    color: '#9CA3AF',
  },
  detailValue: {
    fontWeight: '600',
    color: '#1F2937',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9CA3AF',
    marginBottom: '6px',
    display: 'block',
  },
  modalInput: {
    padding: '8px 12px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#1F2937',
    width: '100%',
    outline: 'none',
  },
  dashedAddBox: {
    width: '100%',
    height: '110px',
    border: '2px dashed #3B82F6',
    borderRadius: '8px',
    backgroundColor: 'rgba(59, 130, 246, 0.02)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    cursor: 'pointer',
  },
  itemsSummaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1.5px dashed #3B82F6',
    padding: '16px 20px',
  },
  itemsSummaryHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px dashed #E5E7EB',
    paddingBottom: '10px',
    marginBottom: '12px',
  },
  editItemsLink: {
    background: 'none',
    border: 'none',
    color: '#3B82F6',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '12px',
  },
  summaryCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  summaryLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
  },
  summaryVal: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#1F2937',
    marginTop: '4px',
  },
  calcCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1.5px solid #F0F4F8',
    padding: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  calcRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calcFieldLabel: {
    fontSize: '13px',
    color: '#6B7280',
  },
  calcInputWrapper: {
    position: 'relative' as const,
    display: 'flex',
    alignItems: 'center',
    width: '280px',
  },
  rupeePrefix: {
    position: 'absolute' as const,
    left: '12px',
    fontSize: '13px',
    color: '#9CA3AF',
  },
  calcInput: {
    padding: '8px 12px 8px 28px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#1F2937',
    width: '100%',
    outline: 'none',
    textAlign: 'right' as const,
  },
  balanceBanner: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#E6F4EA',
    borderRadius: '6px',
    padding: '12px 16px',
    marginTop: '10px',
  },
  createInvoiceBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    padding: '12px 32px',
    borderRadius: '24px',
    border: 'none',
    backgroundColor: '#B5BAC9',
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: '13.5px',
    cursor: 'pointer',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    width: '940px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    overflowY: 'auto' as const,
    maxHeight: '90vh',
  },
  modalHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1F2937',
  },
  gridTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginBottom: '16px',
  },
  gridTh: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    padding: '8px',
    fontSize: '11px',
    color: '#4B5563',
    fontWeight: '700',
    textAlign: 'center',
  },
  gridThSub: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    padding: '4px',
    fontSize: '10px',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  gridTdIndex: {
    border: '1px solid #E5E7EB',
    padding: '8px',
    textAlign: 'center',
    fontSize: '12px',
    color: '#9CA3AF',
  },
  gridTd: {
    border: '1px solid #E5E7EB',
    padding: '4px',
  },
  gridTdCalc: {
    border: '1px solid #E5E7EB',
    padding: '8px',
    textAlign: 'right',
    fontSize: '12px',
    color: '#1F2937',
    fontWeight: '600',
  },
  gridInput: {
    border: 'none',
    padding: '6px 8px',
    fontSize: '12px',
    width: '100%',
    outline: 'none',
  },
  gridSelectInline: {
    border: 'none',
    borderLeft: '1px solid #E5E7EB',
    backgroundColor: '#F9FAFB',
    fontSize: '10px',
    outline: 'none',
    padding: '0 4px',
  },
  gridSelect: {
    border: 'none',
    fontSize: '12px',
    width: '100%',
    outline: 'none',
    backgroundColor: 'transparent',
  },
  gridActionRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #E5E7EB',
    paddingTop: '12px',
    marginBottom: '16px',
  },
  addGridRowBtn: {
    background: 'none',
    border: 'none',
    color: '#3B82F6',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  modalFooter: {
    borderTop: '1px solid #E5E7EB',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  saveBtn: {
    padding: '8px 32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  }
};
