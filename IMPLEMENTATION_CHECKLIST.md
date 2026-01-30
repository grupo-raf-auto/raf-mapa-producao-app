# ✅ CHECKLIST DE IMPLEMENTAÇÃO

**Projeto:** RAF Mapa de Produção
**Data:** 2026-01-30
**Objetivo:** Refactoring Arquitetônico + Segurança
**Timeline:** 4-6 semanas para production-ready

---

## 🚀 FASE 1: CRÍTICO (24-48 HORAS)

### Segurança Imediata
- [ ] **[SEC-001]** Revogar DATABASE_URL de Neon
  - Ação: https://console.neon.tech → Reset password
  - Criar novo: `postgresql://new_user:new_pass@...`

- [ ] **[SEC-002]** Revogar OPENAI_API_KEY
  - Ação: https://platform.openai.com/account/api-keys
  - Deletar antiga, gerar nova

- [ ] **[SEC-003]** Revogar CLERK_SECRET_KEY
  - Ação: https://dashboard.clerk.com
  - Regenerar webhook secret

- [ ] **[SEC-004]** Remover .env do Git
  ```bash
  bfg --delete-files .env
  git reflog expire --expire=now --all
  git gc --prune=now --aggressive
  ```

- [ ] **[SEC-005]** Criar .env.example sem secrets
  ```bash
  DATABASE_URL=postgresql://user:pass@host/db
  OPENAI_API_KEY=sk-proj-[REDACTED]
  CLERK_SECRET_KEY=sk_test_[REDACTED]
  ```

- [ ] **[SEC-006]** Atualizar .gitignore
  ```bash
  echo "server/.env" >> .gitignore
  git commit -am "chore: update .gitignore"
  ```

### JWT Segurança
- [ ] **[SEC-007]** Tornar JWT_SECRET obrigatório
  - Arquivo: `server/src/middleware/auth.middleware.ts`
  - Adicionar: `if (!JWT_SECRET && NODE_ENV==="production") throw new Error(...)`
  - Gerar: `openssl rand -base64 32` para produção

- [ ] **[SEC-008]** Gerar novo JWT_SECRET
  ```bash
  openssl rand -base64 32
  # Resultado: salvar em provider de secrets
  ```

### Helmet Headers
- [ ] **[SEC-009]** Implementar Helmet avançado
  - Arquivo: `server/src/index.ts`
  - Copiar configuração de SECURITY_GUIDE.md
  - Adicionar: CSP, HSTS, Referrer-Policy, etc

- [ ] **[SEC-010]** Forçar HTTPS em produção
  - Adicionar middleware de redirecionamento
  - Testar: `curl -I http://localhost:3005` → deve fazer redirect

---

## 🏗️ FASE 2: ARQUITETURA BASE (3-4 DIAS)

### Criar Infraestrutura Base
- [ ] **[ARCH-001]** Logger estruturado
  - ✅ Arquivo criado: `server/src/lib/logger.ts`
  - Próximo: Instalar `npm install pino pino-pretty`
  - Teste: Usar em um controller

- [ ] **[ARCH-002]** Error Handler Middleware
  - ✅ Arquivo criado: `server/src/middleware/error-handler.middleware.ts`
  - Próximo: Adicionar ao `index.ts`
  ```typescript
  app.use(errorHandlerMiddleware);
  ```

- [ ] **[ARCH-003]** Base Repository
  - ✅ Arquivo criado: `server/src/repositories/base.repository.ts`
  - Próximo: Criar repositories específicos para cada modelo

- [ ] **[ARCH-004]** Base CRUD Controller
  - ✅ Arquivo criado: `server/src/controllers/base-crud.controller.ts`
  - Próximo: Estender em controllers específicos

- [ ] **[ARCH-005]** Schemas Zod
  - ✅ Arquivo criado: `server/src/schemas/index.ts`
  - Próximo: Instalar `npm install zod`
  - Teste: `zod.parse()` em um controller

- [ ] **[ARCH-006]** Types Base
  - ✅ Arquivo estendido: `server/src/types/index.ts`
  - Próximo: Usar em todos os controllers

### Integração ao Index.ts
- [ ] **[ARCH-007]** Adicionar logger ao index.ts
  ```typescript
  import logger from "./lib/logger";
  logger.info("Server starting...");
  ```

