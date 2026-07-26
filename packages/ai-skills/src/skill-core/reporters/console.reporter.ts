import { ScanResult } from '../orchestrator';

export class ConsoleReporter {
  async report(results: ScanResult[]) {
    console.log('\n📊 === LKVIP AI HEALTH SCAN RESULTS ===\n');

    for (const result of results) {
      const status = result.summary.totalErrors === 0 ? '✅' : '❌';
      console.log(`${status} [${result.app.toUpperCase()}]`);
      console.log(`   Errors: ${result.summary.totalErrors}, Warnings: ${result.summary.totalWarnings}`);

      if (result.errors.length > 0) {
        console.log(`\n   🔴 ERRORS:`);
        for (const error of result.errors) {
          console.log(`   - [${error.type}] ${error.message}`);
          if (error.fix) {
            console.log(`     💡 Fix suggestion: ${error.fix.description}`);
          }
        }
      }

      if (result.warnings.length > 0) {
        console.log(`\n   🟡 WARNINGS:`);
        for (const warning of result.warnings) {
          console.log(`   - ${warning.message}`);
          console.log(`     💡 Suggestion: ${warning.suggestion}`);
        }
      }
      console.log('------------------------------------------');
    }
  }
}
