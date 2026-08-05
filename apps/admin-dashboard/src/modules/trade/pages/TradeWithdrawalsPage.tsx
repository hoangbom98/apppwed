import React, { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, Input, App, Typography, Flex } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import type { ColumnType } from 'antd/es/table';

const { Text } = Typography;

const STATUS_TAG: Record<string, string> = {
  pending:   'warning',
  completed: 'success',
  cancelled: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  pending:   'Chờ duyệt',
  completed: 'Hoàn thành',
  cancelled: 'Đã huỷ',
};

export default function TradeWithdrawalsPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState<number>(1);
  const [status, setStatus] = useState<string>('');
  const rejectNoteRef = useRef<string>('');

  const { data, isLoading } = useQuery({
    queryKey: ['trade-admin-withdrawals', page, status],
    queryFn:  () => api.get('/trade/admin/withdrawals', {
      params: { page, limit: 20, status: status || undefined },
    }).then(r => r.data),
  });

  const rows: any[]    = data?.data ?? [];
  const total: number  = data?.total ?? data?.meta?.total ?? 0;

  const approveMut = useMutation({
    mutationFn: (id: string) => api.put(`/trade/admin/withdrawals/${id}/approve`),
    onSuccess:  () => { message.success('Đã duyệt rút tiền'); qc.invalidateQueries({ queryKey: ['trade-admin-withdrawals'] }); },
    onError:    () => message.error('Có lỗi xảy ra'),
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.put(`/trade/admin/withdrawals/${id}/reject`, { reason }),
    onSuccess:  () => { message.success('Đã từ chối'); qc.invalidateQueries({ queryKey: ['trade-admin-withdrawals'] }); },
    onError:    () => message.error('Có lỗi xảy ra'),
  });

  const handleApprove = (record: any) => {
    modal.confirm({
      title:   'Xác nhận duyệt rút tiền',
      content: `Duyệt rút ${Number(record.amount).toLocaleString('vi')} USD cho ${record.user?.email ?? record.userId}?`,
      okText:     'Duyệt',
      cancelText: 'Huỷ',
      onOk: () => approveMut.mutateAsync(record.id),
    });
  };

  const handleReject = (record: any) => {
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
      okText:     'Từ chối',
      okType:     'danger',
      cancelText: 'Huỷ',
      onOk: () => rejectMut.mutateAsync({ id: record.id, reason: rejectNoteRef.current || 'Không đáp ứng yêu cầu' }),
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
      title: 'Phí', dataIndex: 'fee', key: 'fee',
      render: v => <Text type="secondary">{Number(v ?? 0).toFixed(2)} USD</Text>,
    },
    {
      title: 'Phương thức', dataIndex: 'method', key: 'method',
      render: v => v ?? '—',
    },
    {
      title: 'Địa chỉ nhận', key: 'dest',
      render: (_, r) => {
        if (r.bankInfo) {
          const b = typeof r.bankInfo === 'string' ? JSON.parse(r.bankInfo) : r.bankInfo;
          return <span>{b?.bankName ?? ''} – {b?.accountNumber ?? ''}</span>;
        }
        return r.address ? <Text code style={{ fontSize: 11 }}>{String(r.address).slice(0, 20)}…</Text> : '—';
      },
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
          <div style={{ fontSize: 22, fontWeight: 900 }}>Trade — Rút tiền</div>
          <Text type="secondary">Duyệt / từ chối yêu cầu rút tiền của người dùng</Text>
        </div>
        <Select
          value={status}
          onChange={v => { setStatus(v); setPage(1); }}
          style={{ width: 180 }}
          options={[
            { value: '',          label: 'Tất cả' },
            { value: 'pending',   label: 'Chờ duyệt' },
            { value: 'completed', label: 'Hoàn thành' },
            { value: 'cancelled', label: 'Đã huỷ' },
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