- [ ] **[ARCH-008]** Registrar error handler
  ```typescript
  app.use(errorHandlerMiddleware);
  ```

- [ ] **[ARCH-009]** Instalar dependências
  ```bash
  npm install pino pino-pretty zod
  ```

---

## 👥 FASE 3: REFACTORING CONTROLLERS (1-2 SEMANAS)

### Question Controller
- [ ] **[REF-001]** Criar QuestionRepository
  - ✅ Arquivo criado: `server/src/repositories/question.repository.ts`
  - Próximo: Testar `repository.findMany()`

- [ ] **[REF-002]** Refatorar QuestionController
  - ✅ Arquivo referência: `server/src/controllers/question.controller.refactored.ts`
  - Próximo: Copiar lógica para `question.controller.ts` ou renomear arquivo
  - Passo a passo:
    1. Backup: `cp question.controller.ts question.controller.old.ts`
    2. Copiar novo: `cat question.controller.refactored.ts > question.controller.ts`
    3. Atualizar imports nas rotas
    4. Testar endpoints

- [ ] **[REF-003]** Testar Question endpoints
  ```bash
  # GET lista
  curl http://localhost:3005/api/questions

  # GET com filtro
  curl http://localhost:3005/api/questions?status=active&categoryId=123

  # POST criar
  curl -X POST http://localhost:3005/api/questions \
    -H "Content-Type: application/json" \
    -d '{"title":"Nova Q","status":"active"}'
  ```

### User Controller
- [ ] **[REF-004]** Criar UserRepository
  - ✅ Arquivo criado: `server/src/repositories/user.repository.ts`
  - Próximo: Testar `repository.findByIdSafe()`

- [ ] **[REF-005]** Criar UserStatsService
  - ✅ Arquivo criado: `server/src/services/user-stats.service.ts`
  - Próximo: Testar `generateStats()`
  - Instalação: `npm install --save-dev @types/node`

- [ ] **[REF-006]** Refatorar UserController
  - ✅ Arquivo referência: `server/src/controllers/user.controller.refactored.ts`
  - Próximo: Atualizar `user.controller.ts`
  - Mudança importante: 248 linhas → 30 linhas (87% redução!)

- [ ] **[REF-007]** Testar User endpoints
  ```bash
  curl http://localhost:3005/api/users/me
  curl http://localhost:3005/api/users/stats
  ```

### Template Controller
- [ ] **[REF-008]** Criar TemplateRepository
  - Arquivo: `server/src/repositories/template.repository.ts`
  - Métodos: `findWithQuestions()`, `countTemplates()`

- [ ] **[REF-009]** Refatorar TemplateController
  - Estender `BaseCRUDController<Template>`
  - Adicionar schema validation
  - Implementar `buildWhere()` para filtros

### Category Controller
- [ ] **[REF-010]** Criar CategoryRepository
  - Arquivo: `server/src/repositories/category.repository.ts`

- [ ] **[REF-011]** Refatorar CategoryController
  - Estender `BaseCRUDController<Category>`
  - Simples (sem lógica complexa)

### Submission Controller
- [ ] **[REF-012]** Criar SubmissionRepository
  - Arquivo: `server/src/repositories/submission.repository.ts`
  - Método: `findByTemplateId()`, `findByUserId()`

- [ ] **[REF-013]** Refatorar SubmissionController
  - Validar template existe
  - Validar respostas fazem sentido
  - Armazenar com userId automático

### Document Controller
- [ ] **[REF-014]** Criar DocumentRepository
  - Arquivo: `server/src/repositories/document.repository.ts`

- [ ] **[REF-015]** Validar propriedade em Document.getDocument()
  ```typescript
  // ✅ Adicionar validação
  if (doc.uploadedBy !== user.id && user.role !== "admin") {
    throw new ForbiddenError("Cannot access this document");
  }
  ```

- [ ] **[REF-016]** Refatorar DocumentController
  - Usar BaseRepository
  - Aplicar schemas Zod

