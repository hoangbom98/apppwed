// frontend/admin-dashboard/src/modules/finance/index.ts
// Finance module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  BarChart3, PiggyBank, Settings2, BookOpen, Landmark,
} from 'lucide-react';

registerModule({
  id:      'finance',
  name:    'Tài chính tập đoàn',
  minRole: 'admin',
  menuGroups: [
    {
      key:   'group-finance',
      label: 'Tài chính tập đoàn',
      items: [
        { to: '/group-finance',         icon: BarChart3,  label: 'Tổng quan P&L'     },
        { to: '/group-finance/fee-cfg', icon: Settings2,  label: 'Cấu hình phí'       },
        { to: '/group-finance/loans',   icon: Landmark,   label: 'Vay nội bộ'         },
        { to: '/finance',               icon: PiggyBank,  label: 'Nạp / Rút tiền'    },
      ],
    },
  ],
});
