// frontend/admin-dashboard/src/modules/shared/pages/Finance.jsx
// Ant Design — Tabs, Table, Button, Modal, Tag, Form, Input
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tabs, Button, Modal, Form, Input, Tag, Typography, Space, App,
} from 'antd';
import {
  CheckOutlined, CloseOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;

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

// ── Single deposit/withdraw tab ───────────────────────────────────────────────
function FinanceTab({ type }) {
  const { message } = App.useApp();
  const [page,       setPage]       = useState(1);
  const [filter,     setFilter]     = useState('pending');
  const [note,       setNote]       = useState('');
  const [confirming, setConfirming] = useState(null); // { id, action }
  const qc = useQueryClient();

  const endpoint       = type === 'deposit' ? '/admin/finance/deposits'    : '/admin/finance/withdrawals';
  const approveUrl = (id) => type === 'deposit' ? `/admin/finance/deposits/${id}/approve`    : `/admin/finance/withdrawals/${id}/approve`;
  const rejectUrl  = (id) => type === 'deposit' ? `/admin/finance/deposits/${id}/reject`     : `/admin/finance/withdrawals/${id}/reject`;

  const { data, isLoading } = useQuery({
    queryKey: [type === 'deposit' ? 'adminDeposits' : 'adminWithdrawals', page, filter],
    queryFn:  () => api.get(endpoint, { params: { page, limit: 20, status: filter || undefined } })
                       .then(r => r.data),
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

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? 0;

  const columns = [
    { title: 'ID',          dataIndex: 'id',     key: 'id', width: 90, render: (v) => <Text type="secondary" className="font-mono text-[11px]">#{v}</Text> },
    { title: 'User',        key: 'user',   render: (_, r) => r.user?.username ?? r.user?.email ?? r.userId },
    { title: 'Số tiền',     dataIndex: 'amount', key: 'amount', render: (v) => <Text strong className="font-mono">{Number(v).toLocaleString('vi')}₫</Text> },
    { title: 'Phương thức', dataIndex: 'paymentMethod', key: 'method', render: (v, r) => v ?? r.method ?? '—' },
    { title: 'Trạng thái',  dataIndex: 'status', key: 'status',
      render: (v) => <Tag color={STATUS_COLOR[v] ?? 'default'}>{STATUS_LABEL[v] ?? v}</Tag> },
    { title: 'Thời gian',   dataIndex: 'createdAt', key: 'time',
      render: (v, r) => <Text type="secondary" className="text-[11px]">{new Date(v ?? r.created_at).toLocaleString('vi')}</Text> },
    {
      title: 'Thao tác', key: 'actions', width: 140,
      render: (_, r) => r.status === 'pending' ? (
        <Space size={6}>
          <Button size="small" type="primary" icon={<CheckOutlined />}
            onClick={() => setConfirming({ id: r.id, action: 'approve' })}>
            Duyệt
          </Button>
          <Button size="small" danger icon={<CloseOutlined />}
            onClick={() => setConfirming({ id: r.id, action: 'reject' })}>
            Từ chối
          </Button>
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

  return (
    <div>
      {/* Filter buttons */}
      <Space className="mb-4">
        {FILTER_OPTS.map(o => (
          <Button key={o.value} size="small"
            type={filter === o.value ? 'primary' : 'default'}
            onClick={() => { setFilter(o.value); setPage(1); }}>
            {o.label}
          </Button>
        ))}
      </Space>

      <Table
        dataSource={rows}
        columns={columns}
        rowKey="id"
        loading={isLoading}
        size="small"
        scroll={{ x: 700 }}
        pagination={{
          current:  page,
          pageSize: 20,
          total,
          showSizeChanger: false,
          showTotal: (t) => `${t} giao dịch`,
          onChange:  (p) => setPage(p),
        }}
      />

      {/* Confirm modal */}
      <Modal
        open={!!confirming}
        title={confirming?.action === 'approve' ? '✅ Xác nhận duyệt' : '❌ Xác nhận từ chối'}
        onOk={() => confirming?.action === 'approve' ? approveMut.mutate({ id: confirming.id }) : rejectMut.mutate({ id: confirming.id })}
        onCancel={() => { setConfirming(null); setNote(''); }}
        okText="Xác nhận"
        cancelText="Huỷ"
        okButtonProps={{
          danger:   confirming?.action === 'reject',
          loading:  approveMut.isPending || rejectMut.isPending,
        }}
        destroyOnClose
      >
        <Form layout="vertical" className="mt-2">
          <Form.Item label="Ghi chú (tuỳ chọn)">
            <Input placeholder="Lý do..." value={note} onChange={e => setNote(e.target.value)} />
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
      key:      'overview',
      label:    '📊 Tổng quan',
      children: (
        <React.Suspense fallback={<div className="text-gray-500 p-8 text-center">Đang tải...</div>}>
          <FinanceSummaryLazy />
        </React.Suspense>
      ),
    },
    { key: 'deposit',  label: '💰 Nạp tiền', children: <FinanceTab type="deposit" /> },
    { key: 'withdraw', label: '💸 Rút tiền',  children: <FinanceTab type="withdraw" /> },
  ];

  return (
    <div>
      <Title level={4} className="mb-5">Tài chính — Nạp / Rút</Title>
      <Tabs defaultActiveKey="deposit" items={TAB_ITEMS} />
    </div>
  );
}
