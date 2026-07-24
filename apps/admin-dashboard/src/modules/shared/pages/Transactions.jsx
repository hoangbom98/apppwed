// frontend/admin-dashboard/src/modules/shared/pages/Transactions.jsx
// Antd — Table, Tag, Button, DatePicker, Select, Space, Typography, Input
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Table, Tag, Button, Select, Space, Typography, Flex, DatePicker, Input,
} from 'antd';
import { DownloadOutlined, ClearOutlined, SearchOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const TYPE_COLOR  = { deposit: 'success', withdraw: 'error', adjustment: 'processing', refund: 'purple', bet: 'warning', win: 'cyan' };
const TYPE_LABEL  = { deposit: 'Nạp', withdraw: 'Rút', adjustment: 'Điều chỉnh', refund: 'Hoàn', bet: 'Cược', win: 'Thắng' };
const STATUS_COLOR= { completed: 'success', pending: 'warning', failed: 'error', success: 'success' };
const STATUS_LABEL= { completed: 'Hoàn thành', pending: 'Chờ duyệt', failed: 'Thất bại', success: 'Thành công' };

const PROJECTS = ['', 'game', 'hub', 'dating', 'trade', 'sports'];
const PROJECT_LABEL = { '': 'Tất cả dự án', game: 'Game', hub: 'Hub', dating: 'Dating', trade: 'Trade', sports: 'Sports' };

// ── Preset date helpers ─────────────────────────────────────────────────────────
const DATE_PRESETS = [
  { label: 'Hôm nay',   range: () => [dayjs(), dayjs()] },
  { label: 'Hôm qua',   range: () => [dayjs().subtract(1,'day'), dayjs().subtract(1,'day')] },
  { label: '7 ngày',    range: () => [dayjs().subtract(6,'day'), dayjs()] },
  { label: '30 ngày',   range: () => [dayjs().subtract(29,'day'), dayjs()] },
  { label: 'Tháng này', range: () => [dayjs().startOf('month'), dayjs()] },
];

function exportCsv(rows) {
  const headers = ['ID','User','Loại','Số tiền','Trước','Sau','Trạng thái','Dự án','Ghi chú','Thời gian'];
  const lines = rows.map(r => [
    r.id, r.user?.username ?? r.userId, r.type,
    r.amount, r.balanceBefore, r.balanceAfter,
    r.status, r.project ?? '', r.note ?? '',
    new Date(r.createdAt).toLocaleString('vi'),
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const csv  = [headers.join(','), ...lines].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `transactions_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function Transactions() {
  const [page,      setPage]      = useState(1);
  const [status,    setStatus]    = useState('');
  const [type,      setType]      = useState('');
  const [project,   setProject]   = useState('');
  const [search,    setSearch]    = useState('');
  const [dateRange, setDateRange] = useState(null);

  const from = dateRange?.[0]?.format('YYYY-MM-DD');
  const to   = dateRange?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading } = useQuery({
    queryKey: ['adminTransactions', page, status, type, project, search, from, to],
    queryFn:  () => api.get('/admin/finance/transactions', {
      params: { page, limit: 20, status: status||undefined, type: type||undefined, project: project||undefined, search: search||undefined, from: from||undefined, to: to||undefined },
    }).then(r => r.data),
  });
  const rows  = data?.data ?? [];
  const total = data?.total ?? 0;

  const columns = [
    { title: 'ID',       dataIndex: 'id',     key: 'id',     width: 80,  render: v => <Text className="font-mono text-[11px]">{String(v).slice(0,8)}</Text> },
    { title: 'User',     key: 'user',          render: (_,r) => (
      <div>
        <Text strong className="text-xs">{r.user?.username ?? r.user?.email ?? r.userId}</Text>
        {r.user?.email && r.user?.username && <div><Text type="secondary" className="text-[11px]">{r.user.email}</Text></div>}
      </div>
    )},
    { title: 'Dự án',   dataIndex: 'project', key: 'project', width: 80, render: v => v ? <Tag>{v}</Tag> : '—' },
    { title: 'Loại',     dataIndex: 'type',   key: 'type',   width: 100, render: v => <Tag color={TYPE_COLOR[v]??'default'}>{TYPE_LABEL[v]??v}</Tag> },
    { title: 'Số tiền',  dataIndex: 'amount', key: 'amount', width: 130,
      render: v => <Text className={`font-mono font-bold ${Number(v)<0?'text-red-500':'text-emerald-500'}`}>
        {Number(v)>0?'+':''}{Number(v).toLocaleString('vi')}₫</Text> },
    { title: 'Số dư trước', dataIndex: 'balanceBefore', key: 'before', render: v => v!=null ? <Text type="secondary" className="text-[11px]">{Number(v).toLocaleString('vi')}</Text> : '—' },
    { title: 'Số dư sau',   dataIndex: 'balanceAfter',  key: 'after',  render: v => v!=null ? <Text type="secondary" className="text-[11px]">{Number(v).toLocaleString('vi')}</Text> : '—' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: v => <Tag color={STATUS_COLOR[v]??'default'}>{STATUS_LABEL[v]??v??'—'}</Tag> },
    { title: 'Ghi chú',  dataIndex: 'note', key: 'note', ellipsis: true, render: v => v ?? '—' },
    { title: 'Thời gian',dataIndex: 'createdAt', key: 'time', render: v => <Text type="secondary" className="text-[11px]">{new Date(v).toLocaleString('vi')}</Text> },
  ];

  const STATUS_BTNS = [['','Tất cả'],['pending','Chờ'],['completed','Xong'],['failed','Lỗi']];
  const hasFilter = !!(status||type||project||search||dateRange);
  const clearFilter = () => { setStatus(''); setType(''); setProject(''); setSearch(''); setDateRange(null); setPage(1); };

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-4">
        <Title level={4} className="m-0">Giao dịch (Ledger)</Title>
        <Button icon={<DownloadOutlined />} disabled={!rows.length} onClick={() => exportCsv(rows)}>
          Export CSV
        </Button>
      </Flex>

      {/* ── Filters ── */}
      <Flex gap={12} wrap="wrap" align="flex-end" className="mb-4">
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Trạng thái</Text>
          <Space size={4}>
            {STATUS_BTNS.map(([v,l]) => (
              <Button key={v} size="small" type={status===v?'primary':'default'} onClick={() => { setStatus(v); setPage(1); }}>{l}</Button>
            ))}
          </Space>
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Loại</Text>
          <Select size="small" className="w-[140px]" value={type} onChange={v => { setType(v); setPage(1); }}
            options={[{ label: 'Tất cả', value: '' }, ...['deposit','withdraw','adjustment','refund','bet','win'].map(t => ({ label: TYPE_LABEL[t]??t, value: t }))]}
          />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Dự án</Text>
          <Select size="small" className="w-[120px]" value={project} onChange={v => { setProject(v); setPage(1); }}
            options={PROJECTS.map(p => ({ label: PROJECT_LABEL[p] ?? p, value: p }))}
          />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Tìm user / ID</Text>
          <Input size="small" prefix={<SearchOutlined />} className="w-[180px]" placeholder="Username / email / ID..." allowClear value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Khoảng thời gian</Text>
          <RangePicker size="small" value={dateRange} onChange={v => { setDateRange(v); setPage(1); }} className="w-[230px]" placeholder={['Từ ngày', 'Đến ngày']} />
        </div>
        {hasFilter && (
          <Button size="small" icon={<ClearOutlined />} onClick={clearFilter}>Xoá filter</Button>
        )}
      </Flex>

      {/* ── Date preset buttons ── */}
      <Flex gap={6} className="mb-4">
        <Text type="secondary" className="text-[11px] self-center">Nhanh:</Text>
        {DATE_PRESETS.map(p => (
          <Button key={p.label} size="small" onClick={() => { setDateRange(p.range()); setPage(1); }}>
            {p.label}
          </Button>
        ))}
      </Flex>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 1100 }}
        pagination={{
          current: page, pageSize: 20, total,
          showSizeChanger: false,
          showTotal: t => `${t} giao dịch`,
          onChange: p => setPage(p),
        }}
      />
    </div>
  );
}
