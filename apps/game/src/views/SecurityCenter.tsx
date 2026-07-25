/**
 * SecurityCenter.tsx — Trung tâm bảo mật
 * Route: /security
 *
 * Hub page hiển thị tất cả tùy chọn bảo mật:
 *  - Đổi mật khẩu đăng nhập
 *  - Liên kết số điện thoại
 *  - Liên kết email
 *  - Google Authenticator 2FA
 *  - Xác minh danh tính (KYC)
 *  - Thiết bị đã đăng nhập
 *
 * Ref: /var/www/wap/src/views/security/V5SecurityCenter.vue
 */
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import {
  Lock, Phone, Mail, Shield, User, ChevronRight,
  Eye, EyeOff, CheckCircle, AlertCircle, X, Monitor,
} from 'lucide-react';
import api from '../api/httpClient';
import { useAuthStore } from '../store/authStore';

// ── API helpers ───────────────────────────────────────────────────────────────
const getSecurityStatus = () => api.get('/game/auth/security-status').then(r => r.data?.data);
const changePassword    = (b: { currentPassword: string; newPassword: string }) =>
  api.put('/game/auth/password', b).then(r => r.data);
const getDevices        = () => api.get('/game/auth/devices').then(r => r.data?.data || []);
const revokeDevice      = (id: string) => api.delete(`/game/auth/devices/${id}`).then(r => r.data);

