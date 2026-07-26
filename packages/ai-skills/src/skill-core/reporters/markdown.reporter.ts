import fs from 'fs';
import { ScanResult } from '../orchestrator';

export class MarkdownReporter {
  async report(results: ScanResult[]) {
    let md = '# 🔍 LKVIP Health Check Report\n\n';
    md += `Generated: ${new Date().toISOString()}\n\n`;

    for (const result of results) {
      const status = result.summary.totalErrors === 0 ? '✅' : '❌';
      md += `## ${status} ${result.app.toUpperCase()}\n\n`;
      md += `- **Errors**: ${result.summary.totalErrors}\n`;
      md += `- **Warnings**: ${result.summary.totalWarnings}\n\n`;

      if (result.errors.length > 0) {
        md += `### 🔴 Errors\n\n`;
        for (const error of result.errors) {
          md += `- **${error.type}**: ${error.message}\n`;
          if (error.fix) {
            md += `  - 💡 *Fix*: ${error.fix.description}\n`;
          }
        }
        md += '\n';
      }
    }

    fs.writeFileSync('health-report.md', md);
    console.log('📄 Report saved to health-report.md');
  }
}
