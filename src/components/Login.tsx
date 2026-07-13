import React, { useState } from 'react';
import { supabase } from '../utils/supabaseClient';
import { Lock, Shield } from 'lucide-react';

export const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin
        }
      });

      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign in.');
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      {/* Background blobs for premium depth */}
      <div style={styles.blurBlob1}></div>
      <div style={styles.blurBlob2}></div>

      <div style={styles.card}>
        <div style={styles.brandIconWrapper}>
          <div style={styles.brandIcon}>
            <Shield size={32} color="#3B82F6" />
          </div>
        </div>

        <h1 style={styles.title}>BusinessPro</h1>
        <p style={styles.subtitle}>Smart Billing & Inventory Management</p>

        {error && <div style={styles.errorAlert}>{error}</div>}

        <button 
          onClick={handleGoogleLogin} 
          disabled={loading} 
          style={styles.loginBtn}
        >
          {loading ? (
            <span style={styles.spinner}></span>
          ) : (
            <svg style={styles.googleIcon} viewBox="0 0 24 24" width="20" height="20">
              <path
                fill="#EA4335"
                d="M5.266 9.765A7.077 7.077 0 0 1 12 4.909c1.69 0 3.218.6 4.418 1.582L19.91 3C17.782 1.145 15.055 0 12 0 7.27 0 3.23 2.76 1.34 6.78l3.926 2.985z"
              />
              <path
                fill="#4285F4"
                d="M23.49 12.275c0-.825-.075-1.613-.21-2.383H12v4.513h6.446c-.28 1.488-1.12 2.753-2.38 3.593l3.7 2.87c2.16-1.99 3.424-4.92 3.424-8.593z"
              />
              <path
                fill="#FBBC05"
                d="M5.266 14.235L1.34 17.22A11.948 11.948 0 0 0 12 24c3.055 0 5.864-1.01 7.973-2.73l-3.7-2.87a7.122 7.122 0 0 1-9.54-4.165z"
              />
              <path
                fill="#34A853"
                d="M1.34 6.78a11.948 11.948 0 0 0 0 10.44l3.926-2.985a7.124 7.124 0 0 1 0-4.47L1.34 6.78z"
              />
            </svg>
          )}
          <span>{loading ? 'Connecting...' : 'Continue with Google'}</span>
        </button>

        <div style={styles.footer}>
          <Lock size={12} style={{ marginRight: '4px' }} />
          <span>Secure transaction environment</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: '#0B0F19',
    position: 'relative',
    overflow: 'hidden',
    fontFamily: 'var(--font-sans, "Inter", sans-serif)',
  },
  blurBlob1: {
    position: 'absolute',
    width: '350px',
    height: '350px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59, 130, 246, 0.15) 0%, rgba(0,0,0,0) 70%)',
    top: '10%',
    left: '15%',
    filter: 'blur(40px)',
  },
  blurBlob2: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(147, 51, 234, 0.12) 0%, rgba(0,0,0,0) 70%)',
    bottom: '15%',
    right: '15%',
    filter: 'blur(50px)',
  },
  card: {
    position: 'relative',
    zIndex: 10,
    width: '100%',
    maxWidth: '420px',
    backgroundColor: '#121826',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '24px',
    padding: '40px 32px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
  },
  brandIconWrapper: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '64px',
    height: '64px',
    borderRadius: '20px',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    marginBottom: '24px',
  },
  brandIcon: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '28px',
    fontWeight: '800',
    color: '#FFFFFF',
    margin: '0 0 8px 0',
    letterSpacing: '-0.5px',
  },
  subtitle: {
    fontSize: '14px',
    color: '#9CA3AF',
    margin: '0 0 32px 0',
  },
  errorAlert: {
    width: '100%',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.2)',
    color: '#F87171',
    padding: '12px 16px',
    borderRadius: '12px',
    fontSize: '13px',
    marginBottom: '20px',
    textAlign: 'left',
  },
  loginBtn: {
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '12px',
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
    border: 'none',
    borderRadius: '14px',
    padding: '14px 20px',
    fontSize: '15px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    outline: 'none',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  googleIcon: {
    flexShrink: 0,
  },
  spinner: {
    width: '20px',
    height: '20px',
    border: '2px solid rgba(0, 0, 0, 0.1)',
    borderTopColor: '#1F2937',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite',
  },
  footer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '32px',
    fontSize: '12px',
    color: '#4B5563',
  }
};
