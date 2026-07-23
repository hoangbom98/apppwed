// frontend/admin-dashboard/src/modules/ops/pages/OperationsDashboard.jsx
// Auto-Ops Platform — Main overview dashboard
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { opsApi } from '../api';
import {
  Row, Col, Card, Statistic, Table, Tag, Button, App, Typography, Space, Flex,
} from 'antd';
import {
  TeamOutlined, CheckSquareOutlined, AlertOutlined, ReloadOutlined, PlayCircleOutlined,
  TrendingUpOutlined,
} from '@ant-design/icons';

const { Title, Text } = Typography;
const SEG_COLORS = { champion: '#f59e0b', gold: '#eab308', silver: '#94a3b8', at_risk: '#ef4444', bronze: '#92400e' };
const fmt = n => Number(n || 0).toLocaleString('vi-VN');

// ── Segment donut (SVG) ───────────────────────────────────────────────────────
function SegmentDonut({ distribution }) {
  const entries = Object.entries(distribution || {});
  const total   = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return <Text type="secondary">Chưa có dữ liệu</Text>;

  let offset = 0;
  const R = 42, CX = 56, CY = 56;
  const slices = entries.map(([seg, count]) => {
    const pct   = count / total;
    const angle = pct * 2 * Math.PI;
    const x1 = CX + R * Math.sin(offset);
    const y1 = CY - R * Math.cos(offset);
    offset += angle;
    const x2 = CX + R * Math.sin(offset);
    const y2 = CY - R * Math.cos(offset);
    const large = pct > 0.5 ? 1 : 0;
    return { seg, count, d: `M${CX},${CY} L${x1},${y1} A${R},${R} 0 ${large},1 ${x2},${y2} Z` };
  });

  return (
    <Flex align="center" gap={16}>
      <svg viewBox="0 0 112 112" style={{ width: 112, height: 112, flexShrink: 0 }}>
        {slices.map(s => <path key={s.seg} d={s.d} fill={SEG_COLORS[s.seg] || '#6b7280'} opacity="0.9" />)}
        <circle cx={CX} cy={CY} r="22" fill="#1f2937" />
        <text x={CX} y={CY + 4} textAnchor="middle" fontSize="11" fill="#e5e7eb" fontWeight="600">{total.toLocaleString()}</text>
      </svg>
      <Space direction="vertical" size={4} style={{ flex: 1, minWidth: 0 }}>
        {entries.map(([seg, count]) => (
          <Flex key={seg} align="center" gap={8}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', backgroundColor: SEG_COLORS[seg] || '#6b7280', flexShrink: 0 }} />
            <Text style={{ flex: 1, fontSize: 12 }} ellipsis>{seg}</Text>
            <Text style={{ fontSize: 12 }} type="secondary">{count}</Text>
          </Flex>
        ))}
      </Space>
    </Flex>
  );
}

