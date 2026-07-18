import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Camera, HelpCircle, UploadCloud } from 'lucide-react';
import { uploadImageToCloudinary } from '../utils/cloudinary';

interface WizardProps {
  onComplete: () => void;
  onCancel?: () => void;
  isFirstBusiness?: boolean;
  editMode?: boolean;
  editingBusinessId?: string;
}

export const Wizard: React.FC<WizardProps> = ({ onComplete, onCancel, isFirstBusiness = false, editMode = false, editingBusinessId }) => {
  const { addBusiness, updateBusiness, activeBusiness, businesses } = useApp();

  const targetBusiness = editMode 
    ? (businesses.find(b => b.id === editingBusinessId) || activeBusiness) 
    : null;

  const [formData, setFormData] = useState(() => {
    if (editMode && targetBusiness) {
      return {
        name: targetBusiness.name || '',
        logo: targetBusiness.logo || '',
        gst: targetBusiness.gst || '',
        pan: targetBusiness.pan || '',
        type: targetBusiness.type || '',
        category: targetBusiness.category || '',
        state: targetBusiness.state || '',
        pincode: targetBusiness.pincode || '',
        address: targetBusiness.address || '',
        phone: targetBusiness.phone || '',
        email: targetBusiness.email || '',
        booksBeginningDate: targetBusiness.booksBeginningDate || '',
        signature: targetBusiness.signature || '',
        invoicePrefix: targetBusiness.invoicePrefix || '',
        financialYear: targetBusiness.financialYear || '',
        currency: targetBusiness.currency || '',
        taxPreference: targetBusiness.taxPreference || ''
      };
    }
    return {
      name: '',
      logo: '',
      gst: '',
      pan: '',
      type: '',
      category: '',
      state: '',
      pincode: '',
      address: '',
      phone: '',
      email: '',
      booksBeginningDate: '',
      signature: '',
      invoicePrefix: '',
      financialYear: '',
      currency: '',
      taxPreference: ''
    };
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setFormData((prev) => ({ ...prev, logo: 'Uploading...' }));
        const url = await uploadImageToCloudinary(file);
        setFormData((prev) => ({ ...prev, logo: url }));
      } catch (err: any) {
        alert('Failed to upload logo: ' + err.message);
        setFormData((prev) => ({ ...prev, logo: '' }));
      }
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        setFormData((prev) => ({ ...prev, signature: 'Uploading...' }));
        const url = await uploadImageToCloudinary(file);
        setFormData((prev) => ({ ...prev, signature: url }));
      } catch (err: any) {
        alert('Failed to upload signature: ' + err.message);
        setFormData((prev) => ({ ...prev, signature: '' }));
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      alert('Business Name is required');
      return;
    }

    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      alert('Phone Number must be exactly 10 digits');
      return;
    }

    if (formData.gst && !/^[a-zA-Z0-9]{15}$/.test(formData.gst)) {
      alert('GSTIN must be exactly 15 alphanumeric characters');
      return;
    }

    try {
      if (editMode && targetBusiness) {
        await updateBusiness({
          ...targetBusiness,
          ...formData
        });
        alert('Business profile updated successfully!');
      } else {
        const finalPrefix = formData.invoicePrefix || formData.name.substring(0, 3).toUpperCase();
        await addBusiness({
          ...formData,
          invoicePrefix: finalPrefix
        });
      }
      onComplete();
    } catch (err: any) {
      console.error('Error saving business profile:', err);
      alert(
        'Failed to save business: ' + 
        err.message + 
        '\n\nMake sure you have run the SQL script in your Supabase SQL Editor to create the tables!'
      );
    }
  };

  const overlayStyle = editMode ? styles.pageWrapper : styles.overlay;
  const containerStyle = editMode ? styles.pageContainer : styles.container;

  return (
    <div style={overlayStyle}>
      <div style={containerStyle}>
        {/* Header Title */}
        <div style={styles.header}>
          <h2 style={styles.headerTitle}>Edit Profile</h2>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          
          {/* Logo Section */}
          <div style={styles.logoRow}>
            <label htmlFor="logo-upload-input" style={styles.logoCircleWrapper}>
              <div style={styles.logoCircle}>
                {formData.logo ? (
                  formData.logo === 'Uploading...' ? (
                    <div style={{ color: '#3B82F6', fontSize: '11px', fontWeight: 'bold' }}>Uploading...</div>
                  ) : (
                    <img src={formData.logo} alt="Business Logo" style={styles.logoImg} />
                  )
                ) : (
                  <div style={styles.addLogoPlaceholder}>
                    <span>Add</span>
                    <span>Logo</span>
                  </div>
                )}
                <div style={styles.pencilBadge}>
                  <Camera size={14} color="#0F52BA" />
                </div>
              </div>
            </label>
            <input 
              type="file" 
              id="logo-upload-input" 
              accept="image/*" 
              style={{ display: 'none' }} 
              onChange={handleLogoUpload} 
            />
          </div>

          {/* Form Columns Grid */}
          <div style={styles.fieldsGrid}>
            
            {/* Column 1: Business Details */}
            <div style={styles.column}>
              <h3 style={styles.columnHeader}>Business Details</h3>
              
              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Business Name<span style={{ color: 'red' }}>*</span></label>
                <input
                  type="text"
                  name="name"
                  className="form-control"
                  style={styles.inputStyle}
                  placeholder="Enter Business Name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Phone Number</label>
                <input
                  type="text"
                  name="phone"
                  className="form-control"
                  style={styles.inputStyle}
                  placeholder="Enter Phone Number"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>
                  GSTIN <span title="Goods and Services Tax Identification Number"><HelpCircle size={12} style={{ display: 'inline', marginLeft: '4px', cursor: 'pointer' }} /></span>
                </label>
                <input
                  type="text"
                  name="gst"
                  className="form-control"
                  style={styles.inputStyle}
                  placeholder="Enter GSTIN"
                  value={formData.gst}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Email ID</label>
                <input
                  type="email"
                  name="email"
                  className="form-control"
                  style={styles.inputStyle}
                  placeholder="Enter Email ID"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Account Books Beginning Date</label>
                <div style={styles.dateInputWrapper}>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    name="booksBeginningDate"
                    className="form-control"
                    style={{ ...styles.inputStyle, paddingRight: '40px' }}
                    value={formData.booksBeginningDate}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Column 2: More Details */}
            <div style={styles.column}>
              <h3 style={styles.columnHeader}>More Details</h3>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Business Type</label>
                <select
                  name="type"
                  className="form-control"
                  style={styles.inputStyle}
                  value={formData.type}
                  onChange={handleChange}
                >
                  <option value="">Select Business Type</option>
                  <option value="Distributor">Distributor</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                  <option value="Manufacturer">Manufacturer</option>
                  <option value="Services">Services</option>
                </select>
              </div>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Business Category</label>
                <select
                  name="category"
                  className="form-control"
                  style={styles.inputStyle}
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="">Select Business Category</option>
                  <option value="Book / Stationary store">Book / Stationary store</option>
                  <option value="Grocery / Supermarket">Grocery / Supermarket</option>
                  <option value="Apparel & Clothing">Apparel & Clothing</option>
                  <option value="Electronics & IT">Electronics & IT</option>
                  <option value="Pharmaceuticals">Pharmaceuticals</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>State</label>
                <select
                  name="state"
                  className="form-control"
                  style={styles.inputStyle}
                  value={formData.state}
                  onChange={handleChange}
                >
                  <option value="">Select State</option>
                  <option value="Maharashtra">Maharashtra</option>
                  <option value="Gujarat">Gujarat</option>
                  <option value="Delhi">Delhi</option>
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Rajasthan">Rajasthan</option>
                </select>
              </div>

              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Pincode</label>
                <input
                  type="text"
                  name="pincode"
                  className="form-control"
                  style={styles.inputStyle}
                  placeholder="Enter Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                />
              </div>
            </div>

            {/* Column 3: Address & Signature */}
            <div style={styles.column}>
              <div className="form-group" style={styles.formGroupSpacing}>
                <label className="form-label" style={styles.labelStyle}>Business Address</label>
                <textarea
                  name="address"
                  className="form-control"
                  style={styles.textareaStyle}
                  placeholder="Enter Business Address"
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>

              <div className="form-group" style={{ ...styles.formGroupSpacing, marginTop: '24px' }}>
                <label className="form-label" style={styles.labelStyle}>Add Signature</label>
                <label htmlFor="signature-upload-input" style={styles.signatureBox}>
                  {formData.signature ? (
                    <div style={styles.signaturePreview}>
                      <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--color-success)', marginBottom: '4px' }}>Signature Registered</span>
                      <img src={formData.signature} alt="Signature Preview" style={{ maxHeight: '60px', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <>
                      <UploadCloud size={28} color="var(--color-text-muted)" style={{ marginBottom: '8px' }} />
                      <span style={styles.uploadSignatureText}>Upload Signature</span>
                    </>
                  )}
                </label>
                <input 
                  type="file" 
                  id="signature-upload-input" 
                  accept="image/*" 
                  style={{ display: 'none' }} 
                  onChange={handleSignatureUpload} 
                />
              </div>
            </div>

          </div>

          {/* Footer Actions */}
          <div style={styles.footer}>
            {!isFirstBusiness && onCancel ? (
              <button type="button" style={styles.cancelBtn} onClick={onCancel}>
                Cancel
              </button>
            ) : (
              <div />
            )}
            <button type="submit" style={styles.saveBtn}>
              Done
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F3F4F6', // Lighter grey background matching profile setup page
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    overflowY: 'auto',
    padding: '24px 0',
  },
  container: {
    backgroundColor: '#FFFFFF',
    width: '1080px',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba(0,0,0,0.06)',
    border: '1px solid #E5E7EB',
    display: 'flex',
    flexDirection: 'column',
    maxHeight: '95vh',
    overflowY: 'auto',
  },
  header: {
    padding: '16px 24px',
    borderBottom: '1px solid #E5E7EB',
  },
  headerTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#374151',
  },
  form: {
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  logoRow: {
    display: 'flex',
    justifyContent: 'flex-start',
    marginBottom: '10px',
  },
  logoCircleWrapper: {
    position: 'relative',
    cursor: 'pointer',
  },
  logoCircle: {
    width: '120px',
    height: '120px',
    borderRadius: '50%',
    border: '3px solid #3B82F6', // Blue progress-like circle
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
  },
  addLogoPlaceholder: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    fontSize: '14px',
    color: '#3B82F6',
    fontWeight: '500',
  },
  logoImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    borderRadius: '50%',
  },
  pencilBadge: {
    position: 'absolute',
    bottom: '4px',
    right: '4px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E5E7EB',
    borderRadius: '50%',
    width: '28px',
    height: '28px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
  },
  fieldsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr', // 3 Columns
    gap: '32px',
  },
  column: {
    display: 'flex',
    flexDirection: 'column',
  },
  columnHeader: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: '16px',
  },
  formGroupSpacing: {
    marginBottom: '16px',
  },
  labelStyle: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#4B5563',
    textTransform: 'none',
    letterSpacing: 'normal',
    marginBottom: '6px',
    display: 'flex',
    alignItems: 'center',
  },
  inputStyle: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1F2937',
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  textareaStyle: {
    padding: '10px 12px',
    border: '1px solid #D1D5DB',
    borderRadius: '8px',
    fontSize: '13px',
    color: '#1F2937',
    width: '100%',
    height: '100px',
    backgroundColor: '#FFFFFF',
    resize: 'none',
  },
  dateInputWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  signatureBox: {
    height: '100px',
    border: '1px dashed #D1D5DB',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9FAFB',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  signaturePreview: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '4px',
  },
  uploadSignatureText: {
    fontSize: '12px',
    color: '#9CA3AF',
    fontWeight: '500',
  },
  footer: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    borderTop: '1px solid #E5E7EB',
    paddingTop: '20px',
  },
  cancelBtn: {
    padding: '8px 16px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#F3F4F6',
    color: '#4B5563',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
  saveBtn: {
    padding: '8px 24px',
    borderRadius: '20px',
    border: 'none',
    backgroundColor: '#E81A3F', // Red save changes button
    color: '#FFFFFF',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '13px',
    transition: 'background-color 0.2s',
  },
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
  },
  pageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    boxShadow: 'var(--shadow-sm)',
    border: '1px solid var(--color-border)',
    display: 'flex',
    flexDirection: 'column',
  }
};
