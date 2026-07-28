import chalk from 'chalk';

export const logger = {
  info: (message: string) => console.log(`${chalk.green('[INFO]')} ${message}`),
  warn: (message: string) => console.log(`${chalk.yellow('[WARN]')} ${message}`),
  error: (message: string) => console.error(`${chalk.red('[ERROR]')} ${message}`),
  step: (message: string) => console.log(`\n${chalk.cyan.bold('━━━ ' + message + ' ━━━')}\n`),
};
