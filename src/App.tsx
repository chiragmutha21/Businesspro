import { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/Sidebar';
import { Menu } from 'lucide-react';
import { Header } from './components/Header';
import { Wizard } from './components/Wizard';
import { Dashboard } from './components/Dashboard';
import { Products } from './components/Products';
import { Customers } from './components/Customers';
import { Transactions } from './components/Transactions';
import { Reports } from './components/Reports';
import { Purchases } from './components/Purchases';
import { CalculatorWidget } from './components/CalculatorWidget';
import { CashBank } from './components/CashBank';
import { Backup } from './components/Backup';
import { Login } from './components/Login';

function AppContent() {
  const { businesses, user, authLoading, dataLoading } = useApp();
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [showWizard, setShowWizard] = useState(false);
  const [editingBusinessId, setEditingBusinessId] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (authLoading || (user && dataLoading)) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: '#0B0F19',
        color: '#FFFFFF',
        fontFamily: 'sans-serif'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(255, 255, 255, 0.1)',
          borderTopColor: '#3B82F6',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }}></div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  // If no businesses registered, enforce Onboarding Wizard
  const isFirstBusiness = businesses.length === 0;

  if (isFirstBusiness || showWizard || editingBusinessId) {
    return (
      <Wizard 
        isFirstBusiness={isFirstBusiness}
        editMode={!!editingBusinessId}
        editingBusinessId={editingBusinessId || undefined}
        onComplete={() => {
          setShowWizard(false);
          setEditingBusinessId(null);
          setCurrentTab('dashboard');
        }} 
        onCancel={() => {
          setShowWizard(false);
          setEditingBusinessId(null);
          setCurrentTab('dashboard');
        }}
      />
    );
  }

  // Handle click on search item from Header
  const handleSearchSelect = (tab: string) => {
    setCurrentTab(tab);
  };

  return (
    <div className="app-container">
      {/* Mobile Top Header (Only visible on Mobile view) */}
      <div className="mobile-header">
        <button className="menu-toggle-btn" onClick={() => setIsMobileMenuOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img src="/logo.jpg" alt="Logo" style={{ width: '28px', height: '28px', borderRadius: '6px', objectFit: 'cover' }} />
          <span style={{ fontSize: '18px', fontWeight: '800', color: '#3B82F6', letterSpacing: '0.5px' }}>BusinessPro</span>
        </div>
        <div style={{ width: '40px' }}></div> {/* Spacer to balance alignment */}
      </div>

      {/* Backdrop overlay when mobile menu is active */}
      {isMobileMenuOpen && (
        <div className="menu-overlay" onClick={() => setIsMobileMenuOpen(false)}></div>
      )}

      {/* Sidebar Navigation */}
      <Sidebar 
        currentTab={currentTab} 
        setCurrentTab={setCurrentTab} 
        onAddBusiness={() => setShowWizard(true)}
        onEditBusiness={(id) => setEditingBusinessId(id)}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />

      {/* Main Container */}
      <div className="main-content">
        {/* Header Action Bar */}
        <Header onSearchSelect={handleSearchSelect} />

        {/* Content Body Router */}
        <main style={styles.mainWrapper}>
          {currentTab === 'dashboard' && <Dashboard />}
          {currentTab === 'products' && <Products />}
          {currentTab === 'customers' && <Customers />}
          {['transactions', 'sale-invoices', 'estimate-quotation', 'proforma-invoice', 'payment-in', 'sale-order', 'delivery-challan', 'sale-return'].includes(currentTab) && (
            <Transactions activeSection={currentTab} />
          )}
          {['purchase-bills', 'payment-out', 'expenses', 'purchase-order', 'purchase-return'].includes(currentTab) && (
            <Purchases activeSection={currentTab} />
          )}
          {['bank-accounts', 'cash-in-hand', 'cheques', 'loan-accounts'].includes(currentTab) && (
            <CashBank activeSection={currentTab} />
          )}
          {currentTab === 'reports' && <Reports />}
          {currentTab === 'sync' && <Backup />}
          {currentTab === 'profile' && <Wizard editMode={true} onComplete={() => setCurrentTab('dashboard')} />}
        </main>
      </div>
      <CalculatorWidget />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}

const styles = {
  mainWrapper: {
    padding: '24px 0',
    flex: 1,
    overflowY: 'auto' as const
  }
};
