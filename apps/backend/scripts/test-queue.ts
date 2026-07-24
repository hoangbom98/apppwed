import { testQueue } from '../src/modules/workers/test.worker';

async function runTest() {
  console.log('Adding job to test queue...');
  await testQueue.add('test', { foo: 'bar' });
  console.log('Job added.');
  process.exit(0);
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
