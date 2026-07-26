// @ts-nocheck
// frontend/admin-dashboard/src/modules/settings/pages/ConnectionsPage.jsx
// Route: /settings/connections
// Cấu hình: SMTP, Telegram Bot, Google Login, ChatGPT / AI
import React from 'react';
import {
  App, Card, Form, Switch, Button, Tabs,
  Alert, Divider, Typography, Space, Row, Col, Spin,
} from 'antd';
import {
  SaveOutlined, SendOutlined, CopyOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { LkvipForm, LkvipInput, LkvipSelect } from '@lkvip/ui';
import api from '@admin/api/client';

const { Text } = Typography;

const GROUP = 'connection';

function useConnectionSettings() {
  return useQuery({
    queryKey: ['settings', GROUP],
    queryFn:  () => api.get(`/admin/settings?group=${GROUP}`).then(r => r.data?.data ?? r.data),
    select:   (rows) =>
      (rows ?? []).reduce((acc, r) => { acc[r.key] = r.value; return acc; }, {}),
  });
}

function useSaveSection(section, onOk, onErr) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (values) => {
      const ops = Object.entries(values).map(([key, value]) =>
        api.post('/admin/settings', {
          key:   `${section}.${key}`,
          value: typeof value === 'boolean' ? String(value) : String(value ?? ''),
          group: GROUP,
        })
      );
      return Promise.all(ops);
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); onOk?.(); },
    onError:   (e) => onErr?.(e?.response?.data?.message || 'Lỗi khi lưu'),
  });
}

// ── SMTP ────────────────────────────────────────────────────────────────────────
function TabSMTP({ settings }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const save = useSaveSection('smtp',
    () => message.success('Đã lưu cấu hình SMTP'),
    (e) => message.error(e),
  );

  React.useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        enabled:    settings['smtp.enabled'] === 'true',
        host:       settings['smtp.host']    ?? 'smtp.gmail.com',
        port:       settings['smtp.port']    ?? '587',
        encryption: settings['smtp.encryption'] ?? 'tls',
        email:      settings['smtp.email']   ?? '',
        from:       settings['smtp.from']    ?? '',
        password:   settings['smtp.password'] ?? '',
      });
    }
  }, [settings, form]);

  return (
    <LkvipForm form={form} onFinish={v => save.mutate(v)} className="max-w-xl">
      <Alert
        message="Gửi email thông báo qua SMTP"
        description="Cấu hình máy chủ SMTP để hệ thống gửi email tự động."
        type="info" showIcon style={{ marginBottom: 16 }}
      />
      <Form.Item label="Trạng thái SMTP" name="enabled" valuePropName="checked">
        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
      </Form.Item>
      <Row gutter={12}>
        <Col span={16}>
          <Form.Item label="SMTP Host" name="host">
            <LkvipInput placeholder="smtp.gmail.com" />
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Cổng (Port)" name="port">
            <LkvipInput placeholder="587" />
          </Form.Item>
        </Col>
      </Row>
      <Form.Item label="Mã hóa" name="encryption">
        <LkvipSelect>
          <LkvipSelect.Option value="tls">TLS (khuyến nghị)</LkvipSelect.Option>
          <LkvipSelect.Option value="ssl">SSL</LkvipSelect.Option>
          <LkvipSelect.Option value="none">Không mã hóa</LkvipSelect.Option>
        </LkvipSelect>
      </Form.Item>
      <Form.Item label="Email SMTP (tài khoản đăng nhập)" name="email">
        <LkvipInput placeholder="yourmail@gmail.com" />
      </Form.Item>
      <Form.Item
        label={
          <span>
            Email gửi đi (From)
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
              Để trống = dùng Email SMTP
            </Text>
          </span>
        }
        name="from"
      >
        <LkvipInput placeholder="noreply@yourdomain.com" />
      </Form.Item>
      <Form.Item label="Mật khẩu SMTP" name="password">
        <LkvipInput.Password placeholder="App password hoặc mật khẩu SMTP" />
      </Form.Item>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>
        Lưu SMTP
      </Button>
    </LkvipForm>
  );
}

