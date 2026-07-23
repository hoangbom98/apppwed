// @ts-nocheck
/* eslint-disable */

/**
 * PromotionService — Handles promotions/campaign management within the Admin domain.
 */
import { BaseService } from '../../../shared/base/BaseService';
import { PrismaClient } from '@prisma/client';

export class PromotionService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'promotion');
  }

  async getActivePromotions() {
    return this.prisma.promotion.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  }
}
