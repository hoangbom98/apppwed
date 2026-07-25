// @ts-nocheck
// frontend/admin-dashboard/src/modules/trade/pages/TradeDepositsPage.tsx
import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, Input, App, Typography, Flex } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import type { ColumnType } from 'antd/es/table';

const { Text } = Typography;

const STATUS_TAG: Record<string, string> = {
  pending:  'warning',
  approved: 'success',
  rejected: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  pending:  'Chờ duyệt',
  approved: 'Đã duyệt',
  rejected: 'Từ chối',
};

export default function TradeDepositsPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState<number>(1);
  const [status, setStatus] = useState<string>('');
  const rejectNoteRef = useRef<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['trade-admin-deposits', page, status],
    queryFn:  () => api.get('/trade/admin/deposits', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows: any[]    = data?.data ?? [];
  const total: number  = data?.total ?? data?.meta?.total ?? 0;

  const approveMut = useMutation({
    mutationFn: (id: string) => api.put(`/trade/admin/deposits/${id}/approve`),
    onSuccess:  () => { message.success('Đã duyệt nạp tiền'); qc.invalidateQueries({ queryKey: ['trade-admin-deposits'] }); },
    onError:    () => message.error('Có lỗi xảy ra'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/trade/admin/deposits/${id}/reject`, { reason }),
    onSuccess:  () => { message.success('Đã từ chối'); qc.invalidateQueries({ queryKey: ['trade-admin-deposits'] }); },
    onError:    () => message.error('Có lỗi xảy ra'),
  });

  const handleApprove = (record: any) => {
    modal.confirm({
      title:      'Xác nhận duyệt nạp tiền',
      content:    `Duyệt nạp ${Number(record.amount).toLocaleString('vi')} USD của ${record.user?.email ?? record.userId}?`,
      okText:     'Duyệt',
      cancelText: 'Huỷ',
      onOk:       () => approveMut.mutateAsync(record.id),
    });
  };

  const handleReject = (record: any) => {
    rejectNoteRef.current = '';
    modal.confirm({
      title:   'Từ chối nạp tiền',
      content: (
        <div style={{ marginTop: 8 }}>
          <div style={{ marginBottom: 6, color: 'rgba(255,255,255,0.65)' }}>Lý do từ chối:</div>
          <Input
            placeholder="Nhập lý do..."
            onChange={e => { rejectNoteRef.current = e.target.value; }}
          />
        </div>
      ),
      okText:     'Từ chối',
      okType:     'danger',
      cancelText: 'Huỷ',
      onOk: () => rejectMut.mutateAsync({ id: record.id, reason: rejectNoteRef.current || 'Không hợp lệ' }),
    });
  };

  const columns: ColumnType<any>[] = [
    {
      title: 'Người dùng', key: 'user',
      render: (_, r) => (
        <div>
          <div>{r.user?.fullName ?? r.user?.email ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{r.userId}</Text>
        </div>
      ),
    },
    {
      title: 'Số tiền', dataIndex: 'amount', key: 'amount',
      render: v => <Text strong>{Number(v).toLocaleString('vi')} USD</Text>,
    },
    {
      title: 'Phương thức', key: 'method',
      render: (_, r) => r.method ?? '—',
    },
    {
      title: 'Tx Hash', dataIndex: 'txHash', key: 'txHash',
      render: v => v ? <Text code style={{ fontSize: 11 }}>{String(v).slice(0, 16)}…</Text> : '—',
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    {
      title: 'Ngày tạo', key: 'createdAt',
      render: (_, r) => new Date(r.createdAt).toLocaleString('vi'),
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_, r) => r.status === 'pending' ? (
        <Space size="small">
          <Button type="primary" size="small" icon={<CheckOutlined />}
            onClick={() => handleApprove(r)} loading={approveMut.isPending}>
            Duyệt
          </Button>
          <Button danger size="small" icon={<CloseOutlined />}
            onClick={() => handleReject(r)} loading={rejectMut.isPending}>
            Từ chối
          </Button>
        </Space>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Trade — Nạp tiền</div>
          <Text type="secondary">Duyệt / từ chối yêu cầu nạp tiền của người dùng</Text>
        </div>
        <Select
          value={status}
          onChange={v => { setStatus(v); setPage(1); }}
          style={{ width: 180 }}
          options={[
            { value: '',         label: 'Tất cả' },
            { value: 'pending',  label: 'Chờ duyệt' },
            { value: 'approved', label: 'Đã duyệt' },
            { value: 'rejected', label: 'Từ chối' },
          ]}
        />
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p),
          showTotal: t => `Tổng: ${t.toLocaleString()}`, showSizeChanger: false }}
      />
    </div>
  );
}
