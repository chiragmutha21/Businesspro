import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Download, Calendar } from 'lucide-react';
import html2pdf from 'html2pdf.js';

interface GstReportsProps {
  activeSection: 'gst-purchase' | 'gst-sale';
}

export const GstReports: React.FC<GstReportsProps> = ({ activeSection }) => {
  const { activeBusiness, transactions } = useApp();

  const getStartOfMonthStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}-01`;
  };

  const getTodayStr = () => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const [fromDate, setFromDate] = useState(getStartOfMonthStr());
  const [toDate, setToDate] = useState(getTodayStr());

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

  // Filter transactions of appropriate type within date range
  const filteredItems = useMemo(() => {
    const targetType = activeSection === 'gst-purchase' ? 'purchase' : 'sale';
    const parsedFrom = new Date(fromDate);
    parsedFrom.setHours(0, 0, 0, 0);
    const parsedTo = new Date(toDate);
    parsedTo.setHours(23, 59, 59, 999);

    const matchBiz = transactions.filter(t => t.businessId === activeBusiness?.id);
    const matchType = matchBiz.filter(t => (t.type || '').toLowerCase() === targetType);

    const inRange = matchType.filter(t => {
      const parsedTxDate = parseDateStr(t.date);
      if (!parsedTxDate) return false;
      return parsedTxDate >= parsedFrom && parsedTxDate <= parsedTo;
    });

    // Sort transactions first by date ascending and invoiceNo ascending
    const sortedTx = [...inRange].sort((a, b) => {
      const dateA = parseDateStr(a.date) || new Date(0);
      const dateB = parseDateStr(b.date) || new Date(0);
      if (dateA.getTime() !== dateB.getTime()) {
        return dateA.getTime() - dateB.getTime();
      }
      return (a.invoiceNo || '').localeCompare(b.invoiceNo || '', undefined, { numeric: true, sensitivity: 'base' });
    });

    // Flatten transactions to product-level lines
    const lines: any[] = [];
    let counter = 1;

    sortedTx.forEach(t => {
      const productsList = t.products || [];
      if (productsList.length === 0) {
        // Fallback for transactions without products (e.g. general expense or manual logs)
        const gstPct = t.gstAmount && t.totalAmount ? Math.round((t.gstAmount / (t.totalAmount - t.gstAmount)) * 100) : 0;
        const taxableVal = (t.totalAmount || 0) - (t.gstAmount || 0);
        lines.push({
          srNo: counter++,
          date: t.date,
          invoiceNo: t.invoiceNo || '-',
          partyName: t.contactName || '-',
          gstNo: t.contactGst || '-',
          itemName: 'General Payment / Bill',
          gstPct: gstPct > 0 ? `${gstPct}%` : '-',
          taxableValue: taxableVal,
          cgst: (t.gstAmount || 0) / 2,
          sgst: (t.gstAmount || 0) / 2,
          taxAmount: t.gstAmount || 0,
          totalAmount: t.totalAmount || 0
        });
      } else {
        productsList.forEach((p: any, idx: number) => {
          const gstPct = p.gst || 0;
          const taxableVal = p.total || 0; // p.total holds base taxable value exclusive of tax in our mapping
          const taxAmt = gstPct > 0 ? (taxableVal * (gstPct / 100)) : 0;
          lines.push({
            srNo: counter++,
            // Only show date, invoiceNo, partyName, gstNo on the first row of each invoice
            date: idx === 0 ? t.date : '',
            invoiceNo: idx === 0 ? (t.invoiceNo || '-') : '',
            partyName: idx === 0 ? (t.contactName || '-') : '',
            gstNo: idx === 0 ? (t.contactGst || '-') : '',
            itemName: p.productName || '-',
            gstPct: gstPct > 0 ? `${gstPct}%` : '-',
            taxableValue: taxableVal,
            cgst: taxAmt / 2,
            sgst: taxAmt / 2,
            taxAmount: taxAmt,
            totalAmount: taxableVal + taxAmt
          });
        });
      }
    });

    return lines;
  }, [transactions, activeBusiness, fromDate, toDate, activeSection]);

  // Calculate Column Totals
  const totals = useMemo(() => {
    return filteredItems.reduce(
      (acc, item) => {
        acc.taxableValue += item.taxableValue || 0;
        acc.cgst += item.cgst || 0;
        acc.sgst += item.sgst || 0;
        acc.taxAmount += item.taxAmount || 0;
        acc.totalAmount += item.totalAmount || 0;
        return acc;
      },
      { taxableValue: 0, cgst: 0, sgst: 0, taxAmount: 0, totalAmount: 0 }
    );
  }, [filteredItems]);

  const handleDownloadPDF = () => {
    const element = document.getElementById('gst-report-print-area');
    if (!element) return;

    const opt = {
      margin: [10, 10, 10, 10] as [number, number, number, number],
      filename: `${activeSection === 'gst-purchase' ? 'GST_Purchase_Report' : 'GST_Sale_Report'}_${fromDate}_to_${toDate}.pdf`,
      image: { type: 'jpeg' as const, quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm' as const, format: 'a4' as const, orientation: 'landscape' as const }
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div style={styles.container}>
      {/* Top Action Header */}
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>
            {activeSection === 'gst-purchase' ? 'GST Purchase Report' : 'GST Sale Report'}
          </h2>
          <p style={styles.subtitle}>
            GST-compliant reporting ledger for active business
          </p>
        </div>

        <div style={styles.filterSection}>
          <div style={styles.datePickerGroup}>
            <div style={styles.dateField}>
              <Calendar size={14} color="#9CA3AF" />
              <input
                type="date"
                style={styles.dateInput}
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
              />
            </div>
            <span style={styles.dateSeparator}>to</span>
            <div style={styles.dateField}>
              <Calendar size={14} color="#9CA3AF" />
              <input
                type="date"
                style={styles.dateInput}
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
              />
            </div>
          </div>

          <button style={styles.downloadBtn} onClick={handleDownloadPDF}>
            <Download size={15} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={styles.metricsGrid}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Total Taxable Value</span>
          <strong style={styles.metricValue}>
            ₹{totals.taxableValue.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>CGST Total (Central)</span>
          <strong style={{ ...styles.metricValue, color: '#F59E0B' }}>
            ₹{totals.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>SGST Total (State)</span>
          <strong style={{ ...styles.metricValue, color: '#F59E0B' }}>
            ₹{totals.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Total GST Amount</span>
          <strong style={{ ...styles.metricValue, color: '#EF4444' }}>
            ₹{totals.taxAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Gross Total (Incl. Tax)</span>
          <strong style={{ ...styles.metricValue, color: '#10B981' }}>
            ₹{totals.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </strong>
        </div>
      </div>

      {/* Main Report Table Container */}
      <div style={styles.tableCard} id="gst-report-print-area">
        {/* Print Header (Visible in PDF print output) */}
        <div className="pdf-print-only" style={styles.printHeader}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', marginBottom: '14px' }}>
            <div>
              <h1 style={{ margin: '0 0 4px 0', fontSize: '20px', color: '#1E293B', fontWeight: '800' }}>
                {activeBusiness?.name}
              </h1>
              <p style={{ margin: '0', fontSize: '12px', color: '#64748B' }}>
                {activeBusiness?.address}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '12px', color: '#64748B' }}>
                Phone: {activeBusiness?.phone || '-'}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ display: 'inline-block', backgroundColor: '#3B82F6', color: '#FFFFFF', padding: '4px 10px', borderRadius: '4px', fontWeight: '700', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                {activeSection === 'gst-purchase' ? 'GST PURCHASE LEDGER' : 'GST SALES LEDGER'}
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                <strong>GSTIN:</strong> {activeBusiness?.gst || '-'}
              </p>
              <p style={{ margin: '2px 0 0 0', fontSize: '11px', color: '#64748B' }}>
                <strong>Tenure:</strong> {fromDate} to {toDate}
              </p>
            </div>
          </div>
          <hr style={{ border: 'none', borderTop: '2px solid #E2E8F0', margin: '0 0 16px 0' }} />
        </div>

        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th style={{ width: '50px' }}>Sr. No.</th>
                <th>Date</th>
                <th>Invoice No</th>
                <th>Party Name</th>
                <th>GSTIN</th>
                <th>Item Details</th>
                <th style={{ textAlign: 'center' }}>GST %</th>
                <th style={{ textAlign: 'right' }}>Taxable Value</th>
                <th style={{ textAlign: 'right' }}>CGST</th>
                <th style={{ textAlign: 'right' }}>SGST</th>
                <th style={{ textAlign: 'right' }}>Tax Amount</th>
                <th style={{ textAlign: 'right' }}>Total Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.map((item, index) => (
                <tr key={index}>
                  <td>{item.srNo}</td>
                  <td>{item.date}</td>
                  <td style={{ fontWeight: '600' }}>{item.invoiceNo}</td>
                  <td>{item.partyName}</td>
                  <td style={{ fontSize: '11px', fontFamily: 'monospace' }}>{item.gstNo}</td>
                  <td style={{ fontSize: '12px' }}>{item.itemName}</td>
                  <td style={{ textAlign: 'center', fontWeight: '600' }}>{item.gstPct}</td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{(item.taxableValue || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: item.cgst > 0 ? '#F59E0B' : 'inherit' }}>
                    ₹{(item.cgst || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: item.sgst > 0 ? '#F59E0B' : 'inherit' }}>
                    ₹{(item.sgst || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '600', color: item.taxAmount > 0 ? '#EF4444' : 'inherit' }}>
                    ₹{(item.taxAmount || 0).toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', fontWeight: '700', color: '#1E293B' }}>
                    ₹{(item.totalAmount || 0).toFixed(2)}
                  </td>
                </tr>
              ))}
              {filteredItems.length === 0 && (
                <tr>
                  <td colSpan={12} style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--color-text-muted)' }}>
                    No GST transactions found for the selected tenure.
                  </td>
                </tr>
              )}
            </tbody>
            {filteredItems.length > 0 && (
              <tfoot>
                <tr style={{ backgroundColor: '#FAF8F5', fontWeight: '700', borderTop: '2px solid #E2E8F0' }}>
                  <td colSpan={7} style={{ textAlign: 'right', padding: '12px 10px' }}>Total Amount:</td>
                  <td style={{ textAlign: 'right' }}>
                    ₹{totals.taxableValue.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#F59E0B' }}>
                    ₹{totals.cgst.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#F59E0B' }}>
                    ₹{totals.sgst.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#EF4444' }}>
                    ₹{totals.taxAmount.toFixed(2)}
                  </td>
                  <td style={{ textAlign: 'right', color: '#10B981', fontSize: '13px' }}>
                    ₹{totals.totalAmount.toFixed(2)}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '0 24px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '16px'
  },
  title: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--color-text-main)',
    margin: 0
  },
  subtitle: {
    fontSize: '13px',
    color: 'var(--color-text-muted)',
    margin: '4px 0 0 0'
  },
  filterSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    flexWrap: 'wrap' as const
  },
  datePickerGroup: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--color-border)',
    borderRadius: '8px',
    padding: '4px 10px',
    gap: '8px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
  },
  dateField: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  dateInput: {
    border: 'none',
    outline: 'none',
    fontSize: '12px',
    color: 'var(--color-text-main)',
    cursor: 'pointer',
    fontFamily: 'inherit'
  },
  dateSeparator: {
    fontSize: '12px',
    color: 'var(--color-text-muted)',
    fontWeight: '600'
  },
  downloadBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--color-primary)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 4px rgba(59, 130, 246, 0.25)',
    transition: 'opacity 0.2s',
    ':hover': {
      opacity: 0.9
    }
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px'
  },
  metricCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '16px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
  },
  metricLabel: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    fontWeight: '600',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  metricValue: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--color-text-main)'
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    overflow: 'hidden'
  },
  printHeader: {
    display: 'none' // Hidden by default on screen
  }
};
