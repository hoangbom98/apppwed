// tests/integration/multiTenant.test.ts
import request from 'supertest';
import { app } from '../../server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

describe('Multi-tenancy Isolation', () => {
  it('should prevent access to resources of another project', async () => {
    // 1. Tạo 2 user thuộc 2 project khác nhau
    // 2. Gọi API ví của User 1 nhưng gửi X-Project-ID của Project 2
    const res = await request(app)
      .get('/api/wallet/balance')
      .set('X-Project-ID', 'project-2')
      .set('Authorization', 'Bearer token_user_1');
    
    expect(res.status).toBe(403); // Hoặc 404 tùy logic
  });
});
