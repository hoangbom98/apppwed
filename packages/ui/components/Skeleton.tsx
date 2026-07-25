// @ts-nocheck
// frontend/shared-ui/components/Skeleton.jsx
import React from 'react';

// ── Base keyframe injected once ────────────────────────────────────────────────
const SHIMMER_STYLE = `
@keyframes lkvip-shimmer {
  0%   { background-position: -200% 0; }
  100% { background-position:  200% 0; }
}
.lkvip-skeleton {
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 37%, #f0f0f0 63%);
  background-size: 400% 100%;
  animation: lkvip-shimmer 1.4s ease infinite;
  /* GPU-accelerated — only transform/opacity on animations */
  will-change: background-position;
  backface-visibility: hidden;
}
.dark .lkvip-skeleton {
  background: linear-gradient(90deg, #1e293b 25%, #334155 37%, #1e293b 63%);
  background-size: 400% 100%;
}
`;

let injected = false;
function injectStyles() {
  if (injected || typeof document === 'undefined') return;
  injected = true;
  const el = document.createElement('style');
  el.textContent = SHIMMER_STYLE;
  document.head.appendChild(el);
}

// ── Primitive ──────────────────────────────────────────────────────────────────
/**
 * Base shimmer placeholder.
 * @param {{ className?: string, rounded?: boolean, style?: object }} props
 */
export function Skeleton({ className = 'h-4 w-full', rounded = false, style = {} }) {
  injectStyles();
  return (
    <div
      className={`lkvip-skeleton ${rounded ? 'rounded-full' : 'rounded'} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

// ── Compositions ───────────────────────────────────────────────────────────────

/** Card skeleton — thumbnail + 3 text lines */
export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <Skeleton className="h-40 w-full rounded-none" />
      <div className="p-4 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

/** Row skeleton for tables / lists */
export function RowSkeleton({ cols = 4 }) {
  return (
    <div className="flex gap-4 px-4 py-3 border-b border-gray-100 dark:border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} className={`h-4 flex-1 ${i === 0 ? 'max-w-[2rem]' : ''}`} />
      ))}
    </div>
  );
}

/**
 * Game card skeleton — square thumbnail + RTP badge + 2 lines.
 * Matches the typical 2-col game grid.
 */
export function GameCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 dark:border-gray-700">
      <Skeleton className="h-32 w-full rounded-none" />
      <div className="p-3 space-y-1.5">
        <Skeleton className="h-4 w-4/5" />
        <div className="flex gap-2">
          <Skeleton className="h-3 w-12 rounded-full" />
          <Skeleton className="h-3 w-10 rounded-full" />
        </div>
      </div>
    </div>
  );
}

/**
 * List item skeleton — avatar + 2 text lines + action.
 * For feed, match list, news list, etc.
 */
export function ListItemSkeleton() {
  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <Skeleton className="w-12 h-12 flex-shrink-0" rounded />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <Skeleton className="h-8 w-16 rounded-full flex-shrink-0" />
    </div>
  );
}

/**
 * Avatar skeleton — circular placeholder.
 */
export function AvatarSkeleton({ size = 40 }) {
  return (
    <Skeleton
      rounded
      style={{ width: size, height: size, flexShrink: 0 }}
    />
  );
}

export default Skeleton;