// ── Telegram ────────────────────────────────────────────────────────────────────
function TabTelegram({ settings }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const [testing, setTesting] = React.useState(false);
  const save = useSaveSection('telegram',
    () => message.success('Đã lưu cấu hình Telegram Bot'),
    (e) => message.error(e),
  );

  React.useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        enabled:    settings['telegram.enabled'] === 'true',
        bot_token: settings['telegram.bot_token'] ?? '',
        chat_id:  settings['telegram.chat_id']  ?? '',
        username: settings['telegram.username'] ?? '',
        api_server: settings['telegram.api_server'] ?? 'official',
      });
    }
  }, [settings, form]);

  const handleTest = async () => {
    const { bot_token, chat_id } = form.getFieldsValue();
    if (!bot_token || !chat_id) {
      message.warning('Vui lòng nhập Bot Token và Chat ID trước');
      return;
    }
    setTesting(true);
    try {
      const url = `https://api.telegram.org/bot${bot_token}/sendMessage`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id, text: 'Test kết nối Telegram thành công từ Admin Panel!' }),
      });
      const json = await res.json();
      if (json.ok) {
        message.success('Gửi tin nhắn test thành công!');
      } else {
        message.error(`Lỗi: ${json.description}`);
      }
    } catch {
      message.error('Không thể kết nối đến Telegram API');
    } finally {
      setTesting(false);
    }
  };

  return (
    <LkvipForm form={form} onFinish={v => save.mutate(v)} className="max-w-xl">
      <Alert
        message="Bot thông báo Telegram"
        description="Gửi thông báo đơn hàng, nạp tiền, cảnh báo qua Telegram Bot."
        type="info" showIcon style={{ marginBottom: 16 }}
      />
      <Form.Item label="Trạng thái Bot" name="enabled" valuePropName="checked">
        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
      </Form.Item>
      <Form.Item label="Bot Token" name="bot_token">
        <LkvipInput.Password placeholder="123456789:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
      </Form.Item>
      <Form.Item
        label={
          <span>
            Chat ID mặc định
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
              ID nhóm / kênh nhận thông báo admin
            </Text>
          </span>
        }
        name="chat_id"
      >
        <LkvipInput placeholder="-100XXXXXXXXXX" />
      </Form.Item>
      <Form.Item label="Bot Username" name="username">
        <LkvipInput placeholder="@your_bot_name" addonBefore="@" />
      </Form.Item>
      <Form.Item
        label={
          <span>
            API Server
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
              Chọn proxy nếu Telegram bị chặn tại Việt Nam
            </Text>
          </span>
        }
        name="api_server"
      >
        <LkvipSelect>
          <LkvipSelect.Option value="official">Official (api.telegram.org)</LkvipSelect.Option>
          <LkvipSelect.Option value="proxy">Proxy / Mirror server</LkvipSelect.Option>
        </LkvipSelect>
      </Form.Item>
      <Space>
        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>
          Lưu Telegram
        </Button>
        <Button icon={<SendOutlined />} loading={testing} onClick={handleTest}>
          Gửi tin nhắn test
        </Button>
      </Space>
    </LkvipForm>
  );
}

// ── Google Login ────────────────────────────────────────────────────────────────
function TabGoogleLogin({ settings }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const save = useSaveSection('google',
    () => message.success('Đã lưu cấu hình Google Login'),
    (e) => message.error(e),
  );

  const redirectUri = `${window.location.origin}/api/auth/callback/google`;

  React.useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        enabled:       settings['google.enabled'] === 'true',
        client_id:     settings['google.client_id']     ?? '',
        client_secret: settings['google.client_secret'] ?? '',
      });
    }
  }, [settings, form]);

  return (
    <LkvipForm form={form} onFinish={v => save.mutate(v)} className="max-w-xl">
      <Alert
        message="Đăng nhập bằng Google"
        description="Cho phép người dùng đăng nhập / đăng ký bằng tài khoản Google."
        type="info" showIcon style={{ marginBottom: 16 }}
      />
      <Form.Item label="Trạng thái" name="enabled" valuePropName="checked">
        <Switch checkedChildren="Bật" unCheckedChildren="Tắt" />
      </Form.Item>
      <Form.Item label="Client ID" name="client_id">
        <LkvipInput placeholder="XXXXXXXXXXX.apps.googleusercontent.com" />
      </Form.Item>
      <Form.Item label="Client Secret" name="client_secret">
        <LkvipInput.Password placeholder="GOCSPX-XXXXXXXXXX" />
      </Form.Item>
      <Form.Item label="Authorized Redirect URI">
        <LkvipInput
          readOnly
          value={redirectUri}
          addonAfter={
            <Button
              size="small" type="text"
              icon={<CopyOutlined />}
              onClick={() => { navigator.clipboard.writeText(redirectUri); message.success('Đã sao chép'); }}
            />
          }
        />
        <Text type="danger" style={{ fontSize: 12 }}>
          Thêm URI trên vào "Authorized redirect URIs" trong Google Cloud Console
        </Text>
      </Form.Item>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>
        Lưu Google Login
      </Button>
    </LkvipForm>
  );
}

