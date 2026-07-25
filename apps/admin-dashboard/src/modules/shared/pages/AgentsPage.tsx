// @ts-nocheck
// frontend/admin-dashboard/src/modules/shared/pages/AgentsPage.jsx
// Agent management: list, detail modal with team stats, commission calculator + payout.
// Route: /agents
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Table, Button, Tag, Input, Select, Modal, Tabs, Typography,
  Descriptions, Statistic, Row, Col, Space, App, Flex,
} from 'antd';
import {
  SearchOutlined, DollarOutlined, TeamOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;

function fmt(n)     { return n == null ? '—' : Number(n).toLocaleString('vi-VN') + ' ₫'; }
function fmtNum(n)  { return n == null ? '0' : Number(n).toLocaleString('vi-VN'); }
function fmtTime(s) { return s ? new Date(s).toLocaleString('vi-VN') : '—'; }

const STATUS_COLOR = { ACTIVE: 'success', PAUSED: 'warning', BANNED: 'error' };

// ── Commission history sub-tab ────────────────────────────────────────────────
function CommissionHistory({ agentId }) {
  const { message } = App.useApp();
  const [calcPeriod, setCalcPeriod] = useState('');
  const qc = useQueryClient();

  const { data: detail } = useQuery({
    queryKey: ['admin-agent-detail', agentId],
    queryFn:  () => api.get(`/admin/agents/${agentId}`).then(r => r.data?.data ?? r.data),
    enabled:  !!agentId,
  });
  const commissions = detail?.commissions ?? [];

  const calcMut = useMutation({
    mutationFn: () => api.post(`/admin/agents/${agentId}/commission/calculate`, { period: calcPeriod }),
    onSuccess:  () => { message.success('Đã tính hoa hồng'); qc.invalidateQueries({ queryKey: ['admin-agent-detail', agentId] }); },
    onError:    e  => message.error(e.response?.data?.message ?? 'Lỗi tính hoa hồng'),
  });

  const payMut = useMutation({
    mutationFn: (commId) => api.post(`/admin/agents/${agentId}/commission/${commId}/pay`),
    onSuccess:  () => { message.success('Đã thanh toán'); qc.invalidateQueries({ queryKey: ['admin-agent-detail', agentId] }); },
    onError:    e  => message.error(e.response?.data?.message ?? 'Lỗi thanh toán'),
  });

  const commColumns = [
    { title: 'Kỳ',         dataIndex: 'period',      key: 'period',    render: v => <Text code>{v}</Text> },
    { title: 'Tổng cược',  dataIndex: 'totalBet',    key: 'totalBet',  render: v => <Text className="text-xs">{fmt(v)}</Text> },
    { title: 'Lợi nhuận',  dataIndex: 'netProfit',   key: 'netProfit', render: v => <Text className="text-xs">{fmt(v)}</Text> },
    { title: 'Tỷ lệ',      dataIndex: 'rate',        key: 'rate',      render: v => `${v}%` },
    { title: 'Hoa hồng',   dataIndex: 'amount',      key: 'amount',    render: v => <Text className="font-semibold">{fmt(v)}</Text> },
    { title: 'TT',         dataIndex: 'status',      key: 'status',    render: v => <Tag color={v === 'paid' ? 'success' : 'warning'}>{v === 'paid' ? 'Đã TT' : 'Chờ TT'}</Tag> },
    {
      title: '', key: 'pay', width: 90,
      render: (_, c) => c.status === 'pending' ? (
        <Button size="small" type="primary" loading={payMut.isPending} onClick={() => payMut.mutate(c.id)}>Thanh toán</Button>
      ) : null,
    },
  ];

  return (
    <div className="space-y-3">
      <Flex gap={8} align="flex-end" wrap="wrap">
        <div>
          <Text type="secondary" className="text-[11px] block mb-1">Tính hoa hồng kỳ (YYYY-MM)</Text>
          <Input size="small" value={calcPeriod} onChange={e => setCalcPeriod(e.target.value)} placeholder="2025-01" className="w-28" />
        </div>
        <Button size="small" type="primary" loading={calcMut.isPending} disabled={!calcPeriod} onClick={() => calcMut.mutate()}>
          Tính hoa hồng
        </Button>
      </Flex>
      {commissions.length === 0
        ? <Text type="secondary" className="text-sm">Chưa có hoa hồng</Text>
        : <Table dataSource={commissions} columns={commColumns} rowKey="id" size="small" pagination={false} />
      }
    </div>
  );
}

// ── Agent detail modal ─────────────────────────────────────────────────────────
function AgentDetailModal({ agentId, onClose }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-agent-detail', agentId],
    queryFn:  () => api.get(`/admin/agents/${agentId}`).then(r => r.data?.data ?? r.data),
    enabled:  !!agentId,
  });

  const agent = data;
  const user  = agent?.user ?? {};
  const stats = agent?.teamStats ?? {};

  return (
    <Modal open={!!agentId} onCancel={onClose} footer={null} title={`Chi tiết đại lý — ${user.username ?? agentId}`} width={680} destroyOnHidden>
      {isLoading ? (
        <div className="py-8 text-center"><Text type="secondary">Đang tải...</Text></div>
      ) : !agent ? (
        <div className="py-8 text-center"><Text type="secondary">Không tìm thấy</Text></div>
      ) : (
        <>
          <Row gutter={[16, 16]} className="mb-4">
            <Col span={6}><Statistic title="Thành viên"   value={fmtNum(stats.memberCount)} prefix={<TeamOutlined />} /></Col>
            <Col span={6}><Statistic title="Tổng nạp nhóm" value={fmt(stats.totalDeposit)} valueStyle={{ fontSize: 14 }} /></Col>
            <Col span={6}><Statistic title="Tổng cược nhóm" value={fmt(stats.totalBet)} valueStyle={{ fontSize: 14 }} /></Col>
            <Col span={6}><Statistic title="Tỷ lệ HH" value={`${agent.commissionRate}%`} prefix={<DollarOutlined />} /></Col>
          </Row>
          <Tabs
            items={[
              {
                key: 'info', label: 'Thông tin',
                children: (
                  <Descriptions column={2} size="small" bordered>
                    <Descriptions.Item label="Username">{user.username}</Descriptions.Item>
                    <Descriptions.Item label="Họ tên">{user.fullName ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{user.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{user.phone ?? '—'}</Descriptions.Item>
                    <Descriptions.Item label="Số dư">{fmt(user.balance)}</Descriptions.Item>
                    <Descriptions.Item label="Tổng nạp">{fmt(user.totalDeposit)}</Descriptions.Item>
                    <Descriptions.Item label="Cấp độ">{`Level ${agent.level}`}</Descriptions.Item>
                    <Descriptions.Item label="Trạng thái"><Tag color={STATUS_COLOR[agent.status] ?? 'default'}>{agent.status}</Tag></Descriptions.Item>
                    <Descriptions.Item label="Ngày tham gia">{fmtTime(agent.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label="Tổng HH đã nhận">{fmt(agent.totalCommission)}</Descriptions.Item>
                  </Descriptions>
                ),
              },
              { key: 'commission', label: 'Hoa hồng', children: <CommissionHistory agentId={agentId} /> },
            ]}
          />
        </>
      )}
    </Modal>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function AgentsPage() {
  const [page,     setPage]     = useState(1);
  const [search,   setSearch]   = useState('');
  const [level,    setLevel]    = useState('');
  const [status,   setStatus]   = useState('');
  const [detailId, setDetailId] = useState(null);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-agents', page, search, level, status],
    queryFn:  () => api.get('/admin/agents', {
      params: { page, limit: 20, search: search || undefined, level: level || undefined, status: status || undefined },
    }).then(r => r.data),
    staleTime: 30_000,
  });

  const rows  = data?.data ?? [];
  const total = data?.meta?.total ?? data?.total ?? 0;

  const columns = [
    { title: 'Username',    key: 'username',  render: (_, a) => <Text strong>{a.user?.username ?? '—'}</Text> },
    { title: 'Cấp',         dataIndex: 'level',            render: v => `Level ${v}` },
    { title: 'Tỷ lệ HH',    dataIndex: 'commissionRate',   render: v => <Text className="font-semibold">{v}%</Text> },
    { title: 'Thành viên',  key: 'members',  render: (_, a) => fmtNum(a._count?.commissions ?? a.totalMembers) },
    { title: 'HH đã nhận',  dataIndex: 'totalCommission',  render: v => <Text className="text-xs">{fmt(v)}</Text> },
    { title: 'HH chờ TT',   dataIndex: 'pendingCommission',render: v => <Text className="text-xs">{fmt(v)}</Text> },
    { title: 'TT',          dataIndex: 'status',            render: v => <Tag color={STATUS_COLOR[v] ?? 'default'}>{v}</Tag> },
    { title: 'Ngày gia nhập', dataIndex: 'createdAt',      render: v => <Text type="secondary" className="text-xs">{fmtTime(v)}</Text> },
    {
      title: '', key: 'action', width: 80,
      render: (_, a) => <Button size="small" onClick={() => setDetailId(a.id)}>Chi tiết</Button>,
    },
  ];

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} className="mb-4">
        <Title level={4} className="m-0">Quản lý đại lý</Title>
        <Text type="secondary" className="text-xs">Tổng: {fmtNum(total)} đại lý</Text>
      </Flex>

      <Flex gap={8} wrap="wrap" className="mb-4">
        <Input allowClear prefix={<SearchOutlined />} placeholder="Tìm username..." className="w-[200px]" value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }} />
        <Select className="w-[130px]" value={level} onChange={v => { setLevel(v); setPage(1); }}
          options={[{ label: 'Tất cả cấp', value: '' }, ...[1,2,3].map(l => ({ label: `Level ${l}`, value: l }))]}
        />
        <Select className="w-[130px]" value={status} onChange={v => { setStatus(v); setPage(1); }}
          options={[{ label: 'Tất cả TT', value: '' }, ...['ACTIVE','PAUSED','BANNED'].map(s => ({ label: s, value: s }))]}
        />
      </Flex>

      <Table
        dataSource={rows} columns={columns} rowKey="id"
        loading={isLoading} size="small" scroll={{ x: 900 }}
        pagination={{ current: page, pageSize: 20, total, showSizeChanger: false, showTotal: t => `${t} đại lý`, onChange: p => setPage(p) }}
      />

      <AgentDetailModal agentId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}
