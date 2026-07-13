import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

export const CalculatorWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [display, setDisplay] = useState('');
  const [equation, setEquation] = useState('');

  useEffect(() => {
    const handleToggle = () => {
      setIsOpen(prev => !prev);
    };

    window.addEventListener('toggle-calculator', handleToggle);
    return () => {
      window.removeEventListener('toggle-calculator', handleToggle);
    };
  }, []);

  const handleKeyPress = (val: string) => {
    if (val === 'C') {
      setDisplay('');
      setEquation('');
    } else if (val === '⌫') {
      setDisplay(prev => prev.slice(0, -1));
      setEquation(prev => prev.slice(0, -1));
    } else if (val === '=') {
      try {
        // Safe evaluation of mathematical expressions
        // Replace visual symbols
        const cleanEq = equation.replace(/x/g, '*').replace(/÷/g, '/');
        // Evaluate using Function constructor (safe since input is strictly numeric + operators from button clicks)
        const result = new Function(`return ${cleanEq}`)();
        if (result !== undefined && !isNaN(result)) {
          setDisplay(String(result));
          setEquation(String(result));
        } else {
          setDisplay('Error');
        }
      } catch (err) {
        setDisplay('Error');
      }
    } else {
      // Append number or operator
      setDisplay(prev => prev + val);
      setEquation(prev => prev + val);
    }
  };

  if (!isOpen) return null;

  const buttons = [
    ['C', '(', ')', '÷'],
    ['7', '8', '9', 'x'],
    ['4', '5', '6', '-'],
    ['1', '2', '3', '+'],
    ['0', '.', '⌫', '=']
  ];

  return (
    <div style={styles.floatingCalc}>
      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>Aura Calculator</span>
        <button 
          style={styles.closeBtn} 
          onClick={() => setIsOpen(false)}
        >
          <X size={14} color="#9CA3AF" />
        </button>
      </div>

      {/* Screen */}
      <div style={styles.screen}>
        <div style={styles.equation}>{equation || '0'}</div>
        <div style={styles.display}>{display || '0'}</div>
      </div>

      {/* Buttons */}
      <div style={styles.btnGrid}>
        {buttons.map((row, rIdx) => (
          <div key={rIdx} style={styles.row}>
            {row.map((btn) => {
              const isOperator = ['÷', 'x', '-', '+', '='].includes(btn);
              const isClear = ['C', '⌫'].includes(btn);
              
              return (
                <button
                  key={btn}
                  onClick={() => handleKeyPress(btn)}
                  style={{
                    ...styles.calcBtn,
                    backgroundColor: isOperator ? '#3B82F6' : (isClear ? '#EF4444' : '#2D3748'),
                    color: '#FFFFFF',
                  }}
                >
                  {btn}
                </button>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  floatingCalc: {
    position: 'fixed' as const,
    bottom: '80px',
    right: '24px',
    width: '260px',
    backgroundColor: '#1E2538',
    borderRadius: '12px',
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.4), 0 8px 10px -6px rgba(0, 0, 0, 0.4)',
    border: '1.5px solid #2D3748',
    zIndex: 99999,
    padding: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    fontFamily: 'monospace',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #2D3748',
    paddingBottom: '8px',
  },
  title: {
    fontSize: '12px',
    fontWeight: '700',
    color: '#9CA3AF',
    textTransform: 'uppercase',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: {
    backgroundColor: '#0F172A',
    borderRadius: '6px',
    padding: '10px',
    textAlign: 'right' as const,
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    minHeight: '64px',
    justifyContent: 'center',
  },
  equation: {
    fontSize: '11px',
    color: '#64748B',
    wordBreak: 'break-all',
  },
  display: {
    fontSize: '20px',
    color: '#F8FAFC',
    fontWeight: '700',
    wordBreak: 'break-all',
  },
  btnGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '6px',
  },
  calcBtn: {
    flex: 1,
    height: '38px',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.15s',
  }
};
