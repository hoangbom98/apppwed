/**
 * AdminSettings.jsx  —  Route: /settings
 *
 * Trang cài đặt hệ thống với 5 tab chuyên biệt:
 *   Tab 1: ⚙️  Chung        – site name, logo, contact, maintenance
 *   Tab 2: 📧  Email/SMTP   – SMTP host/port/user/pass/from
 *   Tab 3: 💳  Thanh toán   – nạp/rút min-max, phí, auto-approve
 *   Tab 4: 🔐  Bảo mật      – login attempts, lockout, session, 2FA
 *   Tab 5: 🔧  Nâng cao     – bảng key-value raw (toàn bộ settings)
 *
 * Endpoints:
 *   GET    /admin/settings?group=xxx
 *   PUT    /admin/settings/:key   { value }
 *   POST   /admin/settings        { key, value, group, description }
 *   DELETE /admin/settings/:key
 */
import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  App, Tabs, Input, InputNumber, Switch, Button,
  Select, Alert, Modal, Form, Typography,
} from 'antd';
import {
  SettingOutlined, MailOutlined, CreditCardOutlined,
  SafetyOutlined, ToolOutlined, SaveOutlined,
} from '@ant-design/icons';
import api from '@admin/api/client';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

const GROUP_LABELS = {
  general:  'Cài đặt chung',
  security: 'Bảo mật',
  email:    'Email / SMTP',
  payment:  'Thanh toán',
  sms:      'SMS / OTP',
  storage:  'Lưu trữ file',
};

function useSettings(group) {
  return useQuery({
    queryKey: ['settings', group],
    queryFn: () =>
      api.get('/admin/settings', { params: group ? { group } : {} })
        .then(r => {
          const raw = r.data?.data ?? r.data ?? [];
          // Normalise thành map key → item
          const map = {};
          (Array.isArray(raw) ? raw : []).forEach(s => { map[s.key] = s; });
          return map;
        }),
    staleTime: 60_000,
  });
}

// Lưu một key đơn lẻ
function useSaveSetting(onOk, onErr) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, group, description }) => {
      // Thử PUT trước; nếu 404 thì POST
      return api.put(`/admin/settings/${key}`, { value }).catch(e => {
        if (e?.response?.status === 404) {
          return api.post('/admin/settings', { key, value, group: group ?? 'general', description });
        }
        throw e;
      });
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['settings'] }); onOk?.(); },
    onError: (e) => onErr?.(e?.response?.data?.message || 'Lỗi khi lưu'),
  });
}

// ─────────────────────────────────────────────────────────────────────────────
// Primitive UI atoms
// ─────────────────────────────────────────────────────────────────────────────

function Label({ children, required }) {
  return (
    <label className="block text-xs text-gray-400 mb-1.5">
      {children}{required && <span className="text-red-400 ml-0.5">*</span>}
    </label>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-4">
      <h3 className="text-xs text-gray-500 uppercase tracking-wider font-semibold pt-2">{title}</h3>
      {children}
    </div>
  );
}

