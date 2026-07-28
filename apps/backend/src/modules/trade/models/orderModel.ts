import { getPrismaClient } from '../../../config/databases';

const prisma = getPrismaClient('trade');

export const OrderModel = {
  async findMany(where: any, orderBy: any = { createdAt: 'desc' }) {
    return prisma.order.findMany({ where, orderBy });
  },
  async findUnique(id: string) {
    return prisma.order.findUnique({ where: { id } });
  },
  async create(data: any) {
    return prisma.order.create({ data });
  },
  async update(id: string, data: any) {
    return prisma.order.update({ where: { id }, data });
  },
  async count(where: any) {
    return prisma.order.count({ where });
  }
};
