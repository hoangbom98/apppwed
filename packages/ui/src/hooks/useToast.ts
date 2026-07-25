// packages/shared-ui/src/hooks/useToast.ts
// Toast hook — returns { toast } object used by sports/game apps
import { message } from 'antd';

const toast = {
  success: (msg: string) => message.success(msg),
  error:   (msg: string) => message.error(msg),
  info:    (msg: string) => message.info(msg),
  warning: (msg: string) => message.warning(msg),
};

// Named export for: const { toast } = useToast()
export const useToast = () => ({ toast });
// Direct export for: import toast from '...'
export { toast };
