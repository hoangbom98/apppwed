import { registerModule } from '../registry';
import {
  Users, Heart, CreditCard, Image, Shield, SlidersHorizontal,
} from 'lucide-react';

registerModule({
  id:        'dating',
  name:      'Dating / Livestream',
  projectId: 'dating',
  menuGroups: [
    {
      key:   'dating',
      label: 'Dating',
      items: [
        { to: '/dating/users',    icon: Users,             label: 'Người dùng' },
        { to: '/dating/profiles', icon: Heart,             label: 'Profiles' },
        { to: '/dating/matches',  icon: Heart,             label: 'Matches' },
        { to: '/dating/gifts',    icon: CreditCard,        label: 'Quà tặng' },
        { to: '/dating/moments',  icon: Image,             label: 'Moments' },
        { to: '/dating/reports',  icon: Shield,            label: 'Báo cáo vi phạm' },
        { to: '/dating/config',   icon: SlidersHorizontal, label: 'Cấu hình' },
      ],
    },
  ],
});
