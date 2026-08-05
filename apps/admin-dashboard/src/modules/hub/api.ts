import client from '@admin/api/client';

type APIParams = Record<string, unknown>;
type APIBody   = Record<string, unknown>;

const resource = (path: string) => ({
  list:   (params: APIParams) => client.get(path, { params }),
  get:    (id: string | number) => client.get(`${path}/${id}`),
  create: (body: APIBody)       => client.post(path, body),
  update: (id: string | number, b: APIBody) => client.put(`${path}/${id}`, b),
  remove: (id: string | number) => client.delete(`${path}/${id}`),
});

export const adminGames      = resource('/hub/admin/games');
export const adminCategories = resource('/hub/admin/categories');
export const adminWebsites   = resource('/hub/admin/websites');
export const adminTools      = resource('/hub/admin/tools');
export const adminNews       = resource('/hub/admin/news');
export const adminPages      = resource('/hub/admin/pages');
export const adminBanners    = resource('/hub/admin/banners');
export const adminMenus = {
  list:   (params: APIParams) => client.get('/hub/admin/menus', { params }),
  update: (b: APIBody)        => client.put('/hub/admin/menus', b),
};
export const adminFeedbacks = resource('/hub/admin/feedbacks');
export const adminSeo = {
  list:   (params: APIParams) => client.get('/hub/seo/meta', { params }),
  create: (body: APIBody)       => client.post('/hub/admin/seo', body),
  update: (id: string | number, b: APIBody) => client.put(`/hub/admin/seo/${id}`, b),
  remove: (id: string | number) => client.delete(`/hub/admin/seo/${id}`),
};

export const adminAppCatalog = resource('/admin/app-catalog');

export const getCourses = (params: APIParams) =>
  client.get('/hub/courses', { params }).then(r => r.data?.data ?? r.data);

export const getHubDashboard = () =>
  client.get('/hub/admin/dashboard').then(r => r.data?.data ?? r.data);
