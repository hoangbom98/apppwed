// frontend/admin-dashboard/src/modules/shared/pages/PaymentGateways.jsx
// Upgraded: stats per gateway (deposits count, volume), test-connection button
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Modal, Form, Input, Select, Tag, Button, Switch, Spin, Typography,
  Space, Row, Col, App, Flex, Divider, Statistic, Tooltip,
} from 'antd';
import {
  SettingOutlined, PoweroffOutlined, PlayCircleOutlined,
  WifiOutlined, LoadingOutlined, CheckCircleOutlined, CloseCircleOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

const { Title, Text } = Typography;
const { TextArea } = Input;

const STATUS_COLOR = { active: 'success', inactive: 'default', maintenance: 'warning' };
const STATUS_LABEL = { active: 'Hoạt động', inactive: 'Tắt', maintenance: 'Bảo trì' };
const TYPE_ICON    = { bank: 'Bank', crypto: 'Crypto', ewallet: 'E-Wallet', card: 'Card' };

function fmtMoney(v) { return v != null ? Number(v).toLocaleString('vi-VN') + '₫' : '—'; }

// ── Edit gateway modal ─────────────────────────────────────────────────────────
function EditGatewayModal({ gateway, open, onClose, onSave, isSaving }) {
  const [form]    = Form.useForm();
  const [jsonErr, setJsonErr] = useState('');

  const handleOk = () => {
    form.validateFields().then(values => {
      try {
        const updates = {
          ...values,
          fees:      JSON.parse(values.fees   ?? '{}'),
          limits:    JSON.parse(values.limits  ?? '{}'),
          config:    JSON.parse(values.config  ?? '{}'),
          sortOrder: Number(values.sortOrder ?? 0),
        };
        setJsonErr('');
        onSave(updates);
      } catch (e) {
        setJsonErr('JSON không hợp lệ: ' + e.message);
      }
    });
  };

  React.useEffect(() => {
    if (open && gateway) {
      form.setFieldsValue({
        name:      gateway.name      ?? '',
        status:    gateway.status    ?? 'active',
        fees:      JSON.stringify(gateway.fees   ?? {}, null, 2),
        limits:    JSON.stringify(gateway.limits ?? {}, null, 2),
        config:    JSON.stringify(gateway.config ?? {}, null, 2),
        sortOrder: gateway.sortOrder ?? 0,
      });
      setJsonErr('');
    }
  }, [open, gateway]);

  return (
    <Modal
      open={open}
      title={`Cấu hình: ${gateway?.code ?? ''}`}
      onOk={handleOk}
      onCancel={onClose}
      okText="Lưu cấu hình"
      cancelText="Huỷ"
      confirmLoading={isSaving}
      destroyOnHidden
      width={560}
    >
      <Form form={form} layout="vertical" style={{ marginTop: 8 }}>
        <Form.Item name="name" label="Tên hiển thị" rules={[{ required: true }]}>
          <Input />
        </Form.Item>
        <Form.Item name="status" label="Trạng thái">
          <Select options={[
            { label: 'Hoạt động', value: 'active' },
            { label: 'Tắt',       value: 'inactive' },
            { label: 'Bảo trì',   value: 'maintenance' },
          ]} />
        </Form.Item>
        <Form.Item name="fees" label={<>Phí (JSON) — <Text code>{`{ percentage: 0.5, fixed: 0 }`}</Text></>}>
          <TextArea rows={3} style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
        <Form.Item name="limits" label={<>Giới hạn (JSON) — <Text code>{`{ min, max, daily }`}</Text></>}>
          <TextArea rows={3} style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
        <Form.Item name="config" label={<>Config (JSON) — <Text type="warning">Giá trị nhạy cảm đã ẩn</Text></>}>
          <TextArea rows={5} style={{ fontFamily: 'monospace', fontSize: 12 }} />
        </Form.Item>
        <Form.Item name="sortOrder" label="Thứ tự hiển thị">
          <Input type="number" />
        </Form.Item>
        {jsonErr && <Text type="danger" style={{ fontSize: 12 }}>{jsonErr}</Text>}
      </Form>
    </Modal>
  );
}

// ── Gateway stats row ──────────────────────────────────────────────────────────
function GatewayStats({ code }) {
  const { data, isLoading } = useQuery({
    queryKey: ['adminGatewayStats', code],
    queryFn:  () => api.get(`/admin/payment/gateways/${code}/stats`).then(r => r.data?.data ?? r.data),
    staleTime: 60_000,
    retry: false,
  });

  if (isLoading) return <div className="text-[11px] text-gray-500 mt-2">Đang tải stats...</div>;
  if (!data) return null;

  return (
    <Row gutter={[8, 0]} className="mt-2">
      <Col span={8}>
        <Statistic title={<Text style={{ fontSize: 10 }}>Số GD hôm nay</Text>} value={data.todayCount ?? 0} valueStyle={{ fontSize: 14 }} />
      </Col>
      <Col span={8}>
        <Statistic title={<Text style={{ fontSize: 10 }}>Volume hôm nay</Text>} value={fmtMoney(data.todayVolume)} valueStyle={{ fontSize: 13, color: '#4ade80' }} />
      </Col>
      <Col span={8}>
        <Statistic title={<Text style={{ fontSize: 10 }}>Thành công (%)</Text>} value={data.successRate ?? '—'} suffix="%" valueStyle={{ fontSize: 14 }} />
      </Col>
    </Row>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────────
export default function PaymentGateways() {
  const { message } = App.useApp();
  const [editing,  setEditing]  = useState(null);
  const [testing,  setTesting]  = useState({}); // { [code]: 'idle'|'loading'|'ok'|'fail' }
  const qc = useQueryClient();

  const { data: gateways = [], isLoading } = useQuery({
    queryKey: ['adminPaymentGateways'],
    queryFn:  () => api.get('/admin/payment/gateways').then(r => r.data?.data ?? r.data ?? []),
  });
  const { data: available = [] } = useQuery({
    queryKey: ['adminPaymentAvailable'],
    queryFn:  () => api.get('/admin/payment/gateways/available').then(r => r.data?.data ?? r.data ?? []),
    staleTime: Infinity,
  });

  const toggleMutation = useMutation({
    mutationFn: (code) => api.post(`/admin/payment/gateways/${code}/toggle`),
    onSuccess: (_, code) => { qc.invalidateQueries({ queryKey: ['adminPaymentGateways'] }); message.success(`Đã cập nhật gateway ${code}`); },
    onError: (err) => message.error(err?.response?.data?.message ?? 'Lỗi khi toggle'),
  });
  const updateMutation = useMutation({
    mutationFn: ({ code, data }) => api.put(`/admin/payment/gateways/${code}`, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['adminPaymentGateways'] }); setEditing(null); message.success('Đã lưu cấu hình gateway'); },
    onError: (err) => message.error(err?.response?.data?.message ?? 'Lỗi khi lưu'),
  });

  const testConnection = async (code) => {
    setTesting(prev => ({ ...prev, [code]: 'loading' }));
    try {
      await api.post(`/admin/payment/gateways/${code}/test`);
      setTesting(prev => ({ ...prev, [code]: 'ok' }));
      message.success(`Gateway ${code}: kết nối thành công`);
    } catch {
      setTesting(prev => ({ ...prev, [code]: 'fail' }));
      message.error(`Gateway ${code}: kết nối thất bại`);
    }
    setTimeout(() => setTesting(prev => ({ ...prev, [code]: 'idle' })), 4000);
  };

  const testIcon = (st) => {
    if (st === 'loading') return <LoadingOutlined />;
    if (st === 'ok')      return <CheckCircleOutlined style={{ color: '#4ade80' }} />;
    if (st === 'fail')    return <CloseCircleOutlined style={{ color: '#f87171' }} />;
    return <WifiOutlined />;
  };

  return (
    <div>
      <Flex justify="space-between" align="flex-start" wrap="wrap" gap={12} style={{ marginBottom: 20 }}>
        <div>
          <Title level={4} style={{ margin: 0 }}>Cổng thanh toán</Title>
          <Text type="secondary" style={{ fontSize: 12 }}>Quản lý, bật/tắt và cấu hình các cổng thanh toán</Text>
        </div>
        {available.length > 0 && (
          <Space wrap>
            <Text type="secondary" style={{ fontSize: 11 }}>Adapters đã đăng ký:</Text>
            {available.map(c => <Tag key={c} style={{ fontFamily: 'monospace' }}>{c}</Tag>)}
          </Space>
        )}
      </Flex>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}><Spin tip="Đang tải…" /></div>
      ) : gateways.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Text type="secondary">Chưa có gateway. Chạy: </Text>
          <Text code>npm run seed:payment</Text>
        </div>
      ) : (
        <Row gutter={[16, 16]}>
          {gateways.map(gw => (
            <Col key={gw.code} xs={24} sm={12} lg={8}>
              <Card size="small" style={{ height: '100%' }}>
                {/* Header */}
                <Flex align="flex-start" gap={12} style={{ marginBottom: 10 }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: '#6b7280', letterSpacing: 0.5 }}>{TYPE_ICON[gw.type] ?? gw.type}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <Text strong style={{ display: 'block' }}>{gw.name}</Text>
                    <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{gw.code}</Text>
                  </div>
                  <Tag color={STATUS_COLOR[gw.status] ?? 'default'}>{STATUS_LABEL[gw.status] ?? gw.status}</Tag>
                </Flex>

                {/* Fee / limit info */}
                {gw.fees && (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Phí: {gw.fees.percentage ?? 0}%{gw.fees.fixed ? ` + ${Number(gw.fees.fixed).toLocaleString()}₫` : ''}
                  </Text>
                )}
                {gw.limits && (
                  <Text type="secondary" style={{ fontSize: 12, display: 'block' }}>
                    Giới hạn: {Number(gw.limits.min ?? 0).toLocaleString()} – {Number(gw.limits.max ?? 0).toLocaleString()}
                  </Text>
                )}

                {/* Stats */}
                <GatewayStats code={gw.code} />

                <Divider style={{ margin: '10px 0' }} />

                {/* Actions */}
                <Space style={{ width: '100%' }} wrap>
                  <Button
                    size="small"
                    danger={gw.status === 'active'}
                    type={gw.status !== 'active' ? 'primary' : 'default'}
                    icon={gw.status === 'active' ? <PoweroffOutlined /> : <PlayCircleOutlined />}
                    loading={toggleMutation.isPending}
                    onClick={() => toggleMutation.mutate(gw.code)}
                    style={{ flex: 1 }}
                  >
                    {gw.status === 'active' ? 'Tắt' : 'Bật'}
                  </Button>
                  <Button
                    size="small"
                    icon={<SettingOutlined />}
                    onClick={() => setEditing(gw)}
                    style={{ flex: 1 }}
                  >
                    Cấu hình
                  </Button>
                  <Tooltip title="Kiểm tra kết nối">
                    <Button
                      size="small"
                      icon={testIcon(testing[gw.code] ?? 'idle')}
                      loading={testing[gw.code] === 'loading'}
                      onClick={() => testConnection(gw.code)}
                    >
                      Test
                    </Button>
                  </Tooltip>
                </Space>
              </Card>
            </Col>
          ))}
        </Row>
      )}

      <EditGatewayModal
        open={!!editing}
        gateway={editing}
        onClose={() => setEditing(null)}
        onSave={data => updateMutation.mutate({ code: editing.code, data })}
        isSaving={updateMutation.isPending}
      />
    </div>
  );
}
