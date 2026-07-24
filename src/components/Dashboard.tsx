import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  CreditCard,
  X
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { activeBusiness, businesses, products, transactions } = useApp();
  const [viewScope, setViewScope] = useState<'current' | 'overall'>('current');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('all');
  const [paymentTimeFilter, setPaymentTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly'>('all');
  const [customDateStr, setCustomDateStr] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const checkTimeFilter = (dateStr: string, filter: string) => {
    if (filter === 'all') return true;
    if (!dateStr) return false;
    
    const normalized = dateStr.replace(/\//g, '-');
    const parts = normalized.split('-');
    let y, m, d;
    if (parts[0].length === 4) {
      [y, m, d] = parts;
    } else {
      [d, m, y] = parts;
    }
    const tDate = new Date(Number(y), Number(m) - 1, Number(d));
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (filter === 'daily') {
      return tDate.getTime() === today.getTime();
    }
    if (filter === 'weekly') {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(today);
      start.setDate(today.getDate() + diffToMonday);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      
      return tDate >= start && tDate <= end;
    }
    if (filter === 'monthly') {
      return tDate.getMonth() === today.getMonth() && tDate.getFullYear() === today.getFullYear();
    }
    if (filter === 'yearly') {
      return tDate.getFullYear() === today.getFullYear();
    }
    if (filter === 'custom') {
      if (customDateStr.length === 8) {
        const cd = customDateStr.substring(0, 2);
        const cm = customDateStr.substring(2, 4);
        const cy = customDateStr.substring(4, 8);
        return dateStr === `${cy}-${cm}-${cd}`;
      }
      return false; // Show nothing if custom date is incomplete
    }
    return true;
  };

  const isWithinTimeFilter = (dateStr: string) => checkTimeFilter(dateStr, timeFilter);
  const isWithinPaymentTimeFilter = (dateStr: string) => checkTimeFilter(dateStr, paymentTimeFilter);

  // Filter transactions and items based on scope
  const bizTransactions = transactions.filter((t) => {
    const scopeMatch = viewScope === 'overall' || t.businessId === activeBusiness?.id;
    return scopeMatch && isWithinTimeFilter(t.date);
  });
  const bizProducts = products.filter((p) => viewScope === 'overall' || p.businessId === activeBusiness?.id);

  // Load local data for complete metrics
  const getLocal = (key: string) => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : [];
  };
  
  const localPaymentsInRaw = getLocal('paymentsIn').filter((t: any) => viewScope === 'overall' || t.businessId === activeBusiness?.id);
  const localSaleOrdersRaw = getLocal('saleOrders').filter((t: any) => viewScope === 'overall' || t.businessId === activeBusiness?.id);
  
  const localSaleOrders = localSaleOrdersRaw.filter((t: any) => isWithinTimeFilter(t.date));
  
  const localExpenses = getLocal('expenses').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  const localPurchaseBills = getLocal('purchaseBills').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));

  // Payment specific arrays (ignoring main dashboard time filter)
  const paymentBizTransactions = transactions.filter((t) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinPaymentTimeFilter(t.date));
  const paymentLocalPaymentsIn = localPaymentsInRaw.filter((t: any) => isWithinPaymentTimeFilter(t.date));
  const paymentLocalSaleOrders = localSaleOrdersRaw.filter((t: any) => isWithinPaymentTimeFilter(t.date));

  // Consolidate "Sales" from Supabase transactions + local saleOrders + local estimates + local deliveryChallans
  // Actually, standard totalSales is just bizTransactions (type=sale). We can add localSaleOrders and localEstimates if they are considered "Sales" by user.
  // We'll just stick to the original bizTransactions + paymentsIn for revenue.


  // Metrics calculation
  const salesTxList = [
    ...bizTransactions.filter((t) => t.type === 'sale'),
    ...localSaleOrders
  ];
  const totalSales = salesTxList.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  // Total Expenses & Purchases
  const expenseTxList = [
    ...bizTransactions.filter(t => t.type === 'Expense' || t.type === 'Purchase' || t.type === 'purchase'),
    ...localExpenses,
    ...localPurchaseBills
  ];
  const totalExpense = expenseTxList.reduce((sum: number, t: any) => sum + (t.total || t.totalAmount || 0), 0);

  const totalBalance = totalSales - totalExpense;

  // Profit calculation (revenue - cost of goods sold/purchased for simplicity)
  // Let's calculate based on sales: (sellingPrice - purchasePrice) * qty
  let totalProfit = 0;
  bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
    t.products.forEach((tp) => {
      const prod = products.find((p) => p.id === tp.productId);
      if (prod) {
        const profitMargin = prod.sellingPrice - prod.purchasePrice;
        totalProfit += profitMargin * tp.quantity;
      } else {
        totalProfit += tp.total * 0.3; // Default 30% margin fallback
      }
    });
    // Deduct discount
    totalProfit -= t.discount;
  });

  // Calculate pending, cash, online combining Supabase and Local Storage (using independent paymentTimeFilter)
  const pendingTxList = [
    ...paymentBizTransactions.filter((t) => t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid'),
    ...paymentLocalSaleOrders.filter((t: any) => t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid')
  ];
  const pendingPayments = pendingTxList.reduce((sum, t) => sum + ((t.totalAmount || 0) - (t.receivedAmount || 0)), 0);

  const cashTxList = [
    ...paymentBizTransactions.filter((t) => t.type === 'sale' && (t.paymentType === 'Cash' || t.paymentStatus === 'Paid by Cash')),
    ...paymentLocalPaymentsIn.filter((t: any) => t.paymentType === 'Cash'),
    ...paymentLocalSaleOrders.filter((t: any) => t.paymentType === 'Cash' || t.paymentStatus === 'Paid by Cash')
  ];
  const paidInCash = cashTxList.reduce((sum, t) => sum + (t.receivedAmount || t.totalAmount || 0), 0);

  const onlineTxList = [
    ...paymentBizTransactions.filter((t) => t.type === 'sale' && (
      (['Online', 'UPI', 'Bank Transfer', 'Card', 'Cheque'].includes(t.paymentType || '')) ||
      (t.paymentStatus === 'Paid' && t.paymentType !== 'Cash') || 
      (t.paymentStatus === 'Paid by Cheque')
    )),
    ...paymentLocalPaymentsIn.filter((t: any) => t.paymentType !== 'Cash' && t.paymentType),
    ...paymentLocalSaleOrders.filter((t: any) => (t.paymentStatus === 'Paid' && t.paymentType !== 'Cash') || ['Online', 'UPI', 'Bank Transfer', 'Card', 'Cheque'].includes(t.paymentType))
  ];
  const paidOnline = onlineTxList.reduce((sum, t) => sum + (t.receivedAmount || t.totalAmount || 0), 0);

  const stockValue = bizProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.purchasePrice || 0)), 0);
  const lowStockCount = bizProducts.filter((p) => (p.stock || 0) <= (p.minStock || 0)).length;

  // Chart Data preparation
  let dailyChartData: any[] = [];

  if (timeFilter === 'yearly') {
    const monthlySales: Record<string, number> = {};
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach(m => monthlySales[m] = 0);
    
    bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
      const [, m] = t.date.split('-');
      const monthIndex = parseInt(m) - 1;
      monthlySales[months[monthIndex]] += t.totalAmount;
    });
    
    dailyChartData = months.map(m => ({
      date: m,
      Sales: parseFloat(monthlySales[m].toFixed(2))
    }));
  } else {
    const salesByDate: Record<string, number> = {};
    bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
      salesByDate[t.date] = (salesByDate[t.date] || 0) + t.totalAmount;
    });

    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const formatDateStr = (dObj: Date) => {
      const yyyy = dObj.getFullYear();
      const mm = String(dObj.getMonth() + 1).padStart(2, '0');
      const dd = String(dObj.getDate()).padStart(2, '0');
      return `${dd}-${mm}-${yyyy}`;
    };

    if (timeFilter === 'weekly') {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(today);
      start.setDate(today.getDate() + diffToMonday);
      for (let i = 0; i < 7; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        dates.push(formatDateStr(d));
      }
    } else if (timeFilter === 'monthly') {
      const y = today.getFullYear();
      const m = today.getMonth();
      const daysInMonth = new Date(y, m + 1, 0).getDate();
      for (let i = 1; i <= daysInMonth; i++) {
        const d = new Date(y, m, i);
        dates.push(formatDateStr(d));
      }
    } else if (timeFilter === 'daily') {
      dates.push(formatDateStr(today));
    } else if (timeFilter === 'custom' && customDateStr.length === 8) {
      const cd = customDateStr.substring(0, 2);
      const cm = customDateStr.substring(2, 4);
      const cy = customDateStr.substring(4, 8);
      dates.push(`${cd}-${cm}-${cy}`);
    }

    if (dates.length > 0) {
      dailyChartData = dates.map(dateStr => ({
        date: dateStr.substring(0, 5), // DD-MM
        Sales: parseFloat((salesByDate[dateStr] || 0).toFixed(2))
      }));
    } else {
      dailyChartData = Object.keys(salesByDate)
        .sort()
        .map((date) => ({
          date: date.substring(0, 5), // DD-MM
          Sales: parseFloat(salesByDate[date].toFixed(2)),
        }));
    }
  }

  if (dailyChartData.length === 0) {
    dailyChartData.push({ date: 'No Data', Sales: 0 });
  }

  // 2. Product-wise sales
  const productSalesMap: Record<string, number> = {};
  bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
    t.products.forEach((p) => {
      productSalesMap[p.productName] = (productSalesMap[p.productName] || 0) + p.quantity;
    });
  });

  const productSalesData = Object.keys(productSalesMap).map((name) => ({
    name,
    Sales: productSalesMap[name],
  })).slice(0, 5);

  // 3. Business-wise Revenue Share (for overall view)
  const bizRevenueMap: Record<string, number> = {};
  transactions.filter((t) => t.type === 'sale').forEach((t) => {
    const biz = businesses.find((b) => b.id === t.businessId);
    if (biz) {
      bizRevenueMap[biz.name] = (bizRevenueMap[biz.name] || 0) + t.totalAmount;
    }
  });

  const pieData = Object.keys(bizRevenueMap).map((name) => ({
    name,
    value: parseFloat(bizRevenueMap[name].toFixed(2))
  }));

  const COLORS = ['#0F1D36', '#C5A880', '#565A75', '#E5D5C0', '#10B981'];

  return (
    <div style={styles.container}>
      {/* Upper Panel */}
      <div className="responsive-top-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '24px' }}>
        <div>
          <h1 style={styles.title}>Aura Dashboard</h1>
          <p style={styles.subtitle}>Real-time commercial intelligence & control board.</p>
        </div>

        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Time Filter Toggle */}
          <div style={styles.toggleWrapper}>
            {(['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((filter) => (
              <button
                key={filter}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: timeFilter === filter ? '#0F1D36' : 'transparent',
                  color: timeFilter === filter ? '#FFFFFF' : 'var(--color-primary)',
                  textTransform: 'capitalize'
                }}
                onClick={() => setTimeFilter(filter)}
              >
                {filter}
              </button>
            ))}
            {timeFilter === 'custom' && (
              <input
                type="text"
                placeholder="DDMMYYYY"
                maxLength={8}
                value={customDateStr}
                onChange={(e) => setCustomDateStr(e.target.value.replace(/\D/g, ''))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: '1px solid var(--color-border)',
                  outline: 'none',
                  fontSize: '13px',
                  width: '100px',
                  marginLeft: '4px'
                }}
              />
            )}
          </div>

          {/* View Switcher Toggle */}
          <div style={styles.toggleWrapper}>
            <button 
              style={{
                ...styles.toggleBtn, 
                backgroundColor: viewScope === 'current' ? '#0F1D36' : 'transparent',
                color: viewScope === 'current' ? '#FFFFFF' : 'var(--color-primary)'
              }}
              onClick={() => setViewScope('current')}
            >
              Active Business
            </button>
          <button 
            style={{
              ...styles.toggleBtn, 
              backgroundColor: viewScope === 'overall' ? '#0F1D36' : 'transparent',
              color: viewScope === 'overall' ? '#FFFFFF' : 'var(--color-primary)'
            }}
            onClick={() => setViewScope('overall')}
          >
            All Businesses
          </button>
          </div>
        </div>
      </div>

      {/* Cards Metrics Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px', marginBottom: '24px' }}>
        <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('sales')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL SALES</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'var(--color-success-bg)' }}>
              <TrendingUp size={16} color="var(--color-success)" />
            </div>
          </div>
          <span style={styles.metricValue}>₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>

        <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('expenses')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL EXPENSES</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <DollarSign size={16} color="#EF4444" />
            </div>
          </div>
          <span style={styles.metricValue}>₹{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL BALANCE</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <CreditCard size={16} color="#3B82F6" />
            </div>
          </div>
          <span style={styles.metricValue}>₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>NET ESTIMATED PROFIT</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(197, 168, 128, 0.15)' }}>
              <DollarSign size={16} color="var(--color-accent)" />
            </div>
          </div>
          <span style={styles.metricValue}>₹{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>STOCK VALUE (COST)</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'var(--color-primary-light)', opacity: 0.8 }}>
              <Package size={16} color="#FFFFFF" />
            </div>
          </div>
          <span style={styles.metricValue}>₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          <div style={styles.cardFooter}>
            <span style={{ color: lowStockCount > 0 ? 'var(--color-danger)' : 'var(--color-success)', fontWeight: '600' }}>
              {lowStockCount} Products
            </span>
            <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>are low in stock</span>
          </div>
        </div>

        <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('pending')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>PENDING RECEIVABLES</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'var(--color-warning-bg)' }}>
              <CreditCard size={16} color="var(--color-warning)" />
            </div>
          </div>
          <span style={{ ...styles.metricValue, color: pendingPayments > 0 ? 'var(--color-warning)' : 'var(--color-primary)' }}>
            ₹{pendingPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
          </span>
          <div style={styles.cardFooter}>
            <span style={{ color: 'var(--color-text-muted)' }}>Awaiting client clearance</span>
          </div>
        </div>
      </div>

      {/* Payment Modes Section */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={styles.chartTitle}>Payment Collection</h3>
          <div style={styles.toggleWrapper}>
            {(['all', 'daily', 'weekly', 'monthly'] as const).map((filter) => (
              <button
                key={filter}
                style={{
                  ...styles.toggleBtn,
                  backgroundColor: paymentTimeFilter === filter ? '#0F1D36' : 'transparent',
                  color: paymentTimeFilter === filter ? '#FFFFFF' : 'var(--color-primary)',
                  textTransform: 'capitalize'
                }}
                onClick={() => setPaymentTimeFilter(filter)}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '24px' }}>
          <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('cash')}>
            <div style={styles.cardHeader}>
              <span style={styles.cardLabel}>PAID IN CASH</span>
              <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <DollarSign size={20} color="#10B981" />
              </div>
            </div>
            <span style={styles.metricValue}>₹ {paidInCash.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          
          <div className="card" style={styles.metricCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardLabel}>PAID ONLINE</span>
              <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
                <CreditCard size={20} color="#3B82F6" />
              </div>
            </div>
            <span style={styles.metricValue}>₹ {paidOnline.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>

          <div className="card" style={styles.metricCard}>
            <div style={styles.cardHeader}>
              <span style={styles.cardLabel}>UNPAID / PENDING</span>
              <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
                <TrendingUp size={20} color="#EF4444" />
              </div>
            </div>
            <span style={styles.metricValue}>₹ {pendingPayments.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
        </div>
      </div>

      {/* Analytics Charts Row */}
      <div style={styles.chartsRow}>
        {/* Main Chart */}
        <div className="card" style={{ flex: 2, display: 'flex', flexDirection: 'column', height: '360px' }}>
          <h3 style={styles.chartTitle}>Daily Sales Volume</h3>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-primary)" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="var(--color-primary)" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} />
                <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                <Tooltip />
                <Area type="monotone" dataKey="Sales" stroke="var(--color-primary)" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Breakdown Chart */}
        <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '360px' }}>
          <h3 style={styles.chartTitle}>
            {viewScope === 'overall' ? 'Revenue Share by Business' : 'Best Selling Products'}
          </h3>
          <div style={{ flex: 1, minHeight: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {viewScope === 'overall' && pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productSalesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                  <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} />
                  <YAxis stroke="var(--color-text-muted)" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="Sales" fill="var(--color-accent)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          {viewScope === 'overall' && (
            <div style={styles.legendContainer}>
              {pieData.map((item, index) => (
                <div key={item.name} style={styles.legendItem}>
                  <span style={{ ...styles.legendDot, backgroundColor: COLORS[index % COLORS.length] }}></span>
                  <span style={styles.legendText}>{item.name.substring(0, 12)} ({((item.value / totalSales) * 100).toFixed(0)}%)</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Business-wise metrics table for overall control */}
      {viewScope === 'overall' && (
        <div style={{ marginTop: '24px' }}>
          <h3 style={{ ...styles.chartTitle, marginBottom: '14px' }}>Multi-Business Ledger</h3>
          <div className="table-wrapper">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Business Name</th>
                  <th>Location</th>
                  <th>Revenue (Sales)</th>
                  <th>Receivables</th>
                  <th>Products in Catalog</th>
                </tr>
              </thead>
              <tbody>
                {businesses.map((biz) => {
                  const bizSales = transactions
                    .filter((t) => t.businessId === biz.id && t.type === 'sale' && isWithinTimeFilter(t.date))
                    .reduce((sum, t) => sum + t.totalAmount, 0) + localSaleOrders.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);
                  const bizPending = transactions
                    .filter((t) => t.businessId === biz.id && (t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid') && isWithinTimeFilter(t.date))
                    .reduce((sum, t) => sum + t.totalAmount, 0) + localSaleOrders.reduce((sum: number, t: any) => sum + (t.totalAmount || 0), 0);
                  const bizProds = products.filter((p) => p.businessId === biz.id).length;

                  return (
                    <tr key={biz.id}>
                      <td style={{ fontWeight: '600' }}>{biz.name}</td>
                      <td>{biz.address.split(',')[1] || biz.address}</td>
                      <td>₹{bizSales.toLocaleString('en-IN')}</td>
                      <td style={{ color: bizPending > 0 ? 'var(--color-warning)' : 'var(--color-text-main)' }}>
                        ₹{bizPending.toLocaleString('en-IN')}
                      </td>
                      <td>{bizProds} Items</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {activeModal === 'cash' ? 'Paid in Cash Transactions' 
                 : activeModal === 'online' ? 'Paid Online Transactions' 
                 : activeModal === 'sales' ? 'Sales Transactions'
                 : activeModal === 'expenses' ? 'Expenses & Purchases'
                 : 'Pending Transactions'}
              </h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
            </div>
            <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Ref / Invoice No</th>
                    <th>Party Name</th>
                    <th>Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {(
                    activeModal === 'cash' ? cashTxList : 
                    activeModal === 'online' ? onlineTxList : 
                    activeModal === 'sales' ? salesTxList :
                    activeModal === 'expenses' ? expenseTxList :
                    pendingTxList
                  ).map((t, i) => (
                    <tr key={i}>
                      <td>{t.date}</td>
                      <td>{t.invoiceNo || t.referenceNo || t.id?.substring(0,6) || '-'}</td>
                      <td>{t.contactName || t.partyName || t.vendorName || '-'}</td>
                      <td style={{ fontWeight: '600' }}>
                        ₹{activeModal === 'pending' 
                           ? ((t.totalAmount || 0) - (t.receivedAmount || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) 
                           : activeModal === 'expenses'
                           ? (t.total || t.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                           : (t.receivedAmount || t.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </td>
                    </tr>
                  ))}
                  {(
                    activeModal === 'cash' ? cashTxList : 
                    activeModal === 'online' ? onlineTxList : 
                    activeModal === 'sales' ? salesTxList :
                    activeModal === 'expenses' ? expenseTxList :
                    pendingTxList
                  ).length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                        No transactions found for the selected time filter.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
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
    fontFamily: 'var(--font-sans)',
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--color-primary)',
  },
  subtitle: {
    fontSize: '14px',
    color: 'var(--color-text-muted)',
    marginTop: '4px',
  },
  toggleWrapper: {
    display: 'flex',
    backgroundColor: '#FAF8F5',
    border: '1px solid var(--color-border)',
    borderRadius: '12px',
    padding: '4px',
    boxShadow: 'var(--shadow-sm)',
  },
  toggleBtn: {
    padding: '8px 16px',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  metricCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '120px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: '11px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    letterSpacing: '1px',
  },
  iconBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    margin: '12px 0 6px 0',
  },
  cardFooter: {
    fontSize: '12px',
    display: 'flex',
    alignItems: 'center',
  },
  chartsRow: {
    display: 'flex',
    gap: '24px',
    marginTop: '8px',
  },
  chartTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    marginBottom: '20px',
  },
  legendContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '12px',
    justifyContent: 'center',
    marginTop: '12px',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
  },
  legendDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
  },
  legendText: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: '12px',
    padding: '24px',
    width: '90%',
    maxWidth: '700px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  }
};
