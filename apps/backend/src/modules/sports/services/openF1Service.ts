// @ts-nocheck
'use strict';
/**
 * OpenF1Service — dữ liệu F1 realtime từ OpenF1 API.
 *
 * https://openf1.org — hoàn toàn miễn phí, không cần API key.
 * Cung cấp: session info, lap times, driver positions, car telemetry.
 *
 * Sử dụng trong Sports để hiển thị F1 live race.
 *
 * Sử dụng:
 *   const f1 = require('./openF1Service');
 *   const session = await f1.getLatestSession();
 *   const positions = await f1.getDriverPositions(session.session_key);
 *   const laps = await f1.getLatestLaps(session.session_key, driverNumber);
 */
const https  = require('https');
const logger = require('../../../shared/services/logger');
const cache  = require('../../../shared/services/cacheService');

const BASE_URL  = 'https://api.openf1.org/v1';
const CACHE_TTL_LIVE    = 30;          // 30s for live data
const CACHE_TTL_STATIC  = 60 * 60;    // 1h for static session info

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: 'application/json' }, timeout: 6000 }, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve([]); } });
    });
    req.on('error', (e) => { logger.warn(`[OpenF1] ${e.message}`); resolve([]); });
    req.on('timeout', () => { req.destroy(); resolve([]); });
  });
}

/**
 * Lấy session mới nhất (race, qualifying, practice).
 * @returns {Promise<object|null>}
 */
async function getLatestSession() {
  const cacheKey = 'f1:latest_session';
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const data = await getJson(`${BASE_URL}/sessions?session_type=Race&_limit=1`);
    const session = Array.isArray(data) ? data[data.length - 1] : null;
    if (session) {
      await cache.set(cacheKey, session, CACHE_TTL_STATIC).catch(() => {});
    }
    return session;
  } catch (err) {
    logger.warn(`[OpenF1] getLatestSession: ${err.message}`);
    return null;
  }
}

/**
 * Lấy vị trí các tay đua trong session.
 * @param {number} sessionKey
 * @returns {Promise<Array>}
 */
async function getDriverPositions(sessionKey) {
  if (!sessionKey) return [];
  const cacheKey = `f1:positions:${sessionKey}`;
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const data = await getJson(`${BASE_URL}/position?session_key=${sessionKey}&_limit=20`);
    const positions = Array.isArray(data) ? data : [];

    // Deduplicate: lấy vị trí mới nhất của mỗi driver
    const latestByDriver = {};
    for (const p of positions) {
      const dn = p.driver_number;
      if (!latestByDriver[dn] || new Date(p.date) > new Date(latestByDriver[dn].date)) {
        latestByDriver[dn] = p;
      }
    }
    const result = Object.values(latestByDriver).sort((a, b) => a.position - b.position);
    await cache.set(cacheKey, result, CACHE_TTL_LIVE).catch(() => {});
    return result;
  } catch (err) {
    logger.warn(`[OpenF1] getDriverPositions: ${err.message}`);
    return [];
  }
}

/**
 * Lấy danh sách drivers trong session.
 * @param {number} sessionKey
 * @returns {Promise<Array>}
 */
async function getDrivers(sessionKey) {
  if (!sessionKey) return [];
  const cacheKey = `f1:drivers:${sessionKey}`;
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const data = await getJson(`${BASE_URL}/drivers?session_key=${sessionKey}`);
    const drivers = Array.isArray(data) ? data : [];
    await cache.set(cacheKey, drivers, CACHE_TTL_STATIC).catch(() => {});
    return drivers;
  } catch (err) {
    logger.warn(`[OpenF1] getDrivers: ${err.message}`);
    return [];
  }
}

/**
 * Lấy lap times mới nhất của một driver.
 * @param {number} sessionKey
 * @param {number} driverNumber
 * @returns {Promise<Array>}
 */
async function getLatestLaps(sessionKey, driverNumber) {
  if (!sessionKey || !driverNumber) return [];
  const cacheKey = `f1:laps:${sessionKey}:${driverNumber}`;
  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const url  = `${BASE_URL}/laps?session_key=${sessionKey}&driver_number=${driverNumber}&_limit=5`;
    const data = await getJson(url);
    const laps = Array.isArray(data) ? data.slice(-5) : [];
    await cache.set(cacheKey, laps, CACHE_TTL_LIVE).catch(() => {});
    return laps;
  } catch (err) {
    logger.warn(`[OpenF1] getLatestLaps: ${err.message}`);
    return [];
  }
}

module.exports = { getLatestSession, getDriverPositions, getDrivers, getLatestLaps };