// ── ChatGPT / AI ────────────────────────────────────────────────────────────────
function TabChatGPT({ settings }) {
  const { message } = App.useApp();
  const [form] = Form.useForm();
  const save = useSaveSection('ai',
    () => message.success('Đã lưu cấu hình AI'),
    (e) => message.error(e),
  );

  React.useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        translate_engine: settings['ai.translate_engine'] ?? 'google',
        api_key:          settings['ai.api_key']          ?? '',
        model:            settings['ai.model']            ?? 'gpt-4o-mini',
      });
    }
  }, [settings, form]);

  return (
    <LkvipForm form={form} onFinish={v => save.mutate(v)} className="max-w-xl">
      <Alert
        message="Tích hợp AI / ChatGPT"
        description="Dùng AI để dịch thuật tự động nội dung đa ngôn ngữ."
        type="info" showIcon style={{ marginBottom: 16 }}
      />
      <Form.Item label="Bộ máy dịch thuật" name="translate_engine">
        <LkvipSelect>
          <LkvipSelect.Option value="google">Google Translate (miễn phí — không cần API Key)</LkvipSelect.Option>
          <LkvipSelect.Option value="chatgpt">OpenAI ChatGPT</LkvipSelect.Option>
          <LkvipSelect.Option value="deepseek">DeepSeek AI (tiết kiệm chi phí)</LkvipSelect.Option>
        </LkvipSelect>
      </Form.Item>
      <Form.Item
        label={
          <span>
            API Key
            <Text type="secondary" style={{ fontSize: 12, marginLeft: 6 }}>
              Chỉ cần khi dùng ChatGPT / DeepSeek
            </Text>
          </span>
        }
        name="api_key"
      >
        <LkvipInput.Password placeholder="sk-XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX" />
      </Form.Item>
      <Form.Item label="Model AI" name="model">
        <LkvipSelect>
          <LkvipSelect.Option value="gpt-4o-mini">GPT-4o Mini — $0.15/$0.60 per 1M tokens (tiết kiệm nhất)</LkvipSelect.Option>
          <LkvipSelect.Option value="gpt-4o">GPT-4o — đa năng, chất lượng cao</LkvipSelect.Option>
          <LkvipSelect.Option value="gpt-3.5-turbo">GPT-3.5 Turbo — nhanh, rẻ</LkvipSelect.Option>
          <LkvipSelect.Option value="deepseek-chat">DeepSeek Chat — chi phí cực thấp</LkvipSelect.Option>
        </LkvipSelect>
      </Form.Item>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={save.isPending}>
        Lưu cấu hình AI
      </Button>
    </LkvipForm>
  );
}

// ── Main ────────────────────────────────────────────────────────────────────────
function ConnectionsInner() {
  const { data: settings, isLoading } = useConnectionSettings();

  const tabs = [
    { key: 'smtp',     label: 'SMTP Email',   children: <TabSMTP settings={settings} /> },
    { key: 'telegram', label: 'Telegram Bot',  children: <TabTelegram settings={settings} /> },
    { key: 'google',   label: 'Google Login',  children: <TabGoogleLogin settings={settings} /> },
    { key: 'ai',       label: 'AI / ChatGPT',  children: <TabChatGPT settings={settings} /> },
  ];

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-black text-white">Kết nối</h1>
        <p className="text-sm text-gray-400 mt-0.5">Cấu hình tích hợp dịch vụ bên ngoài</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spin size="large" /></div>
      ) : (
        <Card>
          <Tabs items={tabs} />
        </Card>
      )}
    </div>
  );
}

export default function ConnectionsPage() {
  return <App><ConnectionsInner /></App>;
}
