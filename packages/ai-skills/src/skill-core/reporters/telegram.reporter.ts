import { ScanResult } from '../orchestrator';
import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

// Load env vars from the temp directory where we stored the secrets
dotenv.config({ path: path.join('/root/.gemini/tmp/lkvip/env/ai-skills.env') });

export class TelegramReporter {
  async report(results: ScanResult[]) {
    const botToken = process.env.TELEGRAM_BOT_TOKEN;
    const chatId = process.env.TELEGRAM_REPORT_CHAT_ID;

    if (!botToken || !chatId) {
      console.log('⚠️ TELEGRAM_BOT_TOKEN or TELEGRAM_REPORT_CHAT_ID not set, skipping Telegram report');
      return;
    }

    let message = '🔍 *LKVIP AI Health Check Report*\n\n';
    let hasIssues = false;

    for (const result of results) {
      if (result.summary.totalErrors > 0) {
        hasIssues = true;
        const status = '❌';
        message += `${status} *${result.app.toUpperCase()}*\n`;
        message += `Errors: ${result.summary.totalErrors}, Warnings: ${result.summary.totalWarnings}\n\n`;
      }
    }

    if (!hasIssues) {
      message += '✅ All systems operational!';
    }

    try {
      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      };
      // Log for debugging
      console.log('📤 Sending Telegram request:', JSON.stringify(payload));
      await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, payload);
      console.log('📤 Report sent to Telegram');
    } catch (e: any) {
      if (e.response) {
          console.error('❌ Failed to send Telegram report (Response Data):', JSON.stringify(e.response.data));
      } else {
          console.error('❌ Failed to send Telegram report:', e.message);
      }
    }
  }
}
