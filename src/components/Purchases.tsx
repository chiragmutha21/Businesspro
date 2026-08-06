import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { 
  ShoppingCart, 
  X, 
  Trash2, 
  Share2, 
  Upload, 
  Camera, 
  Calculator,
  Wallet,
  FileText,
  Undo,
  Search,
  FileSpreadsheet,
  Printer,
  Eye,
  Download
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';

interface PurchasesProps {
  activeSection: string; // 'purchase-bills' | 'payment-out' | 'expenses' | 'purchase-order' | 'purchase-return'
}

interface PurchaseItem {
  id: string;
  name: string;
  qty: number;
  unit: string;
  priceUnit: number;
  priceTaxMode: 'Without Tax' | 'With Tax';
  taxPercentage: number;
  taxAmount: number;
  amount: number;
}

const parseDateStr = (dateStr: string): Date | null => {
  if (!dateStr) return null;
  const normalized = dateStr.replace(/\//g, '-').trim();
  const parts = normalized.split('-');
  if (parts.length !== 3) return null;
  let y, m, d;
  if (parts[0].length === 4) {
    [y, m, d] = parts;
  } else {
    [d, m, y] = parts;
  }
  const parsed = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(parsed.getTime())) return null;
  parsed.setHours(0, 0, 0, 0);
  return parsed;
};

export const Purchases: React.FC<PurchasesProps> = ({ activeSection }) => {
  const { customers, activeBusiness, transactions, deleteTransaction, addTransaction, updateTransaction, products } = useApp();

  const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

  // State to manage showing modals
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentOutModal, setShowPaymentOutModal] = useState(false);
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showDebitNoteModal, setShowDebitNoteModal] = useState(false);

  // General Form States
  const [partyId, setPartyId] = useState('');
  const [partyPhone, setPartyPhone] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [billDate, setBillDate] = useState('12/07/2026');
  const [paymentType, setPaymentType] = useState('Cash');
  const [showPaymentTypeOptions, setShowPaymentTypeOptions] = useState(false);
  const [roundOff, setRoundOff] = useState(false);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [billImageUrl, setBillImageUrl] = useState('');
  const [uploadingBill, setUploadingBill] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeSearchRowId, setActiveSearchRowId] = useState<string | null>(null);
  const [searchItemQuery, setSearchItemQuery] = useState<string>('');

  // Payment Detail Fields
  const [paymentDetails, setPaymentDetails] = useState<any>({
    utrNumber: '', accountNumber: '', ifscCode: '', upiId: '',
    transactionId: '', cardLast4: '', creditDueDate: '', paidAmount: '', paymentNote: ''
  });

  // Specific Payment Out States
  const [receiptNo, setReceiptNo] = useState('1');
  const [paidAmt, setPaidAmt] = useState('');
  // const [description, setDescription] = useState('');

  // Specific Expense States
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseNo, setExpenseNo] = useState('1');
  const [gstToggle, setGstToggle] = useState(false);

  // Specific Order States
  const [orderNo, setOrderNo] = useState('1');
  const [dueDate, setDueDate] = useState('12/07/2026');

  // Specific Debit Note States
  const [returnNo, setReturnNo] = useState('1');
  const [origBillNo, setOrigBillNo] = useState('');
  const [origBillDate, setOrigBillDate] = useState('12/07/2026');

  // List arrays saved in memory
  const purchaseBills = transactions
    .filter(t => t.type === 'Purchase')
    .sort((a, b) => {
      const dateA = parseDateStr(a.date) || new Date(0);
      const dateB = parseDateStr(b.date) || new Date(0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  const paymentsOut = transactions
    .filter(t => t.type === 'Payment Out')
    .sort((a, b) => {
      const dateA = parseDateStr(a.date) || new Date(0);
      const dateB = parseDateStr(b.date) || new Date(0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  const expenses = transactions
    .filter(t => t.type === 'Expense')
    .sort((a, b) => {
      const dateA = parseDateStr(a.date) || new Date(0);
      const dateB = parseDateStr(b.date) || new Date(0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  const purchaseOrders = transactions
    .filter(t => t.type === 'Purchase Order')
    .sort((a, b) => {
      const dateA = parseDateStr(a.date) || new Date(0);
      const dateB = parseDateStr(b.date) || new Date(0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  const debitNotes = transactions
    .filter(t => t.type === 'Debit Note')
    .sort((a, b) => {
      const dateA = parseDateStr(a.date) || new Date(0);
      const dateB = parseDateStr(b.date) || new Date(0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (timeA !== timeB) {
        return timeA - timeB;
      }
      return (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });
  const [selectedBill, setSelectedBill] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [isAutoPrint, setIsAutoPrint] = useState(false);
  const [isAutoDownload, setIsAutoDownload] = useState(false);
  const [viewingUploaded, setViewingUploaded] = useState(false);

  const prepareBillSelection = (b: any, type: string) => {
    let mapped = { ...b, type };
    if (type === 'Payment-Out' || type === 'Expense' || type === 'Purchase Order' || type === 'Debit Note') {
      mapped.total = b.totalAmount;
      mapped.billNumber = b.invoiceNo;
    }
    return mapped;
  };

  const handleViewUploadedRow = (b: any, type: string) => {
    setSelectedBill(prepareBillSelection(b, type));
    setViewingUploaded(true);
    setShowPreviewModal(true);
  };

  const handlePrintRow = (b: any, type: string) => {
    setSelectedBill(prepareBillSelection(b, type));
    setIsAutoPrint(true);
    setShowPreviewModal(true);
  };

  const handleDownloadRow = (b: any, type: string) => {
    setSelectedBill(prepareBillSelection(b, type));
    setIsAutoDownload(true);
    setShowPreviewModal(true);
  };

  const downloadUploadedFile = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
      link.download = `Uploaded-Bill-${selectedBill?.invoiceNo || selectedBill?.id || 'file'}.${extension}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      window.open(url, '_blank');
    }
  };

  const printUploadedFile = (url: string) => {
    const win = window.open();
    if (win) {
      win.document.write(`<img src="${url}" style="max-width: 100%;" onload="window.print();window.close()"/>`);
      win.document.close();
    }
  };

  useEffect(() => {
    if (showPreviewModal && selectedBill) {
      if (isAutoPrint) {
        const timer = setTimeout(() => {
          window.print();
          setIsAutoPrint(false);
          setShowPreviewModal(false);
        }, 500);
        return () => clearTimeout(timer);
      }
      if (isAutoDownload) {
        const timer = setTimeout(() => {
          const element = document.getElementById('print-area');
          if (!element) {
            setIsAutoDownload(false);
            setShowPreviewModal(false);
            return;
          }
          
          const runDownload = () => {
            const opt = {
              margin: 10,
              filename: `${selectedBill.type || 'Bill'}-${selectedBill.invoiceNo || selectedBill.id}.pdf`,
              image: { type: 'jpeg', quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
            };
            // @ts-ignore
            window.html2pdf().set(opt).from(element).save().then(() => {
              setIsAutoDownload(false);
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
        return () => clearTimeout(timer);
      }
    }
  }, [showPreviewModal, selectedBill, isAutoPrint, isAutoDownload]);

  React.useEffect(() => { localStorage.setItem('paymentsOut', JSON.stringify(paymentsOut)); }, [paymentsOut]);
  React.useEffect(() => { localStorage.setItem('expenses', JSON.stringify(expenses)); }, [expenses]);
  React.useEffect(() => { localStorage.setItem('purchaseBills', JSON.stringify(purchaseBills)); }, [purchaseBills]);
  React.useEffect(() => { localStorage.setItem('purchaseOrders', JSON.stringify(purchaseOrders)); }, [purchaseOrders]);
  React.useEffect(() => { localStorage.setItem('debitNotes', JSON.stringify(debitNotes)); }, [debitNotes]);

  const generateUniqueId = () => Math.random().toString(36).substring(2, 9) + Date.now().toString(36);

  // Item List rows
  const [items, setItems] = useState<PurchaseItem[]>([
    {
      id: generateUniqueId(),
      name: '',
      qty: 0,
      unit: 'NONE',
      priceUnit: 0,
      priceTaxMode: 'Without Tax',
      taxPercentage: 0,
      taxAmount: 0,
      amount: 0
    }
  ]);

  const handleAddRow = () => {
    setItems([
      ...items,
      {
        id: generateUniqueId(),
        name: '',
        qty: 0,
        unit: 'NONE',
        priceUnit: 0,
        priceTaxMode: 'Without Tax',
        taxPercentage: 0,
        taxAmount: 0,
        amount: 0
      }
    ]);
  };

  const handleRemoveRow = (id: string) => {
    if (items.length > 1) {
      const updated = items.filter(item => item.id !== id);
      setItems(updated);
      recalcTotal(updated);
    }
  };

  const handleUpdateRow = (id: string, field: keyof PurchaseItem, value: any) => {
    const updated = items.map(item => {
      if (item.id === id) {
        const temp = { ...item, [field]: value };
        const qty = field === 'qty' ? parseFloat(value) || 0 : temp.qty;
        const price = field === 'priceUnit' ? parseFloat(value) || 0 : temp.priceUnit;
        const taxPct = field === 'taxPercentage' ? parseFloat(value) || 0 : temp.taxPercentage;
        const baseVal = qty * price;
        let taxAmt = 0;
        let finalAmt = baseVal;

        if (taxPct > 0) {
          taxAmt = baseVal * (taxPct / 100);
          finalAmt = baseVal + taxAmt;
        }

        temp.taxAmount = Math.round(taxAmt * 100) / 100;
        temp.amount = Math.round(finalAmt * 100) / 100;
        return temp;
      }
      return item;
    });
    setItems(updated);
    recalcTotal(updated);
  };

  const recalcTotal = (currentItems: PurchaseItem[]) => {
    const sum = currentItems.reduce((acc, curr) => acc + curr.amount, 0);
    setTotalAmount(Math.round(sum * 100) / 100);
  };

  const handlePartySelect = (id: string) => {
    setPartyId(id);
    const found = customers.filter(c => c.businessId === activeBusiness?.id).find(c => c.id === id);
    if (found) {
      setPartyPhone(found.phone);
    } else {
      setPartyPhone('');
    }
  };

  const handleSelectProduct = (rowId: string, p: any) => {
    const updated = items.map(item => {
      if (item.id === rowId) {
        const qty = item.qty || 1;
        const price = p.purchasePrice || 0;
        const taxPct = p.gst || 0;
        const baseVal = qty * price;
        let taxAmt = 0;
        let finalAmt = baseVal;

        if (taxPct > 0) {
          taxAmt = baseVal * (taxPct / 100);
          finalAmt = baseVal + taxAmt;
        }

        return {
          ...item,
          name: p.name,
          qty: qty,
          priceUnit: price,
          unit: p.unit || 'NONE',
          taxPercentage: taxPct,
          taxAmount: Math.round(taxAmt * 100) / 100,
          amount: Math.round(finalAmt * 100) / 100
        };
      }
      return item;
    });
    setItems(updated);
    recalcTotal(updated);
    setActiveSearchRowId(null);
    setSearchItemQuery('');
  };

  const resetForm = () => {
    setPartyId('');
    setPartyPhone('');
    setBillNumber('');
    setTotalAmount(0);
    setPaidAmt('');
    // setDescription('');
    setOrigBillNo('');
    setItems([
      {
        id: generateUniqueId(),
        name: '',
        qty: 0,
        unit: 'NONE',
        priceUnit: 0,
        priceTaxMode: 'Without Tax',
        taxPercentage: 0,
        taxAmount: 0,
        amount: 0
      }
    ]);
    setBillImageUrl('');
    setPaymentDetails({
      utrNumber: '', accountNumber: '', ifscCode: '', upiId: '',
      transactionId: '', cardLast4: '', creditDueDate: '', paidAmount: '', paymentNote: ''
    });
  };

  const savePurchaseBill = async () => {
    const party = customers.filter(c => c.businessId === activeBusiness?.id).find(c => c.id === partyId);
    const productsPayload = items.filter(i => i.name).map(i => ({
      productId: 'custom',
      productName: i.name,
      quantity: i.qty,
      price: i.priceUnit,
      gst: i.taxPercentage || 0,
      total: i.amount
    }));
    const finalTotal = roundOff ? Math.round(totalAmount) : totalAmount;
    const gstAmt = items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0);

    const txData: any = {
      type: 'Purchase',
      invoiceNo: billNumber || `PB-${Date.now().toString(36)}`,
      date: billDate,
      contactName: party ? party.name : '',
      contactPhone: partyPhone,
      contactGst: party?.gst || '',
      contactAddress: billImageUrl || '',
      products: productsPayload,
      discount: 0,
      gstAmount: gstAmt,
      totalAmount: finalTotal,
      paymentStatus: 'Paid',
      paymentType: paymentType,
      paymentDate: billDate,
      chequeNo: (paymentType !== 'Cash' && paymentType !== 'Cheque' && paymentType !== 'Online') ? JSON.stringify(paymentDetails) : '',
      bankName: '',
      ifscCode: ''
    };

    try {
      if (editingId) {
        await updateTransaction(editingId, txData);
        setEditingId(null);
      } else {
        await addTransaction(txData);
      }
      setShowBillModal(false);
      resetForm();
      alert(editingId ? 'Purchase Bill updated!' : 'Purchase Bill saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving purchase bill: ' + ((err as any)?.message || String(err)));
    }
  };

  const savePaymentOut = async () => {
    const party = customers.filter(c => c.businessId === activeBusiness?.id).find(c => c.id === partyId);
    try {
      await addTransaction({
        type: 'Payment Out',
        invoiceNo: receiptNo || `PO-${Date.now().toString(36)}`,
        date: billDate,
        contactName: party ? party.name : '',
        contactPhone: partyPhone,
        contactGst: party?.gst || '',
        contactAddress: '',
        products: [],
        discount: 0,
        gstAmount: 0,
        totalAmount: parseFloat(paidAmt) || 0,
        paymentStatus: 'Paid',
        paymentType: paymentType,
        paymentDate: billDate,
        chequeNo: (paymentType !== 'Cash' && paymentType !== 'Cheque' && paymentType !== 'Online') ? JSON.stringify(paymentDetails) : '',
        bankName: '',
        ifscCode: ''
      });
      setShowPaymentOutModal(false);
      resetForm();
      alert('Payment-Out recorded successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving payment out: ' + ((err as any)?.message || String(err)));
    }
  };

  const saveExpense = async () => {
    try {
      await addTransaction({
        type: 'Expense',
        invoiceNo: expenseNo || `EX-${Date.now().toString(36)}`,
        date: billDate,
        contactName: expenseCategory || 'General Expense',
        contactPhone: '',
        contactGst: '',
        contactAddress: '',
        products: items.filter(i => i.name).map(i => ({
          productId: 'custom',
          productName: i.name,
          quantity: i.qty,
          price: i.priceUnit,
          gst: i.taxPercentage || 0,
          total: i.amount
        })),
        discount: 0,
        gstAmount: items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0),
        totalAmount: roundOff ? Math.round(totalAmount) : totalAmount,
        paymentStatus: 'Paid',
        paymentType: paymentType,
        paymentDate: billDate,
        chequeNo: (paymentType !== 'Cash' && paymentType !== 'Cheque' && paymentType !== 'Online') ? JSON.stringify(paymentDetails) : '',
        bankName: '',
        ifscCode: ''
      });
      setShowExpenseModal(false);
      resetForm();
      alert('Expense recorded successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving expense: ' + ((err as any)?.message || String(err)));
    }
  };

  const savePurchaseOrder = async () => {
    const party = customers.filter(c => c.businessId === activeBusiness?.id).find(c => c.id === partyId);
    try {
      await addTransaction({
        type: 'Purchase Order',
        invoiceNo: orderNo || `POR-${Date.now().toString(36)}`,
        date: billDate,
        contactName: party ? party.name : '',
        contactPhone: partyPhone,
        contactGst: party?.gst || '',
        contactAddress: dueDate,
        products: items.filter(i => i.name).map(i => ({
          productId: 'custom',
          productName: i.name,
          quantity: i.qty,
          price: i.priceUnit,
          gst: i.taxPercentage || 0,
          total: i.amount
        })),
        discount: 0,
        gstAmount: items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0),
        totalAmount: roundOff ? Math.round(totalAmount) : totalAmount,
        paymentStatus: 'Pending',
        paymentType: paymentType,
        paymentDate: '',
        chequeNo: (paymentType !== 'Cash' && paymentType !== 'Cheque' && paymentType !== 'Online') ? JSON.stringify(paymentDetails) : '',
        bankName: '',
        ifscCode: ''
      });
      setShowOrderModal(false);
      resetForm();
      alert('Purchase Order saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving purchase order: ' + ((err as any)?.message || String(err)));
    }
  };

  const saveDebitNote = async () => {
    const party = customers.filter(c => c.businessId === activeBusiness?.id).find(c => c.id === partyId);
    try {
      await addTransaction({
        type: 'Debit Note',
        invoiceNo: returnNo || `DN-${Date.now().toString(36)}`,
        date: billDate,
        contactName: party ? party.name : '',
        contactPhone: partyPhone,
        contactGst: origBillNo,
        contactAddress: origBillDate,
        products: items.filter(i => i.name).map(i => ({
          productId: 'custom',
          productName: i.name,
          quantity: i.qty,
          price: i.priceUnit,
          gst: i.taxPercentage || 0,
          total: i.amount
        })),
        discount: 0,
        gstAmount: items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0),
        totalAmount: roundOff ? Math.round(totalAmount) : totalAmount,
        paymentStatus: 'Paid',
        paymentType: paymentType,
        paymentDate: billDate,
        chequeNo: (paymentType !== 'Cash' && paymentType !== 'Cheque' && paymentType !== 'Online') ? JSON.stringify(paymentDetails) : '',
        bankName: '',
        ifscCode: ''
      });
      setShowDebitNoteModal(false);
      resetForm();
      alert('Debit Note (Purchase Return) saved successfully!');
    } catch (err) {
      console.error(err);
      alert('Error saving debit note: ' + ((err as any)?.message || String(err)));
    }
  };

  const handleUploadBill = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      setUploadingBill(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
        const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/auto/upload`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        setBillImageUrl(data.secure_url);
        alert('Bill uploaded successfully!');
      } catch (err) {
        console.error(err);
        alert('Error uploading bill');
      } finally {
        setUploadingBill(false);
      }
    };
    input.click();
  };

  const handleEditBill = (b: any) => {
    setEditingId(b.id);
    const party = customers.find(c => c.name === b.contactName);
    setPartyId(party?.id || '');
    setPartyPhone(b.contactPhone || '');
    setBillNumber(b.invoiceNo || '');
    setBillDate(b.date || '');
    setPaymentType(b.paymentType || 'Cash');
    setTotalAmount(b.totalAmount || 0);
    setBillImageUrl(b.contactAddress || '');
    setRoundOff(false);
    const mappedItems = (b.products || []).map((p: any) => {
      const gstPct = p.gst || 0;
      const baseVal = (p.quantity || 0) * (p.price || 0);
      const taxAmt = gstPct > 0 ? baseVal * (gstPct / 100) : 0;
      return {
        id: generateUniqueId(),
        name: p.productName || '',
        qty: p.quantity || 0,
        unit: p.unit || 'NONE',
        priceUnit: p.price || 0,
        priceTaxMode: 'Without Tax' as const,
        taxPercentage: gstPct,
        taxAmount: Math.round(taxAmt * 100) / 100,
        amount: p.total || 0
      };
    });
    setItems(mappedItems.length > 0 ? mappedItems : [{
      id: generateUniqueId(), name: '', qty: 0, unit: 'NONE', priceUnit: 0,
      priceTaxMode: 'Without Tax' as const, taxPercentage: 0, taxAmount: 0, amount: 0
    }]);
    // Restore payment details if stored
    try {
      const details = b.chequeNo ? JSON.parse(b.chequeNo) : {};
      setPaymentDetails({
        utrNumber: details.utrNumber || '', accountNumber: details.accountNumber || '',
        ifscCode: details.ifscCode || '', upiId: details.upiId || '',
        transactionId: details.transactionId || '', cardLast4: details.cardLast4 || '',
        creditDueDate: details.creditDueDate || '', paidAmount: details.paidAmount || '',
        paymentNote: details.paymentNote || ''
      });
    } catch { setPaymentDetails({ utrNumber: '', accountNumber: '', ifscCode: '', upiId: '', transactionId: '', cardLast4: '', creditDueDate: '', paidAmount: '', paymentNote: '' }); }
    setShowBillModal(true);
  };

  const renderPaymentDetailsForm = () => {
    if (paymentType === 'Bank Transfer') {
      return (
        <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: '#0369A1', margin: '0', fontStyle: 'italic', fontWeight: '500' }}>
            Note: Please enter the bank account details of the recipient you paid to.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>UTR Number *</label>
              <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="UTR / Ref Number" value={paymentDetails.utrNumber || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, utrNumber: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Amount *</label>
              <input type="number" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="0.00" value={paymentDetails.paidAmount || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paidAmount: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Account Number *</label>
              <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="Account No." value={paymentDetails.accountNumber || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, accountNumber: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>IFSC Code *</label>
              <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="IFSC Code" value={paymentDetails.ifscCode || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, ifscCode: e.target.value })} required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Payment Note</label>
            <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="Enter payment note" value={paymentDetails.paymentNote || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentNote: e.target.value })} />
          </div>
        </div>
      );
    }
    if (paymentType === 'UPI') {
      return (
        <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#F0FDF4', borderRadius: '8px', border: '1px solid #BBF7D0', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: '#166534', margin: '0', fontStyle: 'italic', fontWeight: '500' }}>
            Note: Please enter the UPI details of the recipient you paid to.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>UPI ID *</label>
              <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="name@upi" value={paymentDetails.upiId || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, upiId: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Transaction ID *</label>
              <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="Transaction ID" value={paymentDetails.transactionId || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Amount *</label>
              <input type="number" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="0.00" value={paymentDetails.paidAmount || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paidAmount: e.target.value })} required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Payment Note</label>
            <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="Enter payment note" value={paymentDetails.paymentNote || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentNote: e.target.value })} />
          </div>
        </div>
      );
    }
    if (paymentType === 'Card') {
      return (
        <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#FFF7ED', borderRadius: '8px', border: '1px solid #FED7AA', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: '#9A3412', margin: '0', fontStyle: 'italic', fontWeight: '500' }}>
            Note: Please enter the details of the card transaction.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Card Last 4 Digits</label>
              <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="XXXX" maxLength={4} value={paymentDetails.cardLast4 || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, cardLast4: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Transaction ID *</label>
              <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="Transaction ID" value={paymentDetails.transactionId || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, transactionId: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Amount *</label>
              <input type="number" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="0.00" value={paymentDetails.paidAmount || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paidAmount: e.target.value })} required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Payment Note</label>
            <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="Enter payment note" value={paymentDetails.paymentNote || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentNote: e.target.value })} />
          </div>
        </div>
      );
    }
    if (paymentType === 'Credit') {
      return (
        <div style={{ marginTop: '10px', padding: '12px', backgroundColor: '#FDF2F8', borderRadius: '8px', border: '1px solid #FBCFE8', width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ fontSize: '12px', color: '#9D174D', margin: '0', fontStyle: 'italic', fontWeight: '500' }}>
            Note: Please enter the credit details.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Credit Amount *</label>
              <input type="number" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="0.00" value={paymentDetails.paidAmount || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paidAmount: e.target.value })} required />
            </div>
            <div>
              <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Due Date *</label>
              <input type="date" className="form-control" style={{ fontSize: '12px', height: '32px' }} value={paymentDetails.creditDueDate || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, creditDueDate: e.target.value })} required />
            </div>
          </div>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '2px' }}>Payment Note</label>
            <input type="text" className="form-control" style={{ fontSize: '12px', height: '32px' }} placeholder="Enter payment note" value={paymentDetails.paymentNote || ''} onChange={(e) => setPaymentDetails({ ...paymentDetails, paymentNote: e.target.value })} />
          </div>
        </div>
      );
    }
    return null;
  };

  const triggerCalculator = () => {
    window.dispatchEvent(new CustomEvent('toggle-calculator'));
  };

  return (
    <div style={styles.container}>
      
      {/* 1. PURCHASE BILLS SECTION */}
      {activeSection === 'purchase-bills' && (
        <>
          {purchaseBills.filter(b => b.businessId === activeBusiness?.id).length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.iconCircleBlue}>
                <ShoppingCart size={48} color="#3B82F6" />
              </div>
              <p style={styles.emptyText}>
                Make Purchase invoices & Print or share with your customers directly via WhatsApp or Email.
              </p>
              <button 
                style={styles.goldBtn}
                onClick={() => setShowBillModal(true)}
              >
                Add Your First Purchase Invoice
              </button>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={styles.sectionHeaderRow}>
                <h2 style={styles.sectionTitle}>Purchase Bills</h2>
                <button className="btn btn-primary" onClick={() => setShowBillModal(true)}>
                  + Add Purchase Bill
                </button>
              </div>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Bill Number</th>
                      <th>Date</th>
                      <th>Party Name</th>
                      <th>Phone</th>
                      <th>Payment Type</th>
                      <th>Total Amount (₹)</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseBills.filter(b => b.businessId === activeBusiness?.id).map((b) => (
                      <tr key={b.id}>
                        <td style={{ fontWeight: '700' }}>{b.invoiceNo}</td>
                        <td>{formatDateDDMMYYYY(b.date)}</td>
                        <td style={{ fontWeight: '600' }}>{b.contactName}</td>
                        <td>{b.contactPhone}</td>
                        <td>
                          <div>
                            <span style={{ fontWeight: '500' }}>{b.paymentType}</span>
                            {(() => {
                              if (!b.chequeNo) return null;
                              try {
                                const details = JSON.parse(b.chequeNo);
                                return (
                                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    {details.utrNumber && <span>UTR: {details.utrNumber}</span>}
                                    {details.upiId && <span>UPI: {details.upiId}</span>}
                                    {details.transactionId && <span>Txn ID: {details.transactionId}</span>}
                                    {details.cardLast4 && <span>Card: *{details.cardLast4}</span>}
                                  </div>
                                );
                              } catch {
                                return null;
                              }
                            })()}
                          </div>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>₹{b.totalAmount.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => { setSelectedBill({ ...b, type: 'Purchase Bill' }); setShowPreviewModal(true); setViewingUploaded(false); }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            {b.contactAddress && b.contactAddress.startsWith('http') && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', borderColor: '#F59E0B' }}
                                onClick={() => handleViewUploadedRow(b, 'Purchase Bill')}
                              >
                                <Eye size={12} />
                                <span>View Uploaded Bill</span>
                              </button>
                            )}
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                              onClick={() => handleDownloadRow(b, 'Purchase Bill')}
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981' }}
                              onClick={() => handlePrintRow(b, 'Purchase Bill')}
                            >
                              <Printer size={12} />
                              <span>Print</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                              onClick={() => handleEditBill(b)}
                            >
                              <FileText size={12} />
                              <span>Edit</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}
                              onClick={() => { if (window.confirm('Delete this purchase bill?')) deleteTransaction(b.id); }}
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 2. PAYMENT OUT SECTION */}
      {activeSection === 'payment-out' && (
        <div style={{ width: '100%' }}>
          <div style={styles.sectionHeaderRow}>
            <h2 style={styles.sectionTitle}>Payment-Out</h2>
            <button className="btn btn-primary" onClick={() => setShowPaymentOutModal(true)}>
              + Record Payment-Out
            </button>
          </div>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Receipt No</th>
                  <th>Date</th>
                  <th>Party Name</th>
                  <th>Payment Type</th>
                  <th>Paid Amount (₹)</th>
                  <th>Description</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {paymentsOut.filter(p => p.businessId === activeBusiness?.id).map((p) => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: '700' }}>{p.invoiceNo}</td>
                    <td>{formatDateDDMMYYYY(p.date)}</td>
                    <td style={{ fontWeight: '600' }}>{p.contactName}</td>
                    <td>
                      <div>
                        <span style={{ fontWeight: '500' }}>{p.paymentType}</span>
                        {(() => {
                          if (!p.chequeNo) return null;
                          try {
                            const details = JSON.parse(p.chequeNo);
                            return (
                              <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                {details.utrNumber && <span>UTR: {details.utrNumber}</span>}
                                {details.upiId && <span>UPI: {details.upiId}</span>}
                                {details.transactionId && <span>Txn ID: {details.transactionId}</span>}
                                {details.cardLast4 && <span>Card: *{details.cardLast4}</span>}
                              </div>
                            );
                          } catch {
                            return null;
                          }

                            })()}
                          </div>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-danger)' }}>₹{p.totalAmount.toFixed(2)}</td>
                        <td>{p.contactAddress || '-'}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => { setSelectedBill({ ...p, total: p.totalAmount, billNumber: p.invoiceNo, type: 'Payment-Out' }); setShowPreviewModal(true); setViewingUploaded(false); }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            {p.contactAddress && p.contactAddress.startsWith('http') && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', borderColor: '#F59E0B' }}
                                onClick={() => handleViewUploadedRow(p, 'Payment-Out')}
                              >
                                <Eye size={12} />
                                <span>View Uploaded Bill</span>
                              </button>
                            )}
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                              onClick={() => handleDownloadRow(p, 'Payment-Out')}
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981' }}
                              onClick={() => handlePrintRow(p, 'Payment-Out')}
                            >
                              <Printer size={12} />
                              <span>Print</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}
                              onClick={() => { if (window.confirm('Delete this payment out?')) deleteTransaction(p.id); }}
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>

                  </tr>
                ))}
                {paymentsOut.filter(p => p.businessId === activeBusiness?.id).length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                      No payments-out registered yet. Click "Record Payment-Out" to log.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 3. EXPENSES SECTION */}
      {activeSection === 'expenses' && (
        <>
          {expenses.filter(e => e.businessId === activeBusiness?.id).length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.iconCircleRed}>
                <Wallet size={48} color="#EF4444" />
              </div>
              <p style={styles.emptyTextHeader}>Add your 1st Expense</p>
              <p style={styles.emptyTextSub}>Record your business expenses & know your real profits.</p>
              <button 
                style={styles.redBtn}
                onClick={() => setShowExpenseModal(true)}
              >
                + Add Expenses
              </button>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={styles.sectionHeaderRow}>
                <h2 style={styles.sectionTitle}>Expenses Log</h2>
                <button className="btn btn-primary" onClick={() => setShowExpenseModal(true)}>
                  + Add Expense
                </button>
              </div>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Expense No</th>
                      <th>Date</th>
                      <th>Category</th>
                      <th>Payment Type</th>
                      <th>Total Value (₹)</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {expenses.filter(e => e.businessId === activeBusiness?.id).map((e) => (
                      <tr key={e.id}>
                        <td style={{ fontWeight: '700' }}>{e.invoiceNo}</td>
                        <td>{formatDateDDMMYYYY(e.date)}</td>
                        <td style={{ fontWeight: '600' }}>{e.contactName}</td>
                        <td>
                          <div>
                            <span style={{ fontWeight: '500' }}>{e.paymentType}</span>
                            {(() => {
                              if (!e.chequeNo) return null;
                              try {
                                const details = JSON.parse(e.chequeNo);
                                return (
                                  <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                    {details.utrNumber && <span>UTR: {details.utrNumber}</span>}
                                    {details.upiId && <span>UPI: {details.upiId}</span>}
                                    {details.transactionId && <span>Txn ID: {details.transactionId}</span>}
                                    {details.cardLast4 && <span>Card: *{details.cardLast4}</span>}
                                  </div>
                                );
                              } catch {
                                return null;
                              }
                            })()}
                          </div>
                        </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>₹{e.totalAmount.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => { setSelectedBill({ ...e, billNumber: e.invoiceNo, partyName: e.contactName, type: 'Expense' }); setShowPreviewModal(true); setViewingUploaded(false); }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            {e.contactAddress && e.contactAddress.startsWith('http') && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', borderColor: '#F59E0B' }}
                                onClick={() => handleViewUploadedRow(e, 'Expense')}
                              >
                                <Eye size={12} />
                                <span>View Uploaded Bill</span>
                              </button>
                            )}
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                              onClick={() => handleDownloadRow(e, 'Expense')}
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981' }}
                              onClick={() => handlePrintRow(e, 'Expense')}
                            >
                              <Printer size={12} />
                              <span>Print</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}
                              onClick={() => { if (window.confirm('Delete this expense?')) deleteTransaction(e.id); }}
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 4. PURCHASE ORDER SECTION (1st & 2nd Screenshots) */}
      {activeSection === 'purchase-order' && (
        <>
          {purchaseOrders.filter(p => p.businessId === activeBusiness?.id).length === 0 ? (
            <div style={styles.emptyContainer}>
              <div style={styles.iconCircleBlue}>
                <ShoppingCart size={48} color="#3B82F6" />
              </div>
              <p style={styles.emptyText}>
                Make & share purchase orders with your parties & convert them to purchase bill instantly.
              </p>
              <button 
                style={styles.goldBtn}
                onClick={() => setShowOrderModal(true)}
              >
                Add Your First Purchase Order
              </button>
            </div>
          ) : (
            <div style={{ width: '100%' }}>
              <div style={styles.sectionHeaderRow}>
                <h2 style={styles.sectionTitle}>Purchase Orders</h2>
                <button className="btn btn-primary" onClick={() => setShowOrderModal(true)}>
                  + Add Purchase Order
                </button>
              </div>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Order No</th>
                      <th>Order Date</th>
                      <th>Due Date</th>
                      <th>Party Name</th>
                      <th>Payment Type</th>
                      <th>Total Value (₹)</th>
                      <th style={{ textAlign: 'right' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchaseOrders.filter(p => p.businessId === activeBusiness?.id).map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '700' }}>{p.invoiceNo}</td>
                        <td>{formatDateDDMMYYYY(p.date)}</td>
                        <td>{formatDateDDMMYYYY(p.paymentDate || '')}</td>
                        <td style={{ fontWeight: '600' }}>{p.contactName}</td>
                        <td>
                      <div>
                        <span style={{ fontWeight: '500' }}>{p.paymentType}</span>
                        {(() => {
                          if (!p.chequeNo) return null;
                          try {
                            const details = JSON.parse(p.chequeNo);
                            return (
                              <div style={{ fontSize: '10px', color: '#6B7280', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '1px' }}>
                                {details.utrNumber && <span>UTR: {details.utrNumber}</span>}
                                {details.upiId && <span>UPI: {details.upiId}</span>}
                                {details.transactionId && <span>Txn ID: {details.transactionId}</span>}
                                {details.cardLast4 && <span>Card: *{details.cardLast4}</span>}
                              </div>
                            );
                          } catch {
                            return null;
                          }
                        })()}
                      </div>
                    </td>
                        <td style={{ fontWeight: '700', color: 'var(--color-primary)' }}>₹{p.totalAmount.toFixed(2)}</td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => { setSelectedBill({ ...p, billNumber: p.invoiceNo, type: 'Purchase Order' }); setShowPreviewModal(true); setViewingUploaded(false); }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            {p.contactAddress && p.contactAddress.startsWith('http') && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', borderColor: '#F59E0B' }}
                                onClick={() => handleViewUploadedRow(p, 'Purchase Order')}
                              >
                                <Eye size={12} />
                                <span>View Uploaded Bill</span>
                              </button>
                            )}
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                              onClick={() => handleDownloadRow(p, 'Purchase Order')}
                            >
                              <Download size={12} />
                              <span>Download</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981' }}
                              onClick={() => handlePrintRow(p, 'Purchase Order')}
                            >
                              <Printer size={12} />
                              <span>Print</span>
                            </button>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}
                              onClick={() => { if (window.confirm('Delete this purchase order?')) deleteTransaction(p.id); }}
                            >
                              <Trash2 size={12} />
                              <span>Delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* 5. PURCHASE RETURN (DEBIT NOTE) SECTION (3rd & 4th Screenshots) */}
      {activeSection === 'purchase-return' && (
        <div style={{ width: '100%' }}>
          
          {/* Top Date range & Firm Filters (3rd Screenshot Header) */}
          <div style={styles.filterBar}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <select style={styles.filterSelect}>
                <option value="This Month">This Month</option>
                <option value="Today">Today</option>
                <option value="This Year">This Year</option>
              </select>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4B5563' }}>
                <span>Between</span>
                <input type="text" style={styles.filterDateInput} defaultValue="01/07/2026" />
                <span>To</span>
                <input type="text" style={styles.filterDateInput} defaultValue="31/07/2026" />
              </div>

              <select style={styles.filterSelect}>
                <option value="ALL FIRMS">ALL FIRMS</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <button style={styles.actionLink} onClick={() => alert('Exporting report...')}>
                <FileSpreadsheet size={16} />
                <span>Excel Report</span>
              </button>
              <button style={styles.actionLink} onClick={() => window.print()}>
                <Printer size={16} />
                <span>Print</span>
              </button>
            </div>
          </div>

          <div style={styles.subFilterBar}>
            <div style={styles.searchBox}>
              <Search size={14} color="#9CA3AF" />
              <input type="text" placeholder="Search Debit Notes..." style={styles.searchInput} />
            </div>

            <button 
              className="btn btn-primary" 
              onClick={() => setShowDebitNoteModal(true)}
            >
              + Add Debit Note
            </button>
          </div>

          {/* Table List View */}
          <div className="table-wrapper" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
            <table className="custom-table" style={{ flex: 1 }}>
              <thead>
                <tr>
                  <th>DATE</th>
                  <th>REF NO.</th>
                  <th>PARTY NAME</th>
                  <th>CATEGORY NAME</th>
                  <th>TYPE</th>
                  <th>TOTAL</th>
                  <th>RECEIVED/PAID</th>
                  <th>BALANCE</th>
                  <th style={{ textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {debitNotes.filter(d => d.businessId === activeBusiness?.id).map((d) => (
                  <tr key={d.id}>
                    <td>{formatDateDDMMYYYY(d.date)}</td>
                    <td style={{ fontWeight: '700' }}>{d.invoiceNo}</td>
                    <td style={{ fontWeight: '600' }}>{d.contactName}</td>
                    <td>General Purchase</td>
                    <td>Debit Note</td>
                    <td style={{ fontWeight: '700' }}>₹{d.totalAmount.toFixed(2)}</td>
                    <td>₹{d.totalAmount.toFixed(2)}</td>
                    <td>₹0.00</td>
                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                            <button 
                              className="btn btn-secondary" 
                              style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                              onClick={() => { setSelectedBill({ ...d, billNumber: d.invoiceNo, type: 'Debit Note' }); setShowPreviewModal(true); setViewingUploaded(false); }}
                            >
                              <Eye size={12} />
                              <span>View</span>
                            </button>
                            {d.contactAddress && d.contactAddress.startsWith('http') && (
                              <button 
                                className="btn btn-secondary" 
                                style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#D97706', borderColor: '#F59E0B' }}
                                onClick={() => handleViewUploadedRow(d, 'Debit Note')}
                              >
                                <Eye size={12} />
                                <span>View Uploaded Bill</span>
                              </button>
                            )}
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-primary)' }}
                          onClick={() => handleDownloadRow(d, 'Debit Note')}
                        >
                          <Download size={12} />
                          <span>Download</span>
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#10B981' }}
                          onClick={() => handlePrintRow(d, 'Debit Note')}
                        >
                          <Printer size={12} />
                          <span>Print</span>
                        </button>
                        <button 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '11px', display: 'inline-flex', alignItems: 'center', gap: '4px', color: 'var(--color-danger)' }}
                          onClick={() => { if (window.confirm('Delete this debit note?')) deleteTransaction(d.id); }}
                        >
                          <Trash2 size={12} />
                          <span>Delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {debitNotes.filter(d => d.businessId === activeBusiness?.id).length === 0 && (
                  <tr>
                    <td colSpan={9}>
                      <div style={styles.emptyTableState}>
                        <FileText size={42} color="#D1D5DB" />
                        <p style={styles.emptyTableText}>No data is available for Debit Note.</p>
                        <p style={styles.emptyTableSubText}>Please try again after making relevant changes.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            {/* Bottom Total Bar */}
            <div style={styles.tableFooterBar}>
              <span>Total Amount: ₹ {debitNotes.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toFixed(2)}</span>
              <span>Balance: ₹ 0.00</span>
            </div>
          </div>

        </div>
      )}

      {/* A. PURCHASE BILL FORM MODAL */}
      {showBillModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShoppingCart size={18} color="#3B82F6" />
                <span style={styles.modalTitle}>Purchase</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Calculator size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={triggerCalculator} />
                <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setShowBillModal(false); resetForm(); }} />
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={styles.formRowFields}>
                <div style={{ flex: 2, display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Party *</label>
                    <select
                      className="form-control"
                      style={styles.modalSelect}
                      value={partyId}
                      onChange={(e) => handlePartySelect(e.target.value)}
                    >
                      <option value="">Select Party</option>
                      {customers.filter(c => c.businessId === activeBusiness?.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Phone No.</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="Phone No."
                      value={partyPhone}
                      onChange={(e) => setPartyPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ flex: 1, display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Bill Number</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="Bill Number"
                      value={billNumber}
                      onChange={(e) => setBillNumber(e.target.value)}
                    />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Bill Date</label>
                    <input
                      type="text"
                      placeholder="DD/MM/YYYY"
                      className="form-control"
                      style={styles.modalInput}
                      value={billDate}
                      onChange={(e) => setBillDate(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Table Grid */}
              <div style={{ marginTop: '20px', overflow: 'visible' }}>
                <table style={styles.gridTable}>
                  <thead>
                    <tr>
                      <th style={styles.gridTh}>#</th>
                      <th style={styles.gridTh}>ITEM</th>
                      <th style={styles.gridTh}>QTY</th>
                      <th style={styles.gridTh}>UNIT</th>
                      <th style={styles.gridTh}>PRICE/UNIT</th>
                      <th style={styles.gridTh} colSpan={2}>TAX</th>
                      <th style={styles.gridTh}>AMOUNT</th>
                      <th style={styles.gridTh}></th>
                    </tr>
                    <tr>
                      <th style={styles.gridThSub} colSpan={5}></th>
                      <th style={styles.gridThSub}>%</th>
                      <th style={styles.gridThSub}>AMOUNT</th>
                      <th style={styles.gridThSub} colSpan={2}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={styles.gridTdIndex}>{idx + 1}</td>
                        <td style={{ ...styles.gridTd, position: 'relative' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={styles.gridInput}
                            placeholder="Enter Item Name"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateRow(item.id, 'name', val);
                              setActiveSearchRowId(item.id);
                              setSearchItemQuery(val);
                            }}
                            onFocus={() => {
                              setActiveSearchRowId(item.id);
                              setSearchItemQuery(item.name);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setActiveSearchRowId(null);
                                setSearchItemQuery('');
                              }, 200);
                            }}
                          />
                          {activeSearchRowId === item.id && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 99, maxHeight: '150px', overflowY: 'auto', textAlign: 'left' }}>
                              {products
                                .filter(p => p.businessId === activeBusiness?.id)
                                .filter(p =>
                                  !searchItemQuery ||
                                  p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
                                  (p.sku && p.sku.toLowerCase().includes(searchItemQuery.toLowerCase())) ||
                                  (p.barcode && p.barcode.includes(searchItemQuery))
                                )
                                .map(p => (
                                  <div
                                    key={p.id}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '12px', color: '#1F2937' }}
                                    onMouseDown={() => handleSelectProduct(item.id, p)}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F3F4F6';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFFFFF';
                                    }}
                                  >
                                    <strong>{p.name}</strong> <span style={{ color: '#6B7280' }}>({p.sku || 'No SKU'})</span> - Purchase: ₹{p.purchasePrice || 0}
                                  </div>
                                ))}
                              {products
                                .filter(p => p.businessId === activeBusiness?.id)
                                .filter(p =>
                                  !searchItemQuery ||
                                  p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
                                  (p.sku && p.sku.toLowerCase().includes(searchItemQuery.toLowerCase())) ||
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
                            placeholder="0"
                            value={item.qty || ''}
                            onChange={(e) => handleUpdateRow(item.id, 'qty', e.target.value)}
                          />
                        </td>
                        <td style={styles.gridTd}>
                          <select
                            style={styles.gridSelect}
                            value={item.unit}
                            onChange={(e) => handleUpdateRow(item.id, 'unit', e.target.value)}
                          >
                            <option value="NONE">NONE</option>
                            <option value="BAGS">BAGS</option>
                            <option value="BOTTLES">BOTTLES</option>
                            <option value="BOXES">BOXES</option>
                            {item.unit && !['NONE', 'BAGS', 'BOTTLES', 'BOXES'].includes(item.unit) && (
                              <option value={item.unit}>{item.unit.toUpperCase()}</option>
                            )}
                          </select>
                        </td>
                        <td style={styles.gridTd}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input
                              type="number"
                              className="form-control"
                              style={{ ...styles.gridInput, flex: 1 }}
                              placeholder="0.00"
                              value={item.priceUnit || ''}
                              onChange={(e) => handleUpdateRow(item.id, 'priceUnit', e.target.value)}
                            />
                            <select
                              style={styles.gridSelectInline}
                              value={item.priceTaxMode}
                              onChange={(e) => handleUpdateRow(item.id, 'priceTaxMode', e.target.value)}
                            >
                              <option value="Without Tax">Without Tax</option>
                              <option value="With Tax">With Tax</option>
                            </select>
                          </div>
                        </td>
                        <td style={styles.gridTd}>
                          <select
                            style={styles.gridSelect}
                            value={item.taxPercentage}
                            onChange={(e) => handleUpdateRow(item.id, 'taxPercentage', e.target.value)}
                          >
                            <option value="0">Select</option>
                            <option value="5">GST@5%</option>
                            <option value="12">GST@12%</option>
                            <option value="18">GST@18%</option>
                            {item.taxPercentage && !['0', '5', '12', '18'].includes(String(item.taxPercentage)) && (
                              <option value={item.taxPercentage}>GST@{item.taxPercentage}%</option>
                            )}
                          </select>
                        </td>
                        <td style={styles.gridTdCalc}>
                          ₹{item.taxAmount.toFixed(2)}
                        </td>
                        <td style={styles.gridTdCalc}>
                          ₹{item.amount.toFixed(2)}
                        </td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '4px', textAlign: 'center' }}>
                          <button 
                            type="button" 
                            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                            onClick={() => handleRemoveRow(item.id)}
                          >
                            <Trash2 size={14} color="#EF4444" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.gridActionRow}>
                <button type="button" style={styles.addGridRowBtn} onClick={handleAddRow}>ADD ROW</button>
                <div style={{ display: 'flex', gap: '20px', fontSize: '13px', fontWeight: '700' }}>
                  <span>TOTAL QTY: {items.reduce((acc, curr) => acc + (curr.qty || 0), 0)}</span>
                  <span>TOTAL AMOUNT: ₹ {totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div style={styles.bottomBlock}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Payment Type</label>
                      <select style={styles.bottomSelect} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <button type="button" style={styles.linkBtn} onClick={() => setShowPaymentTypeOptions(!showPaymentTypeOptions)}>+ Add Payment type</button>
                    {showPaymentTypeOptions && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {['UPI', 'Bank Transfer', 'Card', 'Credit'].map(t => (
                          <button key={t} type="button" style={{ ...styles.linkBtn, fontSize: '11px', padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: paymentType === t ? 'var(--color-primary)' : 'transparent', color: paymentType === t ? '#fff' : '#4B5563' }} onClick={() => { setPaymentType(t); setShowPaymentTypeOptions(false); }}>{t}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {renderPaymentDetailsForm()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', fontSize: '12px', color: '#4B5563', marginRight: '8px', marginBottom: '6px' }}>
                    <div>Subtotal: ₹{items.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.priceUnit || 0)), 0).toFixed(2)}</div>
                    <div>GST Amount: ₹{items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="roundoff" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} />
                    <label htmlFor="roundoff" style={{ fontSize: '12px', color: '#4B5563' }}>Round Off</label>
                    <input type="text" style={styles.smallInput} disabled value={roundOff ? (Math.round(totalAmount) - totalAmount).toFixed(2) : "0.00"} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937' }}>Total</span>
                    <input type="text" style={styles.totalDisplayInput} value={(roundOff ? Math.round(totalAmount) : totalAmount).toFixed(2)} disabled />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <button type="button" style={styles.uploadBillBtn} onClick={handleUploadBill} disabled={uploadingBill}>
                  <Upload size={14} />
                  <span>{uploadingBill ? 'Uploading...' : billImageUrl ? '✅ Bill Uploaded' : 'Upload Bill'}</span>
                </button>
                {billImageUrl && (
                  <a href={billImageUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: '11px', color: 'var(--color-primary)', textDecoration: 'underline', marginLeft: '8px' }}>View Uploaded Bill</a>
                )}
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={styles.shareBtn}><span>Share</span><Share2 size={12} /></button>
                  <button type="button" style={styles.saveBtnBlue} onClick={savePurchaseBill}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* B. PAYMENT OUT FORM MODAL */}
      {showPaymentOutModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContentSmall}>
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Payment-Out</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Calculator size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={triggerCalculator} />
                <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setShowPaymentOutModal(false); resetForm(); }} />
              </div>
            </div>

            <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Party *</label>
                  <select
                    className="form-control"
                    style={styles.modalSelect}
                    value={partyId}
                    onChange={(e) => handlePartySelect(e.target.value)}
                  >
                    <option value="">Select Party</option>
                    {customers.filter(c => c.businessId === activeBusiness?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group" style={{ width: '140px' }}>
                  <label style={styles.fieldLabel}>Receipt No</label>
                  <input type="text" className="form-control" style={styles.modalInput} value={receiptNo} onChange={(e) => setReceiptNo(e.target.value)} />
                </div>
                <div className="form-group" style={{ width: '140px' }}>
                  <label style={styles.fieldLabel}>Date</label>
                  <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Payment Type</label>
                      <select style={styles.bottomSelect} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <button type="button" style={styles.linkBtn} onClick={() => setShowPaymentTypeOptions(!showPaymentTypeOptions)}>+ Add Payment type</button>
                    {showPaymentTypeOptions && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {['UPI', 'Bank Transfer', 'Card', 'Credit'].map(t => (
                          <button key={t} type="button" style={{ ...styles.linkBtn, fontSize: '11px', padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: paymentType === t ? 'var(--color-primary)' : 'transparent', color: paymentType === t ? '#fff' : '#4B5563' }} onClick={() => { setPaymentType(t); setShowPaymentTypeOptions(false); }}>{t}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {renderPaymentDetailsForm()}
                </div>
                <div className="form-group" style={{ width: '200px' }}>
                  <label style={styles.fieldLabel}>Paid</label>
                  <input type="number" className="form-control" style={styles.modalInput} placeholder="0.00" value={paidAmt} onChange={(e) => setPaidAmt(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px', alignItems: 'center' }}>
                <button type="button" style={styles.outlinePillBtn}><FileText size={14} /><span>ADD DESCRIPTION</span></button>
                <div style={styles.cameraIconContainer}><Camera size={18} color="#9CA3AF" /></div>
              </div>

              <div style={styles.modalFooter}>
                <div />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={styles.shareBtn}><span>Share</span><Share2 size={12} /></button>
                  <button type="button" style={styles.saveBtnBlue} onClick={savePaymentOut}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* C. EXPENSE FORM MODAL */}
      {showExpenseModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.modalTitle}>Expense</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '11px', color: '#6B7280' }}>GST</span>
                  <label style={styles.switch}>
                    <input type="checkbox" checked={gstToggle} onChange={(e) => setGstToggle(e.target.checked)} />
                    <span style={styles.slider}></span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Calculator size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={triggerCalculator} />
                <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setShowExpenseModal(false); resetForm(); }} />
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={styles.formRowFields}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Expense Category*</label>
                  <select
                    className="form-control"
                    style={styles.modalSelect}
                    value={expenseCategory}
                    onChange={(e) => setExpenseCategory(e.target.value)}
                  >
                    <option value="">Select Category</option>
                    <option value="Fuel/Travel">Fuel/Travel</option>
                    <option value="Rent/Lease">Rent/Lease</option>
                    <option value="Office Supplies">Office Supplies</option>
                    <option value="Salaries">Salaries</option>
                  </select>
                </div>
                <div className="form-group" style={{ width: '180px' }}>
                  <label style={styles.fieldLabel}>Expense No</label>
                  <input type="text" className="form-control" style={styles.modalInput} value={expenseNo} onChange={(e) => setExpenseNo(e.target.value)} />
                </div>
                <div className="form-group" style={{ width: '180px' }}>
                  <label style={styles.fieldLabel}>Date</label>
                  <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                </div>
              </div>

              {/* Expense Table Grid */}
              <div style={{ marginTop: '20px', overflowX: 'auto' }}>
                <table style={styles.gridTable}>
                  <thead>
                    <tr>
                      <th style={styles.gridTh}>#</th>
                      <th style={styles.gridTh}>ITEM</th>
                      <th style={styles.gridTh}>QTY</th>
                      <th style={styles.gridTh}>PRICE/UNIT</th>
                      <th style={styles.gridTh} colSpan={2}>TAX</th>
                      <th style={styles.gridTh}>AMOUNT</th>
                      <th style={styles.gridTh}></th>
                    </tr>
                    <tr>
                      <th style={styles.gridThSub} colSpan={4}></th>
                      <th style={styles.gridThSub}>%</th>
                      <th style={styles.gridThSub}>AMOUNT</th>
                      <th style={styles.gridThSub} colSpan={2}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={styles.gridTdIndex}>{idx + 1}</td>
                        <td style={styles.gridTd}>
                          <input
                            type="text"
                            className="form-control"
                            style={styles.gridInput}
                            placeholder="Enter Item Description"
                            value={item.name}
                            onChange={(e) => handleUpdateRow(item.id, 'name', e.target.value)}
                          />
                        </td>
                        <td style={styles.gridTd}>
                          <input type="number" className="form-control" style={styles.gridInput} placeholder="0" value={item.qty || ''} onChange={(e) => handleUpdateRow(item.id, 'qty', e.target.value)} />
                        </td>
                        <td style={styles.gridTd}>
                          <input type="number" className="form-control" style={styles.gridInput} placeholder="0.00" value={item.priceUnit || ''} onChange={(e) => handleUpdateRow(item.id, 'priceUnit', e.target.value)} />
                        </td>
                        <td style={styles.gridTd}>
                          <select style={styles.gridSelect} value={item.taxPercentage} onChange={(e) => handleUpdateRow(item.id, 'taxPercentage', e.target.value)} disabled={!gstToggle}>
                            <option value="0">Select</option>
                            <option value="5">GST@5%</option>
                            <option value="12">GST@12%</option>
                            <option value="18">GST@18%</option>
                          </select>
                        </td>
                        <td style={styles.gridTdCalc}>₹{item.taxAmount.toFixed(2)}</td>
                        <td style={styles.gridTdCalc}>₹{item.amount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '4px', textAlign: 'center' }}>
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleRemoveRow(item.id)}><Trash2 size={14} color="#EF4444" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.gridActionRow}>
                <button type="button" style={styles.addGridRowBtn} onClick={handleAddRow}>ADD ROW</button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>TOTAL: ₹ {totalAmount.toFixed(2)}</span>
              </div>

              <div style={styles.bottomBlock}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Payment Type</label>
                      <select style={styles.bottomSelect} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <button type="button" style={styles.linkBtn} onClick={() => setShowPaymentTypeOptions(!showPaymentTypeOptions)}>+ Add Payment type</button>
                    {showPaymentTypeOptions && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {['UPI', 'Bank Transfer', 'Card', 'Credit'].map(t => (
                          <button key={t} type="button" style={{ ...styles.linkBtn, fontSize: '11px', padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: paymentType === t ? 'var(--color-primary)' : 'transparent', color: paymentType === t ? '#fff' : '#4B5563' }} onClick={() => { setPaymentType(t); setShowPaymentTypeOptions(false); }}>{t}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {renderPaymentDetailsForm()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', fontSize: '12px', color: '#4B5563', marginRight: '8px', marginBottom: '6px' }}>
                    <div>Subtotal: ₹{items.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.priceUnit || 0)), 0).toFixed(2)}</div>
                    <div>GST Amount: ₹{items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="roundoffExp" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} />
                    <label htmlFor="roundoffExp" style={{ fontSize: '12px', color: '#4B5563' }}>Round Off</label>
                    <input type="text" style={styles.smallInput} disabled value={roundOff ? (Math.round(totalAmount) - totalAmount).toFixed(2) : "0.00"} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937' }}>Total</span>
                    <input type="text" style={styles.totalDisplayInput} value={(roundOff ? Math.round(totalAmount) : totalAmount).toFixed(2)} disabled />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <div />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={styles.shareBtn}><span>Share</span><Share2 size={12} /></button>
                  <button type="button" style={styles.saveBtnBlue} onClick={saveExpense}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* D. PURCHASE ORDER FORM MODAL (2nd Screenshot) */}
      {showOrderModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <FileText size={18} color="#3B82F6" />
                <span style={styles.modalTitle}>Purchase Order</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Calculator size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={triggerCalculator} />
                <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setShowOrderModal(false); resetForm(); }} />
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={styles.formRowFields}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Party *</label>
                  <select
                    className="form-control"
                    style={styles.modalSelect}
                    value={partyId}
                    onChange={(e) => handlePartySelect(e.target.value)}
                  >
                    <option value="">Select Party</option>
                    {customers.filter(c => c.businessId === activeBusiness?.id).map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group" style={{ width: '160px' }}>
                  <label style={styles.fieldLabel}>Order No.</label>
                  <input type="text" className="form-control" style={styles.modalInput} value={orderNo} onChange={(e) => setOrderNo(e.target.value)} />
                </div>

                <div className="form-group" style={{ width: '160px' }}>
                  <label style={styles.fieldLabel}>Order Date</label>
                  <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                </div>

                <div className="form-group" style={{ width: '160px' }}>
                  <label style={styles.fieldLabel}>Due Date</label>
                  <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
                </div>
              </div>

              {/* Order Grid Table */}
              <div style={{ marginTop: '20px', overflow: 'visible' }}>
                <table style={styles.gridTable}>
                  <thead>
                    <tr>
                      <th style={styles.gridTh}>#</th>
                      <th style={styles.gridTh}>ITEM</th>
                      <th style={styles.gridTh}>QTY</th>
                      <th style={styles.gridTh}>UNIT</th>
                      <th style={styles.gridTh}>PRICE/UNIT</th>
                      <th style={styles.gridTh} colSpan={2}>TAX</th>
                      <th style={styles.gridTh}>AMOUNT</th>
                      <th style={styles.gridTh}></th>
                    </tr>
                    <tr>
                      <th style={styles.gridThSub} colSpan={5}></th>
                      <th style={styles.gridThSub}>%</th>
                      <th style={styles.gridThSub}>AMOUNT</th>
                      <th style={styles.gridThSub} colSpan={2}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={styles.gridTdIndex}>{idx + 1}</td>
                        <td style={{ ...styles.gridTd, position: 'relative' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={styles.gridInput}
                            placeholder="Enter Item Description"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateRow(item.id, 'name', val);
                              setActiveSearchRowId(item.id);
                              setSearchItemQuery(val);
                            }}
                            onFocus={() => {
                              setActiveSearchRowId(item.id);
                              setSearchItemQuery(item.name);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setActiveSearchRowId(null);
                                setSearchItemQuery('');
                              }, 200);
                            }}
                          />
                          {activeSearchRowId === item.id && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 99, maxHeight: '150px', overflowY: 'auto', textAlign: 'left' }}>
                              {products
                                .filter(p => p.businessId === activeBusiness?.id)
                                .filter(p =>
                                  !searchItemQuery ||
                                  p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
                                  (p.sku && p.sku.toLowerCase().includes(searchItemQuery.toLowerCase())) ||
                                  (p.barcode && p.barcode.includes(searchItemQuery))
                                )
                                .map(p => (
                                  <div
                                    key={p.id}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '12px', color: '#1F2937' }}
                                    onMouseDown={() => handleSelectProduct(item.id, p)}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F3F4F6';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFFFFF';
                                    }}
                                  >
                                    <strong>{p.name}</strong> <span style={{ color: '#6B7280' }}>({p.sku || 'No SKU'})</span> - Purchase: ₹{p.purchasePrice || 0}
                                  </div>
                                ))}
                              {products
                                .filter(p => p.businessId === activeBusiness?.id)
                                .filter(p =>
                                  !searchItemQuery ||
                                  p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
                                  (p.sku && p.sku.toLowerCase().includes(searchItemQuery.toLowerCase())) ||
                                  (p.barcode && p.barcode.includes(searchItemQuery))
                                ).length === 0 && (
                                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#9CA3AF' }}>No products match</div>
                                )}
                            </div>
                          )}
                        </td>
                        <td style={styles.gridTd}>
                          <input type="number" className="form-control" style={styles.gridInput} placeholder="0" value={item.qty || ''} onChange={(e) => handleUpdateRow(item.id, 'qty', e.target.value)} />
                        </td>
                        <td style={styles.gridTd}>
                          <select style={styles.gridSelect} value={item.unit} onChange={(e) => handleUpdateRow(item.id, 'unit', e.target.value)}>
                            <option value="NONE">NONE</option>
                            <option value="BAGS">BAGS</option>
                            <option value="BOXES">BOXES</option>
                            {item.unit && !['NONE', 'BAGS', 'BOXES'].includes(item.unit) && (
                              <option value={item.unit}>{item.unit.toUpperCase()}</option>
                            )}
                          </select>
                        </td>
                        <td style={styles.gridTd}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input type="number" className="form-control" style={{ ...styles.gridInput, flex: 1 }} placeholder="0.00" value={item.priceUnit || ''} onChange={(e) => handleUpdateRow(item.id, 'priceUnit', e.target.value)} />
                            <select style={styles.gridSelectInline} value={item.priceTaxMode} onChange={(e) => handleUpdateRow(item.id, 'priceTaxMode', e.target.value)}>
                              <option value="Without Tax">Without Tax</option>
                              <option value="With Tax">With Tax</option>
                            </select>
                          </div>
                        </td>
                        <td style={styles.gridTd}>
                          <select style={styles.gridSelect} value={item.taxPercentage} onChange={(e) => handleUpdateRow(item.id, 'taxPercentage', e.target.value)}>
                            <option value="0">Select</option>
                            <option value="5">GST@5%</option>
                            <option value="12">GST@12%</option>
                            <option value="18">GST@18%</option>
                            {item.taxPercentage && !['0', '5', '12', '18'].includes(String(item.taxPercentage)) && (
                              <option value={item.taxPercentage}>GST@{item.taxPercentage}%</option>
                            )}
                          </select>
                        </td>
                        <td style={styles.gridTdCalc}>₹{item.taxAmount.toFixed(2)}</td>
                        <td style={styles.gridTdCalc}>₹{item.amount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '4px', textAlign: 'center' }}>
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleRemoveRow(item.id)}><Trash2 size={14} color="#EF4444" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.gridActionRow}>
                <button type="button" style={styles.addGridRowBtn} onClick={handleAddRow}>ADD ROW</button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>TOTAL: ₹ {totalAmount.toFixed(2)}</span>
              </div>

              <div style={styles.bottomBlock}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Payment Type</label>
                      <select style={styles.bottomSelect} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <button type="button" style={styles.linkBtn} onClick={() => setShowPaymentTypeOptions(!showPaymentTypeOptions)}>+ Add Payment type</button>
                    {showPaymentTypeOptions && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {['UPI', 'Bank Transfer', 'Card', 'Credit'].map(t => (
                          <button key={t} type="button" style={{ ...styles.linkBtn, fontSize: '11px', padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: paymentType === t ? 'var(--color-primary)' : 'transparent', color: paymentType === t ? '#fff' : '#4B5563' }} onClick={() => { setPaymentType(t); setShowPaymentTypeOptions(false); }}>{t}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {renderPaymentDetailsForm()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="roundoffOrder" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} />
                    <label htmlFor="roundoffOrder" style={{ fontSize: '12px', color: '#4B5563' }}>Round Off</label>
                    <input type="text" style={styles.smallInput} disabled placeholder="0.00" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', fontSize: '12px', color: '#4B5563', marginRight: '8px', marginBottom: '6px' }}>
                    <div>Subtotal: ₹{items.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.priceUnit || 0)), 0).toFixed(2)}</div>
                    <div>GST Amount: ₹{items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="roundoffOrder" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} />
                    <label htmlFor="roundoffOrder" style={{ fontSize: '12px', color: '#4B5563' }}>Round Off</label>
                    <input type="text" style={styles.smallInput} disabled value={roundOff ? (Math.round(totalAmount) - totalAmount).toFixed(2) : "0.00"} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937' }}>Total</span>
                    <input type="text" style={styles.totalDisplayInput} value={(roundOff ? Math.round(totalAmount) : totalAmount).toFixed(2)} disabled />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <div />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={styles.shareBtn}><span>Share</span><Share2 size={12} /></button>
                  <button type="button" style={styles.saveBtnBlue} onClick={savePurchaseOrder}>Save</button>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* E. DEBIT NOTE (PURCHASE RETURN) FORM MODAL (4th Screenshot) */}
      {showDebitNoteModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Undo size={18} color="#3B82F6" />
                <span style={styles.modalTitle}>Debit Note</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <Calculator size={16} color="#9CA3AF" style={{ cursor: 'pointer' }} onClick={triggerCalculator} />
                <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => { setShowDebitNoteModal(false); resetForm(); }} />
              </div>
            </div>

            <div style={{ padding: '20px' }}>
              <div style={styles.formRowFields}>
                <div style={{ flex: 1.5, display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1.5 }}>
                    <label style={styles.fieldLabel}>Party *</label>
                    <select
                      className="form-control"
                      style={styles.modalSelect}
                      value={partyId}
                      onChange={(e) => handlePartySelect(e.target.value)}
                    >
                      <option value="">Select Party</option>
                      {customers.filter(c => c.businessId === activeBusiness?.id).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Phone No.</label>
                    <input type="text" className="form-control" style={styles.modalInput} placeholder="Phone No." value={partyPhone} onChange={(e) => setPartyPhone(e.target.value)} />
                  </div>
                </div>

                <div style={{ flex: 2, display: 'flex', gap: '12px' }}>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Return No.</label>
                    <input type="text" className="form-control" style={styles.modalInput} value={returnNo} onChange={(e) => setReturnNo(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Bill Number</label>
                    <input type="text" className="form-control" style={styles.modalInput} placeholder="Original Bill No." value={origBillNo} onChange={(e) => setOrigBillNo(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Bill Date</label>
                    <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={origBillDate} onChange={(e) => setOrigBillDate(e.target.value)} />
                  </div>
                  <div className="form-group" style={{ flex: 1 }}>
                    <label style={styles.fieldLabel}>Date</label>
                    <input type="text" placeholder="DD/MM/YYYY" className="form-control" style={styles.modalInput} value={billDate} onChange={(e) => setBillDate(e.target.value)} />
                  </div>
                </div>
              </div>

              {/* Debit Note Grid Table */}
              <div style={{ marginTop: '20px', overflow: 'visible' }}>
                <table style={styles.gridTable}>
                  <thead>
                    <tr>
                      <th style={styles.gridTh}>#</th>
                      <th style={styles.gridTh}>ITEM</th>
                      <th style={styles.gridTh}>QTY</th>
                      <th style={styles.gridTh}>UNIT</th>
                      <th style={styles.gridTh}>PRICE/UNIT</th>
                      <th style={styles.gridTh} colSpan={2}>TAX</th>
                      <th style={styles.gridTh}>AMOUNT</th>
                      <th style={styles.gridTh}></th>
                    </tr>
                    <tr>
                      <th style={styles.gridThSub} colSpan={5}></th>
                      <th style={styles.gridThSub}>%</th>
                      <th style={styles.gridThSub}>AMOUNT</th>
                      <th style={styles.gridThSub} colSpan={2}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, idx) => (
                      <tr key={item.id}>
                        <td style={styles.gridTdIndex}>{idx + 1}</td>
                        <td style={{ ...styles.gridTd, position: 'relative' }}>
                          <input
                            type="text"
                            className="form-control"
                            style={styles.gridInput}
                            placeholder="Enter Item Description"
                            value={item.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              handleUpdateRow(item.id, 'name', val);
                              setActiveSearchRowId(item.id);
                              setSearchItemQuery(val);
                            }}
                            onFocus={() => {
                              setActiveSearchRowId(item.id);
                              setSearchItemQuery(item.name);
                            }}
                            onBlur={() => {
                              setTimeout(() => {
                                setActiveSearchRowId(null);
                                setSearchItemQuery('');
                              }, 200);
                            }}
                          />
                          {activeSearchRowId === item.id && (
                            <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '4px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', zIndex: 99, maxHeight: '150px', overflowY: 'auto', textAlign: 'left' }}>
                              {products
                                .filter(p => p.businessId === activeBusiness?.id)
                                .filter(p =>
                                  !searchItemQuery ||
                                  p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
                                  (p.sku && p.sku.toLowerCase().includes(searchItemQuery.toLowerCase())) ||
                                  (p.barcode && p.barcode.includes(searchItemQuery))
                                )
                                .map(p => (
                                  <div
                                    key={p.id}
                                    style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #F3F4F6', fontSize: '12px', color: '#1F2937' }}
                                    onMouseDown={() => handleSelectProduct(item.id, p)}
                                    onMouseEnter={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#F3F4F6';
                                    }}
                                    onMouseLeave={(e) => {
                                      (e.currentTarget as HTMLDivElement).style.backgroundColor = '#FFFFFF';
                                    }}
                                  >
                                    <strong>{p.name}</strong> <span style={{ color: '#6B7280' }}>({p.sku || 'No SKU'})</span> - Purchase: ₹{p.purchasePrice || 0}
                                  </div>
                                ))}
                              {products
                                .filter(p => p.businessId === activeBusiness?.id)
                                .filter(p =>
                                  !searchItemQuery ||
                                  p.name.toLowerCase().includes(searchItemQuery.toLowerCase()) ||
                                  (p.sku && p.sku.toLowerCase().includes(searchItemQuery.toLowerCase())) ||
                                  (p.barcode && p.barcode.includes(searchItemQuery))
                                ).length === 0 && (
                                  <div style={{ padding: '8px 12px', fontSize: '11px', color: '#9CA3AF' }}>No products match</div>
                                )}
                            </div>
                          )}
                        </td>
                        <td style={styles.gridTd}>
                          <input type="number" className="form-control" style={styles.gridInput} placeholder="0" value={item.qty || ''} onChange={(e) => handleUpdateRow(item.id, 'qty', e.target.value)} />
                        </td>
                        <td style={styles.gridTd}>
                          <select style={styles.gridSelect} value={item.unit} onChange={(e) => handleUpdateRow(item.id, 'unit', e.target.value)}>
                            <option value="NONE">NONE</option>
                            <option value="BAGS">BAGS</option>
                            <option value="BOXES">BOXES</option>
                            {item.unit && !['NONE', 'BAGS', 'BOXES'].includes(item.unit) && (
                              <option value={item.unit}>{item.unit.toUpperCase()}</option>
                            )}
                          </select>
                        </td>
                        <td style={styles.gridTd}>
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <input type="number" className="form-control" style={{ ...styles.gridInput, flex: 1 }} placeholder="0.00" value={item.priceUnit || ''} onChange={(e) => handleUpdateRow(item.id, 'priceUnit', e.target.value)} />
                            <select style={styles.gridSelectInline} value={item.priceTaxMode} onChange={(e) => handleUpdateRow(item.id, 'priceTaxMode', e.target.value)}>
                              <option value="Without Tax">Without Tax</option>
                              <option value="With Tax">With Tax</option>
                            </select>
                          </div>
                        </td>
                        <td style={styles.gridTd}>
                          <select style={styles.gridSelect} value={item.taxPercentage} onChange={(e) => handleUpdateRow(item.id, 'taxPercentage', e.target.value)}>
                            <option value="0">Select</option>
                            <option value="5">GST@5%</option>
                            <option value="12">GST@12%</option>
                            <option value="18">GST@18%</option>
                            {item.taxPercentage && !['0', '5', '12', '18'].includes(String(item.taxPercentage)) && (
                              <option value={item.taxPercentage}>GST@{item.taxPercentage}%</option>
                            )}
                          </select>
                        </td>
                        <td style={styles.gridTdCalc}>₹{item.taxAmount.toFixed(2)}</td>
                        <td style={styles.gridTdCalc}>₹{item.amount.toFixed(2)}</td>
                        <td style={{ border: '1px solid #E5E7EB', padding: '4px', textAlign: 'center' }}>
                          <button type="button" style={{ background: 'none', border: 'none', cursor: 'pointer' }} onClick={() => handleRemoveRow(item.id)}><Trash2 size={14} color="#EF4444" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div style={styles.gridActionRow}>
                <button type="button" style={styles.addGridRowBtn} onClick={handleAddRow}>ADD ROW</button>
                <span style={{ fontSize: '13px', fontWeight: '700', color: '#1F2937' }}>TOTAL: ₹ {totalAmount.toFixed(2)}</span>
              </div>

              <div style={styles.bottomBlock}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-start', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Payment Type</label>
                      <select style={styles.bottomSelect} value={paymentType} onChange={(e) => setPaymentType(e.target.value)}>
                        <option value="Cash">Cash</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Online">Online</option>
                      </select>
                    </div>
                    <button type="button" style={styles.linkBtn} onClick={() => setShowPaymentTypeOptions(!showPaymentTypeOptions)}>+ Add Payment type</button>
                    {showPaymentTypeOptions && (
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '4px' }}>
                        {['UPI', 'Bank Transfer', 'Card', 'Credit'].map(t => (
                          <button key={t} type="button" style={{ ...styles.linkBtn, fontSize: '11px', padding: '2px 8px', border: '1px solid #D1D5DB', borderRadius: '4px', background: paymentType === t ? 'var(--color-primary)' : 'transparent', color: paymentType === t ? '#fff' : '#4B5563' }} onClick={() => { setPaymentType(t); setShowPaymentTypeOptions(false); }}>{t}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  {renderPaymentDetailsForm()}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'flex-end' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="roundoffDN" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} />
                    <label htmlFor="roundoffDN" style={{ fontSize: '12px', color: '#4B5563' }}>Round Off</label>
                    <input type="text" style={styles.smallInput} disabled placeholder="0.00" />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end', fontSize: '12px', color: '#4B5563', marginRight: '8px', marginBottom: '6px' }}>
                    <div>Subtotal: ₹{items.reduce((acc, curr) => acc + ((curr.qty || 0) * (curr.priceUnit || 0)), 0).toFixed(2)}</div>
                    <div>GST Amount: ₹{items.reduce((acc, curr) => acc + (curr.taxAmount || 0), 0).toFixed(2)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input type="checkbox" id="roundoffDN" checked={roundOff} onChange={(e) => setRoundOff(e.target.checked)} />
                    <label htmlFor="roundoffDN" style={{ fontSize: '12px', color: '#4B5563' }}>Round Off</label>
                    <input type="text" style={styles.smallInput} disabled value={roundOff ? (Math.round(totalAmount) - totalAmount).toFixed(2) : "0.00"} />
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '700', color: '#1F2937' }}>Total</span>
                    <input type="text" style={styles.totalDisplayInput} value={(roundOff ? Math.round(totalAmount) : totalAmount).toFixed(2)} disabled />
                  </div>
                </div>
              </div>

              <div style={styles.modalFooter}>
                <div />
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="button" style={styles.shareBtn}><span>Share</span><Share2 size={12} /></button>
                  <button type="button" style={styles.saveBtnBlue} onClick={saveDebitNote}>Save</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Preview Modal */}
      {showPreviewModal && selectedBill && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, maxWidth: '800px', width: '95%' }}>
            
            {/* Action Bar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#F9FAFB', padding: '12px 20px', borderBottom: '1px solid #E5E7EB' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedBill.contactAddress && selectedBill.contactAddress.startsWith('http') && (
                  <>
                    {!viewingUploaded ? (
                      <button 
                        type="button" 
                        className="btn btn-secondary" 
                        style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                        onClick={() => setViewingUploaded(true)}
                      >
                        <Eye size={12} />
                        <span>View Uploaded Bill</span>
                      </button>
                    ) : (
                      <>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                          onClick={() => setViewingUploaded(false)}
                        >
                          <Eye size={12} />
                          <span>View Invoice Slip</span>
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-primary" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px' }}
                          onClick={() => downloadUploadedFile(selectedBill.contactAddress)}
                        >
                          <Download size={12} />
                          <span>Download Uploaded Bill</span>
                        </button>
                        <button 
                          type="button" 
                          className="btn btn-secondary" 
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#10B981', borderColor: '#10B981' }}
                          onClick={() => printUploadedFile(selectedBill.contactAddress)}
                        >
                          <Printer size={12} />
                          <span>Print Uploaded Bill</span>
                        </button>
                      </>
                    )}
                  </>
                )}
              </div>
              <X size={18} style={{ cursor: 'pointer', color: '#9CA3AF' }} onClick={() => setShowPreviewModal(false)} />
            </div>

            {/* Premium Invoice Layout */}
            <div id="print-area" className="print-section" style={{ padding: '30px', backgroundColor: '#FFFFFF', color: '#1F2937', fontFamily: "'Inter', sans-serif", display: viewingUploaded ? 'none' : 'block' }}>
              
              {/* Header Badging */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <span style={{ backgroundColor: '#0B2545', color: '#FFFFFF', padding: '6px 24px', borderRadius: '4px', fontSize: '12px', fontWeight: '800', letterSpacing: '1px' }}>
                  {selectedBill.type.toUpperCase()}
                </span>
              </div>

              {/* Main Company & Details */}
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
                      <span style={{ fontSize: '10px', color: '#6B7280', fontStyle: 'italic' }}>Your One Stop Solution</span>
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
                  <h3 style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#8F5B1E', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Document Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Ref/Bill No:</span>
                      <strong style={{ color: '#1F2937' }}>{selectedBill.invoiceNo}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Date:</span>
                      <strong>{formatDateDDMMYYYY(selectedBill.date)}</strong>
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
                <h4 style={{ margin: '0 0 6px 0', fontSize: '12px', color: '#8F5B1E', textTransform: 'uppercase' }}>Details of Party</h4>
                <div style={{ fontSize: '12px', color: '#1F2937' }}>
                  <strong style={{ fontSize: '14px' }}>{selectedBill.contactName}</strong>
                  {selectedBill.phone && <div style={{ color: '#4B5563', marginTop: '2px' }}>📞 {selectedBill.contactPhone}</div>}
                </div>
              </div>

              {/* Total Block */}
              <div className="invoice-grid" style={{ marginTop: '10px', borderTop: '1px solid #E5E7EB', paddingTop: '14px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', fontStyle: 'italic', padding: '10px', backgroundColor: '#F9FAFB', borderRadius: '6px' }}>
                    "Thank you for doing business with us. Computer generated slip."
                  </div>
                </div>

                <div style={{ fontSize: '11px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', backgroundColor: '#0B2545', color: '#FFFFFF', borderRadius: '4px', fontSize: '13px', fontWeight: '800' }}>
                    <span>GRAND TOTAL (₹)</span>
                    <span>₹{selectedBill.totalAmount.toFixed(2)}</span>
                  </div>
                  {selectedBill.paymentType && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '4px 12px', fontSize: '11px', color: '#6B7280' }}>
                      <span>Payment Method:</span>
                      <span>{selectedBill.paymentType}</span>
                    </div>
                  )}
                  {(() => {
                    if (!selectedBill.chequeNo) return null;
                    try {
                      const details = JSON.parse(selectedBill.chequeNo);
                      return (
                        <div style={{ padding: '8px 12px', backgroundColor: '#F3F4F6', borderRadius: '6px', margin: '4px 12px 10px 12px', fontSize: '11px', color: '#374151', border: '1px solid #E5E7EB' }}>
                          <strong style={{ display: 'block', marginBottom: '4px', color: '#1F2937' }}>Payment Details:</strong>
                          {details.utrNumber && <div><strong>UTR / Ref No:</strong> {details.utrNumber}</div>}
                          {details.accountNumber && <div><strong>Account No:</strong> {details.accountNumber}</div>}
                          {details.ifscCode && <div><strong>IFSC Code:</strong> {details.ifscCode}</div>}
                          {details.upiId && <div><strong>UPI ID:</strong> {details.upiId}</div>}
                          {details.transactionId && <div><strong>Txn ID:</strong> {details.transactionId}</div>}
                          {details.cardLast4 && <div><strong>Card Last 4:</strong> {details.cardLast4}</div>}
                          {details.creditDueDate && <div><strong>Credit Due Date:</strong> {details.creditDueDate}</div>}
                          {details.paidAmount && <div><strong>Paid Amount:</strong> ₹{parseFloat(details.paidAmount).toFixed(2)}</div>}
                          {details.paymentNote && <div style={{ fontStyle: 'italic', marginTop: '4px', borderTop: '1px solid #E5E7EB', paddingTop: '4px' }}><strong>Note:</strong> {details.paymentNote}</div>}
                        </div>
                      );
                    } catch {
                      return null;
                    }
                  })()}
                </div>
              </div>

                            {/* Signatory */}
              <div className="invoice-grid" style={{ borderTop: '1px solid #E5E7EB', marginTop: '30px', paddingTop: '16px', fontSize: '10px', color: '#4B5563' }}>
                <div>
                  <h4 style={{ margin: '0 0 6px 0', color: '#8F5B1E', textTransform: 'uppercase' }}>Terms & Conditions</h4>
                  <ul style={{ paddingLeft: '14px', margin: 0, lineHeight: '1.5' }}>
                    <li>Subject to Nashik jurisdiction.</li>
                    <li>This is a computer-generated slip.</li>
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

            {viewingUploaded && selectedBill.contactAddress && (
              <div style={{ padding: '30px', backgroundColor: '#FFFFFF', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
                <img 
                  src={selectedBill.contactAddress} 
                  alt="Uploaded Bill" 
                  style={{ maxWidth: '100%', maxHeight: '600px', objectFit: 'contain', borderRadius: '8px', border: '1px solid #E5E7EB' }} 
                />
              </div>
            )}

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
  iconCircleRed: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '20px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#6B7280',
    maxWidth: '460px',
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
    fontSize: '13.5px',
    color: '#6B7280',
    marginBottom: '24px',
  },
  goldBtn: {
    padding: '10px 24px',
    backgroundColor: '#F59E0B',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '13.5px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)',
  },
  redBtn: {
    padding: '10px 24px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '24px',
    fontWeight: '600',
    fontSize: '13.5px',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.2)',
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
  modalContent: {
    backgroundColor: '#F3F4F6',
    borderRadius: '12px',
    width: '1080px',
    maxWidth: '95vw',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    overflowY: 'auto' as const,
    maxHeight: '90vh',
  },
  modalContentSmall: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    width: '720px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#1F2937',
  },
  formRowFields: {
    display: 'flex',
    gap: '16px',
    backgroundColor: '#FFFFFF',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    flexWrap: 'wrap' as const,
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
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '12.5px',
    color: '#1F2937',
    width: '100%',
    outline: 'none',
  },
  modalSelect: {
    padding: '8px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    fontSize: '12.5px',
    color: '#1F2937',
    width: '100%',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  gridTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #E5E7EB',
  },
  gridTh: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    padding: '8px 10px',
    fontSize: '10.5px',
    color: '#4B5563',
    fontWeight: '700',
    textAlign: 'center',
  },
  gridThSub: {
    backgroundColor: '#F9FAFB',
    border: '1px solid #E5E7EB',
    padding: '4px',
    fontSize: '9px',
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
    fontSize: '9.5px',
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
    padding: '12px 4px',
  },
  addGridRowBtn: {
    background: '#3B82F6',
    border: 'none',
    color: '#FFFFFF',
    fontSize: '11px',
    fontWeight: '700',
    padding: '6px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  bottomBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    padding: '16px',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    marginTop: '10px',
  },
  bottomSelect: {
    padding: '6px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '12px',
    outline: 'none',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#3B82F6',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '16px',
  },
  smallInput: {
    width: '80px',
    padding: '4px 8px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '12px',
    textAlign: 'right' as const,
  },
  totalDisplayInput: {
    width: '140px',
    padding: '6px 10px',
    border: '1px solid #D1D5DB',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '700',
    textAlign: 'right' as const,
    backgroundColor: '#F9FAFB',
  },
  modalFooter: {
    borderTop: '1px solid #E5E7EB',
    paddingTop: '16px',
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  uploadBillBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    color: '#4B5563',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  shareBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #3B82F6',
    backgroundColor: '#FFFFFF',
    color: '#3B82F6',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '12.5px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  saveBtnBlue: {
    padding: '8px 32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '12.5px',
    cursor: 'pointer',
  },
  outlinePillBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    border: '1px solid #D1D5DB',
    backgroundColor: '#FFFFFF',
    padding: '6px 14px',
    borderRadius: '16px',
    fontSize: '11px',
    color: '#4B5563',
    fontWeight: '600',
    cursor: 'pointer',
  },
  cameraIconContainer: {
    width: '28px',
    height: '28px',
    borderRadius: '4px',
    border: '1px dashed #D1D5DB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
  },
  switch: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '28px',
    height: '16px',
  },
  slider: {
    position: 'absolute' as const,
    cursor: 'pointer',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ccc',
    transition: '.4s',
    borderRadius: '16px',
  },
  // Debit Note Specific Filters styling
  filterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '12px 16px',
    borderRadius: '8px 8px 0 0',
    border: '1.5px solid #F0F4F8',
    borderBottom: 'none',
  },
  filterSelect: {
    padding: '6px 12px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '12px',
    color: '#374151',
    outline: 'none',
    backgroundColor: '#FFFFFF',
  },
  filterDateInput: {
    width: '90px',
    padding: '5px 8px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '11.5px',
    textAlign: 'center' as const,
    color: '#374151',
    backgroundColor: '#F9FAFB',
  },
  actionLink: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    background: 'none',
    border: 'none',
    color: '#4B5563',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  subFilterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: '12px 16px',
    borderLeft: '1.5px solid #F0F4F8',
    borderRight: '1.5px solid #F0F4F8',
    borderBottom: '1.5px solid #F0F4F8',
    marginBottom: '16px',
    borderRadius: '0 0 8px 8px',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '6px',
    padding: '6px 12px',
    width: '280px',
  },
  searchInput: {
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    color: '#374151',
    width: '100%',
  },
  emptyTableState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 20px',
    textAlign: 'center' as const,
  },
  emptyTableText: {
    fontSize: '13.5px',
    fontWeight: '600',
    color: '#4B5563',
    marginTop: '12px',
  },
  emptyTableSubText: {
    fontSize: '12px',
    color: '#9CA3AF',
    marginTop: '4px',
  },
  tableFooterBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    padding: '12px 16px',
    borderTop: '1px solid #E5E7EB',
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#374151',
  },
  actionBtn: {
    width: '24px',
    height: '24px',
    borderRadius: '4px',
    border: '1px solid #D1D5DB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: 'pointer',
    background: '#FFFFFF',
  }
};
