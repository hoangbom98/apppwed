// @ts-nocheck
// frontend/admin-dashboard/src/modules/game/index.ts
// Game module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  Users, Coins, ArrowDownUp, Gamepad2, Wrench, SlidersHorizontal, BarChart2,
} from 'lucide-react';

registerModule({
  id:        'game',
  name:      'Game Platform',
  projectId: 'game',
  menuGroups: [
    {
      key:   'game',
      label: 'Game',
      items: [
        { to: '/game/users',       icon: Users,             label: 'Người dùng' },
        { to: '/game/deposits',    icon: Coins,             label: 'Nạp tiền' },
        { to: '/game/withdrawals', icon: ArrowDownUp,       label: 'Rút tiền' },
        { to: '/game/rounds',      icon: Gamepad2,          label: 'Rounds' },
        { to: '/game/providers',   icon: Wrench,            label: 'Providers' },
        { to: '/game/lottery',     icon: Coins,             label: 'Xổ số' },
        { to: '/game/statistics',  icon: BarChart2,         label: 'Thống kê' },
        { to: '/game/config',      icon: SlidersHorizontal, label: 'Cấu hình' },
      ],
    },
  ],
});
