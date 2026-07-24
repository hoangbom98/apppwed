// game/src/utils/xacThuc.ts — validators re-exported from shared-ui
// All Yup schemas are canonical in @ui (shared-ui/utils/validators.js)
export {
  loginSchema,
  loginByUsernameSchema,
  registerSchema,
  passwordChangeSchema as changePasswordSchema,
  passwordChangeSchema,
  depositSchema,
  withdrawSchema,
  bankAccountSchema,
  emailField,
  passwordField,
  usernameField,
  phoneField,
  amountField,
} from '@ui';
