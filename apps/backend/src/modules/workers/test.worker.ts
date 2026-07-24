import { Worker, Queue } from 'bullmq';
import { redis } from '../../utils/redis';

// Queue for testing infrastructure
export const testQueue = new Queue('test-queue', { connection: redis });

// Worker that processes test jobs
export const testWorker = new Worker(
  'test-queue',
  async (job) => {
    console.log(`Test worker processed job: ${job.id}, data:`, job.data);
    return { success: true };
  },
  { connection: redis }
);

// To test: 
// import { testQueue } from './test.worker';
// await testQueue.add('test', { foo: 'bar' });
console.log('Test worker initialized');
