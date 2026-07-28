import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export const createApiClient = (baseURL: string, config?: AxiosRequestConfig): AxiosInstance => {
  return axios.create({
    baseURL,
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
    ...config,
  });
};
