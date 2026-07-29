import sharp from 'sharp';
import { readdir } from 'fs/promises';
import { join, extname } from 'path';

const dir = 'public';
const files = await readdir(dir);
const images = files.filter(f => /\.(jpg|jpeg|png)$/i.test(f));

for (const file of images) {
  const path = join(dir, file);
  const info = await sharp(path).metadata();
  const sizeMB = Math.round((await import('fs')).statSync(path).size / 1024 / 1024);
  
  if (sizeMB <= 2) {
    console.log(`Skip ${file} (${sizeMB}MB) - already small`);
    continue;
  }

  const out = path.replace(/\.(jpg|jpeg|png)$/i, '_compressed.$1');
  await sharp(path)
    .resize({ width: 1600, withoutEnlargement: true })
    .jpeg({ quality: 70, progressive: true })
    .toFile(out);

  const newSize = Math.round((await import('fs')).statSync(out).size / 1024 / 1024);
  console.log(`Compressed ${file}: ${sizeMB}MB -> ${newSize}MB`);
}
