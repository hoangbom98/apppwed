import { DashboardOutlined, UserOutlined, SettingOutlined, AppstoreOutlined, DollarOutlined } from '@ant-design/icons';

export const menuData = [
  { path: '/', name: 'Dashboard', icon: <DashboardOutlined /> },
  { path: '/users', name: 'Người dùng', icon: <UserOutlined /> },
  { path: '/finance', name: 'Tài chính', icon: <DollarOutlined /> },
  {
    path: '/hub',
    name: 'Hub Config',
    icon: <AppstoreOutlined />,
    children: [
      { path: '/hub/games', name: 'Quản lý Game' },
      { path: '/hub/banners', name: 'Banners' },
    ]
  },
  { path: '/settings', name: 'Cài đặt', icon: <SettingOutlined /> },
];
