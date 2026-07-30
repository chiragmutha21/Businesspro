import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  CreditCard,
  Calendar,
  Crown,
  ChevronDown,
  X,
  ArrowUpRight,
  ShoppingBag
} from 'lucide-react';
import { formatDateDDMMYYYY } from '../utils/dateFormatter';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const Dashboard: React.FC = () => {
  const { activeBusiness, products, transactions } = useApp();
  const [viewScope, setViewScope] = useState<'current' | 'overall'>('current');
  const [timeFilter, setTimeFilter] = useState<'all' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'>('monthly');
  const [customDateStr, setCustomDateStr] = useState('');
  const [activeModal, setActiveModal] = useState<string | null>(null);
  
  // Dynamic month selection state
  const [activeMonthDate, setActiveMonthDate] = useState<Date>(new Date());
  const [openDropdown, setOpenDropdown] = useState<'sales' | 'products' | null>(null);

  // Load local data for complete metrics
  const getLocal = (key: string) => {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : [];
  };

  const mergeAndDeduplicate = (supaList: any[], localList: any[]) => {
    const mergedMap = new Map();
    supaList.forEach(t => {
      if (t.id) mergedMap.set(t.id, t);
    });
    localList.forEach(t => {
      if (t.id && !mergedMap.has(t.id)) {
        mergedMap.set(t.id, t);
      }
    });
    return Array.from(mergedMap.values());
  };

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

  const checkTimeFilter = (dateStr: string, filter: string) => {
    if (filter === 'all') return true;
    if (!dateStr) return false;
    
    const tDate = parseDateStr(dateStr);
    if (!tDate) return false;
    
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
      start.setHours(0, 0, 0, 0);
      
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      end.setHours(23, 59, 59, 999);
      
      return tDate >= start && tDate <= end;
    }
    if (filter === 'monthly') {
      return tDate.getMonth() === activeMonthDate.getMonth() && tDate.getFullYear() === activeMonthDate.getFullYear();
    }
    if (filter === 'yearly') {
      return tDate.getFullYear() === today.getFullYear();
    }
    if (filter === 'custom') {
      if (customDateStr.length === 8) {
        const cd = Number(customDateStr.substring(0, 2));
        const cm = Number(customDateStr.substring(2, 4));
        const cy = Number(customDateStr.substring(4, 8));
        const customDate = new Date(cy, cm - 1, cd);
        customDate.setHours(0, 0, 0, 0);
        return tDate.getTime() === customDate.getTime();
      }
      return false;
    }
    return true;
  };

  const isWithinTimeFilter = (dateStr: string) => checkTimeFilter(dateStr, timeFilter);

  // Filter transactions and items based on scope
  const bizTransactions = transactions.filter((t) => {
    const scopeMatch = viewScope === 'overall' || t.businessId === activeBusiness?.id;
    return scopeMatch && isWithinTimeFilter(t.date);
  });
  const bizProducts = products.filter((p) => viewScope === 'overall' || p.businessId === activeBusiness?.id);
  
  const localPaymentsInRaw = getLocal('paymentsIn').filter((t: any) => viewScope === 'overall' || t.businessId === activeBusiness?.id);
  const localSaleOrdersRaw = getLocal('saleOrders').filter((t: any) => viewScope === 'overall' || t.businessId === activeBusiness?.id);
  
  const localSaleOrders = localSaleOrdersRaw.filter((t: any) => isWithinTimeFilter(t.date));
  const localExpenses = getLocal('expenses').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));
  const localPurchaseBills = getLocal('purchaseBills').filter((t: any) => (viewScope === 'overall' || t.businessId === activeBusiness?.id) && isWithinTimeFilter(t.date));

  // Helper payment amounts
  const getPaidAmount = (t: any) => {
    if (t.type === 'Expense' || t.type === 'expense') {
      return t.total || t.totalAmount || 0;
    }
    if (t.paymentStatus === 'Paid' || t.paymentStatus === 'Paid by Cash' || t.paymentStatus === 'Paid by Cheque') {
      return t.totalAmount || t.total || 0;
    }
    return t.receivedAmount || 0;
  };

  // Metrics calculations
  const salesTxList = mergeAndDeduplicate(
    bizTransactions.filter((t) => t.type === 'sale'),
    localSaleOrders
  );
  const totalSales = salesTxList.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

  const expenseTxList = mergeAndDeduplicate(
    bizTransactions.filter(t => t.type === 'Expense' || t.type === 'expense'),
    localExpenses
  );
  const totalExpense = expenseTxList.reduce((sum: number, t: any) => sum + (t.total || t.totalAmount || 0), 0);

  const purchaseTxList = mergeAndDeduplicate(
    bizTransactions.filter(t => t.type === 'Purchase' || t.type === 'purchase'),
    localPurchaseBills
  );
  const totalPurchase = purchaseTxList.reduce((sum: number, t: any) => sum + (t.total || t.totalAmount || 0), 0);

  const mainPaymentsInList = mergeAndDeduplicate(
    bizTransactions.filter(t => t.type === 'payment_in' || t.type === 'Payment In'),
    localPaymentsInRaw.filter((t: any) => isWithinTimeFilter(t.date))
  );

  const totalInflow = salesTxList.reduce((sum, t) => sum + getPaidAmount(t), 0)
                    + mainPaymentsInList.reduce((sum, t) => sum + getPaidAmount(t), 0);

  const totalOutflow = expenseTxList.reduce((sum, t) => sum + getPaidAmount(t), 0);
  const totalBalance = totalInflow - totalOutflow;

  // Profit calculation
  let totalProfit = 0;
  bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
    t.products?.forEach((tp: any) => {
      const prod = products.find((p) => p.id === tp.productId);
      if (prod) {
        totalProfit += (prod.sellingPrice - prod.purchasePrice) * tp.quantity;
      } else {
        totalProfit += tp.total * 0.3; // Default 30% margin fallback
      }
    });
    totalProfit -= t.discount || 0;
  });

  const stockValue = bizProducts.reduce((sum, p) => sum + ((p.stock || 0) * (p.purchasePrice || 0)), 0);

  // Dynamic values for payment details
  const pendingTxList = mergeAndDeduplicate(
    bizTransactions.filter((t) => t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid'),
    localSaleOrdersRaw.filter((t: any) => t.paymentStatus === 'Pending' || t.paymentStatus === 'Unpaid')
  );
  const pendingPayments = pendingTxList.reduce((sum, t) => sum + ((t.totalAmount || 0) - (t.receivedAmount || 0)), 0);

  const cashTxList = mergeAndDeduplicate(
    bizTransactions.filter((t) => t.type === 'sale' && (t.paymentType === 'Cash' || t.paymentStatus === 'Paid by Cash' || t.paymentType?.startsWith('Split:'))),
    [
      ...localPaymentsInRaw.filter((t: any) => t.paymentType === 'Cash' || t.paymentType?.startsWith('Split:')),
      ...localSaleOrdersRaw.filter((t: any) => t.paymentType === 'Cash' || t.paymentStatus === 'Paid by Cash' || t.paymentType?.startsWith('Split:'))
    ]
  );
  const paidInCash = cashTxList.reduce((sum, t) => {
    if (t.paymentType?.startsWith('Split:')) return sum + (Number(t.paymentType.split(':')[1]) || 0);
    return sum + (t.receivedAmount || t.totalAmount || 0);
  }, 0);

  const onlineTxList = mergeAndDeduplicate(
    bizTransactions.filter((t) => t.type === 'sale' && (
      (['Online', 'UPI', 'Bank Transfer', 'Card', 'Cheque'].includes(t.paymentType || '')) ||
      (t.paymentStatus === 'Paid' && t.paymentType !== 'Cash' && !t.paymentType?.startsWith('Split:')) || 
      (t.paymentStatus === 'Paid by Cheque') ||
      t.paymentType?.startsWith('Split:')
    )),
    [
      ...localPaymentsInRaw.filter((t: any) => (t.paymentType !== 'Cash' && t.paymentType) || t.paymentType?.startsWith('Split:')),
      ...localSaleOrdersRaw.filter((t: any) => (t.paymentStatus === 'Paid' && t.paymentType !== 'Cash' && !t.paymentType?.startsWith('Split:')) || ['Online', 'UPI', 'Bank Transfer', 'Card', 'Cheque'].includes(t.paymentType) || t.paymentType?.startsWith('Split:'))
    ]
  );
  const paidOnline = onlineTxList.reduce((sum, t) => {
    if (t.paymentType?.startsWith('Split:')) return sum + (Number(t.paymentType.split(':')[2]) || 0);
    return sum + (t.receivedAmount || t.totalAmount || 0);
  }, 0);

  // Month-over-month comparisons (simulated / calculated)
  const getMonthlyStats = (monthOffset: number) => {
    const targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() - monthOffset);
    const targetMonth = targetDate.getMonth();
    const targetYear = targetDate.getFullYear();

    const supaFiltered = transactions.filter(t => {
      const d = parseDateStr(t.date);
      if (!d) return false;
      const matchBiz = viewScope === 'overall' || t.businessId === activeBusiness?.id;
      return matchBiz && d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });

    const localExp = getLocal('expenses').filter((t: any) => {
      const d = parseDateStr(t.date);
      return d && d.getMonth() === targetMonth && d.getFullYear() === targetYear && (viewScope === 'overall' || t.businessId === activeBusiness?.id);
    });
    const localSales = getLocal('saleOrders').filter((t: any) => {
      const d = parseDateStr(t.date);
      return d && d.getMonth() === targetMonth && d.getFullYear() === targetYear && (viewScope === 'overall' || t.businessId === activeBusiness?.id);
    });
    const localPurch = getLocal('purchaseBills').filter((t: any) => {
      const d = parseDateStr(t.date);
      return d && d.getMonth() === targetMonth && d.getFullYear() === targetYear && (viewScope === 'overall' || t.businessId === activeBusiness?.id);
    });

    const salesTx = mergeAndDeduplicate(supaFiltered.filter(t => t.type === 'sale'), localSales);
    const sales = salesTx.reduce((sum, t) => sum + (t.totalAmount || 0), 0);

    const expensesTx = mergeAndDeduplicate(supaFiltered.filter(t => t.type === 'expense' || t.type === 'Expense'), localExp);
    const expenses = expensesTx.reduce((sum, t) => sum + (t.total || t.totalAmount || 0), 0);

    const purchasesTx = mergeAndDeduplicate(supaFiltered.filter(t => t.type === 'purchase' || t.type === 'Purchase'), localPurch);
    const purchases = purchasesTx.reduce((sum, t) => sum + (t.total || t.totalAmount || 0), 0);

    const inflow = salesTx.reduce((sum, t) => sum + getPaidAmount(t), 0);
    const outflow = expensesTx.reduce((sum, t) => sum + getPaidAmount(t), 0);
    const balance = inflow - outflow;

    let profit = 0;
    supaFiltered.filter((t) => t.type === 'sale').forEach((t) => {
      t.products?.forEach((tp: any) => {
        const prod = products.find((p) => p.id === tp.productId);
        if (prod) {
          profit += (prod.sellingPrice - prod.purchasePrice) * tp.quantity;
        } else {
          profit += tp.total * 0.3;
        }
      });
      profit -= t.discount || 0;
    });

    return { sales, expenses, balance, profit, purchases };
  };

  const currStats = getMonthlyStats(0);
  const prevStats = getMonthlyStats(1);

  const calcGrowth = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return parseFloat((((curr - prev) / Math.abs(prev)) * 100).toFixed(1));
  };

  const salesGrowth = calcGrowth(currStats.sales, prevStats.sales);
  const expensesGrowth = calcGrowth(currStats.expenses, prevStats.expenses);
  const purchasesGrowth = calcGrowth(currStats.purchases, prevStats.purchases);
  const balanceGrowth = calcGrowth(currStats.balance, prevStats.balance);
  const profitGrowth = calcGrowth(currStats.profit, prevStats.profit);

  const salesLastMonth = prevStats.sales;
  const expensesLastMonth = prevStats.expenses;
  const purchasesLastMonth = prevStats.purchases;
  const balanceLastMonth = prevStats.balance;
  const profitLastMonth = prevStats.profit;

  // Dynamic Sparkline Generator
  const generateSparklinePath = (values: number[]) => {
    if (values.length === 0) return { linePath: '', fillPath: '' };
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const range = max - min;
    const width = 100;
    const height = 30;

    const points = values.map((val, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((val - min) / range) * (height - 4) - 2;
      return { x, y };
    });

    let path = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + 2 * (p1.x - p0.x) / 3;
      const cpY2 = p1.y;
      path += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }

    const fillPath = `${path} L 100 40 L 0 40 Z`;
    return { linePath: path, fillPath };
  };

  const getSparklineData = (type: 'sale' | 'expense' | 'balance' | 'profit' | 'purchase') => {
    const today = new Date();
    const vals: number[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
      
      let val = 0;
      if (type === 'sale') {
        const txs = bizTransactions.filter(t => t.type === 'sale' && t.date === dateStr);
        val = txs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      } else if (type === 'expense') {
        const txs = bizTransactions.filter(t => (t.type === 'expense' || t.type === 'Expense') && t.date === dateStr);
        val = txs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      } else if (type === 'purchase') {
        const txs = bizTransactions.filter(t => (t.type === 'purchase' || t.type === 'Purchase') && t.date === dateStr);
        val = txs.reduce((sum, t) => sum + (t.totalAmount || 0), 0);
      } else if (type === 'balance') {
        const inflowTxs = bizTransactions.filter(t => (t.type === 'sale' || t.type === 'payment_in' || t.type === 'Payment In') && t.date === dateStr);
        const outflowTxs = bizTransactions.filter(t => (t.type === 'expense' || t.type === 'Expense') && t.date === dateStr);
        val = inflowTxs.reduce((sum, t) => sum + getPaidAmount(t), 0) - outflowTxs.reduce((sum, t) => sum + getPaidAmount(t), 0);
      } else if (type === 'profit') {
        const sales = bizTransactions.filter(t => t.type === 'sale' && t.date === dateStr);
        sales.forEach(t => {
          t.products?.forEach((tp: any) => {
            const prod = products.find(p => p.id === tp.productId);
            if (prod) {
              val += (prod.sellingPrice - prod.purchasePrice) * tp.quantity;
            } else {
              val += tp.total * 0.3;
            }
          });
          val -= t.discount || 0;
        });
      }
      vals.push(val);
    }

    const allZero = vals.every(v => v === 0);
    if (allZero) {
      return [0, 0, 0, 0, 0, 0, 0];
    }
    return vals;
  };

  // Main Daily Chart Data
  let dailyChartData: any[] = [];
  const salesByDate: Record<string, number> = {};
  bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
    const parts = t.date.replace(/\//g, '-').split('-');
    let normalizedDate = t.date;
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        normalizedDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
      } else {
        normalizedDate = `${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}-${parts[2]}`;
      }
    }
    salesByDate[normalizedDate] = (salesByDate[normalizedDate] || 0) + t.totalAmount;
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
    const y = activeMonthDate.getFullYear();
    const m = activeMonthDate.getMonth();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(y, m, i);
      dates.push(formatDateStr(d));
    }
  } else if (timeFilter === 'daily') {
    dates.push(formatDateStr(today));
  } else if (timeFilter === 'yearly') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    dailyChartData = months.map((m, idx) => {
      let salesSum = 0;
      bizTransactions.filter(t => t.type === 'sale').forEach(t => {
        const d = parseDateStr(t.date);
        if (d && d.getMonth() === idx && d.getFullYear() === activeMonthDate.getFullYear()) {
          salesSum += t.totalAmount;
        }
      });
      return { date: m, Sales: salesSum };
    });
  }

  if (timeFilter !== 'yearly') {
    if (dates.length > 0) {
      dailyChartData = dates.map(dateStr => ({
        date: dateStr.substring(0, 5), // DD-MM
        fullDate: dateStr,
        Sales: parseFloat((salesByDate[dateStr] || 0).toFixed(2))
      }));
    } else {
      dailyChartData = Object.keys(salesByDate)
        .sort()
        .map((date) => ({
          date: date.substring(0, 5),
          fullDate: date,
          Sales: parseFloat(salesByDate[date].toFixed(2)),
        }));
    }
  }

  // Best Selling Products calculations
  const productSalesMap: Record<string, number> = {};
  bizTransactions.filter((t) => t.type === 'sale').forEach((t) => {
    t.products?.forEach((p: any) => {
      productSalesMap[p.productName] = (productSalesMap[p.productName] || 0) + p.quantity;
    });
  });

  const computedProducts = Object.keys(productSalesMap).map((name) => ({
    name,
    Sales: productSalesMap[name],
  })).sort((a, b) => b.Sales - a.Sales).slice(0, 5);

  const maxBestSeller = Math.max(...computedProducts.map(p => p.Sales), 1);

  // Stock gauge calculations
  const inStockCount = bizProducts.filter(p => (p.stock || 0) > (p.minStock || 0)).length;
  const lowStockCount = bizProducts.filter(p => (p.stock || 0) <= (p.minStock || 0) && (p.stock || 0) > 0).length;
  const outOfStockCount = bizProducts.filter(p => (p.stock || 0) === 0).length;
  const totalProducts = bizProducts.length;

  const stockGaugeData = [
    { name: 'In Stock', value: inStockCount || 0, color: '#10B981' },
    { name: 'Low Stock', value: lowStockCount || 0, color: '#F59E0B' },
    { name: 'Out of Stock', value: outOfStockCount || 0, color: '#EF4444' }
  ];

  // Top Customers calculations
  const customerSalesMap: Record<string, number> = {};
  bizTransactions.filter(t => t.type === 'sale').forEach(t => {
    if (t.contactName) {
      customerSalesMap[t.contactName] = (customerSalesMap[t.contactName] || 0) + (t.totalAmount || 0);
    }
  });

  const computedCustomers = Object.keys(customerSalesMap).map(name => ({
    name,
    amount: customerSalesMap[name]
  })).sort((a, b) => b.amount - a.amount).slice(0, 5);

  // Low Stock Alerts items
  const computedLowStockAlerts = bizProducts.filter(p => (p.stock || 0) <= (p.minStock || 0)).slice(0, 3);

  // Donut chart logic for Payment Collection
  const totalPayment = paidInCash + paidOnline + pendingPayments;
  const cashPercent = totalPayment > 0 ? Math.round((paidInCash / totalPayment) * 100) : 0;
  const onlinePercent = totalPayment > 0 ? Math.round((paidOnline / totalPayment) * 100) : 0;
  const pendingPercent = totalPayment > 0 ? Math.max(0, 100 - cashPercent - onlinePercent) : 0;
  const displayPaymentTotal = totalPayment;

  const paymentPieData = [
    { name: 'Cash', value: paidInCash, color: '#10B981' },
    { name: 'Online', value: paidOnline, color: '#4ADE80' },
    { name: 'Pending', value: pendingPayments, color: '#F59E0B' }
  ];

  // Last 6 months dropdown items helper
  const getDropdownMonths = () => {
    const monthsList: Date[] = [];
    const today = new Date();
    for (let i = 0; i < 6; i++) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      monthsList.push(d);
    }
    return monthsList;
  };

  // Date range label
  const getDateRangeStr = () => {
    const formatMonth = (d: Date) => {
      return d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    };
    if (timeFilter === 'monthly') {
      const startOfMonth = new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth(), 1);
      const endOfMonth = new Date(activeMonthDate.getFullYear(), activeMonthDate.getMonth() + 1, 0);
      return `${formatMonth(startOfMonth)} - ${formatMonth(endOfMonth)}`;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (timeFilter === 'daily') {
      return formatMonth(today);
    }
    if (timeFilter === 'weekly') {
      const day = today.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      const start = new Date(today);
      start.setDate(today.getDate() + diffToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);
      return `${formatMonth(start)} - ${formatMonth(end)}`;
    }
    if (timeFilter === 'yearly') {
      return `01 Jan ${today.getFullYear()} - 31 Dec ${today.getFullYear()}`;
    }
    if (timeFilter === 'custom') {
      if (customDateStr.length === 8) {
        const cd = Number(customDateStr.substring(0, 2));
        const cm = Number(customDateStr.substring(2, 4));
        const cy = Number(customDateStr.substring(4, 8));
        const customDate = new Date(cy, cm - 1, cd);
        return formatMonth(customDate);
      }
      return 'Enter Custom Date';
    }
    return 'All Time Data';
  };

  // Sparkline elements
  const salesSparkline = generateSparklinePath(getSparklineData('sale'));
  const expensesSparkline = generateSparklinePath(getSparklineData('expense'));
  const purchasesSparkline = generateSparklinePath(getSparklineData('purchase'));
  const balanceSparkline = generateSparklinePath(getSparklineData('balance'));
  const profitSparkline = generateSparklinePath(getSparklineData('profit'));

  return (
    <div style={styles.container}>
      {/* Upper Panel */}
      <div className="dashboard-top-row">
        <div>
          <h1 style={styles.title}>Aura Dashboard 👋</h1>
          <p style={styles.subtitle}>Real-time overview of your business performance</p>
        </div>

        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Date Picker Display */}
          <div style={styles.datePickerBtn}>
            <Calendar size={15} color="var(--color-text-muted)" style={{ marginRight: '6px' }} />
            <span style={{ fontSize: '13px', fontWeight: '500', color: 'var(--color-primary)' }}>{getDateRangeStr()}</span>
            <ChevronDown size={14} color="var(--color-text-muted)" style={{ marginLeft: '8px' }} />
          </div>

          {/* Time Filter Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={styles.toggleWrapper}>
              {(['all', 'daily', 'weekly', 'monthly', 'yearly', 'custom'] as const).map((filter) => (
                <button
                  key={filter}
                  style={{
                    ...styles.toggleBtn,
                    backgroundColor: timeFilter === filter ? '#064E3B' : 'transparent',
                    color: timeFilter === filter ? '#FFFFFF' : 'var(--color-text-muted)',
                    textTransform: 'capitalize'
                  }}
                  onClick={() => setTimeFilter(filter)}
                >
                  {filter}
                </button>
              ))}
            </div>
            {timeFilter === 'custom' && (
              <input
                type="text"
                placeholder="DDMMYYYY"
                maxLength={8}
                value={customDateStr}
                onChange={(e) => setCustomDateStr(e.target.value.replace(/\D/g, ''))}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  outline: 'none',
                  fontSize: '12px',
                  width: '90px',
                  backgroundColor: '#FFFFFF',
                  fontWeight: '500'
                }}
              />
            )}
          </div>

          {/* View Switcher Toggle */}
          <div style={styles.toggleWrapper}>
            <button 
              style={{
                ...styles.toggleBtn, 
                backgroundColor: viewScope === 'current' ? '#064E3B' : 'transparent',
                color: viewScope === 'current' ? '#FFFFFF' : 'var(--color-text-muted)'
              }}
              onClick={() => setViewScope('current')}
            >
              Active Business
            </button>
            <button 
              style={{
                ...styles.toggleBtn, 
                backgroundColor: viewScope === 'overall' ? '#064E3B' : 'transparent',
                color: viewScope === 'overall' ? '#FFFFFF' : 'var(--color-text-muted)'
              }}
              onClick={() => setViewScope('overall')}
            >
              All Businesses
            </button>
          </div>
        </div>
      </div>

      {/* Cards Metrics Grid */}
      <div className="dashboard-metrics-grid">
        {/* TOTAL SALES */}
        <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('sales')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL SALES</span>
            <div style={{ ...styles.badgeWrapper, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <ArrowUpRight size={12} style={{ marginRight: '2px' }} />
              {salesGrowth > 0 ? `+${salesGrowth}%` : `${salesGrowth}%`}
            </div>
          </div>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
              <ShoppingBag size={18} color="#10B981" />
            </div>
            <span style={styles.metricValue}>₹{totalSales.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <span style={styles.cardFooterText}>vs last month ₹{salesLastMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
          
          {/* Sparkline */}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={styles.sparklineSvg}>
            <defs>
              <linearGradient id="gradient-sales" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10B981" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
              </linearGradient>
            </defs>
            {salesSparkline.fillPath && <path d={salesSparkline.fillPath} fill="url(#gradient-sales)" />}
            {salesSparkline.linePath && <path d={salesSparkline.linePath} fill="none" stroke="#10B981" strokeWidth="1.5" />}
          </svg>
        </div>

        {/* TOTAL EXPENSES */}
        <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('expenses')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL EXPENSES</span>
            <div style={{ ...styles.badgeWrapper, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
              <ArrowUpRight size={12} style={{ marginRight: '2px' }} />
              {expensesGrowth > 0 ? `+${expensesGrowth}%` : `${expensesGrowth}%`}
            </div>
          </div>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
              <DollarSign size={18} color="#EF4444" />
            </div>
            <span style={styles.metricValue}>₹{totalExpense.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <span style={styles.cardFooterText}>vs last month ₹{expensesLastMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>

          {/* Sparkline */}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={styles.sparklineSvg}>
            <defs>
              <linearGradient id="gradient-expenses" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#EF4444" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
              </linearGradient>
            </defs>
            {expensesSparkline.fillPath && <path d={expensesSparkline.fillPath} fill="url(#gradient-expenses)" />}
            {expensesSparkline.linePath && <path d={expensesSparkline.linePath} fill="none" stroke="#EF4444" strokeWidth="1.5" />}
          </svg>
        </div>

        {/* TOTAL PURCHASES */}
        <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('purchases')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL PURCHASES</span>
            <div style={{ ...styles.badgeWrapper, backgroundColor: 'rgba(245, 158, 11, 0.1)', color: '#F59E0B' }}>
              <ArrowUpRight size={12} style={{ marginRight: '2px' }} />
              {purchasesGrowth > 0 ? `+${purchasesGrowth}%` : `${purchasesGrowth}%`}
            </div>
          </div>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
              <TrendingUp size={18} color="#F59E0B" />
            </div>
            <span style={styles.metricValue}>₹{totalPurchase.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <span style={styles.cardFooterText}>vs last month ₹{purchasesLastMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>

          {/* Sparkline */}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={styles.sparklineSvg}>
            <defs>
              <linearGradient id="gradient-purchases" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
              </linearGradient>
            </defs>
            {purchasesSparkline.fillPath && <path d={purchasesSparkline.fillPath} fill="url(#gradient-purchases)" />}
            {purchasesSparkline.linePath && <path d={purchasesSparkline.linePath} fill="none" stroke="#F59E0B" strokeWidth="1.5" />}
          </svg>
        </div>

        {/* TOTAL BALANCE */}
        <div className="card" style={{ ...styles.metricCard, cursor: 'pointer' }} onClick={() => setActiveModal('balance')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>TOTAL BALANCE</span>
            <div style={{ ...styles.badgeWrapper, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <ArrowUpRight size={12} style={{ marginRight: '2px' }} />
              {balanceGrowth > 0 ? `+${balanceGrowth}%` : `${balanceGrowth}%`}
            </div>
          </div>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(59, 130, 246, 0.1)' }}>
              <CreditCard size={18} color="#3B82F6" />
            </div>
            <span style={styles.metricValue}>
              {totalBalance < 0 ? '-' : ''}₹{Math.abs(totalBalance).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
            </span>
          </div>
          <span style={styles.cardFooterText}>vs last month ₹{balanceLastMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>

          {/* Sparkline */}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={styles.sparklineSvg}>
            <defs>
              <linearGradient id="gradient-balance" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {balanceSparkline.fillPath && <path d={balanceSparkline.fillPath} fill="url(#gradient-balance)" />}
            {balanceSparkline.linePath && <path d={balanceSparkline.linePath} fill="none" stroke="#3B82F6" strokeWidth="1.5" />}
          </svg>
        </div>

        {/* NET ESTIMATED PROFIT */}
        <div className="card" style={{ ...styles.metricCard }}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>NET ESTIMATED PROFIT</span>
            <div style={{ ...styles.badgeWrapper, backgroundColor: 'rgba(16, 185, 129, 0.1)', color: '#10B981' }}>
              <ArrowUpRight size={12} style={{ marginRight: '2px' }} />
              {profitGrowth > 0 ? `+${profitGrowth}%` : `${profitGrowth}%`}
            </div>
          </div>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(139, 92, 246, 0.1)' }}>
              <TrendingUp size={18} color="#8B5CF6" />
            </div>
            <span style={styles.metricValue}>₹{totalProfit.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <span style={styles.cardFooterText}>vs last month ₹{profitLastMonth.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>

          {/* Sparkline */}
          <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={styles.sparklineSvg}>
            <defs>
              <linearGradient id="gradient-profit" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
              </linearGradient>
            </defs>
            {profitSparkline.fillPath && <path d={profitSparkline.fillPath} fill="url(#gradient-profit)" />}
            {profitSparkline.linePath && <path d={profitSparkline.linePath} fill="none" stroke="#8B5CF6" strokeWidth="1.5" />}
          </svg>
        </div>

        {/* STOCK VALUE (COST) */}
        <div className="card" style={{ ...styles.metricCard, paddingBottom: '16px', cursor: 'pointer' }} onClick={() => setActiveModal('stock')}>
          <div style={styles.cardHeader}>
            <span style={styles.cardLabel}>STOCK VALUE (COST)</span>
          </div>
          <div style={styles.cardMain}>
            <div style={{ ...styles.iconBadge, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <Package size={18} color="#F59E0B" />
            </div>
            <span style={styles.metricValue}>₹{stockValue.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
          </div>
          <div style={styles.cardFooterStock}>
            <span style={{ color: lowStockCount > 0 ? '#EF4444' : '#10B981', fontWeight: '700', marginRight: '4px' }}>
              {lowStockCount} Products
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>are low in stock</span>
          </div>
        </div>
      </div>

      {/* Payment Collection Section */}
      <div style={{ marginBottom: '24px' }}>
        <h3 style={styles.sectionTitle}>Payment Collection</h3>
        <div className="dashboard-payment-grid">
          {/* Card: PAID IN CASH */}
          <div className="card" style={{ ...styles.paymentCard, cursor: 'pointer' }} onClick={() => setActiveModal('cash')}>
            <div style={styles.paymentCardHeader}>
              <div style={{ ...styles.paymentIconBadge, backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                <DollarSign size={20} color="#10B981" />
              </div>
              <div>
                <span style={styles.paymentLabel}>PAID IN CASH</span>
                <div style={styles.paymentVal}>₹{paidInCash.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={styles.paymentFooter}>{cashPercent}% of total</div>
          </div>

          {/* Card: PAID ONLINE */}
          <div className="card" style={{ ...styles.paymentCard, cursor: 'pointer' }} onClick={() => setActiveModal('online')}>
            <div style={styles.paymentCardHeader}>
              <div style={{ ...styles.paymentIconBadge, backgroundColor: 'rgba(74, 222, 128, 0.1)' }}>
                <CreditCard size={20} color="#4ADE80" />
              </div>
              <div>
                <span style={styles.paymentLabel}>PAID ONLINE</span>
                <div style={styles.paymentVal}>₹{paidOnline.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={styles.paymentFooter}>{onlinePercent}% of total</div>
          </div>

          {/* Card: PENDING RECEIVABLES */}
          <div className="card" style={{ ...styles.paymentCard, cursor: 'pointer' }} onClick={() => setActiveModal('pending')}>
            <div style={styles.paymentCardHeader}>
              <div style={{ ...styles.paymentIconBadge, backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
                <CreditCard size={20} color="#F59E0B" />
              </div>
              <div>
                <span style={styles.paymentLabel}>PENDING RECEIVABLES</span>
                <div style={{ ...styles.paymentVal, color: '#F59E0B' }}>₹{pendingPayments.toLocaleString('en-IN')}</div>
              </div>
            </div>
            <div style={styles.paymentFooter}>{pendingPercent}% of total</div>
          </div>

          {/* Donut Chart Block */}
          <div className="card" style={styles.donutCard}>
            <div style={styles.donutWrapper}>
              <ResponsiveContainer width="50%" height={120}>
                <PieChart>
                  <Pie
                    data={paymentPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={36}
                    outerRadius={46}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {paymentPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.donutCenterLabel}>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total</span>
                <strong style={{ fontSize: '14px', color: 'var(--color-primary)' }}>₹{displayPaymentTotal.toLocaleString('en-IN')}</strong>
              </div>
              <div style={styles.donutLegend}>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendColorDot, backgroundColor: '#10B981' }} />
                  <span style={styles.legendLabelText}>Cash</span>
                  <span style={styles.legendValueText}>{cashPercent}%</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendColorDot, backgroundColor: '#4ADE80' }} />
                  <span style={styles.legendLabelText}>Online</span>
                  <span style={styles.legendValueText}>{onlinePercent}%</span>
                </div>
                <div style={styles.legendItem}>
                  <span style={{ ...styles.legendColorDot, backgroundColor: '#F59E0B' }} />
                  <span style={styles.legendLabelText}>Pending</span>
                  <span style={styles.legendValueText}>{pendingPercent}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts & Details Row */}
      <div className="dashboard-analytics-grid">
        {/* Daily Sales Volume */}
        <div className="card" style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Daily Sales Volume</h3>
            <div style={{ position: 'relative' }}>
              <div 
                style={styles.dropdownSelector}
                onClick={() => setOpenDropdown(openDropdown === 'sales' ? null : 'sales')}
              >
                <span>{activeMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <ChevronDown size={14} color="var(--color-text-muted)" style={{ marginLeft: '4px' }} />
              </div>
              
              {openDropdown === 'sales' && (
                <div style={styles.monthDropdownMenu}>
                  {getDropdownMonths().map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.monthDropdownItem,
                        backgroundColor: activeMonthDate.getMonth() === m.getMonth() && activeMonthDate.getFullYear() === m.getFullYear() ? '#F1F5F9' : 'transparent'
                      }}
                      onClick={() => {
                        setActiveMonthDate(m);
                        setTimeFilter('monthly');
                        setOpenDropdown(null);
                      }}
                    >
                      {m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={{ flex: 1, minHeight: 0 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData} margin={{ top: 10, right: 10, left: -22, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity="0.2"/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--color-text-muted)" fontSize={11} tickLine={false} />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div style={styles.customTooltip}>
                          <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>{payload[0].payload.fullDate}</div>
                          <div style={{ fontWeight: '700', fontSize: '13px', color: '#10B981', marginTop: '2px' }}>
                            ₹{payload[0].value?.toLocaleString('en-IN')}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="Sales" stroke="#10B981" strokeWidth={2} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Best Selling Products */}
        <div className="card" style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Best Selling Products</h3>
            <div style={{ position: 'relative' }}>
              <div 
                style={styles.dropdownSelector}
                onClick={() => setOpenDropdown(openDropdown === 'products' ? null : 'products')}
              >
                <span>{activeMonthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                <ChevronDown size={14} color="var(--color-text-muted)" style={{ marginLeft: '4px' }} />
              </div>
              
              {openDropdown === 'products' && (
                <div style={styles.monthDropdownMenu}>
                  {getDropdownMonths().map((m, idx) => (
                    <div
                      key={idx}
                      style={{
                        ...styles.monthDropdownItem,
                        backgroundColor: activeMonthDate.getMonth() === m.getMonth() && activeMonthDate.getFullYear() === m.getFullYear() ? '#F1F5F9' : 'transparent'
                      }}
                      onClick={() => {
                        setActiveMonthDate(m);
                        setTimeFilter('monthly');
                        setOpenDropdown(null);
                      }}
                    >
                      {m.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div style={styles.bestSellersList}>
            {computedProducts.length > 0 ? computedProducts.map((p, idx) => {
              const barWidth = (p.Sales / maxBestSeller) * 100;
              const barColor = idx < 3 ? '#10B981' : '#F59E0B';
              return (
                <div key={idx} style={styles.bestSellerItem}>
                  <div style={styles.productInitialBadge}>
                    {p.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={styles.bestSellerName}>{p.name}</div>
                    <div style={styles.progressBarBg}>
                      <div style={{ ...styles.progressBarFill, width: `${barWidth}%`, backgroundColor: barColor }} />
                    </div>
                  </div>
                  <div style={styles.bestSellerCount}>{p.Sales}</div>
                </div>
              );
            }) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px', padding: '20px 0' }}>
                No sales data available
              </div>
            )}
          </div>
        </div>

        {/* Stock Status Overview */}
        <div className="card" style={styles.chartCard}>
          <div style={styles.chartHeader}>
            <h3 style={styles.chartTitle}>Stock Status Overview</h3>
          </div>
          <div style={styles.radialGaugeContainer}>
            <div style={styles.radialGaugeWrapper}>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={stockGaugeData}
                    cx="50%"
                    cy="80%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={50}
                    outerRadius={68}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {stockGaugeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={styles.gaugeCenterLabel}>
                <strong style={{ fontSize: '20px', color: 'var(--color-primary)' }}>{totalProducts}</strong>
                <span style={{ fontSize: '10px', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Total Products</span>
              </div>
            </div>
            <div style={styles.gaugeLegend}>
              <div style={styles.gaugeLegendItem}>
                <span style={{ ...styles.legendColorDot, backgroundColor: '#10B981' }} />
                <span style={styles.legendLabelText}>In Stock ({inStockCount})</span>
              </div>
              <div style={styles.gaugeLegendItem}>
                <span style={{ ...styles.legendColorDot, backgroundColor: '#F59E0B' }} />
                <span style={styles.legendLabelText}>Low Stock ({lowStockCount})</span>
              </div>
              <div style={styles.gaugeLegendItem}>
                <span style={{ ...styles.legendColorDot, backgroundColor: '#EF4444' }} />
                <span style={styles.legendLabelText}>Out of Stock ({outOfStockCount})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Grid: Recent Transactions, Top Customers, Low Stock Alerts */}
      <div className="dashboard-bottom-grid">
        {/* Recent Transactions */}
        <div className="card" style={styles.bottomCard}>
          <div style={styles.bottomCardHeader}>
            <h3 style={styles.chartTitle}>Recent Transactions</h3>
            <button style={styles.viewAllBtn} onClick={() => setActiveModal('sales')}>View All</button>
          </div>
          <div className="table-wrapper" style={{ border: 'none' }}>
            <table className="custom-table" style={styles.denseTable}>
              <thead>
                <tr>
                  <th style={styles.denseTh}>Invoice No.</th>
                  <th style={styles.denseTh}>Date</th>
                  <th style={styles.denseTh}>Customer</th>
                  <th style={styles.denseTh}>Amount</th>
                  <th style={styles.denseTh}>Method</th>
                  <th style={styles.denseTh}>Status</th>
                </tr>
              </thead>
              <tbody>
                {salesTxList.slice(0, 5).map((t, idx) => (
                  <tr key={idx}>
                    <td style={{ ...styles.denseTd, fontWeight: '600', color: 'var(--color-primary)' }}>
                      {t.invoiceNo || `INV-${String(idx + 544).padStart(5, '0')}`}
                    </td>
                    <td style={styles.denseTd}>{formatDateDDMMYYYY(t.date || '')}</td>
                    <td style={styles.denseTd}>{t.contactName || 'Walking Customer'}</td>
                    <td style={{ ...styles.denseTd, fontWeight: '600' }}>₹{t.totalAmount ? t.totalAmount.toLocaleString('en-IN') : '0'}</td>
                    <td style={styles.denseTd}>{t.paymentType || 'Online'}</td>
                    <td style={styles.denseTd}>
                      <span style={{
                        ...styles.statusBadge,
                        backgroundColor: (t.paymentStatus === 'Paid' || !t.paymentStatus) ? '#E6FDF4' : '#FFFBEB',
                        color: (t.paymentStatus === 'Paid' || !t.paymentStatus) ? '#10B981' : '#F59E0B'
                      }}>
                        {t.paymentStatus || 'Paid'}
                      </span>
                    </td>
                  </tr>
                ))}
                {salesTxList.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)', fontSize: '12px' }}>
                      No recent transactions
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Customers */}
        <div className="card" style={styles.bottomCard}>
          <div style={styles.bottomCardHeader}>
            <h3 style={styles.chartTitle}>
              Top Customers <span style={{ fontSize: '12px', fontWeight: '400', color: 'var(--color-text-muted)' }}>({activeMonthDate.toLocaleDateString('en-US', { month: 'long' })})</span>
            </h3>
            <button style={styles.viewAllBtn}>View All</button>
          </div>
          <div style={styles.customerList}>
            {computedCustomers.length > 0 ? computedCustomers.map((c, idx) => (
              <div key={idx} style={styles.customerItem}>
                <div style={styles.customerRankWrapper}>
                  {idx === 0 ? <Crown size={15} color="#F59E0B" /> :
                   idx === 1 ? <Crown size={15} color="#9CA3AF" /> :
                   idx === 2 ? <Crown size={15} color="#B45309" /> : 
                   <span style={styles.rankNum}>{idx + 1}</span>}
                </div>
                <span style={styles.customerName}>{c.name}</span>
                <span style={styles.customerAmount}>₹{c.amount.toLocaleString('en-IN')}</span>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: 'var(--color-text-muted)', fontSize: '12px', padding: '20px 0' }}>
                No customer data available
              </div>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="card" style={{ ...styles.bottomCard, backgroundColor: '#FFF5F5', borderColor: '#FEE2E2' }}>
          <div style={styles.bottomCardHeader}>
            <h3 style={{ ...styles.chartTitle, color: '#991B1B' }}>Low Stock Alerts</h3>
            <button style={{ ...styles.viewAllBtn, color: '#991B1B' }} onClick={() => setActiveModal('stock')}>View All</button>
          </div>
          <div style={styles.lowStockList}>
            {computedLowStockAlerts.length > 0 ? computedLowStockAlerts.map((item, idx) => (
              <div key={idx} style={styles.lowStockItem}>
                <div style={{ ...styles.productInitialBadge, backgroundColor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444' }}>
                  {item.name.substring(0, 2).toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ ...styles.bestSellerName, color: '#991B1B' }}>{item.name}</div>
                  <div style={styles.lowStockStatusLine}>
                    Current Stock: <span style={{ color: '#EF4444', fontWeight: '700', marginLeft: '3px' }}>{item.stock}</span>
                  </div>
                </div>
                <span style={styles.minStockLabel}>Min. Stock: {item.minStock}</span>
              </div>
            )) : (
              <div style={{ textAlign: 'center', color: '#991B1B', fontSize: '12px', padding: '20px 0' }}>
                No low stock alerts
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal overlays for card details */}
      {activeModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h3 style={styles.modalTitle}>
                {activeModal === 'sales' ? 'Sales Transactions'
                 : activeModal === 'expenses' ? 'Expenses'
                 : activeModal === 'purchases' ? 'Purchases'
                 : activeModal === 'cash' ? 'Paid in Cash Transactions'
                 : activeModal === 'online' ? 'Paid Online Transactions'
                 : activeModal === 'pending' ? 'Pending Receivables'
                 : activeModal === 'stock' ? 'Stock Value & Inventory'
                 : activeModal === 'balance' ? 'Total Balance Ledger'
                 : 'Transactions'}
              </h3>
              <X size={20} style={{ cursor: 'pointer' }} onClick={() => setActiveModal(null)} />
            </div>
            <div className="table-wrapper" style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {activeModal === 'stock' ? (
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Product Name</th>
                      <th style={{ textAlign: 'center' }}>Available Qty</th>
                      <th style={{ textAlign: 'right' }}>Purchase Price (Cost)</th>
                      <th style={{ textAlign: 'right' }}>Total Stock Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bizProducts.map((p) => {
                      const qty = p.stock || 0;
                      const cost = p.purchasePrice || 0;
                      const value = qty * cost;
                      return (
                        <tr key={p.id}>
                          <td style={{ fontWeight: '600' }}>{p.name}</td>
                          <td style={{ textAlign: 'center' }}>{qty} {p.unit || ''}</td>
                          <td style={{ textAlign: 'right' }}>₹{cost.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                          <td style={{ textAlign: 'right', fontWeight: '600' }}>₹{value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</td>
                        </tr>
                      );
                    })}
                    {bizProducts.length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                          No products found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              ) : activeModal === 'balance' ? (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-around', backgroundColor: '#FAF8F5', padding: '14px', borderRadius: '8px', marginBottom: '16px' }}>
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL PLUS (+)</span>
                      <strong style={{ display: 'block', fontSize: '15px', color: '#10B981', marginTop: '4px' }}>
                        +₹{totalInflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div style={{ borderRight: '1px solid var(--color-border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>TOTAL MINUS (-)</span>
                      <strong style={{ display: 'block', fontSize: '15px', color: '#EF4444', marginTop: '4px' }}>
                        -₹{totalOutflow.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                    <div style={{ borderRight: '1px solid var(--color-border)' }} />
                    <div style={{ textAlign: 'center' }}>
                      <span style={{ fontSize: '11px', color: 'var(--color-text-muted)', fontWeight: '600' }}>NET BALANCE</span>
                      <strong style={{ display: 'block', fontSize: '15px', color: totalBalance >= 0 ? '#10B981' : '#EF4444', marginTop: '4px' }}>
                        ₹{totalBalance.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                      </strong>
                    </div>
                  </div>
                  <table className="custom-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Ref / Invoice No</th>
                        <th>Party Name</th>
                        <th style={{ textAlign: 'right' }}>Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salesTxList.map((t, i) => (
                        <tr key={i}>
                          <td>{formatDateDDMMYYYY(t.date)}</td>
                          <td style={{ fontWeight: '600' }}>Sale</td>
                          <td>{t.invoiceNo || t.id?.substring(0,6) || '-'}</td>
                          <td>{t.contactName || '-'}</td>
                          <td style={{ textAlign: 'right', fontWeight: '700', color: '#10B981' }}>
                            + ₹{t.totalAmount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                      {salesTxList.length === 0 && (
                        <tr>
                          <td colSpan={5} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                            No transactions found for the selected time filter.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
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
                      activeModal === 'purchases' ? purchaseTxList :
                      pendingTxList
                    ).map((t, i) => (
                      <tr key={i}>
                        <td>{formatDateDDMMYYYY(t.date)}</td>
                        <td>{t.invoiceNo || t.referenceNo || t.id?.substring(0,6) || '-'}</td>
                        <td>{t.contactName || t.partyName || t.vendorName || '-'}</td>
                        <td style={{ fontWeight: '600' }}>
                          ₹{activeModal === 'pending' 
                             ? ((t.totalAmount || 0) - (t.receivedAmount || 0)).toLocaleString('en-IN', { maximumFractionDigits: 2 }) 
                             : (activeModal === 'expenses' || activeModal === 'purchases')
                             ? (t.total || t.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                             : activeModal === 'cash' && t.paymentType?.startsWith('Split:')
                             ? (Number(t.paymentType.split(':')[1]) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                             : activeModal === 'online' && t.paymentType?.startsWith('Split:')
                             ? (Number(t.paymentType.split(':')[2]) || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })
                             : (t.receivedAmount || t.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                    {(
                      activeModal === 'cash' ? cashTxList : 
                      activeModal === 'online' ? onlineTxList : 
                      activeModal === 'sales' ? salesTxList :
                      activeModal === 'expenses' ? expenseTxList :
                      activeModal === 'purchases' ? purchaseTxList :
                      pendingTxList
                    ).length === 0 && (
                      <tr>
                        <td colSpan={4} style={{ textAlign: 'center', padding: '20px', color: 'var(--color-text-muted)' }}>
                          No transactions found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              )}
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
    padding: '0 4px',
    backgroundColor: '#F8FAFC',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    flexWrap: 'wrap',
    gap: '16px'
  },
  title: {
    fontFamily: 'var(--font-sans)',
    fontSize: '26px',
    fontWeight: '800',
    color: 'var(--color-primary)',
    letterSpacing: '-0.5px'
  },
  subtitle: {
    fontSize: '13.5px',
    color: 'var(--color-text-muted)',
    marginTop: '2px',
  },
  datePickerBtn: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    transition: 'all 0.2s',
  },
  toggleWrapper: {
    display: 'flex',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    padding: '3px',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
  },
  toggleBtn: {
    padding: '6px 12px',
    borderRadius: '7px',
    border: 'none',
    cursor: 'pointer',
    fontFamily: 'var(--font-sans)',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.2s',
    background: 'transparent'
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '18px',
    marginBottom: '24px'
  },
  metricCard: {
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '125px',
    padding: '16px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    border: '1px solid #EDF2F7',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    overflow: 'hidden'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px',
    zIndex: 10
  },
  cardLabel: {
    fontSize: '10.5px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.8px',
  },
  badgeWrapper: {
    display: 'flex',
    alignItems: 'center',
    padding: '2px 6px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: '700',
  },
  cardMain: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '4px',
    zIndex: 10
  },
  iconBadge: {
    width: '32px',
    height: '32px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '22px',
    fontWeight: '800',
    color: 'var(--color-primary)',
    fontFamily: 'var(--font-sans)',
    letterSpacing: '-0.5px'
  },
  cardFooterText: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    zIndex: 10
  },
  cardFooterStock: {
    fontSize: '11.5px',
    marginTop: '6px',
    display: 'flex',
    alignItems: 'center'
  },
  sparklineSvg: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: '100%',
    height: '32px',
    pointerEvents: 'none'
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    marginBottom: '14px',
  },
  paymentRowGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '18px'
  },
  paymentCard: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    padding: '16px 18px',
    minHeight: '100px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDF2F7',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  paymentCardHeader: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  paymentIconBadge: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  paymentLabel: {
    fontSize: '10px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    letterSpacing: '0.8px',
  },
  paymentVal: {
    fontSize: '18px',
    fontWeight: '800',
    color: 'var(--color-primary)',
    marginTop: '1px'
  },
  paymentFooter: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    marginTop: '8px',
    borderTop: '1px solid #F7FAFC',
    paddingTop: '6px'
  },
  donutCard: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '14px 20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDF2F7',
    borderRadius: '12px',
    minHeight: '100px'
  },
  donutWrapper: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    justifyContent: 'space-between'
  },
  donutCenterLabel: {
    position: 'absolute',
    left: '25%',
    top: '50%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    pointerEvents: 'none',
    display: 'flex',
    flexDirection: 'column',
  },
  donutLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '45%'
  },
  legendColorDot: {
    width: '7px',
    height: '7px',
    borderRadius: '50%',
  },
  legendLabelText: {
    fontSize: '11px',
    color: 'var(--color-text-muted)',
    flex: 1,
    marginLeft: '6px'
  },
  legendValueText: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--color-primary)',
  },
  analyticsRowGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 1fr',
    gap: '18px',
    marginBottom: '24px',
    flexWrap: 'wrap'
  },
  chartCard: {
    display: 'flex',
    flexDirection: 'column',
    height: '270px',
    padding: '18px 20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDF2F7',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
  },
  chartHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px'
  },
  chartTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--color-primary)',
  },
  dropdownSelector: {
    display: 'flex',
    alignItems: 'center',
    backgroundColor: '#F7FAFC',
    border: '1px solid #E2E8F0',
    borderRadius: '6px',
    padding: '4px 8px',
    fontSize: '11px',
    color: 'var(--color-primary)',
    fontWeight: '600',
    cursor: 'pointer',
    userSelect: 'none'
  },
  monthDropdownMenu: {
    position: 'absolute',
    top: '28px',
    right: 0,
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    zIndex: 100,
    width: '145px',
    padding: '4px 0'
  },
  monthDropdownItem: {
    padding: '8px 12px',
    fontSize: '12px',
    color: 'var(--color-primary)',
    cursor: 'pointer',
    transition: 'background 0.2s',
    fontWeight: '500',
  },
  customTooltip: {
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '8px',
    padding: '8px 12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
  },
  bestSellersList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    flex: 1,
    justifyContent: 'center'
  },
  bestSellerItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  productInitialBadge: {
    width: '28px',
    height: '28px',
    borderRadius: '6px',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    color: '#10B981',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '10px',
    fontWeight: '700',
    flexShrink: 0
  },
  bestSellerName: {
    fontSize: '11.5px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
    whiteSpace: 'nowrap',
    marginBottom: '4px'
  },
  progressBarBg: {
    height: '4px',
    backgroundColor: '#EDF2F7',
    borderRadius: '2px',
    overflow: 'hidden'
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '2px'
  },
  bestSellerCount: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'var(--color-primary)',
    marginLeft: '8px'
  },
  radialGaugeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1
  },
  radialGaugeWrapper: {
    position: 'relative',
    width: '100%',
    height: '110px',
    marginTop: '-15px'
  },
  gaugeCenterLabel: {
    position: 'absolute',
    left: '50%',
    top: '75%',
    transform: 'translate(-50%, -50%)',
    textAlign: 'center',
    display: 'flex',
    flexDirection: 'column',
  },
  gaugeLegend: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    width: '100%',
    borderTop: '1px solid #F7FAFC',
    paddingTop: '8px'
  },
  gaugeLegendItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bottomGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '18px',
    marginBottom: '20px'
  },
  bottomCard: {
    display: 'flex',
    flexDirection: 'column',
    padding: '18px 20px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #EDF2F7',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
    minHeight: '260px'
  },
  bottomCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '14px'
  },
  viewAllBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--color-success)',
    fontSize: '11.5px',
    fontWeight: '700',
    cursor: 'pointer'
  },
  denseTable: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  denseTh: {
    padding: '6px 8px',
    fontSize: '10.5px',
    fontWeight: '700',
    color: 'var(--color-text-muted)',
    borderBottom: '1px solid #EDF2F7',
    textAlign: 'left'
  },
  denseTd: {
    padding: '8px 8px',
    fontSize: '11.5px',
    color: 'var(--color-text-main)',
    borderBottom: '1px solid #F7FAFC',
  },
  statusBadge: {
    padding: '2px 6px',
    borderRadius: '8px',
    fontSize: '9.5px',
    fontWeight: '700',
  },
  customerList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    justifyContent: 'center'
  },
  customerItem: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#F8FAFC',
    border: '1px solid #F1F5F9'
  },
  customerRankWrapper: {
    width: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: '10px'
  },
  rankNum: {
    fontSize: '11.5px',
    fontWeight: '700',
    color: 'var(--color-text-muted)'
  },
  customerName: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--color-primary)',
    flex: 1
  },
  customerAmount: {
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--color-primary)'
  },
  lowStockList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    flex: 1,
    justifyContent: 'center'
  },
  lowStockItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#FFF',
    border: '1px solid #FEE2E2'
  },
  lowStockStatusLine: {
    fontSize: '10.5px',
    color: '#991B1B',
  },
  minStockLabel: {
    fontSize: '11px',
    color: '#991B1B',
    fontWeight: '500'
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    maxWidth: '850px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--color-text-main)',
  }
};
