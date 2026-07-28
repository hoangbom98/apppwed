'use strict';
/**
 * imService.ts — Instant Messaging Service
 *
 * Patterns:
 *   - Private messages (1-1)
 *   - Group messages
 *   - System notices
 *   - Conversations list + unread count
 *   - Friends: add/block/delete/remark
 *   - Groups: create/invite/kick/admin/quit
 *   - Real-time push via Socket.IO
 *   - Online presence
 *   - Message recall (within 2 minutes)
 *
 * DB Tables (game_db):
 *   im_messages, im_conversations, im_groups, im_group_members,
 *   im_friends, im_friend_requests
 */

const logger = require('../logger');

const MSG_TEXT   = 1;
const MSG_IMAGE  = 2;
const MSG_VOICE  = 3;
const MSG_SYSTEM = 4;

const CONV_PRIVATE = 1;
const CONV_GROUP   = 2;
const CONV_SYSTEM  = 3;

const RECALL_WINDOW_SECONDS = 120;

type PrismaLike = Record<string, any>;
type IoLike     = { to: (room: string) => { emit: (ev: string, data: unknown) => void } } | null;

class IMService {
  private prisma: PrismaLike;
  private io:     IoLike;

  constructor(prisma: PrismaLike, io: IoLike = null) {
    this.prisma = prisma;
    this.io     = io;
  }

  // ── Push helpers ────────────────────────────────────────────────────────────

  _pushToUser(userId: string | number, type: string, data: unknown): void {
    if (!this.io) return;
    try {
      this.io.to(`user_${userId}`).emit(`im:${type}`, data);
    } catch (e: unknown) {
      logger.warn(`[IM] push failed userId=${userId}: ${e instanceof Error ? e.message : e}`);
    }
  }

  async _pushPresenceToFriends(userId: string | number, isOnline: boolean): Promise<void> {
    try {
      const friends: Array<{ friend_id: string }> = await this.prisma.$queryRaw`
        SELECT friend_id FROM im_friends WHERE user_id = ${userId} AND is_blocked = 0
      `;
      for (const f of friends) {
        this._pushToUser(f.friend_id, 'presence', { userId, isOnline });
      }
    } catch { /* ignore — non-critical */ }
  }

  // ── Conversations ────────────────────────────────────────────────────────────

  async _updateConversation(
    uid:       string | number,
    targetType: number,
    targetId:  string | number,
    msgId:     string | number,
    preview:   string,
    ts:        Date,
    addUnread: boolean,
  ): Promise<void> {
    const existing = await this.prisma.imConversation.findFirst({
      where: { userId: uid, targetType, targetId },
    });
    if (existing) {
      await this.prisma.imConversation.update({
        where: { id: existing.id },
        data: {
          lastMsgId:   msgId,
          lastContent: preview.substring(0, 50),
          lastTime:    ts,
          unreadCount: addUnread ? { increment: 1 } : 0,
          updatedAt:   ts,
        },
      });
    } else {
      await this.prisma.imConversation.create({
        data: {
          userId:      uid,
          targetType,
          targetId,
          lastMsgId:   msgId,
          lastContent: preview.substring(0, 50),
          lastTime:    ts,
          unreadCount: addUnread ? 1 : 0,
          updatedAt:   ts,
        },
      });
    }
  }

