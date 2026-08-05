import { registerModule } from '../registry';
import {
  LayoutDashboard, Image, Users, AlertTriangle,
} from 'lucide-react';

registerModule({
  id:        'social',
  name:      'Social App',
  projectId: 'social',
  menuGroups: [
    {
      key:   'social',
      label: 'Social App',
      items: [
        { to: '/social',         icon: LayoutDashboard, label: 'Tổng quan' },
        { to: '/social/posts',   icon: Image,           label: 'Bài đăng (Feed)' },
        { to: '/social/users',   icon: Users,           label: 'Người dùng' },
        { to: '/social/reports', icon: AlertTriangle,   label: 'Báo cáo vi phạm' },
      ],
    },
  ],
});
