// @ts-nocheck
import React from 'react';
import { Table, TableProps } from 'antd';

export const ProTable = <T extends object>(props: TableProps<T>) => (
  <Table
    {...props}
    pagination={{ pageSize: 20, showSizeChanger: true }}
    bordered
    size="middle"
  />
);
