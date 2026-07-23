// @ts-nocheck
/* eslint-disable */

import { Request, Response } from 'express';
import { AuthService } from '../../../services/auth/auth.service';
import { setAuthCookies, clearAuthCookies } from '../../../config/cookie.config';
const logger = require('../../../shared/logger');

const authService = new AuthService();

// ===== REGISTER =====
export const register = async (req: Request, res: Response) => {
  try {
    const { username, email, password, fullName, phone } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceId = req.headers['x-device-id'] as string;

    const result = await authService.register({
      username: email || username,
      email: email || username,
      password,
      fullName,
      phone,
      ip,
      userAgent,
      deviceId,
    });

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.status(201).json(result);
  } catch (error: any) {
    logger.error(`Register controller error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Registration failed' });
  }
};

// ===== LOGIN =====
export const login = async (req: Request, res: Response) => {
  try {
    const { username, password, captchaToken } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '0.0.0.0';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const deviceId = req.headers['x-device-id'] as string;

    const result = await authService.login({
      username,
      password,
      ip,
      userAgent,
      deviceId,
      captchaToken,
    });

    if (!result.success) {
      // Nếu yêu cầu captcha
      if (result.captchaRequired) {
        return res.status(403).json({
          success: false,
          captchaRequired: true,
          message: 'Captcha required',
        });
      }
      return res.status(401).json(result);
    }

    // Set cookies
    setAuthCookies(res, result.token!, result.refreshToken);

    res.json({
      success: true,
      user: result.user,
      message: 'Login successful',
    });
  } catch (error: any) {
    logger.error(`Login controller error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Login failed' });
  }
};

// ===== LOGOUT =====
export const logout = async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.['access_token'];
    if (token) {
      await authService.logout(token);
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out' });
  } catch (error: any) {
    logger.error(`Logout error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Logout failed' });
  }
};

// ===== REFRESH TOKEN =====
export const refresh = async (req: Request, res: Response) => {
  try {
    const refreshToken = req.cookies?.['refresh_token'];
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }

    const result = await authService.refreshToken(refreshToken);
    if (!result.success) {
      clearAuthCookies(res);
      return res.status(401).json(result);
    }

    // Cập nhật cookie access token mới
    setAuthCookies(res, result.token!);

    res.json({
      success: true,
      user: result.user,
      message: 'Token refreshed',
    });
  } catch (error: any) {
    logger.error(`Refresh error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Refresh failed' });
  }
};

// ===== ME (Get current user) =====
export const me = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    if (!user) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }
    res.json({ success: true, user });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to get user' });
  }
};

// ===== CHANGE PASSWORD =====
export const changePassword = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Both old and new passwords are required' });
    }

    const result = await authService.changePassword(user.id, oldPassword, newPassword);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

// ===== 2FA SETUP & ENABLE =====
import { TwoFactorService, enable2FA as enable2FAService } from '../../../services/auth/two-factor.service';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

export const setup2FA = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { secret, qrCode } = await TwoFactorService.generateSecret(user.email);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { twoFactorSecret: secret },
    });
    
    res.json({ success: true, secret, qrCode });
  } catch (error: any) {
    res.status(500).json({ success: false, message: 'Failed to setup 2FA' });
  }
};

export const enable2FA = enable2FAService;
