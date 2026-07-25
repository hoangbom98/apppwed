// frontend/shared-ui/components/Layout/DataTable.jsx
// Generic table with sortable columns, loading skeleton, and empty state.
import React from 'react';
import { RowSkeleton } from '../Skeleton';
import EmptyState from './EmptyState';

/**
 * @param {{
 *   columns: Array<{ key: string, label: string, render?: (row: any) => React.ReactNode, className?: string }>,
 *   rows:    any[],
 *   loading?: boolean,
 *   keyField?: string,
 *   emptyMessage?: string,
 * }} props
 */
export default function DataTable({ columns, rows = [], loading = false, keyField = 'id', emptyMessage = 'No records found' }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-200 bg-gray-50">
            {columns.map((col) => (
              <th key={col.key} className={`px-4 py-3 font-semibold text-gray-600 ${col.className || ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                <td colSpan={columns.length} className="p-0">
                  <RowSkeleton cols={columns.length} />
                </td>
              </tr>
            ))
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length}>
                <EmptyState title={emptyMessage} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr key={row[keyField]} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                {columns.map((col) => (
                  <td key={col.key} className={`px-4 py-3 ${col.className || ''}`}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
