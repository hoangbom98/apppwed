// @ts-nocheck
/* eslint-disable */

import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';

const prisma = new PrismaClient();

export class TwoFactorService {
  static async generateSecret(username: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(username, 'LKVIP GROUP', secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    return { secret, qrCode };
  }

  static verify(secret: string, token: string): boolean {
    return authenticator.verify({ secret, token });
  }
}

// API endpoint
export const enable2FA = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA not setup' });
    }

    if (TwoFactorService.verify(user.twoFactorSecret, token)) {
      await prisma.user.update({
        where: { id: userId },
        data: { twoFactorEnabled: true },
      });
      return res.json({ success: true, message: '2FA enabled' });
    }

    res.status(400).json({ success: false, message: 'Invalid token' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
