import { ProLayout } from '@ant-design/pro-components';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { menuData } from '../core/routes/menu';

export default function AdminLayout() {
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
      menuDataRender={() => menuData}
      layout="mix"
      fixSiderbar
    >
      <Outlet />
    </ProLayout>
  );
}
