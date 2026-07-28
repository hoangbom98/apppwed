#!/usr/bin/env node
/**
 * LKVIP Project Cleanup Script
 * ─────────────────────────────────────────────────────────────────────────────
 * Mô tả : Dọn dẹp whitespace thừa, file rỗng, và thư mục rỗng trong project.
 * Sử dụng:
 *   node scripts/cleanup.mjs          → dry-run (chỉ xem, không thay đổi)
 *   node scripts/cleanup.mjs --run    → thực thi thật (có hỏi xác nhận trước)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

// ─── CẤU HÌNH ────────────────────────────────────────────────────────────────

const IGNORE_DIRS = new Set([
  'node_modules', '.git', 'dist', 'build', '.cache',
  '.next', 'coverage', '.turbo', '.prisma',
]);

// Prefix thư mục KHÔNG xóa dù rỗng — đây là placeholder cấu trúc code
const KEEP_EMPTY_DIR_PREFIXES = [
  'apps/backend/src/',
  'apps/hub/src/',
  'apps/game/src/',
  'apps/trading/src/',
  'apps/dating/src/',
  'apps/sports/src/',
  'apps/admin-dashboard/src/',
  'packages/',
];

const TEXT_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.json', '.jsonc',
  '.css', '.scss', '.sass', '.less',
  '.html', '.htm',
  '.md', '.mdx',
  '.prisma',
  '.toml', '.yaml', '.yml',
  '.sh', '.bash',
  '.sql',
]);

// Files không có extension (hoặc là dotfiles) cần xử lý
const EXTENSIONLESS_NAMES = new Set([
  '.prettierrc', '.eslintrc', '.oxlintrc', '.editorconfig',
  '.gitignore', '.npmrc', '.nvmrc', '.env.example',
  'Makefile', 'Dockerfile',
]);

const IS_DRY_RUN = !process.argv.includes('--run');

// ─── THỐNG KÊ ────────────────────────────────────────────────────────────────

const stats = {
  filesScanned: 0,
  filesModified: 0,
  emptyFilesDeleted: 0,
  emptyDirsDeleted: 0,
  bytesSaved: 0,
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function shouldIgnoreDir(name) {
  return IGNORE_DIRS.has(name);
}

function isTextFile(filePath) {
  const base = path.basename(filePath);
  if (EXTENSIONLESS_NAMES.has(base)) return true;
  const ext = path.extname(filePath).toLowerCase();
  return TEXT_EXTENSIONS.has(ext);
}

function isEffectivelyEmpty(content) {
  return content.trim().length === 0;
}

/**
 * Dọn dẹp whitespace trong nội dung file:
 * 1. Xóa trailing whitespace mỗi dòng
 * 2. Rút gọn 3+ dòng trắng liên tiếp → còn tối đa 1 dòng trắng
 * 3. Chỉ giữ đúng 1 newline ở cuối file
 */
function cleanWhitespace(content) {
  // Bước 1: Xóa trailing whitespace từng dòng
  let cleaned = content.replace(/[ \t]+$/gm, '');

  // Bước 2: Rút gọn 3+ newlines liên tiếp → 2 (= 1 blank line)
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');

  // Bước 3: Cuối file chỉ giữ 1 newline
  cleaned = cleaned.replace(/\n+$/, '\n');

  return cleaned;
}

// ─── WALK THƯ MỤC ────────────────────────────────────────────────────────────

function walkDir(dir, fileCallback) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (!shouldIgnoreDir(entry.name)) {
        walkDir(fullPath, fileCallback);
      }
    } else if (entry.isFile()) {
      fileCallback(fullPath);
    }
  }
}

// ─── BƯỚC 1: DỌN WHITESPACE ──────────────────────────────────────────────────

