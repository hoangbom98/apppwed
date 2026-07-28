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
        { type: 'toggle', key: 'notifications', label: 'Thông báo đẩy',      icon: Bell,  description: 'Nhận thông báo về trận đấu và kết quả' },
        { type: 'toggle', key: 'liveAlerts',    label: 'Cảnh báo trực tiếp', icon: Bell,  description: 'Bàn thắng & sự kiện quan trọng' },
      ],
    },
    {
      title: 'Giao diện',
      items: [
        { type: 'toggle', key: 'darkMode',   label: 'Chế độ tối',          icon: Moon  },
        { type: 'toggle', key: 'viLanguage', label: 'Ngôn ngữ: Tiếng Việt', icon: Globe },
      ],
    },
    {
      title: 'Tài khoản',
      items: [
        { type: 'link', to: '/profile', label: 'Chỉnh sửa hồ sơ',    icon: Shield },
        { type: 'link', to: '/support', label: 'Hỗ trợ khách hàng',  icon: Shield, badge: '' },
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
      <div className="sticky top-0 z-30 px-4 py-3 flex items-center gap-3"
        style={{ background: 'var(--sports-bg-card)', borderBottom: '1px solid var(--sports-border)' }}>
        <Link to="/profile"
          className="p-1.5 rounded-lg transition-colors"
          style={{ color: 'var(--sports-text-secondary)' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--sports-text)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--sports-text-secondary)')}>
          <ChevronLeft size={20} />
        </Link>
        <h1 className="font-bold text-base" style={{ color: 'var(--sports-text)' }}>Cài đặt</h1>
      </div>

      <div className="p-4 space-y-6">
        {sections.map(section => (
          <div key={section.title}>
            <h2 className="text-xs font-semibold uppercase tracking-wider mb-2 px-1"
              style={{ color: 'var(--sports-text-muted)' }}>
              {section.title}
            </h2>
            <div className="rounded-2xl overflow-hidden divide-y"
              style={{ background: 'var(--sports-bg-card)', border: '1px solid var(--sports-border)', borderColor: 'var(--sports-border)' }}>
              {section.items.map((item, i) => {
                if (item.type === 'toggle') {
                  const isOn = prefs[item.key as keyof typeof prefs];
                  return (
                    <div key={i} className="flex items-center justify-between px-4 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--sports-bg-elevated)' }}>
                          <item.icon size={15} style={{ color: 'var(--sports-text-secondary)' }} />
                        </div>
                        <div>
                          <p className="text-sm font-medium" style={{ color: 'var(--sports-text)' }}>{item.label}</p>
                          {item.description && (
                            <p className="text-[10px]" style={{ color: 'var(--sports-text-muted)' }}>{item.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => toggle(item.key as keyof typeof prefs)}
                        className="relative w-11 h-6 rounded-full transition-colors"
                        style={{ background: isOn ? 'var(--sports-primary)' : 'var(--sports-border-strong)' }}
                      >
                        <span
                          className="absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform"
                          style={{ transform: isOn ? 'translateX(1.5rem)' : 'translateX(0.25rem)' }}
                        />
                      </button>
                    </div>
                  );
                }
                if (item.type === 'link') {
                  return (
                    <Link key={i} to={item.to}
                      className="flex items-center justify-between px-4 py-3.5 transition-colors"
                      style={{ color: 'inherit' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--sports-bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                          style={{ background: 'var(--sports-bg-elevated)' }}>
                          <item.icon size={15} style={{ color: 'var(--sports-text-secondary)' }} />
                        </div>
                        <p className="text-sm" style={{ color: 'var(--sports-text)' }}>{item.label}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        {item.badge !== undefined && item.badge !== '' && (
                          <span className="text-xs px-2 py-0.5 rounded-full text-white"
                            style={{ background: 'var(--sports-primary)' }}>{item.badge}</span>
                        )}
                        <ChevronRight size={15} style={{ color: 'var(--sports-text-muted)' }} />
                      </div>
                    </Link>
                  );
                }
                if (item.type === 'action') {
                  return (
                    <button key={i} onClick={item.action}
                      className="w-full flex items-center gap-3 px-4 py-3.5 transition-colors"
                      style={{ color: item.danger ? 'var(--sports-live)' : 'var(--sports-text)' }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--sports-bg-hover)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                      <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                        style={{ background: item.danger ? 'rgba(239,68,68,0.12)' : 'var(--sports-bg-elevated)' }}>
                        <item.icon size={15} style={{ color: item.danger ? 'var(--sports-live)' : 'var(--sports-text-secondary)' }} />
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

        <p className="text-center text-[10px] mt-4" style={{ color: 'var(--sports-text-muted)' }}>
          Sports Live v1.0.0
        </p>
      </div>
    </div>
  );
}
