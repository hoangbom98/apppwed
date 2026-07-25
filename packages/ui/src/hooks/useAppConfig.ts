import { useEffect, useState } from 'react';

export interface AppConfig {
  primaryColor:   string;
  secondaryColor: string;
  accentColor?:   string;
  logo:           string;
  siteName:       string;
  maintenance:    boolean;
  [key: string]:  unknown;
}

const DEFAULT_CONFIG: AppConfig = {
  primaryColor:   '#0d9488',
  secondaryColor: '#1a1a2e',
  accentColor:    '#f59e0b',
  logo:           '/logo.png',
  siteName:       'LKVIP',
  maintenance:    false,
};

const PROJECTS = new Set(['hub', 'game', 'trade', 'dating', 'sports', 'admin', 'lkvip']);
const cache = new Map<string, Record<string, unknown>>();
let _fullConfig: Record<string, unknown> = { ...DEFAULT_CONFIG };

export function setAppConfig(cfg: Record<string, unknown>) {
  _fullConfig = { ..._fullConfig, ...cfg };
}

function inferProject(): string {
  const envProject = (import.meta as any).env?.VITE_PROJECT;
  if (envProject && PROJECTS.has(envProject)) return envProject;
  if (typeof window === 'undefined') return 'hub';

  const host = window.location.hostname.split('.')[0]?.toLowerCase();
  if (host && PROJECTS.has(host)) return host;
  return 'hub';
}

function normalizeConfig(data: Record<string, unknown>): Record<string, unknown> {
  return {
    ...data,
    primaryColor: data.primaryColor ?? data.primary_color,
    secondaryColor: data.secondaryColor ?? data.secondary_color,
    accentColor: data.accentColor ?? data.accent_color,
    logo: data.logo ?? data.logo_url,
    siteName: data.siteName ?? data.site_name,
  };
}

async function fetchConfig(project: string, group?: string): Promise<Record<string, unknown>> {
  const key = `${project}:${group ?? 'all'}`;
  const cached = cache.get(key);
  if (cached) return cached;

  const params = new URLSearchParams({ project });
  if (group) params.set('group', group);

  const response = await fetch(`/api/shared/config?${params.toString()}`, {
    headers: { Accept: 'application/json' },
    credentials: 'same-origin',
  });
  if (!response.ok) throw new Error(`Config request failed: ${response.status}`);

  const body = await response.json();
  const raw = body?.data ?? body ?? {};
  const normalized = normalizeConfig(raw);
  cache.set(key, normalized);
  return normalized;
}

export function useAppConfig(key?: string): AppConfig | { data: any; isLoading: boolean; error: Error | null } {
  const project = inferProject();
  const initial = key !== undefined ? cache.get(`${project}:${key}`) ?? null : _fullConfig;
  const [data, setData] = useState<Record<string, unknown> | null>(initial as Record<string, unknown> | null);
  const [isLoading, setIsLoading] = useState(Boolean(key && !initial));
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(Boolean(key));
    fetchConfig(project, key)
      .then(config => {
        if (!active) return;
        setData(config);
        setError(null);
        if (!key) _fullConfig = { ..._fullConfig, ...config };
      })
      .catch(err => {
        if (!active) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setData(key ? null : _fullConfig);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => { active = false; };
  }, [project, key]);

  if (key !== undefined) return { data, isLoading, error };
  return { ...DEFAULT_CONFIG, ...(_fullConfig as AppConfig), ...(data ?? {}) } as AppConfig;
}

export function applyColorConfig(cfg?: Partial<AppConfig> | null): void {
  if (!cfg) return;

  const primary = cfg.primaryColor ?? cfg.primary_color;
  const secondary = cfg.secondaryColor ?? cfg.secondary_color;
  const accent = cfg.accentColor ?? cfg.accent_color;

  if (primary) document.documentElement.style.setProperty('--color-primary', String(primary));
  if (secondary) document.documentElement.style.setProperty('--color-secondary', String(secondary));
  if (accent) document.documentElement.style.setProperty('--color-accent', String(accent));
}
