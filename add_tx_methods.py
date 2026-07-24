import sys
import re

with open('src/context/AppContext.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add to AppContextProps
interface_old = "  deleteTransaction: (id: string) => Promise<void>;"
interface_new = """  deleteTransaction: (id: string) => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id' | 'businessId'>) => Promise<void>;
  updateTransaction: (id: string, updates: Partial<Transaction>) => Promise<void>;"""
if "addTransaction:" not in content:
    content = content.replace(interface_old, interface_new)

# 2. Add implementation
add_new = """  const addTransaction = async (tx: Omit<Transaction, 'id' | 'businessId'>) => {
    if (user) {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          user_id: user.id,
          business_id: currentBusinessId,
          type: tx.type,
          invoice_no: tx.invoiceNo || null,
          date: tx.date || null,
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
          payment_date: tx.paymentDate || null,
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
        type: data.type,
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
        paymentDate: data.payment_date,
        chequeNo: data.cheque_no,
        bankName: data.bank_name,
        ifscCode: data.ifsc_code
      };
      setTransactions(prev => [newTx, ...prev]);
    } else {
      const newTx: Transaction = { ...tx, id: Date.now().toString(), businessId: activeBusiness?.id } as Transaction;
      setTransactions(prev => [newTx, ...prev]);
    }
  };

  const updateTransaction = async (id: string, updates: Partial<Transaction>) => {
    if (user) {
      const dbUpdates: any = {};
      if (updates.type !== undefined) dbUpdates.type = updates.type;
      if (updates.invoiceNo !== undefined) dbUpdates.invoice_no = updates.invoiceNo;
      if (updates.date !== undefined) dbUpdates.date = updates.date;
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
      if (updates.paymentDate !== undefined) dbUpdates.payment_date = updates.paymentDate;
      if (updates.chequeNo !== undefined) dbUpdates.cheque_no = updates.chequeNo;
      if (updates.bankName !== undefined) dbUpdates.bank_name = updates.bankName;
      if (updates.ifscCode !== undefined) dbUpdates.ifsc_code = updates.ifscCode;
      
      const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
      if (error) throw error;
    }
    setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTransaction = async (id: string) => {"""

if "const addTransaction = async" not in content:
    content = content.replace("  const deleteTransaction = async (id: string) => {", add_new)

with open('src/context/AppContext.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
