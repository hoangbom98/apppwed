import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'fs';
import { join, resolve } from 'path';

const dir = resolve('src');
const files = globSync('**/*.tsx', { cwd: dir }).map(f => join(dir, f));

const replacements = [
  { from: '[Insert Date]', to: '[INSERT DATE]' },
  { from: '[Insert Privacy Email]', to: '[INSERT PRIVACY EMAIL]' },
  { from: '[Insert Legal Email]', to: '[INSERT LEGAL EMAIL]' },
  { from: '[Insert Office Address]', to: '[INSERT OFFICE ADDRESS]' },
  { from: '[FOUNDER / CEO NAME]', to: '[INSERT FOUNDER / CEO NAME]' },
  { from: '[Founder / CEO Name]', to: '[INSERT FOUNDER / CEO NAME]' },
  { from: '[he/she]', to: '[INSERT NAME]' },
  { from: '[His/Her]', to: '[INSERT NAME]' },
  { from: '[his/her]', to: '[INSERT NAME]' },
];

for (const file of files) {
  let content = readFileSync(file, 'utf-8');
  let changed = false;
  for (const { from, to } of replacements) {
    if (content.includes(from)) {
      content = content.split(from).join(to);
      changed = true;
    }
  }
  if (changed) {
    writeFileSync(file, content, 'utf-8');
    console.log('Updated:', file);
  }
}

console.log('Done.');
