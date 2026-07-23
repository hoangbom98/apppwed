// @ts-nocheck
/* eslint-disable */

/**
 * BaseService - Foundation for all entity-based services.
 * Implements standard CRUD operations for any Prisma model.
 */
import { PrismaClient } from '@prisma/client';

export abstract class BaseService<T> {
  protected prisma: PrismaClient;
  protected model: any;

  constructor(prisma: PrismaClient, modelName: string) {
    this.prisma = prisma;
    this.model = (prisma as any)[modelName];
  }

  async findMany(args: any) {
    return this.model.findMany(args);
  }

  async findUnique(id: string | number) {
    return this.model.findUnique({ where: { id } });
  }

  async create(data: any) {
    return this.model.create({ data });
  }

  async update(id: string | number, data: any) {
    return this.model.update({ where: { id }, data });
  }

  async delete(id: string | number) {
    return this.model.delete({ where: { id } });
  }

  async count(args: any) {
    return this.model.count(args);
  }
}
