// Mock pino before any imports
jest.mock('pino', () => {
  const mockLogger: any = {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    child: jest.fn(),
  };

  mockLogger.child.mockReturnValue(mockLogger);

  const pino = jest.fn(() => mockLogger) as any;
  pino.stdSerializers = {
    err: jest.fn((err) => err),
  };

  return pino;
});

import { BaseRepository } from '../../repositories/base.repository';
import { prisma } from '../../lib/prisma';

// Mock Prisma delegate
jest.mock('../../lib/prisma', () => ({
  prisma: {
    user: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    $transaction: jest.fn((callback) => callback({})),
  },
}));

// Concrete implementation for testing abstract class
class TestRepository extends BaseRepository<any> {
  // No additional implementation needed - just concrete version
}

describe('BaseRepository', () => {
  let repository: TestRepository;
  const mockDelegate = prisma.user as jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new TestRepository(mockDelegate);
  });

  describe('findMany', () => {
    it('should return all items when no filters provided', async () => {
      const mockUsers = [{ id: '1', name: 'User 1' }];
      mockDelegate.findMany.mockResolvedValue(mockUsers);

      const result = await repository.findMany();

      expect(result).toEqual(mockUsers);
      expect(mockDelegate.findMany).toHaveBeenCalledWith({});
    });

    it('should apply pagination with skip and take', async () => {
      mockDelegate.findMany.mockResolvedValue([]);

      await repository.findMany({ skip: 20, take: 5 });

      expect(mockDelegate.findMany).toHaveBeenCalledWith({
        skip: 20,
        take: 5,
      });
    });

    it('should apply where filter', async () => {
      mockDelegate.findMany.mockResolvedValue([]);

      await repository.findMany({ where: { status: 'active' } });

      expect(mockDelegate.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        })
      );
    });
  });

  describe('findUnique', () => {
    it('should find item by id', async () => {
      const mockUser = { id: '1', name: 'User 1' };
      mockDelegate.findUnique.mockResolvedValue(mockUser);

      const result = await repository.findUnique('1');

      expect(result).toEqual(mockUser);
      expect(mockDelegate.findUnique).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });

    it('should return null when item not found', async () => {
      mockDelegate.findUnique.mockResolvedValue(null);

      const result = await repository.findUnique('nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('create', () => {
    it('should create item with provided data', async () => {
      const newUser = { id: '1', name: 'New User', email: 'test@example.com' };
      mockDelegate.create.mockResolvedValue(newUser);

      const result = await repository.create({ name: 'New User', email: 'test@example.com' });

      expect(result).toEqual(newUser);
      expect(mockDelegate.create).toHaveBeenCalledWith({
        data: { name: 'New User', email: 'test@example.com' },
      });
    });
  });

  describe('update', () => {
    it('should update item by id', async () => {
      const updated = { id: '1', name: 'Updated User' };
      mockDelegate.update.mockResolvedValue(updated);

      const result = await repository.update('1', { name: 'Updated User' });

      expect(result).toEqual(updated);
      expect(mockDelegate.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { name: 'Updated User' },
      });
    });
  });

  describe('delete', () => {
    it('should delete item by id', async () => {
      const deleted = { id: '1', name: 'Deleted User' };
      mockDelegate.delete.mockResolvedValue(deleted);

      const result = await repository.delete('1');

      expect(result).toEqual(deleted);
      expect(mockDelegate.delete).toHaveBeenCalledWith({
        where: { id: '1' },
      });
    });
  });

  describe('count', () => {
    it('should return count of items', async () => {
      mockDelegate.count.mockResolvedValue(42);

      const result = await repository.count();

      expect(result).toBe(42);
      expect(mockDelegate.count).toHaveBeenCalledWith({});
    });

    it('should apply where filter to count', async () => {
      mockDelegate.count.mockResolvedValue(10);

      await repository.count({ where: { status: 'active' } });

      expect(mockDelegate.count).toHaveBeenCalledWith({
        where: { status: 'active' },
      });
    });
  });
});
