// Trang cá nhân (Mine) — profile, balance, VIP, menu điều hướng
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  UserOutlined, ReloadOutlined, CopyOutlined, CheckOutlined,
  ArrowUpOutlined, ArrowDownOutlined, SwapOutlined,
  TeamOutlined, BellOutlined, QuestionCircleOutlined, MessageOutlined,
  InfoCircleOutlined, MobileOutlined, SafetyOutlined, RightOutlined,
  StarOutlined, WalletOutlined, FileTextOutlined, LogoutOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { Collapse, Form, Input, Select, Button } from 'antd';
import * as mineApi from '../api/mineApi';
import { useAuthStore } from '@admin/store/adminStore';

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function fmt(n) {
  if (n == null) return '0';
  return Number(n).toLocaleString('vi-VN');
}

// ─────────────────────────────────────────────────────────────────────────────
// SUB-COMPONENTS
// ─────────────────────────────────────────────────────────────────────────────

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(String(text)).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };
  return (
    <button
      onClick={copy}
      className="ml-1.5 text-gray-400 hover:text-blue-400 transition-colors"
      title="Sao chép"
    >
      {copied
        ? <CheckOutlined style={{ fontSize: 13 }} className="text-green-400" />
        : <CopyOutlined  style={{ fontSize: 13 }} />
      }
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// UserProfileCard
// ─────────────────────────────────────────────────────────────────────────────
function UserProfileCard({ data, onRefreshBalance }) {
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshBalance().finally(() => setRefreshing(false));
  };

  return (
    <div className="bg-gray-800 rounded-xl p-5 flex items-start gap-4">
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {data?.avatar ? (
          <img
            src={data.avatar}
            alt={data.username}
            className="w-16 h-16 rounded-full object-cover border-2 border-blue-500/40"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
            <UserOutlined style={{ fontSize: 28 }} className="text-white" />
          </div>
        )}
        <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-green-500 border-2 border-gray-800" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {/* Name + role */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-semibold text-white text-base truncate">
            {data?.fullName || data?.username || '—'}
          </span>
          <span className="text-xs px-1.5 py-0.5 rounded bg-blue-600/30 text-blue-300 border border-blue-600/40">
            {data?.role === 'super_admin' ? 'Super Admin' : data?.role || 'Admin'}
          </span>
        </div>

        {/* Username + copy */}
        <div className="flex items-center text-sm text-gray-400 mt-0.5">
          <span className="truncate">@{data?.username}</span>
          <CopyButton text={data?.username} />
        </div>

        {/* ID */}
        <div className="flex items-center text-xs text-gray-500 mt-0.5">
          <span>ID:&nbsp;</span>
          <span className="font-mono truncate">{data?.id}</span>
          <CopyButton text={data?.id} />
        </div>

        {/* Balance row */}
        <div className="flex items-center gap-2 mt-2.5 bg-gray-900/60 rounded-lg px-3 py-2">
          <WalletOutlined style={{ fontSize: 14 }} className="text-yellow-400 flex-shrink-0" />
          <span className="text-yellow-300 font-bold text-base">
            {fmt(data?.balance)} <span className="text-xs font-normal text-gray-400">VND</span>
          </span>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="ml-auto text-gray-400 hover:text-blue-400 transition-colors disabled:opacity-50"
            title="Làm mới số dư"
          >
            <ReloadOutlined
              style={{ fontSize: 14 }}
              spin={refreshing}
            />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VIPProgressCard
// ─────────────────────────────────────────────────────────────────────────────
function VIPProgressCard({ data }) {
  const {
    vipLevel = 0, vipProgressPct = 0, vipRequired = 0,
    vipReward = 0, nextVipLevel, nextVipName, totalBet = 0,
    vipConfigs = [],
  } = data || {};

  const currentConfig = vipConfigs.find(v => v.level === vipLevel);
  const color         = currentConfig?.color || '#3b82f6';

  return (
    <div
      className="rounded-xl p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #1d355b 0%, #253f6a 50%, #316094 100%)' }}
    >
      <div className="flex items-center justify-between mb-3">
        {/* Current VIP badge */}
        <div className="flex items-center gap-2">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white shadow"
            style={{ background: color }}
          >
            {currentConfig?.name || `V${vipLevel}`}
          </div>
          <div>
            <div className="text-white font-semibold text-sm">
              VIP {currentConfig?.name || `Level ${vipLevel}`}
            </div>
            <div className="text-blue-200 text-xs">
              Cá cược: <span className="text-white font-medium">{fmt(totalBet)}</span>
            </div>
          </div>
        </div>

        {/* Reward block */}
        {nextVipLevel != null && (
          <div className="text-right">
            <div className="text-blue-200 text-xs">Thưởng thăng cấp</div>
            <div className="text-yellow-300 font-bold text-sm">{fmt(vipReward)}</div>
            <div className="text-blue-200 text-xs">→ {nextVipName}</div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      {nextVipLevel != null ? (
        <div>
          <div className="flex justify-between text-xs text-blue-200 mb-1">
            <span>Tiến trình lên {nextVipName}</span>
            <span>{vipProgressPct}%</span>
          </div>
          <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${vipProgressPct}%`, background: color }}
            />
          </div>
          <div className="text-xs text-blue-200 mt-1">
            Cần thêm: <span className="text-white">{fmt(Math.max(0, vipRequired - totalBet))}</span> VND
          </div>
        </div>
      ) : (
        <div className="text-center text-yellow-300 text-sm font-semibold py-1">
          <StarOutlined style={{ fontSize: 14 }} className="inline mr-1" />
          Cấp VIP cao nhất
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// QuickActions
// ─────────────────────────────────────────────────────────────────────────────
function QuickActions() {
  const actions = [
    { label: 'Rút tiền',    icon: ArrowUpOutlined,   color: 'text-red-400',    href: '/finance' },
    { label: 'Nạp tiền',    icon: ArrowDownOutlined, color: 'text-green-400',  href: '/finance' },
    { label: 'Chuyển quỹ',  icon: SwapOutlined,      color: 'text-blue-400',   href: '/transactions' },
    { label: 'Giao dịch',   icon: FileTextOutlined,  color: 'text-purple-400', href: '/transactions' },
  ];

  return (
    <div className="grid grid-cols-4 gap-2">
      {actions.map(({ label, icon: Icon, color, href }) => (
        <Link
          key={label}
          to={href}
          className="flex flex-col items-center gap-1.5 bg-gray-800 hover:bg-gray-700 transition-colors rounded-xl py-3 px-1"
        >
          <Icon style={{ fontSize: 20 }} className={color} />
          <span className="text-xs text-gray-300 text-center leading-tight">{label}</span>
        </Link>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MenuList
// ─────────────────────────────────────────────────────────────────────────────
function MenuList({ items }) {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden divide-y divide-gray-700/50">
      {items.map(({ id, icon: Icon, label, extra, badge, href, onClick }) => {
        const Inner = (
          <div className="flex items-center gap-3 px-4 py-3 hover:bg-gray-700/50 transition-colors cursor-pointer group">
            <div className="w-8 h-8 rounded-full bg-blue-600/20 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-600/30 transition-colors">
              <Icon style={{ fontSize: 16 }} className="text-blue-400" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm text-white">{label}</div>
              {extra && <div className="text-xs text-gray-400 truncate mt-0.5">{extra}</div>}
            </div>
            {badge != null && (
              <span className="text-xs bg-red-500 text-white rounded-full px-1.5 py-0.5 min-w-[18px] text-center">
                {badge}
              </span>
            )}
            <RightOutlined style={{ fontSize: 14 }} className="text-gray-500 flex-shrink-0" />
          </div>
        );

        if (href) return <Link key={id} to={href}>{Inner}</Link>;
        return <div key={id} onClick={onClick} role="button">{Inner}</div>;
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// NotificationsPanel (inline mini-list)
// ─────────────────────────────────────────────────────────────────────────────
function NotificationsPanel({ userId }) {
  const { data, isLoading } = useQuery({
    queryKey: ['mine', 'notifications', { unread: 'true' }],
    queryFn:  () => mineApi.getNotifications({ limit: 5, unread: 'true' }).then(r => r.data),
  });

  const qc = useQueryClient();
  const mark = useMutation({
    mutationFn: (id) => mineApi.markNotificationRead(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mine', 'notifications'] }),
  });

  if (isLoading) return <div className="text-xs text-gray-500 px-2">Đang tải...</div>;

  const items = data?.data ?? [];
  if (!items.length) {
    return <div className="text-xs text-gray-500 text-center py-4">Không có thông báo mới</div>;
  }

  return (
    <div className="space-y-1">
      {items.map(n => (
        <div
          key={n.id}
          onClick={() => mark.mutate(n.id)}
          className="flex items-start gap-2 p-2 rounded-lg bg-gray-900/60 cursor-pointer hover:bg-gray-700/40 transition-colors"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white truncate">{n.title}</div>
            <div className="text-xs text-gray-400 truncate">{n.content}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// VipConfigTable (admin can edit VIP thresholds)
// ─────────────────────────────────────────────────────────────────────────────
function VipConfigTable() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['mine', 'vipConfigs'],
    queryFn:  () => mineApi.getVipConfigs().then(r => r.data.data),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, payload }) => mineApi.updateVipConfig(id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mine', 'vipConfigs'] }),
  });

  if (isLoading) return <div className="text-sm text-gray-400 py-2">Đang tải cấu hình VIP...</div>;

  const rows = data ?? [];

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-700">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-800">
            <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Level</th>
            <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Tên</th>
            <th className="px-3 py-2 text-right text-xs text-gray-400 font-medium">Cược tối thiểu</th>
            <th className="px-3 py-2 text-right text-xs text-gray-400 font-medium">Thưởng</th>
            <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Màu</th>
            <th className="px-3 py-2 text-left text-xs text-gray-400 font-medium">Trạng thái</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-700/50">
          {rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-800/50 transition-colors">
              <td className="px-3 py-2 font-bold text-white">{row.level}</td>
              <td className="px-3 py-2">
                <span
                  className="px-2 py-0.5 rounded text-xs font-semibold text-white"
                  style={{ background: row.color || '#555' }}
                >
                  {row.name}
                </span>
              </td>
              <td className="px-3 py-2 text-right text-gray-300">{fmt(row.betRequired)}</td>
              <td className="px-3 py-2 text-right text-yellow-300 font-medium">{fmt(row.rewardAmount)}</td>
              <td className="px-3 py-2">
                <span
                  className="inline-block w-4 h-4 rounded"
                  style={{ background: row.color || '#555' }}
                />
              </td>
              <td className="px-3 py-2">
                <button
                  onClick={() => updateMut.mutate({
                    id: row.id,
                    payload: { status: row.status === 'active' ? 'inactive' : 'active' },
                  })}
                  className={`text-xs px-2 py-0.5 rounded-full border transition-colors ${
                    row.status === 'active'
                      ? 'border-green-600/50 text-green-400 hover:bg-green-600/20'
                      : 'border-gray-600 text-gray-500 hover:bg-gray-700'
                  }`}
                >
                  {row.status === 'active' ? 'Hoạt động' : 'Ẩn'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// DeviceList
// ─────────────────────────────────────────────────────────────────────────────
function DeviceList() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['mine', 'devices'],
    queryFn:  () => mineApi.getDevices().then(r => r.data.data),
  });

  const removeMut = useMutation({
    mutationFn: (id) => mineApi.removeDevice(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['mine', 'devices'] }),
  });

  if (isLoading) return <div className="text-sm text-gray-400 py-2">Đang tải thiết bị...</div>;

  const devices = data ?? [];
  if (!devices.length) {
    return <div className="text-sm text-gray-500 text-center py-4">Chưa có thiết bị nào được ghi nhận</div>;
  }

  return (
    <div className="space-y-2">
      {devices.map(d => (
        <div key={d.id} className="flex items-center gap-3 bg-gray-900/60 rounded-lg p-3">
          <MobileOutlined style={{ fontSize: 16 }} className="text-blue-400 flex-shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-sm text-white">{d.deviceType || 'Web Browser'}</div>
            <div className="text-xs text-gray-400 truncate">{d.ip || '—'}</div>
            <div className="text-xs text-gray-500">
              {d.lastSeenAt ? new Date(d.lastSeenAt).toLocaleString('vi-VN') : '—'}
            </div>
          </div>
          {d.trusted && (
            <span className="text-xs text-green-400 border border-green-600/40 px-1.5 py-0.5 rounded">
              Đáng tin
            </span>
          )}
          <button
            onClick={() => removeMut.mutate(d.id)}
            disabled={removeMut.isPending}
            className="text-xs text-red-400 hover:text-red-300 transition-colors disabled:opacity-50"
          >
            Xoá
          </button>
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// CreateTicketForm
// ─────────────────────────────────────────────────────────────────────────────
function CreateTicketForm({ onSuccess }) {
  const [form, setForm]   = useState({ subject: '', description: '', category: 'general', priority: 'medium' });
  const qc                = useQueryClient();

  const mut = useMutation({
    mutationFn: () => mineApi.createTicket(form),
    onSuccess:  () => {
      setForm({ subject: '', description: '', category: 'general', priority: 'medium' });
      qc.invalidateQueries({ queryKey: ['mine', 'tickets'] });
      onSuccess?.();
    },
  });

  return (
    <div className="space-y-3">
      <Input
        placeholder="Tiêu đề yêu cầu"
        value={form.subject}
        onChange={e => setForm(p => ({ ...p, subject: e.target.value }))}
      />
      <Input.TextArea
        rows={3}
        placeholder="Mô tả chi tiết..."
        value={form.description}
        onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
        style={{ resize: 'none' }}
      />
      <div className="flex gap-2">
        <Select
          className="flex-1"
          style={{ flex: 1 }}
          value={form.category}
          onChange={v => setForm(p => ({ ...p, category: v }))}
          options={[
            { value: 'general',  label: 'Chung' },
            { value: 'deposit',  label: 'Nạp tiền' },
            { value: 'withdraw', label: 'Rút tiền' },
            { value: 'account',  label: 'Tài khoản' },
            { value: 'tech',     label: 'Kỹ thuật' },
          ]}
        />
        <Select
          className="flex-1"
          style={{ flex: 1 }}
          value={form.priority}
          onChange={v => setForm(p => ({ ...p, priority: v }))}
          options={[
            { value: 'low',    label: 'Thấp' },
            { value: 'medium', label: 'Trung bình' },
            { value: 'high',   label: 'Cao' },
            { value: 'urgent', label: 'Khẩn cấp' },
          ]}
        />
      </div>
      <Button
        type="primary"
        block
        onClick={() => mut.mutate()}
        disabled={!form.subject || mut.isPending}
        loading={mut.isPending}
      >
        {mut.isPending ? 'Đang gửi...' : 'Gửi yêu cầu hỗ trợ'}
      </Button>
      {mut.isError && (
        <p className="text-xs text-red-400">{mut.error?.response?.data?.message || 'Có lỗi xảy ra'}</p>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Section wrapper — uses antd Collapse (ghost)
// ─────────────────────────────────────────────────────────────────────────────
function Section({ title, children, defaultOpen = false }) {
  return (
    <Collapse
      ghost
      defaultActiveKey={defaultOpen ? ['panel'] : []}
      className="bg-gray-800 rounded-xl overflow-hidden"
      style={{ borderRadius: '0.75rem' }}
      items={[
        {
          key:      'panel',
          label:    <span className="text-sm font-semibold text-white">{title}</span>,
          children: <div className="px-0 pb-2">{children}</div>,
        },
      ]}
    />
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
export default function MinePage() {
  const { logout }  = useAuthStore();
  const navigate    = useNavigate();
  const qc          = useQueryClient();

  const { data: profileData, isLoading } = useQuery({
    queryKey: ['mine', 'profile'],
    queryFn:  () => mineApi.getProfile().then(r => r.data.data),
  });

  const refreshBalance = useCallback(async () => {
    const res  = await mineApi.getBalance();
    const bal  = res.data?.data?.balance ?? 0;
    qc.setQueryData(['mine', 'profile'], old => old ? { ...old, balance: bal } : old);
  }, [qc]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Menu items
  const menuItems = [
    {
      id: 'history', icon: FileTextOutlined, label: 'Lịch sử giao dịch',
      extra: 'Nạp, rút, cược, thưởng…', href: '/transactions',
    },
    {
      id: 'finance', icon: ArrowDownOutlined, label: 'Quản lý nạp/rút tiền',
      href: '/finance',
    },
    {
      id: 'members', icon: TeamOutlined, label: 'Quản lý thành viên',
      href: '/members',
    },
    {
      id: 'announcements', icon: BellOutlined, label: 'Thông báo hệ thống',
      href: '/announcements',
    },
    {
      id: 'risk', icon: SafetyOutlined, label: 'Rủi ro & Audit',
      href: '/risk',
    },
    {
      id: 'settings', icon: SettingOutlined, label: 'Cài đặt hệ thống',
      href: '/settings',
    },
    {
      id: 'security', icon: SafetyOutlined, label: 'Cài đặt bảo mật',
      href: '/settings/security',
    },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      <h1 className="text-xl font-bold text-white">Trang cá nhân</h1>

      {/* ── Profile Card ──────────────────────────────────────────── */}
      {isLoading ? (
        <div className="bg-gray-800 rounded-xl p-5 animate-pulse h-28" />
      ) : (
        <UserProfileCard data={profileData} onRefreshBalance={refreshBalance} />
      )}

      {/* ── VIP Progress ──────────────────────────────────────────── */}
      {!isLoading && <VIPProgressCard data={profileData} />}

      {/* ── Quick Actions ─────────────────────────────────────────── */}
      <QuickActions />

      {/* ── Navigation Menu ───────────────────────────────────────── */}
      <MenuList items={menuItems} />

      {/* ── Notifications ─────────────────────────────────────────── */}
      <Section title="Thông báo mới">
        <NotificationsPanel />
      </Section>

      {/* ── Referrals ─────────────────────────────────────────────── */}
      <Section title="Giới thiệu bạn bè">
        <ReferralPanel code={profileData?.referralCode} />
      </Section>

      {/* ── VIP Config Table ──────────────────────────────────────── */}
      <Section title="Cấu hình VIP">
        <VipConfigTable />
      </Section>

      {/* ── Support Ticket ────────────────────────────────────────── */}
      <Section title="Gửi yêu cầu hỗ trợ">
        <CreateTicketForm />
      </Section>

      {/* ── Devices ───────────────────────────────────────────────── */}
      <Section title="Thiết bị đăng nhập">
        <DeviceList />
      </Section>

      {/* ── Logout ────────────────────────────────────────────────── */}
      <div className="bg-gray-800 rounded-xl overflow-hidden">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-sm text-red-400 hover:bg-gray-700/50 transition-colors"
        >
          <LogoutOutlined style={{ fontSize: 16 }} />
          <span>Đăng xuất</span>
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ReferralPanel (inline helper — must be after MinePage definition to avoid hoisting issues)
// ─────────────────────────────────────────────────────────────────────────────
function ReferralPanel({ code }) {
  const { data, isLoading } = useQuery({
    queryKey: ['mine', 'referrals'],
    queryFn:  () => mineApi.getReferrals().then(r => r.data.data),
    enabled:  true,
  });

  if (isLoading) return <div className="text-xs text-gray-400">Đang tải...</div>;

  const referralCode    = code || data?.referralCode;
  const totalCommission = data?.totalCommission || 0;
  const referrals       = data?.referrals || [];

  return (
    <div className="space-y-3">
      {/* Code + link */}
      <div className="bg-gray-900/70 rounded-lg p-3 flex items-center gap-2">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-0.5">Mã giới thiệu của bạn</div>
          <div className="font-mono text-blue-300 font-semibold text-base">
            {referralCode || '—'}
          </div>
        </div>
        {referralCode && <CopyButton text={referralCode} />}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-gray-900/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-0.5">Bạn bè đã mời</div>
          <div className="text-white font-bold text-lg">{referrals.length}</div>
        </div>
        <div className="bg-gray-900/60 rounded-lg p-3 text-center">
          <div className="text-xs text-gray-400 mb-0.5">Hoa hồng nhận được</div>
          <div className="text-yellow-300 font-bold text-lg">{fmt(totalCommission)}</div>
        </div>
      </div>

      {/* Latest referrals */}
      {referrals.length > 0 && (
        <div className="space-y-1 max-h-40 overflow-y-auto">
          {referrals.slice(0, 8).map(r => (
            <div key={r.id} className="flex items-center gap-2 text-xs text-gray-400 py-1 border-b border-gray-700/30">
              <UserOutlined style={{ fontSize: 11 }} className="flex-shrink-0" />
              <span className="truncate">{r.referee?.username || r.referee?.email || r.refereeId}</span>
              <span className="ml-auto text-yellow-300">+{fmt(r.bonus || 0)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
