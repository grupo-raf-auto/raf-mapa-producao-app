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

jest.mock('../../lib/prisma', () => ({
  prisma: {
    formSubmission: {
      findMany: jest.fn(),
    },
  },
}));

import { UserStatsService } from '../../services/user-stats.service';
import { prisma } from '../../lib/prisma';

describe('UserStatsService', () => {
  let service: UserStatsService;
  const mockPrisma = prisma as jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserStatsService();
  });

  describe('generateStats', () => {
    it('should generate complete statistics without templateId', async () => {
      const mockSubmissions = [
        {
          id: '1',
          userId: 'user-1',
          templateId: 'template-1',
          submittedAt: new Date('2026-01-20'),
          user: { id: 'user-1', name: 'User One' },
          template: { id: 'template-1', name: 'Template One' },
        },
        {
          id: '2',
          userId: 'user-2',
          templateId: 'template-1',
          submittedAt: new Date('2026-01-25'),
          user: { id: 'user-2', name: 'User Two' },
          template: { id: 'template-1', name: 'Template One' },
        },
      ];

      mockPrisma.formSubmission.findMany.mockResolvedValue(mockSubmissions);

      const result = await service.generateStats();

      expect(result).toHaveProperty('totalSubmissions', 2);
      expect(result).toHaveProperty('uniqueUsers', 2);
      expect(result).toHaveProperty('submissionsByDay');
      expect(result).toHaveProperty('userStats');
      expect(result).toHaveProperty('templateStats');
      expect(mockPrisma.formSubmission.findMany).toHaveBeenCalled();
    });

    it('should filter by templateId when provided', async () => {
      const mockSubmissions = [
        {
          id: '1',
          userId: 'user-1',
          templateId: 'template-123',
          submittedAt: new Date('2026-01-25'),
          user: { id: 'user-1', name: 'User One' },
          template: { id: 'template-123', name: 'Template' },
        },
      ];

      mockPrisma.formSubmission.findMany.mockResolvedValue(mockSubmissions);

      const result = await service.generateStats('template-123');

      expect(result.totalSubmissions).toBe(1);
      expect(mockPrisma.formSubmission.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            templateId: 'template-123',
          }),
        })
      );
    });

    it('should handle empty submissions', async () => {
      mockPrisma.formSubmission.findMany.mockResolvedValue([]);

      const result = await service.generateStats();

      expect(result.totalSubmissions).toBe(0);
      expect(result.uniqueUsers).toBe(0);
      expect(result.userStats).toEqual([]);
      expect(result.templateStats).toEqual([]);
    });
  });

  describe('getTrending', () => {
    it('should call formSubmission.findMany with trending query', async () => {
      mockPrisma.formSubmission.findMany.mockResolvedValue([]);

      await service.getTrending(30);

      expect(mockPrisma.formSubmission.findMany).toHaveBeenCalled();
    });
  });
});
