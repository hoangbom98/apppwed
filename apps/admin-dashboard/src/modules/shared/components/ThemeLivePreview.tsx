// @ts-nocheck
import React from 'react';
import { Alert, Button, Card, ConfigProvider, Space, Table, Tag, Typography } from 'antd';

const { Text, Title } = Typography;

const PROJECT_LABELS = {
  hub: 'Hub Portal',
  game: 'Game Center',
  trade: 'Trade Pro',
  dating: 'VietDating',
  sports: 'Sports Live',
};

function colorOr(value, fallback) {
  return typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i.test(value.trim())
    ? value.trim()
    : fallback;
}

function boolText(value) {
  return value === false || value === 'false' ? 'Tắt' : 'Bật';
}

export default function ThemeLivePreview({ config = {}, project = 'hub' }) {
  const brand = config.brand ?? {};
  const colors = config.colors ?? {};
  const social = config.social ?? {};
  const feature = config.feature ?? {};

  const primary = colorOr(colors.primary_color, '#3b82f6');
  const secondary = colorOr(colors.secondary_color, '#0f172a');
  const accent = colorOr(colors.accent_color, '#f59e0b');
  const siteName = brand.site_name || PROJECT_LABELS[project] || 'LKVIP';
  const slogan = brand.site_slogan || 'Trải nghiệm giải trí đồng bộ';
  const logoUrl = brand.logo_url || '';
  const copyright = brand.copyright_text || '© LKVIP GROUP';

  const token = {
    colorPrimary: primary,
    colorLink: primary,
    colorInfo: primary,
    colorSuccess: '#22c55e',
    colorWarning: accent,
    borderRadius: 12,
    colorBgContainer: '#111827',
    colorBgElevated: '#111827',
    colorText: '#f8fafc',
    colorTextSecondary: '#94a3b8',
    colorBorder: 'rgba(148, 163, 184, 0.22)',
  };

  const rows = [
    { key: 'registration_enabled', label: 'Đăng ký', value: boolText(feature.registration_enabled) },
    { key: 'download_app_enabled', label: 'Tải app', value: boolText(feature.download_app_enabled) },
    { key: 'dark_mode_enabled', label: 'Dark mode', value: boolText(feature.dark_mode_enabled) },
  ];

  return (
    <ConfigProvider theme={{ token }}>
      <Card title="Live Preview" size="small" style={{ background: '#0b1120', borderColor: 'rgba(148, 163, 184, 0.22)' }}>
        <div
          style={{
            '--color-primary': primary,
            '--color-secondary': secondary,
            '--color-accent': accent,
            background: `linear-gradient(135deg, ${secondary}, #020617)`,
            border: '1px solid rgba(148, 163, 184, 0.18)',
            borderRadius: 18,
            overflow: 'hidden',
            color: '#f8fafc',
          }}
        >
          <div style={{ padding: 18, borderBottom: '1px solid rgba(148, 163, 184, 0.18)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.08)', display: 'grid', placeItems: 'center', overflow: 'hidden' }}>
              {logoUrl ? (
                <img src={logoUrl} alt={siteName} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} onError={e => { e.currentTarget.style.display = 'none'; }} />
              ) : (
                <span style={{ color: primary, fontWeight: 800 }}>{siteName.slice(0, 2).toUpperCase()}</span>
              )}
            </div>
            <div style={{ minWidth: 0 }}>
              <Title level={5} style={{ margin: 0, color: '#fff' }}>{siteName}</Title>
              <Text style={{ color: '#94a3b8', fontSize: 12 }}>{slogan}</Text>
            </div>
          </div>

          <div style={{ padding: 18 }}>
            <div style={{ borderRadius: 16, padding: 18, background: `linear-gradient(135deg, ${primary}, ${accent})`, marginBottom: 14 }}>
              <Text strong style={{ color: '#fff', display: 'block', fontSize: 18 }}>Giao diện mới sẵn sàng</Text>
              <Text style={{ color: 'rgba(255,255,255,0.82)' }}>Màu sắc, thương hiệu, nội dung đổi theo cấu hình chưa lưu.</Text>
            </div>

            <Space wrap style={{ marginBottom: 14 }}>
              <Button type="primary">Nút chính</Button>
              <Button>Nút thường</Button>
              <Tag color="processing">{project}</Tag>
              <Tag color="warning">Accent</Tag>
            </Space>

            <Alert
              type="info"
              showIcon
              message="Thông báo mẫu"
              description="Preview chỉ hiển thị tại admin, chưa ảnh hưởng public cho đến khi lưu."
              style={{ marginBottom: 14 }}
            />

            <Table
              size="small"
              pagination={false}
              dataSource={rows}
              columns={[
                { title: 'Tính năng', dataIndex: 'label' },
                { title: 'Trạng thái', dataIndex: 'value', render: value => <Tag color={value === 'Bật' ? 'success' : 'default'}>{value}</Tag> },
              ]}
            />

            <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(148, 163, 184, 0.18)' }}>
              <Space direction="vertical" size={2}>
                {social.hotline && <Text style={{ color: '#cbd5e1' }}>Hotline: {social.hotline}</Text>}
                {social.telegram_url && <Text style={{ color: '#cbd5e1' }}>Telegram: {social.telegram_url}</Text>}
                <Text style={{ color: '#64748b', fontSize: 12 }}>{copyright}</Text>
              </Space>
            </div>
          </div>
        </div>
      </Card>
    </ConfigProvider>
  );
}
