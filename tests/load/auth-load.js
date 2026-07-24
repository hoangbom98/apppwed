import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 1000 },
    { duration: '5m', target: 5000 },
    { duration: '2m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'],
    http_req_failed: ['rate<0.01'],
  },
};

const BASE_URL = 'http://localhost:5000';

export default function () {
  // 1. Đăng ký
  const registerPayload = JSON.stringify({
    username: `user${__VU}_${__ITER}`,
    email: `user${__VU}_${__ITER}@test.com`,
    password: 'Test@123456',
  });

  const registerRes = http.post(`${BASE_URL}/api/auth/register`, registerPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  // 2. Đăng nhập
  const loginPayload = JSON.stringify({
    username: `user${__VU}_${__ITER}@test.com`,
    password: 'Test@123456',
  });

  const loginRes = http.post(`${BASE_URL}/api/auth/login`, loginPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(loginRes, {
    'login status 200': (r) => r.status === 200,
    'login has token': (r) => r.json('token') !== undefined,
  });

  // 3. Lấy thông tin user
  const token = loginRes.json('token');
  if (token) {
    const meRes = http.get(`${BASE_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    check(meRes, {
      'me status 200': (r) => r.status === 200,
    });
  }

  sleep(1);
}
