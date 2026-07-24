/**
 * useCapacitor.ts
 * Hook tiện ích để detect môi trường Capacitor (Native App vs Web)
 * và expose các Capacitor APIs phổ biến.
 *
 * Đặt tại: frontend/shared-ui/hooks/useCapacitor.ts
 * Import: import { useCapacitor } from '@ui/hooks/useCapacitor'
 */

import { useEffect, useState, useCallback } from 'react';

// ─── Type stubs (sẽ resolve khi @capacitor/* được cài) ────────────────────────
type NetworkStatus = { connected: boolean; connectionType: string };
type CapApp        = { addListener: (event: string, cb: () => void) => Promise<{ remove: () => void }> };

// ─── Runtime detection ────────────────────────────────────────────────────────
function getCapacitor(): any {
  return typeof window !== 'undefined' ? (window as any).Capacitor : null;
}

export function isNativeApp(): boolean {
  const cap = getCapacitor();
  return !!cap && cap.isNativePlatform();
}

export function getPlatform(): 'android' | 'ios' | 'web' {
  const cap = getCapacitor();
  if (!cap || !cap.isNativePlatform()) return 'web';
  return cap.getPlatform() as 'android' | 'ios';
}

// ─── Main hook ────────────────────────────────────────────────────────────────
export function useCapacitor() {
  const [isNative]      = useState<boolean>(isNativeApp);
  const [platform]      = useState<'android' | 'ios' | 'web'>(getPlatform);
  const [isOnline, setIsOnline]   = useState(true);
  const [backButtonListeners]     = useState<Array<() => void>>([]);

  // Network status monitoring
  useEffect(() => {
    if (!isNative) return;

    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const { Network } = await import('@capacitor/network');
        const status: NetworkStatus = await Network.getStatus();
        setIsOnline(status.connected);

        const listener = await Network.addListener('networkStatusChange', (s: NetworkStatus) => {
          setIsOnline(s.connected);
        });
        cleanup = () => listener.remove();
      } catch {
        // @capacitor/network không được cài — bỏ qua
      }
    })();

    return () => { cleanup?.(); };
  }, [isNative]);

  // Android hardware back button
  const addBackButtonListener = useCallback((cb: () => void) => {
    if (!isNative || platform !== 'android') return () => {};

    let cleanup: (() => void) | null = null;

    (async () => {
      try {
        const { App } = await import('@capacitor/app') as { App: CapApp };
        const listener = await App.addListener('backButton', cb);
        cleanup = () => listener.remove();
      } catch {
        // ignore
      }
    })();

    backButtonListeners.push(cb);
    return () => { cleanup?.(); };
  }, [isNative, platform, backButtonListeners]);

  // Haptic feedback
  const hapticLight = useCallback(async () => {
    if (!isNative) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch { /* ignore */ }
  }, [isNative]);

  const hapticMedium = useCallback(async () => {
    if (!isNative) return;
    try {
      const { Haptics, ImpactStyle } = await import('@capacitor/haptics');
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch { /* ignore */ }
  }, [isNative]);

  // Status bar control
  const setStatusBarDark = useCallback(async () => {
    if (!isNative) return;
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setStyle({ style: Style.Dark });
    } catch { /* ignore */ }
  }, [isNative]);

  return {
    isNative,
    platform,
    isOnline,
    isAndroid:  platform === 'android',
    isIos:      platform === 'ios',
    isWeb:      platform === 'web',
    addBackButtonListener,
    hapticLight,
    hapticMedium,
    setStatusBarDark,
  };
}
