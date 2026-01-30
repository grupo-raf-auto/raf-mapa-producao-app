# Testing Guide

## Overview

This project uses Jest for unit testing and Supertest for E2E testing. All new features must include unit tests and E2E tests as part of the definition of done.

## Running Tests

### Unit Tests
```bash
cd server
npm run test                 # Run all unit tests
npm run test:watch         # Run tests in watch mode
npm run test:coverage      # Run tests with coverage report
```

### E2E Tests
```bash
cd server
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
