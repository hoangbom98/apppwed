// @ts-nocheck
'use strict';
/**
 * notificationTemplateService.js
 *
 * CRUD + template-engine for NotificationTemplate / NotificationLog.
 *
 * Storage: admin prisma client (tables: notification_templates, notification_logs)
 *
 * Template variable syntax: {variable_name}
 * Example:  "Đơn hàng {order_id} từ {username} — {total_amount} VND"
 */

const logger = require('../../../shared/services/logger');

// ── Default template definitions (seeded on first boot) ──────────────────────
const DEFAULT_TEMPLATES = [
  {
    type:      'order_admin',
    name:      'Thông báo đơn hàng mới cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '🛒 <b>Đơn hàng mới</b>\n🌐 Domain: {domain}\n👤 Khách: {username}\n📦 Số SP: {order_count}\n💰 Tổng: {total_amount} VND\n🎟️ Coupon: {coupon_code}\n🕐 {time}\n🌏 IP: {ip}',
    variables: ['{domain}','{username}','{order_count}','{total_amount}','{discount_amount}','{coupon_code}','{order_ids}','{order_details}','{time}','{ip}'],
  },
  {
    type:      'order_user',
    name:      'Thông báo mua hàng thành công cho User',
    subject:   'Mua hàng thành công - {domain}',
    channel:   'both',
    content:   '✅ <b>Mua hàng thành công</b>\nCảm ơn <b>{username}</b> đã tin tưởng {domain}!\n📦 Số SP: {order_count}\n💰 Tổng: {total_amount} VND\n🕐 {time}',
    variables: ['{domain}','{username}','{order_count}','{total_amount}','{discount_amount}','{coupon_code}','{order_ids}','{order_details}','{time}'],
  },
  {
    type:      'order_processing',
    name:      'Thông báo đơn hàng cần xử lý cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '⏳ <b>Đơn hàng cần xử lý</b>\n🌐 {domain}\n👤 {username}\n🆔 Mã đơn: {order_ids}\n💰 {total_amount} VND\n🕐 {time}',
    variables: ['{domain}','{username}','{order_ids}','{total_amount}','{time}'],
  },
  {
    type:      'deposit_admin',
    name:      'Thông báo nạp tiền cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '💳 <b>Nạp tiền mới</b>\n🌐 {domain}\n👤 {username}\n💰 Số tiền: {amount} VND\n🏦 Phương thức: {method}\n🕐 {time}\n🌏 IP: {ip}',
    variables: ['{domain}','{username}','{amount}','{method}','{new_balance}','{time}','{ip}'],
  },
  {
    type:      'deposit_user',
    name:      'Thông báo nạp tiền thành công cho User',
    subject:   'Nạp tiền thành công - {domain}',
    channel:   'email',
    content:   '✅ Nạp tiền thành công!\nSố tiền: <b>{amount} VND</b>\nSố dư mới: {new_balance} VND\nThời gian: {time}',
    variables: ['{domain}','{username}','{amount}','{new_balance}','{time}'],
  },
  {
    type:      'api_out_of_balance',
    name:      'Thông báo API hết tiền cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '⚠️ <b>API HẾT TIỀN</b>\n🌐 {domain}\n🔌 Nhà cung cấp: {supplier_name}\n💰 Số dư: {balance}\n🕐 {time}',
    variables: ['{domain}','{supplier_name}','{balance}','{time}'],
  },
  {
    type:      'api_connection_error',
    name:      'Thông báo lỗi kết nối API cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '❌ <b>LỖI KẾT NỐI API</b>\n🌐 {domain}\n🔌 {supplier_name}\n📛 Lỗi: {error_message}\n🕐 {time}',
    variables: ['{domain}','{supplier_name}','{error_message}','{time}'],
  },
  {
    type:      'commission_withdraw',
    name:      'Thông báo rút hoa hồng cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '💸 <b>Yêu cầu rút hoa hồng</b>\n🌐 {domain}\n👤 {username}\n💰 {amount} VND\n🕐 {time}',
    variables: ['{domain}','{username}','{amount}','{time}'],
  },
  {
    type:      'ticket_admin',
    name:      'Thông báo ticket mới cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '🎫 <b>Ticket mới</b>\n🌐 {domain}\n👤 {username}\n📝 Tiêu đề: {ticket_subject}\n💬 {ticket_content}\n🕐 {time}',
    variables: ['{domain}','{username}','{ticket_subject}','{ticket_content}','{time}'],
  },
  {
    type:      'ticket_user',
    name:      'Thông báo khi Admin reply ticket cho User',
    subject:   'Admin đã trả lời yêu cầu hỗ trợ của bạn',
    channel:   'email',
    content:   '📩 Admin đã phản hồi ticket của bạn.\n<b>{ticket_subject}</b>\n\nPhản hồi: {reply_content}\n\nTruy cập: {domain}/support để xem chi tiết.',
    variables: ['{domain}','{username}','{ticket_subject}','{reply_content}','{time}'],
  },
  {
    type:      'login_user',
    name:      'Thông báo đăng nhập cho User',
    subject:   'Phát hiện đăng nhập mới - {domain}',
    channel:   'email',
    content:   '🔐 Phát hiện đăng nhập mới vào tài khoản <b>{username}</b>.\n🌏 IP: {ip}\n📱 Thiết bị: {device}\n🕐 {time}\n\nNếu không phải bạn, hãy đổi mật khẩu ngay!',
    variables: ['{domain}','{username}','{ip}','{device}','{time}'],
  },
  {
    type:      'review_admin',
    name:      'Thông báo đánh giá sản phẩm mới cho Admin',
    subject:   null,
    channel:   'telegram',
    content:   '⭐ <b>Đánh giá mới</b>\n🌐 {domain}\n👤 {username}\n📦 Sản phẩm: {product_name}\n⭐ {rating}/5\n💬 {review_content}\n🕐 {time}',
    variables: ['{domain}','{username}','{product_name}','{rating}','{review_content}','{time}'],
  },
];

