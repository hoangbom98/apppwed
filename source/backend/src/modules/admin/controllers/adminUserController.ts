// @ts-nocheck
/* eslint-disable */

import { Request, Response } from 'express';
import { BaseController } from '../../../shared/base/BaseController';
const { paginate } = require('../../../shared/utils/helpers');
const { hashPassword } = require('../../../shared/services/authService');

class AdminUserController extends BaseController {
  
  public list = this.asyncHandler(async (req: Request, res: Response) => {
    const { skip, take, page, limit } = paginate(req.query.page, req.query.limit);
    const where: any = {};
    if (req.query.role) where.role = req.query.role;
    if (req.query.status) where.status = req.query.status;
    
    const [data, total] = await Promise.all([
      (req as any).prisma.adminUser.findMany({
        where, skip, take,
        orderBy: { createdAt: 'desc' },
        select: { id: true, email: true, fullName: true, role: true, status: true, lastLogin: true, createdAt: true },
      }),
      (req as any).prisma.adminUser.count({ where }),
    ]);
    
    return this.sendSuccess(res, { data, meta: { total, page, limit, pages: Math.ceil(total / take) } });
  });

  public get = this.asyncHandler(async (req: Request, res: Response) => {
    const admin = await (req as any).prisma.adminUser.findUnique({
      where: { id: req.params.id },
      select: { id: true, email: true, fullName: true, role: true, status: true, lastLogin: true, createdAt: true },
    });
    
    if (!admin) return this.sendNotFound(res);
    return this.sendSuccess(res, admin);
  });

  public create = this.asyncHandler(async (req: Request, res: Response) => {
    const { email, password, fullName, role } = req.body;
    if (!email || !password || !fullName) return this.sendError(res, 'Thiếu thông tin bắt buộc', 400);
    
    if (await (req as any).prisma.adminUser.findUnique({ where: { email } })) {
      return this.sendError(res, 'Email đã tồn tại', 400);
    }
    
    const admin = await (req as any).prisma.adminUser.create({
      data: { email, password: await hashPassword(password), fullName, role: role || 'admin' },
    });
    
    return this.sendCreated(res, { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role });
  });

  public update = this.asyncHandler(async (req: Request, res: Response) => {
    const { email, fullName, role, status } = req.body;
    try {
      const admin = await (req as any).prisma.adminUser.update({
        where: { id: req.params.id },
        data:  { email, fullName, role, status },
        select: { id: true, email: true, fullName: true, role: true, status: true },
      });
      return this.sendSuccess(res, admin);
    } catch (e: any) {
      if (e.code === 'P2025') return this.sendNotFound(res);
      throw e;
    }
  });

  public resetPassword = this.asyncHandler(async (req: Request, res: Response) => {
    const targetId = req.params.id;
    const { newPassword } = req.body;
    
    if (!newPassword || newPassword.length < 8) return this.sendError(res, 'Mật khẩu tối thiểu 8 ký tự', 400);
    
    // @ts-ignore
    if (req.user.role !== 'super_admin' && targetId !== req.user.id) {
      return this.sendError(res, 'Không có quyền đặt lại mật khẩu người khác', 403);
    }
    
    try {
      await (req as any).prisma.adminUser.update({
        where: { id: targetId },
        data:  { password: await hashPassword(newPassword) },
      });
      return this.sendSuccess(res, null, 'Đã đặt lại mật khẩu');
    } catch (e: any) {
      if (e.code === 'P2025') return this.sendNotFound(res);
      throw e;
    }
  });

  public remove = this.asyncHandler(async (req: Request, res: Response) => {
    // @ts-ignore
    if (req.params.id === req.user.id) return this.sendError(res, 'Không thể xóa chính mình', 400);
    
    try {
      await (req as any).prisma.adminUser.delete({ where: { id: req.params.id } });
      return this.sendSuccess(res, null, 'Đã xóa');
    } catch (e: any) {
      if (e.code === 'P2025') return this.sendNotFound(res);
      throw e;
    }
  });
}

const controller = new AdminUserController();

module.exports = {
  list: controller.list,
  get: controller.get,
  create: controller.create,
  update: controller.update,
  resetPassword: controller.resetPassword,
  remove: controller.remove,
};
