// frontend/admin-dashboard/src/modules/sports/pages/SportsOverviewPage.tsx
// Sports admin overview: live match count, total bets, active users, recent bets & matches.
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, Col, Row, Statistic, Table, Tag, Typography, Spin, Alert, Button, Space, Flex } from 'antd';
import {
  TrophyOutlined, ThunderboltOutlined, TeamOutlined, DollarOutlined,
  SyncOutlined, PlayCircleOutlined,
} from '@ant-design/icons';
import { getSportsStats, adminMatches, adminBets } from '../api';

const { Title, Text } = Typography;

const MATCH_STATUS_TAG: Record<string, string> = {
  live: 'success', scheduled: 'processing', finished: 'default',
  postponed: 'warning', cancelled: 'error',
};
const BET_STATUS_TAG: Record<string, string> = {
  pending: 'warning', won: 'success', lost: 'error', void: 'default',
};

// ── Mini stat card ─────────────────────────────────────────────────────────────
function StatCard({ title, value, prefix, suffix, color }:
  { title: string; value: number | string; prefix?: React.ReactNode; suffix?: string; color?: string }) {
  return (
    <Card size="small" style={{ height: '100%' }}>
      <Statistic
        title={title}
        value={value}
        prefix={prefix}
        suffix={suffix}
        valueStyle={{ color: color ?? '#1677ff', fontWeight: 700 }}
      />
    </Card>
  );
}

