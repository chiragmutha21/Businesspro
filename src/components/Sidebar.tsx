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
  X,
  LayoutDashboard,
  Percent,
  ChevronRight
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
  const [showGstSubmenu, setShowGstSubmenu] = useState(false);

  const gstSubItems = [
    { id: 'gst-purchase', label: 'GST Purchase' },
    { id: 'gst-sale', label: 'GST Sale' }
  ];

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

  // Define sidebar menu options exactly matching original list fields & names
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'customers', label: 'Parties', icon: Users, hasDropdown: true, action: 'dropdown' },
    { id: 'products', label: 'Items', icon: ShoppingBag, hasPlus: true, action: 'plus' },
    { id: 'transactions', label: 'Sale', icon: Receipt, hasDropdown: true, action: 'dropdown' },
    { id: 'purchases', label: 'Purchase & Expense', icon: ShoppingCart, hasDropdown: true, action: 'dropdown' },
    { id: 'bank', label: 'Cash & Bank', icon: Landmark, hasDropdown: true, action: 'dropdown' },
    { id: 'gst-required', label: 'GST Required', icon: Percent, hasDropdown: true, action: 'dropdown' },
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
    } else if (id === 'gst-required') {
      setShowGstSubmenu(!showGstSubmenu);
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

  const getBusinessNameParts = () => {
    const name = activeBusiness?.name || 'NEW MAHAVIR ENTERPRISES';
    const parts = name.split(' ');
    if (parts.length === 1) return { first: name, second: '' };
    return {
      first: parts.slice(0, -1).join(' '),
      second: parts[parts.length - 1]
    };
  };

  const nameParts = getBusinessNameParts();

  return (
    <aside className={isOpen ? 'open' : ''} style={styles.sidebar}>
      {/* Brand Header */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
        position: 'relative',
        width: '100%',
        padding: '16px 0 8px 0',
        marginBottom: '20px'
      }}>
        {activeBusiness?.logo ? (
          <img 
            src={activeBusiness.logo} 
            alt="Logo" 
            style={{ width: '56px', height: '56px', borderRadius: '50%', objectFit: 'cover', border: '2px solid rgba(16, 185, 129, 0.3)', flexShrink: 0, display: 'block', margin: '0 auto' }} 
          />
        ) : (
          <div style={{ ...styles.logoContainer, width: '48px', height: '48px', margin: '0 auto' }}>
            <Building size={24} color="#10B981" />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', lineHeight: '1.2' }}>
          <span style={styles.brandFirst}>{nameParts.first}</span>
          <span style={styles.brandSecond}>{nameParts.second}</span>
        </div>
        {onClose && (
          <button className="mobile-menu-close" onClick={onClose} style={{ ...styles.closeBtn, position: 'absolute', top: '0', right: '0', padding: '4px' }}>
            <X size={18} color="#94A3B8" />
          </button>
        )}
      </div>

      {/* Active Business Switcher Dropdown */}
      <div style={{ position: 'relative', marginBottom: '20px' }}>
        <button
          onClick={() => setShowBusinessSelect(!showBusinessSelect)}
          style={styles.businessSelectBtn}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={styles.activeDot} />
            <span style={styles.activeBusinessText}>Active Business</span>
          </div>
          <ChevronDown size={14} color="#94A3B8" />
        </button>

        {/* Popover */}
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
                      backgroundColor: isCurrent ? 'rgba(16, 185, 129, 0.1)' : 'transparent',
                    }}
                  >
                    <button 
                      style={{
                        ...styles.businessSelectItem,
                        color: isCurrent ? '#10B981' : '#E2E8F0',
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
                      <Edit2 size={12} color="#94A3B8" />
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
      </div>

      {/* Search bar inside Sidebar */}
      <div style={styles.searchContainer}>
        <Search size={14} color="#64748B" style={styles.searchIcon} />
        <input
          type="text"
          placeholder="Search items..."
          style={styles.searchInput}
          value={searchSidebar}
          onChange={(e) => setSearchSidebar(e.target.value)}
        />
      </div>

      {/* Navigation menu list */}
      <nav style={styles.nav}>
        {menuItems
          .filter(item => item.label.toLowerCase().includes(searchSidebar.toLowerCase()))
          .map((item) => {
            const Icon = item.icon;
            const isPurchasesActive = ['purchase-bills', 'payment-out', 'expenses', 'purchase-order', 'purchase-return'].includes(currentTab);
            const isBankActive = ['bank-accounts', 'cash-in-hand', 'cheques', 'loan-accounts'].includes(currentTab);
            const isSaleActive = ['sale-invoices', 'estimate-quotation', 'proforma-invoice', 'payment-in', 'sale-order', 'delivery-challan', 'sale-return'].includes(currentTab);
            const isGstActive = ['gst-purchase', 'gst-sale'].includes(currentTab);
            const isActive = currentTab === item.id || 
              (item.id === 'purchases' && isPurchasesActive) ||
              (item.id === 'bank' && isBankActive) ||
              (item.id === 'transactions' && isSaleActive) ||
              (item.id === 'gst-required' && isGstActive);

            const isDropdownRotated = (item.id === 'purchases' && showPurchaseSubmenu) || 
                                      (item.id === 'bank' && showBankSubmenu) ||
                                      (item.id === 'transactions' && showSaleSubmenu) ||
                                      (item.id === 'gst-required' && showGstSubmenu);

            return (
              <div key={item.id} style={styles.navItemWrapper}>
                <button
                  onClick={() => handleItemClick(item.id)}
                  style={{
                    ...styles.navItem,
                    backgroundColor: isActive ? '#047857' : 'transparent',
                    color: isActive ? '#FFFFFF' : '#94A3B8',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <Icon size={18} color={isActive ? '#FFFFFF' : '#94A3B8'} />
                    <span style={{
                      ...styles.itemLabel,
                      fontWeight: isActive ? '600' : '500'
                    }}>{item.label}</span>
                  </div>

                  {item.hasDropdown ? (
                    <ChevronDown size={14} color={isActive ? '#FFFFFF' : '#64748B'} style={{ transform: isDropdownRotated ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                  ) : item.id !== 'sync' ? (
                    <ChevronRight size={14} color={isActive ? '#FFFFFF' : '#64748B'} />
                  ) : null}
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
                            backgroundColor: isSubActive ? 'rgba(4, 120, 87, 0.15)' : 'transparent',
                            color: isSubActive ? '#FFFFFF' : '#94A3B8',
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
                            <Plus size={12} color="#94A3B8" style={styles.submenuPlus} />
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
                            backgroundColor: isSubActive ? 'rgba(4, 120, 87, 0.15)' : 'transparent',
                            color: isSubActive ? '#FFFFFF' : '#94A3B8',
                          }}
                        >
                          <span>{sub.label}</span>
                          <Plus size={12} color="#94A3B8" style={styles.submenuPlus} />
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
                            backgroundColor: isSubActive ? 'rgba(4, 120, 87, 0.15)' : 'transparent',
                            color: isSubActive ? '#FFFFFF' : '#94A3B8',
                          }}
                        >
                          <span>{sub.label}</span>
                          <Plus size={12} color="#94A3B8" style={styles.submenuPlus} />
                        </button>
                      );
                    })}
                  </div>
                )}

                {item.id === 'gst-required' && (showGstSubmenu || isGstActive) && (
                  <div style={styles.submenuContainer}>
                    {gstSubItems.map((sub) => {
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
                            backgroundColor: isSubActive ? 'rgba(4, 120, 87, 0.15)' : 'transparent',
                            color: isSubActive ? '#FFFFFF' : '#94A3B8',
                          }}
                        >
                          <span>{sub.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
      </nav>

      {/* Footer brand info */}
      <div style={{
        borderTop: '1px solid #1E293B',
        paddingTop: '16px',
        marginTop: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        width: '100%'
      }}>
        <img src="/logo.jpg" alt="Logo" style={{ width: '42px', height: '42px', borderRadius: '8px', objectFit: 'cover', display: 'block', margin: '0 auto' }} />
        <span style={{ fontSize: '18px', fontWeight: '800', color: '#3B82F6', letterSpacing: '0.8px', textAlign: 'center' }}>BusinessPro</span>
      </div>
    </aside>
  );
};

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '260px',
    backgroundColor: '#090D1A', // Slate-black sidebar matching screenshot
    display: 'flex',
    flexDirection: 'column',
    padding: '24px 16px',
    height: '100vh',
    flexShrink: 0,
    borderRight: '1px solid #1E293B',
    fontFamily: 'var(--font-sans, "Inter", sans-serif)',
  },
  brandHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 4px',
    marginBottom: '20px',
  },
  logoContainer: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1px solid rgba(16, 185, 129, 0.2)'
  },
  brandFirst: {
    fontSize: '13px',
    fontWeight: '800',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  brandSecond: {
    fontSize: '15px',
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: '1.2px',
    marginTop: '2px',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  businessSelectBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    border: '1px solid #1E293B',
    borderRadius: '10px',
    padding: '10px 14px',
    cursor: 'pointer',
    outline: 'none',
    transition: 'all 0.2s',
  },
  activeDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
    backgroundColor: '#10B981',
    display: 'inline-block',
  },
  activeBusinessText: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#E2E8F0',
  },
  searchContainer: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: '10px',
    padding: '8px 12px',
    marginBottom: '20px',
    border: '1px solid #1E293B',
  },
  searchIcon: {
    marginRight: '8px',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    color: '#E2E8F0',
    fontSize: '12px',
    width: '100%',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
    overflowY: 'auto',
    paddingRight: '2px',
  },
  navItemWrapper: {
    width: '100%',
  },
  navItem: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    textAlign: 'left',
    outline: 'none',
  },
  itemLabel: {
    fontSize: '13px',
    letterSpacing: '0.2px',
  },
  footerWrapper: {
    borderTop: '1px solid #1E293B',
    paddingTop: '12px',
    marginTop: 'auto',
    textAlign: 'center',
  },
  businessPopover: {
    position: 'absolute',
    top: '46px',
    left: '0',
    right: '0',
    backgroundColor: '#0F172A',
    border: '1px solid #1E293B',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0, 0, 0, 0.4)',
    zIndex: 9999,
    padding: '8px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  popoverHeader: {
    fontSize: '11px',
    fontWeight: '700',
    color: '#64748B',
    padding: '6px 8px',
    borderBottom: '1px solid #1E293B',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  businessList: {
    maxHeight: '180px',
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    padding: '4px 0',
  },
  businessSelectItemContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: '6px',
    paddingRight: '6px',
    transition: 'background 0.2s',
  },
  businessSelectItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '8px 10px',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    textAlign: 'left',
    fontSize: '12px',
    width: '100%',
    backgroundColor: 'transparent',
    outline: 'none',
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
  },
  noBusinessHint: {
    padding: '12px',
    fontSize: '11px',
    color: '#64748B',
    textAlign: 'center',
  },
  popoverAddBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    padding: '8px 12px',
    backgroundColor: '#10B981',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: '700',
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
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    color: '#F87171',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    borderRadius: '8px',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '6px',
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
    textAlign: 'left',
    fontSize: '12px',
    width: '100%',
    transition: 'all 0.2s',
    outline: 'none',
  },
  submenuPlus: {
    opacity: 0.6,
  }
};
