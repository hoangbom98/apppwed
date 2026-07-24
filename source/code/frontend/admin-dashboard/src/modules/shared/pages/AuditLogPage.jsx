// frontend/admin-dashboard/src/modules/shared/pages/AuditLogPage.jsx
// Route: /logs — Lịch sử hoạt động admin (audit trail)
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Select, DatePicker, Button, Typography, Tag, Flex, Space } from 'antd';
import { ClearOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ACTION_COLOR = {
  create:  'success',
  update:  'processing',
  delete:  'error',
  login:   'warning',
  approve: 'cyan',
  reject:  'orange',
};

function actionTag(action = '') {
  const key = Object.keys(ACTION_COLOR).find(k => action.toLowerCase().includes(k));
  return <Tag color={ACTION_COLOR[key] ?? 'default'}>{action || '—'}</Tag>;
}

export default function AuditLogPage() {
  const [page,   setPage]   = useState(1);
  const [module, setModule] = useState('');
  const [from,   setFrom]   = useState('');
  const [to,     setTo]     = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, module, from, to],
    queryFn:  () => api.get('/admin/logs/audit', {
      params: { page, limit: 25, module: module || undefined, from: from || undefined, to: to || undefined },
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const rows  = data?.data ?? data?.logs ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    {
      title: 'Thời gian', dataIndex: 'createdAt', key: 'time', width: 160,
      render: v => <Text type="secondary" className="text-[11px]">{new Date(v ?? v?.created_at).toLocaleString('vi')}</Text>,
    },
    {
      title: 'Admin', key: 'admin', width: 180,
      render: (_, r) => <Text className="text-xs">{r.admin?.email ?? r.adminId ?? '—'}</Text>,
    },
    {
      title: 'Hành động', dataIndex: 'action', key: 'action', width: 130,
      render: v => actionTag(v),
    },
    { title: 'Module', dataIndex: 'module', key: 'module', width: 100, render: v => <Text type="secondary" className="text-xs">{v ?? '—'}</Text> },
    {
      title: 'Chi tiết', dataIndex: 'details', key: 'details', ellipsis: true,
      render: v => <Text type="secondary" className="text-xs">{typeof v === 'object' ? JSON.stringify(v) : (v ?? '—')}</Text>,
    },
    { title: 'IP', dataIndex: 'ip', key: 'ip', width: 130, render: v => <Text type="secondary" className="font-mono text-[11px]">{v ?? '—'}</Text> },
  ];

  const hasFilter = !!(module || from || to);

  return (
    <div>
      <Title level={4} className="mb-4">Audit Logs</Title>
      <Text type="secondary" className="block mb-4 text-xs">Lịch sử toàn bộ thao tác của admin trên hệ thống</Text>

      <Flex gap={12} wrap="wrap" align="flex-end" className="mb-4">
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Module</Text>
          <Select size="small" className="w-[140px]" value={module} onChange={v => { setModule(v); setPage(1); }}
            options={[{ label: 'Tất cả', value: '' }, ...['auth','user','finance','game','dating','sports','trade','hub','settings','risk'].map(m => ({ label: m, value: m }))]}
          />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Từ ngày</Text>
          <DatePicker size="small" value={from ? dayjs(from) : null} onChange={d => { setFrom(d?.format('YYYY-MM-DD') ?? ''); setPage(1); }} className="w-[130px]" />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Đến ngày</Text>
          <DatePicker size="small" value={to ? dayjs(to) : null} onChange={d => { setTo(d?.format('YYYY-MM-DD') ?? ''); setPage(1); }} className="w-[130px]" />
        </div>
        {hasFilter && (
          <Button size="small" icon={<ClearOutlined />} onClick={() => { setModule(''); setFrom(''); setTo(''); setPage(1); }}>Xoá lọc</Button>
        )}
      </Flex>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 900 }}
        pagination={{ current: page, pageSize: 25, total, showSizeChanger: false, showTotal: t => `${t} bản ghi`, onChange: p => setPage(p) }}
      />
    </div>
  );
}
