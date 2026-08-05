import { registerModule } from '../registry';
import {
  LayoutDashboard, Code2, Layers, Bot,
} from 'lucide-react';

registerModule({
  id:      'prodevs',
  name:    'ProDevs CLI',
  minRole: 'super_admin',
  menuGroups: [
    {
      key:   'prodevs',
      label: 'ProDevs CLI',
      items: [
        { to: '/prodevs',           icon: LayoutDashboard, label: 'Tổng quan' },
        { to: '/prodevs/projects',  icon: Code2,           label: 'Dự án đã scaffold' },
        { to: '/prodevs/templates', icon: Layers,          label: 'Templates' },
        { to: '/prodevs/ai-config', icon: Bot,             label: 'Cấu hình AI' },
      ],
    },
  ],
});
