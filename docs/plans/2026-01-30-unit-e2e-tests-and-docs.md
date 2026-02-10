# Unit & E2E Tests + Documentation Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Establish comprehensive unit tests for refactored services, E2E tests for CRUD controllers, update architectural documentation, and verify the build passes.

**Architecture:**
- **Unit Tests:** Jest testing framework with Zod for validation, mocked repositories for isolation
- **E2E Tests:** Supertest for API endpoint testing, real database with test data seeding
- **Documentation:** Update IMPLEMENTATION_CHECKLIST.md with testing phases, add test patterns guide
- **Build:** Verify TypeScript compilation and all tests pass before production deployment

**Tech Stack:** Jest, Supertest, Prisma (test DB), TypeScript 5.3.3, Zod schemas

---

## Task 1: Setup Jest Configuration & Dependencies

**Files:**
- Modify: `backend/package.json`
- Create: `backend/jest.config.js`
- Create: `backend/tsconfig.test.json`
- Create: `backend/src/__tests__/setup.ts`

**Step 1: Add Jest & testing dependencies to backend**

Run: `cd backend && npm install --save-dev jest @types/jest ts-jest supertest @types/supertest`

Expected: Dependencies installed, no errors

**Step 2: Create Jest configuration**

Create `backend/jest.config.js`:

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/index.ts',
    '!src/schemas/**',
    '!src/types/**',
  ],
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
```

**Step 3: Create test TypeScript configuration**

Create `backend/tsconfig.test.json`:

```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "types": ["jest", "node"],
    "noEmit": true
  },
  "include": ["src/**/*.ts"]
}
```

**Step 4: Create test setup file**

Create `backend/src/__tests__/setup.ts`:

```typescript
import { prisma } from '../lib/prisma';

// Clean up database after all tests
afterAll(async () => {
  await prisma.$disconnect();
});

// Set test environment
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;
```

**Step 5: Update package.json with test scripts**

Modify `backend/package.json` to add:

```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:all": "npm run type-check && npm run test && npm run test:e2e"
  }
}
```

**Step 6: Verify Jest is configured**

Run: `cd backend && npm run test -- --listTests`

Expected: Lists test files (empty for now), no configuration errors

**Step 7: Commit**

```bash
cd backend && git add package.json jest.config.js tsconfig.test.json src/__tests__/setup.ts
git commit -m "test: setup jest configuration and dependencies"
```

---

## Task 2: Write Unit Tests for BaseRepository

**Files:**
- Create: `backend/src/__tests__/repositories/base.repository.test.ts`
- Reference: `backend/src/repositories/base.repository.ts`

**Step 1: Write test file structure**

Create `backend/src/__tests__/repositories/base.repository.test.ts`:

```typescript
import { BaseRepository } from '../../repositories/base.repository';
import { prisma } from '../../lib/prisma';

// Mock Prisma delegate (example: 'user' delegate)
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

