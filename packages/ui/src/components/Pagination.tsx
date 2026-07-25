// @ts-nocheck
// packages/shared-ui/src/components/Pagination.tsx
// Thin wrapper that also accepts page/totalPages props (custom pattern used by hub)
import React from 'react';
import { Pagination as AntPagination } from 'antd';
import type { PaginationProps as AntPaginationProps } from 'antd';

export interface PaginationProps extends Omit<AntPaginationProps, 'current' | 'total' | 'onChange'> {
  // Standard antd props
  current?:       number;
  total?:         number;
  onChange?:      (page: number, pageSize?: number) => void;
  // Custom hub-pattern shortcuts
  page?:          number;
  totalPages?:    number;
  onPageChange?:  (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  page, totalPages, onPageChange, current, total, onChange, ...rest
}) => (
  <AntPagination
    current={current ?? page ?? 1}
    total={total ?? ((totalPages ?? 1) * (rest.pageSize ?? 10))}
    onChange={onChange ?? onPageChange}
    showSizeChanger={false}
    {...rest}
  />
);

export { Pagination };
export default Pagination;
