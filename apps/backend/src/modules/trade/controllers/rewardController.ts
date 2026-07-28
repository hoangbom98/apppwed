// @ts-nocheck
'use strict';
/**
 * rewardController — daily sign-in + news reading rewards
 *
 * POST /trade/reward/signin      — daily check-in
 * POST /trade/reward/news/:id    — reward for reading a news article
 * GET  /trade/reward/signin/status — has user signed in today?
 */
const { success, error } = require('../../../shared/utils/network/response');

function todayStr(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

// ── POST /trade/reward/signin ─────────────────────────────────────────────────
exports.signin = async (req, res) => {
  try {
    const date = todayStr();

    // Check already signed in today
    const existing = await req.prisma.userSignin.findUnique({
      where: { userId_date: { userId: req.user.id, date } },
    });
    if (existing) return error(res, 'Bạn đã điểm danh hôm nay rồi', 400);

    // Get reward amount from SystemConfig
    const cfg = await req.prisma.systemConfig.findUnique({ where: { key: 'signin_reward' } });
    const rewardAmt = parseFloat(cfg?.value || '5');

    const result = await req.prisma.$transaction(async (tx: any) => {
      const record = await tx.userSignin.create({
        data: { userId: req.user.id, date, reward: rewardAmt },
      });
      const wallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
      const newBal = (wallet ? parseFloat(wallet.balance) : 0) + rewardAmt;
      await tx.wallet.upsert({
        where:  { userId: req.user.id },
        update: { balance: { increment: rewardAmt } },
        create: { userId: req.user.id, balance: rewardAmt, frozen: 0 },
      });
      await tx.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'bonus',
          amount:        rewardAmt,
          balanceAfter:  newBal,
          referenceId:   record.id,
          referenceType: 'user_signin',
          note:          `Thưởng điểm danh ngày ${date}`,
        },
      });
      return record;
    });

    return success(res, { date, reward: rewardAmt }, `Điểm danh thành công! Nhận ${rewardAmt} USD`);
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── GET /trade/reward/signin/status ──────────────────────────────────────────
exports.signinStatus = async (req, res) => {
  try {
    const date     = todayStr();
    const existing = await req.prisma.userSignin.findUnique({
      where: { userId_date: { userId: req.user.id, date } },
    });
    // Get last 30 days history
    const history = await req.prisma.userSignin.findMany({
      where:   { userId: req.user.id },
      orderBy: { date: 'desc' },
      take:    30,
    });
    return success(res, { signedInToday: !!existing, history });
  } catch (e: any) { return error(res, e.message, 500); }
};

// ── POST /trade/reward/news/:articleId ────────────────────────────────────────
exports.newsReward = async (req, res) => {
  try {
    const { articleId } = req.params;

    const article = await req.prisma.newsArticle.findUnique({ where: { id: articleId } });
    if (!article || article.status !== 'published') return error(res, 'Bài viết không tồn tại', 400);
    if (parseFloat(article.readReward) <= 0) return error(res, 'Bài viết này không có thưởng', 400);

    // Check already received reward for this article
    const existing = await req.prisma.newsViewLog.findUnique({
      where: { articleId_userId: { articleId, userId: req.user.id } },
    });
    if (existing) return error(res, 'Bạn đã nhận thưởng bài viết này rồi', 400);

    // Check daily news reward limit
    const cfg = await req.prisma.systemConfig.findUnique({ where: { key: 'news_reward_limit' } });
    const dailyLimit = parseInt(cfg?.value || '3');
    const todayLogs = await req.prisma.newsViewLog.count({
      where: { userId: req.user.id, viewedAt: { gte: new Date(todayStr()) } },
    });
    if (todayLogs >= dailyLimit) return error(res, `Giới hạn ${dailyLimit} bài viết/ngày`, 400);

    const rewardAmt = parseFloat(article.readReward);

    await req.prisma.$transaction(async (tx: any) => {
      await tx.newsViewLog.create({ data: { articleId, userId: req.user.id, reward: rewardAmt } });
      await tx.newsArticle.update({ where: { id: articleId }, data: { views: { increment: 1 } } });
      const wallet = await tx.wallet.findUnique({ where: { userId: req.user.id } });
      const newBal = (wallet ? parseFloat(wallet.balance) : 0) + rewardAmt;
      await tx.wallet.upsert({
        where:  { userId: req.user.id },
        update: { balance: { increment: rewardAmt } },
        create: { userId: req.user.id, balance: rewardAmt, frozen: 0 },
      });
      await tx.transaction.create({
        data: {
          userId:        req.user.id,
          type:          'bonus',
          amount:        rewardAmt,
          balanceAfter:  newBal,
          referenceId:   articleId,
          referenceType: 'news_article',
          note:          `Thưởng đọc tin: ${article.title}`,
        },
      });
    });

    return success(res, { reward: rewardAmt }, `Nhận thưởng ${rewardAmt} USD`);
  } catch (e: any) { return error(res, e.message, 500); }
};
