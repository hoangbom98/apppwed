// frontend/admin-dashboard/src/modules/shared/pages/SystemPage.jsx
// Route: /settings/system
// Server health, memory usage, maintenance mode toggle
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  App, Button, Card, Statistic, Switch, Alert, Spin, Descriptions, Row, Col, Typography,
} from 'antd';
import {
  ReloadOutlined, AlertOutlined, NodeIndexOutlined, ClockCircleOutlined,
  LaptopOutlined, ToolOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Text } = Typography;

// ── Memory bar ────────────────────────────────────────────────────────────────
function MemBar({ label, used, total }) {
  const pct      = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const barColor = pct > 80 ? '#ef4444' : pct > 60 ? '#eab308' : '#3b82f6';
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-xs text-gray-400">
        <span>{label}</span>
        <span>{used} MB / {total} MB ({pct}%)</span>
      </div>
      <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
    </div>
  );
}

// ── Inner page (uses App context) ─────────────────────────────────────────────
function SystemPageInner() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  const { data: sys, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['systemInfo'],
    queryFn:  () => api.get('/admin/stats/system').then(r => r.data?.data ?? r.data),
    refetchInterval: 30000,
  });

  const toggleMaintenance = useMutation({
    mutationFn: (enabled) => api.post('/admin/stats/system/maintenance', { enabled }),
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ['systemInfo'] });
      const mode = res.data?.data?.maintenanceMode;
      if (mode) {
        message.warning('⚠️ Maintenance mode BẬT — users sẽ thấy trang bảo trì');
      } else {
        message.success('✅ Maintenance mode TẮT');
      }
    },
    onError: () => message.error('Lỗi khi thay đổi maintenance mode'),
  });

  const isMaintenance = sys?.maintenanceMode ?? false;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Hệ thống</h1>
          <p className="text-sm text-gray-400 mt-0.5">Thông tin server, tài nguyên và chế độ bảo trì</p>
        </div>
        <Button
          icon={<ReloadOutlined />}
          loading={isFetching}
          onClick={() => refetch()}
        >
          Làm mới
        </Button>
      </div>

      {/* Maintenance banner */}
      {isMaintenance && (
        <Alert
          type="warning"
          showIcon
          message="Maintenance mode đang bật"
          description="Tất cả người dùng thấy trang bảo trì. Admin vẫn có thể đăng nhập."
        />
      )}

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {/* KPI cards */}
          <Row gutter={[16, 16]}>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Node.js"
                  value={sys?.node ?? '—'}
                  prefix={<NodeIndexOutlined style={{ color: '#4ade80' }} />}
                  valueStyle={{ color: '#4ade80', fontSize: 16 }}
                />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Uptime"
                  value={sys?.uptimeHuman ?? '—'}
                  prefix={<ClockCircleOutlined style={{ color: '#60a5fa' }} />}
                  valueStyle={{ color: '#60a5fa', fontSize: 16 }}
                  suffix={sys?.pid ? <Text type="secondary" style={{ fontSize: 11 }}>PID {sys.pid}</Text> : null}
                />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Platform"
                  value={sys?.platform ?? '—'}
                  prefix={<LaptopOutlined style={{ color: '#c084fc' }} />}
                  valueStyle={{ color: '#c084fc', fontSize: 16 }}
                  suffix={sys?.env ? <Text type="secondary" style={{ fontSize: 11 }}>{sys.env}</Text> : null}
                />
              </Card>
            </Col>
            <Col xs={12} lg={6}>
              <Card size="small">
                <Statistic
                  title="Maintenance"
                  value={isMaintenance ? 'BẬT' : 'TẮT'}
                  prefix={<AlertOutlined style={{ color: isMaintenance ? '#f87171' : '#4ade80' }} />}
                  valueStyle={{ color: isMaintenance ? '#f87171' : '#4ade80', fontSize: 16 }}
                  suffix={<Text type="secondary" style={{ fontSize: 11 }}>Chế độ bảo trì</Text>}
                />
              </Card>
            </Col>
          </Row>

          {/* Memory bars */}
          <Card title={<span><ToolOutlined className="text-blue-400 mr-2" />Bộ nhớ (MB)</span>}>
            <div className="space-y-4">
              <MemBar
                label="Heap Used"
                used={sys?.memory?.heapUsed ?? 0}
                total={sys?.memory?.heapTotal ?? 1}
              />
              <MemBar
                label="RSS"
                used={sys?.memory?.rss ?? 0}
                total={sys?.memory?.heapTotal ?? 1}
              />
            </div>
          </Card>

          {/* Maintenance toggle */}
          <Card title="⚙️ Maintenance Mode">
            <div className="flex items-center justify-between">
              <div className="max-w-md">
                <p className="text-sm text-gray-200">Chế độ bảo trì</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Khi bật, tất cả request từ user sẽ nhận được 503 Service Unavailable.
                  Admin dashboard vẫn hoạt động bình thường.
                </p>
              </div>
              <Switch
                checked={isMaintenance}
                loading={toggleMaintenance.isPending}
                onChange={(checked) => toggleMaintenance.mutate(checked)}
                checkedChildren="BẬT"
                unCheckedChildren="TẮT"
              />
            </div>
          </Card>

          {/* Raw info table */}
          <Card title="📋 Thông tin chi tiết">
            <Descriptions bordered size="small" column={1}>
              <Descriptions.Item label="Node.js version">{sys?.node ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Environment">{sys?.env ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Platform">{sys?.platform ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Process ID">{sys?.pid ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="Uptime (giây)">{sys?.uptime ?? '—'}</Descriptions.Item>
              <Descriptions.Item label="RSS Memory">{sys?.memory?.rss != null ? `${sys.memory.rss} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Heap Used">{sys?.memory?.heapUsed != null ? `${sys.memory.heapUsed} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Heap Total">{sys?.memory?.heapTotal != null ? `${sys.memory.heapTotal} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="External Memory">{sys?.memory?.external != null ? `${sys.memory.external} MB` : '—'}</Descriptions.Item>
              <Descriptions.Item label="Cập nhật lúc">{sys?.timestamp ? new Date(sys.timestamp).toLocaleString('vi-VN') : '—'}</Descriptions.Item>
            </Descriptions>
          </Card>
        </>
      )}
    </div>
  );
}

export default function SystemPage() {
  return (
    <App>
      <SystemPageInner />
    </App>
  );
}
