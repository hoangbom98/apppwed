import { Worker, Queue } from 'bullmq';
import { redis } from '../../utils/redis';
import { logger } from '../../shared/logger';

const { getPrismaClient } = require('../../config/databases');
const aiService = require('../../shared/services/aiService');

const prisma = getPrismaClient('admin');

// Queue xử lý ticket/tin nhắn
export const ticketQueue = new Queue('ticket-processing', {
  connection: redis,
});

export const ticketWorker = new Worker(
  'ticket-processing',
  async (job) => {
    const { ticketId } = job.data;

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!ticket || ticket.status === 'resolved') return;

    const lastMessage = ticket.messages[0]?.content || '';

    // 1. Phân loại chủ đề bằng keyword
    const category = await classifyTopic(ticket.subject, lastMessage);

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { category },
    });

    // 2. Nếu là câu hỏi phổ biến, tự động phản hồi bằng AI
    const simpleCategories = ['deposit_guide', 'withdraw_guide', 'game_howto', 'bonus_info'];

    if (simpleCategories.includes(category)) {
      const response = await aiService.chat([{ role: 'user', content: lastMessage }]);

      await prisma.ticketMessage.create({
        data: {
          ticketId,
          sender: 'system',
          content: response,
        },
      });

      await prisma.ticket.update({
        where: { id: ticketId },
        data: { status: 'answered' },
      });

      logger.info(`Ticket ${ticketId} auto-answered by AI`);
    } else {
      // 3. Chuyển cho support human
      await prisma.ticket.update({
        where: { id: ticketId },
        data: { priority: 'high', assignedTo: 'support_team' },
      });
      logger.info(`Ticket ${ticketId} routed to human support`);
    }
  },
  { connection: redis, concurrency: 5 }
);

async function classifyTopic(subject: string, content: string): Promise<string> {
  const text = (subject + ' ' + content).toLowerCase();
  if (text.includes('nạp') || text.includes('deposit'))   return 'deposit_guide';
  if (text.includes('rút') || text.includes('withdraw'))  return 'withdraw_guide';
  if (text.includes('chơi') || text.includes('game'))     return 'game_howto';
  return 'other';
}