  async getConversations(userId: string | number): Promise<unknown[]> {
    const convs = await this.prisma.imConversation.findMany({
      where:   { userId },
      orderBy: [{ isPinned: 'desc' }, { lastTime: 'desc' }],
    });

    const result: Record<string, unknown>[] = [];
    for (const c of convs) {
      const item: Record<string, unknown> = {
        id:           c.id,
        targetType:   c.targetType,
        targetId:     c.targetId,
        lastContent:  c.lastContent,
        lastTime:     c.lastTime,
        unreadCount:  c.unreadCount,
        isPinned:     c.isPinned,
        isMuted:      c.isMuted,
        targetName:   '',
        targetAvatar: '',
      };

      if (c.targetType === CONV_PRIVATE) {
        const u = await this.prisma.user.findUnique({ where: { id: c.targetId }, select: { username: true, fullName: true, avatar: true } });
        item.targetName   = u?.fullName || u?.username || '';
        item.targetAvatar = u?.avatar   || '';
      } else if (c.targetType === CONV_GROUP) {
        const g = await this.prisma.imGroup.findUnique({ where: { id: c.targetId }, select: { name: true, avatar: true } });
        item.targetName   = g?.name   || '';
        item.targetAvatar = g?.avatar || '';
      } else {
        item.targetName = 'Thông báo hệ thống';
      }
      result.push(item);
    }
    return result;
  }

  // ── Messages ────────────────────────────────────────────────────────────────

  async sendPrivateMessage(fromUid: string, toUid: string, content: string, msgType = MSG_TEXT, extra: Record<string, unknown> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const target = await this.prisma.user.findUnique({ where: { id: toUid }, select: { id: true } });
    if (!target) return { success: false, error: 'User not found' };

    const blocked = await this.prisma.imFriend.findFirst({
      where: { userId: toUid, friendId: fromUid, isBlocked: true },
    });
    if (blocked) return { success: false, error: 'Cannot send message' };

    const now = new Date();
    const msg = await this.prisma.imMessage.create({
      data: { fromId: fromUid, toId: toUid, msgType, content, extra: JSON.stringify(extra) },
    });

    const preview = content.substring(0, 50);
    await this._updateConversation(fromUid, CONV_PRIVATE, toUid,   msg.id, preview, now, false);
    await this._updateConversation(toUid,   CONV_PRIVATE, fromUid, msg.id, preview, now, true);

    const sender = await this.prisma.user.findUnique({ where: { id: fromUid }, select: { username: true, fullName: true, avatar: true } });
    const payload = {
      msgId:      msg.id,
      fromUid,
      fromName:   sender?.fullName || sender?.username || `User${fromUid}`,
      fromAvatar: sender?.avatar   || '',
      toUid,
      msgType,
      content,
      extra,
      createdAt:  now.getTime(),
      sender:     { userId: fromUid, nickname: sender?.fullName || sender?.username, avatar: sender?.avatar || '' },
    };

    this._pushToUser(toUid, 'message', payload);
    this._pushToUser(toUid, 'unread_update', { total: await this.getUnreadCount(toUid) });

    return { success: true, data: payload };
  }

  async sendGroupMessage(fromUid: string, groupId: string, content: string, msgType = MSG_TEXT, extra: Record<string, unknown> = {}): Promise<{ success: boolean; data?: unknown; error?: string }> {
    const member = await this.prisma.imGroupMember.findFirst({ where: { groupId, userId: fromUid } });
    if (!member)        return { success: false, error: 'Not a group member' };
    if (member.isMuted) return { success: false, error: 'You are muted in this group' };

    const now = new Date();
    const msg = await this.prisma.imMessage.create({
      data: { fromId: fromUid, toGroupId: groupId, msgType, content, extra: JSON.stringify(extra) },
    });

    const group  = await this.prisma.imGroup.findUnique({ where: { id: groupId }, select: { name: true, avatar: true } });
    const sender = await this.prisma.user.findUnique({ where: { id: fromUid }, select: { username: true, fullName: true, avatar: true } });
    const preview = content.substring(0, 50);

    const payload = {
      msgId:      msg.id,
      fromUid,
      fromName:   sender?.fullName || sender?.username || '',
      fromAvatar: sender?.avatar   || '',
      groupId,
      groupName:  group?.name      || '',
      msgType,
      content,
      extra,
      createdAt:  now.getTime(),
      sender:     { userId: fromUid, nickname: sender?.fullName || sender?.username, avatar: sender?.avatar || '' },
    };

    const members: Array<{ userId: string }> = await this.prisma.imGroupMember.findMany({
      where:  { groupId, userId: { not: fromUid } },
      select: { userId: true },
    });

    for (const m of members) {
      await this._updateConversation(m.userId, CONV_GROUP, groupId, msg.id, preview, now, true);
      this._pushToUser(m.userId, 'message', payload);
      this._pushToUser(m.userId, 'unread_update', { total: await this.getUnreadCount(m.userId) });
    }
    await this._updateConversation(fromUid, CONV_GROUP, groupId, msg.id, preview, now, false);

    return { success: true, data: payload };
  }

