// trade/src/utils/formatters.ts
// All formatters are canonical in shared-ui — re-exported here for backward compat.
// Import directly from '@ui' in new code.
export {
  formatDecimal as fmt,       // trade alias: fmt(n, decimals)
  fmtPct,                     // "+2.50%"
  fmtVol,                     // "1.5M", "3.2B"
  formatTime  as fmtTime,     // "14:30"
  formatDate,
  formatDateTime,
  formatVND,
  formatNumber,
  truncate,
  clamp,
} from '@ui';
