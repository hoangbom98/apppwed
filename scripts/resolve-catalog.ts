#!/usr/bin/env tsx
/**
 * scripts/resolve-catalog.ts — Giải quyết pnpm catalog: references trong package.json
 *
 * Đọc pnpm-workspace.yaml → lấy catalog, sau đó thay thế mọi `"dep": "catalog:"`
 * trong package.json của apps/ và packages/ bằng version thực tế.
 *
 * Usage:
 *   tsx scripts/resolve-catalog.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');

function resolveCatalog(): void {
  const workspacePath = path.join(ROOT_DIR, 'pnpm-workspace.yaml');
  if (!fs.existsSync(workspacePath)) {
    console.error(`[resolve-catalog] pnpm-workspace.yaml không tìm thấy tại: ${workspacePath}`);
    process.exit(1);
  }

  const workspaceContent = fs.readFileSync(workspacePath, 'utf8');
  const catalogSection = workspaceContent.split('catalog:')[1];
  if (!catalogSection) {
    console.warn('[resolve-catalog] Không tìm thấy section "catalog:" trong pnpm-workspace.yaml');
    return;
  }

  const catalogLines = catalogSection.split('\n');
  const catalog: Record<string, string> = {};

  for (const line of catalogLines) {
    const trimmed = line.trim();
    if (trimmed === '' || trimmed.startsWith('#')) continue;
    const colonIdx = trimmed.indexOf(':');
    if (colonIdx === -1) continue;
    const key = trimmed.slice(0, colonIdx).trim();
    const val = trimmed.slice(colonIdx + 1).trim().replace(/^['"]|['"]$/g, '');
    if (key && val) {
      catalog[key] = val;
    }
  }

  const searchDirs = ['apps', 'packages'];
  let totalUpdated = 0;

  for (const dir of searchDirs) {
    const absDir = path.join(ROOT_DIR, dir);
    if (!fs.existsSync(absDir)) continue;

    const entries = fs.readdirSync(absDir).filter(d =>
      fs.statSync(path.join(absDir, d)).isDirectory()
    );

    for (const entry of entries) {
      const pkgPath = path.join(absDir, entry, 'package.json');
      if (!fs.existsSync(pkgPath)) continue;

      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as Record<string, Record<string, string>>;
      let changed = false;

      for (const key of ['dependencies', 'devDependencies'] as const) {
        if (!pkg[key]) continue;
        for (const dep of Object.keys(pkg[key])) {
          if (pkg[key][dep] === 'catalog:') {
            if (catalog[dep]) {
              pkg[key][dep] = catalog[dep];
              changed = true;
            } else {
              console.warn(`[resolve-catalog] ⚠️  ${dir}/${entry}: "${dep}" không có trong catalog`);
            }
          }
        }
      }

      if (changed) {
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
        console.log(`[resolve-catalog] ✓ Đã cập nhật: ${dir}/${entry}/package.json`);
        totalUpdated++;
      }
    }
  }

  if (totalUpdated === 0) {
    console.log('[resolve-catalog] Không có package.json nào cần cập nhật.');
  } else {
    console.log(`[resolve-catalog] Hoàn tất: ${totalUpdated} file đã được cập nhật.`);
  }
}

try {
  resolveCatalog();
} catch (e) {
  console.error('[resolve-catalog] Lỗi:', (e as Error).message);
  process.exit(1);
}
