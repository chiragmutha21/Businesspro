import sys

def update_dashboard():
    with open('src/components/Dashboard.tsx', 'r', encoding='utf-8') as f:
        content = f.read()

    # 1. Update isWithinTimeFilter to handle / and - interchangeably
    old_time_filter_start = """  const isWithinTimeFilter = (dateStr: string) => {
    if (timeFilter === 'all') return true;
    if (!dateStr) return false;
    
    const parts = dateStr.split('-');"""
    
    new_time_filter_start = """  const isWithinTimeFilter = (dateStr: string) => {
    if (timeFilter === 'all') return true;
    if (!dateStr) return false;
    
    const normalized = dateStr.replace(/\//g, '-');
    const parts = normalized.split('-');"""
    
    content = content.replace(old_time_filter_start, new_time_filter_start)

    # 2. Add local storage reading right after `const bizProducts ...`
    hook_str = """
  // Load local data for complete metrics
  const getLocal = (key: string) => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : [];
  };
  
  const localPaymentsIn = getLocal('paymentsIn').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  const localSaleOrders = getLocal('saleOrders').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  const localEstimates = getLocal('estimates').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  const localDeliveryChallans = getLocal('deliveryChallans').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  
  const localPaymentsOut = getLocal('paymentsOut').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  const localPurchaseBills = getLocal('purchaseBills').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  const localExpenses = getLocal('expenses').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));

  // Consolidate "Sales" from Supabase transactions + local saleOrders + local estimates + local deliveryChallans
  // Actually, standard totalSales is just bizTransactions (type=sale). We can add localSaleOrders and localEstimates if they are considered "Sales" by user.
  // We'll just stick to the original bizTransactions + paymentsIn for revenue.
"""
    content = content.replace("const bizProducts = products.filter((p) => viewScope === 'overall' || p.businessId === activeBusiness?.id);", 
                              "const bizProducts = products.filter((p) => viewScope === 'overall' || p.businessId === activeBusiness?.id);\n" + hook_str)

    # 3. Add Paid in Cash, Paid Online, Pending
    old_pending = """  const pendingPayments = bizTransactions
    .filter((t) => t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0);"""
    
    new_pending = """  // Calculate pending, cash, online combining Supabase and Local Storage
  const pendingPayments = bizTransactions
    .filter((t) => t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid')
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0) + 
    localSaleOrders.filter((t: any) => t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid').reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);

  const paidInCash = bizTransactions
    .filter((t) => t.type === 'sale' && (t.paymentType === 'Cash' || t.paymentStatus === 'Paid by Cash'))
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0) + 
    localPaymentsIn.filter((t: any) => t.paymentType === 'Cash').reduce((sum: number, t: any) => sum + (t.receivedAmount || t.totalAmount || 0), 0) +
    localSaleOrders.filter((t: any) => t.paymentType === 'Cash' || t.paymentStatus === 'Paid by Cash').reduce((sum: number, t: any) => sum + (t.receivedAmount || t.totalAmount || 0), 0);

  const paidOnline = bizTransactions
    .filter((t) => t.type === 'sale' && (t.paymentStatus === 'Paid' || t.paymentType === 'Online' || t.paymentType === 'UPI' || t.paymentType === 'Bank Transfer' || t.paymentType === 'Card' || t.paymentType === 'Cheque' || t.paymentStatus === 'Paid by Cheque'))
    .reduce((sum, t) => sum + (t.totalAmount || 0), 0) + 
    localPaymentsIn.filter((t: any) => t.paymentType !== 'Cash' && t.paymentType).reduce((sum: number, t: any) => sum + (t.receivedAmount || t.totalAmount || 0), 0) +
    localSaleOrders.filter((t: any) => (t.paymentStatus === 'Paid' && t.paymentType !== 'Cash') || ['Online', 'UPI', 'Bank Transfer', 'Card', 'Cheque'].includes(t.paymentType)).reduce((sum: number, t: any) => sum + (t.receivedAmount || t.totalAmount || 0), 0);
"""
    content = content.replace(old_pending, new_pending)

    # 4. Update totalSales to include local records just in case
    content = content.replace(".reduce((sum, t) => sum + t.totalAmount, 0);", 
                              ".reduce((sum, t) => sum + t.totalAmount, 0) + localSaleOrders.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);")

    # 5. Add the cards to the UI
    old_cards_start = """      {/* Cards Metrics Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>"""
    
    new_cards_start = """      {/* Cards Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>PAID IN CASH</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
              <DollarSign size={20} color="#10B981" />
            </div>
          </div>
          <div style={styles.cardValue}>₹ {paidInCash.toFixed(2)}</div>
        </div>
        
        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>PAID ONLINE</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <CreditCard size={20} color="#3B82F6" />
            </div>
          </div>
          <div style={styles.cardValue}>₹ {paidOnline.toFixed(2)}</div>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>UNPAID / PENDING</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <TrendingUp size={20} color="#EF4444" />
            </div>
          </div>
          <div style={styles.cardValue}>₹ {pendingPayments.toFixed(2)}</div>
        </div>
"""
    # Replace grid-cols-4 with the new flexible grid and add the 3 cards.
    # Note: grid-cols-4 class is used in index.css probably, but a custom inline style is safer.
    content = content.replace(old_cards_start, new_cards_start)

    with open('src/components/Dashboard.tsx', 'w', encoding='utf-8') as f:
        f.write(content)

update_dashboard()