  async sendSystemNotice(toUid: string, content: string, title = 'Thông báo hệ thống', extra: Record<string, unknown> = {}): Promise<{ success: boolean; data: unknown }> {
    const now = new Date();
    const msg = await this.prisma.imMessage.create({
      data: { fromId: null, toId: toUid, msgType: MSG_SYSTEM, content, extra: JSON.stringify({ title, ...extra }) },
    });
    await this._updateConversation(toUid, CONV_SYSTEM, 0, msg.id, content, now, true);
    const payload = { msgId: msg.id, msgType: MSG_SYSTEM, title, content, extra, createdAt: now.getTime() };
    this._pushToUser(toUid, 'notice', payload);
    return { success: true, data: payload };
  }

  async getMessages(uid: string, targetType: number, targetId: string | number, lastMsgId = 0, limit = 20): Promise<unknown[]> {
    const where: Record<string, unknown> = {};
    if (targetType === CONV_PRIVATE) {
      where.OR = [
        { fromId: uid, toId: targetId },
        { fromId: targetId, toId: uid },
      ];
    } else if (targetType === CONV_GROUP) {
      where.toGroupId = targetId;
    } else {
      where.toId = uid; where.msgType = MSG_SYSTEM;
    }
    if (lastMsgId) where.id = { lt: lastMsgId };

    const msgs = await this.prisma.imMessage.findMany({ where, orderBy: { id: 'desc' }, take: limit });

    const senderIds = [...new Set<string>(msgs.map((m: any) => m.fromId).filter(Boolean) as string[])];
    const sendersArr = senderIds.length
      ? await this.prisma.user.findMany({ where: { id: { in: senderIds } }, select: { id: true, username: true, fullName: true, avatar: true } })
      : [];
    const senderMap = Object.fromEntries(sendersArr.map((s: any) => [s.id, s]));

    return msgs.reverse().map((m: any) => {
      const s    = m.fromId ? senderMap[m.fromId] : null;
      const name = s ? (s.fullName || s.username || `User${m.fromId}`) : 'Hệ thống';
      return {
        msgId:      m.id,
        fromUid:    m.fromId,
        fromName:   name,
        fromAvatar: s?.avatar || '',
        msgType:    m.msgType,
        content:    m.content,
        extra:      (() => { try { return JSON.parse(m.extra || '{}'); } catch { return {}; } })(),
        isRead:     m.isRead,
        isRecall:   m.isRecall,
        createdAt:  m.createdAt,
        isSelf:     m.fromId === uid,
        sender:     { userId: m.fromId, nickname: name, avatar: s?.avatar || '' },
      };
    });
  }

  async markAsRead(uid: string, targetType: number, targetId: string | number): Promise<void> {
    await this.prisma.imConversation.updateMany({
      where: { userId: uid, targetType, targetId },
      data:  { unreadCount: 0 },
    });
    if (targetType === CONV_PRIVATE) {
      await this.prisma.imMessage.updateMany({
        where: { fromId: targetId, toId: uid, isRead: false },
        data:  { isRead: true },
      });
    }
  }

  async getUnreadCount(userId: string | number): Promise<number> {
    const result = await this.prisma.imConversation.aggregate({
      where: { userId },
      _sum:  { unreadCount: true },
    });
    return result._sum.unreadCount || 0;
  }

