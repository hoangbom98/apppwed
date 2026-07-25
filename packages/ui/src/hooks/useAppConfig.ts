// packages/shared-ui/src/hooks/useAppConfig.ts
import { useState, useEffect } from 'react';

export interface AppConfig {
  primaryColor:   string;
  secondaryColor: string;
  logo:           string;
  siteName:       string;
  maintenance:    boolean;
  [key: string]:  unknown;
}

const DEFAULT_CONFIG: AppConfig = {
  primaryColor:   '#0d9488',
  secondaryColor: '#1a1a2e',
  logo:           '/logo.png',
  siteName:       'LKVIP',
  maintenance:    false,
};

let _fullConfig: Record<string, unknown> = { ...DEFAULT_CONFIG };

export function setAppConfig(cfg: Record<string, unknown>) {
  _fullConfig = { ..._fullConfig, ...cfg };
}

/**
 * useAppConfig() — returns full config
 * useAppConfig('key') — returns { data: value } for a specific section key
 */
export function useAppConfig(key?: string): AppConfig | { data: any } {
  const [cfg, setCfg] = useState<Record<string, unknown>>(_fullConfig);
  useEffect(() => { setCfg(_fullConfig); }, []);
  if (key !== undefined) return { data: cfg[key] ?? null };
  return cfg as AppConfig;
}

export function applyColorConfig(cfg: Partial<AppConfig>): void {
  if (cfg.primaryColor)   document.documentElement.style.setProperty('--color-primary',   cfg.primaryColor);
  if (cfg.secondaryColor) document.documentElement.style.setProperty('--color-secondary', cfg.secondaryColor);
}
