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
    document: {
      findMany: jest.fn(),
    },
    chatMessage: {
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
    template: {
      findMany: jest.fn(),
    },
    question: {
      findMany: jest.fn(),
    },
    documentChunk: {
      count: jest.fn(),
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
          submittedBy: 'user-1',
          templateId: 'template-1',
          submittedAt: new Date('2026-01-20'),
          user: { id: 'user-1', name: 'User One', email: 'user1@test.com', role: 'user', createdAt: new Date() },
          template: { id: 'template-1', title: 'Template One' },
        },
        {
          id: '2',
          submittedBy: 'user-2',
          templateId: 'template-1',
          submittedAt: new Date('2026-01-25'),
          user: { id: 'user-2', name: 'User Two', email: 'user2@test.com', role: 'user', createdAt: new Date() },
          template: { id: 'template-1', title: 'Template One' },
        },
      ];

      mockPrisma.formSubmission.findMany.mockResolvedValue(mockSubmissions);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.template.findMany.mockResolvedValue([]);
      mockPrisma.question.findMany.mockResolvedValue([]);
      mockPrisma.documentChunk.count.mockResolvedValue(0);

      const result = await service.generateStats();

      expect(result).toHaveProperty('stats');
      expect(result.stats.totalSubmissions).toBe(2);
      expect(result).toHaveProperty('trends');
      expect(result.trends).toHaveProperty('submissionsByDay');
      expect(mockPrisma.formSubmission.findMany).toHaveBeenCalled();
    });

    it('should handle empty submissions', async () => {
      mockPrisma.formSubmission.findMany.mockResolvedValue([]);
      mockPrisma.document.findMany.mockResolvedValue([]);
      mockPrisma.chatMessage.findMany.mockResolvedValue([]);
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.template.findMany.mockResolvedValue([]);
      mockPrisma.question.findMany.mockResolvedValue([]);
      mockPrisma.documentChunk.count.mockResolvedValue(0);

      const result = await service.generateStats();

      expect(result.stats.totalSubmissions).toBe(0);
      expect(result.stats.totalUsers).toBe(0);
      expect(result.users).toEqual([]);
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
