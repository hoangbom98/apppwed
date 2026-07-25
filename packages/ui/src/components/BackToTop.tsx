// @ts-nocheck
// packages/shared-ui/src/components/BackToTop.tsx
import React, { useState, useEffect } from 'react';

const BackToTop: React.FC = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
      style={{
        position: 'fixed', bottom: 24, right: 24,
        width: 44, height: 44, borderRadius: '50%',
        background: '#0d9488', color: '#fff', border: 'none',
        cursor: 'pointer', fontSize: 20, zIndex: 1000,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
};

export default BackToTop;
