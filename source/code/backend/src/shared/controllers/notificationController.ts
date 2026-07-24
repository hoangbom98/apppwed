const notificationService = require('../services/notificationService');

const sendTestEmail = async (req, res) => {
  try {
    const { to, subject, text } = req.body;
    const projectCode = req.project; // Assume projectResolver middleware sets this
    await notificationService.sendEmail(projectCode, req.user.id, to, subject, text);
    res.json({ success: true, message: 'Email queued' });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

module.exports = { sendTestEmail };
