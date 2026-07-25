// @ts-nocheck
// packages/shared-ui/src/hooks/useDeviceOS.ts
import { useMemo } from 'react';

export type DeviceOS = 'ios' | 'android' | 'windows' | 'macos' | 'other' | 'unknown';

export function useDeviceOS(): DeviceOS {
  return useMemo(() => {
    const ua = navigator.userAgent;
    if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
    if (/android/i.test(ua))           return 'android';
    if (/windows/i.test(ua))           return 'windows';
    if (/mac os/i.test(ua))            return 'macos';
    return 'other';
  }, []);
}
