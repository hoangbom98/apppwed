import { getBaseViteConfig } from '@lkvip/config/vite-config';
import { mergeConfig } from 'vite';

export default mergeConfig(getBaseViteConfig(), {
  server: {
    port: 3002,
  },
});
