/**
 * SupportChatService — support room + message CRUD using req.prisma
 * All methods receive a prisma client instance injected by projectResolver.
 */

/**
 * Get or create a 1-on-1 support room between user and agent.
 */
const getOrCreateRoom = async (prisma, userId, agentId = null) => {
  // Try to find existing private room where both user is a participant
  const existing = await prisma.supportRoom.findFirst({
    where: {
      type: 'private',
      participants: {
        some: { userId: String(userId) },
      },
    },
    include: { participants: true },
  });

  if (existing) return existing;

  // Create a new support room
  return prisma.supportRoom.create({
    data: {
      type: 'private',
      participants: {
        create: [
          { userId: String(userId), isAgent: false },
          ...(agentId ? [{ userId: String(agentId), isAgent: true }] : []),
        ],
      },
    },
    include: { participants: true },
  });
};

/**
 * List rooms for a user (with last message preview).
 */
const listRooms = async (prisma, userId) => {
  return prisma.supportRoom.findMany({
    where: {
      participants: { some: { userId: String(userId) } },
    },
    include: {
      participants: { select: { userId: true, isAgent: true } },
    },
    orderBy: { lastMessageAt: 'desc' },
    take: 50,
  });
};

/**
 * Get messages for a room (paginated, oldest first).
 */
const getMessages = async (prisma, roomId, page = 1, limit = 50) => {
  const skip = (page - 1) * limit;
  const [messages, total] = await Promise.all([
    prisma.supportMessage.findMany({
      where: { roomId, isDeleted: false },
      orderBy: { createdAt: 'asc' },
      skip,
      take: limit,
    }),
    prisma.supportMessage.count({ where: { roomId, isDeleted: false } }),
  ]);
  return { messages, total, page, pages: Math.ceil(total / limit) };
};

/**
 * Send a message to a room.
 */
const sendMessage = async (prisma, roomId, senderId, { content, type = 'text', metadata = null }) => {
  const [message] = await Promise.all([
    prisma.supportMessage.create({
      data: {
        roomId,
        senderId: String(senderId),
        content,
        type,
        metadata,
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
 * Mark messages in a room as read for a user.
 */
const markRead = async (prisma, roomId, userId) => {
  await Promise.all([
    prisma.supportMessage.updateMany({
      where: { roomId, isRead: false, senderId: { not: String(userId) } },
      data: { isRead: true, readAt: new Date() },
    }),
    prisma.supportParticipant.updateMany({
      where: { roomId, userId: String(userId) },
      data: { lastReadAt: new Date() },
    }),
  ]);
};

/**
 * Delete (soft) a message.
 */
const deleteMessage = async (prisma, messageId, userId) => {
  const msg = await prisma.supportMessage.findUnique({ where: { id: messageId } });
  if (!msg) throw new Error('Message not found');
  if (msg.senderId !== String(userId)) throw new Error('Not authorized');
  return prisma.supportMessage.update({
    where: { id: messageId },
    data: { isDeleted: true },
  });
};

module.exports = { getOrCreateRoom, listRooms, getMessages, sendMessage, markRead, deleteMessage };
