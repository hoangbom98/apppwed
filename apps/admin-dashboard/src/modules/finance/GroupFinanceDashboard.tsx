/**
 * GroupFinanceDashboard.tsx — Tổng quan tài chính tập đoàn
 *
 * Layout:
 *  Row 1 — 5 KPI cards: Tổng phí, P&L ròng, Group Wallet, Tổng cược, Tổng thắng
 *  Row 2 — Biểu đồ P&L by source (BarChart) + bảng Project Balances
 *  Row 3 — Fee logs gần nhất (paginated, filter by source)
 */
import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import {
  Card, Col, Row, Statistic, Table, Tag, Typography, Spin, Alert, Space,
  Flex, Button, Select, DatePicker, App, Tooltip, Progress,
} from 'antd';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTip,
  ResponsiveContainer, Legend, Cell,
} from 'recharts';
import {
  BankOutlined, RiseOutlined, FallOutlined, FieldTimeOutlined,
  DollarOutlined, ThunderboltOutlined, SyncOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { groupFinanceApi } from './api';
import { fmtVNDCompact as vnd, fmtVND as vndFull } from '@admin/modules/shared/utils/formatters';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

const SOURCE_COLOR: Record<string, string> = {
  GAME:   '#3b82f6',
  SPORTS: '#10b981',
  TRADE:  '#f59e0b',
  DATING: '#ec4899',
  HUB:    '#8b5cf6',
};
const SOURCE_LABEL: Record<string, string> = {
  GAME:   'Game',
  SPORTS: 'Sports',
  TRADE:  'Trade',
  DATING: 'Dating',
  HUB:    'Hub',
};

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({
  icon, title, value, color = '#3b82f6', suffix = '', loading = false,
}: {
  icon: React.ReactNode; title: string; value: number | string;
  color?: string; suffix?: string; loading?: boolean;
}) {
  return (
    <Card size="small" styles={{ body: { padding: '14px 16px' } }}>
      <Flex gap={12} align="center">
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color, fontSize: 18, flexShrink: 0,
        }}>
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#8c8c8c', marginBottom: 2 }}>{title}</div>
          {loading
            ? <Spin size="small" />
            : <div style={{ fontSize: 18, fontWeight: 800, color }}>
                {typeof value === 'number' ? vnd(value) : value}
                {suffix && <span style={{ fontSize: 12, fontWeight: 400, marginLeft: 4, color: '#8c8c8c' }}>{suffix}</span>}
              </div>
          }
        </div>
      </Flex>
    </Card>
  );
}

// ── Project Balance row card ──────────────────────────────────────────────────
function BalanceRow({ row }: { row: any }) {
  const balance = Number(row.balance);
  const isNegative = balance < 0;
  const maxBar = Math.max(Math.abs(balance), 1);
  const pct = Math.min(100, (Math.abs(balance) / maxBar) * 100);

  return (
    <div style={{
      padding: '12px 14px',
      borderRadius: 8,
      background: isNegative ? '#ff4d4f10' : '#52c41a10',
      border: `1px solid ${isNegative ? '#ff4d4f30' : '#52c41a30'}`,
    }}>
      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
        <Flex gap={8} align="center">
          <div style={{
            width: 10, height: 10, borderRadius: '50%',
            background: SOURCE_COLOR[row.source] ?? '#8b5cf6',
          }} />
          <Text strong style={{ fontSize: 13 }}>{SOURCE_LABEL[row.source] ?? row.source}</Text>
        </Flex>
        <Text strong style={{ color: isNegative ? '#ff4d4f' : '#52c41a', fontFamily: 'monospace', fontSize: 13 }}>
          {isNegative ? '–' : '+'}{vndFull(Math.abs(balance))}
        </Text>
      </Flex>
      <Progress
        percent={pct}
        size="small"
        strokeColor={isNegative ? '#ff4d4f' : '#52c41a'}
        showInfo={false}
        style={{ marginBottom: 4 }}
      />
      <Flex justify="space-between">
        <Text style={{ fontSize: 10, color: '#8c8c8c' }}>Cược: {vnd(Number(row.totalBet))}</Text>
        <Text style={{ fontSize: 10, color: '#8c8c8c' }}>Thắng: {vnd(Number(row.totalWin))}</Text>
        <Text style={{ fontSize: 10, color: '#3b82f6' }}>Phí: {vnd(Number(row.totalFee))}</Text>
      </Flex>
    </div>
  );
}

