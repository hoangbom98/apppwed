// @ts-nocheck
// frontend/admin-dashboard/src/modules/game/pages/GameWithdrawalsPage.jsx
import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, Input, App, Typography, Flex } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

const STATUS_TAG = {
  pending:    'warning',
  processing: 'processing',
  success:    'success',
  failed:     'error',
};
const STATUS_LABEL = {
  pending: 'Chờ duyệt', processing: 'Đang xử lý',
  success: 'Thành công', failed: 'Thất bại',
};

export default function GameWithdrawalsPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]   = useState(1);
  const [status, setStatus] = useState('');
  const rejectNoteRef = useRef('');

  const { data, isLoading } = useQuery({
    queryKey: ['game-admin-withdrawals', page, status],
    queryFn:  () => api.get('/admin/finance/withdrawals', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const approveMut = useMutation({
    mutationFn: id => api.patch(`/admin/finance/withdrawals/${id}/approve`),
    onSuccess:  () => { message.success('Đã duyệt rút tiền'); qc.invalidateQueries({ queryKey: ['game-admin-withdrawals'] }); },
    onError:    () => message.error('Có lỗi xảy ra'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }) => api.patch(`/admin/finance/withdrawals/${id}/reject`, { reason }),
    onSuccess:  () => { message.success('Đã từ chối'); qc.invalidateQueries({ queryKey: ['game-admin-withdrawals'] }); },
    onError:    () => message.error('Có lỗi xảy ra'),
  });

  const handleApprove = record => {
    modal.confirm({
      title:      'Xác nhận duyệt rút tiền',
      content:    `Duyệt rút ${Number(record.amount).toLocaleString('vi')} ₫ cho ${record.user?.username ?? record.userId}?`,
      okText:     'Duyệt',
      cancelText: 'Huỷ',
      onOk:       () => approveMut.mutateAsync(record.id),
    });
  };

  const handleReject = record => {
    rejectNoteRef.current = '';
    modal.confirm({
      title:   'Từ chối rút tiền',
      content: (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6, color: 'rgba(255,255,255,0.65)' }}>Lý do từ chối:</div>
          <Input
            placeholder="Nhập lý do..."
            onChange={e => { rejectNoteRef.current = e.target.value; }}
          />
        </div>
      ),
      okText:  'Từ chối',
      okType:  'danger',
      cancelText: 'Huỷ',
      onOk: () => rejectMut.mutateAsync({ id: record.id, reason: rejectNoteRef.current || 'Không đáp ứng yêu cầu' }),
    });
  };

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, r) => (
        <div>
          <div>{r.user?.username ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.userId}</Text>
        </div>
      ),
    },
    {
      title: 'Số tiền',
      dataIndex: 'amount',
      key: 'amount',
      render: v => <Text strong>{Number(v).toLocaleString('vi')} ₫</Text>,
    },
    {
      title: 'Tài khoản nhận',
      key: 'bank',
      render: (_, r) => r.bankInfo
        ? `${r.bankInfo.bankName ?? ''} - ${r.bankInfo.accountNumber ?? ''}`
        : (r.address ?? '—'),
      ellipsis: true,
    },
    {
      title: 'Phương thức',
      dataIndex: 'method',
      key: 'method',
      render: v => v ?? '—',
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    {
      title: 'Ngày tạo',
      key: 'createdAt',
      render: (_, r) => new Date(r.createdAt).toLocaleString('vi'),
    },
    {
      title: 'Thao tác',
      key: 'action',
      render: (_, r) =>
        ['pending', 'processing'].includes(r.status) ? (
          <Space size="small">
            <Button
              type="primary" size="small" icon={<CheckOutlined />}
              onClick={() => handleApprove(r)}
              loading={approveMut.isPending}
            >Duyệt</Button>
            <Button
              danger size="small" icon={<CloseOutlined />}
              onClick={() => handleReject(r)}
              loading={rejectMut.isPending}
            >Từ chối</Button>
          </Space>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Game — Rút tiền</div>
          <Text type="secondary">Duyệt / từ chối yêu cầu rút tiền</Text>
        </div>
        <Select
          value={status}
          onChange={v => { setStatus(v); setPage(1); }}
          style={{ width: 180 }}
          options={[
            { value: '',           label: 'Tất cả' },
            { value: 'pending',    label: 'Chờ duyệt' },
            { value: 'processing', label: 'Đang xử lý' },
            { value: 'success',    label: 'Hoàn thành' },
          ]}
        />
      </Flex>

      <Table
        dataSource={rows}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="middle"
        pagination={{
          current:   page,
          pageSize:  20,
          total,
          onChange:  p => setPage(p),
          showTotal: t => `Tổng: ${t.toLocaleString()}`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}
