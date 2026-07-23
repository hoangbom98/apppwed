// frontend/admin-dashboard/src/modules/trade/index.ts
// Trade module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  Users, Search, ArrowDownUp, Coins, SlidersHorizontal,
} from 'lucide-react';

registerModule({
  id:        'trade',
  name:      'Trade Platform',
  projectId: 'trade',
  menuGroups: [
    {
      key:   'trade',
      label: 'Trade',
      items: [
        { to: '/trade/users',   icon: Users,             label: 'Người dùng' },
        { to: '/trade/kyc',     icon: Search,            label: 'KYC Queue' },
        { to: '/trade/orders',  icon: ArrowDownUp,       label: 'Lệnh giao dịch' },
        { to: '/trade/wallets', icon: Coins,             label: 'Ví' },
        { to: '/trade/config',  icon: SlidersHorizontal, label: 'Cấu hình' },
      ],
    },
  ],
});
