# Test Architecture

## Overview

This document describes the testing architecture for RAF Mapa de Produção, including directory structure, test patterns by layer, and best practices.

## Directory Structure

```
backend/src/__tests__/
├── repositories/          # Repository unit tests
│   └── base.repository.test.ts
├── services/              # Service unit tests
│   └── user-stats.service.test.ts
├── controllers/           # Controller unit tests
│   └── base-crud.controller.test.ts
├── e2e/                   # End-to-end API tests (future)
│   ├── question.controller.e2e.test.ts
│   └── user.controller.e2e.test.ts
└── helpers/               # Test utilities
    └── auth.helper.ts
```

## Testing Strategy by Layer

### Layer 1: Repositories (Unit Tests)

**Purpose:** Verify data access operations work correctly in isolation

**Setup:**
- Mock Prisma delegate for the entity
- Create repository instance with mocked delegate
- Test CRUD operations without touching database

**Example:**
```typescript
import { BaseRepository } from '../../repositories/base.repository';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma');

describe('BaseRepository', () => {
  let repository: BaseRepository<User>;
  const mockDelegate = prisma.user as jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    repository = new BaseRepository(mockDelegate);
  });

  it('should find item by id', async () => {
    const mockUser = { id: '1', name: 'Test User' };
    mockDelegate.findUnique.mockResolvedValue(mockUser);

    const result = await repository.findUnique('1');

    expect(result).toEqual(mockUser);
    expect(mockDelegate.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
  });

  it('should apply pagination filters', async () => {
    mockDelegate.findMany.mockResolvedValue([]);

    await repository.findMany({ skip: 20, take: 10 });

    expect(mockDelegate.findMany).toHaveBeenCalledWith({ skip: 20, take: 10 });
  });
});
```

**Coverage Goals:** 80%+ of repository methods

### Layer 2: Services (Unit Tests)

**Purpose:** Verify business logic aggregations and transformations work correctly

**Setup:**
- Mock Prisma for complex database operations
- Create service instance
- Test aggregations, groupBy operations, data transformations

**Example:**
```typescript
import { UserStatsService } from '../../services/user-stats.service';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma');

describe('UserStatsService', () => {
  let service: UserStatsService;
  const mockPrisma = prisma as jest.Mocked<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new UserStatsService();
  });

  it('should aggregate submissions by day', async () => {
    const mockData = [
      { _count: { id: 10 }, createdAt: new Date('2026-01-30') },
      { _count: { id: 15 }, createdAt: new Date('2026-01-29') },
    ];
    mockPrisma.submission.groupBy.mockResolvedValue(mockData);

    const result = await service.aggregateByDay();

    expect(result).toBeDefined();
    expect(mockPrisma.submission.groupBy).toHaveBeenCalled();
  });

  it('should filter stats by templateId', async () => {
    mockPrisma.submission.findMany.mockResolvedValue([]);

    await service.generateStats('template-123');

    expect(mockPrisma.submission.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ templateId: 'template-123' })
      })
    );
  });
});
```

**Coverage Goals:** 80%+ of service methods

### Layer 3: Controllers (Unit Tests)

**Purpose:** Verify HTTP request handling, response formatting, and access control

**Setup:**
- Mock repository completely (no database operations)
- Create mock Request/Response objects
- Test CRUD operations and authorization

**Example:**
```typescript
import { BaseCRUDController } from '../../controllers/base-crud.controller';
import { BaseRepository } from '../../repositories/base.repository';
import { Request, Response } from 'express';

jest.mock('pino'); // Mock logger

describe('BaseCRUDController', () => {
  let controller: BaseCRUDController<any>;
  let mockRepository: jest.Mocked<BaseRepository<any>>;
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

    controller = new (class extends BaseCRUDController<any> {
      repository = mockRepository;
      createSchema = undefined;
      updateSchema = undefined;
    })();

    mockRequest = {
      query: {},
      body: {},
      params: {},
      user: { id: 'user-1', email: 'test@example.com', name: 'Test', role: 'user', _id: 'user-1' },
    };

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
      expect.objectContaining({
        data: expect.objectContaining({
          items: [{ id: '1' }],
          total: 1
        })
      })
    );
  });

  it('should enforce ownership checks', async () => {
    mockRequest.user = { id: 'user-1', role: 'user' };
    mockRequest.params = { id: '1' };

    const item = { id: '1', userId: 'user-2' }; // Different owner
    mockRepository.findUnique.mockResolvedValue(item);

    await controller.getById(mockRequest as Request, mockResponse as Response);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });
});
```

**Coverage Goals:** 90%+ for CRUD operations and access control

### Layer 4: API Endpoints (E2E Tests - Future)

**Purpose:** Verify complete request/response cycles with real database

**Setup:**
- Use real Express app instance
- Create test data in actual database
- Test full HTTP requests including auth

