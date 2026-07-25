// @ts-nocheck
import { useState, useEffect } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/**
 * useInstallPrompt — cross-browser PWA install prompt hook.
 *
 * Handles:
 *  - Chrome/Edge/Android: beforeinstallprompt event
 *  - iOS Safari: standalone mode detection (manual guide shown)
 *  - appinstalled event
 *
 * Usage:
 *   const { isInstallable, isInstalled, isIOS, install } = useInstallPrompt();
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable]   = useState(false);
  const [isInstalled,   setIsInstalled]     = useState(false);
  const [isIOS,         setIsIOS]           = useState(false);

  useEffect(() => {
    // iOS: no beforeinstallprompt; check if NOT already in standalone mode
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    if (iOS) {
      setIsIOS(true);
      // @ts-ignore — standalone is iOS-specific, not in standard TS types
      const alreadyInstalled = (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      setIsInstallable(!alreadyInstalled);
      return;
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  /**
   * Trigger the native browser install dialog.
   * Returns true if the user accepted, false otherwise.
   * For iOS, returns false immediately (show manual guide in UI instead).
   */
  const install = async (): Promise<boolean> => {
    if (!deferredPrompt) return false;
    try {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      setDeferredPrompt(null);
      setIsInstallable(false);
      return outcome === 'accepted';
    } catch {
      return false;
    }
  };

  return { isInstallable, isInstalled, isIOS, install };
}
