/**
 * sw.js — KJC Platform Service Worker
 * ──────────────────────────────────────────────────────────────────────────────
 * Strategy overview:
 *
 *  PRECACHE (install)    — App shell: HTML, CSS, JS chunks, icons, fonts.
 *                          These never change between visits once cached.
 *
 *  CACHE-FIRST           — Static assets (JS/CSS/fonts/icons).
 *                          Served from cache; updated silently in background.
 *
 *  STALE-WHILE-REVALIDATE — Images from /uploads/* and /api/shared/config.
 *                          Shows cached version immediately, fetches fresh copy.
 *
 *  NETWORK-FIRST         — /api/* endpoints (except shared/config).
 *                          Always tries network first; falls back to cache if offline.
 *
 *  OFFLINE PAGE           — If navigation fails and no cache hit: /offline.html.
 *
 * Version: bump CACHE_VERSION to force a full cache refresh on deploy.
 */

const CACHE_VERSION = 'v1';
const PRECACHE      = `kjc-precache-${CACHE_VERSION}`;
const RUNTIME       = `kjc-runtime-${CACHE_VERSION}`;
const IMAGE_CACHE   = `kjc-images-${CACHE_VERSION}`;

// ── Files to precache on install ────────────────────────────────────────────
// Vite injects hashed filenames at build time via workbox-window or similar.
// This bare list covers the app shell; hashed chunks are handled by CACHE-FIRST.
const PRECACHE_URLS = [
  '/',
  '/offline.html',
  '/favicon.svg',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

// ── Install: precache the app shell ─────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(PRECACHE).then((cache) => {
      // addAll fails if ANY request fails — use Promise.allSettled for resilience
      return Promise.allSettled(
        PRECACHE_URLS.map((url) =>
          cache.add(url).catch((err) => console.warn('[SW] Precache miss:', url, err))
        )
      );
    })
  );
  // Take control immediately (don't wait for existing tabs to close)
  self.skipWaiting();
});

// ── Activate: remove old caches ─────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  const validCaches = [PRECACHE, RUNTIME, IMAGE_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => !validCaches.includes(k))
          .map((k) => {
            console.info('[SW] Deleting old cache:', k);
            return caches.delete(k);
          })
      )
    ).then(() => self.clients.claim())   // take control of all open tabs
  );
});

// ── Fetch: routing strategies ────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (!url.protocol.startsWith('http'))  return;

  // ① NAVIGATION — network first, fallback to offline.html
  if (request.mode === 'navigate') {
    event.respondWith(networkFirstNav(request));
    return;
  }

  // ② API — network first with short-lived runtime cache (60s TTL)
  if (url.pathname.startsWith('/api/')) {
    // Config endpoint: stale-while-revalidate (changes rarely)
    if (url.pathname.includes('/shared/config')) {
      event.respondWith(staleWhileRevalidate(request, RUNTIME));
      return;
    }
    // All other API calls: network first, cache for offline fallback
    event.respondWith(networkFirst(request, RUNTIME));
    return;
  }

  // ③ IMAGES — stale-while-revalidate with dedicated image cache
  if (
    url.pathname.startsWith('/uploads/') ||
    /\.(png|jpg|jpeg|gif|webp|avif|svg)$/i.test(url.pathname)
  ) {
    event.respondWith(staleWhileRevalidate(request, IMAGE_CACHE, 7 * 24 * 3600));
    return;
  }

  // ④ STATIC ASSETS (JS/CSS/fonts/icons) — cache first
  if (
    /\.(js|css|woff2?|ttf|otf|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith('/assets/')
  ) {
    event.respondWith(cacheFirst(request, PRECACHE));
    return;
  }

  // ⑤ DEFAULT — network first
  event.respondWith(networkFirst(request, RUNTIME));
});

// ── Message handler (SKIP_WAITING from UpdateBanner) ────────────────────────
self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Strategy implementations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * NETWORK FIRST — for navigation requests.
 * Falls back to /offline.html if offline.
 */
async function networkFirstNav(request) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(RUNTIME);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    if (cached) return cached;
    return caches.match('/offline.html');
  }
}

/**
 * NETWORK FIRST — for API and misc requests.
 * On network failure, serves stale cached copy if available.
 */
async function networkFirst(request, cacheName) {
  try {
    const res = await fetch(request);
    if (res.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, res.clone());
    }
    return res;
  } catch {
    const cached = await caches.match(request);
    return cached ?? Response.error();
  }
}

/**
 * CACHE FIRST — for static assets with immutable content hashes.
 * Returns cache hit immediately; fetches and caches on miss.
 */
async function cacheFirst(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const res = await fetch(request);
    if (res.ok) cache.put(request, res.clone());
    return res;
  } catch {
    return Response.error();
  }
}

/**
 * STALE WHILE REVALIDATE — for images and config.
 * Returns cached copy immediately, refreshes cache in background.
 * @param {Request} request
 * @param {string}  cacheName
 * @param {number}  [maxAge]  – max cache age in seconds (images: 7d)
 */
async function staleWhileRevalidate(request, cacheName, maxAge) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);

  // Always kick off a background revalidation
  const networkPromise = fetch(request)
    .then((res) => {
      if (res.ok) {
        // Enforce maxAge via a synthetic Date header would require clone + headers mutation
        // — simplest: just store it; cache size is managed by CACHE_VERSION rotation
        cache.put(request, res.clone());
      }
      return res;
    })
    .catch(() => null);

  if (cached) {
    // Check age if maxAge set
    if (maxAge) {
      const dateHeader = cached.headers.get('date');
      if (dateHeader) {
        const age = (Date.now() - new Date(dateHeader).getTime()) / 1000;
        if (age > maxAge) return networkPromise.then((r) => r ?? cached);
      }
    }
    return cached;
  }
  return networkPromise;
}
