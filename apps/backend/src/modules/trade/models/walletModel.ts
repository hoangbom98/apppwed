import { getPrismaClient } from '../../../config/databases';

const prisma = getPrismaClient('trade');

export const WalletModel = {
  async findUnique(userId: string) {
    return prisma.wallet.findUnique({ where: { userId } });
  },
  async update(userId: string, data: any) {
    return prisma.wallet.update({ where: { userId }, data });
  },
  async create(data: any) {
    return prisma.wallet.create({ data });
  }
};
