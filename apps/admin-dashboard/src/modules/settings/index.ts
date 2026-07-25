// frontend/admin-dashboard/src/modules/settings/index.ts
// Settings module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  Settings2, PlugZap, Bell, Clock4, ToggleLeft, Layers, Send, Bot,
} from 'lucide-react';

registerModule({
  id:   'settings',
  name: 'Cài đặt hệ thống',
  menuGroups: [
    {
      key:   'settings_ext',
      label: 'Cài đặt nâng cao',
      items: [
        { to: '/settings/integrations',       icon: Layers,     label: 'Tích hợp & Tính năng' },
        { to: '/settings/general',            icon: Settings2,  label: 'Cài đặt chung' },
        { to: '/settings/connections',        icon: PlugZap,    label: 'Kết nối' },
        { to: '/settings/notification-tpl',   icon: Bell,       label: 'Template thông báo' },
        { to: '/settings/cron-jobs',          icon: Clock4,     label: 'Cron Jobs' },
        { to: '/settings/widgets',            icon: ToggleLeft, label: 'Widgets & Addons' },
      ],
    },
    {
      key:   'settings_telegram',
      label: 'Telegram Bot',
      items: [
        { to: '/settings/telegram-broadcast', icon: Send,       label: 'Broadcast' },
        { to: '/settings/telegram-bot',       icon: Bot,        label: 'Bot CSKH (Auto-Reply)' },
      ],
    },
  ],
});
