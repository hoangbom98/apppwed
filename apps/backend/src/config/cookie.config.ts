import { Response, CookieOptions } from 'express';

type SameSite = 'strict' | 'lax' | 'none';

const sameSiteValue: SameSite = process.env.NODE_ENV === 'production' ? 'strict' : 'lax';
const isSecure = process.env.NODE_ENV === 'production';

export const cookieOptions: Record<string, CookieOptions> = {
  // Access token (short-lived)
  accessToken: {
    httpOnly: true,
    secure:   isSecure,
    sameSite: sameSiteValue,
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 ngày
    path:     '/',
    domain:   process.env.COOKIE_DOMAIN || undefined,
  },
  // Refresh token (longer-lived)
  refreshToken: {
    httpOnly: true,
    secure:   isSecure,
    sameSite: sameSiteValue,
    maxAge:   30 * 24 * 60 * 60 * 1000, // 30 ngày
    path:     '/api/auth/refresh',
    domain:   process.env.COOKIE_DOMAIN || undefined,
  },
  // Session ID (optional)
  sessionId: {
    httpOnly: true,
    secure:   isSecure,
    sameSite: sameSiteValue,
    maxAge:   24 * 60 * 60 * 1000, // 1 ngày
    path:     '/',
    domain:   process.env.COOKIE_DOMAIN || undefined,
  },
};

export const setAuthCookies = (
  res: Response,
  accessToken: string,
  refreshToken?: string
) => {
  res.cookie('access_token', accessToken, cookieOptions.accessToken);
  if (refreshToken) {
    res.cookie('refresh_token', refreshToken, cookieOptions.refreshToken);
  }
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie('access_token', { path: '/' });
  res.clearCookie('refresh_token', { path: '/api/auth/refresh' });
};
