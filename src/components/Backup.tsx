import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Printer, CheckCircle2, ShieldCheck, Calendar, ChevronDown } from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
// @ts-ignore
import html2pdf from 'html2pdf.js';

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

export const Backup: React.FC = () => {
  const { activeBusiness, customers, products, transactions } = useApp();
  
  // Date picker states
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(new Date());
  const [openDropdown, setOpenDropdown] = useState<'mainDatePicker' | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  // Helper date parsing and filtering
  const parseDateStr = (dateStr: string) => {
    if (!dateStr) return null;
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    }
    const dmyParts = dateStr.split('/');
    if (dmyParts.length === 3) {
      return new Date(Number(dmyParts[2]), Number(dmyParts[1]) - 1, Number(dmyParts[0]));
    }
    return null;
  };

  const isWithinSelectedMonth = (dateStr: string) => {
    if (!dateStr) return false;
    const d = parseDateStr(dateStr);
    return d && d.getMonth() === activeMonthDate.getMonth() && d.getFullYear() === activeMonthDate.getFullYear();
  };

  // Filtered data based on active month
  const bizCustomers = customers.filter(c => c.businessId === activeBusiness?.id);
  const bizProducts = products.filter(p => p.businessId === activeBusiness?.id);
  const bizTransactions = transactions.filter(t => t.businessId === activeBusiness?.id && isWithinSelectedMonth(t.date));

  // Sort Sales & Purchase Invoices in Ascending order (Starting from Invoice 01, 02...)
  const salesInvoices = bizTransactions
    .filter(t => t.type?.toLowerCase() === 'sale')
    .sort((a, b) => (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' }));

  const purchaseInvoices = bizTransactions
    .filter(t => t.type?.toLowerCase() === 'purchase')
    .sort((a, b) => (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' }));

  const getDateRangeStr = () => {
    const formatMonth = (d: Date) => {
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    const startOfMonth = new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth(), 1);
    const endOfMonth = new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth() + 1, 0);
    return `${formatMonth(startOfMonth)} - ${formatMonth(endOfMonth)}`;
  };

  const handleDownloadPDF = () => {
    setIsGeneratingPDF(true);

    setTimeout(() => {
      const element = document.getElementById('backup-report-pdf');
      if (!element) {
        setIsGeneratingPDF(false);
        return;
      }

      const opt = {
        margin:       [0.4, 0.4] as [number, number],
        filename:     `backup_report_${activeMonthDate.getFullYear()}_${activeMonthDate.getMonth() + 1}.pdf`,
        image:        { type: 'jpeg' as const, quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, logging: false },
        jsPDF:        { unit: 'in' as const, format: 'letter' as const, orientation: 'portrait' as const }
      };

      html2pdf().set(opt).from(element).save().then(() => {
        setIsGeneratingPDF(false);
      }).catch(() => {
        setIsGeneratingPDF(false);
      });
    }, 400);
  };

  const handlePrintPDF = () => {
    window.print();
  };

  const renderBusinessHeader = (title: string) => (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', borderBottom: '2px solid #E2E8F0', paddingBottom: '12px', marginBottom: '24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        {activeBusiness?.logo && (
          <img src={activeBusiness.logo} style={{ maxHeight: '40px', maxWidth: '120px', objectFit: 'contain' }} alt="Logo" />
        )}
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: '18px', color: '#1E293B', fontWeight: '800' }}>
            {activeBusiness?.name}
          </h1>
          <p style={{ margin: '0', fontSize: '10px', color: '#64748B' }}>
            {activeBusiness?.address}
          </p>
          <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748B' }}>
            Phone: {activeBusiness?.phone || '-'}
          </p>
        </div>
      </div>
      <div style={{ textAlign: 'right' }}>
        <div style={{ display: 'inline-block', backgroundColor: '#0B2545', color: '#FFFFFF', padding: '4px 10px', borderRadius: '4px', fontWeight: '700', fontSize: '9px', textTransform: 'uppercase', letterSpacing: '1px' }}>
          {title}
        </div>
        <p style={{ margin: '6px 0 0 0', fontSize: '10px', color: '#64748B' }}>
          <strong>GSTIN:</strong> {activeBusiness?.gst || '-'}
        </p>
        <p style={{ margin: '2px 0 0 0', fontSize: '10px', color: '#64748B' }}>
          <strong>Month:</strong> {activeMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </p>
      </div>
    </div>
  );

  return (
    <div style={styles.container}>
      {isGeneratingPDF && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          gap: '16px'
        }}>
          <style>{`
            @keyframes backup-spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
          <div style={{
            width: '45px',
            height: '45px',
            border: '4px solid #E5E7EB',
            borderTop: '4px solid #0B2545',
            borderRadius: '50%',
            animation: 'backup-spin 1s linear infinite'
          }} />
          <span style={{ fontSize: '15px', fontWeight: '700', color: '#0B2545' }}>Generating PDF Backup... Please wait</span>
        </div>
      )}
      
      {/* Upper Panel */}
      <div style={styles.headerBlock} className="no-print">
        <div>
          <h2 style={styles.title}>Sync, Share & Backup</h2>
          <p style={styles.subtitle}>Secure your database and export offline compliance ledger backups.</p>
        </div>

        {/* Dynamic Month Selection */}
        <div style={{ position: 'relative' }}>
          <div 
            style={styles.datePickerBtn}
            onClick={() => setOpenDropdown(openDropdown === 'mainDatePicker' ? null : 'mainDatePicker')}
          >
            <Calendar size={15} color="var(--color-text-muted)" style={{ marginRight: '6px' }} />
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-primary)' }}>{getDateRangeStr()}</span>
            <ChevronDown size={14} color="var(--color-text-muted)" style={{ marginLeft: '8px' }} />
          </div>

          {openDropdown === 'mainDatePicker' && (
            <div style={styles.mainMonthPickerDropdown}>
              <div style={styles.pickerYearHeader}>
                <button 
                  type="button" 
                  style={styles.pickerYearBtn} 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newD = new Date(activeMonthDate);
                    newD.setFullYear(activeMonthDate.getFullYear() - 1);
                    setActiveMonthDate(newD);
                  }}
                >
                  &lt;
                </button>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--color-primary)' }}>
                  {activeMonthDate.getFullYear()}
                </span>
                <button 
                  type="button" 
                  style={styles.pickerYearBtn} 
                  onClick={(e) => {
                    e.stopPropagation();
                    const newD = new Date(activeMonthDate);
                    newD.setFullYear(activeMonthDate.getFullYear() + 1);
                    setActiveMonthDate(newD);
                  }}
                >
                  &gt;
                </button>
              </div>
              <div style={styles.pickerMonthsGrid}>
                {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((mName, mIdx) => {
                  const isSelected = activeMonthDate.getMonth() === mIdx;
                  return (
                    <div
                      key={mIdx}
                      style={{
                        ...styles.pickerMonthCell,
                        backgroundColor: isSelected ? '#0B2545' : 'transparent',
                        color: isSelected ? '#FFFFFF' : 'var(--color-primary)',
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        const newD = new Date(activeMonthDate);
                        newD.setMonth(mIdx);
                        setActiveMonthDate(newD);
                        setOpenDropdown(null);
                      }}
                    >
                      {mName}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Card */}
      <div className="card no-print" style={styles.mainCard}>
        <div style={styles.flexLeft}>
          <div style={styles.iconCircle}>
            <ShieldCheck size={48} color="#10B981" />
          </div>
          
          <h3 style={styles.cardHeader}>Download Your Complete Data</h3>
          <p style={styles.cardDesc}>
            Generate and export a unified financial statement report. This compiles all your input data step-by-step (Parties, Stock Inventory, Sale Invoices, Purchase Bills, and Expense ledgers) into a clean, clear PDF format for accounting purposes.
          </p>

          {/* System Data Summary */}
          <div style={styles.summaryBox}>
            <h4 style={styles.summaryTitle}>Backup Package Summary</h4>
            <div style={styles.summaryGrid}>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDot} />
                <span>Parties Record: <strong>{bizCustomers.length} Contacts</strong></span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDot} />
                <span>Stock Items: <strong>{bizProducts.length} Products</strong></span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDot} />
                <span>Sale Transactions: <strong>{salesInvoices.length} Invoices</strong></span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDot} />
                <span>Purchase Records: <strong>{purchaseInvoices.length} Invoices</strong></span>
              </div>
            </div>
          </div>

          <div style={styles.btnGroup}>
            <button 
              className="btn btn-primary" 
              style={styles.downloadBtn}
              onClick={handleDownloadPDF}
            >
              <Download size={18} />
              <span>Download PDF Backup</span>
            </button>

            <button 
              className="btn" 
              style={styles.printBtn}
              onClick={handlePrintPDF}
            >
              <Printer size={18} />
              <span>Print PDF Backup</span>
            </button>
          </div>
          
          <div style={styles.noteBox}>
            <CheckCircle2 size={14} color="#10B981" />
            <span>All local data packages are securely packaged & compiled.</span>
          </div>
        </div>
      </div>

      {/* HIDDEN PRINT-ONLY LEDGER PREVIEW SECTION */}
      <div 
        id="backup-report-pdf" 
        style={{
          ...styles.printOnlyContainer,
          display: isGeneratingPDF ? 'block' : 'none',
          position: isGeneratingPDF ? 'relative' : 'absolute',
          left: isGeneratingPDF ? '0' : '-9999px',
          top: isGeneratingPDF ? '0' : '-9999px',
          color: '#1F2937'
        }} 
        className="print-section print-only"
      >
        
        {/* Section 1: Parties - Page 1 */}
        <div style={styles.printSection}>
          {renderBusinessHeader('PARTIES RECORD BACKUP')}
          <table style={styles.printTable}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Name</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Phone No.</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>GSTIN</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Email ID</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Address</th>
              </tr>
            </thead>
            <tbody>
              {bizCustomers.map((c) => (
                <tr key={c.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{c.name}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{c.phone}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{c.gst || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{c.email || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{c.address || '-'}</td>
                </tr>
              ))}
              {bizCustomers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '16px' }}>No Parties Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Items Stock - Page 2 */}
        <div style={{ ...styles.printSection, pageBreakBefore: 'always' }}>
          {renderBusinessHeader('STOCK INVENTORY BACKUP')}
          <table style={styles.printTable}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Item Name</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>SKU</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Category</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right' }}>Purchase Price</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right' }}>Selling Price</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>Current Stock</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'center' }}>Unit</th>
              </tr>
            </thead>
            <tbody>
              {bizProducts.map((p) => (
                <tr key={p.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{p.name}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{p.sku || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{p.category || '-'}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right' }}>₹ {p.purchasePrice.toFixed(2)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right' }}>₹ {p.sellingPrice.toFixed(2)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>{p.stock}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'center' }}>{p.unit}</td>
                </tr>
              ))}
              {bizProducts.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '16px' }}>No Stock Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Local Styles for page-breaking and styling tr elements */}
        <style>{`
          @media print {
            #backup-report-pdf {
              display: block !important;
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
            }
          }
          #backup-report-pdf tr {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
          #backup-report-pdf td {
            word-break: break-word;
          }
        `}</style>

        {/* Section 3: Sales Journal - Page 3 */}
        <div style={{ ...styles.printSection, pageBreakBefore: 'always' }}>
          {renderBusinessHeader('SALES JOURNAL BACKUP')}
          <table style={styles.printTable}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left', width: '85px' }}>Date</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left', width: '95px' }}>Invoice No.</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Party Name</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left', width: '60px' }}>Type</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', width: '90px' }}>Taxable Amt</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', width: '85px' }}>GST Amount</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', width: '100px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {salesInvoices.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{formatDateDDMMYYYY(t.date)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{t.invoiceNo}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{t.contactName}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', fontWeight: '600' }}>SALE</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right' }}>₹ {(t.totalAmount - (t.gstAmount || 0)).toFixed(2)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right' }}>₹ {(t.gstAmount || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right', fontWeight: '600' }}>₹ {t.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
              {salesInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '16px' }}>No Sales Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 4: Purchase Journal - Page 4 */}
        <div style={{ ...styles.printSection, pageBreakBefore: 'always' }}>
          {renderBusinessHeader('PURCHASE JOURNAL BACKUP')}
          <table style={styles.printTable}>
            <thead>
              <tr style={{ backgroundColor: '#F8FAFC' }}>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left', width: '85px' }}>Date</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left', width: '95px' }}>Bill No.</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left' }}>Party Name</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'left', width: '60px' }}>Type</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', width: '90px' }}>Taxable Amt</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', width: '85px' }}>GST Amount</th>
                <th style={{ padding: '8px', borderBottom: '1px solid #E2E8F0', textAlign: 'right', width: '100px' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {purchaseInvoices.map((t) => (
                <tr key={t.id}>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{formatDateDDMMYYYY(t.date)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{t.invoiceNo}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9' }}>{t.contactName}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', fontWeight: '600' }}>PURCHASE</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right' }}>₹ {(t.totalAmount - (t.gstAmount || 0)).toFixed(2)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right' }}>₹ {(t.gstAmount || 0).toFixed(2)}</td>
                  <td style={{ padding: '8px', borderBottom: '1px solid #F1F5F9', textAlign: 'right', fontWeight: '600' }}>₹ {t.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
              {purchaseInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '16px' }}>No Purchase Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 5: Individual Detailed Sale Invoices - Pages 5+ (Rendered only during native browser printing to prevent html2canvas size crashes) */}
        {!isGeneratingPDF && salesInvoices.map((inv) => {
          const subtotal = (inv.products || []).reduce((acc: number, p: any) => acc + p.total, 0);
          const totalWithGst = subtotal + (inv.gstAmount || 0);
          const roundOffVal = inv.totalAmount - totalWithGst;

          return (
            <div key={inv.id} style={{ ...styles.printSection, pageBreakBefore: 'always', padding: '10px 0' }}>
              {/* Header Badging */}
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <span style={{ backgroundColor: '#0B2545', color: '#FFFFFF', padding: '6px 24px', borderRadius: '4px', fontSize: '13px', fontWeight: '800', letterSpacing: '1px' }}>
                  TAX INVOICE
                </span>
              </div>

              {/* Main Company & Invoice Details Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                    {activeBusiness?.logo ? (
                      <img src={activeBusiness.logo} style={{ maxHeight: '40px', maxWidth: '100px', objectFit: 'contain' }} alt="Logo" />
                    ) : (
                      <div style={{ fontSize: '18px', fontWeight: '800', color: '#0B2545' }}>M</div>
                    )}
                    <h2 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#0B2545', textTransform: 'uppercase' }}>
                      {activeBusiness?.name}
                    </h2>
                  </div>
                  <div style={{ fontSize: '10px', color: '#4B5563', lineHeight: '1.4' }}>
                    <div>📍 {activeBusiness?.address}</div>
                    <div>📞 {activeBusiness?.phone}</div>
                    {activeBusiness?.email && <div>✉️ {activeBusiness.email}</div>}
                    {activeBusiness?.gst && <div style={{ marginTop: '4px' }}><strong>GSTIN:</strong> {activeBusiness.gst}</div>}
                    {activeBusiness?.pan && <div><strong>PAN:</strong> {activeBusiness.pan}</div>}
                  </div>
                </div>

                <div style={{ backgroundColor: '#FCFBF7', border: '1px solid #F3EFE0', borderRadius: '6px', padding: '10px', fontSize: '10px', minWidth: '180px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '11px', color: '#8F5B1E', textTransform: 'uppercase' }}>Invoice Details</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Invoice No:</span>
                      <strong style={{ color: '#1F2937' }}>{inv.invoiceNo}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>Invoice Date:</span>
                      <strong>{formatDateDDMMYYYY(inv.date)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#6B7280' }}>State:</span>
                      <strong>{activeBusiness?.state || 'Maharashtra'}</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bill To */}
              <div style={{ borderTop: '1px solid #E5E7EB', paddingTop: '10px', marginBottom: '16px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '11px', color: '#000000', fontWeight: '800' }}>BILL TO</h4>
                <div style={{ fontSize: '10px', color: '#1F2937' }}>
                  <strong>{inv.contactName}</strong>
                  {inv.contactPhone && <div>Phone: {inv.contactPhone}</div>}
                  {inv.contactAddress && <div>Address: {inv.contactAddress}</div>}
                  {inv.contactGst && <div>GSTIN: {inv.contactGst}</div>}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '20px' }}>
                <thead>
                  <tr style={{ backgroundColor: '#0B2545', color: '#FFFFFF', fontSize: '11px', textTransform: 'uppercase' }}>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>SI No.</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>Description of Goods</th>
                    <th style={{ padding: '8px 8px', textAlign: 'left' }}>HSN/SAC</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>Quantity</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Rate</th>
                    <th style={{ padding: '8px 8px', textAlign: 'center' }}>per</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>GST Rate</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Disc. %</th>
                    <th style={{ padding: '8px 8px', textAlign: 'right' }}>Amount</th>
                  </tr>
                </thead>
                <tbody style={{ fontSize: '11px' }}>
                  {(inv.products || []).map((p: any, idx: number) => (
                    <tr key={idx} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '8px' }}>{idx + 1}</td>
                      <td style={{ padding: '8px', fontWeight: '600' }}>{p.productName}</td>
                      <td style={{ padding: '8px' }}>{p.hsn || '96081019'}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{p.quantity} {p.unit || 'PCS'}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{p.price.toFixed(2)}</td>
                      <td style={{ padding: '8px', textAlign: 'center' }}>{p.unit || 'PCS'}</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{p.gst}%</td>
                      <td style={{ padding: '8px', textAlign: 'right' }}>{p.discountPercentage || 0}%</td>
                      <td style={{ padding: '8px', textAlign: 'right', fontWeight: '700' }}>{p.total.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Summary */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '15px', marginTop: '15px' }}>
                <div style={{ fontSize: '10px' }}>
                  <strong>Amount in Words:</strong>
                  <div style={{ color: '#4B5563', fontStyle: 'italic', marginTop: '2px', textTransform: 'capitalize' }}>
                    {numberToWords(inv.totalAmount)}
                  </div>
                </div>

                <div style={{ fontSize: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '2px' }}>
                    <span style={{ color: '#6B7280' }}>Total Amount</span>
                    <span>₹{subtotal.toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '2px' }}>
                    <span style={{ color: '#6B7280' }}>CGST (₹)</span>
                    <span>₹{(inv.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '2px' }}>
                    <span style={{ color: '#6B7280' }}>SGST (₹)</span>
                    <span>₹{(inv.gstAmount / 2).toFixed(2)}</span>
                  </div>
                  {Math.abs(roundOffVal) >= 0.01 && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #F3F4F6', paddingBottom: '2px' }}>
                      <span style={{ color: '#6B7280' }}>Round Off</span>
                      <span>{roundOffVal > 0 ? '+' : ''}{roundOffVal.toFixed(2)}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderTop: '1.5px solid #000000', color: '#000000', fontSize: '12px', fontWeight: '800' }}>
                    <span>GRAND TOTAL</span>
                    <span>₹{inv.totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Premium Footer section / Signatory */}
              <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E5E7EB', marginTop: '20px', paddingTop: '12px', fontSize: '9px', color: '#4B5563' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: '#8F5B1E', textTransform: 'uppercase', fontSize: '9px' }}>Terms & Conditions</h4>
                  <ul style={{ paddingLeft: '12px', margin: 0, lineHeight: '1.4', listStyleType: 'decimal' }}>
                    <li>Goods once sold will not be taken back without prior approval.</li>
                    <li>Subject to {activeBusiness?.state || 'Nashik'} jurisdiction.</li>
                    <li>This is a computer-generated invoice and requires no physical signature.</li>
                  </ul>
                </div>
                <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                  <div>
                    <span>For <strong>{activeBusiness?.name}</strong></span>
                    {activeBusiness?.signature ? (
                      <div style={{ marginTop: '4px' }}>
                        <img src={activeBusiness.signature} style={{ maxHeight: '30px', objectFit: 'contain' }} alt="Signature" />
                      </div>
                    ) : (
                      <div style={{ height: '30px' }} />
                    )}
                    <div style={{ borderTop: '1px solid #D1D5DB', width: '120px', marginTop: '4px', paddingTop: '2px' }}>Authorized Signatory</div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

      </div>

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    gap: '24px',
  },
  headerBlock: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    margin: 0,
  },
  subtitle: {
    margin: '4px 0 0 0',
    fontSize: '13px',
    color: '#6B7280',
  },
  mainCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1.5px solid #F0F4F8',
    padding: '40px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    textAlign: 'center' as const,
  },
  flexLeft: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    maxWidth: '580px',
  },
  iconCircle: {
    width: '96px',
    height: '96px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '24px',
  },
  cardHeader: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#1F2937',
    margin: 0,
  },
  cardDesc: {
    fontSize: '13.5px',
    color: '#6B7280',
    lineHeight: '1.6',
    marginTop: '10px',
    marginBottom: '24px',
  },
  summaryBox: {
    backgroundColor: '#F9FAFB',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '20px',
    width: '100%',
    textAlign: 'left' as const,
    marginBottom: '28px',
  },
  summaryTitle: {
    fontSize: '12.5px',
    fontWeight: '700',
    color: '#374151',
    margin: '0 0 12px 0',
    textTransform: 'uppercase',
  },
  summaryGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
  },
  summaryItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '13px',
    color: '#4B5563',
  },
  summaryDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
  },
  btnGroup: {
    display: 'flex',
    gap: '16px',
    justifyContent: 'center',
    width: '100%',
    flexWrap: 'wrap' as const,
  },
  downloadBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
  },
  printBtn: {
    padding: '12px 24px',
    borderRadius: '8px',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: '700',
    fontSize: '14px',
    cursor: 'pointer',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
  },
  noteBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    color: '#6B7280',
    marginTop: '16px',
  },
  datePickerBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    transition: 'all 0.2s',
  },
  mainMonthPickerDropdown: {
    position: 'absolute',
    top: '42px',
    right: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
    width: '220px',
    padding: '12px',
  },
  pickerYearHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
  },
  pickerYearBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: 'bold',
    color: 'var(--color-text-muted)',
    padding: '2px 8px',
    borderRadius: '4px',
  },
  pickerMonthsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '6px',
  },
  pickerMonthCell: {
    padding: '8px 0',
    textAlign: 'center',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  // Print Only Ledger Styles
  printOnlyContainer: {
    position: 'absolute',
    left: '-9999px',
    top: '-9999px',
    width: '740px',
    backgroundColor: '#FFFFFF',
    padding: '16px',
    display: 'block',
  },
  printSection: {
    marginBottom: '32px',
  },
  printSectionTitle: {
    fontSize: '14px',
    fontWeight: '700',
    borderBottom: '1px solid #000000',
    paddingBottom: '4px',
    marginBottom: '10px',
  },
  printTable: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    fontSize: '11px',
  }
};
