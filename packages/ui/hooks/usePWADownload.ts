/**
 * usePWADownload.ts — shared-ui/hooks
 * ------------------------------------
 * Unified download intent hook that merges:
 *  - PWA install prompt (BeforeInstallPromptEvent)
 *  - OS detection (Android / iOS / Desktop)
 *
 * Priority:
 *  1. If PWA is installable (beforeinstallprompt fired) → native install dialog
 *  2. Else if Android → direct APK / Play Store link
 *  3. Else if iOS     → OTA manifest / App Store link  + Safari guide
 *  4. Else desktop    → show QR code
 *
 * Usage:
 *   const { os, mode, isPWAInstallable, isInstalled,
 *           triggerInstall, downloadLink } = usePWADownload({ androidLink, iosLink });
 */

import { useState, useEffect, useCallback } from 'react';
import { useDeviceOS } from './useDeviceOS';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export type DownloadMode = 'pwa-install' | 'android' | 'ios' | 'desktop' | 'unknown';

export interface UsePWADownloadOptions {
  /** Android APK or Play Store URL */
  androidLink: string;
  /** iOS OTA manifest URL (itms-services://) or App Store URL */
  iosLink: string;
}

export interface UsePWADownloadResult {
  /** Detected OS */
  os: 'android' | 'ios' | 'desktop' | 'unknown';
  /** Resolved download mode (accounts for PWA installability) */
  mode: DownloadMode;
  /** True when browser supports PWA install and hasn't been dismissed */
  isPWAInstallable: boolean;
  /** True after the app was installed via PWA prompt */
  isInstalled: boolean;
  /** True on iOS Safari before app is added to home screen */
  showIOSSafariGuide: boolean;
  /** Trigger PWA install prompt (mode === 'pwa-install') or open link (others) */
  triggerInstall: () => Promise<boolean>;
  /** Direct download URL for the current OS (for fallback anchor tags) */
  downloadLink: string;
  /** Human-readable CTA label */
  ctaLabel: string;
  /** Emoji/icon for the current mode */
  ctaIcon: string;
}

export function usePWADownload({ androidLink, iosLink }: UsePWADownloadOptions): UsePWADownloadResult {
  const os = useDeviceOS();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isPWAInstallable, setIsPWAInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // iOS: check standalone mode
    if (os === 'ios') {
      const alreadyInstalled = (window.navigator as any).standalone === true;
      setIsInstalled(alreadyInstalled);
      return;
    }

    const handlePrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsPWAInstallable(true);
    };
    const handleInstalled = () => {
      setIsInstalled(true);
      setIsPWAInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('appinstalled', handleInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, [os]);

  // Resolved mode: PWA install takes priority on Android/Desktop if available
  const mode: DownloadMode = (() => {
    if (isPWAInstallable && (os === 'android' || os === 'desktop')) return 'pwa-install';
    if (os === 'android') return 'android';
    if (os === 'ios')     return 'ios';
    if (os === 'desktop') return 'desktop';
    return 'unknown';
  })();

  // iOS: show safari guide if not yet installed
  const showIOSSafariGuide = os === 'ios' && !isInstalled;

  const downloadLink = os === 'ios' ? iosLink : androidLink;

  const { ctaLabel, ctaIcon } = (() => {
    switch (mode) {
      case 'pwa-install': return { ctaLabel: 'Cài đặt ứng dụng',  ctaIcon: '📲' };
      case 'android':     return { ctaLabel: 'Tải APK Android',    ctaIcon: '▶' };
      case 'ios':         return { ctaLabel: 'Tải cho iPhone/iPad', ctaIcon: '🍎' };
      case 'desktop':     return { ctaLabel: 'Quét QR để tải',     ctaIcon: '📱' };
      default:            return { ctaLabel: 'Tải ứng dụng',       ctaIcon: '📲' };
    }
  })();

  const triggerInstall = useCallback(async (): Promise<boolean> => {
    // PWA install path
    if (deferredPrompt && isPWAInstallable) {
      try {
        await deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        setDeferredPrompt(null);
        setIsPWAInstallable(false);
        return outcome === 'accepted';
      } catch {
        return false;
      }
    }
    // iOS: can't auto-install, caller shows guide
    if (os === 'ios') return false;
    // Android/Desktop without PWA prompt: navigate to link
    if (downloadLink && downloadLink !== '#') {
      window.location.href = downloadLink;
      return true;
    }
    return false;
  }, [deferredPrompt, isPWAInstallable, os, downloadLink]);

  return {
    os,
    mode,
    isPWAInstallable,
    isInstalled,
    showIOSSafariGuide,
    triggerInstall,
    downloadLink,
    ctaLabel,
    ctaIcon,
  };
}
