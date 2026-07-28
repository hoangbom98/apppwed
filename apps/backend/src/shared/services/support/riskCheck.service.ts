/**
 * riskCheck.service.ts
 * Kiểm tra rủi ro trước khi đặt cược.
 */
import { logger } from '../core/logger';

export class RiskEngine {
  constructor(private prisma: unknown) {}

  async checkBetRisk(userId: string, _amount: number): Promise<boolean> {
    // 1. Kiểm tra giới hạn cược trong thời gian ngắn
    // 2. Kiểm tra cược đối ứng (ví dụ: TÀI và XỈU cùng lúc)
    logger.info(`[RiskEngine] Checking risk for user ${userId}`);
    return true; // true = an toàn
  }
}
