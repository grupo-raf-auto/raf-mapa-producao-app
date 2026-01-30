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
  pino.stdSerializers = { err: jest.fn((err) => err) };
  return pino;
});

import { BaseCRUDController } from '../../controllers/base-crud.controller';
import { BaseRepository } from '../../repositories/base.repository';
import { Request, Response } from 'express';

describe('BaseCRUDController', () => {
  let controller: BaseCRUDController<any>;
  let mockRepository: jest.Mocked<any>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    };

    // Create concrete implementation for testing abstract class
    controller = new (class extends BaseCRUDController<any> {
      repository = mockRepository;
      createSchema = undefined;
      updateSchema = undefined;
    })();

    mockRequest = {
      query: {},
      body: {},
      params: {},
      user: { id: 'user-1', email: 'user@example.com', name: 'Test User', role: 'user', _id: 'user-1' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      send: jest.fn().mockReturnThis(),
    };
  });

  describe('getAll', () => {
    it('should return all items with pagination', async () => {
      const mockItems = [{ id: '1', name: 'Item 1' }];
      mockRepository.findMany.mockResolvedValue(mockItems);
      mockRepository.count.mockResolvedValue(1);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            items: mockItems,
            total: 1,
          }),
        })
      );
    });

    it('should apply pagination from query params', async () => {
      mockRequest.query = { page: '2', limit: '15' };
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findMany).toHaveBeenCalled();
    });

    it('should use default pagination when no params provided', async () => {
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findMany).toHaveBeenCalled();
    });
  });

  describe('getById', () => {
    it('should return single item by id', async () => {
      mockRequest.params = { id: '1' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-1' };
      mockRepository.findUnique.mockResolvedValue(mockItem);

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findUnique).toHaveBeenCalledWith('1');
    });

    it('should find item by id from params', async () => {
      mockRequest.params = { id: 'test-id' };
      const mockItem = { id: 'test-id', name: 'Test Item' };
      mockRepository.findUnique.mockResolvedValue(mockItem);

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findUnique).toHaveBeenCalledWith('test-id');
    });
  });

  describe('create', () => {
    it('should create item with validated data', async () => {
      mockRequest.body = { name: 'New Item' };
      const createdItem = { id: '1', name: 'New Item', userId: 'user-1' };
      mockRepository.create.mockResolvedValue(createdItem);

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: createdItem,
        })
      );
    });
  });

  describe('update', () => {
    it('should call repository update when updating item', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 'user-1', email: 'user@example.com', name: 'User', role: 'user', _id: 'user-1' };
      mockRequest.body = { name: 'Updated Item' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-1' };
      const updated = { id: '1', name: 'Updated Item', userId: 'user-1' };

      mockRepository.findUnique.mockResolvedValue(mockItem);
      mockRepository.update.mockResolvedValue(updated);

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findUnique).toHaveBeenCalledWith('1');
      expect(mockRepository.update).toHaveBeenCalledWith('1', expect.any(Object));
    });
  });

  describe('delete', () => {
    it('should call repository delete when deleting item', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 'user-1', email: 'user@example.com', name: 'User', role: 'user', _id: 'user-1' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-1' };

      mockRepository.findUnique.mockResolvedValue(mockItem);
      mockRepository.delete.mockResolvedValue(mockItem);

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findUnique).toHaveBeenCalledWith('1');
      expect(mockRepository.delete).toHaveBeenCalledWith('1');
    });
  });
});
