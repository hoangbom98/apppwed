/**
 * useOfflineStorage.ts — shared-ui/hooks
 * -----------------------------------------
 * Lightweight IndexedDB wrapper for offline-first data persistence.
 * Provides a singleton `offlineDb` instance + React hook.
 *
 * Stores:
 *   cache   — arbitrary key/value cache (Network-first fallback)
 *   queue   — pending mutations to sync when back online
 *
 * Usage (direct):
 *   import { offlineDb } from '@ui/hooks/useOfflineStorage';
 *   await offlineDb.set('games', gamesArray);
 *   const cached = await offlineDb.get('games');
 *   await offlineDb.enqueue({ endpoint: '/api/...', method: 'POST', data: {} });
 *   await offlineDb.processQueue(fetchFn);
 *
 * Usage (hook):
 *   const { get, set, enqueue, processQueue } = useOfflineStorage();
 */

// ── IndexedDB open helper (no idb package) ────────────────────────────────────

const DB_NAME    = 'kjc_offline';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('cache')) {
        db.createObjectStore('cache', { keyPath: 'key' });
      }
      if (!db.objectStoreNames.contains('queue')) {
        const qs = db.createObjectStore('queue', { keyPath: 'id', autoIncrement: true });
        qs.createIndex('synced', 'synced', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

function tx(db: IDBDatabase, store: string, mode: IDBTransactionMode) {
  return db.transaction(store, mode).objectStore(store);
}

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((res, rej) => {
    req.onsuccess = () => res(req.result);
    req.onerror   = () => rej(req.error);
  });
}

// ── Offline queue item ────────────────────────────────────────────────────────

export interface QueueItem {
  id?:      number;
  endpoint: string;
  method:   string;
  data:     unknown;
  headers?: Record<string, string>;
  retries:  number;
  synced:   boolean;
  ts:       number;
}

// ── OfflineDB class ───────────────────────────────────────────────────────────

class OfflineDB {
  private _db: IDBDatabase | null = null;

  private async db(): Promise<IDBDatabase> {
    if (!this._db) this._db = await openDB();
    return this._db;
  }

  // ── Cache ──────────────────────────────────────────────────────────────────
  async set(key: string, value: unknown, ttlMs?: number): Promise<void> {
    const db = await this.db();
    await wrap(tx(db, 'cache', 'readwrite').put({ key, value, ts: Date.now(), ttl: ttlMs ?? 0 }));
  }

  async get<T = unknown>(key: string): Promise<T | null> {
    const db  = await this.db();
    const row = await wrap<any>(tx(db, 'cache', 'readonly').get(key));
    if (!row) return null;
    if (row.ttl && Date.now() - row.ts > row.ttl) {
      await this.del(key);
      return null;
    }
    return row.value as T;
  }

  async del(key: string): Promise<void> {
    const db = await this.db();
    await wrap(tx(db, 'cache', 'readwrite').delete(key));
  }

  async clear(): Promise<void> {
    const db = await this.db();
    await wrap(tx(db, 'cache', 'readwrite').clear());
  }

  // ── Mutation queue ────────────────────────────────────────────────────────
  async enqueue(item: Omit<QueueItem, 'id' | 'synced' | 'ts' | 'retries'>): Promise<void> {
    const db = await this.db();
    await wrap(tx(db, 'queue', 'readwrite').add({ ...item, synced: false, retries: 0, ts: Date.now() }));
  }

  async getPendingQueue(): Promise<QueueItem[]> {
    const db  = await this.db();
    const req = tx(db, 'queue', 'readonly').index('synced').getAll(IDBKeyRange.only(0));
    return wrap<QueueItem[]>(req as IDBRequest<QueueItem[]>);
  }

  async markSynced(id: number): Promise<void> {
    const db   = await this.db();
    const store = db.transaction('queue', 'readwrite').objectStore('queue');
    const row   = await wrap<QueueItem>(store.get(id));
    if (row) await wrap(store.put({ ...row, synced: true }));
  }

  async removeCompleted(): Promise<void> {
    const db    = await this.db();
    const store = tx(db, 'queue', 'readwrite');
    const all   = await wrap<QueueItem[]>(store.index('synced').getAll(IDBKeyRange.only(1)) as IDBRequest<QueueItem[]>);
    for (const item of all) {
      if (item.id !== undefined) await wrap(store.delete(item.id));
    }
  }

  /**
   * Replay the pending queue. Provide a fetch-compatible function.
   * On success: marks item as synced. On failure: increments retries.
   */
  async processQueue(fetchFn?: typeof fetch): Promise<{ ok: number; failed: number }> {
    const queue = await this.getPendingQueue();
    const f = fetchFn ?? globalThis.fetch.bind(globalThis);
    let ok = 0, failed = 0;

    for (const item of queue) {
      if (item.retries >= 3) { failed++; continue; }
      try {
        const res = await f(item.endpoint, {
          method:  item.method,
          headers: { 'Content-Type': 'application/json', ...item.headers },
          body:    item.data ? JSON.stringify(item.data) : undefined,
        });
        if (res.ok) { await this.markSynced(item.id!); ok++; }
        else {
          const db    = await this.db();
          const store = db.transaction('queue', 'readwrite').objectStore('queue');
          await wrap(store.put({ ...item, retries: item.retries + 1 }));
          failed++;
        }
      } catch {
        const db    = await this.db();
        const store = db.transaction('queue', 'readwrite').objectStore('queue');
        await wrap(store.put({ ...item, retries: item.retries + 1 }));
        failed++;
      }
    }
    await this.removeCompleted();
    return { ok, failed };
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const offlineDb = new OfflineDB();

// ── React hook ────────────────────────────────────────────────────────────────
import { useEffect } from 'react';

export function useOfflineStorage() {
  // Auto-sync queue when back online
  useEffect(() => {
    const onOnline = () => offlineDb.processQueue();
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, []);

  return {
    get:          <T = unknown>(key: string) => offlineDb.get<T>(key),
    set:          (key: string, value: unknown, ttlMs?: number) => offlineDb.set(key, value, ttlMs),
    del:          (key: string) => offlineDb.del(key),
    enqueue:      (item: Omit<QueueItem, 'id' | 'synced' | 'ts' | 'retries'>) => offlineDb.enqueue(item),
    processQueue: ()              => offlineDb.processQueue(),
  };
}
