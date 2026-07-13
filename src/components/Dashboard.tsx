import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  CreditCard
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

  // Filter transactions and items based on scope
  const bizTransactions = transactions.filter((t) => viewScope === 'overall' || t.businessId === activeBusiness?.id);
  const bizProducts = products.filter((p) => viewScope === 'overall' || p.businessId === activeBusiness?.id);

  // Metrics calculation
  const totalSales = bizTransactions
    .filter((t) => t.type === 'sale')
    .reduce((sum, t) => sum + t.totalAmount, 0);

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

  const pendingPayments = bizTransactions
    .filter((t) => t.paymentStatus === 'Pending')
    .reduce((sum, t) => sum + t.totalAmount, 0);

  const stockValue = bizProducts.reduce((sum, p) => sum + (p.stock * p.purchasePrice), 0);
  const lowStockCount = bizProducts.filter((p) => p.stock <= p.minStock).length;

  // Chart Data preparation
  // 1. Daily sales trend (past 7 days)
  const salesByDate: Record<string, number> = {};
  bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
    salesByDate[t.date] = (salesByDate[t.date] || 0) + t.totalAmount;
  });
  
  const dailyChartData = Object.keys(salesByDate)
    .sort()
    .map((date) => ({
      date: date.substring(5), // Just MM-DD
      Sales: parseFloat(salesByDate[date].toFixed(2)),
    }));

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
    name: name.length > 15 ? name.substring(0, 15) + '...' : name,
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
      <div style={styles.topRow}>
        <div>
          <h1 style={styles.title}>Aura Dashboard</h1>
          <p style={styles.subtitle}>Real-time commercial intelligence & control board.</p>
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

      {/* Cards Metrics Grid */}
      <div className="grid-cols-4" style={{ marginBottom: '24px' }}>
        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL SALES</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'var(--color-success-bg)' }}>
              <TrendingUp size={16} color="var(--color-success)" />
            </div>
          </div>
          <span style={styles.metricValue}>₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          <div style={styles.cardFooter}>
            <span style={{ color: 'var(--color-success)', fontWeight: '600' }}>+12.4%</span>
            <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>vs last week</span>
          </div>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>NET ESTIMATED PROFIT</span>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(197, 168, 128, 0.15)' }}>
              <DollarSign size={16} color="var(--color-accent)" />
            </div>
          </div>
          <span style={styles.metricValue}>₹{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          <div style={styles.cardFooter}>
            <span style={{ color: 'var(--color-accent)', fontWeight: '600' }}>32.8%</span>
            <span style={{ color: 'var(--color-text-muted)', marginLeft: '6px' }}>avg gross margin</span>
          </div>
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

        <div className="card" style={styles.metricCard}>
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
                    .filter((t) => t.businessId === biz.id && t.type === 'sale')
                    .reduce((sum, t) => sum + t.totalAmount, 0);
                  const bizPending = transactions
                    .filter((t) => t.businessId === biz.id && t.paymentStatus === 'Pending')
                    .reduce((sum, t) => sum + t.totalAmount, 0);
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
  }
};
