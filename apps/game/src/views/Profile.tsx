import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
import { User, Wallet, Crown, LogOut, CreditCard, PiggyBank, Cpu, RefreshCw, Gift, Shield } from 'lucide-react';
import toast from 'react-hot-toast';
import { updateProfile, changePassword } from '@/api/apiXacThuc';
import { useAuthStore } from '@/store/authStore';
import { useWalletStore } from '@/store/walletStore';
import { formatVND } from '@/utils/dinhDang';

const profileSchema = yup.object({
  full_name: yup.string().optional(),
  phone:     yup.string().optional(),
});
const pwdSchema = yup.object({
  old_password: yup.string().required('Nhập mật khẩu cũ'),
  new_password: yup.string().min(6, 'Tối thiểu 6 ký tự').required('Nhập mật khẩu mới'),
  confirm:      yup.string()
    .oneOf([yup.ref('new_password')], 'Mật khẩu không khớp')
    .required('Xác nhận mật khẩu'),
});

type ProfileValues = yup.InferType<typeof profileSchema>;
type PwdValues     = yup.InferType<typeof pwdSchema>;

export default function Profile() {
  const { user, logout, setUser } = useAuthStore() as any;
  const { balance } = useWalletStore();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'info' | 'pwd'>('info');

  const profileForm = useForm<ProfileValues>({
    resolver: yupResolver(profileSchema),
    defaultValues: { full_name: (user as any)?.full_name || (user as any)?.fullName || '', phone: (user as any)?.phone || '' },
  });

  const pwdForm = useForm<PwdValues>({
    resolver: yupResolver(pwdSchema),
  });

  const updateMut = useMutation({
    mutationFn: (d: ProfileValues) => updateProfile(d),
    onSuccess: (d) => {
      setUser(d as any);
      toast.success('Cập nhật thông tin thành công!');
    },
    onError: () => toast.error('Cập nhật thất bại'),
  });

  const pwdMut = useMutation({
    mutationFn: (d: PwdValues) => changePassword({ old_password: d.old_password, new_password: d.new_password }),
    onSuccess: () => {
      toast.success('Đổi mật khẩu thành công!');
      pwdForm.reset();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Đổi mật khẩu thất bại'),
  });

  if (!user) return (
    <div className="flex flex-col items-center justify-center h-60 gap-4">
      <User className="w-16 h-16 text-gray-300" />
      <p className="text-gray-500">Chưa đăng nhập</p>
      <Link to="/login" className="px-6 py-2.5 bg-primary text-white font-bold rounded-full text-sm">Đăng nhập</Link>
    </div>
  );

  return (
    <div className="max-w-lg mx-auto">
      {/* Avatar + info */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full bg-accent flex items-center justify-center text-2xl font-black text-dark shrink-0">
          {user.username.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <h1 className="text-xl font-black text-gray-900 dark:text-white">{(user as any).full_name || (user as any).fullName || user.username}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">ID: {user.id} · {user.email}</p>
          <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary dark:text-secondary font-bold">{user.role}</span>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Link to="/deposit" className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-primary transition-colors">
          <Wallet className="w-5 h-5 text-primary dark:text-secondary" />
          <span className="text-xs text-primary dark:text-secondary font-bold truncate w-full text-center">{formatVND(balance)}</span>
          <span className="text-[10px] text-gray-500">Số dư</span>
        </Link>
        <Link to="/vip" className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-accent transition-colors">
          <Crown className="w-5 h-5 text-accent" />
          <span className="text-xs text-accent font-bold">VIP</span>
          <span className="text-[10px] text-gray-500">Cấp độ</span>
        </Link>
        <Link to="/agent" className="flex flex-col items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center hover:border-secondary transition-colors">
          <User className="w-5 h-5 text-secondary" />
          <span className="text-xs text-secondary font-bold">Đại lý</span>
          <span className="text-[10px] text-gray-500">Hoa hồng</span>
        </Link>
      </div>

      {/* Bank account link */}
      <Link
        to="/bank-account"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-secondary transition-colors mb-2"
      >
        <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-primary dark:text-secondary" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Tài khoản ngân hàng</p>
          <p className="text-[10px] text-gray-400">Quản lý TK ngân hàng rút tiền</p>
        </div>
        <span className="text-gray-400 text-sm">›</span>
      </Link>

      {/* Rebate */}
      <Link to="/rebate"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-secondary transition-colors mb-2"
      >
        <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
          <Gift className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Hoàn trả hàng ngày</p>
          <p className="text-[10px] text-gray-400">Nhận hoàn trả dựa trên cược hợp lệ</p>
        </div>
        <span className="text-gray-400 text-sm">›</span>
      </Link>

      {/* Transfer */}
      <Link to="/transfer"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-secondary transition-colors mb-2"
      >
        <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center">
          <RefreshCw className="w-5 h-5 text-blue-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Chuyển tiền</p>
          <p className="text-[10px] text-gray-400">Chuyển tiền cho người dùng khác</p>
        </div>
        <span className="text-gray-400 text-sm">›</span>
      </Link>

      {/* Yuebao */}
      <Link to="/yuebao"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-secondary transition-colors mb-2"
      >
        <div className="w-9 h-9 rounded-xl bg-yellow-500/10 flex items-center justify-center">
          <PiggyBank className="w-5 h-5 text-yellow-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Số dư Bảo</p>
          <p className="text-[10px] text-gray-400">Gửi tiết kiệm sinh lãi hàng ngày</p>
        </div>
        <span className="text-gray-400 text-sm">›</span>
      </Link>

      {/* Mining */}
      <Link to="/mining"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-secondary transition-colors mb-2"
      >
        <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
          <Cpu className="w-5 h-5 text-purple-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Máy đào</p>
          <p className="text-[10px] text-gray-400">Đầu tư máy đào thu nhập hàng ngày</p>
        </div>
        <span className="text-gray-400 text-sm">›</span>
      </Link>

      {/* Security Center */}
      <Link to="/security"
        className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:border-primary dark:hover:border-secondary transition-colors mb-2"
      >
        <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
          <Shield className="w-5 h-5 text-green-500" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-bold text-gray-900 dark:text-white">Bảo mật tài khoản</p>
          <p className="text-[10px] text-gray-400">Mật khẩu, điện thoại, email, 2FA</p>
        </div>
        <span className="text-gray-400 text-sm">›</span>
      </Link>

      {/* Tabs */}
      <div className="flex gap-2 mb-5">
        {(['info', 'pwd'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-full text-sm font-bold transition-colors ${
              tab === t ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
            }`}>
            {t === 'info' ? 'Thông tin' : 'Đổi mật khẩu'}
          </button>
        ))}
      </div>

      {tab === 'info' && (
        <form onSubmit={profileForm.handleSubmit((d) => updateMut.mutate(d))} className="space-y-4">
          {[
            { name: 'full_name' as const, label: 'Tên hiển thị' },
            { name: 'phone'     as const, label: 'Số điện thoại' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">{label}</label>
              <input
                {...profileForm.register(name)}
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          ))}
          <button type="submit" disabled={updateMut.isPending}
            className="w-full py-3 bg-primary hover:bg-secondary text-white font-black rounded-xl disabled:opacity-50 transition-colors">
            {updateMut.isPending ? 'Đang lưu...' : 'Lưu thay đổi'}
          </button>
        </form>
      )}

      {tab === 'pwd' && (
        <form onSubmit={pwdForm.handleSubmit((d) => pwdMut.mutate(d))} className="space-y-4">
          {[
            { name: 'old_password' as const, label: 'Mật khẩu hiện tại' },
            { name: 'new_password' as const, label: 'Mật khẩu mới' },
            { name: 'confirm'      as const, label: 'Xác nhận mật khẩu mới' },
          ].map(({ name, label }) => (
            <div key={name}>
              <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">{label}</label>
              <input
                {...pwdForm.register(name)}
                type="password"
                className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-4 py-3 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary transition-colors"
              />
              {pwdForm.formState.errors[name] && (
                <p className="mt-1 text-xs text-danger">{pwdForm.formState.errors[name]?.message}</p>
              )}
            </div>
          ))}
          <button type="submit" disabled={pwdMut.isPending}
            className="w-full py-3 bg-primary hover:bg-secondary text-white font-black rounded-xl disabled:opacity-50 transition-colors">
            {pwdMut.isPending ? 'Đang đổi...' : 'Đổi mật khẩu'}
          </button>
        </form>
      )}

      {/* Logout */}
      <button
        onClick={() => { logout(); navigate('/login'); }}
        className="w-full mt-6 flex items-center justify-center gap-2 py-3 bg-danger/10 border border-danger/30 text-danger font-bold rounded-xl hover:bg-danger/20 transition-colors"
      >
        <LogOut className="w-4 h-4" /> Đăng xuất
      </button>
    </div>
  );
}