// ── Fee log columns ───────────────────────────────────────────────────────────
const feeLogColumns = [
  {
    title: 'Thời gian', dataIndex: 'createdAt', key: 'time', width: 140,
    render: (v: string) => <Text style={{ fontSize: 11, color: '#8c8c8c' }}>{new Date(v).toLocaleString('vi-VN')}</Text>,
  },
  {
    title: 'Dự án', dataIndex: 'source', key: 'source', width: 80,
    render: (v: string) => <Tag color={SOURCE_COLOR[v] ?? 'default'} style={{ fontSize: 11 }}>{SOURCE_LABEL[v] ?? v}</Tag>,
  },
  {
    title: 'Loại GD', dataIndex: 'txType', key: 'txType', width: 80,
    render: (v: string) => <Tag style={{ fontSize: 11 }}>{v}</Tag>,
  },
  {
    title: 'Gộp (gross)', dataIndex: 'grossAmount', key: 'gross', width: 110,
    render: (v: number) => <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{vndFull(v)}</Text>,
  },
  {
    title: 'Phí thu', dataIndex: 'feeAmount', key: 'fee', width: 110,
    render: (v: number) => <Text strong style={{ fontFamily: 'monospace', fontSize: 12, color: '#3b82f6' }}>{vndFull(v)}</Text>,
  },
  {
    title: 'Thực nhận', dataIndex: 'netAmount', key: 'net', width: 110,
    render: (v: number) => <Text style={{ fontFamily: 'monospace', fontSize: 12, color: '#52c41a' }}>{vndFull(v)}</Text>,
  },
  {
    title: 'User ID', dataIndex: 'userId', key: 'uid', width: 120,
    render: (v: string) => <Text style={{ fontSize: 11, color: '#8c8c8c', fontFamily: 'monospace' }}>{v?.slice(-8)}</Text>,
  },
];

