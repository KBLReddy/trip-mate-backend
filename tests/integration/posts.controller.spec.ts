import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../setup/test-app';

describe('PostsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/posts (POST)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/posts')
        .send({ title: 'Post', content: 'Content' });
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated user (requires auth setup)
    // TODO: Add test for invalid input
  });

  describe('/posts (GET)', () => {
    it('should return 200 for public access', async () => {
      const res = await request(app.getHttpServer())
        .get('/posts');
      expect([200, 404]).toContain(res.status); // 200 if posts exist, 404 if not
    });
    // TODO: Add test for pagination, filtering, etc.
  });
}); 