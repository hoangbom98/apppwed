import React from 'react';
import { Outlet } from 'react-router-dom';
import { LkvipThemeWrapper, H5Layout, H5Header, H5BottomNav } from '@ui';

interface MainLayoutProps {
  title?: string;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ title }) => (
  <LkvipThemeWrapper>
    <H5Layout>
      <H5Header title={title || 'LKVIP Game'} />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <H5BottomNav items={[]} />
    </H5Layout>
  </LkvipThemeWrapper>
);
