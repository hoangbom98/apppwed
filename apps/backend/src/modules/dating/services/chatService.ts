// @ts-nocheck
'use strict';
/**
 * dating/services/chatService.js
 * Model names match prisma/dating/schema.prisma:
 *   ChatRoom (chat_rooms), ChatRoomMember (chat_room_members), Message (messages)
 */
const BaseService = require('../../../shared/services/BaseService');

class ChatService extends BaseService {
  constructor(prisma) {
    super(prisma, 'message');
  }

  /** Return all rooms the user belongs to, with latest message preview */
  async getUserRooms(userId) {
    return this.prisma.chatRoom.findMany({
      where:   { members: { some: { userId } } },
      include: {
        members: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
        },
        messages: { orderBy: { createdAt: 'desc' }, take: 1 },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  /** Return paginated messages for a room (user must be a member) */
  async getRoomMessages(roomId, userId, page = 1, limit = 50) {
    const member = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) throw new Error('Không có quyền truy cập phòng chat này');

    return this.prisma.message.findMany({
      where:   { roomId, isDeleted: false },
      skip:    (page - 1) * parseInt(limit),
      take:    parseInt(limit),
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: { id: true, username: true, avatar: true } } },
    });
  }

  /** Persist a chat message and update room's updatedAt */
  async sendMessage(roomId, senderId, content, type = 'text', fileUrl = null) {
    // Verify membership
    const member = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId: senderId } },
    });
    if (!member) throw new Error('Không có quyền gửi tin vào phòng này');

    const message = await this.prisma.message.create({
      data:    { roomId, senderId, content, type, fileUrl },
      include: { sender: { select: { id: true, username: true, avatar: true } } },
    });

    // Update room last activity
    await this.prisma.chatRoom.update({
      where: { id: roomId },
      data:  { updatedAt: new Date() },
    });

    return message;
  }

  /** Mark a message as deleted (soft delete) */
  async recallMessage(messageId, userId) {
    const msg = await this.prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.senderId !== userId) throw new Error('Không thể thu hồi tin nhắn này');
    return this.prisma.message.update({
      where: { id: messageId },
      data:  { isDeleted: true },
    });
  }

  /** Mark all messages in a room as read for a user */
  async markRead(roomId, userId) {
    const member = await this.prisma.chatRoomMember.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!member) return;
    await this.prisma.chatRoomMember.update({
      where: { roomId_userId: { roomId, userId } },
      data:  { lastReadAt: new Date() },
    });
  }
}

module.exports = ChatService;
