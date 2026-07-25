// @ts-nocheck
/**
 * frontend/shared-ui/utils/validators.js
 * ----------------------------------------
 * Yup schemas dùng chung cho tất cả sub-projects.
 * Import từ @ui: import { loginSchema, registerSchema, ... } from '@ui';
 */
import * as yup from 'yup';

// ── Field validators tái sử dụng ──────────────────────────────────────────
export const emailField = yup
  .string()
  .email('Email không hợp lệ')
  .required('Vui lòng nhập email');

export const passwordField = yup
  .string()
  .min(6, 'Mật khẩu tối thiểu 6 ký tự')
  .required('Vui lòng nhập mật khẩu');

export const usernameField = yup
  .string()
  .min(3, 'Ít nhất 3 ký tự')
  .max(30, 'Tối đa 30 ký tự')
  .required('Vui lòng nhập tên đăng nhập');

export const phoneField = yup
  .string()
  .matches(/^[0-9]{10,12}$/, 'Số điện thoại không hợp lệ (10–12 chữ số)')
  .nullable();

export const amountField = (min = 10_000, label = 'Số tiền') =>
  yup
    .number()
    .typeError(`${label} phải là số`)
    .min(min, `${label} tối thiểu ${min.toLocaleString('vi-VN')}`)
    .required(`Vui lòng nhập ${label.toLowerCase()}`);

// ── Form schemas ──────────────────────────────────────────────────────────

/** Schema đăng nhập bằng email + mật khẩu */
export const loginSchema = yup.object({
  email:    emailField,
  password: passwordField,
});

/** Schema đăng nhập bằng username + mật khẩu */
export const loginByUsernameSchema = yup.object({
  username: usernameField,
  password: passwordField,
});

/** Schema đăng ký tài khoản */
export const registerSchema = yup.object({
  username:     usernameField,
  email:        emailField,
  password:     passwordField,
  full_name:    yup.string().nullable(),
  phone:        phoneField,
  referral_code: yup.string().nullable(),
});

/** Schema đổi mật khẩu */
export const passwordChangeSchema = yup.object({
  old_password: yup.string().required('Nhập mật khẩu hiện tại'),
  new_password: passwordField,
  confirm:      yup
    .string()
    .oneOf([yup.ref('new_password')], 'Mật khẩu xác nhận không khớp')
    .required('Vui lòng xác nhận mật khẩu mới'),
});

/** Schema nạp tiền */
export const depositSchema = (min = 10_000) =>
  yup.object({
    amount: amountField(min, 'Số tiền nạp'),
  });

/** Schema rút tiền */
export const withdrawSchema = (min = 50_000, maxBalance = Infinity) =>
  yup.object({
    amount: yup
      .number()
      .typeError('Số tiền phải là số')
      .min(min, `Tối thiểu ${min.toLocaleString('vi-VN')}`)
      .max(maxBalance, 'Vượt quá số dư khả dụng')
      .required('Vui lòng nhập số tiền'),
    payment_method: yup.string().required('Chọn phương thức'),
    address:        yup.string().required('Nhập địa chỉ / số tài khoản'),
  });

/** Schema thêm tài khoản ngân hàng */
export const bankAccountSchema = yup.object({
  bank_code:      yup.string().required('Chọn ngân hàng'),
  account_number: yup.string().min(8, 'Số TK tối thiểu 8 ký tự').required('Nhập số tài khoản'),
  account_holder: yup.string().min(3, 'Tên tối thiểu 3 ký tự').required('Nhập tên chủ tài khoản'),
});
