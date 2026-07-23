// frontend/admin-dashboard/src/modules/dating/api.js
import client from '@admin/api/client';

export const adminDatingUsers = {
  list:   (params) => client.get('/admin/users', { params: { ...params, project: 'dating' } }),
  update: (id, b)  => client.patch(`/admin/users/${id}/status`, b),
  create: () => Promise.reject(new Error('Not supported')),
  remove: () => Promise.reject(new Error('Not supported')),
};

export const getDatingStats = () =>
  client.get('/admin/stats').then(r => r.data?.data ?? r.data);
