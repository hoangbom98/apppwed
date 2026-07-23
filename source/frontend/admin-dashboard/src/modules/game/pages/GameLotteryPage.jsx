// frontend/admin-dashboard/src/modules/game/pages/GameLotteryPage.jsx
// Route: /game/lottery — Admin management for Lottery draws, types, and bets.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Button, Space, Select, Input, Modal, Form, Tabs,
  App, Typography, Flex,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

function fmt(n)    { return n == null ? '—' : Number(n).toLocaleString('vi-VN'); }
function fmtT(s)   { return s ? new Date(s).toLocaleString('vi-VN') : '—'; }

const DRAW_STATUS_TAG = { WAITING: 'warning', DRAWN: 'success', CANCELLED: 'default' };
const BET_STATUS_TAG  = { PENDING: 'warning', WIN: 'success', LOSE: 'error', CANCELLED: 'default' };

// ── Lottery Bets Tab ──────────────────────────────────────────────────────────
function LotteryBetsTab() {
  const [page, setPage]     = useState(1);
  const [status, setStatus] = useState('');
  const [drawId, setDrawId] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-lottery-bets-all', page, status, drawId],
    queryFn: () => api.get('/game/lottery/admin/bets', {
      params: { page, limit: 20, status: status || undefined, drawId: drawId || undefined },
    }).then(r => r.data),
    staleTime: 15_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'Kỳ',     key: 'period',    render: (_, b) => <Text code>{b.draw?.period ?? b.drawId}</Text> },
    { title: 'User',   key: 'user',      render: (_, b) => b.user?.username ?? b.userId },
    { title: 'Loại',   key: 'betType',   render: (_, b) => b.betType ?? b.type ?? '—' },
    { title: 'Số đặt', key: 'numbers',   render: (_, b) => b.numbers ?? b.betValue ?? '—' },
    { title: 'Tiền cược', key: 'amount', render: (_, b) => <Text strong>{fmt(b.amount)} ₫</Text> },
    {
      title: 'Trả thưởng', key: 'payout',
      render: (_, b) => Number(b.payout) > 0
        ? <Text style={{ color: '#4ade80' }}>+{fmt(b.payout)} ₫</Text>
        : <Text type="secondary">—</Text>,
    },
    { title: 'TT',  dataIndex: 'status', key: 'status', render: s => <Tag color={BET_STATUS_TAG[s] ?? 'default'}>{s}</Tag> },
    { title: 'Thời gian', key: 'createdAt', render: (_, b) => fmtT(b.createdAt) },
  ];

  return (
    <div className="space-y-4">
      <Space wrap>
        <Select
          value={status} onChange={v => { setStatus(v); setPage(1); }}
          style={{ width: 140 }}
          options={[
            { value: '',          label: 'Tất cả' },
            { value: 'PENDING',   label: 'Chờ' },
            { value: 'WIN',       label: 'Thắng' },
            { value: 'LOSE',      label: 'Thua' },
            { value: 'CANCELLED', label: 'Huỷ' },
          ]}
        />
        <Input
          placeholder="Lọc theo kỳ..."
          value={drawId} onChange={e => { setDrawId(e.target.value); setPage(1); }}
          style={{ width: 160 }} allowClear
        />
      </Space>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="small"
        pagination={{ current: page, pageSize: 20, total, onChange: p => setPage(p), showTotal: t => `Tổng: ${t}`, showSizeChanger: false }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GameLotteryPage() {
  const { message, modal } = App.useApp();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('draws');
  const [createOpen, setCreateOpen]   = useState(false);
  const [resultOpen, setResultOpen]   = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [createForm] = Form.useForm();
  const [resultForm] = Form.useForm();

  const { data: typesData } = useQuery({
    queryKey: ['admin-lottery-types'],
    queryFn: () => api.get('/game/lottery/types').then(r => r.data),
  });
  const types = typesData?.data ?? [];

  const { data: drawsData, isLoading: drawsLoading } = useQuery({
    queryKey: ['admin-lottery-draws'],
    queryFn: () => api.get('/game/lottery/draws', { params: { limit: 50 } }).then(r => r.data),
    refetchInterval: 15000,
  });
  const draws = drawsData?.data ?? [];

  const createDrawMut = useMutation({
    mutationFn: body => api.post('/game/lottery/admin/draws', body).then(r => r.data),
    onSuccess: () => {
      message.success('Tạo kỳ thành công');
      setCreateOpen(false);
      createForm.resetFields();
      qc.invalidateQueries({ queryKey: ['admin-lottery-draws'] });
    },
    onError: e => message.error(e.response?.data?.message ?? 'Lỗi tạo kỳ'),
  });

  const setResultMut = useMutation({
    mutationFn: ({ id, result }) => api.post(`/game/lottery/admin/draws/${id}/result`, { result }).then(r => r.data),
    onSuccess: () => {
      message.success('Cập nhật kết quả thành công');
      setResultOpen(false);
      setSelectedDraw(null);
      resultForm.resetFields();
      qc.invalidateQueries({ queryKey: ['admin-lottery-draws'] });
    },
    onError: e => message.error(e.response?.data?.message ?? 'Lỗi cập nhật'),
  });

  const drawColumns = [
    { title: 'Kỳ',       key: 'period',     render: (_, d) => <Text code>{d.period}</Text> },
    { title: 'Loại',     key: 'type',       render: (_, d) => d.type?.name ?? d.typeId },
    { title: 'Thời gian',key: 'drawTime',   render: (_, d) => fmtT(d.drawTime) },
    { title: 'Tổng cược',key: 'totalBet',   render: (_, d) => fmt(d.totalBetAmount) },
    { title: 'Tổng trả', key: 'totalPay',   render: (_, d) => fmt(d.totalPayout) },
    { title: 'TT',       dataIndex: 'status', key: 'status', render: s => <Tag color={DRAW_STATUS_TAG[s] ?? 'default'}>{s}</Tag> },
    {
      title: 'Kết quả', key: 'result',
      render: (_, d) => d.resultOfficial
        ? <Text code style={{ color: '#4ade80' }}>{JSON.stringify(d.resultOfficial)}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_, d) => d.status === 'WAITING' ? (
        <Button size="small" type="primary" onClick={() => { setSelectedDraw(d); setResultOpen(true); }}>
          Nhập kết quả
        </Button>
      ) : null,
    },
  ];

  const tabItems = [
    {
      key: 'draws', label: 'Kỳ quay',
      children: (
        <Table
          dataSource={draws} columns={drawColumns} loading={drawsLoading}
          rowKey="id" size="middle" pagination={false}
        />
      ),
    },
    { key: 'bets', label: 'Lịch sử cược', children: <LotteryBetsTab /> },
  ];

  return (
    <div className="space-y-4">
      <Flex align="center" justify="space-between">
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Game — Xổ số</div>
          <Text type="secondary">Quản lý kỳ quay, kết quả, đặt cược</Text>
        </div>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Tạo kỳ mới
        </Button>
      </Flex>

      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />

      {/* Create draw modal */}
      <Modal
        open={createOpen}
        title="Tạo kỳ quay mới"
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={() => createForm.validateFields().then(vals =>
          createDrawMut.mutate({ typeId: vals.typeId, drawTime: new Date(vals.drawTime).toISOString() })
        )}
        okText="Xác nhận"
        confirmLoading={createDrawMut.isPending}
      >
        <Form form={createForm} layout="vertical">
          <Form.Item name="typeId" label="Loại xổ số" rules={[{ required: true }]}>
            <Select options={types.map(t => ({ value: t.id, label: t.name }))} placeholder="Chọn loại" />
          </Form.Item>
          <Form.Item name="drawTime" label="Thời gian quay" rules={[{ required: true }]}>
            <Input type="datetime-local" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Set result modal */}
      <Modal
        open={resultOpen}
        title={<span>Nhập kết quả kỳ <Text type="warning">{selectedDraw?.period}</Text></span>}
        onCancel={() => { setResultOpen(false); setSelectedDraw(null); resultForm.resetFields(); }}
        onOk={() => resultForm.validateFields().then(vals => {
          let result = (vals.result ?? '').trim();
          try { result = JSON.parse(result); } catch { result = { number: parseInt(result) }; }
          setResultMut.mutate({ id: selectedDraw.id, result });
        })}
        okText="Xác nhận kết quả"
        confirmLoading={setResultMut.isPending}
      >
        <Form form={resultForm} layout="vertical">
          <Form.Item name="result" label="Kết quả (số / JSON)" rules={[{ required: true }]}>
            <Input placeholder='VD: 14 hoặc {"number":14,"sum":5}' />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
