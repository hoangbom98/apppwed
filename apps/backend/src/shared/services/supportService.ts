// @ts-nocheck
/**
 * SupportService — support room + message CRUD using req.prisma pattern.
 * All methods receive a prisma client instance as the first argument.
 *
 * Schema notes (admin/schema.prisma):
 *   SupportParticipant.userId  — Int
 *   SupportMessage.senderId    — Int
 *   SupportTicket.userId       — Int
 */

/**
 * Get or create a private 1-on-1 room between a user and an optional agent.
 * Returns the existing room if the user already has a private room.
 */
const getOrCreateRoom = async (prisma, userId, agentId = null) => {
  const uid = parseInt(userId, 10);

  const existing = await prisma.supportRoom.findFirst({
    where: {
      type: 'private',
      participants: { some: { userId: uid } },
    },
    include: { participants: true },
  });

  if (existing) return existing;

  return prisma.supportRoom.create({
    data: {
      type: 'private',
      participants: {
        create: [
          { userId: uid, isAgent: false },
          ...(agentId ? [{ userId: parseInt(agentId, 10), isAgent: true }] : []),
        ],
      },
    },
    include: { participants: true },
  });
};

/**
 * List all rooms where the user is a participant.
 * isAgent flag is accepted but currently unused — filtering is by userId only.
 */
const getRooms = async (prisma, userId, _isAgent = false) => {
  return prisma.supportRoom.findMany({
    where: {
      participants: { some: { userId: parseInt(userId, 10) } },
    },
    include: {
      participants: { select: { userId: true, isAgent: true, lastReadAt: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  });
};

/**
 * Get a single room by ID with its participants.
 */
const getRoomById = async (prisma, roomId) => {
  const room = await prisma.supportRoom.findUnique({
    where: { id: roomId },
    include: { participants: true },
  });
  if (!room) throw new Error('Room not found');
  return room;
};

/**
 * Create a SupportMessage and update room.lastMessage/lastMessageAt.
 */
const sendMessage = async (
  prisma,
  roomId,
  senderId,
  { type = 'text', content, metadata = null, origLang = null } = {}
) => {
  const [message] = await Promise.all([
    prisma.supportMessage.create({
      data: {
        roomId,
        senderId: parseInt(senderId, 10),
        type,
        content,
        metadata,
        origLang,
      },
    }),
    prisma.supportRoom.update({
      where: { id: roomId },
      data: {
        lastMessage: content.slice(0, 100),
        lastMessageAt: new Date(),
      },
    }),
  ]);
  return message;
};

/**
 * Paginated messages ordered by createdAt DESC.
 */
const getMessages = async (prisma, roomId, { page = 1, limit = 20 } = {}) => {
  const skip = (page - 1) * Number(limit);
  const take = Number(limit);

  const [messages, total] = await Promise.all([
    prisma.supportMessage.findMany({
      where: { roomId, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      skip,
      take,
    }),
    prisma.supportMessage.count({ where: { roomId, isDeleted: false } }),
  ]);

  return { messages, total, page: Number(page), pages: Math.ceil(total / take) };
};

/**
 * Mark all unread messages in a room (sent by others) as read,
 * and update the participant's lastReadAt timestamp.
 */
const markRead = async (prisma, roomId, userId) => {
  const uid = parseInt(userId, 10);
  await Promise.all([
    prisma.supportMessage.updateMany({
      where: { roomId, isRead: false, senderId: { not: uid } },
      data: { isRead: true, readAt: new Date() },
    }),
    prisma.supportParticipant.updateMany({
      where: { roomId, userId: uid },
      data: { lastReadAt: new Date() },
    }),
  ]);
};

/**
 * Count total unread messages for a user across all their rooms.
 */
const getUnreadCount = async (prisma, userId) => {
  const uid = parseInt(userId, 10);

  // Fetch all rooms the user participates in
  const participations = await prisma.supportParticipant.findMany({
    where: { userId: uid },
    select: { roomId: true, lastReadAt: true },
  });

  if (!participations.length) return 0;

  const counts = await Promise.all(
    participations.map(({ roomId, lastReadAt }) =>
      prisma.supportMessage.count({
        where: {
          roomId,
          isRead: false,
          isDeleted: false,
          senderId: { not: uid },
          createdAt: { gt: lastReadAt },
        },
      })
    )
  );

  return counts.reduce((sum, n) => sum + n, 0);
};

module.exports = { getOrCreateRoom, getRooms, getRoomById, sendMessage, getMessages, markRead, getUnreadCount };
