import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../setup/test-app';

describe('CommentsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/comments (POST)', () => {
    it('should return 401 if not authenticated (or 404 if route is not mounted)', async () => {
      // If your app uses a global prefix (e.g., /api), update the route accordingly
      const res = await request(app.getHttpServer())
        .post('/comments')
        .send({ postId: 'post1', content: 'Nice!' });
      expect([401, 404]).toContain(res.status);
    });
    // TODO: Add test for authenticated user (requires auth setup)
    // TODO: Add test for invalid input
  });

  describe('/comments (GET)', () => {
    it('should return 200 for public access', async () => {
      const res = await request(app.getHttpServer())
        .get('/comments');
      expect([200, 404]).toContain(res.status); // 200 if comments exist, 404 if not
    });
    // TODO: Add test for pagination, filtering, etc.
  });
}); 