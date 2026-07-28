import * as fs from 'fs';
import * as path from 'path';

function resolveCatalog(): void {
  const workspaceContent = fs.readFileSync('pnpm-workspace.yaml', 'utf8');
  const catalogLines = workspaceContent.split('catalog:')[1]?.split('\n') || [];
  const catalog: Record<string, string> = {};
  
  for (const line of catalogLines) {
    if (line.trim() === '' || line.trim().startsWith('#')) continue;
    const parts = line.split(':');
    if (parts.length >= 2) {
      const key = parts[0].trim();
      const val = parts.slice(1).join(':').trim().replace(/['"]/g, '');
      catalog[key] = val;
    }
  }

  const appsDir = 'apps';
  if (!fs.existsSync(appsDir)) return;
  const apps = fs.readdirSync(appsDir).filter(d => fs.statSync(path.join(appsDir, d)).isDirectory());

  for (const app of apps) {
    const pkgPath = path.join(appsDir, app, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    console.log(`Processing ${app}...`);
    let pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    let changed = false;

    for (const key of ['dependencies', 'devDependencies'] as const) {
      if (pkg[key]) {
        for (const dep in pkg[key]) {
          if (pkg[key][dep] === 'catalog:') {
            if (catalog[dep]) {
              pkg[key][dep] = catalog[dep];
              changed = true;
            } else {
              console.warn(`Warning: ${dep} not found in catalog for ${app}`);
            }
          }
        }
      }
    }

    if (changed) {
      fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
      console.log(`Updated ${app}`);
    }
  }
}

try {
  resolveCatalog();
} catch (e) {
  console.error(e);
}
