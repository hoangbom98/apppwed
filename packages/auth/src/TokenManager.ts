/**
 * TokenManager — manages access & refresh tokens in localStorage.
 * Used by apiClient interceptors to handle silent token refresh.
 */
export class TokenManager {
  private static ACCESS_KEY  = 'lkvip_access_token';
  private static REFRESH_KEY = 'lkvip_refresh_token';

  static getAccessToken(): string | null {
    return localStorage.getItem(this.ACCESS_KEY);
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_KEY);
  }

  static setTokens(accessToken: string, refreshToken?: string): void {
    localStorage.setItem(this.ACCESS_KEY, accessToken);
    if (refreshToken) {
      localStorage.setItem(this.REFRESH_KEY, refreshToken);
    }
  }

  static clearTokens(): void {
    localStorage.removeItem(this.ACCESS_KEY);
    localStorage.removeItem(this.REFRESH_KEY);
  }

  static hasToken(): boolean {
    return Boolean(this.getAccessToken());
  }
}
