import { Worker } from 'bullmq';
import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import { redis } from '../../utils/redis';
import { logger } from '../../shared/logger';

const execAsync = promisify(exec);

// Worker kiểm tra sức khỏe hệ thống định kỳ
export const healthMonitorWorker = new Worker(
  'health-monitor',
  async (job) => {
    const services = [
      { name: 'Backend', url: 'http://localhost:5000/health' },
      // Bạn có thể thêm URL kiểm tra DB/Redis tại đây nếu có endpoint
    ];

    for (const service of services) {
      try {
        await axios.get(service.url, { timeout: 5000 });
        logger.info(`Health check passed: ${service.name}`);
      } catch (error: any) {
        logger.error(`Health check failed: ${service.name}. Error: ${error.message}`);
        
        // Tự động phục hồi nếu Backend down
        if (service.name === 'Backend') {
          await recoverBackend();
        }
      }
    }
  },
  { connection: redis, concurrency: 1 }
);

async function recoverBackend() {
  logger.warn('Attempting to restart backend service...');
  try {
    // Lưu ý: Đảm bảo user chạy backend có quyền thực thi pm2
    await execAsync('pm2 restart lkvip-backend');
    logger.info('Backend service restarted successfully');
    // TODO: Gửi cảnh báo critical cho admin
  } catch (err: any) {
    logger.error(`Failed to restart backend: ${err.message}`);
  }
}
