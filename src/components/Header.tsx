import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Search, 
  Bell, 
  DollarSign, 
  AlertTriangle, 
  X
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
interface HeaderProps {
  onSearchSelect: (tab: string, detail?: any) => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSelect }) => {
  const { activeBusiness, products, transactions, globalSearch } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ products: any[]; customers: any[]; transactions: any[] }>({
    products: [],
    customers: [],
    transactions: []
  });
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Close when clicked outside
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearchResults(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Update search results
  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const results = globalSearch(searchQuery);
      setSearchResults(results);
      setShowSearchResults(true);
    } else {
      setSearchResults({ products: [], customers: [], transactions: [] });
      setShowSearchResults(false);
    }
  }, [searchQuery]);

  // Notifications calculation
  const notifications: { id: string; type: 'stock' | 'payment' | 'info'; title: string; desc: string; date: string }[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Stock Alerts
  const outOfStockProds = products.filter((p) => p.businessId === activeBusiness?.id && p.stock === 0);
  outOfStockProds.forEach((p) => {
    notifications.push({
      id: `oos-${p.id}`,
      type: 'stock',
      title: 'Out of Stock Alert',
      desc: `${p.name} is completely out of stock! Please restock immediately.`,
      date: 'Today'
    });
  });

  const lowStockProds = products.filter((p) => p.businessId === activeBusiness?.id && p.stock <= p.minStock && p.stock > 0);
  lowStockProds.forEach((p) => {
    notifications.push({
      id: `ns-${p.id}`,
      type: 'stock',
      title: 'Low Stock Alert',
      desc: `${p.name} has only ${p.stock} ${p.unit} remaining (Min: ${p.minStock}).`,
      date: 'Today'
    });
  });

  // 2. Pending payments > 3 days
  const threeDaysAgo = new Date(today);
  threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

  const pendingInvoices = transactions.filter(
    (t) => t.businessId === activeBusiness?.id && (t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid')
  );
  
  pendingInvoices.forEach((t) => {
    if (t.date) {
      const [y, m, d] = t.date.split('-');
      const tDate = new Date(Number(y), Number(m) - 1, Number(d));
      if (tDate <= threeDaysAgo) {
        notifications.push({
          id: `np-${t.id}`,
          type: 'payment',
          title: 'Overdue Payment',
          desc: `Payment from ${t.contactName} (₹${t.totalAmount.toFixed(2)}) has been pending for over 3 days.`,
          date: t.date
        });
      }
    }
  });

  // 3. Cheque Reminders
  const chequeTransactions = transactions.filter(
    (t) => t.businessId === activeBusiness?.id && (t.paymentType === 'Cheque' || t.paymentStatus === 'Paid by Cheque' || t.chequeNo)
  );

  chequeTransactions.forEach((t) => {
    if (t.paymentDate) {
      const [y, m, d] = t.paymentDate.split('-');
      const pd = new Date(Number(y), Number(m) - 1, Number(d));
      if (pd <= today) {
        notifications.push({
          id: `chq-${t.id}`,
          type: 'payment',
          title: 'Cheque Deposit Reminder',
          desc: `Please deposit the cheque from ${t.contactName} for ₹${t.totalAmount.toFixed(2)} (Cheque No: ${t.chequeNo || 'N/A'}).`,
          date: t.paymentDate
        });
      }
    }
  });

  // Default notification if empty
  if (notifications.length === 0) {
    notifications.push({
      id: 'default-notif',
      type: 'info',
      title: 'Welcome Back',
      desc: 'All systems online. Your business data is up to date.',
      date: 'Just now'
    });
  }

  const handleSearchResultClick = (tab: string, item: any) => {
    onSearchSelect(tab, item);
    setSearchQuery('');
    setShowSearchResults(false);
  };

  return (
    <header style={styles.header}>
      {/* Global Search */}
      <div style={styles.searchWrapper} ref={searchRef}>
        <div style={styles.searchBar}>
          <Search size={18} color="var(--color-text-muted)" style={styles.searchIcon} />
          <input
            type="text"
            placeholder={`Search invoices, products, customers in ${activeBusiness?.name || 'current business'}...`}
            style={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.trim().length > 0 && setShowSearchResults(true)}
          />
          {searchQuery && (
            <button style={styles.clearBtn} onClick={() => setSearchQuery('')}>
              <X size={16} />
            </button>
          )}
        </div>

        {showSearchResults && (
          <div style={styles.searchResultsPanel}>
            {/* Products Section */}
            {searchResults.products.length > 0 && (
              <div>
                <div style={styles.searchCategoryHeader}>Products</div>
                {searchResults.products.map((p) => (
                  <div
                    key={p.id}
                    className="search-result-item"
                    style={styles.searchResultItem}
                    onClick={() => handleSearchResultClick('products', p)}
                  >
                    <div>
                      <div style={styles.resultMain}>{p.name}</div>
                      <div style={styles.resultSub}>SKU: {p.sku} | Barcode: {p.barcode}</div>
                    </div>
                    <div style={styles.resultBadge}>Stock: {p.stock}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Customers Section */}
            {searchResults.customers.length > 0 && (
              <div>
                <div style={styles.searchCategoryHeader}>Customers</div>
                {searchResults.customers.map((c) => (
                  <div
                    key={c.id}
                    className="search-result-item"
                    style={styles.searchResultItem}
                    onClick={() => handleSearchResultClick('customers', c)}
                  >
                    <div>
                      <div style={styles.resultMain}>{c.name}</div>
                      <div style={styles.resultSub}>{c.phone} | {c.email}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Transactions Section */}
            {searchResults.transactions.length > 0 && (
              <div>
                <div style={styles.searchCategoryHeader}>Invoices / Bills</div>
                {searchResults.transactions.map((t) => (
                  <div
                    key={t.id}
                    className="search-result-item"
                    style={styles.searchResultItem}
                    onClick={() => handleSearchResultClick('transactions', t)}
                  >
                    <div>
                      <div style={styles.resultMain}>{t.invoiceNo}</div>
                      <div style={styles.resultSub}>{t.contactName} • {formatDateDDMMYYYY(t.date)}</div>
                    </div>
                    <div style={{ ...styles.resultBadge, color: t.type === 'sale' ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      ₹{t.totalAmount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {searchResults.products.length === 0 &&
              searchResults.customers.length === 0 &&
              searchResults.transactions.length === 0 && (
                <div style={styles.noResults}>No matches found for "{searchQuery}"</div>
              )}
          </div>
        )}
      </div>

      {/* Right Controls */}
      <div style={styles.controls}>
        {/* Business Title display */}
        <div style={styles.businessIndicator}>
          <span style={styles.bizDot}></span>
          <span style={styles.bizName}>{activeBusiness?.name}</span>
        </div>

        {/* Notifications */}
        <div style={styles.notifWrapper} ref={notifRef}>
          <button style={styles.notifBtn} onClick={() => setShowNotifications(!showNotifications)}>
            <Bell size={20} color="var(--color-primary)" />
            {notifications.filter(n => n.id !== 'default-notif').length > 0 && (
              <span style={styles.notifBadge}>{notifications.filter(n => n.id !== 'default-notif').length}</span>
            )}
          </button>

          {showNotifications && (
            <div style={styles.notifDropdown}>
              <div style={styles.notifHeader}>
                <span>Notifications & Alerts</span>
              </div>
              <div style={styles.notifList}>
                {notifications.map((n) => (
                  <div key={n.id} style={styles.notifItem}>
                    <div style={styles.notifIconWrapper}>
                      {n.type === 'stock' ? (
                        <AlertTriangle size={16} color="var(--color-danger)" />
                      ) : (
                        <DollarSign size={16} color="var(--color-warning)" />
                      )}
                    </div>
                    <div style={styles.notifContent}>
                      <div style={styles.notifItemTitle}>{n.title}</div>
                      <div style={styles.notifItemDesc}>{n.desc}</div>
                      <div style={styles.notifItemTime}>{formatDateDDMMYYYY(n.date)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '70px',
    backgroundColor: '#FFFFFF',
    borderBottom: '1px solid var(--color-border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    flexShrink: 0,
    zIndex: 99
  },
  searchWrapper: {
    position: 'relative',
    width: '450px',
  },
  searchBar: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: 'var(--bg-app)',
    borderRadius: '10px',
    padding: '8px 12px',
    border: '1px solid transparent',
    transition: 'all 0.2s',
  },
  searchIcon: {
    marginRight: '8px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    fontSize: '13px',
    width: '100%',
    fontFamily: 'var(--font-sans)',
    color: 'var(--color-text-main)',
  },
  clearBtn: {
    border: 'none',
    backgroundColor: 'transparent',
    cursor: 'pointer',
    color: 'var(--color-text-muted)',
    display: 'flex',
    alignItems: 'center',
  },
  searchResultsPanel: {
    position: 'absolute',
    top: '110%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 200,
    maxHeight: '400px',
    overflowY: 'auto',
    padding: '12px',
  },
  searchCategoryHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-accent)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    padding: '8px 8px 4px 8px',
    borderBottom: '1px solid #FAF8F5',
  },
  searchResultItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
  },
  resultMain: {
    fontSize: '13px',
    fontWeight: '600',
    color: 'var(--color-primary)',
  },
  resultSub: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  resultBadge: {
    fontSize: '11px',
    backgroundColor: '#FAF8F5',
    padding: '4px 8px',
    borderRadius: '6px',
    fontWeight: '600',
  },
  noResults: {
    padding: '16px',
    textAlign: 'center',
    color: 'var(--color-text-muted)',
    fontSize: '13px',
  },
  controls: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  businessIndicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    backgroundColor: 'var(--color-success-bg)',
    padding: '6px 12px',
    borderRadius: '20px',
  },
  bizDot: {
    width: '8px',
    height: '8px',
    backgroundColor: 'var(--color-success)',
    borderRadius: '50%',
  },
  bizName: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-success)',
  },
  notifWrapper: {
    position: 'relative',
  },
  notifBtn: {
    position: 'relative',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadge: {
    position: 'absolute',
    top: '-2px',
    right: '-2px',
    backgroundColor: 'var(--color-danger)',
    color: '#FFFFFF',
    fontSize: '9px',
    fontWeight: '700',
    width: '15px',
    height: '15px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifDropdown: {
    position: 'absolute',
    top: '120%',
    right: '0',
    width: '320px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid var(--color-border)',
    boxShadow: 'var(--shadow-lg)',
    zIndex: 200,
    overflow: 'hidden',
  },
  notifHeader: {
    padding: '12px 16px',
    borderBottom: '1px solid var(--color-border)',
    fontWeight: '600',
    fontSize: '14px',
    color: 'var(--color-primary)',
  },
  notifList: {
    maxHeight: '300px',
    overflowY: 'auto',
  },
  notifItem: {
    display: 'flex',
    gap: '12px',
    padding: '12px 16px',
    borderBottom: '1px solid #FAF8F5',
    transition: 'background-color 0.2s',
  },
  notifIconWrapper: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    backgroundColor: 'var(--bg-app)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
  },
  notifItemTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-primary)',
  },
  notifItemDesc: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
    lineHeight: '1.4',
  },
  notifItemTime: {
    fontSize: '10px',
    color: 'var(--color-accent)',
    marginTop: '4px',
  }
};
