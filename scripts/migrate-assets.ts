#!/usr/bin/env ts-node
import * as fs from 'fs';
import * as path from 'path';

const sourceDir = '/var/www/wap/src/assets';
const targetDir = '/var/LKVIP/apps/game/src/assets';

// Hàm chuẩn hóa tên tệp theo định dạng kebab-case chuẩn quốc tế
function normalizeFileName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-') // Thay thế ký tự đặc biệt bằng dấu gạch ngang
    .replace(/-+/g, '-')          // Loại bỏ các dấu gạch ngang trùng lặp
    .replace(/^-|-$/g, '');       // Loại bỏ dấu gạch ngang ở đầu/cuối
}

function migrateFolder(subFolder: string) {
  const srcPath = path.join(sourceDir, subFolder);
  const destPath = path.join(targetDir, subFolder);

  if (!fs.existsSync(srcPath)) return;
  if (!fs.existsSync(destPath)) fs.mkdirSync(destPath, { recursive: true });

  const files = fs.readdirSync(srcPath);
  console.log(`Processing folder: ${subFolder}`);

  for (const file of files) {
    const srcFile = path.join(srcPath, file);
    if (fs.statSync(srcFile).isDirectory()) continue;

    const normalizedName = normalizeFileName(file);
    const destFile = path.join(destPath, normalizedName);

    fs.copyFileSync(srcFile, destFile);
    console.log(`Copied & Normalized: ${file} -> ${normalizedName}`);
  }
}

function main() {
  console.log('Starting Asset Migration...');
  // Di chuyển đồng loạt các thư mục tài nguyên quan trọng
  const folders = ['images', 'png', 'lottie', 'css'];
  for (const folder of folders) {
    migrateFolder(folder);
  }
  console.log('Asset Migration Completed.');
}

main();
