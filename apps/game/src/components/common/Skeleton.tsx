// @ts-nocheck
export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`shimmer-bg rounded ${className}`} />
);

export const GameCardSkeleton: React.FC = () => (
  <div className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow">
    <Skeleton className="w-full h-36" />
    <div className="p-3 space-y-2">
      <Skeleton className="h-3 w-3/4" />
      <Skeleton className="h-2.5 w-1/2" />
    </div>
  </div>
);

export const TableRowSkeleton: React.FC<{ cols?: number }> = ({ cols = 4 }) => (
  <tr>
    {Array.from({ length: cols }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <Skeleton className="h-4 w-full rounded" />
      </td>
    ))}
  </tr>
);

export default Skeleton;
