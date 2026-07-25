/**
 * lottery-collector.service.ts
 * Tự động thu thập kết quả xổ số từ các nguồn API bên thứ 3.
 */
import { logger } from '../../../../shared/logger';

export class LotteryCollector {
  constructor(private prisma: any) {}

  async collect(typeCode: string) {
    logger.info(`[LotteryCollector] Collecting results for ${typeCode}`);
    // API call to external provider (e.g. BoYue or similar)
    // Save result to DB
  }
}
