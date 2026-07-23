// frontend/admin-dashboard/src/modules/shared/pages/Dashboard.jsx
// Ant Design — Statistic, Card, Row, Col, Table, Spin, Segmented
import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Row, Col, Card, Statistic, Table, Tag, Spin, Typography, Segmented,
  theme, Flex,
} from 'antd';
import {
  TeamOutlined, DollarOutlined, CreditCardOutlined, ArrowUpOutlined,
  ArrowDownOutlined, FireOutlined, RadarChartOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';
import { useSiteConfig } from '@admin/core/hooks/useSiteConfig';

const { Title, Text } = Typography;

// ── Simple SVG bar chart (no dep needed) ──────────────────────────────────────
function RevenueChart({ points = [], title = 'Doanh thu' }) {
  if (!points.length) return null;
  const { token } = theme.useToken();
  const W = 560, H = 110, PAD = 10;
  const max  = Math.max(...points.map(p => p.value), 1);
  const step = (W - PAD * 2) / (points.length - 1 || 1);
  const barW = Math.max(6, step * 0.6);

  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>{title} (₫)</Text>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 110, marginTop: 8 }}>
        {[0, 0.5, 1].map(f => {
          const y = H - PAD - f * (H - PAD * 2);
          return <line key={f} x1={PAD} y1={y} x2={W - PAD} y2={y} stroke={token.colorBorder} strokeWidth={1} strokeDasharray="4,4" />;
        })}
        {points.map((p, i) => {
          const x  = PAD + i * step;
          const y  = H - PAD - ((p.value / max) * (H - PAD * 2));
          const bh = H - PAD - y;
          return (
            <g key={i}>
              <rect x={x - barW / 2} y={y} width={barW} height={bh} rx={4}
                fill={token.colorPrimary} opacity={0.8} />
              <text x={x} y={H} fontSize={9} fill={token.colorTextTertiary} textAnchor="middle">
                {p.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── By-project horizontal bars ────────────────────────────────────────────────
function ProjectBars({ byProject }) {
  if (!byProject) return null;
  const { token } = theme.useToken();
  const entries = Object.entries(byProject);
  const maxVal  = Math.max(...entries.map(([, v]) => v), 1);
  const COLORS  = {
    game:   '#3b82f6', dating: '#ec4899', sports: '#10b981',
    trade:  '#f59e0b', hub:    '#8b5cf6',
  };
  return (
    <div>
      <Text type="secondary" style={{ fontSize: 12, fontWeight: 600 }}>Users theo dự án</Text>
      <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
        {entries.map(([proj, count]) => (
          <Flex key={proj} align="center" gap={10}>
            <Text style={{ width: 56, fontSize: 12, textTransform: 'capitalize', color: token.colorTextSecondary }}>
              {proj}
            </Text>
            <div style={{ flex: 1, background: token.colorFillTertiary, borderRadius: 99, height: 8, overflow: 'hidden' }}>
              <div style={{
                width: `${(count / maxVal) * 100}%`,
                height: '100%',
                borderRadius: 99,
                background: COLORS[proj] ?? token.colorPrimary,
                transition: 'width .4s ease',
              }} />
            </div>
            <Text style={{ width: 48, fontSize: 12, textAlign: 'right' }}>
              {Number(count).toLocaleString()}
            </Text>
          </Flex>
        ))}
      </div>
    </div>
  );
}

// ── Recent transactions table columns ─────────────────────────────────────────
const TX_COLUMNS = [
  { title: 'User',      dataIndex: ['user','username'], key: 'user',
    render: (_, r) => r.user?.username ?? r.user?.email ?? r.userId },
  { title: 'Loại',      dataIndex: 'type', key: 'type',
    render: v => <Tag color={v === 'deposit' ? 'success' : 'error'}>{v === 'deposit' ? 'Nạp' : 'Rút'}</Tag> },
  { title: 'Số tiền',   dataIndex: 'amount', key: 'amount',
    render: v => <Text style={{ fontFamily: 'monospace', fontWeight: 600 }}>{Number(v).toLocaleString('vi')}₫</Text> },
  { title: 'Trạng thái',dataIndex: 'status', key: 'status',
    render: v => {
      const map = { completed: 'success', pending: 'warning', rejected: 'error' };
      return <Tag color={map[v] ?? 'default'}>{v}</Tag>;
    },
  },
  { title: 'Thời gian', dataIndex: 'createdAt', key: 'time',
    render: v => <Text type="secondary" style={{ fontSize: 12 }}>{new Date(v).toLocaleString('vi')}</Text> },
];

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { appName }  = useSiteConfig();
  const [chartDays, setChartDays] = useState(7);
  const { token }    = theme.useToken();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn:  () => api.get('/admin/dashboard').then(r => r.data?.data ?? r.data),
    staleTime: 30_000,
  });

  const { data: financeData } = useQuery({
    queryKey: ['admin-finance-stats'],
    queryFn:  () => api.get('/admin/stats/finance').then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
  });

  const { data: chartData } = useQuery({
    queryKey: ['admin-revenue-chart', chartDays],
    queryFn:  () => api.get('/admin/stats/revenue-chart', { params: { days: chartDays } })
                      .then(r => r.data?.data ?? r.data ?? []),
    staleTime: 60_000,
  });

  // ── KPI stats ────────────────────────────────────────────────────────────────
  const KPI = [
    { title: 'Tổng users',         value: data?.users?.total ?? 0,                icon: <TeamOutlined />,         color: token.colorPrimary,    suffix: null,     prefix: null, sub: data?.users?.newToday ? `+${data.users.newToday} hôm nay` : null },
    { title: 'Nạp tiền hôm nay',   value: data?.finance?.todayDeposits ?? 0,      icon: <DollarOutlined />,       color: '#10b981',             formatter: v => Number(v).toLocaleString('vi') + '₫' },
    { title: 'Chờ duyệt nạp',      value: data?.finance?.pendingDeposits ?? 0,    icon: <CreditCardOutlined />,   color: '#f59e0b' },
    { title: 'Chờ duyệt rút',      value: data?.finance?.pendingWithdrawals ?? 0, icon: <ArrowDownOutlined />,    color: '#f97316' },
    { title: 'Cược đang hoạt động',value: data?.activity?.activeBets ?? 0,        icon: <FireOutlined />,         color: '#a855f7' },
    { title: 'Livestream đang chạy',value: data?.activity?.liveStreamers ?? 0,    icon: <RadarChartOutlined />,   color: '#ec4899' },
  ];

  // ── Finance summary row items ─────────────────────────────────────────────
  const FINANCE_ITEMS = financeData ? [
    { label: 'Nạp hôm nay',  value: financeData.today?.deposit,  color: '#10b981', icon: <ArrowUpOutlined /> },
    { label: 'Rút hôm nay',  value: financeData.today?.withdraw, color: '#ef4444', icon: <ArrowDownOutlined /> },
    { label: 'Net hôm nay',  value: financeData.today?.net,      color: Number(financeData.today?.net) >= 0 ? '#10b981' : '#ef4444' },
    { label: 'Nạp tháng',    value: financeData.month?.deposit,  color: '#3b82f6' },
    { label: 'Rút tháng',    value: financeData.month?.withdraw, color: '#f97316' },
    { label: 'Net tháng',    value: financeData.month?.net,      color: Number(financeData.month?.net) >= 0 ? '#10b981' : '#ef4444' },
  ] : [];

  // ── Chart points ─────────────────────────────────────────────────────────
  const revenuePoints = Array.isArray(chartData)
    ? chartData.map(d => ({ label: (d.date ?? d.day ?? '').slice(5) || d.date, value: Number(d.deposit ?? d.amount ?? d.value ?? 0) }))
    : [];
  const fallbackPoints = data?.revenueChart?.length
    ? data.revenueChart.map(d => ({ label: d.date?.slice(5) ?? d.day, value: Number(d.amount ?? d.value ?? 0) }))
    : [];
  const chartPoints = revenuePoints.length ? revenuePoints : fallbackPoints;

  return (
    <Spin spinning={isLoading} tip="Đang tải...">
      <Title level={4} style={{ marginBottom: 20 }}>Dashboard</Title>

      {/* ── KPI cards ─────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {KPI.map(k => (
          <Col key={k.title} xs={12} sm={8} xl={4}>
            <Card size="small" bordered={false} style={{ background: token.colorBgContainer }}>
              <Flex align="center" gap={12}>
                <div style={{
                  width: 38, height: 38, borderRadius: 8,
                  background: k.color + '22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: k.color, flexShrink: 0,
                }}>
                  {k.icon}
                </div>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: token.colorText, lineHeight: 1.2 }}>
                    {k.formatter ? k.formatter(k.value) : Number(k.value).toLocaleString()}
                  </div>
                  <div style={{ fontSize: 11, color: token.colorTextSecondary, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {k.title}
                  </div>
                  {k.sub && <div style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>{k.sub}</div>}
                </div>
              </Flex>
            </Card>
          </Col>
        ))}
      </Row>

      {/* ── Finance summary ────────────────────────────────────────────── */}
      {FINANCE_ITEMS.length > 0 && (
        <Row gutter={[12, 12]} style={{ marginBottom: 20 }}>
          {FINANCE_ITEMS.map(it => (
            <Col key={it.label} xs={12} sm={8} md={4}>
              <Card size="small" bordered={false} style={{ background: token.colorBgContainer }}>
                <div style={{ fontSize: 11, color: token.colorTextSecondary, marginBottom: 4 }}>{it.label}</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: it.color }}>
                  {it.value != null ? Number(it.value).toLocaleString('vi') + '₫' : '—'}
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      {/* ── Charts ─────────────────────────────────────────────────────── */}
      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        {chartPoints.length > 0 && (
          <Col xs={24} lg={12}>
            <Card size="small" bordered={false} style={{ background: token.colorBgContainer }}
              title={<Text style={{ fontSize: 12, fontWeight: 600 }}>Biểu đồ nạp tiền</Text>}
              extra={
                <Segmented
                  size="small"
                  value={chartDays}
                  onChange={setChartDays}
                  options={[
                    { label: '7d',  value: 7  },
                    { label: '14d', value: 14 },
                    { label: '30d', value: 30 },
                  ]}
                />
              }
            >
              <RevenueChart points={chartPoints} title={`Nạp tiền ${chartDays} ngày`} />
            </Card>
          </Col>
        )}
        {data?.users?.byProject && (
          <Col xs={24} lg={12}>
            <Card size="small" bordered={false} style={{ background: token.colorBgContainer }}>
              <ProjectBars byProject={data.users.byProject} />
            </Card>
          </Col>
        )}
      </Row>

      {/* ── Recent transactions ─────────────────────────────────────────── */}
      {data?.recentTransactions?.length > 0 && (
        <Card
          size="small"
          title={<Text style={{ fontSize: 13, fontWeight: 600 }}>Giao dịch gần đây</Text>}
          bordered={false}
          style={{ background: token.colorBgContainer }}
        >
          <Table
            dataSource={data.recentTransactions}
            columns={TX_COLUMNS}
            rowKey="id"
            size="small"
            pagination={false}
            scroll={{ x: 600 }}
          />
        </Card>
      )}

      {!isLoading && !data && (
        <Text type="secondary">
          Chào mừng đến <Text strong style={{ color: token.colorPrimary }}>{appName}</Text>.
          Chọn mục từ sidebar để quản lý.
        </Text>
      )}
    </Spin>
  );
}
