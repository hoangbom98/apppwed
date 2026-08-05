import client from '@admin/api/client';

type APIParams = Record<string, unknown>;
type APIBody   = Record<string, unknown>;

export const adminDatingUsers = {
  list:   (params: APIParams) => client.get('/admin/users', { params: { ...params, project: 'dating' } }),
  update: (id: string | number, body: APIBody) => client.patch(`/admin/users/${id}/status`, body),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

const resource = (path: string) => ({
  list:   (params: APIParams) => client.get(path, { params }),
  get:    (id: string | number) => client.get(`${path}/${id}`),
  create: (body: APIBody)       => client.post(path, body),
  update: (id: string | number, body: APIBody) => client.put(`${path}/${id}`, body),
  remove: (id: string | number) => client.delete(`${path}/${id}`),
});

export const adminDatingProfiles = {
  list:   (params: APIParams) => client.get('/dating/admin/profiles', { params }),
  get:    (id: string | number) => client.get(`/dating/admin/profiles/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, body: APIBody) => client.patch(`/dating/admin/profiles/${id}`, body),
  remove: (id: string | number) => client.delete(`/dating/admin/profiles/${id}`),
};

export const adminDatingMatches = {
  list:   (params: APIParams) => client.get('/dating/admin/matches', { params }),
  get:    (id: string | number) => client.get(`/dating/admin/matches/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: (id: string | number) => client.delete(`/dating/admin/matches/${id}`),
};

export const adminDatingGifts = resource('/dating/admin/gifts');

export const adminDatingMoments = {
  list:   (params: APIParams) => client.get('/dating/admin/moments', { params }),
  get:    (id: string | number) => client.get(`/dating/admin/moments/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, body: APIBody) => client.patch(`/dating/admin/moments/${id}`, body),
  remove: (id: string | number) => client.delete(`/dating/admin/moments/${id}`),
};

export const adminDatingReports = {
  list:   (params: APIParams) => client.get('/dating/admin/reports', { params }),
  get:    (id: string | number) => client.get(`/dating/admin/reports/${id}`),
  create: () => Promise.reject(new Error('Not supported')),
  update: (id: string | number, body: APIBody) => client.patch(`/dating/admin/reports/${id}`, body),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const adminDatingLive = {
  list:   (params: APIParams) => client.get('/dating/admin/live', { params }),
  create: () => Promise.reject(new Error('Not supported')),
  update: () => Promise.reject(new Error('Not supported')),
  remove: (id: string | number) => client.delete(`/dating/admin/live/${id}`),
};

export const getDatingStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
