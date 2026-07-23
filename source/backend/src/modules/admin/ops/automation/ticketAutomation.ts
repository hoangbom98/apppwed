// @ts-nocheck
'use strict';
/**
 * TicketAutomation — keyword-based ticket classifier + auto-reply engine.
 *
 * If a matching knowledge-base entry is found, it auto-replies and optionally
 * closes the ticket. Otherwise it assigns the ticket to an agent.
 */
const logger = require('../../../../shared/services/logger');

const KEYWORD_MAP = {
  withdraw:  ['rút tiền', 'rút', 'withdraw', 'withdrawal', 'chưa nhận tiền'],
  deposit:   ['nạp tiền', 'nạp', 'deposit', 'add money', 'không nạp được'],
  game:      ['game', 'lag', 'lỗi', 'không chơi được', 'gameplay', 'kết nối'],
  account:   ['đăng nhập', 'tài khoản', 'mật khẩu', 'quên', 'login', 'register'],
  kyc:       ['xác minh', 'cccd', 'cmnd', 'kyc', 'verify'],
  bonus:     ['khuyến mãi', 'bonus', 'khuyến mại', 'promotion', 'free spin'],
};

// Default auto-reply templates
const AUTO_REPLIES = {
  withdraw:  'Giao dịch rút tiền của bạn đang được xử lý trong vòng 1–24 giờ làm việc. Nếu sau 24 giờ bạn chưa nhận được, vui lòng cung cấp mã giao dịch để chúng tôi hỗ trợ.',
  deposit:   'Vui lòng kiểm tra thông tin nạp tiền (số tài khoản, nội dung chuyển khoản). Hệ thống sẽ cộng điểm trong vòng 5 phút sau khi xác nhận giao dịch.',
  game:      'Vui lòng thử tải lại trang, xóa cache hoặc dùng trình duyệt khác. Nếu vấn đề vẫn tiếp diễn, đội kỹ thuật sẽ hỗ trợ bạn trong thời gian sớm nhất.',
  account:   'Bạn có thể reset mật khẩu tại trang đăng nhập. Nếu không nhận được email reset, vui lòng liên hệ bộ phận hỗ trợ.',
  kyc:       'Hồ sơ KYC của bạn đang được xem xét. Quá trình xét duyệt mất khoảng 1–2 ngày làm việc.',
  bonus:     'Để nhận khuyến mãi, bạn vui lòng đọc điều kiện áp dụng trên trang Khuyến mãi. Nếu bạn chưa nhận được ưu đãi, hãy liên hệ CSKH.',
  general:   'Cảm ơn bạn đã liên hệ. Đội ngũ CSKH của chúng tôi sẽ phản hồi trong vòng 2 giờ làm việc.',
};

class TicketAutomation {
  constructor(adminPrisma) {
    this.admin = adminPrisma;
  }

  // ── Classify ticket content ───────────────────────────────────────────────
  classify(content) {
    const lower  = (content || '').toLowerCase();
    let best     = 'general';
    let bestScore = 0;

    for (const [category, keywords] of Object.entries(KEYWORD_MAP)) {
      const score = keywords.filter(w => lower.includes(w)).length;
      if (score > bestScore) {
        bestScore = score;
        best      = category;
      }
    }

    return best;
  }

  // ── Process a ticket: classify + auto-reply ───────────────────────────────
  async process(ticketId) {
    let ticket;
    try {
      ticket = await this.admin.supportTicket.findUnique({
        where:   { id: parseInt(ticketId, 10) },
        include: { replies: true },
      });
    } catch (err) {
      logger.warn(`[TicketAuto] findUnique failed: ${err.message}`);
      return null;
    }

    if (!ticket) return null;
    // Only auto-process new open tickets without existing auto-reply
    if (ticket.status !== 'open') return null;

    const alreadyAutoReplied = ticket.replies.some(r => r.isAuto);
    if (alreadyAutoReplied) return null;

    const category = this.classify(ticket.subject + ' ' + ticket.description);

    // Check knowledge base first
    let reply = AUTO_REPLIES[category] || AUTO_REPLIES.general;
    try {
      const kb = await this.admin.opsKnowledgeBase.findFirst({
        where:   { category, status: 'active' },
        orderBy: { priority: 'desc' },
      });
      if (kb) reply = kb.content;
    } catch { /* knowledge base table optional */ }

    // Create auto-reply
    try {
      await this.admin.supportTicketReply.create({
        data: {
          ticketId: ticket.id,
          senderId: 0,          // system sender
          content:  reply,
          isAuto:   true,
        },
      });

      // Mark ticket as auto-replied
      await this.admin.supportTicket.update({
        where: { id: ticket.id },
        data:  { category, status: 'in_progress' },
      });
    } catch (err) {
      logger.warn(`[TicketAuto] reply/update failed: ${err.message}`);
    }

    logger.info(`[TicketAuto] ticket #${ticketId} classified=${category}, auto-replied`);
    return { ticketId: ticket.id, category, autoReplied: true };
  }

  // ── Process all new open tickets ─────────────────────────────────────────
  async processAll() {
    let tickets = [];
    try {
      tickets = await this.admin.supportTicket.findMany({
        where:   { status: 'open' },
        include: { replies: { select: { isAuto: true } } },
        take:    200,
      });
    } catch (err) {
      logger.error(`[TicketAuto] processAll: ${err.message}`);
      return 0;
    }

    const pending = tickets.filter(t => !t.replies.some(r => r.isAuto));
    let processed = 0;
    for (const t of pending) {
      const result = await this.process(t.id);
      if (result) processed++;
    }

    logger.info(`[TicketAuto] processAll: ${processed}/${pending.length} auto-processed`);
    return processed;
  }
}

module.exports = TicketAutomation;
