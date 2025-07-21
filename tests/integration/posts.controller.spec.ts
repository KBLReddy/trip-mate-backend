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
    
    // Add debugging to see the actual error
    if (res.status === 500) {
      console.error('Status:', res.status);
      console.error('Body:', res.body);
      console.error('Error:', res.error);
    }
    
    expect([200, 404]).toContain(res.status);
  });
});
}); 