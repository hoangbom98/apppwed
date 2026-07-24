// sports/src/utils/formatters.ts
// All formatters are canonical in shared-ui — re-exported here for backward compat.
// Import directly from '@ui' in new code.
export {
  formatDate,
  formatTime,
  formatDateTime,
  formatTime  as formatMatchTime, // sports alias
  formatScore,
  formatDuration,
  formatRelativeTime,
  formatVND,
  formatNumber,
  truncate,
  clamp,
} from '@ui';
