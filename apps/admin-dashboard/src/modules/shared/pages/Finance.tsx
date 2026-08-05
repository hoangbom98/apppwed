// Ant Design — Tabs, Table, Button, Modal, Tag, Form, Input, DatePicker
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tabs, Button, Modal, Form, Input, Tag, Typography, Space, App,
  Flex, DatePicker, Select, Checkbox, Tooltip,
} from 'antd';
import {
  CheckOutlined, CloseOutlined, DownloadOutlined, SearchOutlined,
  ClearOutlined, CheckSquareOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const STATUS_COLOR = {
  pending:   'warning',
  approved:  'success',
  completed: 'success',
  rejected:  'error',
};
const STATUS_LABEL = {
  pending: 'Chờ duyệt', approved: 'Đã duyệt',
  completed: 'Hoàn thành', rejected: 'Từ chối',
};

function exportCsv(rows, type) {
  const headers = ['ID', 'User', 'Số tiền', 'Phương thức', 'Trạng thái', 'Thời gian'];
  const lines = rows.map(r => [
    r.id, r.user?.username ?? r.userId,
    r.amount, r.paymentMethod ?? r.method ?? '',
    r.status, new Date(r.createdAt ?? r.created_at).toLocaleString('vi'),
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const csv  = [headers.join(','), ...lines].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `${type}_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

// ── Single deposit/withdraw tab ───────────────────────────────────────────────
function FinanceTab({ type }) {
  const { message } = App.useApp();
  const [page,         setPage]         = useState(1);
  const [filter,       setFilter]       = useState('pending');
  const [note,         setNote]         = useState('');
  const [confirming,   setConfirming]   = useState(null);
  const [search,       setSearch]       = useState('');
  const [dateRange,    setDateRange]    = useState(null);
  const [amountMin,    setAmountMin]    = useState('');
  const [amountMax,    setAmountMax]    = useState('');
  const [selectedKeys, setSelectedKeys] = useState([]);
  const [bulkNote,     setBulkNote]     = useState('');
  const [bulkModal,    setBulkModal]    = useState(null); // 'approve'|'reject'
  const qc = useQueryClient();

  const endpoint   = type === 'deposit' ? '/admin/finance/deposits'    : '/admin/finance/withdrawals';
  const approveUrl = (id) => type === 'deposit' ? `/admin/finance/deposits/${id}/approve`    : `/admin/finance/withdrawals/${id}/approve`;
  const rejectUrl  = (id) => type === 'deposit' ? `/admin/finance/deposits/${id}/reject`     : `/admin/finance/withdrawals/${id}/reject`;

  const from = dateRange?.[0]?.format('YYYY-MM-DD');
  const to   = dateRange?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading } = useQuery({
    queryKey: [type === 'deposit' ? 'adminDeposits' : 'adminWithdrawals', page, filter, search, from, to, amountMin, amountMax],
    queryFn:  () => api.get(endpoint, {
      params: {
        page, limit: 20,
        status:    filter || undefined,
        search:    search || undefined,
        from:      from   || undefined,
        to:        to     || undefined,
        amountMin: amountMin || undefined,
        amountMax: amountMax || undefined,
      },
    }).then(r => r.data),
  });

  const approveMut = useMutation({
    mutationFn: ({ id }) => api.patch(approveUrl(id), { note }),
    onSuccess:  () => { qc.invalidateQueries(); setConfirming(null); setNote(''); message.success('Đã duyệt'); },
    onError:    () => message.error('Lỗi khi duyệt'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id }) => api.patch(rejectUrl(id), { note }),
    onSuccess:  () => { qc.invalidateQueries(); setConfirming(null); setNote(''); message.success('Đã từ chối'); },
    onError:    () => message.error('Lỗi khi từ chối'),
  });

  // Bulk mutations
  const bulkMut = useMutation({
    mutationFn: ({ action }) => Promise.all(
      selectedKeys.map(id => action === 'approve'
        ? api.patch(approveUrl(id), { note: bulkNote || 'Bulk approve' })
        : api.patch(rejectUrl(id),  { note: bulkNote || 'Bulk reject'  }),
      )
    ),
    onSuccess: () => {
      qc.invalidateQueries();
      setSelectedKeys([]);
      setBulkModal(null);
      setBulkNote('');
      message.success(`Đã xử lý ${selectedKeys.length} giao dịch`);
    },
    onError: () => message.error('Lỗi khi xử lý hàng loạt'),
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const hasFilter = !!(filter || search || dateRange || amountMin || amountMax);
  const clearFilter = () => { setFilter(''); setSearch(''); setDateRange(null); setAmountMin(''); setAmountMax(''); setPage(1); };

  const columns = [
    {
      title: '', key: 'check', width: 32,
      render: (_, r) => r.status === 'pending'
        ? <Checkbox checked={selectedKeys.includes(r.id)} onChange={e => {
            setSelectedKeys(prev => e.target.checked ? [...prev, r.id] : prev.filter(k => k !== r.id));
          }} />
        : null,
    },
    { title: 'ID',          dataIndex: 'id',     key: 'id', width: 90, render: (v) => <Text type="secondary" className="font-mono text-[11px]">#{v}</Text> },
    { title: 'User',        key: 'user',   render: (_, r) => (
      <div>
        <Text strong className="text-xs">{r.user?.username ?? r.user?.email ?? r.userId}</Text>
        {r.user?.email && r.user?.username && <div><Text type="secondary" className="text-[11px]">{r.user.email}</Text></div>}
      </div>
    )},
    { title: 'Số tiền',     dataIndex: 'amount', key: 'amount', render: (v) => <Text strong className="font-mono">{Number(v).toLocaleString('vi')}₫</Text> },
    { title: 'Phương thức', dataIndex: 'paymentMethod', key: 'method', render: (v, r) => <Tag>{v ?? r.method ?? '—'}</Tag> },
    { title: 'Trạng thái',  dataIndex: 'status', key: 'status',
      render: (v) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Tag> },
    { title: 'Thời gian',   dataIndex: 'createdAt', key: 'time',
      render: (v, r) => <Text type="secondary" className="text-[11px]">{new Date(v ?? r.created_at).toLocaleString('vi')}</Text> },
    {
      title: 'Thao tác', key: 'actions', width: 140,
      render: (_, r) => r.status === 'pending' ? (
        <Space size={6}>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => setConfirming({ id: r.id, action: 'approve' })}>Duyệt</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => setConfirming({ id: r.id, action: 'reject' })}>Từ chối</Button>
        </Space>
      ) : null,
    },
  ];

  const FILTER_OPTS = [
    { label: 'Chờ duyệt', value: 'pending'  },
    { label: 'Đã duyệt',  value: 'approved' },
    { label: 'Từ chối',   value: 'rejected' },
    { label: 'Tất cả',    value: ''         },
  ];

  const pendingSelected = selectedKeys.filter(id => rows.find(r => r.id === id)?.status === 'pending');

  return (
    <div>
      {/* ── Filters ── */}
      <Flex gap={10} wrap="wrap" align="flex-end" className="mb-4">
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Trạng thái</Text>
          <Space size={4}>
            {FILTER_OPTS.map(o => (
              <Button key={o.value} size="small" type={filter === o.value ? 'primary' : 'default'} onClick={() => { setFilter(o.value); setPage(1); }}>{o.label}</Button>
            ))}
          </Space>
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Tìm user</Text>
          <Input size="small" prefix={<SearchOutlined />} className="w-[180px]" placeholder="Username / email..." allowClear value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Khoảng thời gian</Text>
          <RangePicker size="small" value={dateRange} onChange={v => { setDateRange(v); setPage(1); }} className="w-[230px]" placeholder={['Từ ngày', 'Đến ngày']} />
        </div>
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Số tiền</Text>
          <Space size={4}>
            <Input size="small" className="w-[90px]" placeholder="Từ" type="number" value={amountMin} onChange={e => { setAmountMin(e.target.value); setPage(1); }} />
            <Text type="secondary" className="text-[11px]">–</Text>
            <Input size="small" className="w-[90px]" placeholder="Đến" type="number" value={amountMax} onChange={e => { setAmountMax(e.target.value); setPage(1); }} />
          </Space>
        </div>
        <Flex gap={8}>
          {hasFilter && <Button size="small" icon={<ClearOutlined />} onClick={clearFilter}>Xoá lọc</Button>}
          <Button size="small" icon={<DownloadOutlined />} disabled={!rows.length} onClick={() => exportCsv(rows, type)}>Export</Button>
        </Flex>
      </Flex>

      {/* ── Bulk action bar ── */}
      {pendingSelected.length > 0 && (
        <Flex gap={8} align="center" className="mb-3 p-2 rounded-lg bg-blue-900/30 border border-blue-700/40">
          <CheckSquareOutlined style={{ color: '#60a5fa' }} />
          <Text className="text-xs">Đã chọn <Text strong>{pendingSelected.length}</Text> giao dịch chờ duyệt</Text>
          <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => setBulkModal('approve')}>Duyệt tất cả</Button>
          <Button size="small" danger icon={<CloseOutlined />} onClick={() => setBulkModal('reject')}>Từ chối tất cả</Button>
          <Button size="small" onClick={() => setSelectedKeys([])}>Bỏ chọn</Button>
        </Flex>
      )}

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 800 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, showTotal: (t) => `${t} giao dịch`, onChange: (p) => setPage(p) }}
      />

      {/* ── Single confirm modal ── */}
      <Modal
        open={!!confirming}
        title={confirming?.action === 'approve' ? 'Xác nhận duyệt' : 'Xác nhận từ chối'}
        onOk={() => confirming?.action === 'approve' ? approveMut.mutate({ id: confirming.id }) : rejectMut.mutate({ id: confirming.id })}
        onCancel={() => { setConfirming(null); setNote(''); }}
        okText="Xác nhận" cancelText="Huỷ"
        okButtonProps={{ danger: confirming?.action === 'reject', loading: approveMut.isPending || rejectMut.isPending }}
        destroyOnClose
      >
        <Form layout="vertical" className="mt-2">
          <Form.Item label="Ghi chú (tuỳ chọn)">
            <Input placeholder="Lý do..." value={note} onChange={e => setNote(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>

      {/* ── Bulk confirm modal ── */}
      <Modal
        open={!!bulkModal}
        title={bulkModal === 'approve' ? `Duyệt ${pendingSelected.length} giao dịch` : `Từ chối ${pendingSelected.length} giao dịch`}
        onOk={() => bulkMut.mutate({ action: bulkModal })}
        onCancel={() => { setBulkModal(null); setBulkNote(''); }}
        okText="Xác nhận" cancelText="Huỷ"
        okButtonProps={{ danger: bulkModal === 'reject', loading: bulkMut.isPending }}
        destroyOnClose
      >
        <Form layout="vertical" className="mt-2">
          <Form.Item label="Ghi chú chung">
            <Input placeholder="Lý do xử lý hàng loạt..." value={bulkNote} onChange={e => setBulkNote(e.target.value)} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ── Lazy finance summary ───────────────────────────────────────────────────────
const FinanceSummaryLazy = React.lazy(() => import('./FinanceSummary'));

// ── Main Finance page ──────────────────────────────────────────────────────────
export default function Finance() {
  const TAB_ITEMS = [
    {
      key: 'overview', label: 'Tổng quan',
      children: (
        <React.Suspense fallback={<div className="text-gray-500 p-8 text-center">Đang tải...</div>}>
          <FinanceSummaryLazy />
        </React.Suspense>
      ),
    },
    { key: 'deposit',  label: 'Nạp tiền', children: <FinanceTab type="deposit" /> },
    { key: 'withdraw', label: 'Rút tiền',  children: <FinanceTab type="withdraw" /> },
  ];

  return (
    <div>
      <Title level={4} className="mb-5">Tài chính — Nạp / Rút</Title>
      <Tabs defaultActiveKey="deposit" items={TAB_ITEMS} />
    </div>
  );
}
