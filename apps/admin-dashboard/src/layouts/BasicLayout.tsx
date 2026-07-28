import { ProLayout } from '@ant-design/pro-components';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { DashboardOutlined, UserOutlined } from '@ant-design/icons';

export default function BasicLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <ProLayout
      title="LKVIP Admin"
      logo="https://gw.alipayobjects.com/zos/rmsportal/KDpgvguMpGfqaHPjicRK.svg"
      location={{ pathname: location.pathname }}
      onMenuHeaderClick={() => navigate('/')}
      menuItemRender={(item, dom) => (
        <a onClick={() => item.path && navigate(item.path)}>{dom}</a>
      )}
      route={{
        path: '/',
        routes: [
          { path: '/dashboard', name: 'Dashboard', icon: <DashboardOutlined /> },
          { path: '/users', name: 'Người dùng', icon: <UserOutlined /> },
        ],
      }}
      layout="mix"
    >
      <Outlet />
    </ProLayout>
  );
}
