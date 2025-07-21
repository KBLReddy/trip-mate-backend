import { Test, TestingModule } from '@nestjs/testing';
import { ToursController } from '../../src/tours/tours.controller';
import { ToursService } from '../../src/tours/tours.service';
import { Role } from '@prisma/client';
import { CreateTourDto } from '../../src/tours/dto/create-tour.dto';
import { User } from '@prisma/client';

describe('ToursController', () => {
  let controller: ToursController;
  let service: ToursService;
  const mockService = {
    create: jest.fn(),
    findAll: jest.fn(),
    getCategories: jest.fn(),
    findOne: jest.fn(),
    getAvailableCapacity: jest.fn(),
    getStatistics: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    getSearchSuggestions: jest.fn(),
  };
  const mockUser: User = {
    id: 'user1',
    name: 'Test User',
    email: 'test@example.com',
    passwordHash: 'hash',
    avatar: null,
    role: Role.ADMIN,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ToursController],
      providers: [{ provide: ToursService, useValue: mockService }],
    }).compile();
    controller = module.get(ToursController);
    service = module.get(ToursService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should call create', async () => {
    const dto: CreateTourDto = {
      title: 'Tour',
      description: 'A great tour',
      location: 'City',
      price: 100,
      startDate: new Date().toISOString(),
      endDate: new Date().toISOString(),
      capacity: 10,
      category: 'ADVENTURE',
    };
    await controller.create(dto, mockUser);
    expect(service.create).toHaveBeenCalled();
  });
  it('should call findAll', async () => {
    await controller.findAll({});
    expect(service.findAll).toHaveBeenCalled();
  });
  it('should call getCategories', async () => {
    await controller.getCategories();
    expect(service.getCategories).toHaveBeenCalled();
  });
  it('should call findOne', async () => {
    await controller.findOne('id');
    expect(service.findOne).toHaveBeenCalled();
  });
  it('should call getAvailability', async () => {
    await controller.getAvailability('id');
    expect(service.getAvailableCapacity).toHaveBeenCalled();
  });
  it('should call getStatistics', async () => {
    await controller.getStatistics();
    expect(service.getStatistics).toHaveBeenCalled();
  });
  it('should call update', async () => {
    await controller.update('id', {}, mockUser);
    expect(service.update).toHaveBeenCalled();
  });
  it('should call remove', async () => {
    await controller.remove('id', mockUser);
    expect(service.remove).toHaveBeenCalled();
  });
  it('should call getSearchSuggestions', async () => {
    await controller.getSearchSuggestions('q');
    expect(service.getSearchSuggestions).toHaveBeenCalled();
  });
}); 