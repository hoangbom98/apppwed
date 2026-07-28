/**
 * apps/admin-dashboard/src/lib/apiFactory.ts
 *
 * Factory functions để tạo API objects chuẩn — loại bỏ lặp lại trong mỗi module api.ts.
 *
 * Quy ước:
 *   resource(path)      → { list, get, create, update, remove }       full CRUD
 *   readResource(path)  → { list, get }                               read-only
 *   financeResource(prefix) → { list, get, approve, reject }          finance approval
 *
 * Usage trong module api.ts:
 *   import { resource, readResource, financeResource } from '@/lib/apiFactory';
 *
 *   export const adminLeagues  = resource('/sports/admin/leagues');
 *   export const adminDeposits = financeResource('/game/admin/deposits');
 */
import client from '@admin/api/client';

type Params = Record<string, any>;
type Body   = Record<string, any>;

// ── Full CRUD resource ────────────────────────────────────────────────────────
export function resource(path: string) {
  return {
    list:   (params?: Params)       => client.get(path,              { params }),
    get:    (id: string)            => client.get(`${path}/${id}`),
    create: (body: Body)            => client.post(path,              body),
    update: (id: string, b: Body)   => client.put(`${path}/${id}`,   b),
    patch:  (id: string, b: Body)   => client.patch(`${path}/${id}`, b),
    remove: (id: string)            => client.delete(`${path}/${id}`),
  };
}

// ── Read-only resource ────────────────────────────────────────────────────────
export function readResource(path: string) {
  return {
    list: (params?: Params) => client.get(path,            { params }),
    get:  (id: string)      => client.get(`${path}/${id}`),
  };
}

// ── Finance approval resource (deposits / withdrawals) ────────────────────────
export function financeResource(path: string) {
  return {
    list:    (params?: Params)              => client.get(path, { params }),
    get:     (id: string)                  => client.get(`${path}/${id}`),
    approve: (id: string, b?: Body)        => client.put(`${path}/${id}/approve`, b ?? {}),
    reject:  (id: string, body?: Body)     => client.put(`${path}/${id}/reject`,  body ?? {}),
  };
}

// ── Stats shortcut (with fallback) ────────────────────────────────────────────
export function statsResource(primary: string, fallback = '/admin/stats') {
  return () =>
    client.get(primary)
      .catch(() => client.get(fallback))
      .then((r: any) => r.data?.data ?? r.data);
}
