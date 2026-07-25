/**
 * socket.service.ts
 * Quản lý kết nối WebSocket tập trung.
 */
import { Server } from 'socket.io';
import { logger } from '../logger';

let io: Server;

export function initSocket(server: any) {
  io = new Server(server, { cors: { origin: '*' } });
  io.on('connection', (socket) => {
    logger.info(`[Socket] User connected: ${socket.id}`);
    socket.on('disconnect', () => logger.info(`[Socket] User disconnected: ${socket.id}`));
  });
}

export function emitToUser(userId: string, event: string, data: any) {
  if (io) {
    io.to(`user_${userId}`).emit(event, data);
  }
}

export function emitToAll(event: string, data: any) {
  if (io) {
    io.emit(event, data);
  }
}
