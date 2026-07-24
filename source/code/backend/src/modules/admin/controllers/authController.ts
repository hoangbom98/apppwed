const { comparePassword, generateTokens } = require('../../../shared/services/authService');
const { success, error, unauthorized } = require('../../../shared/utils/response');

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return error(res, 'Thiếu thông tin');
    const admin = await req.prisma.adminUser.findUnique({ where: { email } });
    if (!admin || !(await comparePassword(password, admin.password))) return unauthorized(res, 'Sai thông tin đăng nhập');
    if (admin.status !== 'active') return unauthorized(res, 'Tài khoản bị khóa');
    await req.prisma.adminUser.update({ where: { id: admin.id }, data: { lastLogin: new Date() } });
    // Extract modules[] from permissions JSON for frontend registry gate
    const modules = Array.isArray(admin.permissions?.modules) ? admin.permissions.modules : [];
    const tokens = generateTokens({ id: admin.id, email: admin.email, role: admin.role, project: 'admin', modules });
    return success(res, {
      admin: { id: admin.id, email: admin.email, fullName: admin.fullName, role: admin.role, modules },
      ...tokens,
    });
  } catch (e) { return error(res, e.message, 500); }
};

exports.me = async (req, res) => {
  try {
    const admin = await req.prisma.adminUser.findUnique({
      where:  { id: req.user.id },
      select: { id: true, email: true, fullName: true, role: true, status: true, permissions: true },
    });
    if (!admin) return unauthorized(res);
    const modules = Array.isArray(admin.permissions?.modules) ? admin.permissions.modules : [];
    return success(res, { ...admin, modules });
  } catch (e) { return error(res, e.message, 500); }
};

exports.refresh = async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return error(res, 'refresh_token là bắt buộc');
    const { verifyRefreshToken, generateTokens } = require('../../../shared/services/authService');
    let payload;
    try { payload = verifyRefreshToken(refresh_token); }
    catch { return error(res, 'Refresh token không hợp lệ hoặc đã hết hạn', 401); }
    const admin = await req.prisma.adminUser.findUnique({ where: { id: payload.id }, select: { id: true, email: true, role: true, status: true, permissions: true } });
    if (!admin || admin.status !== 'active') return error(res, 'Tài khoản không hợp lệ', 401);
    const modules = Array.isArray(admin.permissions?.modules) ? admin.permissions.modules : [];
    const tokens = generateTokens({ id: admin.id, email: admin.email, role: admin.role, project: 'admin', modules });
    return success(res, tokens);
  } catch (e) { return error(res, e.message, 500); }
};
