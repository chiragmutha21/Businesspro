import React from 'react';
import { useApp } from '../context/AppContext';
import { Download, CheckCircle2, ShieldCheck } from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';

export const Backup: React.FC = () => {
  const { customers, products, transactions } = useApp();

  const handleDownloadPDF = () => {
    window.print();
  };

  return (
    <div style={styles.container} className="no-print">
      
      {/* Upper Panel */}
      <div style={styles.headerBlock}>
        <div>
          <h2 style={styles.title}>Sync, Share & Backup</h2>
          <p style={styles.subtitle}>Secure your database and export offline compliance ledger backups.</p>
        </div>
      </div>

      {/* Main Card */}
      <div className="card" style={styles.mainCard}>
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
                <span>Parties Record: <strong>{customers.length} Contacts</strong></span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDot} />
                <span>Stock Items: <strong>{products.length} Products</strong></span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDot} />
                <span>Sale Transactions: <strong>{transactions.filter(t => t.type === 'sale').length} Invoices</strong></span>
              </div>
              <div style={styles.summaryItem}>
                <span style={styles.summaryDot} />
                <span>Purchase Records: <strong>{transactions.filter(t => t.type === 'purchase').length} Invoices</strong></span>
              </div>
            </div>
          </div>

          <button 
            className="btn btn-primary" 
            style={styles.downloadBtn}
            onClick={handleDownloadPDF}
          >
            <Download size={18} />
            <span>Download Your Complete Data (PDF)</span>
          </button>
          
          <div style={styles.noteBox}>
            <CheckCircle2 size={14} color="#10B981" />
            <span>All local data packages are securely packaged & compiled.</span>
          </div>
        </div>
      </div>

      {/* HIDDEN PRINT-ONLY LEDGER PREVIEW SECTION */}
      <div style={styles.printOnlyContainer} className="print-only">
        <div style={{ borderBottom: '2px solid #000000', paddingBottom: '12px', marginBottom: '24px' }}>
          <h1 style={{ fontSize: '24px', margin: 0 }}>AURALEDGER SYSTEM BACKUP REPORT</h1>
          <p style={{ fontSize: '12px', margin: '4px 0 0 0', color: '#4B5563' }}>Generated on: {formatDateDDMMYYYY('2026-07-12')}</p>
        </div>

        {/* Section 1: Parties */}
        <div style={styles.printSection}>
          <h2 style={styles.printSectionTitle}>1. PARTIES RECORD</h2>
          <table style={styles.printTable}>
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone No.</th>
                <th>GSTIN</th>
                <th>Email ID</th>
                <th>Address</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.gst || '-'}</td>
                  <td>{c.email || '-'}</td>
                  <td>{c.address || '-'}</td>
                </tr>
              ))}
              {customers.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center' }}>No Parties Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 2: Items Stock */}
        <div style={styles.printSection}>
          <h2 style={styles.printSectionTitle}>2. ITEMS & STOCK INVENTORY</h2>
          <table style={styles.printTable}>
            <thead>
              <tr>
                <th>Item Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Purchase Price</th>
                <th>Selling Price</th>
                <th>Current Stock</th>
                <th>Unit</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>{p.sku || '-'}</td>
                  <td>{p.category || '-'}</td>
                  <td>₹ {p.purchasePrice.toFixed(2)}</td>
                  <td>₹ {p.sellingPrice.toFixed(2)}</td>
                  <td>{p.stock}</td>
                  <td>{p.unit}</td>
                </tr>
              ))}
              {products.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No Stock Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Section 3: Transactions */}
        <div style={styles.printSection}>
          <h2 style={styles.printSectionTitle}>3. SALES & PURCHASE INVOICES JOURNAL</h2>
          <table style={styles.printTable}>
            <thead>
              <tr>
                <th>Date</th>
                <th>Invoice No.</th>
                <th>Party Name</th>
                <th>Type</th>
                <th>Taxable Amt</th>
                <th>GST Amount</th>
                <th>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((t) => (
                <tr key={t.id}>
                  <td>{formatDateDDMMYYYY(t.date)}</td>
                  <td>{t.invoiceNo}</td>
                  <td>{t.contactName}</td>
                  <td>{t.type.toUpperCase()}</td>
                  <td>₹ {(t.totalAmount - t.gstAmount).toFixed(2)}</td>
                  <td>₹ {t.gstAmount.toFixed(2)}</td>
                  <td>₹ {t.totalAmount.toFixed(2)}</td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center' }}>No Transactions Data Found</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

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
  downloadBtn: {
    padding: '12px 32px',
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
  noteBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    fontSize: '11.5px',
    color: '#6B7280',
    marginTop: '16px',
  },
  // Print Only Ledger Styles
  printOnlyContainer: {
    display: 'none',
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
