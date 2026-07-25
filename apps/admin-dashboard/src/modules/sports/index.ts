// frontend/admin-dashboard/src/modules/sports/index.ts
// Sports module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  LayoutDashboard, Users, Trophy, TrendingUp, Newspaper, SlidersHorizontal,
} from 'lucide-react';

registerModule({
  id:        'sports',
  name:      'Sports Scores',
  projectId: 'sports',
  menuGroups: [
    {
      key:   'sports',
      label: 'Sports',
      items: [
        { to: '/sports',          icon: LayoutDashboard,   label: 'Tổng quan' },
        { to: '/sports/users',    icon: Users,             label: 'Người dùng' },
        { to: '/sports/leagues',  icon: Trophy,            label: 'Giải đấu' },
        { to: '/sports/teams',    icon: Trophy,            label: 'Đội bóng' },
        { to: '/sports/matches',  icon: Trophy,            label: 'Trận đấu' },
        { to: '/sports/bets',     icon: TrendingUp,        label: 'Cược' },
        { to: '/sports/articles', icon: Newspaper,         label: 'Bài viết' },
        { to: '/sports/config',   icon: SlidersHorizontal, label: 'Cấu hình' },
      ],
    },
  ],
});
