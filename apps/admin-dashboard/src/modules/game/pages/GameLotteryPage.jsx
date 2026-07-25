// frontend/admin-dashboard/src/modules/game/pages/GameLotteryPage.jsx
// Route: /game/lottery — Admin quản lý Lottery types, draws, bets.
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Button, Space, Select, Input, Modal, Form, Tabs,
  App, Typography, Flex, DatePicker, Switch, InputNumber,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import api from '@admin/api/client';
import dayjs from 'dayjs';

const { Text } = Typography;
const { RangePicker } = DatePicker;

function fmt(n)  { return n == null ? '—' : Number(n).toLocaleString('vi-VN'); }
function fmtT(s) { return s ? new Date(s).toLocaleString('vi-VN') : '—'; }

const DRAW_STATUS_TAG = { WAITING: 'warning', DRAWN: 'success', CANCELLED: 'default' };
const BET_STATUS_TAG  = { PENDING: 'warning', WIN: 'success', LOSE: 'error', CANCELLED: 'default' };

// ── Lottery Types CRUD Tab ────────────────────────────────────────────────────
function LotteryTypesTab() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null=closed, {}=new, {...}=edit
  const [form]                = Form.useForm();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-lottery-types'],
    queryFn:  () => api.get('/game/lottery/types').then(r => r.data),
    staleTime: 30_000,
  });
  const types = data?.data ?? [];

  const saveMut = useMutation({
    mutationFn: (vals) => {
      const body = { ...vals, drawIntervalMin: Number(vals.drawIntervalMin ?? 5) };
      return editing?.id
        ? api.patch(`/game/admin/lottery/types/${editing.id}`, body)
        : api.post('/game/admin/lottery/types', body);
    },
    onSuccess: () => {
      message.success(editing?.id ? 'Đã cập nhật loại xổ số' : 'Đã tạo loại mới');
      qc.invalidateQueries({ queryKey: ['admin-lottery-types'] });
      setEditing(null);
      form.resetFields();
    },
    onError: e => message.error(e?.response?.data?.message ?? 'Lỗi lưu'),
  });

  const deleteMut = useMutation({
    mutationFn: (id) => api.delete(`/game/admin/lottery/types/${id}`),
    onSuccess: () => { message.success('Đã xoá'); qc.invalidateQueries({ queryKey: ['admin-lottery-types'] }); },
    onError: e => message.error(e?.response?.data?.message ?? 'Lỗi xoá'),
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }) => api.patch(`/game/admin/lottery/types/${id}`, { active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-lottery-types'] }),
    onError: e => message.error(e?.response?.data?.message ?? 'Lỗi cập nhật'),
  });

  const handleEdit = (row) => { setEditing(row); form.setFieldsValue({ ...row }); };
  const handleNew  = () => { setEditing({}); form.resetFields(); };

  const columns = [
    { title: 'Tên',      dataIndex: 'name',           key: 'name',    render: v => <Text strong>{v}</Text> },
    { title: 'Code',     dataIndex: 'code',            key: 'code',    render: v => <Text code>{v}</Text> },
    { title: 'Chu kỳ',  dataIndex: 'drawIntervalMin', key: 'interval',render: v => `${v ?? 5} phút` },
    {
      title: 'Hoạt động', dataIndex: 'active', key: 'active',
      render: (v, r) => (
        <Switch
          checked={!!v}
          loading={toggleMut.isPending}
          onChange={checked => toggleMut.mutate({ id: r.id, active: checked })}
          size="small"
        />
      ),
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_, r) => (
        <Space size="small">
          <Button size="small" icon={<EditOutlined />} onClick={() => handleEdit(r)}>Sửa</Button>
          <Button
            size="small" danger icon={<DeleteOutlined />}
            loading={deleteMut.isPending}
            onClick={() => {
              Modal.confirm({
                title:   `Xoá loại "${r.name}"?`,
                content: 'Thao tác không thể hoàn tác.',
                okText:  'Xoá', okType: 'danger',
                onOk:    () => deleteMut.mutate(r.id),
              });
            }}
          >Xoá</Button>
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <Flex justify="flex-end">
        <Button type="primary" icon={<PlusOutlined />} onClick={handleNew}>Thêm loại xổ số</Button>
      </Flex>
      <Table dataSource={types} columns={columns} loading={isLoading} rowKey="id" size="small" pagination={false} />

      <Modal
        open={editing !== null}
        title={editing?.id ? `Sửa: ${editing.name}` : 'Tạo loại xổ số mới'}
        onCancel={() => { setEditing(null); form.resetFields(); }}
        onOk={() => form.validateFields().then(vals => saveMut.mutate(vals))}
        okText={editing?.id ? 'Lưu' : 'Tạo'} cancelText="Huỷ"
        confirmLoading={saveMut.isPending}
        destroyOnHidden
      >
        <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="code" label="Code (unique)" rules={[{ required: true }]}>
              <Input placeholder="VD: pc28" disabled={!!editing?.id} />
            </Form.Item>
            <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}>
              <Input placeholder="VD: PC28" />
            </Form.Item>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Form.Item name="drawIntervalMin" label="Chu kỳ quay (phút)" rules={[{ required: true }]}>
              <InputNumber min={1} max={1440} style={{ width: '100%' }} />
            </Form.Item>
            <Form.Item name="active" label="Kích hoạt" valuePropName="checked" initialValue={true}>
              <Switch />
            </Form.Item>
          </div>
          <Form.Item name="description" label="Mô tả (tuỳ chọn)">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// ── Lottery Draws Tab ─────────────────────────────────────────────────────────
function LotteryDrawsTab() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [createOpen, setCreateOpen]     = useState(false);
  const [resultOpen, setResultOpen]     = useState(false);
  const [selectedDraw, setSelectedDraw] = useState(null);
  const [typeFilter, setTypeFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange]       = useState(null);
  const [createForm] = Form.useForm();
  const [resultForm] = Form.useForm();

  const { data: typesData } = useQuery({
    queryKey: ['admin-lottery-types'],
    queryFn:  () => api.get('/game/lottery/types').then(r => r.data),
  });
  const types = typesData?.data ?? [];

  const from = dateRange?.[0]?.format('YYYY-MM-DD');
  const to   = dateRange?.[1]?.format('YYYY-MM-DD');

  const { data: drawsData, isLoading } = useQuery({
    queryKey: ['admin-lottery-draws', typeFilter, statusFilter, from, to],
    queryFn:  () => api.get('/game/lottery/draws', {
      params: {
        limit: 50,
        typeId: typeFilter || undefined,
        status: statusFilter || undefined,
        from:   from || undefined,
        to:     to   || undefined,
      },
    }).then(r => r.data),
    refetchInterval: 15_000,
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
    mutationFn: ({ id, result }) =>
      api.post(`/game/lottery/admin/draws/${id}/result`, { result }).then(r => r.data),
    onSuccess: () => {
      message.success('Cập nhật kết quả thành công');
      setResultOpen(false);
      setSelectedDraw(null);
      resultForm.resetFields();
      qc.invalidateQueries({ queryKey: ['admin-lottery-draws'] });
    },
    onError: e => message.error(e.response?.data?.message ?? 'Lỗi cập nhật'),
  });

  const cancelDrawMut = useMutation({
    mutationFn: id => api.post(`/game/lottery/admin/draws/${id}/cancel`).then(r => r.data),
    onSuccess: () => { message.success('Đã huỷ kỳ'); qc.invalidateQueries({ queryKey: ['admin-lottery-draws'] }); },
    onError: e => message.error(e.response?.data?.message ?? 'Lỗi huỷ kỳ'),
  });

  const drawColumns = [
    { title: 'Kỳ',       key: 'period',   render: (_, d) => <Text code>{d.period}</Text> },
    { title: 'Loại',     key: 'type',     render: (_, d) => d.type?.name ?? d.typeId },
    { title: 'Thời gian',key: 'drawTime', render: (_, d) => fmtT(d.drawTime) },
    { title: 'Tổng cược',key: 'totalBet', render: (_, d) => fmt(d.totalBetAmount) + ' ₫' },
    { title: 'Tổng trả', key: 'totalPay', render: (_, d) => fmt(d.totalPayout)    + ' ₫' },
    { title: 'TT',       dataIndex: 'status', key: 'status',
      render: s => <Tag color={DRAW_STATUS_TAG[s] ?? 'default'}>{s}</Tag> },
    {
      title: 'Kết quả', key: 'result',
      render: (_, d) => d.resultOfficial
        ? <Text code style={{ color: '#4ade80' }}>{JSON.stringify(d.resultOfficial)}</Text>
        : <Text type="secondary">—</Text>,
    },
    {
      title: 'Thao tác', key: 'action',
      render: (_, d) => (
        <Space size="small">
          {d.status === 'WAITING' && (
            <>
              <Button size="small" type="primary"
                onClick={() => { setSelectedDraw(d); setResultOpen(true); }}>
                Nhập kết quả
              </Button>
              <Button size="small" danger loading={cancelDrawMut.isPending}
                onClick={() => Modal.confirm({
                  title: `Huỷ kỳ ${d.period}?`, okText: 'Huỷ kỳ', okType: 'danger',
                  onOk: () => cancelDrawMut.mutate(d.id),
                })}>
                Huỷ
              </Button>
            </>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Flex gap={8} wrap="wrap" align="center" justify="space-between">
        <Space wrap>
          <Select
            value={typeFilter} onChange={setTypeFilter} style={{ width: 160 }} placeholder="Tất cả loại"
            options={[{ value: '', label: 'Tất cả loại' }, ...types.map(t => ({ value: t.id, label: t.name }))]}
          />
          <Select
            value={statusFilter} onChange={setStatusFilter} style={{ width: 140 }}
            options={[
              { value: '',          label: 'Tất cả' },
              { value: 'WAITING',   label: 'Chờ quay' },
              { value: 'DRAWN',     label: 'Đã quay' },
              { value: 'CANCELLED', label: 'Đã huỷ' },
            ]}
          />
          <RangePicker
            value={dateRange} onChange={setDateRange}
            placeholder={['Từ ngày', 'Đến ngày']} size="small"
          />
        </Space>
        <Button type="primary" icon={<PlusOutlined />} onClick={() => setCreateOpen(true)}>
          Tạo kỳ mới
        </Button>
      </Flex>

      <Table
        dataSource={draws} columns={drawColumns} loading={isLoading}
        rowKey="id" size="middle" pagination={false}
      />

      {/* Create draw modal */}
      <Modal
        open={createOpen}
        title="Tạo kỳ quay mới"
        onCancel={() => { setCreateOpen(false); createForm.resetFields(); }}
        onOk={() => createForm.validateFields().then(vals =>
          createDrawMut.mutate({ typeId: vals.typeId, drawTime: new Date(vals.drawTime).toISOString() })
        )}
        okText="Xác nhận" confirmLoading={createDrawMut.isPending}
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
        okText="Xác nhận kết quả" confirmLoading={setResultMut.isPending}
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

// ── Lottery Bets Tab ──────────────────────────────────────────────────────────
function LotteryBetsTab() {
  const [page,       setPage]       = useState(1);
  const [status,     setStatus]     = useState('');
  const [drawId,     setDrawId]     = useState('');
  const [search,     setSearch]     = useState('');
  const [dateRange,  setDateRange]  = useState(null);
  const { message } = App.useApp();
  const qc = useQueryClient();

  const from = dateRange?.[0]?.format('YYYY-MM-DD');
  const to   = dateRange?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-lottery-bets-all', page, status, drawId, search, from, to],
    queryFn:  () => api.get('/game/lottery/admin/bets', {
      params: {
        page, limit: 20,
        status:  status || undefined,
        drawId:  drawId || undefined,
        search:  search || undefined,
        from:    from   || undefined,
        to:      to     || undefined,
      },
    }).then(r => r.data),
    staleTime: 15_000,
  });

  const refundMut = useMutation({
    mutationFn: id => api.patch(`/admin/lottery/bets/${id}/refund`).then(r => r.data),
    onSuccess: () => { message.success('Đã hoàn tiền'); qc.invalidateQueries({ queryKey: ['admin-lottery-bets-all'] }); },
    onError: e => message.error(e.response?.data?.message ?? 'Lỗi hoàn tiền'),
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'Kỳ',      key: 'period',   render: (_, b) => <Text code>{b.draw?.period ?? b.drawId}</Text> },
    { title: 'User',    key: 'user',     render: (_, b) => b.user?.username ?? b.userId },
    { title: 'Loại',    key: 'betType',  render: (_, b) => b.betType ?? b.type ?? '—' },
    { title: 'Số đặt',  key: 'numbers',  render: (_, b) => b.numbers ?? b.betValue ?? '—' },
    { title: 'Tiền cược',key: 'amount',  render: (_, b) => <Text strong>{fmt(b.amount)} ₫</Text> },
    {
      title: 'Trả thưởng', key: 'payout',
      render: (_, b) => Number(b.payout) > 0
        ? <Text style={{ color: '#4ade80' }}>+{fmt(b.payout)} ₫</Text>
        : <Text type="secondary">—</Text>,
    },
    { title: 'TT', dataIndex: 'status', key: 'status',
      render: s => <Tag color={BET_STATUS_TAG[s] ?? 'default'}>{s}</Tag> },
    { title: 'Thời gian', key: 'createdAt', render: (_, b) => fmtT(b.createdAt) },
    {
      title: 'Thao tác', key: 'action',
      render: (_, b) => b.status === 'PENDING' ? (
        <Button size="small" danger loading={refundMut.isPending}
          onClick={() => Modal.confirm({
            title: 'Hoàn tiền cược này?', okText: 'Hoàn', okType: 'danger',
            onOk:  () => refundMut.mutate(b.id),
          })}>
          Hoàn tiền
        </Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <Flex gap={8} wrap="wrap" align="center">
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
          placeholder="Lọc theo kỳ / drawId..."
          value={drawId} onChange={e => { setDrawId(e.target.value); setPage(1); }}
          style={{ width: 160 }} allowClear
        />
        <Input.Search
          placeholder="Tìm user..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          style={{ width: 160 }} allowClear
        />
        <RangePicker
          value={dateRange} onChange={v => { setDateRange(v); setPage(1); }}
          placeholder={['Từ ngày', 'Đến ngày']} size="small"
        />
      </Flex>
      <Table
        dataSource={rows} columns={columns} loading={isLoading} rowKey="id" size="small"
        pagination={{
          current: page, pageSize: 20, total,
          onChange: p => setPage(p),
          showTotal: t => `Tổng: ${t}`,
          showSizeChanger: false,
        }}
      />
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function GameLotteryPage() {
  const [activeTab, setActiveTab] = useState('draws');

  const tabItems = [
    { key: 'draws',   label: 'Kỳ quay',         children: <LotteryDrawsTab /> },
    { key: 'bets',    label: 'Lịch sử cược',     children: <LotteryBetsTab /> },
    { key: 'types',   label: 'Quản lý loại XS',  children: <LotteryTypesTab /> },
  ];

  return (
    <div className="space-y-4">
      <div>
        <div style={{ fontSize: 22, fontWeight: 900 }}>Game — Xổ số</div>
        <Text type="secondary">Quản lý kỳ quay, kết quả, đặt cược, loại xổ số</Text>
      </div>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} />
    </div>
  );
}
