import { Orchestrator } from './skill-core/orchestrator';

const orchestrator = new Orchestrator();

// List of all apps to scan
const apps = ['backend', 'hub', 'game', 'sports', 'trade', 'dating', 'admin-dashboard'];

// If "--fix" argument is passed, enable auto-fix
const shouldFix = process.argv.includes('--fix');

// Parse "--only" argument
const onlyIndex = process.argv.indexOf('--only');
const only = onlyIndex !== -1 ? process.argv[onlyIndex + 1]?.split(',') : undefined;

orchestrator.run(apps, {
  fix: shouldFix,
  only,
}).then((results) => {
  const totalErrors = results.reduce((sum, r) => sum + r.summary.totalErrors, 0);
  
  console.log(`\n📈 Scan complete: ${totalErrors} errors found.`);
  process.exit(totalErrors === 0 ? 0 : 1);
}).catch((error) => {
  console.error('❌ Scan failed:', error);
  process.exit(1);
});
