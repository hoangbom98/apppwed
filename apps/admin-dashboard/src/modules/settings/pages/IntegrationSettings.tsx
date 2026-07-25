// @ts-nocheck
// frontend/admin-dashboard/src/modules/settings/pages/IntegrationSettings.jsx
// Route: /settings/integrations
// Cấu hình tập trung: API tích hợp, bảo mật, tính năng — lưu thẳng vào DB, không cần restart.
import React from 'react';
import {
  App, Card, Form, Input, InputNumber, Switch, Select, Button,
  Tabs, Alert, Divider, Space, Spin, Tooltip,
} from 'antd';
import {
  SaveOutlined, ReloadOutlined, CheckCircleOutlined,
  QuestionCircleOutlined, SettingOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

// ── Field definitions ────────────────────────────────────────────────────────

const INTEGRATION_FIELDS = [
  // ── AI ──────────────────────────────────────────────────────────────────────
  {
    key: 'GROQ_API_KEY', label: 'Groq AI — API Key', type: 'password', group: 'ai',
    description: 'Dùng cho Fraud Detection và CSKH tự động (30 req/phút miễn phí).',
    placeholder: 'gsk_...', testable: true,
  },
  {
    key: 'GROQ_MODEL', label: 'Groq — Model', type: 'select', group: 'ai',
    description: 'Model AI sử dụng để phát hiện gian lận và hỗ trợ khách hàng.',
    options: [
      { label: 'llama-3.3-70b-versatile (mặc định)', value: 'llama-3.3-70b-versatile' },
      { label: 'mixtral-8x7b-32768',                 value: 'mixtral-8x7b-32768' },
      { label: 'gemma2-9b-it (nhỏ, nhanh)',           value: 'gemma2-9b-it' },
    ],
    defaultValue: 'llama-3.3-70b-versatile',
  },
  // ── Security ────────────────────────────────────────────────────────────────
  {
    key: 'ABUSEIPDB_API_KEY', label: 'AbuseIPDB — API Key', type: 'password', group: 'security',
    description: 'Chặn IP bot/VPN khi đăng nhập, đăng ký. 1000 req/ngày miễn phí.',
    placeholder: 'key_...', testable: true,
  },
  {
    key: 'ABUSEIPDB_THRESHOLD', label: 'AbuseIPDB — Ngưỡng Risk Score', type: 'number', group: 'security',
    description: 'IP có điểm ≥ ngưỡng này sẽ bị chặn (0–100). Mặc định: 50.',
    defaultValue: 50, min: 0, max: 100, step: 5,
  },
  {
    key: 'SECURITY_MAX_LOGIN_ATTEMPTS', label: 'Số lần đăng nhập sai tối đa', type: 'number', group: 'security',
    description: 'Hệ thống sẽ tạm khóa IP sau số lần sai liên tiếp này. Mặc định: 10.',
    defaultValue: 10, min: 3, max: 50, step: 1,
  },
  {
    key: 'SECURITY_ADMIN_PATH', label: 'Đường dẫn Admin Login', type: 'text', group: 'security',
    description: 'URL path bảo vệ trang đăng nhập admin (VD: adcp). Không dùng "admin".',
    placeholder: 'adcp', defaultValue: 'adcp',
  },
  // ── Notification ────────────────────────────────────────────────────────────
  {
    key: 'TELEGRAM_BOT_TOKEN', label: 'Telegram — Bot Token', type: 'password', group: 'notification',
    description: 'Token bot Telegram nhận cảnh báo realtime (rút tiền, fraud, lỗi worker).',
    placeholder: '123456789:XXXXXXXXXX', testable: true,
  },
  {
    key: 'TELEGRAM_ADMIN_CHAT_ID', label: 'Telegram — Admin Chat ID', type: 'text', group: 'notification',
    description: 'Chat ID nhóm/cá nhân nhận cảnh báo. Dùng @userinfobot để lấy ID.',
    placeholder: '-100XXXXXXXXXX',
  },
  // ── Trade ────────────────────────────────────────────────────────────────────
  {
    key: 'COINGECKO_API_KEY', label: 'CoinGecko — API Key', type: 'password', group: 'trade',
    description: 'Fallback giá crypto khi nguồn chính lỗi. 30 req/phút với free key.',
    testable: true,
  },
  // ── Moderation ──────────────────────────────────────────────────────────────
  {
    key: 'PERSPECTIVE_API_KEY', label: 'Perspective API — Key', type: 'password', group: 'moderation',
    description: 'Kiểm duyệt tin nhắn chat (toxic, spam, threat). Google Cloud Console.',
    testable: true,
  },
  {
    key: 'PERSPECTIVE_THRESHOLD', label: 'Perspective — Ngưỡng Toxicity', type: 'number', group: 'moderation',
    description: 'Điểm ≥ ngưỡng sẽ bị chặn (0.0–1.0). Mặc định: 0.8.',
    defaultValue: 0.8, min: 0, max: 1, step: 0.05,
  },
  // ── General ─────────────────────────────────────────────────────────────────
  {
    key: 'SITE_TITLE', label: 'Tiêu đề Website (SEO)', type: 'text', group: 'general',
    description: 'Title xuất hiện trong <title> tag và kết quả tìm kiếm.',
    placeholder: 'LKVIP Group', defaultValue: 'LKVIP Group',
  },
  {
    key: 'SITE_DESCRIPTION', label: 'Mô tả Website (SEO)', type: 'text', group: 'general',
    description: 'Meta description tối đa 160 ký tự.',
    placeholder: 'Nền tảng giải trí trực tuyến hàng đầu.',
  },
  {
    key: 'MAINTENANCE_MODE', label: 'Bảo trì hệ thống', type: 'boolean', group: 'general',
    description: 'Bật để chặn toàn bộ truy cập user — chỉ admin vào được.',
    defaultValue: false,
  },
  // ── Feature flags ────────────────────────────────────────────────────────────
  {
    key: 'FEATURE_DISIFY_EMAIL_CHECK', label: 'Chặn email tạm thời (Disify)', type: 'boolean', group: 'features',
    description: 'Ngăn đăng ký bằng email rác từ mailinator, guerrilla, v.v.',
    defaultValue: true,
  },
  {
    key: 'FEATURE_OPENF1_INTEGRATION', label: 'Dữ liệu F1 (OpenF1)', type: 'boolean', group: 'features',
    description: 'Hiển thị dữ liệu Formula 1 realtime trong module Sports.',
    defaultValue: true,
  },
  {
    key: 'FEATURE_OPENMETEO_WEATHER', label: 'Thời tiết sân vận động (Open-Meteo)', type: 'boolean', group: 'features',
    description: 'Hiển thị thông tin thời tiết trong chi tiết trận đấu.',
    defaultValue: true,
  },
  {
    key: 'FEATURE_DICEBEAR_AVATAR', label: 'Avatar tự động (DiceBear)', type: 'boolean', group: 'features',
    description: 'Tạo avatar ngẫu nhiên cho user mới không upload ảnh.',
    defaultValue: true,
  },
  {
    key: 'FEATURE_IPAPI_GEO', label: 'Phân tích địa lý (ipapi.co)', type: 'boolean', group: 'features',
    description: 'Ghi log quốc gia/thành phố của người dùng khi đăng nhập.',
    defaultValue: true,
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────

const GROUP_NAMES = {
  ai:           '🤖 AI & Xử lý ngôn ngữ',
  security:     '🛡️ Bảo mật',
  notification: '📢 Thông báo',
  trade:        '📈 Trading',
  moderation:   '🧹 Kiểm duyệt nội dung',
  general:      '🌐 Thông tin Website',
  features:     '✨ Bật/Tắt tính năng',
};

function buildConfigMap(rows) {
  return (rows ?? []).reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {});
}

function castValue(field, raw) {
  if (raw === undefined || raw === null) return field.defaultValue ?? '';
  if (field.type === 'boolean') return String(raw) === 'true';
  if (field.type === 'number') return raw === '' ? (field.defaultValue ?? 0) : Number(raw);
  return raw;
}

// ── Single field renderer ─────────────────────────────────────────────────────

function FieldRow({ field, form, testing, onTest }) {
  let input;
  switch (field.type) {
    case 'password':
      input = <Input.Password placeholder={field.placeholder} allowClear />;
      break;
    case 'number':
      input = (
        <InputNumber
          min={field.min} max={field.max} step={field.step ?? 1}
          style={{ width: '100%' }}
        />
      );
      break;
    case 'boolean':
      return (
        <div className="flex items-start justify-between gap-4 py-3 border-b border-gray-800 last:border-0">
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-medium text-gray-200">{field.label}</span>
              {field.description && (
                <Tooltip title={field.description}>
                  <QuestionCircleOutlined style={{ color: '#6b7280', fontSize: 13 }} />
                </Tooltip>
              )}
            </div>
            {field.description && (
              <div className="text-xs text-gray-500 mt-0.5 max-w-md">{field.description}</div>
            )}
          </div>
          <Form.Item name={field.key} valuePropName="checked" style={{ margin: 0 }}>
            <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
          </Form.Item>
        </div>
      );
    case 'select':
      input = <Select options={field.options} style={{ width: '100%' }} />;
      break;
    default:
      input = <Input placeholder={field.placeholder} />;
  }

  const label = (
    <span className="flex items-center gap-1.5 text-sm text-gray-200">
      {field.label}
      {field.description && (
        <Tooltip title={field.description}>
          <QuestionCircleOutlined style={{ color: '#6b7280', fontSize: 13 }} />
        </Tooltip>
      )}
    </span>
  );

  return (
    <Form.Item
      name={field.key}
      label={label}
      style={{ marginBottom: 16 }}
    >
      {field.testable ? (
        <Space.Compact style={{ width: '100%' }}>
          {input}
          <Button
            icon={<CheckCircleOutlined />}
            loading={testing === field.key}
            onClick={() => onTest(field.key, form.getFieldValue(field.key))}
            title="Kiểm tra kết nối"
          >
            Test
          </Button>
        </Space.Compact>
      ) : input}
    </Form.Item>
  );
}

// ── Tab content ───────────────────────────────────────────────────────────────

function GroupTab({ groupKey, fields, form, testing, onTest }) {
  const isFeatures = groupKey === 'features';
  return (
    <div className="max-w-2xl">
      {isFeatures && (
        <Alert
          message="Tắt tính năng sẽ vô hiệu hóa hoàn toàn API tương ứng — tiết kiệm quota và tài nguyên."
          type="warning"
          showIcon
          style={{ marginBottom: 16 }}
        />
      )}
      {fields.map((f) => (
        <FieldRow key={f.key} field={f} form={form} testing={testing} onTest={onTest} />
      ))}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const QUERY_GROUP = 'integrations';

function IntegrationSettingsInner() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [form] = Form.useForm();
  const [testing, setTesting] = React.useState(null);

  // Load all groups that our fields belong to
  const { data: rows, isLoading, refetch } = useQuery({
    queryKey: ['settings', QUERY_GROUP, 'all-groups'],
    queryFn:  () =>
      Promise.all(
        ['integrations', 'security', 'features', 'general'].map((g) =>
          api.get(`/admin/settings?group=${g}`).then((r) => r.data?.data ?? r.data ?? [])
        )
      ).then((results) => results.flat()),
  });

  // Populate form when data arrives
  React.useEffect(() => {
    if (!rows) return;
    const map = buildConfigMap(rows);
    const values = {};
    for (const f of INTEGRATION_FIELDS) {
      values[f.key] = castValue(f, map[f.key]);
    }
    form.setFieldsValue(values);
  }, [rows, form]);

  // Save — bulk upsert to /admin/settings/bulk
  const save = useMutation({
    mutationFn: (values) => {
      const settings = INTEGRATION_FIELDS.map((f) => ({
        key:   f.key,
        value: String(values[f.key] ?? f.defaultValue ?? ''),
        group: GROUP_BY_KEY[f.key] ?? 'integrations',
      }));
      return api.post('/admin/settings/bulk', { settings });
    },
    onSuccess: () => {
      message.success('Đã lưu toàn bộ cấu hình tích hợp');
      qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (e) =>
      message.error(e?.response?.data?.message || 'Lỗi khi lưu cấu hình'),
  });

  // Test single key
  const handleTest = async (key, value) => {
    if (!value || !String(value).trim()) {
      message.warning('Vui lòng nhập giá trị trước khi test');
      return;
    }
    setTesting(key);
    try {
      const res = await api.post('/admin/settings/integration-test', { key, value: String(value) });
      message.success(res.data?.message || 'Kết nối thành công!');
    } catch (e) {
      message.error(e?.response?.data?.message || 'Kết nối thất bại — kiểm tra lại API Key');
    } finally {
      setTesting(null);
    }
  };

  // Group fields for tabs
  const grouped = INTEGRATION_FIELDS.reduce((acc, f) => {
    if (!acc[f.group]) acc[f.group] = [];
    acc[f.group].push(f);
    return acc;
  }, {});

  const tabItems = Object.entries(grouped).map(([groupKey, fields]) => ({
    key:      groupKey,
    label:    GROUP_NAMES[groupKey] ?? groupKey,
    children: (
      <GroupTab
        groupKey={groupKey}
        fields={fields}
        form={form}
        testing={testing}
        onTest={handleTest}
      />
    ),
  }));

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <SettingOutlined /> Cấu hình tích hợp & tính năng
          </h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Cập nhật realtime — không cần restart server. Thay đổi có hiệu lực trong vài giây.
          </p>
        </div>
        <Button icon={<ReloadOutlined />} onClick={() => refetch()} loading={isLoading}>
          Làm mới
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spin size="large" /></div>
      ) : (
        <Card>
          <Alert
            message="Lưu ý bảo mật"
            description={
              <>
                API Key lưu trong DB được mã hóa transport (HTTPS). Nhấn <strong>Test</strong> trước khi lưu để xác nhận key hợp lệ. Thay đổi sẽ ghi <em>SystemLog</em> để audit.
              </>
            }
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={(v) => save.mutate(v)}
          >
            <Tabs items={tabItems} />

            <Divider />

            <Space>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={save.isPending}
                size="large"
              >
                Lưu toàn bộ
              </Button>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => refetch()}
                size="large"
              >
                Tải lại từ DB
              </Button>
            </Space>
          </Form>
        </Card>
      )}
    </div>
  );
}

// Build a lookup map: key → group for bulk save
const GROUP_BY_KEY = INTEGRATION_FIELDS.reduce((acc, f) => {
  const groupMap = {
    ai:           'integrations',
    security:     'security',
    notification: 'integrations',
    trade:        'integrations',
    moderation:   'integrations',
    general:      'general',
    features:     'features',
  };
  acc[f.key] = groupMap[f.group] ?? 'integrations';
  return acc;
}, {});

export default function IntegrationSettings() {
  return <App><IntegrationSettingsInner /></App>;
}