// ── Parse {variable} placeholders ─────────────────────────────────────────────
function parseTemplate(tpl, vars) {
  let out = tpl;
  for (const [k, v] of Object.entries(vars)) {
    out = out.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v ?? ''));
  }
  return out;
}

// ── getAll ────────────────────────────────────────────────────────────────────
async function getAll(prisma) {
  return prisma.notificationTemplate.findMany({ orderBy: { id: 'asc' } });
}

// ── getByType ─────────────────────────────────────────────────────────────────
async function getByType(prisma, type) {
  return prisma.notificationTemplate.findUnique({ where: { type } });
}

// ── update ────────────────────────────────────────────────────────────────────
async function update(prisma, type, data) {
  const allowed = ['name','subject','content','channel','variables','isActive'];
  const safe = Object.fromEntries(Object.entries(data).filter(([k]) => allowed.includes(k)));
  return prisma.notificationTemplate.update({ where: { type }, data: safe });
}

// ── render — returns { subject, content } with variables substituted ──────────
async function render(prisma, type, vars = {}) {
  const tpl = await getByType(prisma, type);
  if (!tpl || !tpl.isActive) return null;
  return {
    subject: tpl.subject ? parseTemplate(tpl.subject, vars) : null,
    content: parseTemplate(tpl.content, vars),
    channel: tpl.channel,
    templateId: tpl.id,
  };
}

// ── logSend — records one delivery attempt ────────────────────────────────────
async function logSend(prisma, data) {
  return prisma.notificationLog.create({ data });
}

// ── seed — upserts default templates if not present ───────────────────────────
async function seed(prisma) {
  for (const tpl of DEFAULT_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where:  { type: tpl.type },
      create: { ...tpl, variables: JSON.stringify(tpl.variables) },
      update: {},   // never overwrite customised templates
    });
  }
  logger.info('[NotifTplSvc] Seeded default notification templates');
}

module.exports = { getAll, getByType, update, render, logSend, seed, DEFAULT_TEMPLATES };
