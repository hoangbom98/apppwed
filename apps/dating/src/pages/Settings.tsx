import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import PageHeader from '@/components/common/PageHeader';
import { ChevronRight, Sun, Moon, Bell, Lock, Eye, LogOut, HelpCircle, Shield, Languages } from 'lucide-react';
import toast from 'react-hot-toast';

interface SettingItemProps {
  icon: React.ElementType;
  label: string;
  sublabel?: string;
  onClick?: () => void;
  rightSlot?: React.ReactNode;
  danger?: boolean;
}

function SettingItem({ icon: Icon, label, sublabel, onClick, rightSlot, danger }: SettingItemProps) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-3.5 px-4 py-3.5 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${danger ? 'bg-red-100' : 'bg-gray-100'}`}>
        <Icon size={18} className={danger ? 'text-red-500' : 'text-gray-600'} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${danger ? 'text-red-500' : 'text-gray-900'}`}>{label}</p>
        {sublabel && <p className="text-xs text-gray-400 truncate">{sublabel}</p>}
      </div>
      {rightSlot || <ChevronRight size={16} className="text-gray-300 flex-shrink-0" />}
    </button>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button onClick={() => onChange(!value)}
      className={`w-11 h-6 rounded-full transition-colors ${value ? 'bg-pink-500' : 'bg-gray-200'}`}>
      <span className={`block w-5 h-5 bg-white rounded-full shadow transition-transform mx-0.5 ${value ? 'translate-x-5' : 'translate-x-0'}`} />
    </button>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [hideOnline, setHideOnline] = useState(false);
  const [hideDistance, setHideDistance] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
    toast.success('Đã đăng xuất');
  };

  return (
    <div>
      <PageHeader title="Cài đặt" />

      {/* Profile quick */}
      <div className="mx-4 my-4 p-4 bg-gradient-to-r from-pink-50 to-rose-50 rounded-2xl flex items-center gap-3"
        onClick={() => navigate('/profile/edit')}>
        <img src={user?.avatar || ''} alt="" className="w-12 h-12 rounded-full object-cover bg-pink-200" />
        <div>
          <p className="font-bold text-gray-900">{user?.full_name}</p>
          <p className="text-xs text-pink-500">Chỉnh sửa hồ sơ</p>
        </div>
        <ChevronRight size={16} className="text-gray-400 ml-auto" />
      </div>

      {/* Appearance */}
      <div className="mb-2">
        <p className="px-4 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Giao diện</p>
        <SettingItem icon={darkMode ? Moon : Sun} label="Chế độ tối"
          rightSlot={<Toggle value={darkMode} onChange={setDarkMode} />} />
        <SettingItem icon={Languages} label="Ngôn ngữ" sublabel="Tiếng Việt" />
      </div>

      {/* Notifications */}
      <div className="mb-2">
        <p className="px-4 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Thông báo</p>
        <SettingItem icon={Bell} label="Thông báo đẩy"
          rightSlot={<Toggle value={notifications} onChange={setNotifications} />} />
      </div>

      {/* Privacy */}
      <div className="mb-2">
        <p className="px-4 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Quyền riêng tư</p>
        <SettingItem icon={Eye} label="Ẩn trạng thái online"
          rightSlot={<Toggle value={hideOnline} onChange={setHideOnline} />} />
        <SettingItem icon={Eye} label="Ẩn khoảng cách"
          rightSlot={<Toggle value={hideDistance} onChange={setHideDistance} />} />
        <SettingItem icon={Lock} label="Bảo mật tài khoản" sublabel="Đổi mật khẩu, 2FA" />
        <SettingItem icon={Shield} label="Danh sách chặn" onClick={() => {}} />
      </div>

      {/* Support */}
      <div className="mb-2">
        <p className="px-4 pt-2 pb-1 text-xs font-bold text-gray-400 uppercase tracking-wider">Hỗ trợ</p>
        <SettingItem icon={HelpCircle} label="Trợ giúp & Hỗ trợ" onClick={() => navigate('/support')} />
        <SettingItem icon={HelpCircle} label="Điều khoản & Chính sách" />
      </div>

      {/* Logout */}
      <div className="mx-4 mt-4 mb-8">
        <SettingItem icon={LogOut} label="Đăng xuất" onClick={handleLogout} danger />
      </div>
    </div>
  );
}
