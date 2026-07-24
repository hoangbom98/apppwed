// frontend/admin-dashboard/src/modules/shared/components/Skeleton.tsx
// Lightweight shimmer skeleton for loading states.

/** Single shimmer bar */
export function SkeletonBar({ className = '' }: { className?: string }) {
  return (
    <div className={`bg-gray-700 rounded animate-pulse ${className}`} />
  );
}

/** Stat card skeleton — matches Dashboard card size */
export function SkeletonCard() {
  return (
    <div className="bg-gray-800 rounded-xl p-5 border border-gray-700 space-y-3">
      <SkeletonBar className="w-10 h-10 rounded-lg" />
      <SkeletonBar className="h-7 w-16" />
      <SkeletonBar className="h-3 w-28" />
    </div>
  );
}

/** Table row skeleton */
export function SkeletonRow({ cols = 5 }: { cols?: number }) {
  return (
    <tr className="border-t border-gray-800">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <SkeletonBar className="h-4 w-full rounded" />
        </td>
      ))}
    </tr>
  );
}

/** Full table loading state */
export function SkeletonTable({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <SkeletonRow key={i} cols={cols} />
      ))}
    </>
  );
}
