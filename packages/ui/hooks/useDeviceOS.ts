// @ts-nocheck
/**
 * useDeviceOS.ts — shared-ui
 * --------------------------
 * Detects the user's operating system from the browser's User Agent.
 *
 * Returns: 'android' | 'ios' | 'desktop' | 'unknown'
 * - 'unknown' is the initial SSR-safe state; resolves on first client render.
 *
 * Usage:
 *   import { useDeviceOS } from '@ui';
 *   const os = useDeviceOS(); // 'android' | 'ios' | 'desktop'
 *
 * NOTE: If running inside Capacitor, the UA-based detection still works correctly
 * because the WebView preserves the platform UA string. For fine-grained Capacitor
 * platform detection use useCapacitor() instead.
 */

import { useState, useEffect } from 'react';

export type DeviceOS = 'android' | 'ios' | 'desktop' | 'unknown';

export function useDeviceOS(): DeviceOS {
  const [os, setOs] = useState<DeviceOS>('unknown');

  useEffect(() => {
    const ua = (window.navigator.userAgent || window.navigator.vendor || '').toLowerCase();

    if (/android/.test(ua)) {
      setOs('android');
    } else if (/ipad|iphone|ipod/.test(ua) && !(window as any).MSStream) {
      setOs('ios');
    } else {
      setOs('desktop');
    }
  }, []);

  return os;
}
