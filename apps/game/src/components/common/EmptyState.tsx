// @ts-nocheck
import React from 'react';
import { InboxIcon } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = 'Không có dữ liệu',
  description,
  action,
  icon,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="mb-4 text-gray-300 dark:text-gray-600">
      {icon || <InboxIcon className="w-16 h-16" />}
    </div>
    <p className="text-base font-semibold text-gray-500 dark:text-gray-400">{title}</p>
    {description && <p className="mt-1 text-sm text-gray-400 dark:text-gray-500 max-w-xs">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

// Named export for convenience
export { EmptyState };
export default EmptyState;