function FieldRow({ label, info, children }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 items-start">
      <div>
        <p className="text-sm text-gray-300 font-medium">{label}</p>
        {info && <p className="text-xs text-gray-500 mt-0.5">{info}</p>}
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 1 – Chung
// ─────────────────────────────────────────────────────────────────────────────

function TabGeneral() {
  const { message } = App.useApp();
  const { data: settings = {}, isLoading } = useSettings('general');
  const [form, setForm] = useState(null);

  const merged = useMemo(() => {
    const base = {
      site_name:     settings.site_name?.value     ?? '',
      site_logo:     settings.site_logo?.value     ?? '',
      contact_email: settings.contact_email?.value ?? '',
      contact_phone: settings.contact_phone?.value ?? '',
      maintenance:   settings.maintenance?.value   === 'true',
    };
    return form ?? base;
  }, [settings, form]);

  const reset = () => setForm(null);

  const saveMut = useSaveSetting(
    () => { message.success('Đã lưu cài đặt chung'); setForm(null); },
    (e) => { message.error(String(e)); },
  );

  const set = (k, v) => setForm(f => ({ ...(f ?? merged), [k]: v }));

  const handleSave = () => {
    const pairs = [
      { key: 'site_name',     value: merged.site_name,     group: 'general' },
      { key: 'site_logo',     value: merged.site_logo,     group: 'general' },
      { key: 'contact_email', value: merged.contact_email, group: 'general' },
      { key: 'contact_phone', value: merged.contact_phone, group: 'general' },
      { key: 'maintenance',   value: String(merged.maintenance), group: 'general' },
    ];
    // Lưu tuần tự
    pairs.reduce((p, item) => p.then(() => saveMut.mutateAsync(item)), Promise.resolve())
      .catch(() => {});
  };

  if (isLoading) return <div className="py-16 text-center text-gray-500 animate-pulse">Đang tải…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Thông tin website">
        <FieldRow label="Tên website" info="Hiện thị trên tab trình duyệt">
          <Input
            value={merged.site_name}
            onChange={e => set('site_name', e.target.value)}
            placeholder="Ví dụ: LKVIP Admin"
          />
        </FieldRow>
        <FieldRow label="URL Logo" info="Đường dẫn ảnh logo (CDN hoặc upload)">
          <Input
            value={merged.site_logo}
            onChange={e => set('site_logo', e.target.value)}
            placeholder="https://…/logo.png"
          />
        </FieldRow>
      </Section>

      <Section title="Thông tin liên hệ">
        <FieldRow label="Email liên hệ">
          <Input
            value={merged.contact_email}
            onChange={e => set('contact_email', e.target.value)}
            placeholder="admin@example.com"
          />
        </FieldRow>
        <FieldRow label="Số điện thoại">
          <Input
            value={merged.contact_phone}
            onChange={e => set('contact_phone', e.target.value)}
            placeholder="0909xxxxxx"
          />
        </FieldRow>
      </Section>

      <Section title="Vận hành">
        <FieldRow label="Chế độ bảo trì" info="Khi bật, người dùng thấy trang thông báo bảo trì">
          <div className="flex items-center gap-2">
            <Switch
              checked={merged.maintenance}
              onChange={v => set('maintenance', v)}
            />
            <span className="text-sm text-gray-300">
              {merged.maintenance ? 'Đang bảo trì' : 'Hoạt động bình thường'}
            </span>
          </div>
        </FieldRow>
      </Section>

      <div className="flex gap-3 pt-2">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMut.isPending}
          onClick={handleSave}
        >
          {saveMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
        {form && (
          <Button onClick={reset} className="bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700">
            Huỷ thay đổi
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 2 – Email / SMTP
// ─────────────────────────────────────────────────────────────────────────────

function TabEmail() {
  const { message } = App.useApp();
  const { data: settings = {}, isLoading } = useSettings('email');
  const [form, setForm] = useState(null);

  const merged = useMemo(() => {
    const base = {
      smtp_host:       settings.smtp_host?.value       ?? '',
      smtp_port:       settings.smtp_port?.value       ?? '587',
      smtp_user:       settings.smtp_user?.value       ?? '',
      smtp_pass:       '',
      smtp_from:       settings.smtp_from?.value       ?? '',
      smtp_encryption: settings.smtp_encryption?.value ?? 'tls',
    };
    return form ?? base;
  }, [settings, form]);

  const set = (k, v) => setForm(f => ({ ...(f ?? merged), [k]: v }));

  const saveMut = useSaveSetting(
    () => { message.success('Đã lưu cài đặt Email'); setForm(null); },
    (e) => { message.error(String(e)); },
  );

  const handleSave = () => {
    const pairs = [
      { key: 'smtp_host',       value: merged.smtp_host,       group: 'email', description: 'SMTP Host' },
      { key: 'smtp_port',       value: merged.smtp_port,       group: 'email', description: 'SMTP Port' },
      { key: 'smtp_user',       value: merged.smtp_user,       group: 'email', description: 'SMTP Username' },
      ...(merged.smtp_pass ? [{ key: 'smtp_pass', value: merged.smtp_pass, group: 'email', description: 'SMTP Password (secret)' }] : []),
      { key: 'smtp_from',       value: merged.smtp_from,       group: 'email', description: 'From email address' },
      { key: 'smtp_encryption', value: merged.smtp_encryption, group: 'email', description: 'Encryption protocol' },
    ];
    pairs.reduce((p, item) => p.then(() => saveMut.mutateAsync(item)), Promise.resolve()).catch(() => {});
  };

  if (isLoading) return <div className="py-16 text-center text-gray-500 animate-pulse">Đang tải…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Alert
        type="info"
        banner
        message="Cấu hình SMTP dùng để gửi email xác nhận, OTP và thông báo hệ thống. Gmail khuyến nghị dùng App Password với port 587/TLS."
      />

      <Section title="Máy chủ SMTP">
        <FieldRow label="SMTP Host" info="Ví dụ: smtp.gmail.com">
          <Input
            value={merged.smtp_host}
            onChange={e => set('smtp_host', e.target.value)}
            placeholder="smtp.gmail.com"
          />
        </FieldRow>
        <FieldRow label="Port" info="Thường là 587 (TLS) hoặc 465 (SSL)">
          <Input
            value={merged.smtp_port}
            onChange={e => set('smtp_port', e.target.value)}
            placeholder="587"
            type="number"
          />
        </FieldRow>
        <FieldRow label="Mã hóa">
          <Select
            value={merged.smtp_encryption}
            onChange={v => set('smtp_encryption', v)}
            style={{ width: '100%' }}
            options={[
              { value: 'tls',  label: 'TLS (khuyến nghị)' },
              { value: 'ssl',  label: 'SSL' },
              { value: 'none', label: 'Không mã hóa' },
            ]}
          />
        </FieldRow>
      </Section>

      <Section title="Xác thực">
        <FieldRow label="Tên đăng nhập" info="Thường là địa chỉ email">
          <Input
            value={merged.smtp_user}
            onChange={e => set('smtp_user', e.target.value)}
            placeholder="your@gmail.com"
          />
        </FieldRow>
        <FieldRow label="Mật khẩu / App Password" info="Gmail: dùng App Password 16 ký tự">
          <Input.Password
            value={merged.smtp_pass}
            onChange={e => set('smtp_pass', e.target.value)}
            placeholder="••••••••••••••••"
          />
        </FieldRow>
        <FieldRow label="Địa chỉ From" info="Email hiển thị cho người nhận">
          <Input
            value={merged.smtp_from}
            onChange={e => set('smtp_from', e.target.value)}
            placeholder="noreply@tc-gaming.live"
          />
        </FieldRow>
      </Section>

      <div className="flex gap-3 pt-2">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMut.isPending}
          onClick={handleSave}
        >
          {saveMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
        {form && (
          <Button onClick={() => setForm(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700">
            Huỷ
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 3 – Thanh toán
// ─────────────────────────────────────────────────────────────────────────────

function TabPayment() {
  const { message } = App.useApp();
  const { data: settings = {}, isLoading } = useSettings('payment');
  const [form, setForm] = useState(null);

  const merged = useMemo(() => {
    const base = {
      min_deposit:           settings.min_deposit?.value           ?? '50000',
      min_withdrawal:        settings.min_withdrawal?.value        ?? '100000',
      max_withdrawal_daily:  settings.max_withdrawal_daily?.value  ?? '50000000',
      withdrawal_fee_flat:   settings.withdrawal_fee_flat?.value   ?? '0',
      withdrawal_fee_pct:    settings.withdrawal_fee_pct?.value    ?? '0',
      auto_approve_deposits: settings.auto_approve_deposits?.value === 'true',
      auto_approve_limit:    settings.auto_approve_limit?.value    ?? '0',
      require_kyc_withdraw:  settings.require_kyc_withdraw?.value  !== 'false',
    };
    return form ?? base;
  }, [settings, form]);

  const set = (k, v) => setForm(f => ({ ...(f ?? merged), [k]: v }));

  const saveMut = useSaveSetting(
    () => { message.success('Đã lưu cài đặt thanh toán'); setForm(null); },
    (e) => { message.error(String(e)); },
  );

  const handleSave = () => {
    const pairs = [
      { key: 'min_deposit',           value: merged.min_deposit,           group: 'payment', description: 'Nạp tối thiểu (VND)' },
      { key: 'min_withdrawal',        value: merged.min_withdrawal,        group: 'payment', description: 'Rút tối thiểu (VND)' },
      { key: 'max_withdrawal_daily',  value: merged.max_withdrawal_daily,  group: 'payment', description: 'Rút tối đa mỗi ngày (VND)' },
      { key: 'withdrawal_fee_flat',   value: merged.withdrawal_fee_flat,   group: 'payment', description: 'Phí rút cố định (VND)' },
      { key: 'withdrawal_fee_pct',    value: merged.withdrawal_fee_pct,    group: 'payment', description: 'Phí rút theo % (0-100)' },
      { key: 'auto_approve_deposits', value: String(merged.auto_approve_deposits), group: 'payment', description: 'Tự duyệt nạp tiền' },
      { key: 'auto_approve_limit',    value: merged.auto_approve_limit,    group: 'payment', description: 'Tự duyệt nếu ≤ giá trị này (VND)' },
      { key: 'require_kyc_withdraw',  value: String(merged.require_kyc_withdraw),  group: 'payment', description: 'Yêu cầu KYC để rút tiền' },
    ];
    pairs.reduce((p, item) => p.then(() => saveMut.mutateAsync(item)), Promise.resolve()).catch(() => {});
  };

  const fmt = v => v ? Number(v).toLocaleString('vi-VN') + ' ₫' : '—';

  if (isLoading) return <div className="py-16 text-center text-gray-500 animate-pulse">Đang tải…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Giới hạn giao dịch">
        <FieldRow label="Nạp tối thiểu" info={`Hiện tại: ${fmt(merged.min_deposit)}`}>
          <Input
            value={merged.min_deposit}
            onChange={e => set('min_deposit', e.target.value)}
            type="number"
            placeholder="50000"
          />
        </FieldRow>
        <FieldRow label="Rút tối thiểu" info={`Hiện tại: ${fmt(merged.min_withdrawal)}`}>
          <Input
            value={merged.min_withdrawal}
            onChange={e => set('min_withdrawal', e.target.value)}
            type="number"
            placeholder="100000"
          />
        </FieldRow>
        <FieldRow label="Rút tối đa / ngày" info={`Hiện tại: ${fmt(merged.max_withdrawal_daily)}`}>
          <Input
            value={merged.max_withdrawal_daily}
            onChange={e => set('max_withdrawal_daily', e.target.value)}
            type="number"
            placeholder="50000000"
          />
        </FieldRow>
      </Section>

      <Section title="Phí rút tiền">
        <FieldRow label="Phí cố định (VND)" info="0 = miễn phí">
          <Input
            value={merged.withdrawal_fee_flat}
            onChange={e => set('withdrawal_fee_flat', e.target.value)}
            type="number"
            placeholder="0"
          />
        </FieldRow>
        <FieldRow label="Phí theo %" info="0-100, ví dụ: 1.5 = 1.5%">
          <Input
            value={merged.withdrawal_fee_pct}
            onChange={e => set('withdrawal_fee_pct', e.target.value)}
            type="number"
            placeholder="0"
          />
        </FieldRow>
      </Section>

      <Section title="Tự động duyệt">
        <FieldRow label="Tự duyệt nạp tiền" info="Nạp tiền sẽ được duyệt tự động">
          <div className="flex items-center gap-2">
            <Switch
              checked={merged.auto_approve_deposits}
              onChange={v => set('auto_approve_deposits', v)}
            />
            <span className="text-sm text-gray-300">
              {merged.auto_approve_deposits ? 'Đang bật' : 'Đang tắt'}
            </span>
          </div>
        </FieldRow>
        <FieldRow label="Ngưỡng tự duyệt rút" info="Rút ≤ ngưỡng này sẽ tự động duyệt (0 = tắt)">
          <Input
            value={merged.auto_approve_limit}
            onChange={e => set('auto_approve_limit', e.target.value)}
            type="number"
            placeholder="0"
          />
        </FieldRow>
      </Section>

      <Section title="Bảo mật thanh toán">
        <FieldRow label="Yêu cầu KYC để rút tiền" info="User chưa xác minh sẽ không rút được">
          <div className="flex items-center gap-2">
            <Switch
              checked={merged.require_kyc_withdraw}
              onChange={v => set('require_kyc_withdraw', v)}
            />
            <span className="text-sm text-gray-300">
              {merged.require_kyc_withdraw ? 'Bắt buộc' : 'Không bắt buộc'}
            </span>
          </div>
        </FieldRow>
      </Section>

      <div className="flex gap-3 pt-2">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMut.isPending}
          onClick={handleSave}
        >
          {saveMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
        {form && (
          <Button onClick={() => setForm(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700">
            Huỷ
          </Button>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 4 – Bảo mật
// ─────────────────────────────────────────────────────────────────────────────

function TabSecurity() {
  const { message } = App.useApp();
  const { data: settings = {}, isLoading } = useSettings('security');
  const [form, setForm] = useState(null);

  const merged = useMemo(() => {
    const base = {
      max_login_attempts:  settings.max_login_attempts?.value  ?? '5',
      lockout_minutes:     settings.lockout_minutes?.value     ?? '15',
      session_timeout:     settings.session_timeout?.value     ?? '3600',
      require_2fa:         settings.require_2fa?.value         === 'true',
      otp_expire_minutes:  settings.otp_expire_minutes?.value  ?? '5',
      password_min_length: settings.password_min_length?.value ?? '8',
      ip_whitelist_admin:  settings.ip_whitelist_admin?.value  ?? '',
    };
    return form ?? base;
  }, [settings, form]);

  const set = (k, v) => setForm(f => ({ ...(f ?? merged), [k]: v }));

  const saveMut = useSaveSetting(
    () => { message.success('Đã lưu cài đặt bảo mật'); setForm(null); },
    (e) => { message.error(String(e)); },
  );

  const handleSave = () => {
    const pairs = [
      { key: 'max_login_attempts',  value: merged.max_login_attempts,  group: 'security', description: 'Số lần đăng nhập sai tối đa' },
      { key: 'lockout_minutes',     value: merged.lockout_minutes,     group: 'security', description: 'Thời gian khóa tài khoản (phút)' },
      { key: 'session_timeout',     value: merged.session_timeout,     group: 'security', description: 'Phiên hết hạn sau (giây)' },
      { key: 'require_2fa',         value: String(merged.require_2fa), group: 'security', description: 'Bắt buộc 2FA cho admin' },
      { key: 'otp_expire_minutes',  value: merged.otp_expire_minutes,  group: 'security', description: 'OTP hết hạn sau (phút)' },
      { key: 'password_min_length', value: merged.password_min_length, group: 'security', description: 'Độ dài mật khẩu tối thiểu' },
      { key: 'ip_whitelist_admin',  value: merged.ip_whitelist_admin,  group: 'security', description: 'IP được phép truy cập admin (phân cách bằng dấu phẩy)' },
    ];
    pairs.reduce((p, item) => p.then(() => saveMut.mutateAsync(item)), Promise.resolve()).catch(() => {});
  };

  if (isLoading) return <div className="py-16 text-center text-gray-500 animate-pulse">Đang tải…</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      <Section title="Đăng nhập">
        <FieldRow label="Số lần sai tối đa" info="Sau số lần này tài khoản sẽ bị khóa tạm thời">
          <Input
            value={merged.max_login_attempts}
            onChange={e => set('max_login_attempts', e.target.value)}
            type="number"
            placeholder="5"
          />
        </FieldRow>
        <FieldRow label="Thời gian khóa (phút)" info="Khóa bao lâu sau khi vượt ngưỡng đăng nhập sai">
          <Input
            value={merged.lockout_minutes}
            onChange={e => set('lockout_minutes', e.target.value)}
            type="number"
            placeholder="15"
          />
        </FieldRow>
        <FieldRow label="Session timeout (giây)" info="Phiên đăng nhập hết hạn sau bao lâu không hoạt động">
          <Select
            value={merged.session_timeout}
            onChange={v => set('session_timeout', v)}
            style={{ width: '100%' }}
            options={[
              { value: '1800',  label: '30 phút' },
              { value: '3600',  label: '1 giờ' },
              { value: '7200',  label: '2 giờ' },
              { value: '14400', label: '4 giờ' },
              { value: '28800', label: '8 giờ' },
              { value: '86400', label: '24 giờ' },
            ]}
          />
        </FieldRow>
      </Section>

      <Section title="Xác thực 2 bước">
        <FieldRow label="Bắt buộc 2FA cho Admin" info="Tất cả admin phải bật xác thực 2 bước mới đăng nhập được">
          <div className="flex items-center gap-2">
            <Switch
              checked={merged.require_2fa}
              onChange={v => set('require_2fa', v)}
            />
            <span className="text-sm text-gray-300">
              {merged.require_2fa ? 'Bắt buộc' : 'Tuỳ chọn'}
            </span>
          </div>
        </FieldRow>
        <FieldRow label="OTP hết hạn sau (phút)" info="Mã OTP gửi qua email/SMS hết hạn sau thời gian này">
          <Input
            value={merged.otp_expire_minutes}
            onChange={e => set('otp_expire_minutes', e.target.value)}
            type="number"
            placeholder="5"
          />
        </FieldRow>
      </Section>

      <Section title="Mật khẩu & truy cập">
        <FieldRow label="Độ dài mật khẩu tối thiểu">
          <Input
            value={merged.password_min_length}
            onChange={e => set('password_min_length', e.target.value)}
            type="number"
            placeholder="8"
          />
        </FieldRow>
        <FieldRow label="Whitelist IP Admin" info="Chỉ các IP này mới truy cập được trang admin. Để trống = tất cả. Phân cách bằng dấu phẩy.">
          <Input.TextArea
            value={merged.ip_whitelist_admin}
            onChange={e => set('ip_whitelist_admin', e.target.value)}
            placeholder="192.168.1.1, 103.x.x.x"
            rows={3}
            style={{ fontFamily: 'monospace', fontSize: 12, resize: 'none' }}
          />
        </FieldRow>
      </Section>

      <div className="flex gap-3 pt-2 flex-wrap">
        <Button
          type="primary"
          icon={<SaveOutlined />}
          loading={saveMut.isPending}
          onClick={handleSave}
        >
          {saveMut.isPending ? 'Đang lưu…' : 'Lưu thay đổi'}
        </Button>
        {form && (
          <Button onClick={() => setForm(null)} className="bg-gray-800 hover:bg-gray-700 text-gray-400 border-gray-700">
            Huỷ
          </Button>
        )}
        <a
          href="/settings/security"
          className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm rounded-xl flex items-center gap-1.5"
        >
          <SafetyOutlined />
          Cài đặt bảo mật nâng cao →
        </a>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Tab 5 – Nâng cao (bảng key-value raw)
// ─────────────────────────────────────────────────────────────────────────────

function SettingEditForm({ initial, onSave, onClose, isSaving }) {
  const isCreate = !initial?.key;
  const [form, setForm] = useState({
    key:         initial?.key         ?? '',
    value:       initial?.value       ?? '',
    group:       initial?.group       ?? 'general',
    description: initial?.description ?? '',
  });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="space-y-4">
      {isCreate && (
        <Form.Item label={<Label required>Key</Label>} style={{ marginBottom: 0 }}>
          <Input
            value={form.key}
            onChange={e => set('key', e.target.value)}
            placeholder="maintenance_mode"
          />
        </Form.Item>
      )}
      <Form.Item label={<Label required>Value</Label>} style={{ marginBottom: 0 }}>
        <Input.TextArea
          rows={3}
          value={form.value}
          onChange={e => set('value', e.target.value)}
          style={{ resize: 'none' }}
        />
      </Form.Item>
      <Form.Item label={<Label>Nhóm</Label>} style={{ marginBottom: 0 }}>
        <Select
          value={form.group}
          onChange={v => set('group', v)}
          style={{ width: '100%' }}
          options={Object.entries(GROUP_LABELS).map(([k, v]) => ({ value: k, label: v }))}
        />
      </Form.Item>
      <Form.Item label={<Label>Mô tả</Label>} style={{ marginBottom: 0 }}>
        <Input
          value={form.description}
          onChange={e => set('description', e.target.value)}
        />
      </Form.Item>
      <div className="flex gap-3 pt-2">
        <Button onClick={onClose} className="flex-1">Huỷ</Button>
        <Button
          type="primary"
          onClick={() => onSave(form)}
          disabled={!form.key || isSaving}
          loading={isSaving}
          className="flex-1"
        >
          {isCreate ? 'Thêm' : 'Lưu'}
        </Button>
      </div>
    </div>
  );
}

function TabAdvanced() {
  const { message } = App.useApp();
  const qc = useQueryClient();
  const [group, setGroup] = useState('');
  const [search, setSearch] = useState('');
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const { data: rawSettings = [], isLoading } = useQuery({
    queryKey: ['settings-advanced', group],
    queryFn: () =>
      api.get('/admin/settings', { params: group ? { group } : {} })
        .then(r => r.data?.data ?? r.data ?? []),
    staleTime: 60_000,
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return rawSettings;
    const q = search.toLowerCase();
    return rawSettings.filter(s =>
      s.key?.toLowerCase().includes(q) ||
      s.description?.toLowerCase().includes(q) ||
      String(s.value ?? '').toLowerCase().includes(q),
    );
  }, [rawSettings, search]);

  const groupCounts = useMemo(() => {
    const c = {};
    rawSettings.forEach(s => { const g = s.group || 'general'; c[g] = (c[g] || 0) + 1; });
    return c;
  }, [rawSettings]);

  const saveMut = useMutation({
    mutationFn: (form) => editTarget?.key
      ? api.put(`/admin/settings/${editTarget.key}`, { value: form.value })
      : api.post('/admin/settings', form),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['settings-advanced'] });
      setEditTarget(null);
      message.success('Đã lưu cài đặt');
    },
    onError: (e) => message.error(e?.response?.data?.message || 'Lỗi'),
  });

  const deleteMut = useMutation({
    mutationFn: (key) => api.delete(`/admin/settings/${key}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] });
      qc.invalidateQueries({ queryKey: ['settings-advanced'] });
      setDeleteTarget(null);
      message.success('Đã xoá cài đặt');
    },
    onError: (e) => message.error(e?.response?.data?.message || 'Lỗi'),
  });

  const isSecret = (item) =>
    ['secret', 'password', 'pass', 'key'].some(w =>
      item.key?.toLowerCase().includes(w) || item.description?.toLowerCase().includes(w),
    );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 items-center justify-between">
        <Input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Tìm theo key hoặc mô tả…"
          style={{ width: 256 }}
        />
        <Button type="primary" onClick={() => setEditTarget({})}>
          + Thêm cài đặt
        </Button>
      </div>

      <div className="flex gap-5">
        {/* Sidebar nhóm */}
        <aside className="w-44 flex-shrink-0 space-y-1">
          {[['', 'Tất cả'], ...Object.entries(GROUP_LABELS)].map(([k, v]) => (
            <button
              key={k}
              onClick={() => setGroup(k)}
              className={[
                'w-full text-left px-3 py-2 rounded-lg text-sm transition-colors',
                group === k ? 'bg-blue-600/20 text-blue-400' : 'text-gray-400 hover:bg-gray-800 hover:text-white',
              ].filter(Boolean).join(' ')}
            >
              {v}
              {k && groupCounts[k] ? <span className="ml-1 text-xs opacity-50">({groupCounts[k]})</span> : ''}
              {!k ? <span className="ml-1 text-xs opacity-50">({rawSettings.length})</span> : ''}
            </button>
          ))}
        </aside>

        {/* Bảng */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="py-16 text-center text-gray-500 animate-pulse">Đang tải…</div>
          ) : filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-500">Không có cài đặt nào.</div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-800">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">
                    {['Key', 'Value', 'Nhóm', 'Mô tả', ''].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs text-gray-500 font-semibold">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-gray-900/50">
                  {filtered.map(item => (
                    <tr key={item.key} className="border-b border-gray-800 hover:bg-gray-800/40">
                      <td className="px-4 py-3 font-mono text-xs text-blue-400">{item.key}</td>
                      <td className="px-4 py-3 text-sm text-gray-300 max-w-xs truncate">
                        {isSecret(item) ? <span className="text-gray-600 italic">••••••••</span> : String(item.value ?? '—')}
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs bg-gray-800 text-gray-400 border border-gray-700">
                          {item.group || 'general'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">{item.description || '—'}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => setEditTarget(item)}
                            className="text-xs px-3 py-1 rounded bg-gray-800 text-gray-300 hover:bg-blue-600 hover:text-white transition-colors"
                          >
                            Sửa
                          </button>
                          <button
                            onClick={() => setDeleteTarget(item)}
                            className="text-xs px-3 py-1 rounded bg-gray-800 text-red-400 hover:bg-red-600 hover:text-white transition-colors"
                          >
                            Xoá
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal thêm/sửa */}
      <Modal
        open={editTarget !== null}
        title={editTarget?.key ? `Sửa: ${editTarget.key}` : 'Thêm cài đặt'}
        onCancel={() => setEditTarget(null)}
        footer={null}
        destroyOnClose
      >
        {editTarget !== null && (
          <SettingEditForm
            initial={editTarget}
            onSave={form => saveMut.mutate(form)}
            onClose={() => setEditTarget(null)}
            isSaving={saveMut.isPending}
          />
        )}
      </Modal>

      {/* Modal xoá */}
      <Modal
        open={!!deleteTarget}
        title="Xác nhận xoá"
        onCancel={() => setDeleteTarget(null)}
        footer={null}
        destroyOnClose
      >
        <p className="text-sm text-gray-300 mb-6">
          Xoá cài đặt <span className="font-mono text-blue-400">{deleteTarget?.key}</span>?
          Hành động này không thể hoàn tác.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setDeleteTarget(null)} className="flex-1">Huỷ</Button>
          <Button
            danger
            type="primary"
            onClick={() => deleteMut.mutate(deleteTarget.key)}
            disabled={deleteMut.isPending}
            loading={deleteMut.isPending}
            className="flex-1"
          >
            {deleteMut.isPending ? 'Đang xoá…' : 'Xoá'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────────────────────────

const TABS_CONFIG = [
  { key: 'general',  label: 'Chung',       icon: <SettingOutlined />,    component: TabGeneral  },
  { key: 'email',    label: 'Email/SMTP',   icon: <MailOutlined />,       component: TabEmail    },
  { key: 'payment',  label: 'Thanh toán',   icon: <CreditCardOutlined />, component: TabPayment  },
  { key: 'security', label: 'Bảo mật',      icon: <SafetyOutlined />,     component: TabSecurity },
  { key: 'advanced', label: 'Nâng cao',     icon: <ToolOutlined />,       component: TabAdvanced },
];

function AdminSettingsInner() {
  const [activeTab, setActiveTab] = useState('general');
  const ActiveComponent = TABS_CONFIG.find(t => t.key === activeTab)?.component ?? TabGeneral;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-white">Cài đặt hệ thống</h1>
        <p className="text-sm text-gray-400 mt-0.5">Quản lý toàn bộ tham số vận hành của hệ thống</p>
      </div>

      {/* Tab bar */}
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        tabPosition="top"
        type="line"
        items={TABS_CONFIG.map(t => ({
          key:      t.key,
          label:    <span className="flex items-center gap-1.5">{t.icon}{t.label}</span>,
          children: null,
        }))}
      />

      {/* Tab content */}
      <div className="pt-2">
        <ActiveComponent />
      </div>
    </div>
  );
}

export default function AdminSettings() {
  return (
    <App>
      <AdminSettingsInner />
    </App>
  );
}
