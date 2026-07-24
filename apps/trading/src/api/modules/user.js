import request from '../request';

export const getUserProfile = () => request.get('/user/profile');
export const updateProfile = (data) => request.post('/user/update', data);
