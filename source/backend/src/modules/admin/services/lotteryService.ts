// @ts-nocheck
/* eslint-disable */

/**
 * LotteryService — Handles lottery draw management within the Admin domain.
 */
import { BaseService } from '../../../shared/base/BaseService';
import { PrismaClient } from '@prisma/client';

export class LotteryService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'lotteryDraw'); // Assuming model name is lotteryDraw
  }
}
