import api from './client';

export interface LoginPayload  { phone?: string; email?: string; password?: string; }
export interface RegisterPayload {
  phone: string; otp: string; full_name: string; dob: string;
  gender: string; city: string; avatar?: string;
}

export const sendOtp       = (phone: string) => api.post('/dating/auth/send-otp', { phone }).then(r => r.data);
export const verifyOtp     = (phone: string, otp: string) => api.post('/dating/auth/verify-otp', { phone, otp }).then(r => r.data);
export const login         = (data: LoginPayload) => api.post('/dating/auth/login', data).then(r => r.data);
export const register      = (data: RegisterPayload) => api.post('/dating/auth/register', data).then(r => r.data);
export const getProfile    = () => api.get('/dating/auth/me').then(r => r.data);
export const updateProfile = (data: any) => api.put('/dating/auth/profile', data).then(r => r.data);
export const uploadAvatar  = (form: FormData) => api.post('/dating/auth/avatar', form, {
  headers: { 'Content-Type': 'multipart/form-data' }
}).then(r => r.data);
export const completeOnboarding = (data: { goals: string[]; interests: string[]; gender_pref: string }) =>
  api.post('/dating/auth/onboarding', data).then(r => r.data);
