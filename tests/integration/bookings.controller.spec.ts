import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { createTestApp } from '../setup/test-app';

describe('BookingsController (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    app = await createTestApp();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('/bookings (POST)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/bookings')
        .send({ tourId: 'tour1' });
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated user booking (requires auth setup)
    // TODO: Add test for invalid input
  });

  describe('/bookings (GET)', () => {
    it('should return 401 if not authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/bookings');
      expect(res.status).toBe(401);
    });
    // TODO: Add test for authenticated user (requires auth setup)
    // TODO: Add test for pagination, filtering, etc.
  });
}); 