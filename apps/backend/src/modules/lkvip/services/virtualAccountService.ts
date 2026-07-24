// @ts-nocheck
/* eslint-disable */

import QRCode from 'qrcode';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';
// decimal.js installed lazily — fallback to native if missing
let Decimal: any;
try { Decimal = require('decimal.js'); } catch { Decimal = Number; }
import AmlService from './amlService';
const logger = require('../../../shared/services/logger');

interface BankInfo {
  accountNumber: string;
  accountName: string;
  bankBin: string;
}

class VirtualAccountService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Generate VA number from userId + timestamp
  private generateVANumber(userId: string): string {
    const prefix = '889900'; // LKvip identifier
    const userPart = userId.slice(-6).padStart(6, '0');
    const timePart = Date.now().toString().slice(-6);
    return `${prefix}${userPart}${timePart}`;
  }

  // Remove Vietnamese accents, uppercase, keep alphanumeric + space (max 50 chars)
  private sanitizeName(name: string): string {
    const map: Record<string, string> = {
      'á': 'a', 'à': 'a', 'ả': 'a', 'ã': 'a', 'ạ': 'a',
      'ă': 'a', 'ắ': 'a', 'ằ': 'a', 'ẳ': 'a', 'ẵ': 'a', 'ặ': 'a',
      'â': 'a', 'ấ': 'a', 'ầ': 'a', 'ẩ': 'a', 'ẫ': 'a', 'ậ': 'a',
      'é': 'e', 'è': 'e', 'ẻ': 'e', 'ẽ': 'e', 'ẹ': 'e',
      'ê': 'e', 'ế': 'e', 'ề': 'e', 'ể': 'e', 'ễ': 'e', 'ệ': 'e',
      'í': 'i', 'ì': 'i', 'ỉ': 'i', 'ĩ': 'i', 'ị': 'i',
      'ó': 'o', 'ò': 'o', 'ỏ': 'o', 'õ': 'o', 'ọ': 'o',
      'ô': 'o', 'ố': 'o', 'ồ': 'o', 'ổ': 'o', 'ỗ': 'o', 'ộ': 'o',
      'ơ': 'o', 'ớ': 'o', 'ờ': 'o', 'ở': 'o', 'ỡ': 'o', 'ợ': 'o',
      'ú': 'u', 'ù': 'u', 'ủ': 'u', 'ũ': 'u', 'ụ': 'u',
      'ư': 'u', 'ứ': 'u', 'ừ': 'u', 'ử': 'u', 'ữ': 'u', 'ự': 'u',
      'ý': 'y', 'ỳ': 'y', 'ỷ': 'y', 'ỹ': 'y', 'ỵ': 'y',
      'đ': 'd',
    };
    let result = name.replace(/[^\u0020-\u007E]/g, (ch) => map[ch] || ch);
    result = result.toUpperCase();
    result = result.replace(/[^A-Z0-9 ]/g, '');
    return result.substring(0, 50);
  }

  // Generate QR code data URL
  private async generateQR(accountNumber: string, accountName: string, bankBin: string, amount?: Decimal): Promise<string> {
    const sanitizedName = this.sanitizeName(accountName);
    const addInfo = `NAP_${Date.now()}`;

    const vietQrApiKey    = process.env.VIETQR_API_KEY;
    const vietQrClientId  = process.env.VIETQR_CLIENT_ID;

    if (vietQrApiKey && vietQrClientId) {
      try {
        const res = await axios.post(
          'https://api.vietqr.io/v2/generate',
          {
            accountNo:   accountNumber,
            accountName: sanitizedName,
            acqId:       bankBin,
            amount:      amount ? amount.toNumber() : 0,
            addInfo,
            format:      'text',
            template:    'compact',
          },
          {
            headers: {
              'x-client-id':  vietQrClientId,
              'x-api-key':    vietQrApiKey,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          }
        );

        if (res.data?.code === '00' && res.data?.data?.qrDataURL) {
          return res.data.data.qrDataURL;
        }
      } catch (err: any) {
        logger.warn(`[VietQR] API call failed: ${err.message} — falling back to local QR`);
      }
    }

    // Fallback: local QR generation
    const payload = JSON.stringify({
      accountNo:   accountNumber,
      accountName: sanitizedName,
      acqId:       bankBin,
      amount:      amount ? amount.toNumber() : 0,
      addInfo,
    });

    return await QRCode.toDataURL(payload, {
      errorCorrectionLevel: 'H',
      margin: 2,
      width: 300,
    });
  }

  // Create a new Virtual Account
  async createVirtualAccount(userId: string, amount: Decimal, expiryMinutes: number = 60) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { fullName: true },
    });

    const vaNumber = this.generateVANumber(userId);
    const accountName = user?.fullName || `User${userId.slice(-4)}`;

    const mainBank = await this.prisma.bankAccount.findFirst({
      where: { isMain: true, isActive: true },
    });

    const bankBin = mainBank?.bankBin ?? '970415';
    const bankName = mainBank?.bankName ?? 'Ngân hàng Nội bộ LKvip';

    const qrDataUrl = await this.generateQR(vaNumber, accountName, bankBin, amount);

    return await this.prisma.virtualAccount.create({
      data: {
        userId,
        vaNumber,
        bankBin,
        bankName,
        accountName,
        qrDataUrl,
        expectedAmount: amount,
        expiredAt: new Date(Date.now() + expiryMinutes * 60 * 1000),
        status: 'pending',
      },
    });
  }

  // Confirm deposit
  async confirmDeposit(vaNumber: string, amount: Decimal, transactionRef: string) {
    const va = await this.prisma.virtualAccount.findFirst({
      where: { vaNumber, status: 'pending' },
      include: { user: true },
    });

    if (!va) throw new Error('Virtual account not found or already processed');
    if (new Date() > va.expiredAt) {
      await this.prisma.virtualAccount.update({ where: { id: va.id }, data: { status: 'expired' } });
      throw new Error('Virtual account has expired');
    }

    // Match amount (1 VND tolerance)
    const expectedAmount = new Decimal(va.expectedAmount ?? 0);
    if (!expectedAmount.isZero() && expectedAmount.sub(amount).abs().gt(1)) {
      throw new Error('Amount mismatch');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updatedVa = await tx.virtualAccount.update({
        where: { id: va.id },
        data: { status: 'completed', actualAmount: amount, transactionRef },
      });

      const user = await tx.user.update({
        where: { id: va.userId },
        data: {
          balance:      { increment: amount },
          totalDeposit: { increment: amount },
        },
      });

      const transaction = await tx.lkvipTransaction.create({
        data: {
          userId: va.userId,
          type: 'deposit',
          amount,
          balanceBefore: new Decimal(user.balance).sub(amount),
          balanceAfter: new Decimal(user.balance),
          referenceType: 'va',
          referenceId: vaNumber,
          description: `Nạp tiền tự động qua VA ${vaNumber}`,
          status: 'completed',
        },
      });

      return { va: updatedVa, user, transaction };
    });

    // Run AML (outside transaction)
    const amlService = new AmlService(this.prisma);
    await amlService.checkDeposit(va.userId, amount);

    return result;
  }
}

export default VirtualAccountService;