  async recallMessage(uid: string, msgId: string | number): Promise<{ success: boolean; error?: string }> {
    const msg = await this.prisma.imMessage.findUnique({ where: { id: msgId } });
    if (!msg)                    return { success: false, error: 'Message not found' };
    if (msg.fromId !== uid)      return { success: false, error: 'Can only recall own messages' };
    const age = (Date.now() - new Date(msg.createdAt).getTime()) / 1000;
    if (age > RECALL_WINDOW_SECONDS) return { success: false, error: 'Recall window expired (2 min)' };

    await this.prisma.imMessage.update({ where: { id: msgId }, data: { isRecall: true } });

    if (msg.toId) {
      this._pushToUser(msg.toId, 'recall', { msgId, fromUid: uid });
    } else if (msg.toGroupId) {
      const members: Array<{ userId: string }> = await this.prisma.imGroupMember.findMany({ where: { groupId: msg.toGroupId, userId: { not: uid } }, select: { userId: true } });
      for (const m of members) this._pushToUser(m.userId, 'recall', { msgId, fromUid: uid, groupId: msg.toGroupId });
    }
    return { success: true };
  }

  // ── Friends ──────────────────────────────────────────────────────────────────

  async getContacts(uid: string): Promise<unknown[]> {
    const friends = await this.prisma.imFriend.findMany({
      where:   { userId: uid, isBlocked: false },
      include: { friend: { select: { id: true, username: true, fullName: true, avatar: true } } },
    });
    return friends.map((f: any) => ({
      userId:   f.friendId,
      nickname: f.remark || f.friend?.fullName || f.friend?.username || '',
      avatar:   f.friend?.avatar || '',
      remark:   f.remark,
    }));
  }

  async sendFriendRequest(fromUid: string, toUid: string, message = ''): Promise<{ success: boolean; error?: string }> {
    if (fromUid === toUid) return { success: false, error: 'Cannot add yourself' };
    const exists  = await this.prisma.imFriend.findFirst({ where: { userId: fromUid, friendId: toUid } });
    if (exists) return { success: false, error: 'Already friends' };
    const pending = await this.prisma.imFriendRequest.findFirst({ where: { fromId: fromUid, toId: toUid, status: 'pending' } });
    if (pending) return { success: false, error: 'Request already sent' };
    await this.prisma.imFriendRequest.create({ data: { fromId: fromUid, toId: toUid, message, status: 'pending' } });
    this._pushToUser(toUid, 'friend_request', { fromUid, message });
    return { success: true };
  }

  async handleFriendRequest(uid: string, requestId: string | number, accept: boolean): Promise<{ success: boolean; error?: string }> {
    const req = await this.prisma.imFriendRequest.findFirst({ where: { id: requestId, toId: uid, status: 'pending' } });
    if (!req) return { success: false, error: 'Request not found' };
    await this.prisma.imFriendRequest.update({ where: { id: requestId }, data: { status: accept ? 'accepted' : 'rejected' } });
    if (accept) {
      await this.prisma.imFriend.createMany({
        data: [
          { userId: uid, friendId: req.fromId },
          { userId: req.fromId, friendId: uid },
        ],
        skipDuplicates: true,
      });
      this._pushToUser(req.fromId, 'friend_accepted', { userId: uid });
    }
    return { success: true };
  }

  async setFriendRemark(uid: string, friendId: string, remark: string): Promise<{ success: boolean }> {
    await this.prisma.imFriend.updateMany({ where: { userId: uid, friendId }, data: { remark } });
    return { success: true };
  }

  async blockFriend(uid: string, friendId: string, block: boolean): Promise<{ success: boolean }> {
    await this.prisma.imFriend.updateMany({ where: { userId: uid, friendId }, data: { isBlocked: block } });
    return { success: true };
  }

  async deleteFriend(uid: string, friendId: string): Promise<{ success: boolean }> {
    await this.prisma.imFriend.deleteMany({
      where: { OR: [{ userId: uid, friendId }, { userId: friendId, friendId: uid }] },
    });
    return { success: true };
  }

