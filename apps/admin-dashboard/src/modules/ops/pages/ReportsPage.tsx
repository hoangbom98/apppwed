import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Button, Card, Alert, App, Typography, Row, Col, Statistic } from 'antd';
import { ReloadOutlined, RiseOutlined } from '@ant-design/icons';
import { opsApi } from '../api';
import { fmtNum as fmt, fmtVND as fmtM } from '@admin/modules/shared/utils/formatters';

const { Title, Text } = Typography;

// Simple SVG bar chart (no external dep)
function ForecastChart({ data }) {
  if (!data?.length) return null;
  const W = 560, H = 100, PAD = 12;
  const max  = Math.max(...data.map(d => d.predicted), 1);
  const step = (W - PAD * 2) / (data.length - 1 || 1);
  const barW = Math.max(3, step * 0.6);
  const toY  = v => H - PAD - (v / max) * (H - PAD * 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: 100 }}>
      {data.map((d, i) => {
        const x = PAD + i * step;
        const y = toY(d.predicted);
        return (
          <g key={i}>
            <rect x={x - barW / 2} y={y} width={barW} height={H - PAD - y} rx={2} fill="#3b82f6" opacity="0.7" />
            {i % 5 === 0 && <text x={x} y={H} fontSize="8" fill="#6b7280" textAnchor="middle">{d.date?.slice(5)}</text>}
          </g>
        );
      })}
    </svg>
  );
}

export default function ReportsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  const { data: reports = [], isLoading: reportLoading } = useQuery({
    queryKey: ['opsDailyReports7'],
    queryFn:  () => opsApi.getDailyReports(14).then(r => r.data?.data ?? []),
  });

  const { data: forecast = [] } = useQuery({
    queryKey: ['opsCashForecast'],
    queryFn:  () => opsApi.getCashFlowForecast(30).then(r => r.data?.data ?? []),
  });

  const { data: reserve } = useQuery({
    queryKey: ['opsCashReserve'],
    queryFn:  () => opsApi.getCashReserve().then(r => r.data?.data),
  });

  const genReport = useMutation({
    mutationFn: opsApi.triggerDailyReport,
    onSuccess:  () => { message.success('Đã tạo báo cáo hôm nay'); qc.invalidateQueries({ queryKey: ['opsDailyReports7'] }); },
    onError:    () => message.error('Lỗi tạo báo cáo'),
  });

  const reserveDays = Number(reserve?.reserveDays || 0);

  const reportColumns = [
    { title: 'Ngày',       dataIndex: 'date',      key: 'date' },
    { title: 'User tổng',  key: 'totalUsers',  render: (_, r) => fmt(r.summary?.totalUsers) },
    { title: 'User mới',   key: 'newUsers',    render: (_, r) => <Text style={{ color: '#60a5fa' }}>{fmt(r.summary?.newUsers)}</Text> },
    { title: 'Nạp (đ)',    key: 'deposit',     render: (_, r) => <Text style={{ color: '#4ade80' }}>{fmtM(r.financial?.depositAmount)}</Text> },
    { title: 'Rút (đ)',    key: 'withdraw',    render: (_, r) => <Text style={{ color: '#f87171' }}>{fmtM(r.financial?.withdrawAmount)}</Text> },
    {
      title: 'Net (đ)', key: 'net',
      render: (_, r) => {
        const v = Number(r.financial?.netRevenue || 0);
        return <Text style={{ color: v >= 0 ? '#4ade80' : '#f87171', fontFamily: 'monospace' }}>{fmtM(v)}</Text>;
      },
    },
    { title: 'Task xong',  key: 'tasks',     render: (_, r) => fmt(r.operations?.tasksCompleted) },
    { title: 'Campaign',   key: 'campaigns', render: (_, r) => <Text style={{ color: '#a78bfa' }}>{fmt(r.operations?.campaignsSent)}</Text> },
  ];

  return (
    <div className="space-y-5">
      <Row align="middle" justify="space-between">
        <Col><Title level={4} style={{ margin: 0 }}>Báo cáo & Dự báo</Title></Col>
        <Col>
          <Button type="primary" icon={<ReloadOutlined />} onClick={() => genReport.mutate()} loading={genReport.isPending}>
            Tạo báo cáo hôm nay
          </Button>
        </Col>
      </Row>

      {/* Cash reserve alert */}
      {reserve && (
        <Alert
          type={reserveDays < 7 ? 'error' : 'success'}
          message={`Quỹ dự trữ: ${fmtM(reserve.totalBalance)}`}
          description={`Chi phí/ngày: ${fmtM(reserve.dailyCost)} · Còn lại: ${reserveDays} ngày`}
          showIcon
        />
      )}

      {/* 30-day forecast */}
      <Card title="Dự báo nạp tiền 30 ngày" size="small">
        <ForecastChart data={forecast} />
        <Text type="secondary" style={{ fontSize: 12 }}>Dựa trên trung bình 90 ngày + xu hướng tăng trưởng</Text>
      </Card>

      {/* Daily report table */}
      <Card title="Báo cáo ngày gần nhất" size="small">
        <Table
          dataSource={reports}
          columns={reportColumns}
          loading={reportLoading}
          rowKey="date"
          size="small"
          pagination={{ pageSize: 14, showSizeChanger: false }}
          scroll={{ x: true }}
        />
      </Card>
    </div>
  );
}
