// packages/shared-ui/src/validators.ts
// Yup validation schemas — shared across all frontend apps
import * as yup from 'yup';

export const emailField = yup.string().email('Email không hợp lệ').required('Vui lòng nhập email');
export const passwordField = yup.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').required('Vui lòng nhập mật khẩu');
export const usernameField = yup.string().min(3, 'Tên đăng nhập tối thiểu 3 ký tự').max(30).required('Vui lòng nhập tên đăng nhập');
export const phoneField = yup.string().matches(/^[0-9]{9,12}$/, 'Số điện thoại không hợp lệ').required('Vui lòng nhập số điện thoại');
export const amountField = yup.number().positive('Số tiền phải > 0').required('Vui lòng nhập số tiền');

export const loginSchema = yup.object({
  email:    emailField,
  password: passwordField,
});

export const loginByUsernameSchema = yup.object({
  username: usernameField,
  password: passwordField,
});

export const registerSchema = yup.object({
  username:        usernameField,
  email:           emailField,
  password:        passwordField,
  confirmPassword: yup.string().oneOf([yup.ref('password')], 'Mật khẩu không khớp').required('Vui lòng xác nhận mật khẩu'),
  phone:           phoneField.optional(),
});

export const passwordChangeSchema = yup.object({
  currentPassword: passwordField,
  newPassword:     yup.string().min(8, 'Mật khẩu tối thiểu 8 ký tự').required('Vui lòng nhập mật khẩu mới'),
  confirmPassword: yup.string().oneOf([yup.ref('newPassword')], 'Mật khẩu không khớp').required(),
});

export const depositSchema = yup.object({
  amount: amountField,
  method: yup.string().required('Vui lòng chọn phương thức'),
});

export const withdrawSchema = yup.object({
  amount:         amountField,
  method:         yup.string().required('Vui lòng chọn phương thức'),
  bankAccount:    yup.string().optional(),
});

export const bankAccountSchema = yup.object({
  bankName:      yup.string().required('Vui lòng nhập tên ngân hàng'),
  accountNumber: yup.string().required('Vui lòng nhập số tài khoản'),
  accountName:   yup.string().required('Vui lòng nhập tên chủ tài khoản'),
});
