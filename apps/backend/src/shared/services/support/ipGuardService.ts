// @ts-nocheck
'use strict';
/**
 * IpGuardService — tích hợp AbuseIPDB + ipapi.co
 *
 * AbuseIPDB  : kiểm tra IP độc hại (bot, VPN, spam) — 1000 req/ngày free
 * ipapi.co   : geo-location từ IP (country, city, timezone) — 1000 req/ngày free
 *
 * Cả hai kết quả đều được Redis-cache để tránh hết quota.
 * TTL cache: 6h (AbuseIPDB) / 24h (ipapi.co — geo ít thay đổi)
 *
 * Sử dụng:
 *   const ipGuard = require('./ipGuardService');
 *
 *   // Trong auth middleware:
 *   const check = await ipGuard.checkIp(req.ip);
 *   if (check.blocked) return res.status(403).json({ error: check.reason });
 *
 *   // Geo analytics:
 *   const geo = await ipGuard.getGeo(req.ip);
 *   // → { country: 'VN', city: 'Ho Chi Minh City', timezone: 'Asia/Ho_Chi_Minh', ... }
 */
const https  = require('https');
const logger = require('../logger');
const cache  = require('../cacheService');

const ABUSEIPDB_KEY       = process.env.ABUSEIPDB_API_KEY || '';
const ABUSEIPDB_THRESHOLD = parseInt(process.env.ABUSEIPDB_THRESHOLD || '50', 10); // block if score ≥ threshold
const CACHE_TTL_ABUSE     = 6 * 60 * 60;   // 6 hours
const CACHE_TTL_GEO       = 24 * 60 * 60;  // 24 hours

// Private IPs and loopback — never need to check
const PRIVATE_RANGES = /^(127\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::1$|localhost)/;

// ── HTTP GET helper ───────────────────────────────────────────────────────────
function getJson(url, headers = {}) {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const opts = {
      hostname: parsed.hostname,
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { 'Accept': 'application/json', ...headers },
      timeout:  4000,
    };
    const req = https.request(opts, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => {
        try { resolve(JSON.parse(raw)); }
        catch { resolve(null); }
      });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
    req.end();
  });
}

// ── AbuseIPDB check ───────────────────────────────────────────────────────────
/**
 * Check an IP address against AbuseIPDB.
 * Returns { blocked: boolean, score: number, reason: string, country: string }
 * Falls back gracefully if key is missing or API is down.
 */
async function checkIp(ip) {
  if (!ip || PRIVATE_RANGES.test(ip)) {
    return { blocked: false, score: 0, reason: 'private_ip' };
  }

  const cacheKey = `abuseipdb:${ip}`;
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  // Default safe result if key not configured
  if (!ABUSEIPDB_KEY) {
    return { blocked: false, score: 0, reason: 'no_key' };
  }

  try {
    const url  = `https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`;
    const data = await getJson(url, { Key: ABUSEIPDB_KEY });
    const d    = data?.data;

    if (!d) return { blocked: false, score: 0, reason: 'api_error' };

    const result = {
      blocked:  d.abuseConfidenceScore >= ABUSEIPDB_THRESHOLD,
      score:    d.abuseConfidenceScore,
      country:  d.countryCode,
      isp:      d.isp,
      isVpn:    d.isPublic && d.usageType === 'VPN Service',
      reason:   d.abuseConfidenceScore >= ABUSEIPDB_THRESHOLD
                  ? `IP flagged (score=${d.abuseConfidenceScore})`
                  : 'clean',
    };

    await cache.set(cacheKey, result, CACHE_TTL_ABUSE).catch(() => {});
    return result;
  } catch (err) {
    logger.warn(`[IpGuard] AbuseIPDB check failed for ${ip}: ${err.message}`);
    return { blocked: false, score: 0, reason: 'api_unavailable' };
  }
}

// ── ipapi.co — Geo-location ───────────────────────────────────────────────────
/**
 * Get geographic location for an IP.
 * Returns { country, countryCode, city, region, timezone, org, currency }
 * No API key required for 1000 req/day.
 */
async function getGeo(ip) {
  if (!ip || PRIVATE_RANGES.test(ip)) {
    return { countryCode: 'VN', city: 'Local', timezone: 'Asia/Ho_Chi_Minh' };
  }

  const cacheKey = `geoip:${ip}`;
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const data = await getJson(`https://ipapi.co/${encodeURIComponent(ip)}/json/`);
    if (!data || data.error) return { countryCode: 'Unknown', city: 'Unknown' };

    const result = {
      countryCode: data.country_code,
      country:     data.country_name,
      city:        data.city,
      region:      data.region,
      timezone:    data.timezone,
      org:         data.org,
      currency:    data.currency,
      latitude:    data.latitude,
      longitude:   data.longitude,
    };

    await cache.set(cacheKey, result, CACHE_TTL_GEO).catch(() => {});
    return result;
  } catch (err) {
    logger.warn(`[IpGuard] ipapi.co geo failed for ${ip}: ${err.message}`);
    return { countryCode: 'Unknown', city: 'Unknown' };
  }
}

module.exports = { checkIp, getGeo };