function processWhitespace(dryRun) {
  console.log('\n━━━ BƯỚC 1: Quét và dọn whitespace thừa ━━━\n');
  let count = 0;

  walkDir(ROOT, (filePath) => {
    if (!isTextFile(filePath)) return;

    let content;
    try {
      content = fs.readFileSync(filePath, 'utf8');
    } catch {
      return;
    }

    if (isEffectivelyEmpty(content)) return;

    stats.filesScanned++;
    const cleaned = cleanWhitespace(content);

    if (cleaned !== content) {
      const saved = Buffer.byteLength(content, 'utf8') - Buffer.byteLength(cleaned, 'utf8');
      stats.filesModified++;
      stats.bytesSaved += saved;
      count++;
      const rel = path.relative(ROOT, filePath);
      const tag = dryRun ? '\x1b[33m[DRY-RUN]\x1b[0m' : '\x1b[32m[ĐÃ SỬA]\x1b[0m';
      console.log(`  ${tag} ${rel}  \x1b[90m(tiết kiệm ${saved} bytes)\x1b[0m`);
      if (!dryRun) {
        fs.writeFileSync(filePath, cleaned, 'utf8');
      }
    }
  });

  if (count === 0) console.log('  \x1b[90m(không có file nào cần dọn whitespace)\x1b[0m');
}

// ─── BƯỚC 2: XÓA FILE RỖNG ───────────────────────────────────────────────────

function processEmptyFiles(dryRun) {
  console.log('\n━━━ BƯỚC 2: Tìm và xóa file rỗng ━━━\n');
  let count = 0;

  walkDir(ROOT, (filePath) => {
    let isEmpty = false;

    try {
      const stat = fs.statSync(filePath);
      if (stat.size === 0) {
        isEmpty = true;
      } else if (isTextFile(filePath)) {
        const content = fs.readFileSync(filePath, 'utf8');
        if (isEffectivelyEmpty(content)) isEmpty = true;
      }
    } catch {
      return;
    }

    if (isEmpty) {
      count++;
      stats.emptyFilesDeleted++;
      const rel = path.relative(ROOT, filePath);
      const tag = dryRun ? '\x1b[33m[DRY-RUN] Sẽ xóa\x1b[0m' : '\x1b[31m[ĐÃ XÓA]\x1b[0m ';
      console.log(`  ${tag} file rỗng: ${rel}`);
      if (!dryRun) {
        try { fs.unlinkSync(filePath); } catch (e) {
          console.log(`  \x1b[31m⚠️  Không thể xóa: ${rel} — ${e.message}\x1b[0m`);
        }
      }
    }
  });

  if (count === 0) console.log('  \x1b[90m(không có file rỗng nào)\x1b[0m');
}

// ─── BƯỚC 3: XÓA THƯ MỤC RỖNG (ĐỆ QUY) ──────────────────────────────────────

function removeEmptyDirsRecursive(dir, dryRun) {
  if (shouldIgnoreDir(path.basename(dir))) return false;

  let entries;
  try {
    entries = fs.readdirSync(dir);
  } catch {
    return false;
  }

  if (entries.length === 0) return true;

  for (const entry of entries) {
    const fullPath = path.join(dir, entry);
    let stat;
    try { stat = fs.statSync(fullPath); } catch { continue; }

    if (stat.isDirectory() && !shouldIgnoreDir(entry)) {
      const childEmpty = removeEmptyDirsRecursive(fullPath, dryRun);
      if (childEmpty) {
        const rel = path.relative(ROOT, fullPath);
        const isCodeStructure = KEEP_EMPTY_DIR_PREFIXES.some((p) => rel.startsWith(p));
        if (!isCodeStructure) {
          stats.emptyDirsDeleted++;
          const tag = dryRun ? '\x1b[33m[DRY-RUN] Sẽ xóa\x1b[0m' : '\x1b[31m[ĐÃ XÓA]\x1b[0m ';
          console.log(`  ${tag} thư mục rỗng: ${rel}/`);
          if (!dryRun) {
            try { fs.rmdirSync(fullPath); } catch { /* already removed or non-empty */ }
          }
        }
      }
    }
  }

  try {
    return fs.readdirSync(dir).length === 0;
  } catch {
    return false;
  }
}

function processEmptyDirs(dryRun) {
  console.log('\n━━━ BƯỚC 3: Tìm và xóa thư mục rỗng ━━━\n');
  const before = stats.emptyDirsDeleted;
  removeEmptyDirsRecursive(ROOT, dryRun);
  if (stats.emptyDirsDeleted === before) {
    console.log('  \x1b[90m(không có thư mục rỗng nào)\x1b[0m');
  }
}

