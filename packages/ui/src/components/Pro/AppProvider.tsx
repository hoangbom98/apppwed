// @ts-nocheck
import React from 'react';
import { ConfigProvider, theme } from 'antd';
import { ThemeProvider } from 'antd-style';

export const AppProvider = ({ children }: { children: React.ReactNode }) => (
  <ConfigProvider
    theme={{
      algorithm: theme.darkAlgorithm,
      token: {
        colorPrimary: '#0066FF',
        borderRadius: 8,
      },
    }}
  >
    <ThemeProvider themeMode="dark">
      {children}
    </ThemeProvider>
  </ConfigProvider>
);
