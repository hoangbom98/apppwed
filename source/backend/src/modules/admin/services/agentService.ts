// @ts-nocheck
/* eslint-disable */

/**
 * AgentService — Handles agent management within the Admin domain.
 */
import { BaseService } from '../../../shared/base/BaseService';
import { PrismaClient } from '@prisma/client';

export class AgentService extends BaseService<any> {
  constructor(prisma: PrismaClient) {
    super(prisma, 'agent');
  }
}
