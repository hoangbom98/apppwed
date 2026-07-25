// @ts-nocheck
// frontend/admin-dashboard/src/modules/ops/pages/SegmentsPage.jsx
// Customer segmentation (RFM + CLV) — view + trigger analysis
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Input, Space, Card, App, Typography, Flex, Row, Col } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { opsApi } from '../api';

const { Text, Title } = Typography;

const SEG_COLORS = {
  champion: 'gold',
  gold:     'yellow',
  silver:   'default',
  at_risk:  'error',
  bronze:   'orange',
};
const SEG_LABEL = {
  champion: 'Champion', gold: 'Gold', silver: 'Silver',
  at_risk: 'At Risk',   bronze: 'Bronze',
};

const fmt  = n => Number(n || 0).toLocaleString('vi-VN');
const fmtM = n => `${fmt(n)}đ`;

export default function SegmentsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [search, setSearch]       = useState('');
  const [segFilter, setSegFilter] = useState('');
  const [analyzeUid, setAnalyzeUid] = useState('');
  const [analyzeResult, setAnalyzeResult] = useState(null);

  const { data: segments = [], isLoading } = useQuery({
    queryKey: ['opsSegments'],
    queryFn:  () => opsApi.getSegments({ limit: 200 }).then(r => r.data?.data ?? []),
  });

  const { data: churnAlerts = [] } = useQuery({
    queryKey: ['opsChurnAlerts'],
    queryFn:  () => opsApi.getChurnAlerts({ limit: 50 }).then(r => r.data?.data ?? []),
  });

  const churnScanMut = useMutation({
    mutationFn: opsApi.triggerChurnScan,
    onSuccess:  () => { message.success('Đã quét churn'); qc.invalidateQueries({ queryKey: ['opsChurnAlerts'] }); },
  });

  const analyzeMut = useMutation({
    mutationFn: uid => opsApi.analyzeUser(uid),
    onSuccess:  res => { setAnalyzeResult(res.data?.data); qc.invalidateQueries({ queryKey: ['opsSegments'] }); },
    onError: () => message.error('Không thể phân tích user này'),
  });

  const filtered = segments.filter(s => {
    if (segFilter && s.segment !== segFilter) return false;
    if (search && !String(s.userId).includes(search)) return false;
    return true;
  });

  const segColumns = [
    { title: 'User',    key: 'user',    render: (_, s) => `#${s.userId}` },
    { title: 'Phân khúc', dataIndex: 'segment', key: 'segment', render: s => <Tag color={SEG_COLORS[s] ?? 'default'}>{SEG_LABEL[s] ?? s}</Tag> },
    { title: 'R', dataIndex: 'rScore', key: 'r' },
    { title: 'F', dataIndex: 'fScore', key: 'f' },
    { title: 'M', dataIndex: 'mScore', key: 'm' },
    { title: 'CLV',    key: 'clv',       render: (_, s) => <Text style={{ color: '#4ade80' }}>{fmtM(s.clv)}</Text> },
    { title: 'Tháng',  key: 'monthly',   render: (_, s) => fmtM(s.avgMonthly) },
  ];

  return (
    <div className="space-y-5">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <Title level={4} style={{ margin: 0 }}>Phân khúc khách hàng</Title>
        <Button danger icon={<ReloadOutlined />} onClick={() => churnScanMut.mutate()} loading={churnScanMut.isPending}>Quét Churn</Button>
      </Flex>

      <Space wrap>
        {['', 'champion', 'gold', 'silver', 'at_risk', 'bronze'].map(s => (
          <Tag
            key={s}
            color={segFilter === s ? 'blue' : 'default'}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            onClick={() => setSegFilter(s)}
          >
            {s === '' ? 'Tất cả' : SEG_LABEL[s] ?? s}
          </Tag>
        ))}
      </Space>

      <Row gutter={[16, 16]}>
        <Col xs={24} lg={16}>
          <Card size="small" bodyStyle={{ padding: 0 }}>
            <div style={{ padding: '8px 16px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
              <Input
                placeholder="Tìm userId..."
                value={search} onChange={e => setSearch(e.target.value)}
                allowClear style={{ maxWidth: 240 }}
              />
            </div>
            <Table
              dataSource={filtered.slice(0, 100)}
              columns={segColumns}
              loading={isLoading}
              rowKey="userId"
              size="small"
              pagination={false}
              scroll={{ y: 400 }}
            />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Space direction="vertical" style={{ width: '100%' }} size={16}>
            {/* Manual analyze */}
            <Card title="Phân tích 1 User" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  placeholder="Nhập userId..."
                  value={analyzeUid} onChange={e => setAnalyzeUid(e.target.value)}
                  onPressEnter={() => analyzeUid && analyzeMut.mutate(analyzeUid)}
                />
                <Button
                  type="primary" block
                  onClick={() => analyzeMut.mutate(analyzeUid)}
                  disabled={!analyzeUid}
                  loading={analyzeMut.isPending}
                >
                  Phân tích RFM
                </Button>
                {analyzeResult && (
                  <div style={{ fontSize: 12 }}>
                    <div>Segment: <Tag color={SEG_COLORS[analyzeResult.segment]}>{analyzeResult.segment}</Tag></div>
                    <div>Recency: {Number(analyzeResult.recency || 0).toFixed(1)} ngày</div>
                    <div>Frequency: {analyzeResult.frequency} giao dịch</div>
                    <div>Monetary: {fmtM(analyzeResult.monetary)}</div>
                    <div>RFM: {analyzeResult.rScore}/{analyzeResult.fScore}/{analyzeResult.mScore}</div>
                  </div>
                )}
              </Space>
            </Card>

            {/* Churn alerts */}
            <Card title="Churn Alerts" size="small">
              {churnAlerts.length === 0
                ? <Text type="secondary">Không có cảnh báo</Text>
                : (
                  <div style={{ maxHeight: 240, overflowY: 'auto' }}>
                    {churnAlerts.map(a => (
                      <div key={a.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '4px 0' }}>
                        <Tag color={a.riskLevel === 'high' ? 'error' : 'warning'} style={{ marginTop: 2 }}>{a.riskLevel}</Tag>
                        <div style={{ fontSize: 12 }}>
                          <div>User #{a.userId}</div>
                          <Text type="secondary">{a.reason} · {a.daysInactive}d inactive</Text>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
            </Card>
          </Space>
        </Col>
      </Row>
    </div>
  );
}
