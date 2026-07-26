// @ts-nocheck
import React, { useEffect } from 'react';
import { App as AntdApp, ConfigProvider, type ThemeConfig } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { ThemeProvider } from 'antd-style';
import { applyColorConfig, useAppConfig } from '../../hooks/useAppConfig';
import { getLkvipAntdTheme, type LkvipProject, type LkvipThemeMode } from '../../theme/antdTheme';

interface LkvipAntdProviderProps {
  children: React.ReactNode;
  project?: LkvipProject;
  mode?: LkvipThemeMode;
  theme?: ThemeConfig;
}

export function LkvipAntdProvider({ children, project = 'hub', mode = 'dark', theme }: LkvipAntdProviderProps) {
  const config = useAppConfig();

  useEffect(() => {
    applyColorConfig(config);
    const root = document.documentElement;
    const primary = config?.primaryColor ?? config?.primary_color;
    const secondary = config?.secondaryColor ?? config?.secondary_color;
    const accent = config?.accentColor ?? config?.accent_color;

    if (primary) {
      root.style.setProperty('--lkvip-primary', String(primary));
      if (project === 'trading' || project === 'trade') root.style.setProperty('--bn-primary', String(primary));
    }
    if (secondary) root.style.setProperty('--lkvip-secondary', String(secondary));
    if (accent) {
      root.style.setProperty('--lkvip-accent', String(accent));
      if (project === 'trading' || project === 'trade') root.style.setProperty('--bn-yellow', String(accent));
    }
  }, [config, project]);

  return (
    <ConfigProvider locale={viVN} theme={getLkvipAntdTheme({ project, mode, colors: config, overrides: theme })}>
      <AntdApp>
        <ThemeProvider themeMode={mode}>{children}</ThemeProvider>
      </AntdApp>
    </ConfigProvider>
  );
}

export const AppProvider = LkvipAntdProvider;
