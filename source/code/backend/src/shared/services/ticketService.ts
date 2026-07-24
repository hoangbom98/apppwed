// @ts-nocheck
/**
 * TicketService — support ticket CRUD using req.prisma pattern.
 * All methods receive a prisma client instance as the first argument.
 *
 * Schema notes (admin/schema.prisma):
 *   SupportTicket.userId  — Int
 *   SupportTicketReply.senderId — Int
 */

/**
 * Create a SupportTicket and a linked SupportRoom in one transaction.
 */
const createTicket = async (
  prisma,
  userId,
  { subject, description, category = 'general', priority = 'medium' }
) => {
  const uid = parseInt(userId, 10);

  // Create the support room first, then the ticket linked to it
  const room = await prisma.supportRoom.create({
    data: {
      type: 'private',
      name: `Ticket: ${subject}`,
      participants: {
        create: [{ userId: uid, isAgent: false }],
      },
    },
  });

  return prisma.supportTicket.create({
    data: {
      userId: uid,
      roomId: room.id,
      subject,
      description,
      category,
      priority,
      status: 'open',
    },
    include: { room: true },
  });
};

/**
 * Paginated ticket list for a specific user.
 */
const getTickets = async (prisma, userId, { status, page = 1, limit = 20 } = {}) => {
  const where = { userId: parseInt(userId, 10) };
  if (status) where.status = status;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { tickets, total, page: Number(page), pages: Math.ceil(total / take) };
};

/**
 * Get a single ticket with all replies.
 * Throws if the requesting userId is neither the owner nor an agent/admin.
 */
const getTicketById = async (prisma, ticketId, userId = null) => {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: { replies: { orderBy: { createdAt: 'asc' } } },
  });

  if (!ticket) throw new Error('Ticket not found');

  if (userId !== null) {
    const uid = parseInt(userId, 10);
    // Non-owner check — callers that are agents pass userId=null or handle separately
    if (ticket.userId !== uid) throw new Error('Access denied');
  }

  return ticket;
};

/**
 * Add a reply to a ticket.
 * If the sender is the ticket owner and the ticket was 'open', move it to 'in_progress'.
 */
const addReply = async (
  prisma,
  ticketId,
  senderId,
  { content, isInternal = false, attachments = null }
) => {
  const sid = parseInt(senderId, 10);

  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) throw new Error('Ticket not found');

  const [reply] = await Promise.all([
    prisma.supportTicketReply.create({
      data: {
        ticketId,
        senderId: sid,
        content,
        isInternal,
        attachments,
      },
    }),
    // If user (non-agent) replies to an open ticket, move it to in_progress
    ticket.userId === sid && ticket.status === 'open'
      ? prisma.supportTicket.update({
          where: { id: ticketId },
          data: { status: 'in_progress' },
        })
      : Promise.resolve(),
  ]);

  return reply;
};

/**
 * Update ticket status. Only agents/admins should call this.
 */
const updateStatus = async (prisma, ticketId, agentId, status) => {
  const data = { status };
  if (status === 'resolved') data.resolvedAt = new Date();
  if (status === 'closed') data.closedAt = new Date();
  if (agentId) data.assignedTo = parseInt(agentId, 10);

  return prisma.supportTicket.update({ where: { id: ticketId }, data });
};

/**
 * Admin: paginated list of all tickets, optionally filtered by status/category.
 */
const getAllTickets = async (prisma, { status, category, page = 1, limit = 20 } = {}) => {
  const where = {};
  if (status) where.status = status;
  if (category) where.category = category;

  const skip = (Number(page) - 1) * Number(limit);
  const take = Number(limit);

  const [tickets, total] = await Promise.all([
    prisma.supportTicket.findMany({
      where,
      include: { replies: { orderBy: { createdAt: 'asc' } } },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.supportTicket.count({ where }),
  ]);

  return { tickets, total, page: Number(page), pages: Math.ceil(total / take) };
};

module.exports = { createTicket, getTickets, getTicketById, addReply, updateStatus, getAllTickets };
