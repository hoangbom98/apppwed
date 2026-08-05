// Reads brand/site config from env vars with sensible defaults.
// Used by Login, AdminLayout, Dashboard header.
export function useSiteConfig() {
  const appName     = import.meta.env?.VITE_APP_NAME     ?? 'Admin Portal';
  const logoLetter  = appName.charAt(0).toUpperCase();
  const apiBase     = import.meta.env?.VITE_API_URL      ?? 'http://localhost:5000/api';
  const backendUrl  = import.meta.env?.VITE_BACKEND_URL  ?? 'http://localhost:5000';

  return { appName, logoLetter, apiBase, backendUrl };
}