export default function SportsOverviewPage() {
  const { data: liveMatches, isLoading: loadingLive } = useQuery({
    queryKey: ['sports-admin-live-matches'],
    queryFn:  () => adminMatches.list({ status: 'live', limit: 10 }).then((r: any) => r.data?.data ?? []),
    refetchInterval: 30_000,
  });

  const { data: recentBets, isLoading: loadingBets } = useQuery({
    queryKey: ['sports-admin-recent-bets'],
    queryFn:  () => adminBets.list({ limit: 8, sortBy: 'createdAt', order: 'desc' }).then((r: any) => r.data?.data ?? []),
    refetchInterval: 30_000,
  });

  const { data: statsRaw, isLoading: loadingStats } = useQuery({
    queryKey: ['sports-admin-overview-stats'],
    queryFn:  getSportsStats,
    staleTime: 60_000,
  });

  // Derive counts from what we have
  const liveCount      = (liveMatches ?? []).length;
  const pendingBets    = (recentBets  ?? []).filter((b: any) => b.status === 'pending').length;
  const totalBetAmount = (recentBets  ?? []).reduce((sum: number, b: any) => sum + Number(b.amount ?? b.stake ?? 0), 0);

  const stats = statsRaw?.sports ?? statsRaw ?? {};

  const matchColumns = [
    {
      title: 'Trận đấu', key: 'match',
      render: (_: unknown, m: any) => (
        <span style={{ fontWeight: 600 }}>
          {m.homeTeam?.name ?? m.homeTeamId} <Text type="secondary">vs</Text> {m.awayTeam?.name ?? m.awayTeamId}
        </span>
      ),
    },
    {
      title: 'Tỷ số', key: 'score',
      render: (_: unknown, m: any) =>
        m.homeScore != null
          ? <Text strong style={{ color: '#52c41a' }}>{m.homeScore} — {m.awayScore}</Text>
          : <Text type="secondary">—</Text>,
    },
    {
      title: 'Giải', key: 'league',
      render: (_: unknown, m: any) => <Text type="secondary">{m.league?.name ?? '—'}</Text>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={MATCH_STATUS_TAG[s] ?? 'default'}>{s?.toUpperCase()}</Tag>,
    },
  ];

  const betColumns = [
    {
      title: 'User', key: 'user',
      render: (_: unknown, b: any) => <Text style={{ fontSize: 12 }}>{b.user?.username ?? b.userId}</Text>,
    },
    {
      title: 'Trận', key: 'match',
      render: (_: unknown, b: any) =>
        <Text style={{ fontSize: 12 }}>{b.match?.homeTeam?.name ?? '?'} vs {b.match?.awayTeam?.name ?? '?'}</Text>,
      ellipsis: true,
    },
    {
      title: 'Tiền cược', key: 'amount',
      render: (_: unknown, b: any) =>
        <Text strong style={{ color: '#facc15' }}>{Number(b.amount ?? b.stake ?? 0).toLocaleString('vi')} ₫</Text>,
    },
    {
      title: 'Trạng thái', dataIndex: 'status', key: 'status',
      render: (s: string) => <Tag color={BET_STATUS_TAG[s] ?? 'default'}>{s?.toUpperCase()}</Tag>,
    },
  ];

  if (loadingStats && loadingLive && loadingBets) {
    return <div className="flex items-center justify-center min-h-[300px]"><Spin size="large" /></div>;
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <div>
          <Title level={3} style={{ margin: 0 }}>Sports — Tổng quan</Title>
          <Text type="secondary">Trạng thái trực tiếp, cược đang chờ và thống kê tổng hợp</Text>
        </div>
        <Space>
          <Tag color="green" icon={<PlayCircleOutlined />}>
            {liveCount} trận đang live
          </Tag>
        </Space>
      </Flex>

      {/* KPI Cards */}
      <Row gutter={[16, 16]}>
        <Col xs={12} sm={6}>
          <StatCard
            title="Trận LIVE"
            value={liveCount}
            prefix={<ThunderboltOutlined />}
            color="#52c41a"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="Cược đang chờ"
            value={pendingBets}
            prefix={<DollarOutlined />}
            color="#facc15"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="Tổng giải đấu"
            value={stats.leagues ?? stats.leagueCount ?? '—'}
            prefix={<TrophyOutlined />}
            color="#1677ff"
          />
        </Col>
        <Col xs={12} sm={6}>
          <StatCard
            title="Người dùng Sports"
            value={stats.users ?? stats.userCount ?? '—'}
            prefix={<TeamOutlined />}
            color="#722ed1"
          />
        </Col>
      </Row>

      {/* Bet volume row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng cược (8 gần nhất)"
            value={totalBetAmount}
            suffix="₫"
            prefix={<DollarOutlined />}
            color="#f5222d"
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Tổng trận đã seed"
            value={stats.matches ?? stats.matchCount ?? '—'}
            prefix={<TrophyOutlined />}
          />
        </Col>
        <Col xs={24} sm={8}>
          <StatCard
            title="Highlight / Video"
            value={stats.highlights ?? stats.highlightCount ?? '—'}
            prefix={<PlayCircleOutlined />}
            color="#13c2c2"
          />
        </Col>
      </Row>

      {/* Live matches table */}
      <Card
        title={
          <Space>
            <ThunderboltOutlined style={{ color: '#52c41a' }} />
            <span>Trận đang LIVE</span>
          </Space>
        }
        extra={
          <Button
            size="small" icon={<SyncOutlined />}
            onClick={() => window.location.reload()}
          >
            Làm mới
          </Button>
        }
        size="small"
      >
        {loadingLive
          ? <Spin />
          : liveCount === 0
            ? <Alert message="Không có trận nào đang live." type="info" showIcon />
            : (
              <Table
                dataSource={liveMatches}
                columns={matchColumns}
                rowKey="id"
                size="small"
                pagination={false}
              />
            )
        }
      </Card>

      {/* Recent bets */}
      <Card
        title={
          <Space>
            <DollarOutlined style={{ color: '#facc15' }} />
            <span>Cược gần đây</span>
          </Space>
        }
        size="small"
      >
        {loadingBets
          ? <Spin />
          : (
            <Table
              dataSource={recentBets ?? []}
              columns={betColumns}
              rowKey="id"
              size="small"
              pagination={false}
            />
          )
        }
      </Card>
    </div>
  );
}
