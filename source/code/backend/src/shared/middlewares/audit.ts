import { logger } from '../services/logger';

export const auditLog = (action: string) => (req: any, res: any, next: any) => {
  // Chỉ log các action quan trọng (POST/PUT/DELETE)
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    logger.info(`[AUDIT] ${action} | User: ${req.user?.id || 'guest'} | Path: ${req.path}`);
  }
  next();
};
