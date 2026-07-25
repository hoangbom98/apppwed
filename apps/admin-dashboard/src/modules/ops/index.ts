// @ts-nocheck
// frontend/admin-dashboard/src/modules/ops/index.ts
// Ops (Auto-Operations) module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  Building2, CheckSquare, UserCheck, BarChart3, Megaphone,
} from 'lucide-react';

registerModule({
  id:      'ops',
  name:    'Vận hành tự động',
  // ops is a cross-cutting internal module — no projectId restriction
  menuGroups: [
    {
      key:   'ops',
      label: 'Vận hành tự động',
      items: [
        { to: '/ops',           icon: Building2,  label: 'Tổng quan Ops' },
        { to: '/ops/tasks',     icon: CheckSquare, label: 'Task Queue' },
        { to: '/ops/segments',  icon: UserCheck,   label: 'Phân khúc KH' },
        { to: '/ops/reports',   icon: BarChart3,   label: 'Báo cáo & Dự báo' },
        { to: '/ops/campaigns', icon: Megaphone,   label: 'Campaigns' },
      ],
    },
  ],
});
