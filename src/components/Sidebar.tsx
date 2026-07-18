import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  Users,
  ShoppingBag,
  Receipt,
  ShoppingCart,
  Landmark,
  BarChart3,
  RefreshCw,
  Search,
  ChevronDown,
  Plus,
  Building,
  Check,
  Edit2,
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onAddBusiness: () => void;
  onEditBusiness: (id: string) => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, onAddBusiness, onEditBusiness, isOpen = false, onClose }) => {
  const { activeBusiness, businesses, switchBusiness, signOut } = useApp();
  const [searchSidebar, setSearchSidebar] = useState('');
  const [showBusinessSelect, setShowBusinessSelect] = useState(false);
  const [showPurchaseSubmenu, setShowPurchaseSubmenu] = useState(false);
  const [showBankSubmenu, setShowBankSubmenu] = useState(false);
  const [showSaleSubmenu, setShowSaleSubmenu] = useState(false);

  const saleSubItems = [
    { id: 'sale-invoices', label: 'Sale Invoices' },
    { id: 'estimate-quotation', label: 'Estimate/ Quotation' },
    { id: 'proforma-invoice', label: 'Proforma Invoice' },
    { id: 'payment-in', label: 'Payment-In' },
    { id: 'sale-order', label: 'Sale Order' },
    { id: 'delivery-challan', label: 'Delivery Challan' },
    { id: 'sale-return', label: 'Sale Return/ Credit Note' }
  ];

  const purchaseSubItems = [
    { id: 'purchase-bills', label: 'Purchase Bills' },
    { id: 'payment-out', label: 'Payment-Out' },
    { id: 'expenses', label: 'Expenses' },
    { id: 'purchase-order', label: 'Purchase Order' },
    { id: 'purchase-return', label: 'Purchase Return/ Dr. Note' }
  ];

  const bankSubItems = [
    { id: 'bank-accounts', label: 'Bank Accounts' },
    { id: 'cash-in-hand', label: 'Cash In Hand' },
    { id: 'cheques', label: 'Cheques' },
    { id: 'loan-accounts', label: 'Loan Accounts' }
  ];

  // Define sidebar menu options
  const menuItems = [
    { id: 'customers', label: 'Parties', icon: Users, hasDropdown: true, action: 'dropdown' },
    { id: 'products', label: 'Items', icon: ShoppingBag, hasPlus: true, action: 'plus' },
    { id: 'transactions', label: 'Sale', icon: Receipt, hasDropdown: true, action: 'dropdown' },
    { id: 'purchases', label: 'Purchase & Expense', icon: ShoppingCart, hasDropdown: true, action: 'dropdown' },
    { id: 'bank', label: 'Cash & Bank', icon: Landmark, hasDropdown: true, action: 'dropdown' },
    { id: 'reports', label: 'Reports', icon: BarChart3 },
    { id: 'sync', label: 'Sync & Backup', icon: RefreshCw },
  ];

  const handleItemClick = (id: string) => {
    if (id === 'purchases') {
      setShowPurchaseSubmenu(!showPurchaseSubmenu);
    } else if (id === 'bank') {
      setShowBankSubmenu(!showBankSubmenu);
    } else if (id === 'transactions') {
      setShowSaleSubmenu(!showSaleSubmenu);
    } else {
      setCurrentTab(id);
      if (onClose) onClose();
    }
  };

  const handleBusinessSwitch = (id: string) => {
    switchBusiness(id);
    setShowBusinessSelect(false);
  };

  const handleAddNewBusiness = () => {
    setShowBusinessSelect(false);
    onAddBusiness();
  };

  return (
    <aside className={isOpen ? 'open' : ''} style={styles.sidebar}>
      {/* Brand Header */}
      <div style={{ ...styles.brandHeader, display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: '32px', height: '32px', marginRight: '10px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={styles.brandName}>BusinessPro</span>
        </div>
        {onClose && (
          <button className="mobile-menu-close" onClick={onClose}>
            <X size={18} />
          </button>
        )}
      </div>

      {/* Search bar inside Sidebar */}
      <div style={styles.searchContainer}>
        <Search size={14} color="#9CA3AF" style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Open Anything (Ctrl+F)"
          style={styles.searchInput}
          value={searchSidebar}
          onChange={(e) => setSearchSidebar(e.target.value)}
        />
      </div>

      {/* Navigation menu list */}
      <nav style={styles.nav}>
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isPurchasesActive = ['purchase-bills', 'payment-out', 'expenses', 'purchase-order', 'purchase-return'].includes(currentTab);
          const isBankActive = ['bank-accounts', 'cash-in-hand', 'cheques', 'loan-accounts'].includes(currentTab);
          const isSaleActive = ['sale-invoices', 'estimate-quotation', 'proforma-invoice', 'payment-in', 'sale-order', 'delivery-challan', 'sale-return'].includes(currentTab);
          const isActive = currentTab === item.id || 
            (item.id === 'purchases' && isPurchasesActive) ||
            (item.id === 'bank' && isBankActive) ||
            (item.id === 'transactions' && isSaleActive);

          const isDropdownRotated = (item.id === 'purchases' && showPurchaseSubmenu) || 
                                    (item.id === 'bank' && showBankSubmenu) ||
                                    (item.id === 'transactions' && showSaleSubmenu);

          return (
            <div key={item.id} style={styles.navItemWrapper}>
              <button
                onClick={() => handleItemClick(item.id)}
                style={{
                  ...styles.navItem,
                  backgroundColor: isActive ? '#242B45' : 'transparent',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Icon size={18} color="#9CA3AF" />
                  <span style={styles.itemLabel}>{item.label}</span>
                </div>

                {item.hasDropdown && (
                  <ChevronDown size={14} color="#9CA3AF" style={{ transform: isDropdownRotated ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                )}
                {item.hasPlus && (
                  <Plus size={14} color="#9CA3AF" />
                )}
              </button>

              {item.id === 'transactions' && (showSaleSubmenu || isSaleActive) && (
                <div style={styles.submenuContainer}>
                  {saleSubItems.map((sub) => {
                    const isSubActive = currentTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setCurrentTab(sub.id);
                          if (onClose) onClose();
                        }}
                        style={{
                          ...styles.submenuItem,
                          backgroundColor: isSubActive ? '#2B3454' : 'transparent',
                          color: isSubActive ? '#FFFFFF' : '#9CA3AF',
                        }}
                      >
                        <span>{sub.label}</span>
                        <div 
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '4px', cursor: 'pointer' }}
                          onClick={(e) => {
                            e.stopPropagation();
                            localStorage.setItem('open_sale_form_direct', sub.id);
                            setCurrentTab(sub.id);
                          }}
                        >
                          <Plus size={12} color="#9CA3AF" style={styles.submenuPlus} />
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {item.id === 'purchases' && (showPurchaseSubmenu || isPurchasesActive) && (
                <div style={styles.submenuContainer}>
                  {purchaseSubItems.map((sub) => {
                    const isSubActive = currentTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setCurrentTab(sub.id);
                          if (onClose) onClose();
                        }}
                        style={{
                          ...styles.submenuItem,
                          backgroundColor: isSubActive ? '#2B3454' : 'transparent',
                          color: isSubActive ? '#FFFFFF' : '#9CA3AF',
                        }}
                      >
                        <span>{sub.label}</span>
                        <Plus size={12} color="#9CA3AF" style={styles.submenuPlus} />
                      </button>
                    );
                  })}
                </div>
              )}

              {item.id === 'bank' && (showBankSubmenu || isBankActive) && (
                <div style={styles.submenuContainer}>
                  {bankSubItems.map((sub) => {
                    const isSubActive = currentTab === sub.id;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => {
                          setCurrentTab(sub.id);
                          if (onClose) onClose();
                        }}
                        style={{
                          ...styles.submenuItem,
                          backgroundColor: isSubActive ? '#2B3454' : 'transparent',
                          color: isSubActive ? '#FFFFFF' : '#9CA3AF',
                        }}
                      >
                        <span>{sub.label}</span>
                        <Plus size={12} color="#9CA3AF" style={styles.submenuPlus} />
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Profile status with floating Business Switcher popover */}
      <div style={styles.footerWrapper}>

        {/* Floating Business Select Popover */}
        {showBusinessSelect && (
          <div style={styles.businessPopover}>
            <div style={styles.popoverHeader}>
              <span>Select Business Workspace</span>
            </div>

            <div style={styles.businessList}>
              {businesses.map((biz) => {
                const isCurrent = biz.id === activeBusiness?.id;
                return (
                  <div 
                    key={biz.id} 
                    style={{
                      ...styles.businessSelectItemContainer,
                      backgroundColor: isCurrent ? 'rgba(59, 130, 246, 0.1)' : 'transparent',
                    }}
                  >
                    <button 
                      style={{
                        ...styles.businessSelectItem,
                        color: isCurrent ? '#3B82F6' : '#E5E7EB',
                        flex: 1
                      }}
                      onClick={() => handleBusinessSwitch(biz.id)}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Building size={14} />
                        <span style={{ fontWeight: isCurrent ? '700' : '500' }}>{biz.name}</span>
                      </div>
                      {isCurrent && <Check size={14} style={{ marginLeft: '4px' }} />}
                    </button>
                    
                    <button 
                      type="button"
                      style={styles.popoverEditBtn}
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditBusiness(biz.id);
                      }}
                      title="Edit business details"
                    >
                      <Edit2 size={12} color="#9CA3AF" />
                    </button>
                  </div>
                );
              })}
              {businesses.length === 0 && (
                <div style={styles.noBusinessHint}>No active businesses. Create one!</div>
              )}
            </div>

            <button style={styles.popoverAddBtn} onClick={handleAddNewBusiness}>
              <Plus size={14} />
              <span>+ Add New Business</span>
            </button>

            <button style={styles.popoverSignOutBtn} onClick={signOut}>
              <LogOut size={13} />
              <span>Sign Out</span>
            </button>
          </div>
        )}

        <button
          className="sidebar-footer-btn"
          style={styles.footerBtn}
          onClick={() => setShowBusinessSelect(!showBusinessSelect)}
        >
          <div style={styles.profileInfo}>
            <span style={styles.profileName}>{activeBusiness?.name || 'Create Business'}</span>
            <span style={styles.profileRole}>Owner Account ▾</span>
          </div>
        </button>

      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '280px',
    backgroundColor: '#111625', // Dark charcoal/navy sidebar matching screenshot
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 14px',
    height: '100vh',
    flexShrink: 0
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    padding: '0 4px',
    marginBottom: '16px',
  },
  brandName: {
    fontSize: '22px',
    fontWeight: '800',
    color: '#3B82F6', // Sleek blue color matching standard brand color
    fontFamily: 'var(--font-sans)',
    letterSpacing: '0.5px',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#202639', // Dark search block
    borderRadius: '18px',
    padding: '8px 12px',
    marginBottom: '20px',
    border: '1px solid transparent',
  },
  searchIcon: {
    marginRight: '8px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    color: '#E5E7EB',
    fontSize: '12px',
    fontFamily: 'var(--font-sans)',
    width: '100%',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
    overflowY: 'auto',
  },
  navItemWrapper: {
    width: '100%',
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 14px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    color: '#E5E7EB',
    transition: 'all 0.2s',
    textAlign: 'left',
  },
  itemLabel: {
    fontSize: '13.5px',
    fontWeight: '500',
    fontFamily: 'var(--font-sans)',
  },
  footerWrapper: {
    borderTop: '1px solid #202639',
    paddingTop: '12px',
    marginTop: 'auto',
    position: 'relative' as const,
  },
  footerBtn: {
    width: '100%',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    padding: '4px 6px',
    borderRadius: '8px',
    transition: 'background 0.2s',
    display: 'block',
  },
  profileInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  profileName: {
    fontSize: '13.5px',
    fontWeight: '700',
    color: '#FFFFFF',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontFamily: 'var(--font-sans)',
  },
  profileRole: {
    fontSize: '11px',
    color: '#9CA3AF',
    marginTop: '2px',
  },
  businessPopover: {
    position: 'absolute' as const,
    bottom: '65px',
    left: '0',
    right: '0',
    backgroundColor: '#1E2538',
    border: '1px solid #2D3748',
    borderRadius: '12px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.3)',
    zIndex: 9999,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  popoverHeader: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#9CA3AF',
    padding: '6px 8px',
    borderBottom: '1px solid #2D3748',
  },
  businessList: {
    maxHeight: '180px',
    overflowY: 'auto' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '4px 0',
  },
  businessSelectItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '12px',
    width: '100%',
    transition: 'all 0.2s',
    backgroundColor: 'transparent',
  },
  noBusinessHint: {
    padding: '12px',
    fontSize: '11px',
    color: '#9CA3AF',
    textAlign: 'center' as const,
  },
  popoverAddBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '4px',
    transition: 'background 0.2s',
  },
  popoverSignOutBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    color: '#F87171',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    fontSize: '11.5px',
    fontWeight: '600',
    cursor: 'pointer',
    marginTop: '6px',
    transition: 'background 0.2s',
  },
  businessSelectItemContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '6px',
    paddingRight: '6px',
    transition: 'background 0.2s',
  },
  popoverEditBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'background 0.2s',
  },
  submenuContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
    paddingLeft: '24px',
    marginTop: '4px',
  },
  submenuItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 12px',
    borderRadius: '6px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left' as const,
    fontSize: '12.5px',
    width: '100%',
    transition: 'all 0.2s',
  },
  submenuPlus: {
    opacity: 0.6,
  }
};
