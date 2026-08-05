// Route: /logs — Lịch sử hoạt động admin (audit trail)
// Upgraded: user filter, action type pills, expandable details row
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Table, Select, DatePicker, Button, Typography, Tag, Flex, Space, Input } from 'antd';
import { ClearOutlined, SearchOutlined, ExpandOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const ACTION_COLOR = {
  create:  'success',
  update:  'processing',
  delete:  'error',
  login:   'warning',
  approve: 'cyan',
  reject:  'orange',
  export:  'purple',
  view:    'default',
};

const ACTION_PILLS = [
  { key: '',        label: 'Tất cả' },
  { key: 'login',   label: 'Login' },
  { key: 'create',  label: 'Tạo mới' },
  { key: 'update',  label: 'Cập nhật' },
  { key: 'delete',  label: 'Xoá' },
  { key: 'approve', label: 'Duyệt' },
  { key: 'reject',  label: 'Từ chối' },
  { key: 'export',  label: 'Export' },
];

function actionTag(action = '') {
  const key = Object.keys(ACTION_COLOR).find(k => action.toLowerCase().includes(k));
  return <Tag color={ACTION_COLOR[key] ?? 'default'}>{action || '—'}</Tag>;
}

export default function AuditLogPage() {
  const [page,      setPage]      = useState(1);
  const [module,    setModule]    = useState('');
  const [action,    setAction]    = useState('');
  const [userQ,     setUserQ]     = useState('');
  const [dateRange, setDateRange] = useState(null);
  const [expanded,  setExpanded]  = useState({});

  const from = dateRange?.[0]?.format('YYYY-MM-DD');
  const to   = dateRange?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-audit-logs', page, module, action, userQ, from, to],
    queryFn:  () => api.get('/admin/logs/audit', {
      params: { page, limit: 25, module: module || undefined, action: action || undefined, user: userQ || undefined, from: from || undefined, to: to || undefined },
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
      render: (_, r) => (
        <div>
          <Text className="text-xs font-medium">{r.admin?.username ?? r.admin?.email ?? r.adminId ?? '—'}</Text>
          {r.ip && <div><Text type="secondary" className="font-mono text-[11px]">{r.ip}</Text></div>}
        </div>
      ),
    },
    {
      title: 'Hành động', dataIndex: 'action', key: 'action', width: 140,
      render: v => actionTag(v),
    },
    {
      title: 'Module', dataIndex: 'module', key: 'module', width: 100,
      render: v => <Tag style={{ fontFamily: 'monospace', fontSize: 11 }}>{v ?? '—'}</Tag>,
    },
    {
      title: 'Target', dataIndex: 'targetId', key: 'target', width: 100,
      render: v => v ? <Text code className="text-[11px]">{v}</Text> : '—',
    },
    {
      title: 'Chi tiết', dataIndex: 'details', key: 'details',
      render: (v, r) => {
        const str = typeof v === 'object' ? JSON.stringify(v, null, 2) : (v ?? '—');
        const isOpen = expanded[r.id];
        const isLong = str.length > 80;
        return (
          <div>
            <Text type="secondary" className="text-xs" style={{ whiteSpace: isOpen ? 'pre-wrap' : 'nowrap' }}>
              {isOpen ? str : str.slice(0, 80) + (isLong ? '…' : '')}
            </Text>
            {isLong && (
              <Button
                type="link" size="small" style={{ padding: '0 4px', fontSize: 11 }}
                onClick={() => setExpanded(prev => ({ ...prev, [r.id]: !prev[r.id] }))}
              >
                {isOpen ? 'Thu gọn' : 'Xem thêm'}
              </Button>
            )}
          </div>
        );
      },
    },
  ];

  const hasFilter = !!(module || action || userQ || dateRange);
  const clearFilter = () => { setModule(''); setAction(''); setUserQ(''); setDateRange(null); setPage(1); };

  return (
    <div>
      <Title level={4} className="mb-4">Audit Logs</Title>
      <Text type="secondary" className="block mb-4 text-xs">Lịch sử toàn bộ thao tác của admin trên hệ thống</Text>

      {/* ── Action pills ── */}
      <Space wrap className="mb-4">
        {ACTION_PILLS.map(p => (
          <Button key={p.key} size="small" type={action === p.key ? 'primary' : 'default'} onClick={() => { setAction(p.key); setPage(1); }}>
            {p.label}
          </Button>
        ))}
      </Space>

      {/* ── Other filters ── */}
      <Flex gap={12} wrap="wrap" align="flex-end" className="mb-4">
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Module</Text>
          <Select size="small" className="w-[140px]" value={module} onChange={v => { setModule(v); setPage(1); }}
            options={[{ label: 'Tất cả', value: '' }, ...['auth','user','finance','game','dating','sports','trade','hub','settings','risk'].map(m => ({ label: m, value: m }))]}
          />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Tìm admin</Text>
          <Input size="small" prefix={<SearchOutlined />} className="w-[160px]" placeholder="Username / email..." allowClear value={userQ} onChange={e => { setUserQ(e.target.value); setPage(1); }} />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Khoảng thời gian</Text>
          <RangePicker size="small" value={dateRange} onChange={v => { setDateRange(v); setPage(1); }} className="w-[230px]" placeholder={['Từ ngày', 'Đến ngày']} />
        </div>
        {hasFilter && (
          <Button size="small" icon={<ClearOutlined />} onClick={clearFilter}>Xoá lọc</Button>
        )}
      </Flex>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 960 }}
        pagination={{ current: page, pageSize: 25, total, showSizeChanger: false, showTotal: t => `${t} bản ghi`, onChange: p => setPage(p) }}
      />
    </div>
  );
}
