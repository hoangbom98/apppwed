// Route: /settings/widgets
// Cấu hình widget nhúng vào trang: Zalo OA, Facebook Messenger, Live Chat, Gọi điện,
// Google Analytics, Facebook Pixel — lưu vào SystemSetting với group='widget'
import React from 'react';
import {
  App, Card, Tabs, Form, Input, Switch, Button, Space, Typography,
  Alert, Divider, Tag, Tooltip, Row, Col, Select,
} from 'antd';
import {
  SaveOutlined, ReloadOutlined, EyeOutlined, EyeInvisibleOutlined,
  CopyOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@admin/api/client';

const { Text, Paragraph } = Typography;

// ── Widget preview snippet renderer ────────────────────────────────────────────
function CodeSnippet({ code, label }) {
  const { message } = App.useApp();
  if (!code) return null;
  return (
    <div
      style={{
        background: '#0d1117',
        border: '1px solid #30363d',
        borderRadius: 6,
        padding: '12px 14px',
        marginTop: 8,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <Text style={{ color: '#8b949e', fontSize: 11 }}>{label}</Text>
        <Tooltip title="Sao chép">
          <Button
            size="small"
            type="text"
            icon={<CopyOutlined />}
            style={{ color: '#58a6ff' }}
            onClick={() => { navigator.clipboard.writeText(code); message.success('Đã sao chép'); }}
          />
        </Tooltip>
      </div>
      <pre style={{ margin: 0, fontSize: 11, color: '#e6edf3', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
        {code}
      </pre>
    </div>
  );
}

// ── Zalo OA Widget ──────────────────────────────────────────────────────────────
function ZaloTab({ settings, onSave, isSaving }) {
  const [form] = Form.useForm();
  const oaId   = Form.useWatch('widget.zalo.oa_id', form);
  const enabled = Form.useWatch('widget.zalo.enabled', form);

  React.useEffect(() => {
    form.setFieldsValue({
      'widget.zalo.oa_id':   settings['widget.zalo.oa_id']   ?? '',
      'widget.zalo.enabled': settings['widget.zalo.enabled'] !== 'false',
      'widget.zalo.color':   settings['widget.zalo.color']   ?? '#0068FF',
    });
  }, [settings, form]);

  const snippet = oaId
    ? `<!-- Zalo Chat Widget -->
<script src="https://sp.zalo.me/plugins/sdk.js"></script>
<div class="zalo-chat-widget"
     data-oaid="${oaId}"
     data-welcome-message="Xin chào! Chúng tôi có thể giúp gì cho bạn?"
     data-autopopup="0"
     data-width="350"
     data-height="420">
</div>`
    : '';

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Zalo Official Account Chat Widget"
        description={
          <span>
            Đăng ký tại{' '}
            <a href="https://oa.zalo.me" target="_blank" rel="noreferrer">oa.zalo.me</a>
            {' '}→ Lấy OA ID từ trang quản trị OA.
          </span>
        }
      />
      <Row gutter={16}>
        <Col xs={24} md={14}>
          <Form.Item label="Zalo OA ID" name="widget.zalo.oa_id" rules={[{ required: true, message: 'Nhập OA ID' }]}>
            <Input placeholder="1234567890123456789" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Màu chủ đạo" name="widget.zalo.color">
            <Input type="color" style={{ width: '100%', height: 32 }} />
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label="Bật widget" name="widget.zalo.enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <CodeSnippet code={snippet} label="Dán vào </body> của trang web" />
      <Divider />
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSaving}>
        Lưu cấu hình Zalo
      </Button>
    </Form>
  );
}

// ── Facebook Messenger Widget ───────────────────────────────────────────────────
function FacebookTab({ settings, onSave, isSaving }) {
  const [form] = Form.useForm();
  const pageId = Form.useWatch('widget.fb.page_id', form);

  React.useEffect(() => {
    form.setFieldsValue({
      'widget.fb.page_id':  settings['widget.fb.page_id']  ?? '',
      'widget.fb.enabled':  settings['widget.fb.enabled']  !== 'false',
      'widget.fb.language': settings['widget.fb.language'] ?? 'vi_VN',
    });
  }, [settings, form]);

  const snippet = pageId
    ? `<!-- Facebook Messenger Chat Plugin -->
<div id="fb-root"></div>
<script async defer crossorigin="anonymous"
  src="https://connect.facebook.net/vi_VN/sdk.js#xfbml=1&version=v18.0&appId=YOUR_APP_ID">
</script>
<div class="fb-customerchat"
     attribution="biz_inbox"
     page_id="${pageId}"
     theme_color="#0a7cff">
</div>`
    : '';

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Facebook Messenger Customer Chat"
        description="Vào Facebook Page Settings → Messaging → Thêm Messenger vào website."
      />
      <Row gutter={16}>
        <Col xs={24} md={14}>
          <Form.Item label="Facebook Page ID" name="widget.fb.page_id" rules={[{ required: true }]}>
            <Input placeholder="123456789012345" />
          </Form.Item>
        </Col>
        <Col xs={24} md={6}>
          <Form.Item label="Ngôn ngữ" name="widget.fb.language">
            <Select>
              <Select.Option value="vi_VN">Tiếng Việt</Select.Option>
              <Select.Option value="en_US">English</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={4}>
          <Form.Item label="Bật widget" name="widget.fb.enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <CodeSnippet code={snippet} label="Dán vào </body> — thay YOUR_APP_ID bằng App ID của bạn" />
      <Divider />
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSaving}>
        Lưu cấu hình Facebook
      </Button>
    </Form>
  );
}

// ── Phone / Call Button Widget ──────────────────────────────────────────────────
function PhoneTab({ settings, onSave, isSaving }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue({
      'widget.phone.number':   settings['widget.phone.number']   ?? '',
      'widget.phone.label':    settings['widget.phone.label']    ?? 'Gọi ngay',
      'widget.phone.enabled':  settings['widget.phone.enabled']  !== 'false',
      'widget.phone.position': settings['widget.phone.position'] ?? 'bottom-right',
    });
  }, [settings, form]);

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Alert
        type="info"
        showIcon
        style={{ marginBottom: 16 }}
        message="Nút gọi điện nổi (Floating Call Button)"
        description="Hiển thị nút gọi điện nổi ở góc trang, giúp khách hàng liên hệ nhanh."
      />
      <Row gutter={16}>
        <Col xs={24} md={10}>
          <Form.Item label="Số điện thoại" name="widget.phone.number" rules={[{ required: true }]}>
            <Input placeholder="+84901234567" />
          </Form.Item>
        </Col>
        <Col xs={24} md={8}>
          <Form.Item label="Nhãn nút" name="widget.phone.label">
            <Input placeholder="Gọi ngay" />
          </Form.Item>
        </Col>
        <Col xs={24} md={3}>
          <Form.Item label="Vị trí" name="widget.phone.position">
            <Select>
              <Select.Option value="bottom-right">Phải</Select.Option>
              <Select.Option value="bottom-left">Trái</Select.Option>
            </Select>
          </Form.Item>
        </Col>
        <Col xs={24} md={3}>
          <Form.Item label="Bật" name="widget.phone.enabled" valuePropName="checked">
            <Switch />
          </Form.Item>
        </Col>
      </Row>
      <Divider />
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSaving}>
        Lưu cấu hình Phone
      </Button>
    </Form>
  );
}

