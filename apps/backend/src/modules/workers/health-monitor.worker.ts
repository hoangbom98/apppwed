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
  async (_job) => {
    const services = [
      { name: 'Backend', url: 'http://localhost:5000/health' },
    ];

    for (const service of services) {
      try {
        await axios.get(service.url, { timeout: 5000 });
        logger.info(`Health check passed: ${service.name}`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        logger.error(`Health check failed: ${service.name}. Error: ${msg}`);

        if (service.name === 'Backend') {
          await recoverBackend();
        }
      }
    }
  },
  { connection: redis, concurrency: 1 },
);

async function recoverBackend(): Promise<void> {
  logger.warn('Attempting to restart backend service...');
  try {
    await execAsync('pm2 restart lkvip-api');
    logger.info('Backend service restarted successfully');
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    logger.error(`Failed to restart backend: ${msg}`);
  }
}
