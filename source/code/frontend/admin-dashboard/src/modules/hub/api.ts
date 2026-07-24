// frontend/admin-dashboard/src/modules/hub/api.ts
// All hub-specific admin API calls.
// Hub admin routes live under /api/hub/admin/* — they accept admin tokens
// because they use adminGuard (role-check only, no project-claim check).
import client from '@admin/api/client';

type APIParams = Record<string, any>;
type APIBody = Record<string, any>;

// Helper: create a full CRUD resource at a given path
const resource = (path: string) => ({
  list:   (params: APIParams) => client.get(path, { params }),
  get:    (id: string | number)     => client.get(`${path}/${id}`),
  create: (body: APIBody)   => client.post(path, body),
  update: (id: string | number, b: APIBody)  => client.put(`${path}/${id}`, b),
  remove: (id: string | number)     => client.delete(`${path}/${id}`),
});

// Hub admin endpoints — under /api/hub/admin/
export const adminGames      = resource('/hub/admin/games');
export const adminCategories = resource('/hub/admin/categories');
export const adminWebsites   = resource('/hub/admin/websites');
export const adminTools      = resource('/hub/admin/tools');
export const adminNews       = resource('/hub/admin/news');
export const adminPages      = resource('/hub/admin/pages');
export const adminBanners    = resource('/hub/admin/banners');
export const adminMenus      = {
  list:   (params: APIParams) => client.get('/hub/admin/menus', { params }),
  update: (b: APIBody)      => client.put('/hub/admin/menus', b),
};
export const adminFeedbacks  = resource('/hub/admin/feedbacks');
export const adminSeo        = {
  list:   (params: APIParams) => client.get('/hub/seo/meta', { params }),
  create: (body: APIBody)   => client.post('/hub/admin/seo', body),
  update: (id: string | number, b: APIBody)  => client.put(`/hub/admin/seo/${id}`, b),
  remove: (id: string | number)     => client.delete(`/hub/admin/seo/${id}`),
};

// App Catalog (list all registered sub-project apps for download distribution)
export const adminAppCatalog = {
  list:   (params: APIParams) => client.get('/admin/app-catalog', { params }),
  get:    (id: string | number)     => client.get(`/admin/app-catalog/${id}`),
  create: (body: APIBody)   => client.post('/admin/app-catalog', body),
  update: (id: string | number, b: APIBody)  => client.put(`/admin/app-catalog/${id}`, b),
  remove: (id: string | number)     => client.delete(`/admin/app-catalog/${id}`),
};

// Hub dashboard stats
export const getHubDashboard = () =>
  client.get('/hub/admin/dashboard').then(r => r.data?.data ?? r.data);
