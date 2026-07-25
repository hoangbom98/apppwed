// @ts-nocheck
// packages/shared-ui/src/pwa/install.tsx
// PWA install prompt component
import React, { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface InstallPromptProps {
  appName?: string;
  appIcon?: string;
}

export const InstallPrompt: React.FC<InstallPromptProps> = ({ appName, appIcon }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  if (!visible || !deferredPrompt) return null;

  const handleInstall = async () => {
    await deferredPrompt.prompt();
    setVisible(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 16, left: '50%', transform: 'translateX(-50%)', zIndex: 9999, background: '#1a1a2e', color: '#fff', padding: '12px 24px', borderRadius: 8, cursor: 'pointer' }}
         onClick={handleInstall}>
      📱 Cài đặt ứng dụng
    </div>
  );
};