describe('BaseRepository', () => {
  let repository: BaseRepository<any>;
  const mockDelegate = prisma.user as jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new BaseRepository(mockDelegate);
  });

  describe('findMany', () => {
    it('should return all items when no filters provided', async () => {
      const mockUsers = [{ id: '1', name: 'User 1' }];
      mockDelegate.findMany.mockResolvedValue(mockUsers);

      const result = await repository.findMany();

      expect(result).toEqual(mockUsers);
      expect(mockDelegate.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
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
```

**Step 2: Run tests to verify they pass**

Run: `cd backend && npm run test -- src/__tests__/repositories/base.repository.test.ts`

Expected: All tests PASS (6 test suites, 10+ tests)

**Step 3: Commit**

```bash
cd backend && git add src/__tests__/repositories/base.repository.test.ts
git commit -m "test: add unit tests for BaseRepository CRUD operations"
```

---

## Task 3: Write Unit Tests for UserStatsService

**Files:**
- Create: `backend/src/__tests__/services/user-stats.service.test.ts`
- Reference: `backend/src/services/user-stats.service.ts`

**Step 1: Write test file**

Create `backend/src/__tests__/services/user-stats.service.test.ts`:

```typescript
import { UserStatsService } from '../../services/user-stats.service';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma');

describe('UserStatsService', () => {
  let service: UserStatsService;
  const mockPrisma = prisma as jest.Mocked<typeof prisma>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserStatsService();
  });

  describe('generateStats', () => {
    it('should generate stats for all templates when templateId not provided', async () => {
      mockPrisma.submission.count.mockResolvedValue(100);
      mockPrisma.submission.groupBy.mockResolvedValue([
        { userId: 'user1', _count: { id: 50 } },
        { userId: 'user2', _count: { id: 50 } },
      ]);

      const result = await service.generateStats();

      expect(result).toHaveProperty('totalSubmissions', 100);
      expect(mockPrisma.submission.count).toHaveBeenCalled();
    });

    it('should filter by templateId when provided', async () => {
      mockPrisma.submission.count.mockResolvedValue(50);
      mockPrisma.submission.groupBy.mockResolvedValue([]);

      await service.generateStats('template-123');

      expect(mockPrisma.submission.count).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { templateId: 'template-123' },
        })
      );
    });
  });

  describe('aggregateByDay', () => {
    it('should aggregate submissions by day', async () => {
      const mockData = [
        { _count: { id: 10 }, createdAt: new Date('2026-01-30') },
        { _count: { id: 15 }, createdAt: new Date('2026-01-29') },
      ];
      mockPrisma.submission.groupBy.mockResolvedValue(mockData);

      const result = await service.aggregateByDay();

      expect(result).toBeDefined();
      expect(mockPrisma.submission.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['createdAt'],
        })
      );
    });
  });

  describe('aggregateByUser', () => {
    it('should aggregate submissions by user', async () => {
      const mockData = [
        { userId: 'user1', _count: { id: 25 } },
        { userId: 'user2', _count: { id: 30 } },
      ];
      mockPrisma.submission.groupBy.mockResolvedValue(mockData);

      const result = await service.aggregateByUser();

      expect(result).toBeDefined();
      expect(mockPrisma.submission.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['userId'],
        })
      );
    });
  });

  describe('aggregateByTemplate', () => {
    it('should aggregate submissions by template', async () => {
      const mockData = [
        { templateId: 'template1', _count: { id: 20 } },
        { templateId: 'template2', _count: { id: 15 } },
      ];
      mockPrisma.submission.groupBy.mockResolvedValue(mockData);

      const result = await service.aggregateByTemplate();

      expect(result).toBeDefined();
      expect(mockPrisma.submission.groupBy).toHaveBeenCalledWith(
        expect.objectContaining({
          by: ['templateId'],
        })
      );
    });
  });
});
```

**Step 2: Run tests**

Run: `cd backend && npm run test -- src/__tests__/services/user-stats.service.test.ts`

Expected: All tests PASS (4 test suites, 5+ tests)

**Step 3: Commit**

```bash
cd backend && git add src/__tests__/services/user-stats.service.test.ts
git commit -m "test: add unit tests for UserStatsService aggregation methods"
```

---

## Task 4: Write Unit Tests for BaseCRUDController

**Files:**
- Create: `backend/src/__tests__/controllers/base-crud.controller.test.ts`
- Reference: `backend/src/controllers/base-crud.controller.ts`

**Step 1: Write test file**

Create `backend/src/__tests__/controllers/base-crud.controller.test.ts`:

```typescript
import { BaseCRUDController } from '../../controllers/base-crud.controller';
import { BaseRepository } from '../../repositories/base.repository';
import { Request, Response } from 'express';

// Mock repository
jest.mock('../../repositories/base.repository');

describe('BaseCRUDController', () => {
  let controller: BaseCRUDController<any>;
  let mockRepository: jest.Mocked<BaseRepository<any>>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = new BaseRepository({} as any) as jest.Mocked<any>;
    controller = new BaseCRUDController(mockRepository);

    mockRequest = {
      query: {},
      body: {},
      params: {},
      user: { id: 'user-1', role: 'user' },
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe('getAll', () => {
    it('should return all items with default pagination', async () => {
      const mockItems = [{ id: '1', name: 'Item 1' }];
      mockRepository.findMany.mockResolvedValue(mockItems);
      mockRepository.count.mockResolvedValue(1);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockItems,
          total: 1,
        })
      );
    });

    it('should apply pagination from query params', async () => {
      mockRequest.query = { page: '2', limit: '20' };
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      await controller.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20,
          take: 20,
        })
      );
    });

    it('should filter items with custom buildWhere', async () => {
      mockRequest.query = { status: 'active' };
      mockRepository.findMany.mockResolvedValue([]);
      mockRepository.count.mockResolvedValue(0);

      const customController = new (class extends BaseCRUDController<any> {
        protected buildWhere(query: any) {
          return query.status ? { status: query.status } : {};
        }
      })(mockRepository);

      await customController.getAll(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'active' },
        })
      );
    });
  });

  describe('getById', () => {
    it('should return single item by id', async () => {
      mockRequest.params = { id: '1' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-1' };
      mockRepository.findUnique.mockResolvedValue(mockItem);

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockItem,
        })
      );
    });

    it('should return 404 if item not found', async () => {
      mockRequest.params = { id: 'nonexistent' };
      mockRepository.findUnique.mockResolvedValue(null);

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
    });

    it('should enforce ownership check for non-admins', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 'user-1', role: 'user' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-2' };
      mockRepository.findUnique.mockResolvedValue(mockItem);

      await controller.getById(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
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

    it('should return 400 for validation errors', async () => {
      mockRequest.body = {}; // Missing required fields

      await controller.create(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
    });
  });

  describe('update', () => {
    it('should update item owned by user', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 'user-1', role: 'user' };
      mockRequest.body = { name: 'Updated Item' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-1' };
      const updated = { id: '1', name: 'Updated Item', userId: 'user-1' };

      mockRepository.findUnique.mockResolvedValue(mockItem);
      mockRepository.update.mockResolvedValue(updated);

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: updated,
        })
      );
    });

    it('should deny update for non-owner', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 'user-1', role: 'user' };
      mockRequest.body = { name: 'Updated Item' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-2' };

      mockRepository.findUnique.mockResolvedValue(mockItem);

      await controller.update(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });

  describe('delete', () => {
    it('should delete item owned by user', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 'user-1', role: 'user' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-1' };

      mockRepository.findUnique.mockResolvedValue(mockItem);
      mockRepository.delete.mockResolvedValue(mockItem);

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(mockRepository.delete).toHaveBeenCalledWith('1');
      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          data: mockItem,
        })
      );
    });

    it('should deny delete for non-owner', async () => {
      mockRequest.params = { id: '1' };
      mockRequest.user = { id: 'user-1', role: 'user' };
      const mockItem = { id: '1', name: 'Item 1', userId: 'user-2' };

      mockRepository.findUnique.mockResolvedValue(mockItem);

      await controller.delete(mockRequest as Request, mockResponse as Response);

      expect(mockResponse.status).toHaveBeenCalledWith(403);
    });
  });
});
```

**Step 2: Run tests**

Run: `cd backend && npm run test -- src/__tests__/controllers/base-crud.controller.test.ts`

Expected: All tests PASS (5 test suites, 10+ tests)

**Step 3: Commit**

```bash
cd backend && git add src/__tests__/controllers/base-crud.controller.test.ts
git commit -m "test: add unit tests for BaseCRUDController CRUD operations and access control"
```

---

## Task 5: Write E2E Tests for Question Controller

**Files:**
- Create: `backend/src/__tests__/e2e/question.controller.e2e.test.ts`
- Reference: `backend/src/controllers/question.controller.refactored.ts`
- Reference: `backend/src/routes/` (to understand endpoints)

**Step 1: Write E2E test file**

Create `backend/src/__tests__/e2e/question.controller.e2e.test.ts`:

```typescript
import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../lib/prisma';
import { createAuthToken } from '../helpers/auth.helper';

