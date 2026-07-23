const Queue = require('bull');
const { getPrismaClient } = require('../../config/databases');
const ConfigService = require('../services/configService');
const nodemailer = require('nodemailer');

const notificationQueue = new Queue('notifications', process.env.REDIS_URL || 'redis://localhost:6379');

notificationQueue.process(async (job) => {
  const { projectCode, type, userId, data } = job.data;

  try {
    if (type === 'email') {
      // Try DB config first, fall back to env-based emailService
      const emailService = require('../services/emailService');
      const prisma       = getPrismaClient('admin');
      const configService = new ConfigService(prisma);
      const smtpConfig   = await configService.getModule(projectCode, 'notification').catch(() => ({}));

      if (smtpConfig?.email?.host) {
        const transporter = nodemailer.createTransport({
          host: smtpConfig.email.host,
          port: smtpConfig.email.port || 587,
          auth: { user: smtpConfig.email.user, pass: smtpConfig.email.pass },
        });
        await transporter.sendMail({
          from:    smtpConfig.email.from || smtpConfig.email.user,
          to:      data.to,
          subject: data.subject,
          html:    data.html || data.text,
          text:    data.text,
        });
      } else {
        // Fallback: use shared emailService (env-configured)
        await emailService.send(data.to, data.subject, data.html || data.text, data.text);
      }
    }

    if (type === 'sms') {
      const smsService = require('../services/smsService');
      await smsService.send(data.phone, data.text);
    }

  } catch (err) {
    const logger = require('../services/logger');
    logger.error(`[NotifQueue] job failed type=${type} userId=${userId}: ${err.message}`);
    throw err; // re-throw so Bull can retry
  }
});

module.exports = notificationQueue;