// ── Analytics & Tracking ────────────────────────────────────────────────────────
function AnalyticsTab({ settings, onSave, isSaving }) {
  const [form] = Form.useForm();
  const gaId  = Form.useWatch('widget.ga.id', form);
  const fbPid = Form.useWatch('widget.fbpixel.id', form);

  React.useEffect(() => {
    form.setFieldsValue({
      'widget.ga.id':           settings['widget.ga.id']          ?? '',
      'widget.ga.enabled':      settings['widget.ga.enabled']     !== 'false',
      'widget.fbpixel.id':      settings['widget.fbpixel.id']     ?? '',
      'widget.fbpixel.enabled': settings['widget.fbpixel.enabled'] !== 'false',
      'widget.gtm.id':          settings['widget.gtm.id']         ?? '',
      'widget.gtm.enabled':     settings['widget.gtm.enabled']    !== 'false',
    });
  }, [settings, form]);

  const gaSnippet = gaId
    ? `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${gaId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '${gaId}');
</script>`
    : '';

  const fbSnippet = fbPid
    ? `<!-- Facebook Pixel -->
<script>
  !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){...};
  fbq('init', '${fbPid}');
  fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
  src="https://www.facebook.com/tr?id=${fbPid}&ev=PageView&noscript=1"/></noscript>`
    : '';

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Card title="Google Analytics 4" size="small" style={{ marginBottom: 16 }}
        extra={<Form.Item name="widget.ga.enabled" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>}>
        <Form.Item label="Measurement ID" name="widget.ga.id">
          <Input placeholder="G-XXXXXXXXXX" style={{ maxWidth: 280 }} />
        </Form.Item>
        <CodeSnippet code={gaSnippet} label="Dán vào <head>" />
      </Card>

      <Card title="Facebook Pixel" size="small" style={{ marginBottom: 16 }}
        extra={<Form.Item name="widget.fbpixel.enabled" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>}>
        <Form.Item label="Pixel ID" name="widget.fbpixel.id">
          <Input placeholder="123456789012345" style={{ maxWidth: 280 }} />
        </Form.Item>
        <CodeSnippet code={fbSnippet} label="Dán vào <head>" />
      </Card>

      <Card title="Google Tag Manager" size="small" style={{ marginBottom: 16 }}
        extra={<Form.Item name="widget.gtm.enabled" valuePropName="checked" noStyle><Switch size="small" /></Form.Item>}>
        <Form.Item label="Container ID" name="widget.gtm.id">
          <Input placeholder="GTM-XXXXXXX" style={{ maxWidth: 280 }} />
        </Form.Item>
      </Card>

      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSaving}>
        Lưu Analytics
      </Button>
    </Form>
  );
}

