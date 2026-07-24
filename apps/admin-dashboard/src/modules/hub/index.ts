// frontend/admin-dashboard/src/modules/hub/index.ts
// Hub Content module self-registration — imported once by AdminLayout bootstrap.
import { registerModule } from '../registry';
import {
  Gamepad2, FolderOpen, Globe, Wrench, Newspaper, FileText,
  Image, Menu as MenuIcon, MessageSquare, Search, SlidersHorizontal,
  Smartphone,
} from 'lucide-react';

registerModule({
  id:        'hub',
  name:      'Hub Content',
  projectId: 'hub',
  menuGroups: [
    {
      key:   'hub',
      label: 'Hub Content',
      items: [
        { to: '/games',       icon: Gamepad2,          label: 'Games' },
        { to: '/categories',  icon: FolderOpen,        label: 'Danh mục' },
        { to: '/websites',    icon: Globe,             label: 'Websites' },
        { to: '/tools',       icon: Wrench,            label: 'Công cụ' },
        { to: '/news',        icon: Newspaper,         label: 'Tin tức' },
        { to: '/pages',       icon: FileText,          label: 'Pages' },
        { to: '/banners',     icon: Image,             label: 'Banners' },
        { to: '/menus',       icon: MenuIcon,          label: 'Menus' },
        { to: '/feedbacks',   icon: MessageSquare,     label: 'Phản hồi' },
        { to: '/seo',         icon: Search,            label: 'SEO' },
        { to: '/app-catalog', icon: Smartphone,        label: 'App Catalog' },
        { to: '/hub/config',  icon: SlidersHorizontal, label: 'Cấu hình' },
      ],
    },
  ],
});
