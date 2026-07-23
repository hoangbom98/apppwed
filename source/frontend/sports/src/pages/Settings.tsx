import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, Bell, Moon, Globe, Shield, Trash2, ChevronRight } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

type Section = { title: string; items: SettingItem[] };
type SettingItem =
  | { type: 'toggle'; key: string; label: string; icon: React.FC<any>; description?: string }
  | { type: 'link';   to: string;  label: string; icon: React.FC<any>; badge?: string }
  | { type: 'action'; action: () => void; label: string; icon: React.FC<any>; danger?: boolean };

export default function SettingsPage() {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [prefs, setPrefs] = useState({
    notifications: true,
    liveAlerts:    true,
    darkMode:      true,
    viLanguage:    true,
  });

  const toggle = (k: keyof typeof prefs) => setPrefs(p => ({ ...p, [k]: !p[k] }));

  const sections: Section[] = [
    {
      title: 'Thông báo',
      items: [
        { type: 'toggle', key: 'notifications', label: 'Thông báo đẩy',    icon: Bell,   description: 'Nhận thông báo về trận đấu và kết quả' },
        { type: 'toggle', key: 'liveAlerts',    label: 'Cảnh báo trực tiếp', icon: Bell, description: 'Bàn thắng & sự kiện quan trọng' },
      ],
    },
    {
      title: 'Giao diện',
      items: [
        { type: 'toggle', key: 'darkMode',    label: 'Chế độ tối',   icon: Moon },
        { type: 'toggle', key: 'viLanguage',  label: 'Ngôn ngữ: Tiếng Việt', icon: Globe },
      ],
    },
    {
      title: 'Tài khoản',
      items: [
        { type: 'link', to: '/profile', label: 'Chỉnh sửa hồ sơ', icon: Shield },
        { type: 'link', to: '/support', label: 'Hỗ trợ khách hàng', icon: Shield, badge: '' },
        { type: 'link', to: '/knowledge', label: 'Câu hỏi thường gặp', icon: Shield },
      ],
    },
    {
      title: 'Nguy hiểm',
      items: [
        { type: 'action', action: () => { logout(); navigate('/login'); }, label: 'Đăng xuất', icon: Trash2, danger: true },
      ],
    },
  ];

  return (
    <div className="pb-4 max-w-lg mx-auto">
      {/* Back header */}
      <div className="sticky top-0 z-30 bg-gray-900 border-b border-gray-800 px-4 py-3 flex items-center gap-3">
        <Link to="/profile" className="p-1.5 text-gray-400 hover:text-white rounded-lg">
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-bold text-white text-base">Cài đặt</h1>
      </div>

      <div className="p-4 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-1">
              {section.title}
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden divide-y divide-gray-800/60">
              {section.items.map((item, i) => {
                if (item.type === 'toggle') {
                  const isOn = prefs[item.key as keyof typeof prefs];
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center">
                          <item.icon size={15} className="text-gray-400" />
                        </div>
                        <div>
                          <p className="text-sm text-white font-medium">{item.label}</p>
                          {item.description && <p className="text-[10px] text-gray-500">{item.description}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => toggle(item.key as keyof typeof prefs)}
                        className={`relative w-11 h-6 rounded-full transition-colors ${isOn ? 'bg-green-600' : 'bg-gray-700'}`}
                      >
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${isOn ? 'translate-x-6' : 'translate-x-1'}`} />
                      </button>
                    </div>
                  );
                }
                if (item.type === 'link') {
                  return (
                    <Link key={i} to={item.to} className="flex items-center justify-between px-4 py-3.5 hover:bg-gray-800/40 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gray-800 flex items-center justify-center">
                          <item.icon size={15} className="text-gray-400" />
                        </div>
                        <p className="text-sm text-white">{item.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== undefined && item.badge !== '' && (
                          <span className="text-xs bg-green-600 text-white px-2 py-0.5 rounded-full">{item.badge}</span>
                        )}
                        <ChevronRight size={15} className="text-gray-500" />
                      </div>
                    </Link>
                  );
                }
                if (item.type === 'action') {
                  return (
                    <button key={i} onClick={item.action}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-800/40 transition-colors ${item.danger ? 'text-red-400' : 'text-white'}`}>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${item.danger ? 'bg-red-950/40' : 'bg-gray-800'}`}>
                        <item.icon size={15} className={item.danger ? 'text-red-400' : 'text-gray-400'} />
                      </div>
                      <p className="text-sm font-medium">{item.label}</p>
                    </button>
                  );
                }
                return null;
              })}
            </div>
          </div>
        ))}

        <p className="text-center text-[10px] text-gray-600 mt-4">Sports Live v1.0.0</p>
      </div>
    </div>
  );
}
