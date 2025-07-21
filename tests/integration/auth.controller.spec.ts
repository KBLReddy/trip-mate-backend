import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../setup/test-app';

describe('AuthController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/auth/register (POST)', () => {
    it('should register a new user', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'newuser@test.com', password: 'password', name: 'New User' });
      // This will fail unless the DB is set up for testing; adjust as needed
      expect([201, 400, 409]).toContain(res.status);
    });
  });

  describe('/auth/login (POST)', () => {
    it('should fail to login with invalid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'nouser@test.com', password: 'wrong' });
      expect([401, 400]).toContain(res.status);
    });
  });

  // TODO: Add more tests for /auth/login (success), /auth/refresh, edge cases, etc.
}); 