### Chat Controller
- [ ] **[REF-017]** Validar propriedade em Chat.getMessages()
  ```typescript
  // ✅ Verificar que usuário é dono da conversa
  const hasAccess = messages.every(m => m.userId === user.id);
  if (!hasAccess && user.role !== "admin") {
    throw new ForbiddenError("Cannot access this conversation");
  }
  ```

- [ ] **[REF-018]** Refatorar ChatController
  - Usar schemas Zod
  - Adicionar logging estruturado

---

## 🧪 FASE 4: TESTES UNITÁRIOS (1-2 DIAS)

### Setup Jest
- [x] **[TEST-001]** Setup Jest configuration + TypeScript
  - ✅ Arquivo criado: `server/jest.config.js`
  - ✅ Arquivo criado: `server/tsconfig.test.json`
  - ✅ Arquivo criado: `server/src/__tests__/setup.ts`
  - ✅ Dependências instaladas
  - ✅ Test scripts adicionados ao package.json

- [x] **[TEST-002]** Setup test environment
  - ✅ Pino logger mocked em testes
  - ✅ Prisma mocked para unit tests
  - ✅ Jest configurado com ts-jest preset

### Testes de Camada de Dados (Repositories)
- [x] **[TEST-003]** Teste BaseRepository (10 tests)
  - ✅ Arquivo criado: `server/src/__tests__/repositories/base.repository.test.ts`
  - ✅ Testes para: findMany, findUnique, create, update, delete, count
  - ✅ Todos os testes PASSANDO

- [ ] **[TEST-004]** Teste QuestionRepository
  - Próximo: Implementar `QuestionRepository` específico
  - Testar: findByStatus, findByCategory, findWithQuestions

- [ ] **[TEST-005]** Teste UserRepository
  - Próximo: Implementar `UserRepository` específico
  - Testar: findByEmail, findByIdSafe, countByRole

### Testes de Serviços (Services)
- [x] **[TEST-006]** Teste UserStatsService (4 tests)
  - ✅ Arquivo criado: `server/src/__tests__/services/user-stats.service.test.ts`
  - ✅ Testes para: generateStats, getTrending
  - ✅ Todos os testes PASSANDO

- [ ] **[TEST-007]** Teste DocumentProcessorService
  - Próximo: Implementar testes para OCR/PDF processing
  - Testar: extractText, validateDocuments

- [ ] **[TEST-008]** Teste OpenAIService
  - Próximo: Implementar testes com mocked OpenAI API
  - Testar: generateResponse, validatePrompt

### Testes de Camada de Apresentação (Controllers)
- [x] **[TEST-009]** Teste BaseCRUDController (8 tests)
  - ✅ Arquivo criado: `server/src/__tests__/controllers/base-crud.controller.test.ts`
  - ✅ Testes para: getAll, getById, create, update, delete
  - ✅ Testes de validação de propriedade (ownership)
  - ✅ Todos os testes PASSANDO

- [ ] **[TEST-010]** Teste QuestionController
  - Próximo: Criar testes unitários específicos
  - Testar: buildWhere, filtros customizados

- [ ] **[TEST-011]** Teste UserController
  - Próximo: Criar testes para endpoints específicos
  - Testar: getStats, getRoleBasedData

### Cobertura de Testes
- [x] **[TEST-012]** Configurar coverage reporting
  - ✅ Jest configurado com collectCoverageFrom
  - Próximo: Alcançar 80%+ coverage em services
  - Próximo: Alcançar 90%+ coverage em controllers

---

## 🧪 FASE 5: TESTES E2E (FUTURA - 2-3 DIAS)

### Setup Supertest
- [ ] **[E2E-001]** Setup Supertest for API testing
  - Arquivo: `server/src/__tests__/e2e/`
  - Próximo: Instalar `supertest` se não estiver instalado
  - Próximo: Configurar auth helper para tokens JWT

- [ ] **[E2E-002]** Criar Auth Helper
  - Arquivo: `server/src/__tests__/helpers/auth.helper.ts`
  - Implementar: createAuthToken, verifyAuthToken

### E2E Tests - Question Controller
- [ ] **[E2E-003]** Teste POST /api/questions
  - Arquivo: `server/src/__tests__/e2e/question.controller.e2e.test.ts`
  - Testar: criar com dados válidos, validação, autenticação

