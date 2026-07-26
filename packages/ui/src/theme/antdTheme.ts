import { theme, type ThemeConfig } from 'antd';

export type LkvipProject = 'hub' | 'game' | 'trading' | 'trade' | 'sports' | 'dating' | 'admin' | 'lkvip';
export type LkvipThemeMode = 'dark' | 'light';

interface LkvipThemeOptions {
  project?: LkvipProject;
  mode?: LkvipThemeMode;
  colors?: Record<string, unknown> | null;
  overrides?: ThemeConfig;
}

const PROJECT_PRIMARY: Record<LkvipProject, string> = {
  hub: '#3b82f6',
  game: '#8b5cf6',
  trading: '#fcd535',
  trade: '#fcd535',
  sports: '#10b981',
  dating: '#ec4899',
  admin: '#3b82f6',
  lkvip: '#3b82f6',
};

function pickColor(colors: Record<string, unknown> | null | undefined, ...keys: string[]): string | undefined {
  for (const key of keys) {
    const value = colors?.[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return undefined;
}

export function getLkvipAntdTheme(options: LkvipThemeOptions = {}): ThemeConfig {
  const project = options.project ?? 'hub';
  const mode = options.mode ?? 'dark';
  const primary = pickColor(options.colors, 'primaryColor', 'primary_color', 'primary') ?? PROJECT_PRIMARY[project];
  const accent = pickColor(options.colors, 'accentColor', 'accent_color', 'accent') ?? (project === 'trading' || project === 'trade' ? '#fcd535' : '#60a5fa');
  const isLight = mode === 'light';

  const base: ThemeConfig = {
    algorithm: isLight ? theme.defaultAlgorithm : theme.darkAlgorithm,
    token: {
      colorPrimary: primary,
      colorLink: accent,
      fontFamily: "-apple-system, 'Segoe UI', system-ui, sans-serif",
      fontSize: 14,
      borderRadius: 8,
      borderRadiusLG: 10,
      colorBgBase: isLight ? '#f5f7fb' : '#141414',
      colorBgContainer: isLight ? '#ffffff' : '#1f1f1f',
      colorBgElevated: isLight ? '#ffffff' : '#262626',
      colorBgLayout: isLight ? '#f5f7fb' : '#0f0f0f',
      colorBorder: isLight ? '#d9d9d9' : '#303030',
      colorBorderSecondary: isLight ? '#f0f0f0' : '#262626',
      colorTextBase: isLight ? '#141414' : '#f0f0f0',
      colorTextSecondary: isLight ? '#595959' : '#8c8c8c',
    },
    components: {
      Layout: {
        siderBg: isLight ? '#ffffff' : '#141414',
        headerBg: isLight ? '#ffffff' : '#1a1a1a',
        bodyBg: isLight ? '#f5f7fb' : '#0f0f0f',
        footerBg: isLight ? '#ffffff' : '#141414',
      },
      Menu: {
        darkItemBg: '#141414',
        darkSubMenuItemBg: '#1a1a1a',
        darkItemSelectedBg: project === 'trading' || project === 'trade' ? 'rgba(252,213,53,0.16)' : 'rgba(59,130,246,0.15)',
        darkItemSelectedColor: primary,
        darkItemHoverBg: 'rgba(255,255,255,0.04)',
        itemBorderRadius: 6,
      },
      Table: {
        headerBg: isLight ? '#fafafa' : '#1a1a1a',
        rowHoverBg: isLight ? '#f5f5f5' : 'rgba(255,255,255,0.03)',
        borderColor: isLight ? '#f0f0f0' : '#2a2a2a',
      },
      Card: {
        paddingLG: 20,
      },
      Modal: {
        contentBg: isLight ? '#ffffff' : '#1f1f1f',
        headerBg: isLight ? '#ffffff' : '#1f1f1f',
      },
      Button: {
        borderRadius: 8,
      },
      Tabs: {
        inkBarColor: primary,
        itemSelectedColor: primary,
      },
    },
  };

  return {
    ...base,
    ...options.overrides,
    token: { ...base.token, ...options.overrides?.token },
    components: { ...base.components, ...options.overrides?.components },
  };
}
