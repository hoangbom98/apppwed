import dotenv from 'dotenv';
import path from 'path';

export const loadEnv = (backendDir = 'apps/backend') => {
  const envPath = path.resolve(process.cwd(), backendDir, '.env');
  dotenv.config({ path: envPath });
};