**Example (future implementation):**
```typescript
import request from 'supertest';
import { app } from '../../index';
import { prisma } from '../../lib/prisma';
import { createAuthToken } from '../helpers/auth.helper';

describe('GET /api/questions', () => {
  let authToken: string;
  let categoryId: string;

  beforeAll(async () => {
    const user = await prisma.user.create({
      data: { id: 'test-user', email: 'test@example.com', role: 'admin' }
    });
    authToken = createAuthToken(user);

    const category = await prisma.category.create({
      data: { id: 'test-category', name: 'Test' }
    });
    categoryId = category.id;
  });

  it('should list questions with pagination', async () => {
    const response = await request(app)
      .get('/api/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .query({ page: 1, limit: 10 });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

**Coverage Goals:** 100% of all endpoints

## Test Data Management

### Unit Tests (Isolated)

Use mocks to avoid database dependencies:
```typescript
jest.mock('../../lib/prisma');
```

### E2E Tests (Real Data - Future)

Create test data before tests, clean up after:
```typescript
beforeAll(async () => {
  testUser = await prisma.user.create({...});
  testCategory = await prisma.category.create({...});
});

afterAll(async () => {
  await prisma.user.delete({ where: { id: testUser.id } });
  await prisma.category.delete({ where: { id: testCategory.id } });
});
```

## Error Path Testing

Always test both success and failure cases:

```typescript
describe('POST /api/questions (validation)', () => {
  it('should reject invalid data', async () => {
    const response = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: '' }); // Empty title

    expect(response.status).toBe(400);
  });

  it('should reject without auth', async () => {
    const response = await request(app)
      .post('/api/questions')
      .send({ title: 'Test' });

    expect(response.status).toBe(401);
  });

  it('should enforce authorization', async () => {
    const response = await request(app)
      .post('/api/questions')
      .set('Authorization', `Bearer ${userToken}`) // Non-admin user
      .send({ title: 'Test', categoryId: 'cat-1' });

    expect(response.status).toBe(403);
  });
});
```

## Running Tests

```bash
# Setup
cd backend
npm install

# Run all unit tests
npm run test                          # Run once
npm run test:watch                   # Watch mode
npm run test:coverage                # Coverage report

# Run specific tests
npm run test -- src/__tests__/repositories/base.repository.test.ts
npm run test -- --testNamePattern="should find"

# Type checking
npm run type-check

# Full validation
npm run test:all                     # Type-check + unit + E2E
```

## Test Performance Targets

- **Unit tests:** < 500ms for all tests
- **E2E tests:** < 2s per endpoint group (future)
- **Full suite:** < 30s total execution time

Optimize slow tests by:
1. Mocking expensive operations
2. Using parallel test execution
3. Reducing test data size

## Coverage Goals

- **Repositories:** 80%+ coverage
- **Services:** 80%+ coverage
- **Controllers:** 90%+ coverage (especially CRUD and auth)
- **API Endpoints:** 100% coverage (future)

## Best Practices

1. **Test Isolation:**
   - Each test should be independent
   - Don't rely on test execution order
   - Clear mocks between tests with `jest.clearAllMocks()`

2. **Naming Conventions:**
   - Test names should describe what is being tested
   - Use "should..." pattern: "should return 404 for non-existent item"
   - Group related tests with describe blocks

3. **Arrange-Act-Assert (AAA) Pattern:**
   ```typescript
   it('should find user by email', async () => {
     // Arrange
     const email = 'test@example.com';
     mockDelegate.findUnique.mockResolvedValue({ id: '1', email });

     // Act
     const result = await repository.findByEmail(email);

     // Assert
     expect(result.email).toBe(email);
   });
   ```

4. **Mock Management:**
   - Mock external dependencies (Prisma, services)
   - Use `jest.fn()` for function mocks
   - Use `.mockResolvedValue()` for async mocks
   - Clear mocks in `beforeEach()`

5. **Assertion Practices:**
   - Be specific in assertions (test behavior, not implementation)
   - Use matchers like `expect.objectContaining()`
   - Test both happy path and error cases

## Continuous Integration

Tests run automatically on:
- Pull requests to main
- Before production deployments
- Every commit to development branches

Test failures block merges to main to ensure code quality.

## Next Steps

1. **Current Status (2026-01-30):**
   - ✅ 22 unit tests passing
   - ✅ Jest configured with TypeScript support
   - ✅ Repository, Service, and Controller layer tests

2. **Future Work:**
   - Create E2E tests for all API endpoints
   - Extend unit tests to remaining services
   - Achieve 80%+ coverage across all layers
   - Setup GitHub Actions for CI/CD

## References

- [Jest Documentation](https://jestjs.io)
- [Supertest Documentation](https://github.com/visionmedia/supertest)
- [Testing Library Best Practices](https://testing-library.com/docs/)
- See also: [docs/TESTING_GUIDE.md](./TESTING_GUIDE.md)