// ── Sub-panel: Change Password ────────────────────────────────────────────────
function ChangePasswordPanel({ onClose }: { onClose: () => void }) {
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<{
    currentPassword: string; newPassword: string; confirmPassword: string;
  }>();
  const newPwd = watch('newPassword');

  const mut = useMutation({
    mutationFn: (data: { currentPassword: string; newPassword: string }) => changePassword(data),
    onSuccess: () => { toast.success('Đổi mật khẩu thành công!'); onClose(); },
    onError:   (e: any) => toast.error(e?.response?.data?.error?.message || 'Lỗi đổi mật khẩu'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Đổi mật khẩu</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit(d => mut.mutate({ currentPassword: d.currentPassword, newPassword: d.newPassword }))} className="space-y-4">
          {/* Current */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mật khẩu hiện tại</label>
            <div className="relative">
              <input type={showCurrent ? 'text' : 'password'}
                {...register('currentPassword', { required: 'Nhập mật khẩu hiện tại' })}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowCurrent(!showCurrent)} className="absolute right-3 top-3 text-gray-400">
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.currentPassword && <p className="text-xs text-red-500 mt-1">{errors.currentPassword.message}</p>}
          </div>
          {/* New */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mật khẩu mới</label>
            <div className="relative">
              <input type={showNew ? 'text' : 'password'}
                {...register('newPassword', { required: 'Nhập mật khẩu mới', minLength: { value: 6, message: 'Tối thiểu 6 ký tự' } })}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-3 text-gray-400">
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.newPassword && <p className="text-xs text-red-500 mt-1">{errors.newPassword.message}</p>}
          </div>
          {/* Confirm */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Xác nhận mật khẩu mới</label>
            <div className="relative">
              <input type={showConfirm ? 'text' : 'password'}
                {...register('confirmPassword', {
                  required: 'Xác nhận lại mật khẩu',
                  validate: v => v === newPwd || 'Mật khẩu không khớp',
                })}
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 pr-10 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:border-primary" />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-3 text-gray-400">
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>}
          </div>
          <button type="submit" disabled={mut.isPending}
            className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm disabled:opacity-60">
            {mut.isPending ? 'Đang lưu...' : 'Xác nhận đổi mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ── Sub-panel: Devices ─────────────────────────────────────────────────────────
function DevicesPanel({ onClose }: { onClose: () => void }) {
  const qc = useQueryClient();
  const { data: devices = [], isLoading } = useQuery({ queryKey: ['devices'], queryFn: getDevices });
  const revoke = useMutation({
    mutationFn: revokeDevice,
    onSuccess:  () => { toast.success('Đã thu hồi thiết bị'); qc.invalidateQueries({ queryKey: ['devices'] }); },
    onError:    () => toast.error('Lỗi thu hồi thiết bị'),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 px-0 sm:px-4">
      <div className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full sm:max-w-md p-6 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-base font-bold text-gray-900 dark:text-white">Thiết bị đã đăng nhập</h3>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600"><X className="w-5 h-5" /></button>
        </div>
        {isLoading ? (
          <div className="text-center py-8 text-gray-400 text-sm">Đang tải...</div>
        ) : devices.length === 0 ? (
          <div className="text-center py-8 text-gray-400 text-sm">Không có thiết bị nào</div>
        ) : (
          <div className="space-y-3">
            {devices.map((d: any) => (
              <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800">
                <Monitor className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 dark:text-white truncate">{d.deviceName || d.userAgent || 'Thiết bị không xác định'}</div>
                  <div className="text-xs text-gray-400">{d.ip} · {d.lastUsed ? new Date(d.lastUsed).toLocaleDateString('vi-VN') : ''}</div>
                  {d.isCurrent && <span className="text-xs text-green-500 font-medium">Thiết bị hiện tại</span>}
                </div>
                {!d.isCurrent && (
                  <button onClick={() => revoke.mutate(d.id)} disabled={revoke.isPending}
                    className="text-xs text-red-500 hover:text-red-600 font-medium px-2 py-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20">
                    Thu hồi
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Security item row ──────────────────────────────────────────────────────────
interface SecItemProps {
  icon:     React.ReactNode;
  label:    string;
  status?:  string;
  bound?:   boolean;
  onClick:  () => void;
}
function SecItem({ icon, label, status, bound, onClick }: SecItemProps) {
  return (
    <button onClick={onClick}
      className="w-full flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left">
      <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm font-medium text-gray-800 dark:text-white">{label}</div>
        {status && (
          <div className={`text-xs mt-0.5 flex items-center gap-1 ${bound ? 'text-green-500' : 'text-gray-400'}`}>
            {bound ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
            {status}
          </div>
        )}
      </div>
      <ChevronRight className="w-4 h-4 text-gray-400" />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// Main component
// ═══════════════════════════════════════════════════════════════════════════════
export default function SecurityCenter() {
  const navigate = useNavigate();
  const { user }  = useAuthStore();
  const [panel, setPanel] = useState<'password' | 'devices' | null>(null);

  const { data: sec } = useQuery({
    queryKey: ['security-status'],
    queryFn:  getSecurityStatus,
    // graceful — 404 just means endpoint not wired yet
    retry: false,
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate(-1)} className="p-1 -ml-1 rounded-lg text-gray-500 hover:text-gray-800 dark:hover:text-white">
          <ChevronRight className="w-5 h-5 rotate-180" />
        </button>
        <h1 className="text-base font-bold text-gray-900 dark:text-white">Trung tâm bảo mật</h1>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-4">
        {/* Account info card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username || '—'}</div>
              <div className="text-xs text-gray-400">UID: {(user as any)?.id || '—'}</div>
            </div>
          </div>
        </div>

        {/* Security items */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-100 dark:divide-gray-800">
          <SecItem
            icon={<Lock className="w-5 h-5" />}
            label="Mật khẩu đăng nhập"
            status="Đã đặt"
            bound
            onClick={() => setPanel('password')}
          />
          <SecItem
            icon={<Phone className="w-5 h-5" />}
            label="Số điện thoại"
            status={sec?.phone ? 'Đã liên kết: ' + sec.phone : 'Chưa liên kết'}
            bound={!!sec?.phone}
            onClick={() => toast('Tính năng liên kết số điện thoại sắp ra mắt')}
          />
          <SecItem
            icon={<Mail className="w-5 h-5" />}
            label="Email"
            status={sec?.email ? 'Đã liên kết: ' + sec.email : 'Chưa liên kết'}
            bound={!!sec?.email}
            onClick={() => toast('Tính năng liên kết email sắp ra mắt')}
          />
          <SecItem
            icon={<Shield className="w-5 h-5" />}
            label="Google Authenticator"
            status={sec?.google2fa ? 'Đã bật' : 'Chưa bật'}
            bound={!!sec?.google2fa}
            onClick={() => toast('Tính năng Google 2FA sắp ra mắt')}
          />
        </div>

        {/* Device management */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <SecItem
            icon={<Monitor className="w-5 h-5" />}
            label="Thiết bị đã đăng nhập"
            status="Quản lý thiết bị"
            onClick={() => setPanel('devices')}
          />
        </div>

        {/* KYC */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-800">
          <SecItem
            icon={<User className="w-5 h-5" />}
            label="Xác minh danh tính (KYC)"
            status={sec?.kycVerified ? 'Đã xác minh' : 'Chưa xác minh'}
            bound={!!sec?.kycVerified}
            onClick={() => toast('Tính năng KYC sắp ra mắt')}
          />
        </div>
      </div>

      {/* Panels */}
      {panel === 'password' && <ChangePasswordPanel onClose={() => setPanel(null)} />}
      {panel === 'devices'  && <DevicesPanel        onClose={() => setPanel(null)} />}
    </div>
  );
}
