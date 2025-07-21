import { Test, TestingModule } from '@nestjs/testing';
import { BookingsService } from '../../src/bookings/bookings.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { ToursService } from '../../src/tours/tours.service';
import { NotificationsService } from '../../src/notifications/notifications.service';
import { BookingStatus, PaymentStatus, Role } from '@prisma/client';

const mockPrisma = {
  tour: { findUnique: jest.fn() },
  booking: {
    findFirst: jest.fn(),
    create: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  notification: { create: jest.fn() },
};
const mockToursService = { getAvailableCapacity: jest.fn() };
const mockNotificationsService = { createNotification: jest.fn() };

describe('BookingsService', () => {
  let service: BookingsService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BookingsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ToursService, useValue: mockToursService },
        { provide: NotificationsService, useValue: mockNotificationsService },
      ],
    }).compile();
    service = module.get<BookingsService>(BookingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a booking if all checks pass', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 'tour1', price: 100, startDate: new Date(Date.now() + 100000) });
      mockToursService.getAvailableCapacity.mockResolvedValue(5);
      mockPrisma.booking.findFirst.mockResolvedValue(null);
      mockPrisma.booking.create.mockResolvedValue({ id: 'booking1', tour: { title: 'Tour' }, user: {} });
      mockNotificationsService.createNotification.mockResolvedValue(undefined);
      const dto = { tourId: 'tour1', specialRequests: '' };
      const result = await service.create(dto, 'user1');
      expect(result).toBeDefined();
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    });
    it('should throw if tour not found', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(null);
      await expect(service.create({ tourId: 'bad', specialRequests: '' }, 'user1')).rejects.toThrow('Tour not found');
    });
    it('should throw if tour already started', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 'tour1', startDate: new Date(Date.now() - 100000) });
      await expect(service.create({ tourId: 'tour1', specialRequests: '' }, 'user1')).rejects.toThrow('Cannot book a tour that has already started');
    });
    it('should throw if tour is full', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 'tour1', startDate: new Date(Date.now() + 100000) });
      mockToursService.getAvailableCapacity.mockResolvedValue(0);
      await expect(service.create({ tourId: 'tour1', specialRequests: '' }, 'user1')).rejects.toThrow('Tour is fully booked');
    });
    it('should throw if already booked', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 'tour1', startDate: new Date(Date.now() + 100000) });
      mockToursService.getAvailableCapacity.mockResolvedValue(5);
      mockPrisma.booking.findFirst.mockResolvedValue({ id: 'booking1' });
      await expect(service.create({ tourId: 'tour1', specialRequests: '' }, 'user1')).rejects.toThrow('You already have a booking for this tour');
    });
  });

  describe('updateStatus', () => {
    it('should update status if user is allowed', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', status: BookingStatus.PENDING, tour: { startDate: new Date(Date.now() + 100000), title: 'Tour' } });
      mockPrisma.booking.update.mockResolvedValue({ id: 'b1', status: BookingStatus.CANCELLED, tour: { title: 'Tour', startDate: new Date(Date.now() + 100000), guide: {} }, user: {} });
      mockNotificationsService.createNotification.mockResolvedValue(undefined);
      const dto = { status: BookingStatus.CANCELLED };
      const result = await service.updateStatus('b1', dto, 'user1', Role.USER);
      expect(result).toBeDefined();
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    });
    it('should update status and send notification if cancelled and all checks pass', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        userId: 'user1',
        status: BookingStatus.PENDING,
        tour: { startDate: new Date(Date.now() + 100000), title: 'Tour' }
      });
      mockPrisma.booking.update.mockResolvedValue({
        id: 'b1',
        status: BookingStatus.CANCELLED,
        tour: { title: 'Tour', startDate: new Date(Date.now() + 100000), guide: {} },
        user: {}
      });
      mockNotificationsService.createNotification.mockResolvedValue(undefined);
      const dto = { status: BookingStatus.CANCELLED };
      const result = await service.updateStatus('b1', dto, 'user1', Role.USER);
      expect(result).toBeDefined();
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    });
    it('should update status without sending notification if not cancelled', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        userId: 'user1',
        status: BookingStatus.PENDING,
        tour: { startDate: new Date(Date.now() + 100000), title: 'Tour' }
      });
      mockPrisma.booking.update.mockResolvedValue({
        id: 'b1',
        status: BookingStatus.CONFIRMED,
        tour: { title: 'Tour', startDate: new Date(Date.now() + 100000), guide: {} },
        user: {}
      });
      mockNotificationsService.createNotification.mockResolvedValue(undefined);
      const dto = { status: BookingStatus.CONFIRMED };
      const result = await service.updateStatus('b1', dto, 'user1', Role.USER);
      expect(result).toBeDefined();
      expect(mockNotificationsService.createNotification).not.toHaveBeenCalled();
    });
    it('should throw if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('bad', { status: BookingStatus.CANCELLED }, 'user1', Role.USER)).rejects.toThrow('Booking not found');
    });
    it('should throw if user is not allowed', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'other', status: BookingStatus.PENDING, tour: { startDate: new Date(Date.now() + 100000) } });
      await expect(service.updateStatus('b1', { status: BookingStatus.CANCELLED }, 'user1', Role.USER)).rejects.toThrow('You do not have permission to update this booking');
    });
    it('should throw if trying to cancel completed booking', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', status: BookingStatus.COMPLETED, tour: { startDate: new Date(Date.now() + 100000) } });
      await expect(service.updateStatus('b1', { status: BookingStatus.CANCELLED }, 'user1', Role.USER)).rejects.toThrow('Cannot cancel a completed booking');
    });
    it('should throw if trying to cancel after tour started', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', status: BookingStatus.PENDING, tour: { startDate: new Date(Date.now() - 100000) } });
      await expect(service.updateStatus('b1', { status: BookingStatus.CANCELLED }, 'user1', Role.USER)).rejects.toThrow('Cannot cancel a tour that has already started');
    });
    it('should throw if notification creation fails', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({
        id: 'b1',
        userId: 'user1',
        status: BookingStatus.PENDING,
        tour: { startDate: new Date(Date.now() + 100000), title: 'Tour' }
      });
      mockPrisma.booking.update.mockResolvedValue({
        id: 'b1',
        status: BookingStatus.CANCELLED,
        tour: { title: 'Tour', startDate: new Date(Date.now() + 100000), guide: {} },
        user: {}
      });
      mockNotificationsService.createNotification.mockRejectedValue(new Error('Notification error'));
      const dto = { status: BookingStatus.CANCELLED };
      await expect(service.updateStatus('b1', dto, 'user1', Role.USER)).rejects.toThrow('Notification error');
    });
  });

  describe('findAll', () => {
    it('should return bookings for admin', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([{ id: 'b1', tour: { guide: {} }, user: {} }]);
      mockPrisma.booking.count.mockResolvedValue(1);
      const query = { page: 1, limit: 10 };
      const result = await service.findAll('admin', 'ADMIN', query);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
    });
    it('should return bookings for user', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([{ id: 'b1', tour: { guide: {} }, user: {} }]);
      mockPrisma.booking.count.mockResolvedValue(1);
      const query = { page: 1, limit: 10 };
      const result = await service.findAll('user1', 'USER', query);
      expect(result.data.length).toBe(1);
      expect(result.total).toBe(1);
    });
    it('should filter by status and paymentStatus', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.booking.count.mockResolvedValue(0);
      const query = { status: BookingStatus.CONFIRMED, paymentStatus: PaymentStatus.PAID, page: 1, limit: 10 };
      const result = await service.findAll('user1', 'USER', query);
      expect(result.data).toEqual([]);
      expect(result.total).toBe(0);
    });
    it('should filter by fromDate', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.booking.count.mockResolvedValue(0);
      const query = { fromDate: new Date().toISOString(), page: 1, limit: 10 };
      const result = await service.findAll('user1', 'USER', query);
      expect(result.data).toEqual([]);
    });
    it('should filter by toDate', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.booking.count.mockResolvedValue(0);
      const query = { toDate: new Date().toISOString(), page: 1, limit: 10 };
      const result = await service.findAll('user1', 'USER', query);
      expect(result.data).toEqual([]);
    });
    it('should filter by paymentStatus', async () => {
      mockPrisma.booking.findMany.mockResolvedValue([]);
      mockPrisma.booking.count.mockResolvedValue(0);
      const query = { paymentStatus: PaymentStatus.PAID, page: 1, limit: 10 };
      const result = await service.findAll('user1', 'USER', query);
      expect(result.data).toEqual([]);
    });
  });
  describe('findOne', () => {
    it('should throw if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad', 'user1', 'USER')).rejects.toThrow('Booking not found');
    });
    it('should throw if not allowed', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'other' });
      await expect(service.findOne('b1', 'user1', 'USER')).rejects.toThrow('You do not have permission to view this booking');
    });
  });
  describe('updateStatus', () => {
    it('should throw if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.updateStatus('bad', { status: 'CANCELLED' }, 'user1', 'USER')).rejects.toThrow('Booking not found');
    });
    it('should throw if not allowed', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'other', status: 'PENDING', tour: { startDate: new Date(Date.now() + 100000) } });
      await expect(service.updateStatus('b1', { status: 'CANCELLED' }, 'user1', 'USER')).rejects.toThrow('You do not have permission to update this booking');
    });
    it('should throw if completed', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', status: 'COMPLETED', tour: { startDate: new Date(Date.now() + 100000) } });
      await expect(service.updateStatus('b1', { status: 'CANCELLED' }, 'user1', 'USER')).rejects.toThrow('Cannot cancel a completed booking');
    });
    it('should throw if after tour started', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', status: 'PENDING', tour: { startDate: new Date(Date.now() - 100000) } });
      await expect(service.updateStatus('b1', { status: 'CANCELLED' }, 'user1', 'USER')).rejects.toThrow('Cannot cancel a tour that has already started');
    });
  });
  describe('cancel', () => {
    it('should call updateStatus with correct args', async () => {
      service.updateStatus = jest.fn().mockResolvedValue({});
      await service.cancel('b1', 'user1');
      expect(service.updateStatus).toHaveBeenCalledWith('b1', { status: 'CANCELLED', paymentStatus: 'REFUNDED' }, 'user1', 'USER');
    });
  });
  describe('getMyBookings', () => {
    it('should call findAll with user role', async () => {
      service.findAll = jest.fn().mockResolvedValue([]);
      await service.getMyBookings('user1', {});
      expect(service.findAll).toHaveBeenCalledWith('user1', 'USER', {});
    });
  });
  describe('getStatistics', () => {
    it('should return statistics for admin', async () => {
      mockPrisma.booking.count.mockResolvedValueOnce(10); // totalBookings
      mockPrisma.booking.groupBy.mockResolvedValueOnce([
        { status: 'CONFIRMED', _count: 5 },
        { status: 'PENDING', _count: 3 },
        { status: 'CANCELLED', _count: 2 },
      ]); // statusCounts
      mockPrisma.booking.groupBy.mockResolvedValueOnce([
        { paymentStatus: 'PAID', _count: 8 },
        { paymentStatus: 'PENDING', _count: 2 },
      ]); // paymentCounts
      mockPrisma.booking.aggregate.mockResolvedValueOnce({ _sum: { amount: 1000 } }); // revenueAggregate
      const result = await service.getStatistics('admin', 'ADMIN');
      expect(result.totalBookings).toBe(10);
      expect(result.confirmedBookings).toBe(5);
      expect(result.pendingBookings).toBe(3);
      expect(result.cancelledBookings).toBe(2);
      expect(result.totalRevenue).toBe(1000);
      expect(result.pendingPayments).toBe(2);
      expect(result.completedPayments).toBe(8);
    });
    it('should return statistics for user', async () => {
      mockPrisma.booking.count.mockResolvedValueOnce(2); // totalBookings
      mockPrisma.booking.groupBy.mockResolvedValueOnce([
        { status: 'CONFIRMED', _count: 1 },
        { status: 'PENDING', _count: 1 },
      ]); // statusCounts
      mockPrisma.booking.groupBy.mockResolvedValueOnce([
        { paymentStatus: 'PAID', _count: 1 },
        { paymentStatus: 'PENDING', _count: 1 },
      ]); // paymentCounts
      mockPrisma.booking.aggregate.mockResolvedValueOnce({ _sum: { amount: 200 } }); // revenueAggregate
      const result = await service.getStatistics('user1', 'USER');
      expect(result.totalBookings).toBe(2);
      expect(result.confirmedBookings).toBe(1);
      expect(result.pendingBookings).toBe(1);
      expect(result.cancelledBookings).toBe(0);
      expect(result.totalRevenue).toBe(200);
      expect(result.pendingPayments).toBe(1);
      expect(result.completedPayments).toBe(1);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment if admin and booking exists', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', paymentStatus: 'PENDING', status: 'PENDING', tour: { title: 'Tour', guide: {} }, user: {} });
      mockPrisma.booking.update.mockResolvedValue({ id: 'b1', paymentStatus: 'PAID', status: 'CONFIRMED', tour: { title: 'Tour', guide: {} }, user: {} });
      mockNotificationsService.createNotification.mockResolvedValue(undefined);
      const result = await service.confirmPayment('b1', 'admin', 'ADMIN');
      expect(result).toBeDefined();
      expect(mockNotificationsService.createNotification).toHaveBeenCalled();
    });
    it('should throw if booking not found', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue(null);
      await expect(service.confirmPayment('bad', 'admin', 'ADMIN')).rejects.toThrow('Booking not found');
    });
    it('should throw if not admin', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', paymentStatus: 'PENDING', status: 'PENDING', tour: {} });
      await expect(service.confirmPayment('b1', 'user1', 'USER')).rejects.toThrow('Only admin can confirm payments');
    });
    it('should throw if already paid', async () => {
      mockPrisma.booking.findUnique.mockResolvedValue({ id: 'b1', userId: 'user1', paymentStatus: 'PAID', status: 'CONFIRMED', tour: {} });
      await expect(service.confirmPayment('b1', 'admin', 'ADMIN')).rejects.toThrow('Payment already confirmed');
    });
  });

  // TODO: Add more tests for confirmPayment, findAll, statistics, and edge/error cases
}); 