  async getFriendRequests(uid: string): Promise<unknown[]> {
    const reqs = await this.prisma.imFriendRequest.findMany({
      where:   { toId: uid, createdAt: { gte: new Date(Date.now() - 30 * 86400 * 1000) } },
      include: { from: { select: { id: true, username: true, fullName: true, avatar: true } } },
      orderBy: { createdAt: 'desc' },
      take:    50,
    });
    return reqs.map((r: any) => ({
      id:        r.id,
      fromUid:   r.fromId,
      nickname:  r.from?.fullName || r.from?.username || '',
      avatar:    r.from?.avatar || '',
      message:   r.message,
      status:    r.status,
      createdAt: r.createdAt,
    }));
  }

  async searchUser(uid: string, keyword: string, limit = 20): Promise<unknown[]> {
    const users = await this.prisma.user.findMany({
      where: {
        id:     { not: uid },
        status: 'active',
        OR: [
          { username: { contains: keyword } },
          { fullName: { contains: keyword } },
        ],
      },
      select: { id: true, username: true, fullName: true, avatar: true },
      take:   limit,
    });
    const result: unknown[] = [];
    for (const u of users as any[]) {
      const isFriend = !!(await this.prisma.imFriend.findFirst({ where: { userId: uid, friendId: u.id } }));
      result.push({ userId: u.id, username: u.username, nickname: u.fullName || u.username, avatar: u.avatar || '', isFriend });
    }
    return result;
  }

  // ── Groups ───────────────────────────────────────────────────────────────────

  async createGroup(ownerUid: string, name: string, memberUids: string[] = []): Promise<{ success: boolean; groupId: string }> {
    const group = await this.prisma.imGroup.create({
      data: { name, ownerId: ownerUid, memberCount: 1 + memberUids.length },
    });
    await this.prisma.imGroupMember.create({ data: { groupId: group.id, userId: ownerUid, role: 'owner' } });
    for (const uid of memberUids) {
      await this.prisma.imGroupMember.create({ data: { groupId: group.id, userId: uid, role: 'member' } });
      this._pushToUser(uid, 'group_notice', { action: 'invited', groupId: group.id, groupName: name });
    }
    return { success: true, groupId: group.id };
  }

  async getGroups(uid: string): Promise<unknown[]> {
    const memberships = await this.prisma.imGroupMember.findMany({
      where:   { userId: uid },
      include: { group: { select: { id: true, name: true, avatar: true, memberCount: true } } },
    });
    return memberships.map((m: any) => ({
      id:          m.groupId,
      name:        m.group?.name || '',
      avatar:      m.group?.avatar || '',
      memberCount: m.group?.memberCount || 0,
      role:        m.role,
    }));
  }

  async getGroupMembers(groupId: string): Promise<unknown[]> {
    const members = await this.prisma.imGroupMember.findMany({
      where:   { groupId },
      include: { user: { select: { id: true, username: true, fullName: true, avatar: true } } },
      orderBy: { role: 'desc' },
    });
    return members.map((m: any) => ({
      userId:   m.userId,
      nickname: m.user?.fullName || m.user?.username || '',
      avatar:   m.user?.avatar || '',
      role:     m.role,
      isMuted:  m.isMuted,
    }));
  }

  async inviteToGroup(operatorUid: string, groupId: string, uids: string[]): Promise<{ success: boolean; added?: number; error?: string }> {
    const op = await this.prisma.imGroupMember.findFirst({ where: { groupId, userId: operatorUid } });
    if (!op) return { success: false, error: 'Not a group member' };
    const group = await this.prisma.imGroup.findUnique({ where: { id: groupId }, select: { name: true } });
    let added = 0;
    for (const uid of uids) {
      const exists = await this.prisma.imGroupMember.findFirst({ where: { groupId, userId: uid } });
      if (!exists) {
        await this.prisma.imGroupMember.create({ data: { groupId, userId: uid, role: 'member' } });
        added++;
        this._pushToUser(uid, 'group_notice', { action: 'invited', groupId, groupName: group?.name || '' });
      }
    }
    if (added > 0) await this.prisma.imGroup.update({ where: { id: groupId }, data: { memberCount: { increment: added } } });
    return { success: true, added };
  }

