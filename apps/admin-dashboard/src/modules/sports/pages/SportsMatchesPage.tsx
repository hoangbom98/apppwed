// frontend/admin-dashboard/src/modules/sports/pages/SportsMatchesPage.tsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, Select, Modal, Form, Input, App, Typography, Flex } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { adminMatches } from '../api';
import { ColumnType } from 'antd/es/table';

const { Text } = Typography;

const STATUS_TAG: Record<string, string> = {
  upcoming: 'processing', live: 'success', finished: 'default',
  postponed: 'warning',   cancelled: 'error',
};
const STATUS_LABEL: Record<string, string> = {
  upcoming: 'Sắp diễn ra', live: 'Live', finished: 'Kết thúc',
  postponed: 'Hoãn',        cancelled: 'Huỷ',
};

interface MatchFormProps {
  editing: any;
  onClose: () => void;
}

function MatchFormModal({ editing, onClose }: MatchFormProps) {
  const isNew = !editing?.id;
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const { message } = App.useApp();

  const saveMut = useMutation({
    mutationFn: (vals: any) => isNew ? adminMatches.create(vals) : adminMatches.update(editing.id, vals),
    onSuccess: () => {
      message.success(isNew ? 'Đã tạo trận đấu' : 'Đã cập nhật');
      qc.invalidateQueries({ queryKey: ['sports-admin-matches'] });
      onClose();
    },
    onError: (e: any) => message.error(e?.response?.data?.message ?? 'Lỗi'),
  });

  return (
    <Modal
      open
      title={isNew ? '+ Thêm trận đấu' : 'Sửa trận đấu'}
      onCancel={onClose}
      onOk={() => form.validateFields().then(saveMut.mutate)}
      okText="Lưu"
      confirmLoading={saveMut.isPending}
      width={520}
    >
      <Form form={form} layout="vertical" initialValues={editing ?? { status: 'upcoming' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <Form.Item name="homeTeamId" label="Đội nhà ID"><Input /></Form.Item>
          <Form.Item name="awayTeamId" label="Đội khách ID"><Input /></Form.Item>
          <Form.Item name="leagueId"   label="League ID"><Input /></Form.Item>
          <Form.Item name="matchDate"  label="Thời gian"><Input type="datetime-local" /></Form.Item>
          <Form.Item name="homeScore"  label="Bàn thắng nhà"><Input type="number" /></Form.Item>
          <Form.Item name="awayScore"  label="Bàn thắng khách"><Input type="number" /></Form.Item>
        </div>
        <Form.Item name="status" label="Trạng thái">
          <Select options={Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l }))} />
        </Form.Item>
      </Form>
    </Modal>
  );
}

export default function SportsMatchesPage() {
  const { modal, message } = App.useApp();
  const qc = useQueryClient();
  const [page, setPage]     = useState<number>(1);
  const [status, setStatus] = useState<string>('');
  const [editing, setEditing] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['sports-admin-matches', page, status],
    queryFn:  () => adminMatches.list({ page, limit: 20, status: status || undefined }).then((r: any) => r.data),
  });

  const rows: any[]  = data?.data ?? [];
  const total: number = data?.total ?? data?.meta?.total ?? 0;

  const deleteMut = useMutation({
    mutationFn: (id: string | number) => adminMatches.remove(id),
    onSuccess: () => { message.success('Đã xoá trận đấu'); qc.invalidateQueries({ queryKey: ['sports-admin-matches'] }); },
  });

  const columns: ColumnType<any>[] = [
    { title: 'Đội nhà',  key: 'home', render: (_, m: any) => <Text strong>{m.homeTeam?.name ?? m.homeTeamId}</Text> },
    {
      title: 'Tỉ số', key: 'score',
      render: (_, m: any) => m.homeScore != null ? <Text strong>{m.homeScore} — {m.awayScore}</Text> : '—',
    },
    { title: 'Đội khách', key: 'away', render: (_, m: any) => <Text strong>{m.awayTeam?.name ?? m.awayTeamId}</Text> },
    { title: 'Giải đấu', key: 'league', render: (_, m: any) => m.league?.name ?? m.leagueId ?? '—' },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={STATUS_TAG[s] ?? 'default'}>{STATUS_LABEL[s] ?? s}</Tag>,
    },
    { title: 'Thời gian', key: 'matchDate', render: (_, m: any) => m.matchDate ? new Date(m.matchDate).toLocaleString('vi') : '—' },
    {
      title: '', key: 'action',
      render: (_, m: any) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => setEditing(m)} />
          <Button
            size="small" danger icon={<DeleteOutlined />}
            onClick={() => modal.confirm({
              title: 'Xoá trận đấu?', okType: 'danger',
              onOk: () => deleteMut.mutateAsync(m.id),
            })}
          />
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Sports — Trận đấu</div>
          <Text type="secondary">Quản lý lịch thi đấu và kết quả</Text>
        </div>
        <Space wrap>
          <Select
            value={status} onChange={v => { setStatus(v); setPage(1); }} style={{ width: 160 }}
            options={[
              { value: '', label: 'Tất cả' },
              ...Object.entries(STATUS_LABEL).map(([v, l]) => ({ value: v, label: l })),
            ]}
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setEditing({})}>Thêm</Button>
        </Space>
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="middle"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${t.toLocaleString()}`, showSizeChanger: false }}
      />
      {editing !== null && <MatchFormModal editing={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}
