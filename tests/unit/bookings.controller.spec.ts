import { Test, TestingModule } from '@nestjs/testing';
import { BookingsController } from '../../src/bookings/bookings.controller';
import { BookingsService } from '../../src/bookings/bookings.service';
import { Role } from '@prisma/client';
import { CreateBookingDto } from '../../src/bookings/dto/create-booking.dto';
import { User } from '@prisma/client';

describe('BookingsController', () => {
  let controller: BookingsController;
  let service: BookingsService;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getMyBookings: jest.fn(),
    getStatistics: jest.fn(),
    findOne: jest.fn(),
    updateStatus: jest.fn(),
    cancel: jest.fn(),
    confirmPayment: jest.fn(),
  };
  const mockUser: User = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    avatar: null,
    role: Role.USER,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BookingsController],
      providers: [{ provide: BookingsService, useValue: mockService }],
    }).compile();
    controller = module.get(BookingsController);
    service = module.get(BookingsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto: CreateBookingDto = { tourId: 'tour1', specialRequests: '' };
    await controller.create(dto, mockUser);
    expect(service.create).toHaveBeenCalled();
  });
  it('should call findAll', async () => {
    await controller.findAll({}, mockUser);
    expect(service.findAll).toHaveBeenCalled();
  });
  it('should call getMyBookings', async () => {
    await controller.getMyBookings({}, mockUser);
    expect(service.getMyBookings).toHaveBeenCalled();
  });
  it('should call getStatistics', async () => {
    await controller.getStatistics(mockUser);
    expect(service.getStatistics).toHaveBeenCalled();
  });
  it('should call findOne', async () => {
    await controller.findOne('id', mockUser);
    expect(service.findOne).toHaveBeenCalled();
  });
  it('should call updateStatus', async () => {
    await controller.updateStatus('id', {}, mockUser);
    expect(service.updateStatus).toHaveBeenCalled();
  });
  it('should call cancel', async () => {
    await controller.cancel('id', mockUser);
    expect(service.cancel).toHaveBeenCalled();
  });
  it('should call confirmPayment', async () => {
    await controller.confirmPayment('id', mockUser);
    expect(service.confirmPayment).toHaveBeenCalled();
  });
}); 