// ── Main Dashboard ────────────────────────────────────────────────────────────
export default function GroupFinanceDashboard() {
  const { message } = App.useApp();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'day'), dayjs(),
  ]);
  const [feeSource, setFeeSource]   = useState<string>('');
  const [feeLogPage, setFeeLogPage] = useState(1);

  const from = dateRange[0].format('YYYY-MM-DD');
  const to   = dateRange[1].format('YYYY-MM-DD');

  const { data: pnlData, isLoading: pnlLoading } = useQuery({
    queryKey: ['group-pnl', from, to],
    queryFn:  () => groupFinanceApi.pnl(from, to),
    staleTime: 60_000,
  });

  const { data: balanceData, isLoading: balLoading } = useQuery({
    queryKey: ['project-balances'],
    queryFn:  groupFinanceApi.projectBalances,
    staleTime: 30_000,
  });

  const { data: feeLogData, isLoading: feeLoading } = useQuery({
    queryKey: ['fee-logs', feeSource, feeLogPage],
    queryFn:  () => groupFinanceApi.feeLogs({ source: feeSource || undefined, page: feeLogPage, limit: 15 }),
    staleTime: 30_000,
  });

  const interestMut = useMutation({
    mutationFn: groupFinanceApi.runInterest,
    onSuccess:  () => message.success('Tính lãi nội bộ hoàn tất!'),
    onError:    () => message.error('Lỗi khi tính lãi'),
  });

  // ── Derived metrics ───────────────────────────────────────────────────────
  const pnlRaw: any = pnlData;
  const pnlBySource: Record<string, any> = pnlRaw?.pnlBySource ?? {};
  const totals: any = pnlRaw?.totals ?? { totalFee: 0, totalInterest: 0, groupNetRevenue: 0 };
  const balances: any[] = Array.isArray(balanceData) ? balanceData : [];

  const totalBet  = Object.values(pnlBySource).reduce((s: number, p: any) => s + (p.totalBet  ?? 0), 0);
  const totalWin  = Object.values(pnlBySource).reduce((s: number, p: any) => s + (p.totalWin  ?? 0), 0);
  const totalFeeSum = totals.totalFee ?? 0;

  // ── Bar chart data ────────────────────────────────────────────────────────
  const chartData = Object.entries(pnlBySource).map(([src, p]: [string, any]) => ({
    name:     SOURCE_LABEL[src] ?? src,
    source:   src,
    fee:      Math.round(Number(p.totalFee  ?? 0)),
    interest: Math.round(Number(p.totalInterest ?? 0)),
    revenue:  Math.round(Number(p.netRevenue    ?? 0)),
  }));

  const feeLogItems: any[] = (feeLogData as any)?.items ?? [];
  const feeLogTotal: number = (feeLogData as any)?.total ?? 0;

  return (
    <div>
      <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 20 }}>
        <Title level={4} style={{ margin: 0 }}>
          <BankOutlined style={{ marginRight: 8, color: '#3b82f6' }} />
          Tài chính tập đoàn — Gộp vốn, Tách lợi nhuận
        </Title>

        <Flex gap={10} wrap="wrap" align="center">
          <RangePicker
            size="small"
            value={dateRange}
            onChange={(v) => v && setDateRange(v as any)}
            format="DD/MM/YYYY"
            style={{ width: 230 }}
          />
          <Tooltip title="Tính lãi vay nội bộ cho các BU âm số dư (chạy tự động lúc 00:05 hàng ngày)">
            <Button
              size="small" icon={<SyncOutlined />}
              loading={interestMut.isPending}
              onClick={() => interestMut.mutate()}
            >
              Tính lãi nội bộ
            </Button>
          </Tooltip>
        </Flex>
      </Flex>

      {/* ── KPI Row ────────────────────────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={12} sm={8} lg={4} xl={4}>
          <KpiCard icon={<DollarOutlined />}   title="Phí thu (kỳ)" value={totalFeeSum}       color="#3b82f6" loading={pnlLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4} xl={4}>
          <KpiCard icon={<RiseOutlined />}     title="Doanh thu ròng" value={totals.groupNetRevenue} color="#10b981" loading={pnlLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4} xl={4}>
          <KpiCard icon={<FieldTimeOutlined />} title="Lãi nội bộ" value={totals.totalInterest ?? 0} color="#f59e0b" loading={pnlLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4} xl={4}>
          <KpiCard icon={<ThunderboltOutlined />} title="Tổng cược (kỳ)" value={totalBet} color="#8b5cf6" loading={pnlLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4} xl={4}>
          <KpiCard icon={<FallOutlined />}     title="Tổng thắng (kỳ)" value={totalWin}   color="#ec4899" loading={pnlLoading} />
        </Col>
        <Col xs={12} sm={8} lg={4} xl={4}>
          <KpiCard
            icon={<BankOutlined />}
            title="Số dư BUs dương"
            value={balances.filter((b: any) => Number(b.balance) >= 0).length + '/' + balances.length}
            color="#52c41a"
            loading={balLoading}
          />
        </Col>
      </Row>

      {/* ── Chart + Project Balances ─────────────────────────────────────── */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>

        {/* Bar chart P&L by source */}
        <Col xs={24} lg={14}>
          <Card
            size="small"
            title={<Text strong style={{ fontSize: 13 }}>P&L theo dự án (kỳ {from} → {to})</Text>}
            styles={{ body: { padding: '12px 8px' } }}
          >
            {pnlLoading
              ? <div style={{ height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>
              : chartData.length === 0
              ? <Alert message="Chưa có dữ liệu trong kỳ này" type="info" showIcon style={{ margin: 8 }} />
              : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tickFormatter={(v) => vnd(v)} tick={{ fontSize: 10 }} width={60} />
                    <RechartsTip formatter={(v: number) => vndFull(v)} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="fee" name="Phí thu" radius={[4, 4, 0, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={SOURCE_COLOR[entry.source] ?? '#8b5cf6'} />
                      ))}
                    </Bar>
                    <Bar dataKey="revenue" name="Doanh thu ròng" fill="#10b98140" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            }
          </Card>
        </Col>

        {/* Project Balance cards */}
        <Col xs={24} lg={10}>
          <Card
            size="small"
            title={<Text strong style={{ fontSize: 13 }}>Số dư Pool từng BU</Text>}
            extra={<Tooltip title="Số âm = BU đang vay nội bộ từ tập đoàn (tính lãi hàng ngày)"><Text style={{ fontSize: 11, color: '#8c8c8c' }}>ⓘ Nền đỏ = âm</Text></Tooltip>}
            styles={{ body: { padding: 12 } }}
          >
            {balLoading
              ? <Spin />
              : balances.length === 0
              ? <Alert message="Chưa có dữ liệu số dư" type="info" showIcon />
              : (
                <Space direction="vertical" style={{ width: '100%' }} size={8}>
                  {balances.map((b: any) => <BalanceRow key={b.source} row={b} />)}
                </Space>
              )
            }
          </Card>
        </Col>
      </Row>

      {/* ── Fee Logs ─────────────────────────────────────────────────────── */}
      <Card
        size="small"
        title={<Text strong style={{ fontSize: 13 }}>Nhật ký phí thu</Text>}
        extra={
          <Select
            size="small" style={{ width: 120 }} placeholder="Tất cả BU"
            allowClear value={feeSource || undefined}
            onChange={(v) => { setFeeSource(v ?? ''); setFeeLogPage(1); }}
            options={[
              { label: 'Game',   value: 'GAME'   },
              { label: 'Sports', value: 'SPORTS' },
              { label: 'Trade',  value: 'TRADE'  },
              { label: 'Dating', value: 'DATING' },
              { label: 'Hub',    value: 'HUB'    },
            ]}
          />
        }
      >
        <Table
          dataSource={feeLogItems}
          columns={feeLogColumns}
          rowKey="id"
          loading={feeLoading}
          size="small"
          scroll={{ x: 700 }}
          pagination={{
            current:     feeLogPage,
            pageSize:    15,
            total:       feeLogTotal,
            showTotal:   (t) => `${t} bản ghi`,
            onChange:    (p) => setFeeLogPage(p),
            showSizeChanger: false,
          }}
        />
      </Card>
    </div>
  );
}