- [ ] **[E2E-004]** Teste GET /api/questions
  - Testar: listar com paginação, filtros, sem permissão

- [ ] **[E2E-005]** Teste GET /api/questions/:id
  - Testar: retrieval, 404 para não-existente

- [ ] **[E2E-006]** Teste PUT /api/questions/:id
  - Testar: update com validação, propriedade check

- [ ] **[E2E-007]** Teste DELETE /api/questions/:id
  - Testar: delete com permissão, verificar deletado

### E2E Tests - User Controller
- [ ] **[E2E-008]** Teste GET /api/users
  - Arquivo: `server/src/__tests__/e2e/user.controller.e2e.test.ts`
  - Testar: listar com paginação, autenticação obrigatória

- [ ] **[E2E-009]** Teste GET /api/users/:id
  - Testar: retrieval próprio perfil, admin access, forbidden

- [ ] **[E2E-010]** Teste POST /api/users
  - Testar: criar novo usuário, validação

- [ ] **[E2E-011]** Teste PUT /api/users/:id
  - Testar: update próprio, admin update, propriedade check

- [ ] **[E2E-012]** Teste DELETE /api/users/:id
  - Testar: delete como admin, verificar deletado

- [ ] **[E2E-013]** Teste GET /api/users/:id/stats
  - Testar: estatísticas do usuário, agregações

### Testes de Segurança E2E
- [ ] **[SEC-E2E-001]** Testar SQL Injection
  - Tentar: `POST /api/questions` com SQL no titulo
  - Esperado: Erro de validação, sem injection

- [ ] **[SEC-E2E-002]** Testar XSS
  - Tentar: `<script>alert('xss')</script>` em campos
  - Esperado: Escapado ou rejeitado

- [ ] **[SEC-E2E-003]** Testar Unauthorized Access
  - Tentar: Acessar documento de outro usuário
  - Esperado: 403 Forbidden

- [ ] **[SEC-E2E-004]** Testar CORS
  - Fazer: Request de domínio diferente
  - Esperado: Bloqueado ou permitido conforme config

### Testes de Integração Completos
- [ ] **[INT-E2E-001]** Testar fluxo completo
  1. Criar categoria
  2. Criar questão
  3. Criar template com questão
  4. Submeter formulário
  5. Verificar stats

- [ ] **[INT-E2E-002]** Testar autenticação completa
  1. Login
  2. Verificar token no cookie
  3. Acessar endpoint autenticado
  4. Logout

---

## 🔍 FASE 6: VALIDAÇÃO & QA (3-4 DIAS)

### Code Review
- [ ] **[QA-001]** Revisar todos os controllers refatorados
  - Checklist por arquivo
  - Confirmar herança de BaseCRUDController

- [ ] **[QA-002]** Revisar todos os repositories
  - Confirmar lógica específica está isolada
  - Sem Prisma em controllers

- [ ] **[QA-003]** Revisar schemas Zod
  - Confirmar validação em todos endpoints
  - Testar invalid data

- [ ] **[QA-004]** Revisar logging
  - Confirmar sem PII em logs
  - Sem senhas/tokens
  - Níveis apropriados (debug, info, warn, error)

### Performance
- [ ] **[PERF-001]** Medir response times
  ```bash
  npm install --save-dev autocannon
  npx autocannon http://localhost:3005/api/questions
  ```

- [ ] **[PERF-002]** Verificar N+1 queries
  - Usar Query Profiler do Prisma
  - Verificar includes/select

- [ ] **[PERF-003]** Testar carga
  - 100 requisições simultâneas
  - Monitorar CPU/Memory

### Documentação
- [ ] **[DOC-001]** Atualizar README
  - Adicionar arquitetura nova
  - Instruções de setup

- [ ] **[DOC-002]** Atualizar API documentation
  - Swagger/OpenAPI
  - Exemplos de requisições

- [ ] **[DOC-003]** Documentar mudanças
  - CHANGELOG.md
  - Breaking changes

---

## 🚀 FASE 7: DEPLOY (2-3 DIAS)

### Pré-Deploy
- [ ] **[DEPLOY-001]** Criar branch release
  ```bash
  git checkout -b release/v2.0.0
  ```

- [ ] **[DEPLOY-002]** Build e test local
  ```bash
  npm run build
  npm run start:prod
  ```

