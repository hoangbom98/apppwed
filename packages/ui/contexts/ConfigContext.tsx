// @ts-nocheck
/**
 * ConfigContext.jsx — shared React context for per-project UI configuration.
 *
 * Provides a `useConfig()` hook that returns the flat config map for the
 * current project, plus a `applyColorConfig()` effect to inject CSS variables.
 *
 * Usage (wrap your app root):
 *   import { ConfigProvider } from '@shared-ui/contexts/ConfigContext';
 *   <ConfigProvider project="game">
 *     <App />
 *   </ConfigProvider>
 *
 * In components:
 *   const config = useConfig();
 *   const siteName = config['site_name'] ?? 'My App';
 *   const isPrimaryPink = config['primary_color'] === '#ec4899';
 */
import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api/client';

const ConfigContext = createContext({});

/**
 * @param {{ project: string, children: React.ReactNode }} props
 *   `project` must match VITE_PROJECT env var (hub | game | trade | dating | sports)
 */
export function ConfigProvider({ project, children }) {
  const [config, setConfig] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!project) { setLoading(false); return; }

    api
      .get('/shared/config')
      .then(res => {
        const data = res.data?.data ?? res.data ?? {};
        setConfig(data);

        // Apply CSS variables from colors config immediately
        const root = document.documentElement;
        if (data.primary_color)   root.style.setProperty('--color-primary',   data.primary_color);
        if (data.secondary_color) root.style.setProperty('--color-secondary', data.secondary_color);
        if (data.accent_color)    root.style.setProperty('--color-accent',    data.accent_color);
      })
      .catch(() => { /* silently fallback to default styles */ })
      .finally(() => setLoading(false));
  }, [project]);

  return (
    <ConfigContext.Provider value={{ config, loading }}>
      {children}
    </ConfigContext.Provider>
  );
}

/**
 * Hook to access the current project's config map.
 * @returns {{ config: Record<string,*>, loading: boolean }}
 */
export function useConfig() {
  return useContext(ConfigContext);
}

export default ConfigContext;
