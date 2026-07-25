// packages/shared-ui/src/pwa/update.tsx
// PWA update notification banner
import React, { useState, useEffect } from 'react';

export const UpdateBanner: React.FC = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        setShow(true);
      });
    }
  }, []);

  if (!show) return null;

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, background: '#0d9488', color: '#fff', textAlign: 'center', padding: '8px', zIndex: 9999, cursor: 'pointer' }}
         onClick={() => window.location.reload()}>
      🔄 Phiên bản mới! Nhấn để cập nhật.
    </div>
  );
};
