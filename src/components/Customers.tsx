import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Customer } from '../context/AppContext';
import { 
  Edit2, 
  Trash2, 
  Settings, 
  X, 
  Plus, 
  Mail, 
  Phone, 
  MapPin, 
  Info
} from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, activeBusiness, addCustomer, updateCustomer, deleteCustomer } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFormTab, setActiveFormTab] = useState<'gst' | 'credit' | 'additional'>('gst');

  // Form input states matching the screenshot fields
  const [partyName, setPartyName] = useState('');
  const [gstin, setGstin] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [gstType, setGstType] = useState('Unregistered/Consumer');
  const [state, setState] = useState('Maharashtra');
  const [emailId, setEmailId] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [enableShipping, setEnableShipping] = useState(false);
  const [shippingAddress, setShippingAddress] = useState('');

  // Credit & Balance states
  const [openingBalance, setOpeningBalance] = useState('');
  const [asOfDate, setAsOfDate] = useState('12/07/2026');
  const [creditLimitType, setCreditLimitType] = useState<'no-limit' | 'custom'>('no-limit');
  const [customCreditLimit, setCustomCreditLimit] = useState('');

  // Additional Fields states
  const [addField1Checked, setAddField1Checked] = useState(false);
  const [addField1Name, setAddField1Name] = useState('');
  const [addField2Checked, setAddField2Checked] = useState(false);
  const [addField2Name, setAddField2Name] = useState('');
  const [addField3Checked, setAddField3Checked] = useState(false);
  const [addField3Name, setAddField3Name] = useState('');
  const [addField4Checked, setAddField4Checked] = useState(false);
  const [addField4Name, setAddField4Name] = useState('');
  const [addField4Type, setAddField4Type] = useState('dd/mm/yy');

  const businessCustomers = customers.filter((c) => c.businessId === activeBusiness?.id);
  
  const filteredCustomers = businessCustomers.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.gst && c.gst.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleOpenAdd = () => {
    setEditingCustomer(null);
    setPartyName('');
    setGstin('');
    setPhoneNumber('');
    setGstType('Unregistered/Consumer');
    setState('Maharashtra');
    setEmailId('');
    setBillingAddress('');
    setEnableShipping(false);
    setShippingAddress('');
    
    // Reset tabs
    setOpeningBalance('');
    setAsOfDate('2026-07-12');
    setCreditLimitType('no-limit');
    setCustomCreditLimit('');
    setAddField1Checked(false);
    setAddField1Name('');
    setAddField2Checked(false);
    setAddField2Name('');
    setAddField3Checked(false);
    setAddField3Name('');
    setAddField4Checked(false);
    setAddField4Name('');
    setAddField4Type('dd/mm/yy');
    setActiveFormTab('gst');
    
    setShowModal(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setPartyName(c.name);
    setGstin(c.gst || '');
    setPhoneNumber(c.phone);
    setGstType(c.gst ? 'Registered Business - Regular' : 'Unregistered/Consumer');
    setState('Maharashtra');
    setEmailId(c.email || '');
    setBillingAddress(c.address || '');
    setEnableShipping(false);
    setShippingAddress('');
    
    // Reset tabs
    setOpeningBalance('');
    setAsOfDate('2026-07-12');
    setCreditLimitType('no-limit');
    setCustomCreditLimit('');
    setAddField1Checked(false);
    setAddField1Name('');
    setAddField2Checked(false);
    setAddField2Name('');
    setAddField3Checked(false);
    setAddField3Name('');
    setAddField4Checked(false);
    setAddField4Name('');
    setAddField4Type('dd/mm/yy');
    setActiveFormTab('gst');

    setShowModal(true);
  };

  const handleSave = (e: React.FormEvent, andNew: boolean = false) => {
    e.preventDefault();
    if (!partyName) {
      alert('Party Name is required');
      return;
    }

    if (phoneNumber && phoneNumber !== 'N/A' && !/^\d{10}$/.test(phoneNumber)) {
      alert('Phone Number must be exactly 10 digits');
      return;
    }

    if (gstin && !/^[a-zA-Z0-9]{15}$/.test(gstin)) {
      alert('GSTIN must be exactly 15 alphanumeric characters');
      return;
    }

    const payload = {
      name: partyName,
      phone: phoneNumber || 'N/A',
      gst: gstin,
      address: billingAddress,
      email: emailId
    };

    if (editingCustomer) {
      updateCustomer({
        ...editingCustomer,
        ...payload
      });
    } else {
      addCustomer(payload);
    }

    if (andNew) {
      // Clear for next input
      setPartyName('');
      setGstin('');
      setPhoneNumber('');
      setEmailId('');
      setBillingAddress('');
    } else {
      setShowModal(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this party?')) {
      deleteCustomer(id);
    }
  };

  // If no customers registered for the business yet, show empty state (1st Image)
  const isListEmpty = businessCustomers.length === 0;

  if (isListEmpty && !showModal) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyCard}>
          <h2 style={styles.emptyTitle}>Party Details</h2>
          <p style={styles.emptySubtitle}>
            Add your customers and suppliers to manage your business easily.<br />
            Track payments and grow your business without any hassle!
          </p>

          {/* Visual Vector Artwork Mimicking the Screenshot */}
          <div style={styles.vectorWrapper}>
            <div style={styles.mockupBrowser}>
              <div style={styles.browserHeader}>
                <span style={{ ...styles.dot, backgroundColor: '#EF4444' }}></span>
                <span style={{ ...styles.dot, backgroundColor: '#F59E0B' }}></span>
                <span style={{ ...styles.dot, backgroundColor: '#10B981' }}></span>
              </div>
              <div style={styles.browserContent}>
                <div style={styles.mockRowGold}></div>
                <div style={styles.mockListRow}>
                  <span style={styles.mockAvatar}></span>
                  <div style={styles.mockTextLines}>
                    <span style={styles.mockTextLine1}></span>
                    <span style={styles.mockTextLine2}></span>
                  </div>
                </div>
                <div style={styles.mockListRow}>
                  <span style={styles.mockAvatar}></span>
                  <div style={styles.mockTextLines}>
                    <span style={styles.mockTextLine1}></span>
                    <span style={styles.mockTextLine2}></span>
                  </div>
                </div>
              </div>
            </div>

            {/* Floating character illustration overlay */}
            <div style={styles.characterRing}>
              <div style={styles.manAvatar}>
                <span style={styles.hair}></span>
                <span style={styles.face}></span>
                <span style={styles.shirt}></span>
              </div>
              <div style={styles.ringPlusIcon}>+</div>
            </div>
          </div>

          <button style={styles.addPartyBtn} onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Your First Party</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* List Header */}
      <div className="responsive-top-row">
        <div>
          <h1 style={styles.title}>Parties & Accounts</h1>
          <p style={styles.subtitle}>Supervise customer balances, invoices, and billing accounts.</p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenAdd}>
          <Plus size={16} />
          <span>Add Party</span>
        </button>
      </div>

      {/* Filter and Search */}
      <div style={{ marginBottom: '18px' }}>
        <input
          type="text"
          placeholder="Search by Name, Phone, Email or GSTIN..."
          className="form-control"
          style={{ width: '100%', maxWidth: '400px' }}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Grid List */}
      <div className="table-wrapper">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Party Details</th>
              <th>Phone Number</th>
              <th>Email Address</th>
              <th>GSTIN</th>
              <th>Billing Address</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id}>
                <td style={{ fontWeight: '600', color: 'var(--color-primary)' }}>{c.name}</td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Phone size={12} color="var(--color-text-muted)" />
                    <span>{c.phone}</span>
                  </div>
                </td>
                <td>
                  {c.email ? (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Mail size={12} color="var(--color-text-muted)" />
                      <span>{c.email}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>—</span>
                  )}
                </td>
                <td>
                  {c.gst ? (
                    <span style={styles.gstTag}>{c.gst}</span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '11px', fontStyle: 'italic' }}>Consumer</span>
                  )}
                </td>
                <td>
                  {c.address ? (
                    <div style={styles.addressCell}>
                      <MapPin size={12} color="var(--color-text-muted)" style={{ flexShrink: 0 }} />
                      <span style={styles.addressText}>{c.address}</span>
                    </div>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)', fontSize: '12px' }}>—</span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'inline-flex', gap: '8px' }}>
                    <button style={styles.actionBtn} onClick={() => handleOpenEdit(c)}>
                      <Edit2 size={14} color="var(--color-primary)" />
                    </button>
                    <button style={{ ...styles.actionBtn, backgroundColor: 'var(--color-danger-bg)' }} onClick={() => handleDelete(c.id)}>
                      <Trash2 size={14} color="var(--color-danger)" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                  No matches found for "{searchQuery}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Popup (2nd Image) */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <span style={styles.modalTitle}>Add Party</span>
              <div style={styles.headerIcons}>
                <Settings size={18} style={styles.headerIcon} />
                <X size={18} style={styles.headerIcon} onClick={() => setShowModal(false)} />
              </div>
            </div>

            {/* Modal Form */}
            <form onSubmit={(e) => handleSave(e, false)} style={styles.form}>
              {/* Top Row Inputs */}
              <div style={styles.formTopRow}>
                <div className="form-group" style={{ flex: 1.2 }}>
                  <label style={styles.fieldLabel}>Party Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    style={styles.modalInput}
                    placeholder="Enter Party Name"
                    value={partyName}
                    onChange={(e) => setPartyName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>GSTIN</label>
                  <div style={styles.inputWithIconWrapper}>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="GSTIN"
                      value={gstin}
                      onChange={(e) => setGstin(e.target.value)}
                    />
                    <Info size={14} color="#9CA3AF" style={styles.infoBadge} />
                  </div>
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label style={styles.fieldLabel}>Phone Number</label>
                  <input
                    type="text"
                    className="form-control"
                    style={styles.modalInput}
                    placeholder="Phone Number"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              {/* Form Navigation Tabs */}
              <div style={styles.formTabsRow}>
                <button
                  type="button"
                  style={{
                    ...styles.formTab,
                    borderBottom: activeFormTab === 'gst' ? '3px solid #3B82F6' : 'none',
                    color: activeFormTab === 'gst' ? '#3B82F6' : '#9CA3AF',
                    fontWeight: activeFormTab === 'gst' ? '600' : '500'
                  }}
                  onClick={() => setActiveFormTab('gst')}
                >
                  GST & Address
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.formTab,
                    borderBottom: activeFormTab === 'credit' ? '3px solid #3B82F6' : 'none',
                    color: activeFormTab === 'credit' ? '#3B82F6' : '#9CA3AF',
                    fontWeight: activeFormTab === 'credit' ? '600' : '500'
                  }}
                  onClick={() => setActiveFormTab('credit')}
                >
                  <span>Credit & Balance</span>
                  <span style={styles.newBadge}>New</span>
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.formTab,
                    borderBottom: activeFormTab === 'additional' ? '3px solid #3B82F6' : 'none',
                    color: activeFormTab === 'additional' ? '#3B82F6' : '#9CA3AF',
                    fontWeight: activeFormTab === 'additional' ? '600' : '500'
                  }}
                  onClick={() => setActiveFormTab('additional')}
                >
                  Additional Fields
                </button>
              </div>

              {/* Tab Content: GST & Address */}
              {activeFormTab === 'gst' && (
                <div style={styles.tabContentGrid}>
                  {/* Left Column */}
                  <div style={styles.tabColumn}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>GST Type</label>
                      <select 
                        className="form-control" 
                        style={styles.modalInput}
                        value={gstType}
                        onChange={(e) => setGstType(e.target.value)}
                      >
                        <option value="Unregistered/Consumer">Unregistered/Consumer</option>
                        <option value="Registered Business - Regular">Registered Business - Regular</option>
                        <option value="Registered Business - Composition">Registered Business - Composition</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginTop: '12px' }}>
                      <label style={styles.fieldLabel}>State</label>
                      <select 
                        className="form-control" 
                        style={styles.modalInput}
                        value={state}
                        onChange={(e) => setState(e.target.value)}
                      >
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Gujarat">Gujarat</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                      </select>
                    </div>

                    <div className="form-group" style={{ marginTop: '12px' }}>
                      <label style={styles.fieldLabel}>Email ID</label>
                      <input
                        type="email"
                        className="form-control"
                        style={styles.modalInput}
                        placeholder="Email ID"
                        value={emailId}
                        onChange={(e) => setEmailId(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Center Column: Billing Address */}
                  <div style={styles.tabColumn}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Billing Address</label>
                      <textarea
                        className="form-control"
                        style={styles.modalTextarea}
                        placeholder="Billing Address"
                        value={billingAddress}
                        onChange={(e) => setBillingAddress(e.target.value)}
                      />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
                      <span style={styles.detailedAddressLink}>👁 Show Detailed Address</span>
                    </div>
                  </div>

                  {/* Right Column: Shipping Address */}
                  <div style={styles.tabColumn}>
                    <label style={styles.fieldLabel}>Shipping Address</label>
                    {!enableShipping ? (
                      <button 
                        type="button" 
                        style={styles.enableShippingBtn}
                        onClick={() => setEnableShipping(true)}
                      >
                        + Enable Shipping Address
                      </button>
                    ) : (
                      <textarea
                        className="form-control"
                        style={styles.modalTextarea}
                        placeholder="Shipping Address"
                        value={shippingAddress}
                        onChange={(e) => setShippingAddress(e.target.value)}
                      />
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: Credit & Balance */}
              {activeFormTab === 'credit' && (
                <div style={styles.tabContentBlock}>
                  <div style={styles.tabInlineRow}>
                    <div className="form-group" style={{ width: '280px' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={styles.modalInput}
                        placeholder="Opening Balance"
                        value={openingBalance}
                        onChange={(e) => setOpeningBalance(e.target.value)}
                      />
                    </div>
                    
                    <div className="form-group" style={{ width: '280px', position: 'relative' }}>
                      <label style={styles.fieldLabelOverlay}>As Of Date</label>
                      <input
                        type="text"
                        placeholder="DD/MM/YYYY"
                        className="form-control"
                        style={{ ...styles.modalInput, paddingTop: '16px' }}
                        value={asOfDate}
                        onChange={(e) => setAsOfDate(e.target.value)}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                      <span style={{ fontSize: '13px', fontWeight: '600', color: '#1F2937' }}>Credit Limit</span>
                      <span title="Set party credit limits"><Info size={12} color="#9CA3AF" /></span>
                    </div>

                    <div style={styles.toggleRow}>
                      <span style={{ fontSize: '13px', fontWeight: creditLimitType === 'no-limit' ? '700' : '400', color: creditLimitType === 'no-limit' ? '#3B82F6' : '#6B7280' }}>No Limit</span>
                      
                      <label style={styles.switch}>
                        <input
                          type="checkbox"
                          style={{ display: 'none' }}
                          checked={creditLimitType === 'custom'}
                          onChange={(e) => setCreditLimitType(e.target.checked ? 'custom' : 'no-limit')}
                        />
                        <span style={{
                          ...styles.slider,
                          backgroundColor: creditLimitType === 'custom' ? '#3B82F6' : '#D1D5DB'
                        }}>
                          <span style={{
                            ...styles.sliderCircle,
                            left: creditLimitType === 'custom' ? '24px' : '3px'
                          }}></span>
                        </span>
                      </label>
                      
                      <span style={{ fontSize: '13px', fontWeight: creditLimitType === 'custom' ? '700' : '400', color: creditLimitType === 'custom' ? '#3B82F6' : '#6B7280' }}>Custom Limit</span>
                    </div>

                    {creditLimitType === 'custom' && (
                      <div className="form-group" style={{ width: '280px', marginTop: '14px' }}>
                        <label style={styles.fieldLabel}>Credit Limit Amount (₹)</label>
                        <input
                          type="number"
                          className="form-control"
                          style={styles.modalInput}
                          placeholder="Enter Custom Credit Limit"
                          value={customCreditLimit}
                          onChange={(e) => setCustomCreditLimit(e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Tab Content: Additional Fields */}
              {activeFormTab === 'additional' && (
                <div style={styles.tabContentBlock}>
                  {/* Row 1 */}
                  <div style={styles.additionalRow}>
                    <input
                      type="checkbox"
                      style={styles.checkboxStyle}
                      checked={addField1Checked}
                      onChange={(e) => setAddField1Checked(e.target.checked)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInputShort}
                      placeholder="Additional Field 1 Name"
                      value={addField1Name}
                      onChange={(e) => setAddField1Name(e.target.value)}
                    />
                  </div>

                  {/* Row 2 */}
                  <div style={styles.additionalRow}>
                    <input
                      type="checkbox"
                      style={styles.checkboxStyle}
                      checked={addField2Checked}
                      onChange={(e) => setAddField2Checked(e.target.checked)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInputShort}
                      placeholder="Additional Field 2 Name"
                      value={addField2Name}
                      onChange={(e) => setAddField2Name(e.target.value)}
                    />
                  </div>

                  {/* Row 3 */}
                  <div style={styles.additionalRow}>
                    <input
                      type="checkbox"
                      style={styles.checkboxStyle}
                      checked={addField3Checked}
                      onChange={(e) => setAddField3Checked(e.target.checked)}
                    />
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInputShort}
                      placeholder="Additional Field 3 Name"
                      value={addField3Name}
                      onChange={(e) => setAddField3Name(e.target.value)}
                    />
                  </div>

                  {/* Row 4 */}
                  <div style={styles.additionalRow}>
                    <input
                      type="checkbox"
                      style={styles.checkboxStyle}
                      checked={addField4Checked}
                      onChange={(e) => setAddField4Checked(e.target.checked)}
                    />
                    <div style={{ display: 'flex', gap: '8px', width: '380px' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ ...styles.modalInput, flex: 1 }}
                        placeholder="Additional Field 4 Name"
                        value={addField4Name}
                        onChange={(e) => setAddField4Name(e.target.value)}
                      />
                      <select
                        className="form-control"
                        style={{ ...styles.modalInput, width: '120px' }}
                        value={addField4Type}
                        onChange={(e) => setAddField4Type(e.target.value)}
                      >
                        <option value="dd/mm/yy">dd/mm/yy</option>
                        <option value="text">Text</option>
                        <option value="number">Number</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.saveAndNewBtn}
                  onClick={(e) => handleSave(e, true)}
                >
                  Save & New
                </button>
                <button 
                  type="submit" 
                  style={styles.saveBtn}
                >
                  Save
                </button>
              </div>

            </form>
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
  gstTag: {
    fontFamily: 'monospace',
    fontWeight: '600',
    backgroundColor: 'rgba(197, 168, 128, 0.1)',
    color: 'var(--color-primary)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '12px',
  },
  addressCell: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    maxWidth: '220px',
  },
  addressText: {
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    fontSize: '13px',
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
  emptyContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    padding: '40px 0',
  },
  emptyCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    width: '100%',
    maxWidth: '650px',
  },
  emptyTitle: {
    fontFamily: 'var(--font-sans)',
    fontSize: '28px',
    fontWeight: '700',
    color: '#374151',
    marginBottom: '10px',
  },
  emptySubtitle: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#6B7280',
    marginBottom: '32px',
  },
  vectorWrapper: {
    position: 'relative',
    width: '380px',
    height: '220px',
    marginBottom: '40px',
  },
  mockupBrowser: {
    width: '260px',
    height: '160px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '8px',
    backgroundColor: '#FFFFFF',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
    display: 'flex',
    flexDirection: 'column',
    position: 'absolute',
    left: '20px',
    top: '20px',
  },
  browserHeader: {
    height: '24px',
    borderBottom: '1px solid #E5E7EB',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    paddingLeft: '10px',
  },
  dot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
  },
  browserContent: {
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  mockRowGold: {
    height: '10px',
    backgroundColor: '#F59E0B',
    borderRadius: '4px',
    width: '60px',
    marginBottom: '6px',
    opacity: 0.7,
  },
  mockListRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  mockAvatar: {
    width: '18px',
    height: '18px',
    borderRadius: '50%',
    backgroundColor: '#E5E7EB',
  },
  mockTextLines: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    flex: 1,
  },
  mockTextLine1: {
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    width: '80%',
  },
  mockTextLine2: {
    height: '6px',
    backgroundColor: '#E5E7EB',
    borderRadius: '3px',
    width: '50%',
  },
  characterRing: {
    position: 'absolute',
    right: '20px',
    top: '30px',
    width: '130px',
    height: '130px',
    borderRadius: '50%',
    border: '3.5px solid #FBBF24', // Gold circle matching screenshot character outline
    backgroundColor: '#FFFBEB',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  manAvatar: {
    position: 'relative',
    width: '80px',
    height: '100px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    marginTop: '24px',
  },
  hair: {
    width: '32px',
    height: '16px',
    backgroundColor: '#374151',
    borderRadius: '8px 8px 0 0',
  },
  face: {
    width: '28px',
    height: '28px',
    backgroundColor: '#FDE047',
    borderRadius: '50%',
    marginTop: '-4px',
  },
  shirt: {
    width: '50px',
    height: '60px',
    backgroundColor: '#FBBF24', // Yellow shirt
    borderRadius: '12px 12px 0 0',
    marginTop: '2px',
  },
  ringPlusIcon: {
    position: 'absolute',
    left: '12px',
    bottom: '22px',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#1E293B',
    color: '#FFFFFF',
    fontSize: '18px',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
  },
  addPartyBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '12px 32px',
    borderRadius: '24px',
    border: 'none',
    backgroundColor: '#E81A3F', // Red button matching screenshot
    color: '#FFFFFF',
    fontSize: '14px',
    fontWeight: '600',
    cursor: 'pointer',
    boxShadow: '0 4px 6px -1px rgba(232, 26, 63, 0.2)',
    transition: 'all 0.2s',
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
    width: '920px',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
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
  headerIcons: {
    display: 'flex',
    gap: '14px',
    alignItems: 'center',
  },
  headerIcon: {
    cursor: 'pointer',
    color: '#9CA3AF',
  },
  form: {
    padding: '24px',
  },
  formTopRow: {
    display: 'flex',
    gap: '20px',
    marginBottom: '20px',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#3B82F6', // Blue highlight text
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
  inputWithIconWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  infoBadge: {
    position: 'absolute',
    right: '10px',
  },
  formTabsRow: {
    display: 'flex',
    borderBottom: '1px solid #E5E7EB',
    gap: '30px',
    marginBottom: '20px',
  },
  formTab: {
    padding: '10px 0',
    background: 'none',
    border: 'none',
    fontSize: '13px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  newBadge: {
    fontSize: '9px',
    backgroundColor: '#EF4444',
    color: '#FFFFFF',
    padding: '1px 5px',
    borderRadius: '4px',
    fontWeight: '700',
  },
  tabContentGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1.5fr 1.5fr',
    gap: '30px',
    marginBottom: '30px',
  },
  tabColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  modalTextarea: {
    padding: '8px 12px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#1F2937',
    width: '100%',
    height: '90px',
    outline: 'none',
    resize: 'none',
  },
  detailedAddressLink: {
    fontSize: '11px',
    color: '#3B82F6',
    cursor: 'pointer',
  },
  enableShippingBtn: {
    padding: '12px',
    border: '1px dashed #3B82F6',
    borderRadius: '6px',
    backgroundColor: 'rgba(59, 130, 246, 0.03)',
    color: '#3B82F6',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    textAlign: 'left',
  },
  modalFooter: {
    borderTop: '1px solid #E5E7EB',
    paddingTop: '20px',
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
  },
  saveAndNewBtn: {
    padding: '8px 24px',
    borderRadius: '6px',
    border: '1.5px solid #3B82F6',
    backgroundColor: 'transparent',
    color: '#3B82F6',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  saveBtn: {
    padding: '8px 32px',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#3B82F6', // Blue Save button
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  },
  tabContentBlock: {
    padding: '10px 0',
    minHeight: '220px',
  },
  tabInlineRow: {
    display: 'flex',
    gap: '24px',
  },
  fieldLabelOverlay: {
    position: 'absolute',
    top: '3px',
    left: '12px',
    fontSize: '9px',
    color: '#9CA3AF',
    fontWeight: '600',
  },
  toggleRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  switch: {
    position: 'relative' as const,
    display: 'inline-block',
    width: '46px',
    height: '24px',
    cursor: 'pointer',
  },
  slider: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transition: '.2s',
    borderRadius: '24px',
    display: 'block',
  },
  sliderCircle: {
    position: 'absolute' as const,
    height: '18px',
    width: '18px',
    bottom: '3px',
    backgroundColor: 'white',
    transition: '.2s',
    borderRadius: '50%',
  },
  additionalRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '12px',
  },
  checkboxStyle: {
    width: '18px',
    height: '18px',
    cursor: 'pointer',
  },
  modalInputShort: {
    padding: '8px 12px',
    border: '1.5px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '13px',
    color: '#1F2937',
    width: '380px',
    outline: 'none',
  }
};
