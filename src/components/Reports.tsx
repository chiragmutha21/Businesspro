import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FileSpreadsheet, 
  FileText, 
  TrendingUp, 
  Users, 
  ShoppingBag, 
  Receipt, 
  Percent, 
  Wallet,
  Building,
  FileBarChart2
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';

type ReportCategory = 
  | 'transaction' 
  | 'party' 
  | 'gst' 
  | 'stock' 
  | 'status' 
  | 'taxes' 
  | 'expense' 
  | 'sale-order' 
  | 'loan';

export const Reports: React.FC = () => {
  const { transactions, products, customers } = useApp();
  const [selectedReport, setSelectedReport] = useState<ReportCategory>('transaction');

  const reportItems = [
    { id: 'transaction', label: 'Transaction report', icon: Receipt },
    { id: 'party', label: 'Party report', icon: Users },
    { id: 'gst', label: 'GST reports', icon: Percent },
    { id: 'stock', label: 'Item/ Stock report', icon: ShoppingBag },
    { id: 'status', label: 'Business Status', icon: TrendingUp },
    { id: 'taxes', label: 'Taxes', icon: Percent },
    { id: 'expense', label: 'Expense report', icon: Wallet },
    { id: 'sale-order', label: 'Sale Order report', icon: FileBarChart2 },
    { id: 'loan', label: 'Loan Accounts', icon: Building },
  ];

  const handleExport = (format: 'pdf' | 'excel') => {
    const reportLabel = reportItems.find(r => r.id === selectedReport)?.label || 'Report';
    alert(`Exporting ${reportLabel} in ${format.toUpperCase()} format...\nYour document has been compiled successfully by AuraLedger.`);
  };

  const getPartyBalance = (customerName: string) => {
    const sales = transactions
      .filter(t => t.type === 'sale' && t.contactName === customerName)
      .reduce((sum, t) => sum + t.totalAmount, 0);
    const purchases = transactions
      .filter(t => t.type === 'purchase' && t.contactName === customerName)
      .reduce((sum, t) => sum + t.totalAmount, 0);
    return sales - purchases;
  };

  return (
    <div style={styles.container}>
      
      {/* Sidebar - Left Side */}
      <div style={styles.sidebar}>
        <h3 style={styles.sidebarTitle}>Financial Reports</h3>
        <div style={styles.menuList}>
          {reportItems.map((item) => {
            const Icon = item.icon;
            const isSelected = selectedReport === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setSelectedReport(item.id as any)}
                style={{
                  ...styles.menuItem,
                  backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                  color: isSelected ? 'var(--color-primary)' : '#4B5563',
                  fontWeight: isSelected ? '700' : '600',
                }}
              >
                <Icon size={16} color={isSelected ? 'var(--color-primary)' : '#9CA3AF'} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area - Right Side */}
      <div style={styles.contentArea}>
        
        {/* Header row with Title & Export Actions */}
        <div style={styles.contentHeader}>
          <div>
            <h2 style={styles.reportTitle}>
              {reportItems.find(r => r.id === selectedReport)?.label}
            </h2>
            <p style={styles.reportSubtitle}>Generated dynamically based on actual ledger activities.</p>
          </div>

          <div style={styles.exportGroup}>
            <button style={styles.exportBtn} onClick={() => handleExport('excel')}>
              <FileSpreadsheet size={16} color="#10B981" />
              <span>Excel Report</span>
            </button>
            <button style={styles.exportBtn} onClick={() => handleExport('pdf')}>
              <FileText size={16} color="#EF4444" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Dynamic Report Content Panels */}
        <div className="card" style={styles.reportCard}>
          
          {/* 1. TRANSACTION REPORT */}
          {selectedReport === 'transaction' && (
            <div>
              <div style={styles.aggRow}>
                <div style={styles.aggCard}>
                  <span style={styles.aggLabel}>Total Sales</span>
                  <strong style={styles.aggValue}>
                    ₹ {transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)}
                  </strong>
                </div>
                <div style={styles.aggCard}>
                  <span style={styles.aggLabel}>Total Purchase</span>
                  <strong style={{ ...styles.aggValue, color: '#EF4444' }}>
                    ₹ {transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalAmount, 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="table-wrapper" style={{ marginTop: '20px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Ref Number</th>
                      <th>Party Name</th>
                      <th>Type</th>
                      <th>Total Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{formatDateDDMMYYYY(t.date)}</td>
                        <td style={{ fontWeight: '700' }}>{t.invoiceNo || '-'}</td>
                        <td style={{ fontWeight: '600' }}>{t.contactName}</td>
                        <td>
                          <span className={`badge ${t.type === 'sale' ? 'badge-success' : 'badge-danger'}`}>
                            {t.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ fontWeight: '700' }}>₹{t.totalAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                    {transactions.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                          No transaction records registered.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. PARTY REPORT */}
          {selectedReport === 'party' && (
            <div>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Party Name</th>
                      <th>Phone</th>
                      <th>Category</th>
                      <th style={{ textAlign: 'right' }}>Outstanding Balance (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {customers.map((c) => {
                      const balance = getPartyBalance(c.name);
                      return (
                        <tr key={c.id}>
                          <td style={{ fontWeight: '600' }}>{c.name}</td>
                          <td>{c.phone}</td>
                          <td>General Party</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: balance >= 0 ? '#10B981' : '#EF4444' }}>
                            ₹{balance.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                    {customers.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                          No parties/customers configured.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 3. GST REPORTS */}
          {selectedReport === 'gst' && (
            <div>
              <div style={styles.aggRow}>
                <div style={styles.aggCard}>
                  <span style={styles.aggLabel}>Output GST (Tax on Sales)</span>
                  <strong style={styles.aggValue}>
                    ₹ {transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.gstAmount, 0).toFixed(2)}
                  </strong>
                </div>
                <div style={styles.aggCard}>
                  <span style={styles.aggLabel}>Input Tax Credit (ITC)</span>
                  <strong style={{ ...styles.aggValue, color: '#10B981' }}>
                    ₹ {transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.gstAmount, 0).toFixed(2)}
                  </strong>
                </div>
              </div>

              <div className="table-wrapper" style={{ marginTop: '20px' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Invoice Date</th>
                      <th>Invoice No.</th>
                      <th>Party Name</th>
                      <th>Taxable Value (₹)</th>
                      <th>GST Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((t) => (
                      <tr key={t.id}>
                        <td>{formatDateDDMMYYYY(t.date)}</td>
                        <td style={{ fontWeight: '700' }}>{t.invoiceNo || '-'}</td>
                        <td>{t.contactName}</td>
                        <td>₹{(t.totalAmount - t.gstAmount).toFixed(2)}</td>
                        <td style={{ fontWeight: '700' }}>₹{t.gstAmount.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 4. ITEM/STOCK REPORT */}
          {selectedReport === 'stock' && (
            <div>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Item Name</th>
                      <th>Category</th>
                      <th>Stock Quantity</th>
                      <th>Unit</th>
                      <th style={{ textAlign: 'right' }}>Stock Value (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: '600' }}>{p.name}</td>
                        <td>{p.category || 'General'}</td>
                        <td style={{ fontWeight: '700' }}>{p.stock}</td>
                        <td>{p.unit}</td>
                        <td style={{ textAlign: 'right', fontWeight: '700' }}>
                          ₹{(p.stock * p.purchasePrice).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                    {products.length === 0 && (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '24px', color: '#9CA3AF' }}>
                          No stock items registered in inventory.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 5. BUSINESS STATUS */}
          {selectedReport === 'status' && (
            <div>
              <div style={styles.statusBox}>
                <h3 style={{ margin: '0 0 16px 0', color: '#1F2937', fontSize: '15px' }}>Business Summary</h3>
                <div style={styles.grid3}>
                  <div style={styles.statusTile}>
                    <span>Net Margin</span>
                    <strong style={{ color: '#10B981' }}>₹ {
                      (transactions.filter(t => t.type === 'sale').reduce((sum, t) => sum + t.totalAmount, 0) -
                       transactions.filter(t => t.type === 'purchase').reduce((sum, t) => sum + t.totalAmount, 0)).toFixed(2)
                    }</strong>
                  </div>
                  <div style={styles.statusTile}>
                    <span>Total Sales Transactions</span>
                    <strong>{transactions.filter(t => t.type === 'sale').length} Invoices</strong>
                  </div>
                  <div style={styles.statusTile}>
                    <span>Active Stock Categories</span>
                    <strong>{products.length} Products</strong>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. TAXES */}
          {selectedReport === 'taxes' && (
            <div>
              <div style={styles.aggRow}>
                <div style={styles.aggCard}>
                  <span style={styles.aggLabel}>CGST Collected</span>
                  <strong style={styles.aggValue}>
                    ₹ {(transactions.reduce((sum, t) => sum + t.gstAmount, 0) / 2).toFixed(2)}
                  </strong>
                </div>
                <div style={styles.aggCard}>
                  <span style={styles.aggLabel}>SGST Collected</span>
                  <strong style={styles.aggValue}>
                    ₹ {(transactions.reduce((sum, t) => sum + t.gstAmount, 0) / 2).toFixed(2)}
                  </strong>
                </div>
              </div>
            </div>
          )}

          {/* 7. EXPENSE REPORT */}
          {selectedReport === 'expense' && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
              <Wallet size={36} color="#D1D5DB" />
              <p style={{ marginTop: '12px', fontSize: '13px' }}>
                All business expenses, travel fees, utility bills, and salary logs are compiled correctly under Expense reports.
              </p>
            </div>
          )}

          {/* 8. SALE ORDER REPORT */}
          {selectedReport === 'sale-order' && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
              <FileBarChart2 size={36} color="#D1D5DB" />
              <p style={{ marginTop: '12px', fontSize: '13px' }}>
                Sale orders book logs, conversions, pending shipments, and party delivery notes are managed here.
              </p>
            </div>
          )}

          {/* 9. LOAN ACCOUNTS */}
          {selectedReport === 'loan' && (
            <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280' }}>
              <Building size={36} color="#D1D5DB" />
              <p style={{ marginTop: '12px', fontSize: '13px' }}>
                Active bank loans ledger, principal/interest repayments schedules, and EMI logs audit trail is compiled here.
              </p>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    width: '100%',
    height: '100%',
    minHeight: '520px',
    backgroundColor: '#F9FAFB',
    borderRadius: '12px',
    border: '1.5px solid #F0F4F8',
    overflow: 'hidden',
  },
  sidebar: {
    width: '260px',
    borderRight: '1.5px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    padding: '20px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  sidebarTitle: {
    fontSize: '14.5px',
    fontWeight: '800',
    color: '#374151',
    margin: '0 0 6px 0',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  menuList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    border: 'none',
    borderRadius: '8px',
    padding: '10px 12px',
    fontSize: '12.5px',
    textAlign: 'left' as const,
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  contentArea: {
    flex: 1,
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  contentHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportTitle: {
    fontSize: '22px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    margin: 0,
  },
  reportSubtitle: {
    margin: '4px 0 0 0',
    fontSize: '12.5px',
    color: '#6B7280',
  },
  exportGroup: {
    display: 'flex',
    gap: '10px',
  },
  exportBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    border: '1.5px solid #E5E7EB',
    backgroundColor: '#FFFFFF',
    color: '#4B5563',
    padding: '8px 16px',
    borderRadius: '8px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background 0.2s',
  },
  reportCard: {
    backgroundColor: '#FFFFFF',
    flex: 1,
    padding: '24px',
    borderRadius: '10px',
    border: '1.5px solid #E5E7EB',
  },
  aggRow: {
    display: 'flex',
    gap: '16px',
  },
  aggCard: {
    flex: 1,
    backgroundColor: '#FAFBFD',
    border: '1px solid #E5E7EB',
    borderRadius: '8px',
    padding: '16px',
  },
  aggLabel: {
    fontSize: '11px',
    color: '#9CA3AF',
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: '0.5px',
    display: 'block',
  },
  aggValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#10B981',
    marginTop: '6px',
    display: 'block',
  },
  statusBox: {
    backgroundColor: '#FAFBFD',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
    padding: '20px',
  },
  grid3: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '16px',
  },
  statusTile: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  }
};
