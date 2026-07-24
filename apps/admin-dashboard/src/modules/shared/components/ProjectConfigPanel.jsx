/**
 * ProjectConfigPanel.jsx — antd version
 * Reusable admin panel for per-project dynamic config.
 */
import React, { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card, Switch, Input, InputNumber, Tag, Button, Collapse, Spin,
  Typography, Space, Row, Col, Badge, App,
} from 'antd';
import { SaveOutlined, UndoOutlined } from '@ant-design/icons';
import api from '@admin/api/client';

const { Text, Title } = Typography;
const { TextArea } = Input;

const MODULE_LABELS = {
  payment:      'Thanh toán',
  kyc:          'Xác minh danh tính (KYC)',
  promotion:    'Khuyến mãi',
  notification: 'Thông báo',
  general:      'Giao diện & Thương hiệu',
  system:       'Hệ thống & Bảo mật',
};

const GROUP_LABELS = {
  deposit:   'Nạp tiền',
  withdraw:  'Rút tiền',
  gateway:   'Cổng thanh toán',
  general:   'Tổng quan',
  channels:  'Kênh thông báo',
  events:    'Sự kiện thông báo',
  brand:     'Thương hiệu',
  colors:    'Màu sắc',
  social:    'Mạng xã hội',
  referral:  'Giới thiệu bạn bè',
  security:  'Bảo mật',
};

// ── Type-aware input ──────────────────────────────────────────────────────────
function ConfigInput({ item, value, onChange }) {
  if (item.type === 'boolean') {
    const boolVal = value === true || value === 'true';
    return <Switch checked={boolVal} onChange={onChange} size="small" />;
  }
  if (item.type === 'number') {
    return (
      <InputNumber
        value={value ?? 0}
        onChange={v => onChange(v ?? 0)}
        style={{ width: '100%' }}
        size="small"
      />
    );
  }
  if (item.type === 'array' && Array.isArray(item.options) && item.options.length) {
    const arr = Array.isArray(value) ? value : [];
    return (
      <Space wrap size={4}>
        {item.options.map(opt => (
          <Tag.CheckableTag
            key={opt}
            checked={arr.includes(opt)}
            onChange={checked => onChange(checked ? [...arr, opt] : arr.filter(v => v !== opt))}
          >
            {opt}
          </Tag.CheckableTag>
        ))}
      </Space>
    );
  }
  if (item.type === 'array') {
    const arr = Array.isArray(value) ? value : [];
    return (
      <Input
        size="small"
        value={arr.join(', ')}
        onChange={e => onChange(e.target.value.split(',').map(s => s.trim()).filter(Boolean))}
        placeholder="Nhập giá trị cách nhau bằng dấu phẩy"
      />
    );
  }
  if (item.type === 'image') {
    return (
      <Space direction="vertical" style={{ width: '100%' }} size={4}>
        <Input
          size="small"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="URL hoặc đường dẫn ảnh"
        />
        {value && (
          <img
            src={value} alt="preview"
            style={{ height: 36, objectFit: 'contain', borderRadius: 4, opacity: 0.8 }}
            onError={e => { e.currentTarget.style.display = 'none'; }}
          />
        )}
      </Space>
    );
  }
  return (
    <Input
      size="small"
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
    />
  );
}

/**
 * @param {{ projectCode: string, moduleFilter?: string|null, title?: string|null }} props
 */
