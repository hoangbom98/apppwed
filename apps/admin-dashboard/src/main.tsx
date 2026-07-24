// frontend/admin-dashboard/src/main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { ConfigProvider, theme, App as AntdApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import App from './App';
import './index.css';

// ── PWA: Register Service Worker (production only) ────────────────────────────
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  navigator.serviceWorker
    .register('/sw.js', { scope: '/' })
    .then((reg) => {
      reg.addEventListener('updatefound', () => {
        const next = reg.installing;
        if (!next) return;
        next.addEventListener('statechange', () => {
          if (next.state === 'installed' && navigator.serviceWorker.controller) {
            document.dispatchEvent(new CustomEvent('sw:update-available'));
          }
        });
      });
    })
    .catch((err) => console.warn('[SW] Registration failed:', err));
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <ConfigProvider
      locale={viVN}
      theme={{
        algorithm: theme.darkAlgorithm,
        token: {
          // Brand colour
          colorPrimary:    '#3b82f6',
          colorLink:       '#60a5fa',
          // Typography
          fontFamily:      "-apple-system, 'Segoe UI', system-ui, sans-serif",
          fontSize:        14,
          borderRadius:    8,
          borderRadiusLG:  10,
          // Dark surface colours (closer to gray-900/950)
          colorBgBase:     '#141414',
          colorBgContainer:'#1f1f1f',
          colorBgElevated: '#262626',
          colorBgLayout:   '#0f0f0f',
          colorBorder:     '#303030',
          colorBorderSecondary: '#262626',
          // Text
          colorTextBase:   '#f0f0f0',
          colorTextSecondary: '#8c8c8c',
        },
        components: {
          Layout: {
            siderBg:      '#141414',
            headerBg:     '#1a1a1a',
            bodyBg:       '#0f0f0f',
            footerBg:     '#141414',
          },
          Menu: {
            darkItemBg:           '#141414',
            darkSubMenuItemBg:    '#1a1a1a',
            darkItemSelectedBg:   'rgba(59,130,246,0.15)',
            darkItemSelectedColor:'#60a5fa',
            darkItemHoverBg:      'rgba(255,255,255,0.04)',
            itemBorderRadius:     6,
          },
          Table: {
            headerBg:     '#1a1a1a',
            rowHoverBg:   'rgba(255,255,255,0.03)',
            borderColor:  '#2a2a2a',
          },
          Card: {
            paddingLG: 20,
          },
          Modal: {
            contentBg:  '#1f1f1f',
            headerBg:   '#1f1f1f',
          },
        },
      }}
    >
      <AntdApp>
        <App />
      </AntdApp>
    </ConfigProvider>
  </React.StrictMode>
);
