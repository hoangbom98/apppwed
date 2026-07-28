#!/usr/bin/env node
/**
 * scripts/analyze-shared-deps.js — Phân tích dependency dùng chung
 *
 * Đọc tất cả package.json trong apps/ và packages/, tìm:
 *   1. Các dependency được dùng bởi >= 3 packages (ứng viên để đưa vào catalog)
 *   2. Các dependency có nhiều version khác nhau (cần đồng bộ)
 *
 * Usage:
 *   node scripts/analyze-shared-deps.js
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const SEARCH_DIRS = ['apps', 'packages'];
const allDeps = new Map();

function readJson(file) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.warn(`[analyze-shared-deps] Không đọc được: ${file} — ${e.message}`);
    return null;
  }
}

for (const dir of SEARCH_DIRS) {
  const abs = path.join(ROOT, dir);
  if (!fs.existsSync(abs)) continue;

  for (const entry of fs.readdirSync(abs)) {
    const entryPath = path.join(abs, entry);
    if (!fs.statSync(entryPath).isDirectory()) continue;

    const pkgPath = path.join(entryPath, 'package.json');
    if (!fs.existsSync(pkgPath)) continue;

    const pkg = readJson(pkgPath);
    if (!pkg) continue;

    const deps = { ...(pkg.dependencies || {}), ...(pkg.devDependencies || {}) };
    const label = `${dir}/${entry}`;

    for (const [name, version] of Object.entries(deps)) {
      if (!allDeps.has(name)) allDeps.set(name, { usedBy: [], versions: new Set() });
      const item = allDeps.get(name);
      item.usedBy.push(label);
      item.versions.add(version);
    }
  }
}

// ── Báo cáo 1: Dependency dùng bởi >= 3 packages ──────────────────────────────

const shared = [...allDeps.entries()]
  .filter(([, data]) => data.usedBy.length >= 3)
  .sort((a, b) => b[1].usedBy.length - a[1].usedBy.length || a[0].localeCompare(b[0]));

console.log(`\nDependencies dùng bởi >= 3 workspace packages/apps (${shared.length} found):`);
if (shared.length === 0) {
  console.log('  (không có)');
}
for (const [name, data] of shared) {
  console.log(`  - ${name} (${data.usedBy.length}): ${[...data.versions].join(', ')} — ${data.usedBy.join(', ')}`);
}

// ── Báo cáo 2: Dependency có nhiều version ────────────────────────────────────

const mismatched = [...allDeps.entries()]
  .filter(([, data]) => data.versions.size > 1)
  .sort((a, b) => b[1].usedBy.length - a[1].usedBy.length || a[0].localeCompare(b[0]));

console.log(`\nDependencies có nhiều version cần đồng bộ (${mismatched.length} found):`);
if (mismatched.length === 0) {
  console.log('  ✅ Tất cả dependency đã đồng bộ version');
}
for (const [name, data] of mismatched) {
  console.log(`  - ${name}: ${[...data.versions].join(', ')} — ${data.usedBy.join(', ')}`);
}
