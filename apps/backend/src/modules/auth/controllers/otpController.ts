import { Request, Response } from 'express';
import { getPrismaClient } from '../../../config/databases';
const { sendOtp } = require('../../../shared/services/communication/emailService');
import crypto from 'crypto';

const prisma = getPrismaClient('admin');

export const sendOTP = async (req: Request, res: Response) => {
  const { email, projectId } = req.body;
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

  // Save OTP
  await prisma.oTP.create({
    data: { email, projectId, code, expiresAt },
  });

  // Send via shared email service (DB template → env SMTP fallback)
  await sendOtp(email, code);

  res.status(200).json({ message: 'OTP sent' });
};

export const verifyOTP = async (req: Request, res: Response) => {
  const { email, projectId, code } = req.body;

  const otp = await prisma.oTP.findFirst({
    where: {
      email,
      projectId,
      code,
      isUsed: false,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!otp) {
    return res.status(400).json({ error: 'Invalid or expired OTP' });
  }

  await prisma.oTP.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  res.status(200).json({ message: 'OTP verified' });
};
