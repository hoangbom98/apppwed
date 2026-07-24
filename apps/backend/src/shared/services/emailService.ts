const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: parseInt(process.env.SMTP_PORT) === 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return transporter;
}

const FROM = () => `"${process.env.APP_NAME || 'App'}" <${process.env.SMTP_FROM || process.env.SMTP_USER}>`;

/**
 * Send a raw email
 */
exports.send = async (to, subject, html, text) => {
  if (!process.env.SMTP_USER) {
    require('./logger').info(`[EMAIL → ${to}] ${subject}`);
    return;
  }
  await getTransporter().sendMail({ from: FROM(), to, subject, html, text });
};

/**
 * Send OTP email
 */
exports.sendOtp = async (to, otp, appName = process.env.APP_NAME || 'App') => {
  const subject = `[${appName}] Mã OTP của bạn`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#3b82d4;margin-bottom:8px">${appName}</h2>
      <p>Mã OTP của bạn là:</p>
      <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#1f2328;padding:16px 0">${otp}</div>
      <p style="color:#57606a;font-size:13px">Mã có hiệu lực trong <strong>5 phút</strong>. Không chia sẻ mã này với bất kỳ ai.</p>
    </div>`;
  return exports.send(to, subject, html, `Mã OTP: ${otp}. Hiệu lực 5 phút.`);
};

/**
 * Send welcome email after registration
 */
exports.sendWelcome = async (to, fullName, appName = process.env.APP_NAME || 'App') => {
  const subject = `Chào mừng bạn đến với ${appName}`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#3b82d4">${appName}</h2>
      <p>Xin chào <strong>${fullName || 'bạn'}</strong>,</p>
      <p>Tài khoản của bạn đã được tạo thành công. Chào mừng bạn tham gia!</p>
      <p style="color:#57606a;font-size:13px">Nếu bạn không thực hiện đăng ký này, vui lòng bỏ qua email này.</p>
    </div>`;
  return exports.send(to, subject, html, `Chào mừng ${fullName} đến với ${appName}!`);
};

/**
 * Send password reset email
 */
exports.sendPasswordReset = async (to, resetLink, appName = process.env.APP_NAME || 'App') => {
  const subject = `[${appName}] Đặt lại mật khẩu`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#3b82d4">${appName}</h2>
      <p>Bạn đã yêu cầu đặt lại mật khẩu. Nhấn vào liên kết bên dưới:</p>
      <a href="${resetLink}" style="display:inline-block;padding:10px 20px;background:#3b82d4;color:#fff;border-radius:6px;text-decoration:none;margin:12px 0">Đặt lại mật khẩu</a>
      <p style="color:#57606a;font-size:13px">Liên kết có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
    </div>`;
  return exports.send(to, subject, html, `Link đặt lại mật khẩu: ${resetLink}`);
};

/**
 * Send deposit confirmation
 */
exports.sendDepositConfirmed = async (to, amount, currency, appName = process.env.APP_NAME || 'App') => {
  const subject = `[${appName}] Nạp tiền thành công`;
  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:24px;border:1px solid #e5e7eb;border-radius:8px">
      <h2 style="color:#3b82d4">${appName}</h2>
      <p>Nạp tiền thành công!</p>
      <p>Số tiền: <strong>${amount} ${currency}</strong> đã được cộng vào tài khoản của bạn.</p>
    </div>`;
  return exports.send(to, subject, html, `Nạp thành công: ${amount} ${currency}`);
};
