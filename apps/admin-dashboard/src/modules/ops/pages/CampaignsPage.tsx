import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Table, Tag, Button, Space, App, Typography, Flex, Card, Statistic, Row, Col } from 'antd';
import { PlayCircleOutlined, NotificationOutlined, RobotOutlined } from '@ant-design/icons';
import { opsApi } from '../api';

const { Text, Title } = Typography;

const STATUS_TAG = { sent: 'success', failed: 'error', pending: 'warning' };
const SEG_COLOR = { champion: '#f59e0b', gold: '#ca8a04', silver: '#94a3b8', at_risk: '#ef4444', bronze: '#92400e' };

export default function CampaignsPage() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [days, setDays] = useState(7);

  const { data: stats = [] } = useQuery({
    queryKey: ['opsCampaignStats', days],
    queryFn:  () => opsApi.getCampaignStats(days).then(r => r.data?.data ?? []),
  });

  const { data: log = [], isLoading: logLoading } = useQuery({
    queryKey: ['opsCampaignLog', days],
    queryFn:  () => opsApi.getCampaignLog(days).then(r => r.data?.data ?? []),
  });

  const runAll = useMutation({
    mutationFn: opsApi.runCampaigns,
    onSuccess:  res => { message.success(`Đã gửi ${res.data?.data?.sent ?? 0} campaign`); qc.invalidateQueries({ queryKey: ['opsCampaignStats'] }); qc.invalidateQueries({ queryKey: ['opsCampaignLog'] }); },
    onError: () => message.error('Lỗi khi chạy campaign'),
  });
  const runMarketing = useMutation({
    mutationFn: opsApi.runMarketing,
    onSuccess:  res => { const d = res.data?.data || {}; message.success(`Birthday: ${d.birthday} · NewUser: ${d.newUser} · VIP: ${d.vip}`); qc.invalidateQueries({ queryKey: ['opsCampaignLog'] }); },
    onError: () => message.error('Lỗi marketing automation'),
  });
  const runTickets = useMutation({
    mutationFn: opsApi.runTicketAutoProcess,
    onSuccess: res => message.success(`Tự động xử lý ${res.data?.data?.processed ?? 0} ticket`),
  });

  const logColumns = [
    { title: 'User',     key: 'user',     render: (_, r) => `#${r.userId}` },
    { title: 'Campaign', key: 'campaign', dataIndex: 'campaignName', ellipsis: true },
    {
      title: 'Segment', key: 'segment',
      render: (_, r) => r.segment
        ? <Text style={{ color: SEG_COLOR[r.segment] || undefined }}>{r.segment}</Text>
        : '—',
    },
    { title: 'Action',  key: 'action',  dataIndex: 'action' },
    { title: 'Trạng thái', dataIndex: 'status', key: 'status', render: s => <Tag color={STATUS_TAG[s] ?? 'default'}>{s}</Tag> },
    { title: 'Thời gian', key: 'createdAt', render: (_, r) => new Date(r.createdAt).toLocaleString('vi-VN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) },
  ];

  return (
    <div className="space-y-5">
      <Flex align="center" justify="space-between" wrap="wrap" gap={12}>
        <Title level={4} style={{ margin: 0 }}>Marketing & Campaigns</Title>
        <Space>
          {[7, 14, 30].map(d => (
            <Button key={d} type={days === d ? 'primary' : 'default'} size="small" onClick={() => setDays(d)}>{d}d</Button>
          ))}
        </Space>
      </Flex>

      {/* Action panel */}
      <Row gutter={[16, 16]}>
        {[
          { label: 'Chạy Campaign theo Segment', sub: 'Champion / Gold / At-risk', mut: runAll, icon: <PlayCircleOutlined /> },
          { label: 'Marketing tự động',          sub: 'Sinh nhật · User mới · VIP', mut: runMarketing, icon: <NotificationOutlined /> },
          { label: 'Auto-reply Ticket',           sub: 'Phân loại + trả lời tự động', mut: runTickets, icon: <RobotOutlined /> },
        ].map(a => (
          <Col xs={24} md={8} key={a.label}>
            <Card
              hoverable
              size="small"
              onClick={() => !a.mut.isPending && a.mut.mutate()}
              style={{ cursor: 'pointer', opacity: a.mut.isPending ? 0.6 : 1 }}
            >
              <Space>
                {a.icon}
                <div>
                  <div style={{ fontWeight: 600 }}>{a.label}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>{a.sub}</Text>
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      {/* Stats */}
      {stats.length > 0 && (
        <Card title={`Thống kê ${days} ngày`} size="small">
          <Row gutter={[12, 12]}>
            {stats.slice(0, 8).map(s => (
              <Col xs={12} md={6} key={s.campaign}>
                <Statistic title={s.campaign} value={s.count} />
              </Col>
            ))}
          </Row>
        </Card>
      )}

      {/* Log table */}
      <Card title={`Lịch sử Campaign (${days} ngày)`} size="small">
        <Table
          dataSource={log.slice(0, 100)}
          columns={logColumns}
          loading={logLoading}
          rowKey="id"
          size="small"
          pagination={{ pageSize: 20, showSizeChanger: false, showTotal: t => `Tổng: ${t}` }}
        />
      </Card>
    </div>
  );
}
