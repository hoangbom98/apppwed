// @ts-nocheck
// frontend/admin-dashboard/src/modules/shared/api/mineApi.ts
// All Mine (personal profile) API calls — maps to /api/admin/mine/*
import api from '@admin/api/client';

const BASE = '/admin/mine';

// Profile
export const getProfile         = ()                 => api.get(`${BASE}/profile`);
export const updateProfile      = (data: unknown)    => api.patch(`${BASE}/profile`, data);

// Balance
export const getBalance         = ()                 => api.get(`${BASE}/balance`);

// VIP
export const getVip             = ()                 => api.get(`${BASE}/vip`);
export const getVipConfigs      = ()                 => api.get(`${BASE}/vip-configs`);
export const updateVipConfig    = (id: string | number, data: unknown) => api.put(`${BASE}/vip-configs/${id}`, data);

// Transactions
export const getTransactions    = (params?: unknown) => api.get(`${BASE}/transactions`, { params });

// Referrals
export const getReferrals       = ()                 => api.get(`${BASE}/referrals`);

// Notifications
export const getNotifications   = (params?: unknown) => api.get(`${BASE}/notifications`, { params });
export const markNotificationRead = (id: string | number) => api.patch(`${BASE}/notifications/${id}/read`);

// Support tickets
export const getTickets         = (params?: unknown) => api.get(`${BASE}/tickets`, { params });
export const createTicket       = (data: unknown)    => api.post(`${BASE}/tickets`, data);

// Devices
export const getDevices         = ()                 => api.get(`${BASE}/devices`);
export const removeDevice       = (id: string | number) => api.delete(`${BASE}/devices/${id}`);
