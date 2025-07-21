import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../setup/test-app';

describe('NotificationsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/notifications (GET)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications');
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated user (requires auth setup)
    // TODO: Add test for pagination, filtering, etc.
  });

  describe('/notifications/mark-read (PUT)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .put('/notifications/mark-read')
        .send({ notificationIds: ['n1'] });
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated user (requires auth setup)
    // TODO: Add test for invalid input
  });
}); 