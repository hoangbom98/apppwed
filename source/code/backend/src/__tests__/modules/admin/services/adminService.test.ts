/* eslint-disable */

import { AdminService } from '../../../../modules/admin/services/adminService';
import { PrismaClient } from '@prisma/client';

// Mock dependencies
jest.mock('../../../../config/databases', () => ({
  getPrismaClient: jest.fn(),
}));
jest.mock('../../../../shared/services/logger', () => ({
  info: jest.fn(),
  error: jest.fn(),
}));

describe('AdminService', () => {
  let adminService: AdminService;
  let mockPrisma: any;

  beforeEach(() => {
    // Create a mock Prisma client
    mockPrisma = {
      adminUser: {
        count: jest.fn(),
        findMany: jest.fn(),
      },
    };
    adminService = new AdminService(mockPrisma as unknown as PrismaClient);
  });

  it('should call count on adminUser model (BaseService functionality)', async () => {
    mockPrisma.adminUser.count.mockResolvedValue(5);
    const count = await adminService.count({ where: {} });
    expect(count).toBe(5);
    expect(mockPrisma.adminUser.count).toHaveBeenCalledWith({ where: {} });
  });

  it('should call findMany on adminUser model (BaseService functionality)', async () => {
    const mockUsers = [{ id: '1', email: 'test@test.com' }];
    mockPrisma.adminUser.findMany.mockResolvedValue(mockUsers);
    const users = await adminService.findMany({ where: {} });
    expect(users).toEqual(mockUsers);
    expect(mockPrisma.adminUser.findMany).toHaveBeenCalledWith({ where: {} });
  });
});
