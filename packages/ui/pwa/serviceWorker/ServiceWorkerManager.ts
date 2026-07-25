// @ts-nocheck
/**
 * ServiceWorkerManager — singleton that handles SW lifecycle for all three apps.
 *
 * Usage:
 *   import { ServiceWorkerManager } from '@ui/pwa/serviceWorker';
 *   ServiceWorkerManager.getInstance().register('/sw.js');
 */

export class ServiceWorkerManager {
  private static _instance: ServiceWorkerManager | null = null;
  private reg: ServiceWorkerRegistration | null = null;
  private registered = false;

  /** Singleton accessor */
  static getInstance(): ServiceWorkerManager {
    if (!ServiceWorkerManager._instance) {
      ServiceWorkerManager._instance = new ServiceWorkerManager();
    }
    return ServiceWorkerManager._instance;
  }

  /** Register the service worker at the given path (default: /sw.js) */
  async register(swPath = '/sw.js'): Promise<boolean> {
    if (!('serviceWorker' in navigator)) {
      console.warn('[SW] Not supported in this browser');
      return false;
    }
    if (this.registered) return true;

    try {
      const registration = await navigator.serviceWorker.register(swPath, { scope: '/' });
      this.reg        = registration;
      this.registered = true;

      console.info('[SW] Registered, scope:', registration.scope);

      // Notify UI when a new version is waiting
      registration.addEventListener('updatefound', () => {
        const next = registration.installing;
        if (!next) return;
        next.addEventListener('statechange', () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller) {
            document.dispatchEvent(
              new CustomEvent('sw:update-available', {
                detail: { message: 'Có phiên bản mới, nhấn để cập nhật!' },
              })
            );
          }
        });
      });

      return true;
    } catch (err) {
      console.error('[SW] Registration failed:', err);
      return false;
    }
  }

  /** Trigger background update check */
  async checkUpdate(): Promise<void> {
    await this.reg?.update();
  }

  /** Tell the waiting SW to skip waiting and take over */
  skipWaiting(): void {
    this.reg?.waiting?.postMessage({ type: 'SKIP_WAITING' });
  }

  /** Clear all caches */
  async clearCache(): Promise<boolean> {
    if (!('caches' in window)) return false;
    const keys = await caches.keys();
    await Promise.all(keys.map((k) => caches.delete(k)));
    return true;
  }

  getStatus() {
    return {
      isSupported:   'serviceWorker' in navigator,
      isRegistered:  this.registered,
      hasController: !!navigator.serviceWorker?.controller,
    };
  }
}
