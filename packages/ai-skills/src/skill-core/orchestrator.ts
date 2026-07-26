import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { TypeScriptAnalyzer } from './analyzers/typescript.analyzer';
import { BuildAnalyzer } from './analyzers/build.analyzer';
import { DependencyAnalyzer } from './analyzers/dependency.analyzer';
import { DatabaseAnalyzer } from './analyzers/database.analyzer';
import { RuntimeAnalyzer } from './analyzers/runtime.analyzer';
import { SecurityAnalyzer } from './analyzers/security.analyzer';
import { ConsoleReporter } from './reporters/console.reporter';
import { MarkdownReporter } from './reporters/markdown.reporter';
import { TelegramReporter } from './reporters/telegram.reporter';

export interface ScanResult {
  timestamp: string;
  app: string;
  errors: Array<{
    type: 'ts' | 'build' | 'dep' | 'db' | 'runtime' | 'security';
    file?: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
    fix?: {
      description: string;
      command?: string;
      steps?: string[];
      autoFix?: boolean;
    };
  }>;
  warnings: Array<{ message: string; suggestion: string }>;
  summary: {
    totalErrors: number;
    totalWarnings: number;
    fixable: number;
  };
}

export class Orchestrator {
  private analyzers = [
    new TypeScriptAnalyzer(),
    new BuildAnalyzer(),
    new DependencyAnalyzer(),
    new DatabaseAnalyzer(),
    new RuntimeAnalyzer(),
    new SecurityAnalyzer(),
  ];
  private reporters = [
    new ConsoleReporter(),
    new MarkdownReporter(),
    new TelegramReporter(),
  ];

  async run(apps: string[], options: { fix?: boolean; report?: 'console' | 'markdown' | 'telegram' | 'all'; only?: string[] } = {}) {
    const results: ScanResult[] = [];

    // Filter analyzers if 'only' option is provided
    const activeAnalyzers = options.only 
      ? this.analyzers.filter(a => options.only!.includes(a.constructor.name.replace('Analyzer', '').toLowerCase()))
      : this.analyzers;

    console.log(`🔍 Scanning ${apps.length} applications...`);

    for (const app of apps) {
      console.log(`\n📂 Scanning ${app}...`);
      const result: ScanResult = {
        timestamp: new Date().toISOString(),
        app,
        errors: [],
        warnings: [],
        summary: { totalErrors: 0, totalWarnings: 0, fixable: 0 },
      };

      // Run each analyzer
      for (const analyzer of activeAnalyzers) {
        try {
          const analysis = await analyzer.analyze(app);
          result.errors.push(...analysis.errors);
          result.warnings.push(...analysis.warnings);
        } catch (error: any) {
          console.error(`❌ Analyzer failed for ${app}: ${error.message}`);
        }
      }

      // Calculate summary
      result.summary.totalErrors = result.errors.length;
      result.summary.totalWarnings = result.warnings.length;
      result.summary.fixable = result.errors.filter(e => e.fix).length;

      // Auto-fix if requested
      if (options.fix) {
        for (const error of result.errors) {
          if (error.fix?.autoFix) {
            await this.applyFix(error, app);
          }
        }
      }

      results.push(result);
    }

    // Report
    for (const reporter of this.reporters) {
      await reporter.report(results);
    }

    return results;
  }

  private async applyFix(error: any, app: string) {
    console.log(`🔧 Fixing: ${error.fix.description}`);
    try {
      if (error.fix.command) {
        const cmd = error.fix.command.replace('{app}', app);
        // Execute from project root (up two levels from packages/ai-skills/src/skill-core)
        execSync(cmd, { stdio: 'inherit', cwd: path.join(process.cwd(), '../..') });
      }
      if (error.fix.steps) {
        for (const step of error.fix.steps) {
          console.log(`  - ${step}`);
          // Execute each step if it contains a command in backticks
          const cmd = step.match(/`([^`]+)`/)?.[1];
          if (cmd) {
            const finalCmd = cmd.replace('{app}', app);
            execSync(finalCmd, { stdio: 'inherit' });
          }
        }
      }
      console.log(`✅ Fixed: ${error.fix.description}`);
    } catch (e: any) {
      console.log(`❌ Failed to fix: ${e.message}`);
    }
  }
}
