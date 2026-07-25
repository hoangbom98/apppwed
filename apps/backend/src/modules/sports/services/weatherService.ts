// @ts-nocheck
'use strict';
/**
 * WeatherService — thời tiết sân vận động qua Open-Meteo.
 *
 * Open-Meteo: https://open-meteo.com — hoàn toàn miễn phí, không cần key.
 * Trả về nhiệt độ, gió, mây, mã thời tiết WMO.
 *
 * Kết quả cache 30 phút (thời tiết không thay đổi nhanh).
 *
 * Sử dụng:
 *   const weather = require('./weatherService');
 *   const w = await weather.getStadiumWeather({ lat: 10.762622, lon: 106.660172 });
 *   // → { temperature: 32, windspeed: 12, weatherCode: 2, description: 'Có mây' }
 */
const https  = require('https');
const logger = require('../../../shared/services/logger');
const cache  = require('../../../shared/services/cacheService');

const CACHE_TTL = 30 * 60; // 30 minutes

// WMO Weather Code → mô tả tiếng Việt
const WMO_DESCRIPTION = {
  0:  'Trời quang',
  1:  'Chủ yếu quang',
  2:  'Có mây',
  3:  'U ám',
  45: 'Sương mù',
  48: 'Sương mù đóng băng',
  51: 'Mưa phùn nhẹ',
  53: 'Mưa phùn vừa',
  55: 'Mưa phùn dày',
  61: 'Mưa nhẹ',
  63: 'Mưa vừa',
  65: 'Mưa to',
  71: 'Tuyết nhẹ',
  73: 'Tuyết vừa',
  75: 'Tuyết nặng',
  80: 'Mưa rào nhẹ',
  81: 'Mưa rào vừa',
  82: 'Mưa rào to',
  95: 'Dông',
  96: 'Dông kèm mưa đá nhẹ',
  99: 'Dông kèm mưa đá nặng',
};

function getJson(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { Accept: 'application/json' }, timeout: 5000 }, (res) => {
      let raw = '';
      res.on('data', (c) => raw += c);
      res.on('end', () => { try { resolve(JSON.parse(raw)); } catch { resolve(null); } });
    });
    req.on('error', reject);
    req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
  });
}

/**
 * Lấy thời tiết hiện tại theo tọa độ sân vận động.
 * @param {{ lat: number, lon: number, stadiumName?: string }} opts
 */
async function getStadiumWeather({ lat, lon, stadiumName = '' }) {
  if (!lat || !lon) return null;

  // Round to 2 decimal places for cache key (≈1km precision)
  const latR = Math.round(lat * 100) / 100;
  const lonR = Math.round(lon * 100) / 100;
  const cacheKey = `weather:${latR}:${lonR}`;

  const cached = await cache.get(cacheKey).catch(() => null);
  if (cached) return cached;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
                `&current_weather=true&hourly=relativehumidity_2m,apparent_temperature` +
                `&timezone=auto&forecast_days=1`;

    const data = await getJson(url);
    if (!data?.current_weather) return null;

    const cw = data.current_weather;
    const result = {
      temperature:   cw.temperature,
      windspeed:     cw.windspeed,
      winddirection: cw.winddirection,
      weatherCode:   cw.weathercode,
      description:   WMO_DESCRIPTION[cw.weathercode] || 'Không rõ',
      isDay:         cw.is_day === 1,
      stadiumName,
      lat,
      lon,
      updatedAt:     new Date().toISOString(),
    };

    await cache.set(cacheKey, result, CACHE_TTL).catch(() => {});
    logger.debug(`[Weather] ${stadiumName || `${lat},${lon}`}: ${result.description} ${result.temperature}°C`);
    return result;
  } catch (err) {
    logger.warn(`[Weather] Open-Meteo failed: ${err.message}`);
    return null;
  }
}

module.exports = { getStadiumWeather };
