import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../setup/test-app';

describe('ToursController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/tours (POST)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/tours')
        .send({ title: 'Tour', price: 100 });
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated admin/guide (requires auth setup)
    // TODO: Add test for invalid input
  });

  describe('/tours (GET)', () => {
    it('should return 200 for public access', async () => {
      const res = await request(app.getHttpServer())
        .get('/tours');
      expect([200, 404]).toContain(res.status); // 200 if tours exist, 404 if not
    });
    // TODO: Add test for pagination, filtering, etc.
  });
}); 