  async kickFromGroup(operatorUid: string, groupId: string, targetUid: string): Promise<{ success: boolean; error?: string }> {
    const op     = await this.prisma.imGroupMember.findFirst({ where: { groupId, userId: operatorUid } });
    const target = await this.prisma.imGroupMember.findFirst({ where: { groupId, userId: targetUid } });
    if (!op || op.role === 'member')    return { success: false, error: 'Insufficient permission' };
    if (!target)                         return { success: false, error: 'User not in group' };
    if (target.role === 'owner' || (target.role === 'admin' && op.role !== 'owner')) {
      return { success: false, error: 'Cannot kick admin/owner' };
    }
    await this.prisma.imGroupMember.delete({ where: { id: target.id } });
    await this.prisma.imGroup.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } });
    const g = await this.prisma.imGroup.findUnique({ where: { id: groupId }, select: { name: true } });
    this._pushToUser(targetUid, 'group_notice', { action: 'kicked', groupId, groupName: g?.name || '' });
    return { success: true };
  }

  async setGroupAdmin(operatorUid: string, groupId: string, targetUid: string, isAdmin: boolean): Promise<{ success: boolean; error?: string }> {
    const op = await this.prisma.imGroupMember.findFirst({ where: { groupId, userId: operatorUid } });
    if (!op || op.role !== 'owner') return { success: false, error: 'Only owner can set admin' };
    await this.prisma.imGroupMember.updateMany({ where: { groupId, userId: targetUid }, data: { role: isAdmin ? 'admin' : 'member' } });
    return { success: true };
  }

  async quitGroup(uid: string, groupId: string): Promise<{ success: boolean; error?: string }> {
    const m = await this.prisma.imGroupMember.findFirst({ where: { groupId, userId: uid } });
    if (!m)              return { success: false, error: 'Not in group' };
    if (m.role === 'owner') return { success: false, error: 'Owner cannot quit — transfer first' };
    await this.prisma.imGroupMember.delete({ where: { id: m.id } });
    await this.prisma.imGroup.update({ where: { id: groupId }, data: { memberCount: { decrement: 1 } } });
    return { success: true };
  }

  // ── Conversation settings ────────────────────────────────────────────────────

  async setConversationPinned(uid: string, targetType: number, targetId: string | number, isPinned: boolean): Promise<{ success: boolean }> {
    await this.prisma.imConversation.updateMany({ where: { userId: uid, targetType, targetId }, data: { isPinned } });
    return { success: true };
  }

  async setConversationMuted(uid: string, targetType: number, targetId: string | number, isMuted: boolean): Promise<{ success: boolean }> {
    await this.prisma.imConversation.updateMany({ where: { userId: uid, targetType, targetId }, data: { isMuted } });
    return { success: true };
  }

  async deleteConversation(uid: string, targetType: number, targetId: string | number): Promise<{ success: boolean }> {
    await this.prisma.imConversation.deleteMany({ where: { userId: uid, targetType, targetId } });
    return { success: true };
  }
}

module.exports = IMService;
module.exports.MSG_TEXT    = MSG_TEXT;
module.exports.MSG_IMAGE   = MSG_IMAGE;
module.exports.MSG_VOICE   = MSG_VOICE;
module.exports.MSG_SYSTEM  = MSG_SYSTEM;
module.exports.CONV_PRIVATE = CONV_PRIVATE;
module.exports.CONV_GROUP   = CONV_GROUP;
module.exports.CONV_SYSTEM  = CONV_SYSTEM;