export default function ProjectConfigPanel({ projectCode, moduleFilter = null, title = null }) {
  const { message } = App.useApp();
  const [changes, setChanges] = useState({});
  const qc = useQueryClient();

  const queryParams = { project: projectCode, ...(moduleFilter && { module: moduleFilter }) };
  const { data: configs = [], isLoading, isError } = useQuery({
    queryKey: ['projectConfig', projectCode, moduleFilter],
    queryFn:  () => api.get('/admin/ui-config', { params: queryParams })
                       .then(r => r.data?.data ?? r.data ?? []),
  });

  const sections = useMemo(() => {
    const map = {};
    (configs ?? []).filter(c => c.editable !== false).forEach(c => {
      const k = `${c.module}||${c.group}`;
      if (!map[k]) map[k] = { module: c.module, group: c.group, items: [] };
      map[k].items.push(c);
    });
    return Object.values(map);
  }, [configs]);

  const handleChange = useCallback((id, val) => {
    setChanges(prev => ({ ...prev, [id]: val }));
  }, []);

  const hasChanges = Object.keys(changes).length > 0;

  const saveMutation = useMutation({
    mutationFn: () => {
      if (!hasChanges) return Promise.resolve();
      const ids = Object.keys(changes);
      const updates = configs
        .filter(c => ids.includes(c.id))
        .map(c => ({
          module: c.module, group: c.group, key: c.key,
          value: changes[c.id], type: c.type, description: c.description,
        }));
      return api.put('/admin/ui-config', { project: projectCode, updates });
    },
    onSuccess: () => {
      setChanges({});
      qc.invalidateQueries({ queryKey: ['projectConfig', projectCode] });
      message.success('Đã lưu cấu hình thành công');
    },
    onError: (err) => message.error(err?.response?.data?.message ?? 'Lỗi khi lưu cấu hình'),
  });

  const pageTitle = title ?? `Cấu hình ${moduleFilter ? MODULE_LABELS[moduleFilter] ?? moduleFilter : 'dự án'}`;

  const collapseItems = sections.map(sec => {
    const moduleLabel = MODULE_LABELS[sec.module] ?? sec.module;
    const groupLabel  = GROUP_LABELS[sec.group]   ?? sec.group;
    const dirtyCount  = sec.items.filter(i => changes[i.id] !== undefined).length;
    return {
      key:   `${sec.module}||${sec.group}`,
      label: (
        <Space>
          <Text type="secondary" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: 1 }}>{moduleLabel}</Text>
          <Text>›</Text>
          <Text strong style={{ fontSize: 13 }}>{groupLabel}</Text>
          {dirtyCount > 0 && <Badge count={dirtyCount} color="gold" />}
        </Space>
      ),
      children: (
        <Row gutter={[16, 12]}>
          {sec.items.map(item => {
            const currentValue = changes[item.id] !== undefined ? changes[item.id] : item.value;
            const isDirty      = changes[item.id] !== undefined;
            return (
              <Col key={item.id} xs={24} md={12}>
                <Space direction="vertical" size={4} style={{ width: '100%' }}>
                  <Space size={4} align="center">
                    <Text style={{ fontSize: 12 }}>{item.description ?? item.key}</Text>
                    <Text type="secondary" style={{ fontSize: 10, fontFamily: 'monospace' }}>[{item.key}]</Text>
                    {isDirty && <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#facc15', display: 'inline-block' }} />}
                  </Space>
                  <ConfigInput item={item} value={currentValue} onChange={val => handleChange(item.id, val)} />
                </Space>
              </Col>
            );
          })}
        </Row>
      ),
    };
  });

  return (
    <div>
      <Space style={{ marginBottom: 20 }} align="center">
        <div>
          <Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>
          <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>{projectCode}</Text>
        </div>
      </Space>

      {isLoading && (
        <div style={{ textAlign: 'center', padding: '64px 0' }}>
          <Spin tip="Đang tải cấu hình..." />
        </div>
      )}
      {isError && !isLoading && (
        <Text type="danger" style={{ display: 'block', textAlign: 'center', padding: '48px 0' }}>
          Không thể tải cấu hình. Kiểm tra kết nối.
        </Text>
      )}
      {!isLoading && !isError && sections.length === 0 && (
        <Text type="secondary" style={{ display: 'block', textAlign: 'center', padding: '48px 0' }}>
          Chưa có cấu hình. Chạy: <Text code>node code/backend/prisma/seed-config.js</Text>
        </Text>
      )}

      {!isLoading && sections.length > 0 && (
        <Collapse
          items={collapseItems}
          defaultActiveKey={collapseItems.map(i => i.key)}
          style={{ marginBottom: 80 }}
        />
      )}

      {/* Sticky save bar */}
      {!isLoading && sections.length > 0 && (
        <Card
          size="small"
          style={{
            position: 'sticky', bottom: 16, zIndex: 10,
            borderColor: hasChanges ? '#3b82f6' : undefined,
            background: '#1a1a1a',
          }}
        >
          <Space justify="space-between" style={{ width: '100%', display: 'flex', alignItems: 'center' }}>
            <Text type={hasChanges ? 'warning' : 'secondary'} style={{ fontSize: 13 }}>
              {hasChanges ? `${Object.keys(changes).length} thay đổi chưa lưu` : 'Mọi thay đổi đã được lưu'}
            </Text>
            <Space>
              <Button
                icon={<UndoOutlined />}
                disabled={!hasChanges || saveMutation.isPending}
                onClick={() => setChanges({})}
              >
                Huỷ
              </Button>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                disabled={!hasChanges}
                loading={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
              >
                Lưu cấu hình
              </Button>
            </Space>
          </Space>
        </Card>
      )}
    </div>
  );
}