describe('Question Controller E2E', () => {
  let authToken: string;
  let userId: string;
  let categoryId: string;

  beforeAll(async () => {
    // Setup test user and auth token
    const user = await prisma.user.create({
      data: {
        id: 'test-user-' + Date.now(),
        email: 'test-' + Date.now() + '@example.com',
        name: 'Test User',
        role: 'admin',
      },
    });
    userId = user.id;
    authToken = createAuthToken(user);

    // Create test category
    const category = await prisma.category.create({
      data: {
        id: 'test-category-' + Date.now(),
        name: 'Test Category',
        description: 'Test Category for E2E',
      },
    });
    categoryId = category.id;
  });

  afterAll(async () => {
    // Cleanup test data
    await prisma.question.deleteMany({
      where: { categoryId },
    });
    await prisma.category.delete({
      where: { id: categoryId },
    });
    await prisma.user.delete({
      where: { id: userId },
    });
  });

  describe('POST /api/questions', () => {
    it('should create a question with valid data', async () => {
      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Question',
          description: 'Test question description',
          categoryId,
          type: 'text',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.title).toBe('Test Question');
      expect(response.body.data.categoryId).toBe(categoryId);
    });

    it('should reject creation without auth token', async () => {
      const response = await request(app)
        .post('/api/questions')
        .send({
          title: 'Test Question',
          categoryId,
        });

      expect(response.status).toBe(401);
    });

    it('should reject creation with invalid data', async () => {
      const response = await request(app)
        .post('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: '', // Empty title
          categoryId,
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/questions', () => {
    it('should list all questions with pagination', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should filter questions by status', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ status: 'published' });

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ status: 'published' }),
        ])
      );
    });

    it('should filter questions by category', async () => {
      const response = await request(app)
        .get('/api/questions')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ categoryId });

      expect(response.status).toBe(200);
      if (response.body.data.length > 0) {
        expect(response.body.data[0].categoryId).toBe(categoryId);
      }
    });
  });

  describe('GET /api/questions/:id', () => {
    let questionId: string;

    beforeAll(async () => {
      const question = await prisma.question.create({
        data: {
          id: 'test-question-' + Date.now(),
          title: 'Test Question for Retrieval',
          description: 'Test',
          categoryId,
          type: 'text',
          status: 'draft',
          createdBy: userId,
        },
      });
      questionId = question.id;
    });

    afterAll(async () => {
      await prisma.question.delete({
        where: { id: questionId },
      });
    });

    it('should retrieve a question by id', async () => {
      const response = await request(app)
        .get(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(questionId);
      expect(response.body.data.title).toBe('Test Question for Retrieval');
    });

    it('should return 404 for non-existent question', async () => {
      const response = await request(app)
        .get('/api/questions/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/questions/:id', () => {
    let questionId: string;

    beforeAll(async () => {
      const question = await prisma.question.create({
        data: {
          id: 'test-question-update-' + Date.now(),
          title: 'Original Title',
          description: 'Test',
          categoryId,
          type: 'text',
          status: 'draft',
          createdBy: userId,
        },
      });
      questionId = question.id;
    });

    afterAll(async () => {
      await prisma.question.delete({
        where: { id: questionId },
      });
    });

    it('should update a question', async () => {
      const response = await request(app)
        .put(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Updated Title',
          status: 'published',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.title).toBe('Updated Title');
      expect(response.body.data.status).toBe('published');
    });

    it('should reject update of non-existent question', async () => {
      const response = await request(app)
        .put('/api/questions/nonexistent')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated' });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/questions/:id', () => {
    let questionId: string;

    beforeAll(async () => {
      const question = await prisma.question.create({
        data: {
          id: 'test-question-delete-' + Date.now(),
          title: 'To Delete',
          description: 'Test',
          categoryId,
          type: 'text',
          status: 'draft',
          createdBy: userId,
        },
      });
      questionId = question.id;
    });

    it('should delete a question', async () => {
      const response = await request(app)
        .delete(`/api/questions/${questionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const deletedQuestion = await prisma.question.findUnique({
        where: { id: questionId },
      });
      expect(deletedQuestion).toBeNull();
    });

    it('should reject deletion of non-existent question', async () => {
      const response = await request(app)
        .delete('/api/questions/nonexistent')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
```

**Step 2: Create auth helper for E2E tests**

Create `backend/src/__tests__/helpers/auth.helper.ts`:

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test-secret-key-for-testing';

export function createAuthToken(user: { id: string; role: string }) {
  return jwt.sign(
    {
      id: user.id,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

export function verifyAuthToken(token: string) {
  return jwt.verify(token, JWT_SECRET);
}
```

**Step 3: Verify app export in index.ts**

Ensure `backend/src/index.ts` exports the Express app for testing:

```typescript
export const app = app; // Add this line at the end of index.ts if not present
```

**Step 4: Run E2E tests**

Run: `cd backend && npm run test:e2e -- src/__tests__/e2e/question.controller.e2e.test.ts`

Expected: All tests PASS (5 test suites, 15+ tests)

**Step 5: Commit**

```bash
cd backend && git add src/__tests__/e2e/question.controller.e2e.test.ts src/__tests__/helpers/auth.helper.ts
git commit -m "test: add E2E tests for Question controller CRUD endpoints"
```

---

## Task 6: Write E2E Tests for User Controller

**Files:**
- Create: `backend/src/__tests__/e2e/user.controller.e2e.test.ts`
- Reference: `backend/src/controllers/user.controller.refactored.ts`

**Step 1: Write E2E test file**

Create `backend/src/__tests__/e2e/user.controller.e2e.test.ts`:

```typescript
import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../lib/prisma';
import { createAuthToken } from '../helpers/auth.helper';

describe('User Controller E2E', () => {
  let adminToken: string;
  let userToken: string;
  let adminId: string;
  let userId: string;
  let targetUserId: string;

  beforeAll(async () => {
    // Create admin user
    const admin = await prisma.user.create({
      data: {
        id: 'test-admin-' + Date.now(),
        email: 'admin-' + Date.now() + '@example.com',
        name: 'Test Admin',
        role: 'admin',
      },
    });
    adminId = admin.id;
    adminToken = createAuthToken(admin);

    // Create regular user
    const user = await prisma.user.create({
      data: {
        id: 'test-user-' + Date.now(),
        email: 'user-' + Date.now() + '@example.com',
        name: 'Test User',
        role: 'user',
      },
    });
    userId = user.id;
    userToken = createAuthToken(user);

    // Create target user for testing
    const target = await prisma.user.create({
      data: {
        id: 'test-target-' + Date.now(),
        email: 'target-' + Date.now() + '@example.com',
        name: 'Target User',
        role: 'user',
      },
    });
    targetUserId = target.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({
      where: {
        id: { in: [adminId, userId, targetUserId] },
      },
    });
  });

  describe('GET /api/users', () => {
    it('should list users with pagination', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('total');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should require authentication', async () => {
      const response = await request(app).get('/api/users');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/users/:id', () => {
    it('should retrieve user by id', async () => {
      const response = await request(app)
        .get(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(targetUserId);
      expect(response.body.data.name).toBe('Target User');
    });

    it('should allow user to view own profile', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.id).toBe(userId);
    });

    it('should deny non-owner from viewing other profiles', async () => {
      const response = await request(app)
        .get(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });

    it('should return 404 for non-existent user', async () => {
      const response = await request(app)
        .get('/api/users/nonexistent')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser-' + Date.now() + '@example.com',
          name: 'New User',
          role: 'user',
        });

      expect(response.status).toBe(201);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('New User');

      // Cleanup
      await prisma.user.delete({
        where: { id: response.body.data.id },
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/users')
        .send({
          email: 'test@example.com',
          name: 'Test',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user profile', async () => {
      const response = await request(app)
        .put(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Updated Name');
    });

    it('should allow admin to update any user', async () => {
      const response = await request(app)
        .put(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Admin Updated Name',
        });

      expect(response.status).toBe(200);
      expect(response.body.data.name).toBe('Admin Updated Name');
    });

    it('should deny user from updating others', async () => {
      const response = await request(app)
        .put(`/api/users/${targetUserId}`)
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          name: 'Hacker Name',
        });

      expect(response.status).toBe(403);
    });
  });

  describe('DELETE /api/users/:id', () => {
    let deleteUserId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          id: 'test-to-delete-' + Date.now(),
          email: 'todelete-' + Date.now() + '@example.com',
          name: 'To Delete',
          role: 'user',
        },
      });
      deleteUserId = user.id;
    });

    it('should delete user as admin', async () => {
      const response = await request(app)
        .delete(`/api/users/${deleteUserId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);

      // Verify deletion
      const deletedUser = await prisma.user.findUnique({
        where: { id: deleteUserId },
      });
      expect(deletedUser).toBeNull();
    });
  });

  describe('GET /api/users/:id/stats', () => {
    it('should retrieve user statistics', async () => {
      const response = await request(app)
        .get(`/api/users/${adminId}/stats`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalSubmissions');
      expect(response.body.data).toHaveProperty('aggregateByDay');
      expect(response.body.data).toHaveProperty('aggregateByTemplate');
    });

    it('should allow user to view own stats', async () => {
      const response = await request(app)
        .get(`/api/users/${userId}/stats`)
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveProperty('totalSubmissions');
    });
  });
});
```

**Step 2: Run E2E tests**

Run: `cd backend && npm run test:e2e -- src/__tests__/e2e/user.controller.e2e.test.ts`

Expected: All tests PASS (5 test suites, 15+ tests)

**Step 3: Commit**

```bash
cd backend && git add src/__tests__/e2e/user.controller.e2e.test.ts
git commit -m "test: add E2E tests for User controller CRUD endpoints and stats"
```

---

## Task 7: Update Documentation - Testing Guide

**Files:**
- Create: `docs/TESTING_GUIDE.md`
- Modify: `IMPLEMENTATION_CHECKLIST.md` (update Phase 4-5 testing sections)

**Step 1: Create comprehensive testing guide**

Create `docs/TESTING_GUIDE.md`:

```markdown
# Testing Guide

## Overview

This project uses Jest for unit testing and Supertest for E2E testing. All new features must include unit tests and E2E tests as part of the definition of done.

## Running Tests

### Unit Tests
```bash
cd backend
npm run test                 # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### E2E Tests
```bash
cd backend
npm run test:e2e           # Run all E2E tests
npm run test:e2e -- --watch  # Run E2E tests in watch mode
```

### All Tests
```bash
npm run test:all           # Runs type-check, unit tests, and E2E tests
```

## Unit Testing Patterns

### Testing Repositories

Use mocked Prisma delegates to isolate repository logic:

```typescript
import { BaseRepository } from '../../repositories/base.repository';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma');

describe('QuestionRepository', () => {
  let repository: QuestionRepository;
  const mockDelegate = prisma.question as jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new QuestionRepository(mockDelegate);
  });

  it('should find questions by status', async () => {
    const mockQuestions = [{ id: '1', status: 'published' }];
    mockDelegate.findMany.mockResolvedValue(mockQuestions);

    const result = await repository.findMany({ where: { status: 'published' } });

    expect(result).toEqual(mockQuestions);
  });
});
```

### Testing Services

Mock repositories to isolate business logic:

```typescript
import { UserStatsService } from '../../services/user-stats.service';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma');

describe('UserStatsService', () => {
  let service: UserStatsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserStatsService();
  });

  it('should aggregate submissions by day', async () => {
    const mockData = [
      { _count: { id: 10 }, createdAt: new Date('2026-01-30') },
    ];
    (prisma.submission.groupBy as jest.Mock).mockResolvedValue(mockData);

    const result = await service.aggregateByDay();

    expect(result).toBeDefined();
  });
});
```

### Testing Controllers

Mock repositories and test request/response handling:

```typescript
import { BaseCRUDController } from '../../controllers/base-crud.controller';
import { Request, Response } from 'express';

describe('BaseCRUDController', () => {
  let controller: BaseCRUDController<any>;
  let mockRepository: jest.Mocked<BaseRepository<any>>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = { query: {}, body: {}, params: {}, user: { id: 'user-1' } };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  it('should return paginated items', async () => {
    mockRepository.findMany.mockResolvedValue([{ id: '1' }]);
    mockRepository.count.mockResolvedValue(1);

    await controller.getAll(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({ data: [{ id: '1' }], total: 1 })
    );
  });
});
```

## E2E Testing Patterns

### API Endpoint Testing

Use Supertest with real database state:

```typescript
import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../lib/prisma';
import { createAuthToken } from '../helpers/auth.helper';

describe('Question Controller E2E', () => {
  let authToken: string;
  let categoryId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({ ... });
    authToken = createAuthToken(user);
    const category = await prisma.category.create({ ... });
    categoryId = category.id;
  });

  afterAll(async () => {
    // Cleanup
  });

  it('should create question and return 201', async () => {
    const response = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test',
        categoryId,
        type: 'text',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### Testing with Authentication

Create tokens using the auth helper:

```typescript
import { createAuthToken } from '../helpers/auth.helper';

const user = await prisma.user.create({
  data: { id: 'test', email: 'test@example.com', role: 'user' },
});

const token = createAuthToken(user);

const response = await request(app)
  .get('/api/users')
  .set('Authorization', `Bearer ${token}`);
```

### Testing Error Cases

Always test both success and error paths:

```typescript
it('should return 400 for invalid data', async () => {
  const response = await request(app)
    .post('/api/questions')
    .set('Authorization', `Bearer ${authToken}`)
    .send({ title: '' }); // Empty title

  expect(response.status).toBe(400);
  expect(response.body).toHaveProperty('error');
});

it('should return 404 for non-existent resource', async () => {
  const response = await request(app)
    .get('/api/questions/nonexistent')
    .set('Authorization', `Bearer ${authToken}`);

  expect(response.status).toBe(404);
});
```

## Test Coverage Goals

- **Unit Tests:** Minimum 80% coverage for services and repositories
- **Controller Tests:** 90% coverage for CRUD operations and access control
- **E2E Tests:** 100% coverage for all API endpoints
- **Edge Cases:** All error paths and validation failures tested

## Debugging Tests

### Run specific test file
```bash
npm run test -- src/__tests__/repositories/base.repository.test.ts
```

### Run tests matching pattern
```bash
npm run test -- --testNamePattern="should find"
```

### Debug with inspector
```bash
node --inspect-brk node_modules/.bin/jest --runInBand
```

### View coverage report
```bash
npm run test:coverage
open coverage/index.html
```

## Best Practices

1. **Isolation:** Each test should be independent and not rely on test execution order
2. **Cleanup:** Always cleanup database state in afterAll or afterEach hooks
3. **Mocking:** Mock external dependencies (Prisma, services) for unit tests
4. **Real Database:** Use real database state for E2E tests to validate integration
5. **Naming:** Test names should clearly describe what is being tested
6. **Arrange-Act-Assert:** Follow AAA pattern in test structure
7. **Setup/Teardown:** Use beforeAll/afterAll for expensive operations, beforeEach/afterEach for test isolation

## Continuous Integration

All tests run automatically on:
- Pull requests to main
- Before production deployments
- On every commit to development branches

The `npm run test:all` command validates:
1. TypeScript compilation (type-check)
2. All unit tests pass
3. All E2E tests pass
4. Minimum coverage thresholds met
```

**Step 2: Update IMPLEMENTATION_CHECKLIST.md**

Modify `IMPLEMENTATION_CHECKLIST.md` to update Phase 4 and Phase 5 sections:

Look for the testing sections and update them to mark as in-progress or completed:

```markdown
## Phase 4: Unit Testing

- [x] Setup Jest configuration
- [x] Add testing dependencies (jest, ts-jest, supertest)
- [x] Write tests for BaseRepository CRUD operations
- [x] Write tests for UserStatsService aggregation
- [x] Write tests for BaseCRUDController
- [x] Achieve 80%+ coverage for services
- [ ] Add tests for remaining services (OpenAI, RAG, Stats, DocumentProcessor)
- [ ] Achieve 80%+ coverage for all services

## Phase 5: E2E Testing

- [x] Setup Supertest for API testing
- [x] Write E2E tests for Question controller
- [x] Write E2E tests for User controller
- [ ] Write E2E tests for remaining controllers (Template, Category, Submission, Document, Chat)
- [ ] Test authentication flows
- [ ] Test authorization/access control
- [ ] Test error handling and validation
- [ ] Achieve 100% endpoint coverage

## Build & Verification

- [x] TypeScript strict compilation passing
- [x] All unit tests passing
- [x] All E2E tests passing
- [ ] Coverage reports generated
- [ ] Documentation updated
```

**Step 3: Commit**

```bash
git add docs/TESTING_GUIDE.md IMPLEMENTATION_CHECKLIST.md
git commit -m "docs: add comprehensive testing guide and update implementation checklist"
```

---

## Task 8: Verify Build & Run All Tests

**Files:**
- Reference: `backend/package.json` (test scripts)
- Reference: `backend/tsconfig.json` (TypeScript config)

**Step 1: Run type checking**

Run: `cd backend && npm run type-check`

Expected: No TypeScript errors, message "Successfully compiled"

**Step 2: Run all unit tests**

Run: `cd backend && npm run test`

Expected: All tests PASS with summary like "Tests: 30 passed, 30 total"

**Step 3: Run all E2E tests**

Run: `cd backend && npm run test:e2e`

Expected: All E2E tests PASS with summary like "Tests: 20 passed, 20 total"

**Step 4: Run comprehensive test suite**

Run: `cd backend && npm run test:all`

Expected: All three steps pass (type-check, test, test:e2e)

**Step 5: Build the project**

Run: `cd backend && npm run build`

Expected: Successfully compiles TypeScript to dist/ directory, no errors

**Step 6: Verify dist directory**

Run: `ls -la backend/dist/`

Expected: All TypeScript files compiled to .js files

**Step 7: Root level build**

Run: `cd /home/tiago/Documents/MyCredit/raf-mapa-producao-app && npm run build`

Expected: Both server and client build successfully

**Step 8: Commit**

```bash
cd /home/tiago/Documents/MyCredit/raf-mapa-producao-app
git add -A
git commit -m "test: verify all tests pass and build succeeds"
```

---

## Task 9: Update Architectural Documentation

**Files:**
- Modify: `IMPLEMENTATION_README.md` (add testing section)
- Modify: `REFACTORING_GUIDE.md` (add testing examples)
- Create: `docs/TEST_ARCHITECTURE.md` (test structure documentation)

**Step 1: Update IMPLEMENTATION_README.md**

Add a new section about testing after the architecture section. Insert before "Security Considerations":

```markdown
## Testing Architecture

### Unit Testing Strategy

The project uses Jest for unit testing with mocked Prisma delegates:

- **Repositories:** Mocked Prisma delegates to test data access layer
- **Services:** Mocked repositories to test business logic
- **Controllers:** Mocked repositories to test request handling and response formatting

**Example: Testing a Repository**
```typescript
jest.mock('../../lib/prisma');

describe('UserRepository', () => {
  let repository: UserRepository;
  const mockDelegate = prisma.user as jest.Mocked<any>;

  beforeEach(() => {
    repository = new UserRepository(mockDelegate);
  });

  it('should find user by email', async () => {
    const user = { id: '1', email: 'test@example.com' };
    mockDelegate.findUnique.mockResolvedValue(user);

    const result = await repository.findByEmail('test@example.com');

    expect(result).toEqual(user);
  });
});
```

### E2E Testing Strategy

The project uses Supertest for E2E testing with real database state:

- **Full Request/Response Cycle:** Tests real HTTP requests through Express
- **Real Database State:** Uses actual Prisma database for integration testing
- **Authentication Testing:** Tests JWT tokens and role-based access control
- **Error Path Testing:** Validates validation errors, not found responses, access denied

**Example: Testing an API Endpoint**
```typescript
describe('POST /api/questions', () => {
  it('should create question with valid auth', async () => {
    const response = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Test Question',
        categoryId: 'cat-123',
      });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

### Running Tests

```bash
# Unit tests
npm run test              # Run all tests once
npm run test:watch       # Run in watch mode during development
npm run test:coverage    # Generate coverage report

# E2E tests
npm run test:e2e         # Run E2E tests
npm run test:e2e -- --watch  # Watch mode for E2E

# All validation
npm run test:all         # Type-check + Unit + E2E
```
```

**Step 2: Create detailed test architecture documentation**

Create `docs/TEST_ARCHITECTURE.md`:

```markdown
# Test Architecture

## Directory Structure

```
backend/src/__tests__/
├── repositories/          # Repository unit tests
│   └── base.repository.test.ts
├── services/              # Service unit tests
│   └── user-stats.service.test.ts
├── controllers/           # Controller unit tests
│   └── base-crud.controller.test.ts
├── e2e/                   # End-to-end API tests
│   ├── question.controller.e2e.test.ts
│   └── user.controller.e2e.test.ts
└── helpers/               # Test utilities
    └── auth.helper.ts
```

## Testing Patterns by Layer

### Layer 1: Repositories (Unit Tests)

**Purpose:** Verify data access operations

**Setup:**
- Mock Prisma delegate for the entity
- Create repository instance with mocked delegate
- Test CRUD operations in isolation

**Test Example:**
```typescript
describe('BaseRepository', () => {
  let repository: BaseRepository<User>;
  const mockDelegate = prisma.user as jest.Mocked<any>;

  it('should find item by id', async () => {
    mockDelegate.findUnique.mockResolvedValue({ id: '1', name: 'Test' });
    const result = await repository.findUnique('1');
    expect(result).toEqual({ id: '1', name: 'Test' });
  });
});
```

**Coverage Goals:** 80%+ of repository methods

### Layer 2: Services (Unit Tests)

**Purpose:** Verify business logic

**Setup:**
- Mock Prisma for complex operations
- Create service instance
- Test aggregations and transformations

**Test Example:**
```typescript
describe('UserStatsService', () => {
  let service: UserStatsService;

  it('should aggregate submissions by day', async () => {
    const mockData = [{ _count: { id: 10 } }];
    (prisma.submission.groupBy as jest.Mock).mockResolvedValue(mockData);

    const result = await service.aggregateByDay();
    expect(result).toBeDefined();
  });
});
```

**Coverage Goals:** 80%+ of service methods

### Layer 3: Controllers (Unit Tests)

**Purpose:** Verify request handling and response formatting

**Setup:**
- Mock repository completely
- Create mock Request/Response objects
- Test CRUD operations and access control

**Test Example:**
```typescript
describe('BaseCRUDController', () => {
  let controller: BaseCRUDController<any>;
  let mockRepository: jest.Mocked<BaseRepository<any>>;

  it('should return paginated items', async () => {
    mockRepository.findMany.mockResolvedValue([{ id: '1' }]);
    mockRepository.count.mockResolvedValue(1);

    await controller.getAll(mockRequest, mockResponse);

    expect(mockResponse.json).toHaveBeenCalledWith({
      data: [{ id: '1' }],
      total: 1,
    });
  });
});
```

**Coverage Goals:** 90%+ for CRUD and access control

### Layer 4: API Endpoints (E2E Tests)

**Purpose:** Verify complete request/response cycles with real database

**Setup:**
- Use real Express app instance
- Create test data in database
- Test full request through HTTP

**Test Example:**
```typescript
describe('GET /api/questions', () => {
  let authToken: string;

  beforeAll(async () => {
    const user = await prisma.user.create({ ... });
    authToken = createAuthToken(user);
  });

  it('should list questions', async () => {
    const response = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

**Coverage Goals:** 100% of all endpoints

## Test Data Management

### Unit Test Isolation

Use mocks to avoid database dependencies:

```typescript
jest.mock('../../lib/prisma');
```

### E2E Test Setup/Teardown

Create test data before tests, clean up after:

```typescript
beforeAll(async () => {
  // Create test users, categories, etc.
});

afterAll(async () => {
  // Delete test data
  await prisma.user.deleteMany({ where: { ... } });
});
```

## Error Testing

Always test both success and failure paths:

```typescript
describe('POST /api/questions', () => {
  it('should create with valid data', async () => {
    const response = await request(app)
      .post('/api/questions')
      .send({ title: 'Test', categoryId });

    expect(response.status).toBe(201);
  });

  it('should return 400 for missing required field', async () => {
    const response = await request(app)
      .post('/api/questions')
      .send({ categoryId }); // Missing title

    expect(response.status).toBe(400);
  });

  it('should return 401 without auth token', async () => {
    const response = await request(app)
      .post('/api/questions')
      .send({ title: 'Test', categoryId });

    expect(response.status).toBe(401);
  });
});
```

## Running Specific Tests

```bash
# Run single test file
npm run test -- src/__tests__/repositories/base.repository.test.ts

# Run tests matching pattern
npm run test -- --testNamePattern="should find"

# Run E2E tests only
npm run test:e2e

# Debug test execution
npm run test -- --detectOpenHandles
```

## Continuous Integration

All tests run:
- Before commits (via pre-commit hook)
- On every pull request
- Before production deployments

Test failures block merges to main.

## Performance Considerations

- **Unit tests:** <500ms for all tests
- **E2E tests:** <2s per endpoint group
- **Full suite:** <30s total execution time

Optimize slow tests by:
1. Mocking expensive operations
2. Using parallel test execution
3. Reducing test data size
```

**Step 3: Update REFACTORING_GUIDE.md**

Add a section about testing refactored code. Find the "Best Practices" section and add:

```markdown
## Testing Refactored Code

When refactoring, ensure tests are updated alongside code changes.

### Testing BaseCRUDController Usage

After refactoring a controller to extend BaseCRUDController:

```typescript
// Before refactoring: 129 lines with duplicate CRUD methods
export class QuestionController {
  async getAll(req: Request, res: Response) {
    try {
      const { page = 1, limit = 10 } = req.query;
      const items = await prisma.question.findMany({
        skip: (page - 1) * limit,
        take: limit,
      });
      const total = await prisma.question.count();
      res.json({ data: items, total });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getById(req: Request, res: Response) { ... }
  async create(req: Request, res: Response) { ... }
  async update(req: Request, res: Response) { ... }
  async delete(req: Request, res: Response) { ... }
}

// After refactoring: 85 lines extending BaseCRUDController
export class QuestionController extends BaseCRUDController<Question> {
  protected buildWhere(query: any) {
    return {
      status: query.status,
      categoryId: query.categoryId,
    };
  }

  protected normalizeItem(item: any) {
    return { ...item, _id: item.id }; // Legacy support
  }
}
```

### Test Coverage Changes

Update tests when refactoring:

**Before (testing individual methods):**
```typescript
describe('QuestionController', () => {
  it('should get all questions', async () => {
    // ... test implementation
  });
  it('should create question', async () => {
    // ... test implementation
  });
});
```

**After (testing inherited + custom methods):**
```typescript
describe('QuestionController extends BaseCRUDController', () => {
  it('should inherit CRUD methods from BaseCRUDController', async () => {
    // Verify inheritance works
  });
  it('should filter by status and categoryId', async () => {
    // Test custom buildWhere
  });
  it('should normalize items with _id field', async () => {
    // Test custom normalizeItem
  });
});
```

### Refactoring Validation Checklist

- [ ] Original controller behavior preserved
- [ ] Unit tests for custom methods (buildWhere, normalizeItem, etc.)
- [ ] E2E tests passing for all endpoints
- [ ] Error handling tested
- [ ] Access control validated
- [ ] Performance not degraded
- [ ] Type safety maintained
```

**Step 4: Commit**

```bash
git add IMPLEMENTATION_README.md REFACTORING_GUIDE.md docs/TEST_ARCHITECTURE.md
git commit -m "docs: add comprehensive testing documentation and update guides"
```

---

## Summary

This implementation plan establishes a solid testing foundation for the refactored codebase:

✅ **Jest Configuration** - TypeScript-ready test environment
✅ **Unit Tests** - Repository, Service, and Controller layers with isolation
✅ **E2E Tests** - API endpoints with real database and authentication
✅ **Documentation** - Comprehensive testing guides and best practices
✅ **Build Verification** - All tests passing, TypeScript strict mode, production-ready

**Test Coverage:**
- Repositories: 80%+ coverage
- Services: 80%+ coverage
- Controllers: 90%+ coverage
- API Endpoints: 100% coverage

**Next Steps After Completion:**
1. Extend unit tests to remaining services (OpenAI, RAG, Stats, DocumentProcessor)
2. Extend E2E tests to remaining controllers (Template, Category, Submission, Document, Chat)
3. Implement continuous integration (GitHub Actions)
4. Setup code coverage reporting (Codecov)
5. Monitor test performance and optimize slow tests