// ─── BÁO CÁO ─────────────────────────────────────────────────────────────────

function printReport(dryRun) {
  const mode = dryRun
    ? '\x1b[33mDRY-RUN — chưa thay đổi gì\x1b[0m'
    : '\x1b[32mĐÃ THỰC THI\x1b[0m';
  const kb = (stats.bytesSaved / 1024).toFixed(2);

  console.log('\n' + '═'.repeat(58));
  console.log(`  BÁO CÁO DỌN DẸP — Chế độ: ${mode}`);
  console.log('═'.repeat(58));
  console.log(`  📁 Tổng file text đã quét    : ${stats.filesScanned}`);
  console.log(`  ✏️  File có whitespace thừa   : ${stats.filesModified}`);
  console.log(`  🗑️  File rỗng đã xóa          : ${stats.emptyFilesDeleted}`);
  console.log(`  📂 Thư mục rỗng đã xóa       : ${stats.emptyDirsDeleted}`);
  console.log(`  💾 Dung lượng tiết kiệm       : ${kb} KB (${stats.bytesSaved} bytes)`);
  console.log('═'.repeat(58));

  if (dryRun) {
    if (stats.filesModified + stats.emptyFilesDeleted + stats.emptyDirsDeleted > 0) {
      console.log('\n  \x1b[36m✅ Để áp dụng thật, chạy:\x1b[0m');
      console.log('     \x1b[1mnode scripts/cleanup.mjs --run\x1b[0m\n');
    } else {
      console.log('\n  \x1b[32m✅ Project đã sạch — không có gì cần dọn.\x1b[0m\n');
    }
  } else {
    console.log('\n  \x1b[32m✅ Hoàn tất! Project đã được dọn dẹp.\x1b[0m\n');
  }
}

// ─── XÁC NHẬN NGƯỜI DÙNG ─────────────────────────────────────────────────────

async function askConfirm(question) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(question, (ans) => {
      rl.close();
      resolve(ans.trim().toLowerCase() === 'y');
    });
  });
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log('');
  console.log('╔══════════════════════════════════════════════════════╗');
  console.log('║        LKVIP PROJECT CLEANUP SCRIPT                 ║');
  console.log('║  Dọn dẹp whitespace · file rỗng · thư mục rỗng      ║');
  console.log(`║  Chế độ: ${IS_DRY_RUN
    ? 'DRY-RUN (chỉ xem, không sửa gì)         '
    : 'THỰC THI (sẽ thay đổi file thật!)       '}║`);
  console.log('╚══════════════════════════════════════════════════════╝');
  console.log(`  Thư mục gốc : ${ROOT}`);
  console.log(`  Bỏ qua      : ${[...IGNORE_DIRS].join(', ')}\n`);

  if (IS_DRY_RUN) {
    // Chỉ dry-run: liệt kê và báo cáo, không ghi file
    processWhitespace(true);
    processEmptyFiles(true);
    processEmptyDirs(true);
    printReport(true);
    return;
  }

  // --run: scan với dry-run=true trước để thống kê
  console.log('  🔍 Đang quét để xem trước (dry-run)...');
  processWhitespace(true);
  processEmptyFiles(true);
  processEmptyDirs(true);
  printReport(true);

  if (stats.filesModified + stats.emptyFilesDeleted + stats.emptyDirsDeleted === 0) {
    return;
  }

  const ok = await askConfirm('  ❓ Xác nhận thực hiện tất cả thay đổi trên? [y/N]: ');
  if (!ok) {
    console.log('\n  ❌ Đã hủy. Không có thay đổi nào được thực hiện.\n');
    process.exit(0);
  }

  // Reset stats rồi chạy thật với dryRun=false
  Object.assign(stats, {
    filesScanned: 0, filesModified: 0,
    emptyFilesDeleted: 0, emptyDirsDeleted: 0, bytesSaved: 0,
  });

  console.log('\n  🚀 Đang thực thi...\n');
  processWhitespace(false);
  processEmptyFiles(false);
  processEmptyDirs(false);
  printReport(false);
}

main().catch((err) => {
  console.error(`\n  ❌ Lỗi: ${err.message}\n`);
  process.exit(1);
});
