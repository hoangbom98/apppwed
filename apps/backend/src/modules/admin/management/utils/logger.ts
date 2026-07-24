/**
 * logger.ts — Color output helpers matching _common.sh style
 *
 * Uses chalk v4 (CommonJS-compatible).
 */

import chalk from 'chalk';

const timestamp = () => chalk.green(`[${new Date().toTimeString().slice(0, 8)}]`);

/** Informational line — green timestamp prefix */
export const log  = (...args: unknown[]) => console.log(timestamp(), ...args);

/** Success — green checkmark */
export const ok   = (...args: unknown[]) => console.log(chalk.green('  ✅', ...args));

/** Warning — yellow, to stderr */
export const warn = (...args: unknown[]) => console.warn(chalk.yellow('  ⚠️ ', ...args));

/** Neutral detail — blue, no timestamp */
export const info = (...args: unknown[]) => console.log(chalk.blue('    ', ...args));

/** Fatal error — prints and throws (caller decides whether to process.exit) */
export const die  = (msg: string, code = 1): never => {
  console.error(chalk.red('  ❌ ERROR:', msg));
  process.exit(code);
};

/** Section banner — cyan box */
export const header = (title: string) => {
  console.log(chalk.cyan('\n' + '═'.repeat(55)));
  console.log(chalk.cyan('  ' + title));
  console.log(chalk.cyan('═'.repeat(55) + '\n'));
};

/** Step indicator: [n/total] Title */
export const step = (n: number, total: number, title: string) => {
  console.log(`\n${chalk.cyan(`[${n}/${total}]`)} ${chalk.bold(title)}`);
};
