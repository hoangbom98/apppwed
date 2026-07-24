/* eslint-disable */

import { PromotionService } from '../../../../../modules/admin/services/promotionService';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('../../../__mocks__/databases', () => ({
  getPrismaClient: jest.fn(),
}));
jest.mock('../../../__mocks__/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('PromotionService', () => {
  let promotionService: PromotionService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      promotion: {
        findMany: jest.fn(),
      },
    };
    promotionService = new PromotionService(mockPrisma as unknown as PrismaClient);
  });

  it('should call getActivePromotions (Custom Service method)', async () => {
    const mockPromos = [{ id: '1', name: 'Summer Sale', status: 'ACTIVE' }];
    mockPrisma.promotion.findMany.mockResolvedValue(mockPromos);
    
    const promos = await promotionService.getActivePromotions();
    
    expect(promos).toEqual(mockPromos);
    expect(mockPrisma.promotion.findMany).toHaveBeenCalledWith({
      where: { status: 'ACTIVE' },
      orderBy: { createdAt: 'desc' }
    });
  });
});
