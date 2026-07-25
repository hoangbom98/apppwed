import request from '../request';

export interface UpdateProfilePayload {
  [key: string]: unknown;
}

export const getUserProfile = (): Promise<unknown> =>
  request.get('/user/profile');

export const updateProfile = (data: UpdateProfilePayload): Promise<unknown> =>
  request.post('/user/update', data);
