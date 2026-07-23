// @ts-nocheck
/* eslint-disable */
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
const logger = require('../../shared/logger');

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'super-secret-refresh-key';
const SALT_ROUNDS = 12;
const MAX_LOGIN_ATTEMPTS = 5;      // Sau 5 lần sai → captcha
const LOCK_ATTEMPTS = 10;           // Sau 10 lần sai → khóa tài khoản
const LOCK_DURATION = 15 * 60;      // 15 phút (giây)
const TOKEN_EXPIRY = 7 * 24 * 60 * 60; // 7 ngày
const REFRESH_TOKEN_EXPIRY = 30 * 24 * 60 * 60; // 30 ngày

export interface AuthResult {
  success: boolean;
  user?: any;
  token?: string;
  refreshToken?: string;
  captchaRequired?: boolean;
  lockUntil?: Date;
  message?: string;
}

export class AuthService {
  // ===== 1. REGISTER =====
  async register(data: {
    username: string;
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    ip: string;
    userAgent: string;
    deviceId?: string;
  }): Promise<AuthResult> {
    try {
      // 1.1. Validate dữ liệu đầu vào
      this.validateRegisterData(data);

      // 1.2. Kiểm tra trùng lặp
      const existing = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.email }], // Note: original model didn't have username, it has email and phone
        },
      });
      if (existing) {
        throw new Error('Email already exists');
      }

      // 1.3. Hash mật khẩu
      const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

      // 1.4. Tạo user
      const user = await prisma.user.create({
        data: {
          email: data.email,
          password: hashedPassword,
          fullName: data.fullName || data.email.split('@')[0],
          phone: data.phone,
          role: 'user',
          status: 'active',
          loginAttempts: 0,
          emailVerified: false,
        },
      });

      // 1.5. Log đăng ký
      await this.logLoginAttempt({
        username: data.email, // using email as username
        ip: data.ip,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        success: true,
        failReason: 'register',
      });

      // 1.6. Gửi email xác nhận (async)
      this.sendVerificationEmail(user.email, user.id);

      return {
        success: true,
        user: this.sanitizeUser(user),
        message: 'Registration successful. Please verify your email.',
      };
    } catch (error: any) {
      logger.error(`Register error: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }

  // ===== 2. LOGIN =====
  async login(data: {
    username: string;
    password: string;
    ip: string;
    userAgent: string;
    deviceId?: string;
    captchaToken?: string;
  }): Promise<AuthResult> {
    try {
      // 2.1. Tìm user
      const user = await prisma.user.findFirst({
        where: {
          OR: [{ email: data.username }, { phone: data.username }],
        },
      });

      if (!user) {
        await this.logLoginAttempt({
          username: data.username,
          ip: data.ip,
          userAgent: data.userAgent,
          deviceId: data.deviceId,
          success: false,
          failReason: 'user_not_found',
        });
        return { success: false, message: 'Invalid credentials' };
      }

      // 2.2. Kiểm tra trạng thái tài khoản
      if (user.status === 'banned' || user.status === 'suspended') {
        return { success: false, message: 'Account has been banned or suspended' };
      }

      // 2.3. Kiểm tra khóa tạm thời
      if (user.lockedUntil && user.lockedUntil > new Date()) {
        const remaining = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
        return {
          success: false,
          message: `Account locked for ${remaining} minutes due to multiple failed attempts`,
          lockUntil: user.lockedUntil,
        };
      }

      // 2.4. Kiểm tra captcha (nếu cần)
      const attempts = user.loginAttempts || 0;
      if (attempts >= MAX_LOGIN_ATTEMPTS) {
        if (!data.captchaToken) {
          return {
            success: false,
            captchaRequired: true,
            message: 'Captcha required after multiple failed attempts',
          };
        }
        // Verify captcha
        const captchaValid = await this.verifyCaptcha(data.captchaToken);
        if (!captchaValid) {
          return { success: false, message: 'Invalid captcha' };
        }
      }

      // 2.5. Xác thực mật khẩu
      const isValid = await bcrypt.compare(data.password, user.password);
      if (!isValid) {
        // Tăng số lần thử sai
        const newAttempts = attempts + 1;
        let lockUntil: Date | null = null;

        if (newAttempts >= LOCK_ATTEMPTS) {
          lockUntil = new Date(Date.now() + LOCK_DURATION * 1000);
        }

        await prisma.user.update({
          where: { id: user.id },
          data: {
            loginAttempts: newAttempts,
            lockedUntil: lockUntil,
          },
        });

        await this.logLoginAttempt({
          userId: user.id,
          username: user.email,
          ip: data.ip,
          userAgent: data.userAgent,
          deviceId: data.deviceId,
          success: false,
          failReason: 'wrong_password',
        });

        if (lockUntil) {
          return {
            success: false,
            message: 'Account locked temporarily due to multiple failed attempts',
            lockUntil,
          };
        }

        const remaining = MAX_LOGIN_ATTEMPTS - newAttempts;
        return {
          success: false,
          message: `Invalid credentials. ${remaining} attempts remaining before captcha required.`,
        };
      }

      // 2.6. Đăng nhập thành công → reset attempts
      await prisma.user.update({
        where: { id: user.id },
        data: {
          loginAttempts: 0,
          lockedUntil: null,
          lastLoginAt: new Date(),
          lastLoginIp: data.ip,
        },
      });

      // 2.7. Tạo session
      const session = await this.createSession(user.id, {
        ip: data.ip,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
      });

      // 2.8. Log thành công
      await this.logLoginAttempt({
        userId: user.id,
        username: user.email,
        ip: data.ip,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        success: true,
      });

      return {
        success: true,
        user: this.sanitizeUser(user),
        token: session.token,
        refreshToken: session.refreshToken,
      };
    } catch (error: any) {
      logger.error(`Login error: ${error.message}`);
      return { success: false, message: 'Login failed' };
    }
  }

  // ===== 3. CREATE SESSION =====
  async createSession(
    userId: string,
    options: { ip?: string; userAgent?: string; deviceId?: string }
  ): Promise<{ token: string; refreshToken: string }> {
    // 3.1. Generate device fingerprint
    let deviceId = options.deviceId;
    if (!deviceId) {
      deviceId = this.generateDeviceId(options.ip, options.userAgent);
    }

    // 3.2. Kiểm tra device quen thuộc
    const existingDevice = await prisma.deviceFingerprint.findUnique({
      where: {
        userId_deviceId: {
          userId,
          deviceId,
        },
      },
    });

    // 3.3. Revoke cũ (nếu cần)
    await prisma.userSession.updateMany({
      where: {
        userId,
        isRevoked: false,
        deviceId: options.deviceId || deviceId,
      },
      data: { isRevoked: true },
    });

    // 3.4. Tạo token mới
    const token = jwt.sign(
      {
        sub: userId,
        email: (await prisma.user.findUnique({ where: { id: userId } }))?.email,
        deviceId,
      },
      JWT_SECRET,
      { expiresIn: TOKEN_EXPIRY }
    );

    const refreshToken = jwt.sign(
      { sub: userId, deviceId },
      JWT_REFRESH_SECRET,
      { expiresIn: REFRESH_TOKEN_EXPIRY }
    );

    // 3.5. Lưu session vào database
    await prisma.userSession.create({
      data: {
        userId,
        token,
        refreshToken,
        ip: options.ip,
        userAgent: options.userAgent,
        deviceId,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY * 1000),
        refreshExpiresAt: new Date(Date.now() + REFRESH_TOKEN_EXPIRY * 1000),
      },
    });

    // 3.6. Cập nhật trust score cho device
    if (existingDevice) {
      await prisma.deviceFingerprint.update({
        where: { id: existingDevice.id },
        data: {
          trustScore: Math.min(existingDevice.trustScore + 5, 100),
          lastSeen: new Date(),
        },
      });
    } else {
      await prisma.deviceFingerprint.create({
        data: {
          userId,
          deviceId,
          ip: options.ip,
          userAgent: options.userAgent,
          trustScore: 10,
        },
      });
    }

    return { token, refreshToken };
  }

  // ===== 4. REFRESH TOKEN =====
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      // 4.1. Verify refresh token
      jwt.verify(refreshToken, JWT_REFRESH_SECRET);

      // 4.2. Tìm session
      const session = await prisma.userSession.findUnique({
        where: { refreshToken },
        include: { user: true },
      });

      if (!session || session.isRevoked) {
        return { success: false, message: 'Invalid refresh token' };
      }

      if (session.refreshExpiresAt && session.refreshExpiresAt < new Date()) {
        return { success: false, message: 'Refresh token expired' };
      }

      // 4.3. Tạo token mới
      const newToken = jwt.sign(
        {
          sub: session.userId,
          email: session.user.email,
          deviceId: session.deviceId,
        },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
      );

      // 4.4. Cập nhật session
      await prisma.userSession.update({
        where: { id: session.id },
        data: {
          token: newToken,
          expiresAt: new Date(Date.now() + TOKEN_EXPIRY * 1000),
        },
      });

      return {
        success: true,
        token: newToken,
        user: this.sanitizeUser(session.user),
      };
    } catch (error) {
      return { success: false, message: 'Invalid refresh token' };
    }
  }

  // ===== 5. LOGOUT =====
  async logout(token: string): Promise<boolean> {
    try {
      await prisma.userSession.updateMany({
        where: { token },
        data: { isRevoked: true },
      });
      return true;
    } catch {
      return false;
    }
  }

  // ===== 6. VERIFY TOKEN (Middleware) =====
  async verifyToken(token: string): Promise<any | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any;

      // Kiểm tra session còn hợp lệ không
      const session = await prisma.userSession.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session || session.isRevoked || session.expiresAt < new Date()) {
        return null;
      }

      return {
        ...decoded,
        user: this.sanitizeUser(session.user),
      };
    } catch {
      return null;
    }
  }

  // ===== 7. LOGIN ATTEMPT LOGGING =====
  private async logLoginAttempt(data: {
    userId?: string;
    username: string;
    ip: string;
    userAgent: string;
    deviceId?: string;
    success: boolean;
    failReason?: string;
  }) {
    await prisma.loginLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        ip: data.ip,
        userAgent: data.userAgent,
        deviceId: data.deviceId,
        success: data.success,
        failReason: data.failReason,
      },
    });
  }

  // ===== 8. CAPTCHA VERIFICATION =====
  async verifyCaptcha(token: string): Promise<boolean> {
    const secret = process.env.CAPTCHA_SECRET_KEY;
    if (!secret) return true; // Fallback nếu chưa cấu hình

    try {
      const response = await fetch('https://www.google.com/recaptcha/api/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${secret}&response=${token}`,
      });
      const data = await response.json();
      return data.success && data.score > 0.5;
    } catch {
      return false;
    }
  }

  // ===== 9. CHANGE PASSWORD & HISTORY =====
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    // Kiểm tra mật khẩu cũ
    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) throw new Error('Old password incorrect');

    // Kiểm tra mật khẩu không được trùng với 5 mật khẩu gần nhất
    const history = (user.passwordHistory as string[]) || [];
    for (const hash of history) {
      if (await bcrypt.compare(newPassword, hash)) {
        throw new Error('Password has been used recently');
      }
    }

    // Hash mới và cập nhật
    const newHash = await bcrypt.hash(newPassword, SALT_ROUNDS);
    const newHistory = [newHash, ...history.slice(0, 4)]; // Giữ 5 gần nhất

    await prisma.user.update({
      where: { id: userId },
      data: {
        password: newHash,
        passwordHistory: newHistory,
        lastPasswordChange: new Date(),
      },
    });

    return { success: true, message: 'Password changed successfully' };
  }

  // ===== 10. HELPER: Sanitize user =====
  private sanitizeUser(user: any) {
    const { password, passwordHistory, twoFactorSecret, ...safe } = user;
    return safe;
  }

  // ===== 10. HELPER: Generate device ID =====
  private generateDeviceId(ip?: string, userAgent?: string): string {
    const hash = crypto.createHash('sha256');
    hash.update(`${ip || ''}${userAgent || ''}`);
    return hash.digest('hex').slice(0, 32);
  }

  // ===== 11. VALIDATE REGISTER DATA =====
  private validateRegisterData(data: any) {
    const { username, email, password } = data;

    if (username && !/^[a-zA-Z0-9_]{3,30}$/.test(username)) {
      throw new Error('Invalid username format (3-30 chars, alphanumeric and underscore only)');
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('Invalid email format');
    }
    if (!password || password.length < 8) {
      throw new Error('Password must be at least 8 characters');
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
      throw new Error('Password must contain uppercase, lowercase, and number');
    }
  }

  // ===== 12. SEND VERIFICATION EMAIL =====
  private async sendVerificationEmail(email: string, userId: string) {
    // Tạo token xác thực email
    const token = jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: '24h' });
    const link = `${process.env.APP_URL}/verify-email?token=${token}`;

    logger.info(`Verification link for ${email}: ${link}`);
  }
}
