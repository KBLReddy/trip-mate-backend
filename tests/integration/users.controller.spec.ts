import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../setup/test-app';

describe('UsersController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/users/me (GET)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/users/me');
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated user (requires auth setup)
  });

  describe('/users/me (PUT)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .put('/users/me')
        .send({ name: 'Updated' });
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated user update (requires auth setup)
    // TODO: Add test for invalid input
  });
}); 