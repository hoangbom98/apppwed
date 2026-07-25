/**
 * LotterySettlementService.ts
 * Xử lý kết quả xổ số: tính win/lose cho từng bet, credit người thắng.
 *
 * Nâng cấp so với v1:
 *  - Đọc odds từ bảng OddsSetting (theo typeId của draw) thay vì hardcode * 2.
 *  - Dùng StrategyFactory để kiểm tra thắng — mở rộng được qua factory.
 *  - Phát sự kiện `draw:settled` trên event-bus sau khi hoàn thành (loose coupling).
 *  - Idempotent: skip bets đã settled (status ≠ PENDING).
 *
 * LƯU Ý: Trong production nên gọi thông qua `enqueueLotterySettlement(drawId)`
 * trong lottery-settlement.worker.ts thay vì gọi trực tiếp, vì worker đó đã có:
 *   - Atomic Prisma $transaction (settle + credit trong 1 commit)
 *   - BullMQ retry khi DB lỗi nhất thời
 *   - Socket.IO realtime push sau settle
 * Service này được giữ để dùng trong unit test và inline fallback.
 */
import { StrategyFactory } from '../../../../core/strategies/strategy.factory';
import { eventBus }        from '../../../../core/events/event-bus';
import { logger }          from '../../../../shared/logger';

export class LotterySettlementService {
  constructor(private readonly prisma: any) {}

  async settle(drawId: string): Promise<{ settled: number; winners: number }> {
    const draw = await this.prisma.lotteryDraw.findUnique({
      where:   { id: drawId },
      include: { bets: { where: { status: 'PENDING' } } },
    });

    if (!draw) {
      logger.warn(`[LotterySettlement] Draw ${drawId} not found`);
      return { settled: 0, winners: 0 };
    }
    if (!draw.resultOfficial) {
      logger.warn(`[LotterySettlement] Draw ${drawId} has no result`);
      return { settled: 0, winners: 0 };
    }
    if (draw.bets.length === 0) {
      logger.info(`[LotterySettlement] Draw ${drawId} — no pending bets`);
      return { settled: 0, winners: 0 };
    }

    // Resolve odds from DB (fallback to 2× if not configured)
    const oddsSetting = await this.prisma.oddsSetting
      .findFirst({ where: { typeId: draw.typeId } })
      .catch(() => null);
    const multiplier = Number(oddsSetting?.rate ?? 2);

    const resultNumbers = draw.resultOfficial.split(',').map(Number);

    let settled = 0;
    let winners = 0;

    for (const bet of draw.bets) {
      try {
        const betNumbers = String(bet.betChoice)
          .split(',')
          .map((s: string) => parseInt(s.trim(), 10))
          .filter((n: number) => !isNaN(n));

        const strategy = StrategyFactory.get(bet.betType);
        const isWin    = strategy.check(betNumbers, resultNumbers);
        const payout   = isWin ? Number(bet.amount) * multiplier : 0;

        await this.prisma.$transaction([
          this.prisma.lotteryBet.update({
            where: { id: bet.id },
            data:  { status: isWin ? 'WIN' : 'LOSE', payout, settledAt: new Date() },
          }),
          ...(isWin
            ? [
                this.prisma.user.update({
                  where: { id: bet.userId },
                  data:  { balance: { increment: payout } },
                }),
                this.prisma.transaction.create({
                  data: {
                    userId:        bet.userId,
                    type:          'lottery_win',
                    amount:        payout,
                    referenceId:   bet.id,
                    referenceType: 'lottery_bet',
                    note:          `Thắng cược xổ số kỳ ${draw.period ?? drawId}`,
                  },
                }),
              ]
            : []),
        ]);

        settled++;
        if (isWin) winners++;
      } catch (err: any) {
        logger.error(`[LotterySettlement] Failed bet ${bet.id}: ${err.message}`);
      }
    }

    // Mark draw as settled
    await this.prisma.lotteryDraw.update({
      where: { id: drawId },
      data:  { status: 'SETTLED', settledAt: new Date() },
    }).catch(() => {/* non-fatal — draw may lack settledAt column */});

    // Emit event for downstream listeners (agent commission, stats, etc.)
    eventBus.emit('draw:settled', {
      drawId,
      period:  draw.period,
      typeId:  draw.typeId,
      settled,
      winners,
    });

    logger.info(
      `[LotterySettlement] draw=${drawId} settled=${settled} winners=${winners} odds=${multiplier}x`
    );

    return { settled, winners };
  }
}
