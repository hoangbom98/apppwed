// frontend/admin-dashboard/src/modules/settings/index.ts
// Settings module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  Settings2, PlugZap, Bell, Clock4, ToggleLeft,
} from 'lucide-react';

registerModule({
  id:   'settings',
  name: 'Cài đặt hệ thống',
  menuGroups: [
    {
      key:   'settings_ext',
      label: 'Cài đặt nâng cao',
      items: [
        { to: '/settings/general',            icon: Settings2,  label: 'Cài đặt chung' },
        { to: '/settings/connections',        icon: PlugZap,    label: 'Kết nối' },
        { to: '/settings/notification-tpl',   icon: Bell,       label: 'Template thông báo' },
        { to: '/settings/cron-jobs',          icon: Clock4,     label: 'Cron Jobs' },
        { to: '/settings/widgets',            icon: ToggleLeft, label: 'Widgets & Addons' },
      ],
    },
  ],
});
