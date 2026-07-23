/**
 * AgentTree.tsx — Agent network tree visualization
 * Shows downline hierarchy up to depth 3
 */
import { useQuery } from '@tanstack/react-query';
import { ChevronDown, ChevronRight, Network } from 'lucide-react';
import { useState } from 'react';
import { getAgentTree } from '@/api/apiDaiLy';
import { Skeleton } from '@/components/common/Skeleton';
import { formatVND } from '@/utils/dinhDang';

function TreeNode({ node, depth = 0 }: { node: any; depth?: number }) {
  const [expanded, setExpanded] = useState(depth < 1);
  const hasChildren = node.children?.length > 0;

  return (
    <div className={`${depth > 0 ? 'ml-5 border-l-2 border-gray-200 dark:border-gray-700 pl-3' : ''}`}>
      <div
        className={`flex items-center gap-3 p-3 rounded-xl mb-2 cursor-pointer select-none ${
          depth === 0
            ? 'bg-accent/5 border border-accent/20'
            : depth === 1
            ? 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
            : 'bg-white dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700/50'
        }`}
        onClick={() => hasChildren && setExpanded(e => !e)}
      >
        {/* Avatar */}
        <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-black text-sm shrink-0 ${
          depth === 0 ? 'bg-accent' : depth === 1 ? 'bg-secondary' : 'bg-gray-400'
        }`}>
          {(node.username ?? '?')[0].toUpperCase()}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-bold text-gray-900 dark:text-white text-sm truncate">{node.username}</p>
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
              depth === 0 ? 'bg-accent/20 text-accent' : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
            }`}>
              Lv.{node.level}
            </span>
          </div>
          <p className="text-[10px] text-gray-400">
            Hoa hồng: {formatVND(Number(node.totalCommission ?? 0))} ·
            Nạp: {formatVND(Number(node.totalDeposit ?? 0))}
          </p>
        </div>

        {hasChildren && (
          <div className="shrink-0 text-gray-400">
            {expanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </div>
        )}
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children.map((child: any) => (
            <TreeNode key={child.agentId} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function AgentTree() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['agent-tree'],
    queryFn:  getAgentTree,
  });

  return (
    <div className="max-w-lg mx-auto space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center">
          <Network className="w-5 h-5 text-secondary" />
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">Mạng lưới đại lý</h1>
          <p className="text-xs text-gray-500">Hiển thị tối đa 3 cấp</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}
        </div>
      ) : error || !data ? (
        <div className="text-center py-16 text-gray-400">
          <Network className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">Bạn chưa có mạng lưới đại lý</p>
        </div>
      ) : (data.tree ?? []).length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Network className="w-12 h-12 mx-auto mb-3 text-gray-200" />
          <p className="text-sm">Chưa có đại lý cấp dưới</p>
        </div>
      ) : (
        <div>
          {(data.tree as any[]).map((node: any) => (
            <TreeNode key={node.agentId} node={node} depth={0} />
          ))}
        </div>
      )}
    </div>
  );
}
