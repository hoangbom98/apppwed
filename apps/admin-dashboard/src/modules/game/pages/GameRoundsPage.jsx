// frontend/admin-dashboard/src/modules/game/pages/GameRoundsPage.jsx
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Tag, Input, Select, Space, Typography, Flex, Button,
  Popconfirm, App, DatePicker,
} from 'antd';
import { AppstoreOutlined, DownloadOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;
const { RangePicker } = DatePicker;

// Boyue gameType map
const GAME_TYPES = [
  { value: '',          label: 'Tất cả loại' },
  { value: 'RNG',       label: 'Slots (RNG)' },
  { value: 'LIVE',      label: 'Live Casino' },
  { value: 'FISH',      label: 'Bắn cá (FISH)' },
  { value: 'SPORTS',    label: 'Thể thao' },
  { value: 'ESPORTS',   label: 'E-Sports' },
  { value: 'PVP',       label: 'Cờ bài (PVP)' },
  { value: 'ELOTTO',    label: 'Xổ số' },
  { value: 'COCKFIGHT', label: 'Đá gà' },
];

function exportCsv(rows) {
  const headers = ['ID', 'User', 'Game', 'Loại', 'Cược', 'Thắng', 'Provider', 'Thời gian'];
  const lines = rows.map(r => [
    r.id,
    r.user?.username ?? r.userId,
    r.gameName ?? r.gameCode ?? '—',
    r.gameType ?? r.type ?? '—',
    r.betAmount ?? r.stake ?? 0,
    r.winAmount ?? r.win ?? 0,
    r.provider ?? r.aggregator ?? '—',
    new Date(r.createdAt ?? r.created_at).toLocaleString('vi'),
  ].map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(','));
  const csv  = [headers.join(','), ...lines].join('\n');
  const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href = url; a.download = `game_rounds_${new Date().toISOString().slice(0,10)}.csv`; a.click();
  URL.revokeObjectURL(url);
}

export default function GameRoundsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [page,        setPage]        = useState(1);
  const [gameType,    setGameType]    = useState('');
  const [search,      setSearch]      = useState('');   // username / game
  const [userId,      setUserId]      = useState('');   // exact userId filter
  const [provider,    setProvider]    = useState('');
  const [dateRange,   setDateRange]   = useState(null);
  const [selected,    setSelected]    = useState([]);
  const [batchStatus, setBatch]       = useState('inactive');

  const from = dateRange?.[0]?.format('YYYY-MM-DD');
  const to   = dateRange?.[1]?.format('YYYY-MM-DD');

  const { data, isLoading } = useQuery({
    queryKey: ['game-admin-rounds', page, gameType, search, userId, provider, from, to],
    queryFn:  () => api.get('/game/admin/rounds', {
      params: {
        page, limit: 20,
        gameType: gameType  || undefined,
        search:   search    || undefined,
        userId:   userId    || undefined,
        provider: provider  || undefined,
        from:     from      || undefined,
        to:       to        || undefined,
      },
    }).then(r => r.data),
    staleTime: 15_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.total ?? data?.meta?.total ?? 0;

  const clearFilters = () => {
    setGameType(''); setSearch(''); setUserId('');
    setProvider(''); setDateRange(null); setPage(1);
  };
  const hasFilter = !!(gameType || search || userId || provider || dateRange);

  const columns = [
    {
      title: 'User',
      key: 'user',
      render: (_, r) => (
        <div>
          <div className="font-semibold text-xs">{r.user?.username ?? r.userId}</div>
          {r.userId && <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>{r.userId}</Text>}
        </div>
      ),
    },
    {
      title: 'Game',
      key: 'game',
      render: (_, r) => (
        <div>
          <div className="text-xs font-medium">{r.gameName ?? r.gameCode ?? '—'}</div>
          <Text type="secondary" style={{ fontSize: 10 }}>{r.gameType ?? r.type ?? ''}</Text>
        </div>
      ),
    },
    {
      title: 'Cược',
      key: 'bet',
      render: (_, r) => (
        <Text style={{ color: '#fb923c', fontFamily: 'monospace', fontSize: 12 }}>
          {Number(r.betAmount ?? r.stake ?? 0).toLocaleString('vi')} ₫
        </Text>
      ),
    },
    {
      title: 'Thắng',
      key: 'win',
      render: (_, r) => {
        const win = Number(r.winAmount ?? r.win ?? 0);
        return win > 0
          ? <Text style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 12 }}>+{win.toLocaleString('vi')} ₫</Text>
          : <Text type="secondary">—</Text>;
      },
    },
    {
      title: 'Kết quả',
      key: 'result',
      render: (_, r) => {
        const win = Number(r.winAmount ?? r.win ?? 0);
        return <Tag color={win > 0 ? 'success' : 'error'} style={{ fontSize: 11 }}>{win > 0 ? 'Thắng' : 'Thua'}</Tag>;
      },
    },
    {
      title: 'Provider',
      key: 'provider',
      render: (_, r) => <Text style={{ fontSize: 11 }}>{r.provider ?? r.aggregator ?? '—'}</Text>,
    },
    {
      title: 'Thời gian',
      key: 'createdAt',
      render: (_, r) => (
        <Text type="secondary" style={{ fontSize: 11 }}>
          {new Date(r.createdAt ?? r.created_at).toLocaleString('vi')}
        </Text>
      ),
    },
  ];

  // Batch toggle mutation
  const batchMut = useMutation({
    mutationFn: () => api.post('/admin/game/batch-status', { gameIds: selected, status: batchStatus }),
    onSuccess: (res) => {
      message.success(res.data?.data?.message ?? 'Đã cập nhật');
      setSelected([]);
      qc.invalidateQueries({ queryKey: ['game-admin-rounds'] });
    },
    onError: () => message.error('Lỗi cập nhật batch'),
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <Flex align="flex-start" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 900 }}>Game — Lịch sử vòng chơi</div>
          <Text type="secondary">Tổng: {total.toLocaleString()} vòng</Text>
        </div>
        <Space wrap>
          <Button
            size="small" icon={<DownloadOutlined />}
            disabled={!rows.length}
            onClick={() => exportCsv(rows)}
          >
            Export CSV
          </Button>
          {hasFilter && (
            <Button size="small" onClick={clearFilters}>Xoá lọc</Button>
          )}
        </Space>
      </Flex>

      {/* Filters */}
      <Flex gap={8} wrap="wrap" align="center">
        <Input.Search
          placeholder="Tìm user / game..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          onSearch={() => setPage(1)}
          style={{ width: 190 }}
          allowClear
          size="small"
        />
        <Input
          placeholder="userId chính xác..."
          value={userId}
          onChange={e => { setUserId(e.target.value); setPage(1); }}
          style={{ width: 170 }}
          allowClear
          size="small"
        />
        <Select
          value={gameType}
          onChange={v => { setGameType(v); setPage(1); }}
          style={{ width: 170 }}
          size="small"
          options={GAME_TYPES}
        />
        <Input
          placeholder="Provider..."
          value={provider}
          onChange={e => { setProvider(e.target.value); setPage(1); }}
          style={{ width: 130 }}
          allowClear
          size="small"
        />
        <RangePicker
          value={dateRange}
          onChange={v => { setDateRange(v); setPage(1); }}
          placeholder={['Từ ngày', 'Đến ngày']}
          size="small"
        />
      </Flex>

      {/* Batch action bar */}
      {selected.length > 0 && (
        <Flex align="center" gap={8} style={{ background: '#1e3a5f', padding: '8px 12px', borderRadius: 6 }}>
          <Text style={{ color: '#93c5fd', fontSize: 13 }}>Đã chọn {selected.length} game</Text>
          <Select
            size="small" value={batchStatus} onChange={setBatch} style={{ width: 140 }}
            options={[
              { value: 'active',      label: 'Kích hoạt' },
              { value: 'inactive',    label: 'Tắt' },
              { value: 'maintenance', label: 'Bảo trì' },
            ]}
          />
          <Popconfirm
            title={`Cập nhật ${selected.length} game sang "${batchStatus}"?`}
            onConfirm={() => batchMut.mutate()}
            okText="Xác nhận" cancelText="Huỷ"
          >
            <Button size="small" icon={<AppstoreOutlined />} loading={batchMut.isPending} type="primary">
              Áp dụng
            </Button>
          </Popconfirm>
          <Button size="small" onClick={() => setSelected([])}>Bỏ chọn</Button>
        </Flex>
      )}

      <Table
        dataSource={rows}
        columns={columns}
        loading={isLoading}
        rowKey="id"
        size="small"
        rowSelection={{
          selectedRowKeys: selected,
          onChange: (keys) => setSelected(keys),
        }}
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
