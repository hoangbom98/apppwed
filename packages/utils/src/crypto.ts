import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';
// Lưu ý: Trong production, KEY phải là 32 bytes từ biến môi trường
// process.env.ENCRYPTION_KEY!
const getEncKey = () => Buffer.from(process.env.ENCRYPTION_KEY!, 'hex');

export const encrypt = (text: string) => {
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, getEncKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex') + ':' + cipher.getAuthTag().toString('hex');
};

export const decrypt = (encryptedText: string) => {
  const [iv, encrypted, tag] = encryptedText.split(':');
  const decipher = createDecipheriv(ALGO, getEncKey(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted, 'hex')),
    decipher.final(),
  ]);
  return decrypted.toString('utf8');
};