// ── Custom Script / Head Injection ──────────────────────────────────────────────
function CustomScriptTab({ settings, onSave, isSaving }) {
  const [form] = Form.useForm();

  React.useEffect(() => {
    form.setFieldsValue({
      'widget.head_scripts':   settings['widget.head_scripts']   ?? '',
      'widget.body_scripts':   settings['widget.body_scripts']   ?? '',
    });
  }, [settings, form]);

  return (
    <Form form={form} layout="vertical" onFinish={onSave}>
      <Alert
        type="warning"
        showIcon
        style={{ marginBottom: 16 }}
        message="Chú ý bảo mật"
        description="Các đoạn code tuỳ chỉnh sẽ được nhúng trực tiếp vào trang. Chỉ dán code từ nguồn tin cậy."
      />
      <Form.Item
        label={<><code>&lt;head&gt;</code> — Scripts / Styles nhúng vào đầu trang</>}
        name="widget.head_scripts"
      >
        <Input.TextArea
          rows={6}
          placeholder="<!-- Google Fonts, tracking scripts, CSS overrides... -->"
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Form.Item>
      <Form.Item
        label={<>Trước <code>&lt;/body&gt;</code> — Scripts nhúng cuối trang</>}
        name="widget.body_scripts"
      >
        <Input.TextArea
          rows={6}
          placeholder="<!-- Live chat widgets, analytics... -->"
          style={{ fontFamily: 'monospace', fontSize: 12 }}
        />
      </Form.Item>
      <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={isSaving}>
        Lưu Custom Scripts
      </Button>
    </Form>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────────
function WidgetsInner() {
  const { message } = App.useApp();
  const qc = useQueryClient();

  // Fetch all widget-group settings as a flat key→value map
  const { data: settings = {}, isLoading } = useQuery({
    queryKey: ['system-settings', 'widget'],
    queryFn: () =>
      api.get('/admin/settings', { params: { group: 'widget' } })
         .then(r => {
           const arr = r.data?.data ?? r.data ?? [];
           return arr.reduce((acc, item) => ({ ...acc, [item.key]: item.value }), {});
         }),
  });

  const save = useMutation({
    mutationFn: (values) =>
      api.post('/admin/settings/bulk', {
        settings: Object.entries(values).map(([key, value]) => ({
          key,
          value: typeof value === 'boolean' ? String(value) : (value ?? ''),
          group: 'widget',
        })),
      }),
    onSuccess: () => {
      message.success('Đã lưu cấu hình widget');
      qc.invalidateQueries({ queryKey: ['system-settings', 'widget'] });
    },
    onError: (err) => {
      message.error(`Lỗi: ${err?.response?.data?.message ?? err.message}`);
    },
  });

  const tabItems = [
    {
      key: 'zalo',
      label: (
        <Space size={6}>
          <span style={{ color: '#0068FF' }}>●</span> Zalo OA
        </Space>
      ),
      children: <ZaloTab settings={settings} onSave={save.mutate} isSaving={save.isPending} />,
    },
    {
      key: 'facebook',
      label: (
        <Space size={6}>
          <span style={{ color: '#1877F2' }}>●</span> Facebook
        </Space>
      ),
      children: <FacebookTab settings={settings} onSave={save.mutate} isSaving={save.isPending} />,
    },
    {
      key: 'phone',
      label: (
        <Space size={6}>
          <span style={{ color: '#52c41a' }}>●</span> Phone / Hotline
        </Space>
      ),
      children: <PhoneTab settings={settings} onSave={save.mutate} isSaving={save.isPending} />,
    },
    {
      key: 'analytics',
      label: (
        <Space size={6}>
          <span style={{ color: '#fa8c16' }}>●</span> Analytics & Pixel
        </Space>
      ),
      children: <AnalyticsTab settings={settings} onSave={save.mutate} isSaving={save.isPending} />,
    },
    {
      key: 'custom',
      label: (
        <Space size={6}>
          <span style={{ color: '#722ed1' }}>●</span> Custom Scripts
        </Space>
      ),
      children: <CustomScriptTab settings={settings} onSave={save.mutate} isSaving={save.isPending} />,
    },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-white">Widgets &amp; Addons</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            Cấu hình các widget nhúng vào trang web: chat, tracking, hotline
          </p>
        </div>
        <Space>
          <Tag color="processing" icon={<CheckCircleOutlined />}>
            Tất cả cấu hình lưu vào SystemSetting · group=widget
          </Tag>
        </Space>
      </div>

      <Card loading={isLoading} bodyStyle={{ padding: 0 }}>
        <Tabs
          defaultActiveKey="zalo"
          items={tabItems}
          tabBarStyle={{ paddingLeft: 16, paddingRight: 16, marginBottom: 0 }}
          destroyInactiveTabPane={false}
          size="large"
          style={{ padding: '0 0 16px' }}
        />
      </Card>
    </div>
  );
}

export default function WidgetsPage() {
  return <App><WidgetsInner /></App>;
}
