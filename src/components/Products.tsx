import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import type { Product } from '../context/AppContext';
import { Plus, Edit2, Trash2, AlertTriangle, Settings, X, ClipboardList } from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';

export const Products: React.FC = () => {
  const { products, activeBusiness, addProduct, updateProduct, deleteProduct, stockHistory, deleteStockHistory } = useApp();
  const [showModal, setShowModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [historyModalProduct, setHistoryModalProduct] = useState<Product | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'list' | 'history'>('list');
  const [searchQuery, setSearchQuery] = useState('');

  const [activeModalTab, setActiveModalTab] = useState<'pricing' | 'stock'>('pricing');

  // Add Item states
  const [itemType, setItemType] = useState<'Product' | 'Service'>('Product');
  const [itemName, setItemName] = useState('');
  const [itemHsn, setItemHsn] = useState('');
  const [unit, setUnit] = useState('Pieces');
  const [category, setCategory] = useState('Notebooks');
  const [itemCode, setItemCode] = useState('');
  const [itemImage, setItemImage] = useState('');
  const [salePrice, setSalePrice] = useState<number>(0);
  const [salePriceTaxType, setSalePriceTaxType] = useState<'Without Tax' | 'With Tax'>('Without Tax');
  const [saleDiscount, setSaleDiscount] = useState<number>(0);
  const [saleDiscountType, setSaleDiscountType] = useState<'Percentage' | 'Amount'>('Percentage');
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [purchasePriceTaxType, setPurchasePriceTaxType] = useState<'Without Tax' | 'With Tax'>('Without Tax');
  const [taxRate, setTaxRate] = useState<number>(18);
  const [openingStock, setOpeningStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);

  const businessProducts = products.filter((p) => p.businessId === activeBusiness?.id);
  const filteredProducts = businessProducts.filter((p) =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const businessStockHistory = stockHistory.filter((sh) => sh.businessId === activeBusiness?.id);

  // Precompute remaining stock for each history log working backwards from current product stocks
  const stockHistoryWithRemaining = React.useMemo(() => {
    // 1. Group logs by productId
    const logsByProduct: Record<string, typeof businessStockHistory> = {};
    businessStockHistory.forEach((sh) => {
      if (!logsByProduct[sh.productId]) {
        logsByProduct[sh.productId] = [];
      }
      logsByProduct[sh.productId].push(sh);
    });

    // 2. Map of productId -> current stock
    const currentStocks: Record<string, number> = {};
    products.forEach((p) => {
      currentStocks[p.id] = p.stock;
    });

    // 3. For each product, calculate remaining stock going backwards (newest to oldest)
    const shWithRemainingMap = new Map<string, number>();
    
    Object.keys(logsByProduct).forEach((productId) => {
      // businessStockHistory is already sorted from newest to oldest
      let runningStock = currentStocks[productId] !== undefined ? currentStocks[productId] : 0;
      
      logsByProduct[productId].forEach((sh) => {
        shWithRemainingMap.set(sh.id, runningStock);
        runningStock = runningStock - sh.quantityChange;
      });
    });

    return businessStockHistory.map((sh) => ({
      ...sh,
      remainingStock: shWithRemainingMap.get(sh.id) ?? 0
    }));
  }, [businessStockHistory, products]);

  const handleOpenAdd = () => {
    setEditingProduct(null);
    setItemType('Product');
    setItemName('');
    setItemHsn('');
    setUnit('Pieces');
    setCategory('Notebooks');
    setItemCode('');
    setItemImage('');
    setSalePrice(0);
    setSalePriceTaxType('Without Tax');
    setSaleDiscount(0);
    setSaleDiscountType('Percentage');
    setPurchasePrice(0);
    setPurchasePriceTaxType('Without Tax');
    setTaxRate(18);
    setOpeningStock(0);
    setMinStock(5);
    setActiveModalTab('pricing');
    setShowModal(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setItemType('Product');
    setItemName(p.name);
    setItemHsn(p.barcode || '');
    setUnit(p.unit);
    setCategory(p.category || 'General');
    setItemCode(p.sku);
    setItemImage('');
    setSalePrice(p.sellingPrice);
    setSalePriceTaxType('Without Tax');
    setSaleDiscount(0);
    setSaleDiscountType('Percentage');
    setPurchasePrice(p.purchasePrice);
    setPurchasePriceTaxType('Without Tax');
    setTaxRate(p.gst);
    setOpeningStock(p.stock);
    setMinStock(p.minStock);
    setActiveModalTab('pricing');
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent, andNew: boolean = false) => {
    e.preventDefault();
    if (!itemName) {
      alert('Item Name is required');
      return;
    }
    const payload = {
      name: itemName,
      sku: itemCode || `SKU-${Date.now().toString().slice(-6)}`,
      barcode: itemHsn || '',
      category: category || 'General',
      purchasePrice: purchasePrice,
      sellingPrice: salePrice,
      gst: taxRate,
      unit: unit,
      stock: openingStock,
      minStock: minStock,
      image: itemImage || undefined,
    };

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        ...payload
      });
    } else {
      addProduct(payload);
    }

    if (andNew) {
      setItemName('');
      setItemHsn('');
      setItemCode('');
      setSalePrice(0);
      setPurchasePrice(0);
      setOpeningStock(0);
    } else {
      setShowModal(false);
    }
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProduct(id);
    }
  };

  return (
    <div style={styles.container}>
      {/* Top action block */}
      <div className="responsive-top-row">
        <div>
          <h1 style={styles.title}>Inventory Management</h1>
          <p style={styles.subtitle}>Supervise product catalog, pricing, and stock history.</p>
        </div>

        <div style={styles.tabsAndButtons}>
          <div style={styles.subTabGroup}>
            <button
              style={{
                ...styles.subTab,
                backgroundColor: activeSubTab === 'list' ? 'var(--color-primary)' : 'transparent',
                color: activeSubTab === 'list' ? '#fff' : 'var(--color-primary)'
              }}
              onClick={() => setActiveSubTab('list')}
            >
              Catalog List
            </button>
            <button
              style={{
                ...styles.subTab,
                backgroundColor: activeSubTab === 'history' ? 'var(--color-primary)' : 'transparent',
                color: activeSubTab === 'history' ? '#fff' : 'var(--color-primary)'
              }}
              onClick={() => setActiveSubTab('history')}
            >
              Stock History Logs
            </button>
          </div>

          <button className="btn btn-primary" onClick={handleOpenAdd}>
            <Plus size={16} />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      {activeSubTab === 'list' ? (
        <>
          {/* Search bar */}
          <div style={{ marginBottom: '18px' }}>
            <input
              type="text"
              placeholder="Search products by Name, SKU, Barcode or Category..."
              className="form-control"
              style={{ width: '100%', maxWidth: '400px' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Table */}
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Product Details</th>
                  <th>SKU / Barcode</th>
                  <th>Category</th>
                  <th>Purchase Price</th>
                  <th>Selling Price</th>
                  <th>GST</th>
                  <th>Stock Levels</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((p) => {
                  const isLowStock = p.stock <= p.minStock;
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={styles.prodName}>{p.name}</div>
                        <span style={styles.prodUnit}>{p.unit}</span>
                      </td>
                      <td>
                        <div style={styles.skuText}>SKU: {p.sku}</div>
                        <div style={styles.barcodeText}>Barcode: {p.barcode || 'N/A'}</div>
                      </td>
                      <td>
                        <span style={styles.categoryTag}>{p.category || 'General'}</span>
                      </td>
                      <td>₹{p.purchasePrice.toFixed(2)}</td>
                      <td>₹{p.sellingPrice.toFixed(2)}</td>
                      <td>{p.gst}%</td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ 
                            fontWeight: '700', 
                            color: isLowStock ? 'var(--color-danger)' : 'var(--color-success)' 
                          }}>
                            {p.stock} {p.unit}
                          </span>
                          {isLowStock && (
                            <span className="badge badge-danger" style={{ gap: '4px' }}>
                              <AlertTriangle size={10} />
                              <span>Low Stock</span>
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>Min Required: {p.minStock}</div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '8px' }}>
                          <button style={styles.actionBtn} onClick={() => setHistoryModalProduct(p)} title="Stock Records">
                            <ClipboardList size={14} color="var(--color-primary)" />
                          </button>
                          <button style={styles.actionBtn} onClick={() => handleOpenEdit(p)}>
                            <Edit2 size={14} color="var(--color-primary)" />
                          </button>
                          <button style={{ ...styles.actionBtn, backgroundColor: 'var(--color-danger-bg)' }} onClick={() => handleDelete(p.id)}>
                            <Trash2 size={14} color="var(--color-danger)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                      No products found. Click "Add Product" to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        /* History logs */
        <div className="table-wrapper">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Product</th>
                <th>Action Type</th>
                <th>Stock Adjusted</th>
                <th>Remaining Stock</th>
                <th>Doc Reference</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {stockHistoryWithRemaining.map((sh) => (
                <tr key={sh.id}>
                  <td>{formatDateDDMMYYYY(sh.date)}</td>
                  <td style={{ fontWeight: '600' }}>{sh.productName}</td>
                  <td>
                    <span className={`badge ${
                      sh.type === 'purchase' ? 'badge-success' : 'badge-danger'
                    }`}>
                      {sh.type.toUpperCase()}
                    </span>
                  </td>
                  <td style={{ 
                    fontWeight: '700', 
                    color: sh.quantityChange > 0 ? 'var(--color-success)' : 'var(--color-danger)' 
                  }}>
                    {sh.quantityChange > 0 ? `+${sh.quantityChange}` : sh.quantityChange} Units
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                    {sh.remainingStock} Units
                  </td>
                  <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{sh.referenceNo}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button 
                      style={{ ...styles.actionBtn, backgroundColor: 'var(--color-danger-bg)' }} 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this stock history log? The stock will be adjusted accordingly.')) {
                          deleteStockHistory(sh.id);
                        }
                      }}
                      title="Delete Log"
                    >
                      <Trash2 size={14} color="var(--color-danger)" />
                    </button>
                  </td>
                </tr>
              ))}
              {stockHistoryWithRemaining.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                    No stock movements recorded yet. Generate invoices or log purchases to record logs.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Popup */}
      {showModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            
            {/* Modal Header */}
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                <span style={styles.modalTitle}>Add Item</span>
                
                {/* Product/Service Toggle Switch */}
                <div style={styles.typeToggleWrapper}>
                  <span style={{ fontSize: '12px', fontWeight: itemType === 'Product' ? '700' : '400', color: itemType === 'Product' ? '#3B82F6' : '#6B7280' }}>Product</span>
                  <label style={styles.switch}>
                    <input
                      type="checkbox"
                      style={{ display: 'none' }}
                      checked={itemType === 'Service'}
                      onChange={(e) => setItemType(e.target.checked ? 'Service' : 'Product')}
                    />
                    <span style={{
                      ...styles.slider,
                      backgroundColor: itemType === 'Service' ? '#3B82F6' : '#D1D5DB'
                    }}>
                      <span style={{
                        ...styles.sliderCircle,
                        left: itemType === 'Service' ? '24px' : '3px'
                      }}></span>
                    </span>
                  </label>
                  <span style={{ fontSize: '12px', fontWeight: itemType === 'Service' ? '700' : '400', color: itemType === 'Service' ? '#3B82F6' : '#6B7280' }}>Service</span>
                </div>
              </div>

              <div style={styles.headerIcons}>
                <Settings size={18} style={styles.headerIcon} />
                <X size={18} style={styles.headerIcon} onClick={() => setShowModal(false)} />
              </div>
            </div>
            
            {/* Form */}
            <form onSubmit={(e) => handleSubmit(e, false)} style={{ padding: '24px' }}>
              
              {/* Top Controls Grid Row */}
              <div style={styles.modalTopGrid}>
                {/* Col 1 */}
                <div style={styles.topGridCol}>
                  <div className="form-group">
                    <label style={styles.fieldLabel}>Item Name *</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="Enter Item Name"
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={styles.fieldLabel}>Category</label>
                    <select
                      className="form-control"
                      style={styles.modalInput}
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="Notebooks">Notebooks</option>
                      <option value="Pens">Pens</option>
                      <option value="Paper">Paper</option>
                      <option value="Jars">Jars</option>
                      <option value="Bottled Water">Bottled Water</option>
                      <option value="General">General</option>
                    </select>
                  </div>
                </div>

                {/* Col 2 */}
                <div style={styles.topGridCol}>
                  <div className="form-group">
                    <label style={styles.fieldLabel}>Item HSN</label>
                    <input
                      type="text"
                      className="form-control"
                      style={styles.modalInput}
                      placeholder="Item HSN"
                      value={itemHsn}
                      onChange={(e) => setItemHsn(e.target.value)}
                    />
                  </div>

                  <div className="form-group" style={{ marginTop: '12px' }}>
                    <label style={styles.fieldLabel}>Item Code</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="form-control"
                        style={{ ...styles.modalInput, flex: 1 }}
                        placeholder="Item Code"
                        value={itemCode}
                        onChange={(e) => setItemCode(e.target.value)}
                      />
                      <button 
                        type="button" 
                        style={styles.assignCodeBtn}
                        onClick={() => setItemCode(`SKU-${Date.now().toString().slice(-6)}`)}
                      >
                        Assign Code
                      </button>
                    </div>
                  </div>
                </div>

                {/* Col 3 */}
                <div style={{ ...styles.topGridCol, display: 'flex', flexDirection: 'column', gap: '14px', justifyContent: 'flex-start', paddingTop: '16px' }}>
                  <button 
                    type="button" 
                    style={styles.selectUnitBtn}
                    onClick={() => {
                      const u = prompt('Enter item unit:', 'Pieces');
                      if (u) setUnit(u);
                    }}
                  >
                    Select Unit ({unit})
                  </button>

                  <button 
                    type="button" 
                    style={styles.addImageBtn}
                    onClick={() => {
                      const img = prompt('Enter Item Image URL:', 'https://images.unsplash.com/photo-1548839140-29a88648f238?w=120');
                      if (img) setItemImage(img);
                    }}
                  >
                    📸 Add Item Image
                  </button>
                </div>
              </div>

              {/* Tabs navigation row */}
              <div style={styles.formTabsRow}>
                <button
                  type="button"
                  style={{
                    ...styles.formTab,
                    borderBottom: activeModalTab === 'pricing' ? '3px solid #E81A3F' : 'none',
                    color: activeModalTab === 'pricing' ? '#E81A3F' : '#9CA3AF',
                    fontWeight: activeModalTab === 'pricing' ? '600' : '500'
                  }}
                  onClick={() => setActiveModalTab('pricing')}
                >
                  Pricing
                </button>
                <button
                  type="button"
                  style={{
                    ...styles.formTab,
                    borderBottom: activeModalTab === 'stock' ? '3px solid #E81A3F' : 'none',
                    color: activeModalTab === 'stock' ? '#E81A3F' : '#9CA3AF',
                    fontWeight: activeModalTab === 'stock' ? '600' : '500'
                  }}
                  onClick={() => setActiveModalTab('stock')}
                >
                  Stock
                </button>
              </div>

              {/* Tab pricing content */}
              {activeModalTab === 'pricing' && (
                <div style={styles.tabWrapperBlock}>
                  {/* Sale Price Section */}
                  <div style={styles.pricingCardBlock}>
                    <span style={styles.pricingHeaderTitle}>Sale Price</span>
                    <div style={styles.pricingInlineFields}>
                      <div style={{ display: 'flex', border: '1.5px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden', width: '220px' }}>
                        <input
                          type="number"
                          style={{ ...styles.modalInput, border: 'none', flex: 1 }}
                          placeholder="Sale Price"
                          value={salePrice || ''}
                          onChange={(e) => setSalePrice(parseFloat(e.target.value) || 0)}
                        />
                        <select 
                          style={{ border: 'none', borderLeft: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '11px', outline: 'none', padding: '0 8px' }}
                          value={salePriceTaxType}
                          onChange={(e) => setSalePriceTaxType(e.target.value as any)}
                        >
                          <option value="Without Tax">Without Tax</option>
                          <option value="With Tax">With Tax</option>
                        </select>
                      </div>

                      <div style={{ display: 'flex', border: '1.5px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden', width: '240px' }}>
                        <input
                          type="number"
                          style={{ ...styles.modalInput, border: 'none', flex: 1 }}
                          placeholder="Disc. On Sale Price"
                          value={saleDiscount || ''}
                          onChange={(e) => setSaleDiscount(parseFloat(e.target.value) || 0)}
                        />
                        <select 
                          style={{ border: 'none', borderLeft: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '11px', outline: 'none', padding: '0 8px' }}
                          value={saleDiscountType}
                          onChange={(e) => setSaleDiscountType(e.target.value as any)}
                        >
                          <option value="Percentage">Percentage</option>
                          <option value="Amount">Amount</option>
                        </select>
                      </div>

                      <span style={styles.wholesalePriceLink}>+ Add Wholesale Price</span>
                    </div>
                  </div>

                  {/* Purchase Price & Taxes block */}
                  <div style={styles.tabContentGrid}>
                    <div style={styles.pricingCardBlock}>
                      <span style={styles.pricingHeaderTitle}>Purchase Price</span>
                      <div style={{ display: 'flex', border: '1.5px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden', width: '220px', marginTop: '12px' }}>
                        <input
                          type="number"
                          style={{ ...styles.modalInput, border: 'none', flex: 1 }}
                          placeholder="Purchase Price"
                          value={purchasePrice || ''}
                          onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                        />
                        <select 
                          style={{ border: 'none', borderLeft: '1.5px solid #E5E7EB', backgroundColor: '#F9FAFB', fontSize: '11px', outline: 'none', padding: '0 8px' }}
                          value={purchasePriceTaxType}
                          onChange={(e) => setPurchasePriceTaxType(e.target.value as any)}
                        >
                          <option value="Without Tax">Without Tax</option>
                          <option value="With Tax">With Tax</option>
                        </select>
                      </div>
                    </div>

                    <div style={styles.pricingCardBlock}>
                      <span style={styles.pricingHeaderTitle}>Taxes</span>
                      <div style={{ marginTop: '12px' }}>
                        <label style={{ fontSize: '9px', color: '#9CA3AF', fontWeight: '700', position: 'absolute', transform: 'translate(10px, -6px)', backgroundColor: 'white', padding: '0 4px' }}>Tax Rate</label>
                        <select
                          className="form-control"
                          style={styles.modalInput}
                          value={taxRate}
                          onChange={(e) => setTaxRate(parseInt(e.target.value) || 0)}
                        >
                          <option value={0}>None</option>
                          <option value={5}>GST 5%</option>
                          <option value={12}>GST 12%</option>
                          <option value={18}>GST 18%</option>
                          <option value={28}>GST 28%</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab stock content */}
              {activeModalTab === 'stock' && (
                <div style={styles.tabWrapperBlock}>
                  <div style={styles.tabContentGrid}>
                    <div className="form-group">
                      <label style={styles.fieldLabel}>Opening Stock Qty</label>
                      <input
                        type="number"
                        className="form-control"
                        style={styles.modalInput}
                        placeholder="Opening Stock"
                        value={openingStock}
                        onChange={(e) => setOpeningStock(parseInt(e.target.value) || 0)}
                      />
                    </div>

                    <div className="form-group">
                      <label style={styles.fieldLabel}>Minimum Stock Safety Level</label>
                      <input
                        type="number"
                        className="form-control"
                        style={styles.modalInput}
                        placeholder="Minimum Safety Stock"
                        value={minStock}
                        onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Modal Footer */}
              <div style={styles.modalFooter}>
                <button 
                  type="button" 
                  style={styles.saveAndNewBtn}
                  onClick={(e) => handleSubmit(e, true)}
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

      {/* Product Specific History Modal */}
      {historyModalProduct && (
        <div style={styles.modalOverlay}>
          <div style={{ ...styles.modalContent, width: '900px' }}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={styles.modalTitle}>Stock Records: {historyModalProduct.name}</span>
                <span style={{ fontSize: '13px', color: 'var(--color-text-muted)', backgroundColor: '#F3F4F6', padding: '4px 8px', borderRadius: '4px' }}>
                  Current Stock: {historyModalProduct.stock} {historyModalProduct.unit}
                </span>
              </div>
              <X size={18} style={styles.headerIcon} onClick={() => setHistoryModalProduct(null)} />
            </div>
            
            <div style={{ padding: '20px', maxHeight: '600px', overflowY: 'auto' }}>
              <div className="table-wrapper">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Action Type</th>
                      <th>Stock Adjusted</th>
                      <th>Remaining Stock</th>
                      <th>Doc Reference</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stockHistoryWithRemaining.filter(sh => sh.productId === historyModalProduct.id).map((sh) => (
                      <tr key={sh.id}>
                        <td>{formatDateDDMMYYYY(sh.date)}</td>
                        <td>
                          <span className={`badge ${
                            sh.type === 'purchase' ? 'badge-success' : 'badge-danger'
                          }`}>
                            {sh.type.toUpperCase()}
                          </span>
                        </td>
                        <td style={{ 
                          fontWeight: '700', 
                          color: sh.quantityChange > 0 ? 'var(--color-success)' : 'var(--color-danger)' 
                        }}>
                          {sh.quantityChange > 0 ? `+${sh.quantityChange}` : sh.quantityChange} Units
                        </td>
                        <td style={{ fontWeight: '600', color: 'var(--color-text)' }}>
                          {sh.remainingStock} Units
                        </td>
                        <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>{sh.referenceNo}</td>
                        <td style={{ textAlign: 'right' }}>
                          <button 
                            style={{ ...styles.actionBtn, backgroundColor: 'var(--color-danger-bg)' }} 
                            onClick={() => {
                              if (confirm('Are you sure you want to delete this stock history log? The stock will be adjusted accordingly.')) {
                                deleteStockHistory(sh.id);
                                // The modal will update automatically since it uses stockHistoryWithRemaining
                              }
                            }}
                            title="Delete Log"
                          >
                            <Trash2 size={14} color="var(--color-danger)" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {stockHistoryWithRemaining.filter(sh => sh.productId === historyModalProduct.id).length === 0 && (
                      <tr>
                        <td colSpan={6} style={{ textAlign: 'center', padding: '36px', color: 'var(--color-text-muted)' }}>
                          No stock movements recorded for this product yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
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
  tabsAndButtons: {
    display: 'flex',
    gap: '16px',
    alignItems: 'center',
  },
  subTabGroup: {
    display: 'flex',
    backgroundColor: '#FAF8F5',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '4px',
  },
  subTab: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: 'var(--font-sans)',
  },
  prodName: {
    fontSize: '14px',
    fontWeight: '600',
    color: 'var(--color-primary)',
  },
  prodUnit: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  skuText: {
    fontSize: '12px',
    fontWeight: '500',
    color: 'var(--color-text-main)',
  },
  barcodeText: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  categoryTag: {
    backgroundColor: 'var(--color-accent-light)',
    color: 'var(--color-primary)',
    padding: '4px 8px',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 29, 54, 0.4)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    width: '920px',
    boxShadow: 'var(--shadow-lg)',
    overflow: 'hidden',
  },
  modalHeader: {
    padding: '14px 20px',
    borderBottom: '1px solid var(--color-border)',
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
  typeToggleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
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
  modalTopGrid: {
    display: 'grid',
    gridTemplateColumns: '1.2fr 1.2fr 1fr',
    gap: '24px',
    marginBottom: '20px',
  },
  topGridCol: {
    display: 'flex',
    flexDirection: 'column',
  },
  fieldLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#3B82F6',
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
  assignCodeBtn: {
    padding: '8px 12px',
    border: '1.5px solid #3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.05)',
    color: '#3B82F6',
    borderRadius: '6px',
    fontSize: '11px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  selectUnitBtn: {
    padding: '8px 12px',
    backgroundColor: '#E0F2FE',
    color: '#0369A1',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  addImageBtn: {
    padding: '8px 12px',
    backgroundColor: 'transparent',
    color: '#3B82F6',
    border: 'none',
    fontSize: '12px',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left' as const,
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
    fontFamily: 'var(--font-sans)',
  },
  tabWrapperBlock: {
    padding: '10px 0',
    minHeight: '180px',
  },
  pricingCardBlock: {
    backgroundColor: '#FAFBFD',
    borderRadius: '8px',
    padding: '16px',
    border: '1px solid #F0F4F8',
    marginBottom: '16px',
  },
  pricingHeaderTitle: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#374151',
  },
  pricingInlineFields: {
    display: 'flex',
    gap: '20px',
    alignItems: 'center',
    marginTop: '12px',
  },
  wholesalePriceLink: {
    fontSize: '12px',
    color: '#3B82F6',
    fontWeight: '600',
    cursor: 'pointer',
  },
  tabContentGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
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
    backgroundColor: '#3B82F6',
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: '13px',
    cursor: 'pointer',
  }
};