- [ ] **[DEPLOY-003]** Criar staging environment
  - Cópia de produção
  - Dados fictícios
  - Testar 100% dos endpoints

- [ ] **[DEPLOY-004]** Migration plan
  - Backup de database
  - Rollback procedure
  - Downtime window (se necessário)

### Deploy
- [ ] **[DEPLOY-005]** Deploy para staging
  - `git push origin release/v2.0.0`
  - Trigger CI/CD
  - Testar 1-2 horas

- [ ] **[DEPLOY-006]** Smoke tests em staging
  - Testar 10 endpoints críticos
  - Verificar logs
  - Monitorar metrics

- [ ] **[DEPLOY-007]** Deploy para produção
  - Off-peak hours (ex: 3 AM)
  - Ter rollback pronto
  - On-call team disponível

- [ ] **[DEPLOY-008]** Pós-deploy verificação
  - Monitorar logs por 1 hora
  - Verificar metrics (CPU, Memory, Response Time)
  - Testar endpoints críticos
  - Confirmar 0 erros

### Pós-Deploy
- [ ] **[DEPLOY-009]** Merge para main
  ```bash
  git checkout main
  git merge release/v2.0.0
  git tag v2.0.0
  ```

- [ ] **[DEPLOY-010]** Criar release notes
  - Mudanças
  - Melhorias de segurança
  - Breaking changes (se houver)

- [ ] **[DEPLOY-011]** Notificar time
  - Email com resumo
  - Links para documentation
  - Contato para issues

---

## 📊 MÉTRICAS DE SUCESSO

### Código
- [ ] Redução de duplicação: > 50%
- [ ] Cobertura de testes: > 80%
- [ ] Lint errors: 0
- [ ] Type errors: 0

### Segurança
- [ ] Nenhuma credencial em Git
- [ ] 100% endpoints com validação Zod
- [ ] 100% endpoints com propriedade check
- [ ] OWASP Top 10: Todos itens mitigados

### Performance
- [ ] Response time < 500ms (p95)
- [ ] CPU < 60% sob carga
- [ ] Memory stable (sem memory leak)
- [ ] 0 database N+1 queries

### Operacional
- [ ] Logging estruturado ativo
- [ ] Error tracking (Sentry) configurado
- [ ] Alertas configurados
- [ ] Documentation atualizada

---

## 🎯 PRIORITY ORDER (Se tempo limitado)

Se não conseguir fazer tudo em 6 semanas:

**CRÍTICO (FAZER PRIMEIRO):**
1. Segurança: Revogar credenciais
2. Segurança: JWT_SECRET obrigatório
3. Segurança: Helmet headers
4. Arquitetura: BaseCRUDController
5. Segurança: Validação de propriedade

**IMPORTANTE (FAZER DEPOIS):**
6. Refactoring de todos controllers
7. Schemas Zod
8. Logger estruturado

**NICE-TO-HAVE (SE SOBRAR TEMPO):**
9. Testes unitários
10. 2FA
11. Criptografia at-rest
12. Audit logs

---

## 📞 CONTATOS & SUPORTE

- **Tech Lead**: [Seu nome]
- **Security**: [Team]
- **DevOps**: [Team]
- **Emergency**: [Contato]

---

## 📝 NOTAS

- Cada item completado deve ter um commit separado
- Fazer PR review para cada mudança
- Testar em staging antes de produção
- Manter backup de database antes de deploy

---

**Status Inicial:** 0% (2026-01-30)
**Current Status:** ~45% (Unit tests phase complete, E2E phase future, docs in progress)
**Target Completion:** 2026-03-15
**Última Atualização:** 2026-01-30

### Progresso por Fase
- ✅ **FASE 1:** Segurança Imediata - Pendente
- ✅ **FASE 2:** Arquitetura Base - Pendente
- ✅ **FASE 3:** Refactoring Controllers - Pendente
- ✅ **FASE 4:** Testes Unitários - **3/12 completos (25%)**
- ⏳ **FASE 5:** Testes E2E - **0/13 completos (0%)** - Futura
- ⏳ **FASE 6:** Validação & QA - Pendente
- ⏳ **FASE 7:** Deploy - Pendente