export default function OperationsDashboard() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  const { data: stats, isLoading } = useQuery({
    queryKey: ['opsStats'],
    queryFn:  () => opsApi.getStats().then(r => r.data?.data),
  });

  const { data: segDist } = useQuery({
    queryKey: ['opsSegDist'],
    queryFn:  () => opsApi.getSegmentDistribution().then(r => r.data?.data ?? {}),
  });

  const { data: topCLV = [] } = useQuery({
    queryKey: ['opsTopCLV'],
    queryFn:  () => opsApi.getTopCLV(8).then(r => r.data?.data ?? []),
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['opsDailyReports'],
    queryFn:  () => opsApi.getDailyReports(7).then(r => r.data?.data ?? []),
  });

  const runReport    = useMutation({ mutationFn: opsApi.triggerDailyReport,   onSuccess: () => { message.success('Đã tạo báo cáo'); qc.invalidateQueries({ queryKey: ['opsDailyReports'] }); } });
  const runCampaigns = useMutation({ mutationFn: opsApi.runCampaigns,         onSuccess: () => message.success('Đã chạy campaign') });
  const runMarketing = useMutation({ mutationFn: opsApi.runMarketing,         onSuccess: () => message.success('Đã chạy marketing') });
  const runChurn     = useMutation({ mutationFn: opsApi.triggerChurnScan,     onSuccess: () => message.success('Đã quét churn') });
  const runRebalance = useMutation({ mutationFn: opsApi.rebalanceTasks,       onSuccess: () => { message.success('Đã cân bằng task'); qc.invalidateQueries({ queryKey: ['opsStats'] }); } });

  const reportColumns = [
    { title: 'Ngày',     dataIndex: 'date',       key: 'date' },
    { title: 'User mới', key: 'newUsers',          render: (_, r) => fmt(r.summary?.newUsers) },
    { title: 'Nạp (đ)',  key: 'deposit',           render: (_, r) => <Text style={{ color: '#4ade80' }}>{fmt(r.financial?.depositAmount)}</Text> },
    { title: 'Rút (đ)',  key: 'withdraw',          render: (_, r) => <Text style={{ color: '#f87171' }}>{fmt(r.financial?.withdrawAmount)}</Text> },
    { title: 'Net',      key: 'net',               render: (_, r) => { const v = Number(r.financial?.netRevenue || 0); return <Text style={{ color: v >= 0 ? '#4ade80' : '#f87171' }}>{fmt(v)}</Text>; } },
    { title: 'Task',     key: 'tasks',             render: (_, r) => fmt(r.operations?.tasksCompleted) },
    { title: 'Campaign', key: 'campaigns',         render: (_, r) => fmt(r.operations?.campaignsSent) },
  ];

  return (
    <div className="space-y-5">
      <Title level={4}>Vận hành tự động</Title>

      {/* KPI cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} lg={6}><Card size="small"><Statistic title="Task đang chờ"      value={stats?.tasks?.pending}       loading={isLoading} valueStyle={{ color: '#facc15' }} prefix={<CheckSquareOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card size="small"><Statistic title="Đang xử lý"        value={stats?.tasks?.inProgress}    loading={isLoading} valueStyle={{ color: '#60a5fa' }} prefix={<CheckSquareOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card size="small"><Statistic title="Hoàn thành hôm nay" value={stats?.tasks?.completedToday} loading={isLoading} valueStyle={{ color: '#4ade80' }} prefix={<CheckSquareOutlined />} /></Card></Col>
        <Col xs={12} lg={6}><Card size="small"><Statistic title="Churn rủi ro cao"  value={stats?.churn?.high}          loading={isLoading} valueStyle={{ color: '#f87171' }} prefix={<AlertOutlined />} /></Card></Col>
      </Row>

      <Row gutter={[16, 16]}>
        {/* Segment distribution */}
        <Col xs={24} lg={12}>
          <Card title="Phân khúc khách hàng (RFM)" size="small">
            <SegmentDonut distribution={segDist} />
          </Card>
        </Col>

        {/* Top CLV */}
        <Col xs={24} lg={12}>
          <Card title="Top CLV" size="small">
            {topCLV.length ? (
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                {topCLV.map((u, i) => (
                  <Flex key={u.userId} align="center" gap={8}>
                    <Text type="secondary" style={{ width: 20, textAlign: 'right', fontSize: 12 }}>{i + 1}</Text>
                    <Text style={{ flex: 1, fontSize: 13 }}>User #{u.userId}</Text>
                    <Text style={{ color: '#4ade80', fontFamily: 'monospace', fontSize: 12 }}>{fmt(u.clv)}đ</Text>
                    <Tag color={u.segment === 'champion' ? 'gold' : 'default'} style={{ marginInlineEnd: 0 }}>{u.segment}</Tag>
                  </Flex>
                ))}
              </Space>
            ) : <Text type="secondary">Chưa có dữ liệu CLV</Text>}
          </Card>
        </Col>
      </Row>

      {/* Daily reports */}
      <Card
        title="Báo cáo 7 ngày gần nhất"
        size="small"
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => runReport.mutate()} loading={runReport.isPending}>Tạo báo cáo</Button>}
      >
        <Table dataSource={reports} columns={reportColumns} rowKey="date" size="small" pagination={false} scroll={{ x: true }} />
      </Card>

      {/* Quick actions */}
      <Card title="Hành động nhanh" size="small">
        <Space wrap>
          <Button type="primary" icon={<PlayCircleOutlined />} onClick={() => runCampaigns.mutate()} loading={runCampaigns.isPending}>Chạy Campaign</Button>
          <Button icon={<TrendingUpOutlined />} onClick={() => runMarketing.mutate()} loading={runMarketing.isPending}>Marketing tự động</Button>
          <Button danger icon={<AlertOutlined />} onClick={() => runChurn.mutate()} loading={runChurn.isPending}>Quét Churn</Button>
          <Button icon={<ReloadOutlined />} onClick={() => runRebalance.mutate()} loading={runRebalance.isPending}>Cân bằng Task</Button>
        </Space>
      </Card>
    </div>
  );
}
