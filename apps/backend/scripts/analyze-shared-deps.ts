import * as fs from 'fs';
import * as path from 'path';

const root = path.resolve(__dirname, '../../..');
const roots = ['apps', 'packages'];
const allDeps = new Map<string, { usedBy: string[], versions: Set<string> }>();

function readJson(file: string): any {
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

for (const dir of roots) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) continue;

  for (const entry of fs.readdirSync(abs)) {
    const pkgPath = path.join(abs, entry, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = readJson(pkgPath);
    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const label = `${dir}/${entry}`;

    for (const [name, version] of Object.entries(deps) as [string, string][]) {
      if (!allDeps.has(name)) allDeps.set(name, { usedBy: [], versions: new Set() });
      const item = allDeps.get(name)!;
      item.usedBy.push(label);
      item.versions.add(version);
    }
  }
}

const shared = [...allDeps.entries()]
  .filter(([, data]) => data.usedBy.length >= 3)
  .sort((a, b) => b[1].usedBy.length - a[1].usedBy.length || a[0].localeCompare(b[0]));

console.log('Dependencies dùng bởi >= 3 workspace packages/apps:');
for (const [name, data] of shared) {
  console.log(`- ${name} (${data.usedBy.length}): ${[...data.versions].join(', ')} — ${data.usedBy.join(', ')}`);
}

const mismatched = [...allDeps.entries()]
  .filter(([, data]) => data.versions.size > 1)
  .sort((a, b) => b[1].usedBy.length - a[1].usedBy.length || a[0].localeCompare(b[0]));

console.log('\nDependencies có nhiều version cần review:');
for (const [name, data] of mismatched) {
  console.log(`- ${name}: ${[...data.versions].join(', ')} — ${data.usedBy.join(', ')}`);
}
