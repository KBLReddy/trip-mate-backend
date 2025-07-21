import { Test, TestingModule } from '@nestjs/testing';
import { ToursService } from '../../src/tours/tours.service';
import { PrismaService } from '../../src/prisma/prisma.service';
import { CreateTourDto } from '../../src/tours/dto/create-tour.dto';

const mockPrisma = {
  tour: {
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    findUnique: jest.fn(),
    findMany: jest.fn(),
    count: jest.fn(),
    groupBy: jest.fn(),
    aggregate: jest.fn(),
  },
  booking: {
    count: jest.fn(),
  },
};

describe('ToursService', () => {
  let service: ToursService;

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ToursService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();
    service = module.get<ToursService>(ToursService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a new tour', async () => {
      mockPrisma.tour.create.mockResolvedValue({ id: '1', title: 'Tour', price: 100 });
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
      const result = await service.create(dto, 'guide1');
      expect(result).toBeDefined();
      expect(mockPrisma.tour.create).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should throw if tour not found', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(null);
      await expect(service.findOne('bad')).rejects.toThrow('Tour with ID bad not found');
    });
  });
  describe('update', () => {
    it('should throw if tour not found', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(null);
      await expect(service.update('bad', {}, 'user1', 'ADMIN')).rejects.toThrow('Tour with ID bad not found');
    });
    it('should throw if not admin or guide', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'other' });
      await expect(service.update('t1', {}, 'user1', 'USER')).rejects.toThrow('You do not have permission to update this tour');
    });
    it('should update with only some fields set', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'user1' });
      mockPrisma.tour.update.mockResolvedValue({ id: 't1', guideId: 'user1' });
      const dto = { price: 123.45 }; // Only price set
      await expect(service.update('t1', dto, 'user1', 'ADMIN')).resolves.toBeDefined();
    });
    it('should update with no price/startDate/endDate', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'user1' });
      mockPrisma.tour.update.mockResolvedValue({ id: 't1', guideId: 'user1' });
      const dto = { title: 'New Title' }; // No price/startDate/endDate
      await expect(service.update('t1', dto, 'user1', 'ADMIN')).resolves.toBeDefined();
    });
  });
  describe('findAll', () => {
    it('should handle minPrice and maxPrice', async () => {
      mockPrisma.tour.count.mockResolvedValue(1);
      mockPrisma.tour.findMany.mockResolvedValue([{ id: 't1', guide: {} }]);
      const query = { minPrice: 100, maxPrice: 200, page: 1, limit: 1 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle only minPrice', async () => {
      mockPrisma.tour.count.mockResolvedValue(1);
      mockPrisma.tour.findMany.mockResolvedValue([{ id: 't1', guide: {} }]);
      const query = { minPrice: 100, page: 1, limit: 1 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle only maxPrice', async () => {
      mockPrisma.tour.count.mockResolvedValue(1);
      mockPrisma.tour.findMany.mockResolvedValue([{ id: 't1', guide: {} }]);
      const query = { maxPrice: 200, page: 1, limit: 1 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle minPrice=0 and maxPrice undefined', async () => {
      mockPrisma.tour.count.mockResolvedValue(1);
      mockPrisma.tour.findMany.mockResolvedValue([{ id: 't1', guide: {} }]);
      const query = { minPrice: 0, page: 1, limit: 1 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle maxPrice=0 and minPrice undefined', async () => {
      mockPrisma.tour.count.mockResolvedValue(1);
      mockPrisma.tour.findMany.mockResolvedValue([{ id: 't1', guide: {} }]);
      const query = { maxPrice: 0, page: 1, limit: 1 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle minPrice=undefined and maxPrice=undefined', async () => {
      mockPrisma.tour.count.mockResolvedValue(1);
      mockPrisma.tour.findMany.mockResolvedValue([{ id: 't1', guide: {} }]);
      const query = { page: 1, limit: 1 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
    it('should handle minPrice=0 and maxPrice=0', async () => {
      mockPrisma.tour.count.mockResolvedValue(1);
      mockPrisma.tour.findMany.mockResolvedValue([{ id: 't1', guide: {} }]);
      const query = { minPrice: 0, maxPrice: 0, page: 1, limit: 1 };
      const result = await service.findAll(query);
      expect(result).toBeDefined();
    });
  });
  describe('remove', () => {
    it('should throw if tour not found', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(null);
      await expect(service.remove('bad', 'user1', 'ADMIN')).rejects.toThrow('Tour with ID bad not found');
    });
    it('should throw if not admin or guide', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'other', bookings: [] });
      await expect(service.remove('t1', 'user1', 'USER')).rejects.toThrow('You do not have permission to delete this tour');
    });
    it('should throw if tour has active bookings', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'user1', bookings: [{}, {}] });
      await expect(service.remove('t1', 'user1', 'ADMIN')).rejects.toThrow('Cannot delete tour with active bookings');
    });
    it('should throw if tour.bookings has CONFIRMED or PENDING', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'user1', bookings: [{}, {}] });
      await expect(service.remove('t1', 'user1', 'ADMIN')).rejects.toThrow('Cannot delete tour with active bookings');
    });
    it('should delete if admin and no bookings', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'user1', bookings: [] });
      mockPrisma.tour.delete.mockResolvedValue({});
      await expect(service.remove('t1', 'admin', 'ADMIN')).resolves.toBeUndefined();
    });
    it('should throw if tour.bookings is undefined', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'user1' });
      await expect(service.remove('t1', 'user1', 'ADMIN')).rejects.toThrow();
    });
    it('should throw if tour.bookings is null', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', guideId: 'user1', bookings: null });
      await expect(service.remove('t1', 'user1', 'ADMIN')).rejects.toThrow();
    });
  });

  describe('getCategories', () => {
    it('should return categories', async () => {
      mockPrisma.tour.findMany.mockResolvedValue([{ category: 'ADVENTURE' }, { category: 'CULTURE' }]);
      const result = await service.getCategories();
      expect(result).toEqual(['ADVENTURE', 'CULTURE']);
    });
    it('should return empty array if no categories', async () => {
      mockPrisma.tour.findMany.mockResolvedValue([]);
      const result = await service.getCategories();
      expect(result).toEqual([]);
    });
  });

  describe('getSearchSuggestions', () => {
    it('should return empty arrays if query too short', async () => {
      const result = await service.getSearchSuggestions('a');
      expect(result).toEqual({ locations: [], titles: [] });
    });
    it('should return locations and titles', async () => {
      mockPrisma.tour.findMany
        .mockResolvedValueOnce([{ location: 'Paris' }])
        .mockResolvedValueOnce([{ title: 'Eiffel Tour' }]);
      const result = await service.getSearchSuggestions('Pa');
      expect(result.locations).toEqual(['Paris']);
      expect(result.titles).toEqual(['Eiffel Tour']);
    });
    it('should return empty arrays if no results', async () => {
      mockPrisma.tour.findMany.mockResolvedValue([]);
      const result = await service.getSearchSuggestions('NoMatch');
      expect(result.locations).toEqual([]);
      expect(result.titles).toEqual([]);
    });
  });

  describe('getStatistics', () => {
    it('should return statistics (normal)', async () => {
      // 1. totalTours
      mockPrisma.tour.count.mockResolvedValueOnce(5);
      // 2. categories
      mockPrisma.tour.groupBy.mockResolvedValueOnce([
        { category: 'A', _count: 2 },
        { category: 'B', _count: 3 },
      ]);
      // 3. average price
      mockPrisma.tour.aggregate.mockResolvedValueOnce({ _avg: { price: 100 } });
      // 4. upcoming, ongoing, completed tours (Promise.all)
      mockPrisma.tour.count
        .mockResolvedValueOnce(2) // upcomingTours
        .mockResolvedValueOnce(1) // ongoingTours
        .mockResolvedValueOnce(2); // completedTours

      const result = await service.getStatistics();
      expect(result.totalTours).toBe(5);
      expect(result.totalCategories).toBe(2);
      expect(result.averagePrice).toBe(100);
      expect(result.upcomingTours).toBe(2);
      expect(result.ongoingTours).toBe(1);
      expect(result.completedTours).toBe(2);
      expect(result.toursByCategory).toEqual({ A: 2, B: 3 });
    });
    it('should handle empty categories and price', async () => {
      mockPrisma.tour.count.mockResolvedValueOnce(0); // totalTours
      mockPrisma.tour.groupBy.mockResolvedValueOnce([]); // categories
      mockPrisma.tour.aggregate.mockResolvedValueOnce({ _avg: { price: null } }); // avg price
      mockPrisma.tour.count
        .mockResolvedValueOnce(0) // upcomingTours
        .mockResolvedValueOnce(0) // ongoingTours
        .mockResolvedValueOnce(0); // completedTours
      const result = await service.getStatistics();
      expect(result.totalTours).toBe(0);
      expect(result.totalCategories).toBe(0);
      expect(result.averagePrice).toBe(0);
      expect(result.upcomingTours).toBe(0);
      expect(result.ongoingTours).toBe(0);
      expect(result.completedTours).toBe(0);
      expect(result.toursByCategory).toEqual({});
    });
  });

  describe('getAvailableCapacity', () => {
    it('should return available capacity (no bookings)', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', capacity: 10, bookings: [] });
      const result = await service.getAvailableCapacity('t1');
      expect(result).toBe(10);
    });
    it('should return available capacity (some bookings)', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue({ id: 't1', capacity: 10, bookings: [{}, {}, {}, {}] });
      const result = await service.getAvailableCapacity('t1');
      expect(result).toBe(6);
    });
    it('should throw if tour not found', async () => {
      mockPrisma.tour.findUnique.mockResolvedValue(null);
      await expect(service.getAvailableCapacity('t1')).rejects.toThrow('Tour with ID t1 not found');
    });
  });

  // TODO: Add tests for get statistics, get available capacity, and error/edge cases
}); 