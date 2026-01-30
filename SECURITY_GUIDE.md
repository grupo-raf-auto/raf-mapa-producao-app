# 🔒 GUIA DE SEGURANÇA - RAF Mapa de Produção

**Severidade Geral: CRÍTICA** | Status: ⚠️ Antes do Deploy
**Última Revisão:** 2026-01-30

---

## ⚡ AÇÕES IMEDIATAS (24 HORAS)

### 1. 🔴 CRÍTICO: Revogar Credenciais Comprometidas

**Passo 1: Identificar Credenciais Expostas**
```bash
# Credenciais encontradas em .env e histórico Git:
- DATABASE_URL (PostgreSQL Neon)
- OPENAI_API_KEY
- CLERK_SECRET_KEY
- CLERK_WEBHOOK_SECRET
```

**Passo 2: Revogar Acesso**
```bash
# 1. Neon PostgreSQL
#    - Acessar https://console.neon.tech
#    - Resetar senha do usuário neondb_owner
#    - Recriar DATABASE_URL

# 2. OpenAI
#    - Acessar https://platform.openai.com/account/api-keys
#    - Deletar chave existente
#    - Gerar nova API key

# 3. Clerk
#    - Acessar https://dashboard.clerk.com
#    - Regenerar webhook secret
```

**Passo 3: Remover de Git (BFG Repo-Cleaner)**
```bash
cd /home/tiago/Documents/MyCredit/raf-mapa-producao-app

# Instalar BFG
brew install bfg # macOS
# ou
apt-get install bfg # Linux

# Remover arquivo .env do histórico
bfg --delete-files .env

# Limpar histórico
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# Fazer push forçado (apenas se repositório privado!)
git push --force-with-lease
```

**Passo 4: Atualizar .env Novo**
```bash
cat > server/.env << 'EOF'
# DATABASE
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]/[DB]

# OPENAI
OPENAI_API_KEY=sk-proj-[NEW_KEY_HERE]

# BETTER AUTH
BETTER_AUTH_SECRET=$(openssl rand -base64 32)
JWT_SECRET=$(openssl rand -base64 32)

# CLERK (Novo)
CLERK_SECRET_KEY=sk_test_[NEW_KEY_HERE]

# URLS
NEXTAUTH_URL=https://seu-dominio.com
CLIENT_URL=https://seu-dominio.com
NEXT_PUBLIC_API_URL=https://api.seu-dominio.com

# ENVIRONMENT
NODE_ENV=production
LOG_LEVEL=info
EOF

# Nunca commitar este arquivo!
git add .gitignore
echo "server/.env" >> .gitignore
git commit -m "chore: ensure .env is never committed"
```

---

### 2. 🔴 CRÍTICO: Tornar JWT_SECRET Obrigatório

**Arquivo:** `server/src/middleware/auth.middleware.ts`

```typescript
// ❌ ANTES (permite fallback inseguro)
const JWT_SECRET = process.env.JWT_SECRET;
const EFFECTIVE_JWT_SECRET = JWT_SECRET || "dev-secret-change-in-production";

// ✅ DEPOIS (força obrigatoriedade em produção)
const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "❌ FATAL: JWT_SECRET is required in production. " +
      "Set environment variable and restart server."
    );
  }

  logger.warn("⚠️ Using development JWT_SECRET - NOT suitable for production!");
  var EFFECTIVE_JWT_SECRET = "dev-only-secret-change-in-production";
} else {
  var EFFECTIVE_JWT_SECRET = JWT_SECRET;
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies["better-auth.session_token"];
    if (!token) return next();

    const decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as any;
    (req as any).user = {
      id: decoded.sub,
      email: decoded.email,
      role: decoded.role || "user",
    };
  } catch (error) {
    logger.warn({ error: error.message }, "Token verification failed");
  }

  next();
}
```

---

### 3. 🔴 CRÍTICO: Validação de Propriedade em Todos Endpoints

**Exemplo:** Document Controller

```typescript
// ❌ ANTES - Qualquer um pode ver qualquer documento
static async getDocument(req: Request, res: Response) {
  const { id } = req.params;
  const doc = await prisma.document.findUnique({ where: { id } });
  res.json({ ...doc, _id: doc.id });
}

// ✅ DEPOIS - Validar propriedade
static async getDocument(req: Request, res: Response) {
  const { id } = req.params;
  const user = (req as any).user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  const doc = await prisma.document.findUnique({ where: { id } });

  if (!doc) {
    return res.status(404).json({ error: "Document not found" });
  }

  // ✅ CRÍTICO: Validar propriedade
  if (doc.uploadedBy !== user.id && user.role !== "admin") {
    logger.warn({ documentId: id, userId: user.id }, "Unauthorized document access attempt");
    return res.status(403).json({ error: "You cannot access this document" });
  }

  res.json({ ...doc, _id: doc.id });
}
```

**Aplicar em:**
- ✅ DocumentController.getDocument()
- ✅ ChatController.sendMessage()
- ✅ DocumentScannerController.getScanDetail()
- ✅ Todos endpoints com userId/uploadedBy

---

### 4. 🔴 CRÍTICO: Configurar Helmet Seguro

**Arquivo:** `server/src/index.ts`

```typescript
import helmet from "helmet";

// ✅ Configuração segura
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Necessário para Tailwind
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.openai.com"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },

  hsts: {
    maxAge: 31536000,        // 1 ano
    includeSubDomains: true,
    preload: true,
  },

  referrerPolicy: {
    policy: "strict-origin-when-cross-origin",
  },

  frameguard: {
    action: "deny", // Previne clickjacking
  },

  xssFilter: true,
  noSniff: true,
}));

// ✅ Forçar HTTPS em produção
if (process.env.NODE_ENV === "production") {
  app.use((req, res, next) => {
    if (req.header("x-forwarded-proto") !== "https") {
      return res.redirect(`https://${req.header("host")}${req.url}`);
    }
    next();
  });
}

// ✅ Remover header X-Powered-By
app.disable("x-powered-by");
```

---

### 5. 🔴 CRÍTICO: Atualizar .gitignore

```bash
cat >> .gitignore << 'EOF'

# ===== SEGURANÇA =====
# Nunca versionar arquivos com secrets
.env
.env.local
.env.*.local

# Histórico de arquivos deletados
.history/
.vscode/

# Chaves SSH
*.pem
*.key

# Credenciais
credentials.json
aws-credentials.json

# Build/Logs
dist/
build/
*.log
logs/

# IDE
.idea/
.vscode/
*.swp

# Node modules (já existe, mas confirme)
node_modules/
.pnpm-store/
EOF

git add .gitignore
git commit -m "chore: enhance .gitignore for security"
```

---

## 🔒 PROTEÇÕES IMPLEMENTADAS (1-2 SEMANAS)

### 6. Validação com Zod em Todos Endpoints

✅ **Já implementado em schemas/index.ts**

```typescript
import { z } from "zod";

// Validar em TODOS os endpoints
export const createQuestionSchema = z.object({
  title: z.string().min(1, "Title required").max(255),
  description: z.string().max(1000).optional(),
  status: z.enum(["active", "inactive"]),
});

// Usar em controller
const validation = createQuestionSchema.safeParse(req.body);
if (!validation.success) {
  return res.status(400).json({
    success: false,
    errors: validation.error.flatten().fieldErrors,
  });
}
```

---

### 7. Rate Limiting Aprimorado

**ANTES:**
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Global - muito permissivo
  max: 100,
});
```

**DEPOIS:**
```typescript
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import redis from "redis";

const redisClient = redis.createClient({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6379"),
});

// Rate limiting global
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: "Too many requests, please try again later",
});

// Rate limiting por usuário
const userLimiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: "rate-limit:",
  }),
  windowMs: 15 * 60 * 1000,
  max: 30,           // 30 requisições por usuário
  keyGenerator: (req) => (req as any).user?.id || req.ip,
  message: "Too many requests from this user",
});

// Rate limiting por IP para auth
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,            // 5 tentativas por IP
  skipSuccessfulRequests: true,
  message: "Too many login attempts, please try again later",
});

app.use("/api/", globalLimiter);
app.use("/api/auth/", authLimiter);
router.post("/login", userLimiter, controller.login);
```

---

### 8. Logging Seguro e Estruturado

✅ **Já implementado em lib/logger.ts**

```typescript
import pino from "pino";

export const logger = pino({
  level: process.env.LOG_LEVEL || "info",

  // Sanitizar headers de logs
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers), // ✅ Remove auth
    }),
  },
});

// ✅ USO
logger.info({ userId: user.id, action: "document_accessed" }, "Document retrieved");
logger.error({ error: err.message }, "Failed to process document");

// ✅ NUNCA fazer isso
// console.error(error); // ❌ Pode expor stack trace
// logger.error(passwordField); // ❌ Pode registrar senha
```

---

### 9. Criar Audit Log para Ações Críticas

**Novo arquivo:** `server/src/lib/audit-log.ts`

```typescript
import { prisma } from "./prisma";
import logger from "./logger";

/**
 * Log de auditoria para ações críticas
 * Todas as operações sensíveis devem ser registradas
 */
export interface AuditLogEntry {
  userId: string;
  action: "CREATE" | "UPDATE" | "DELETE" | "LOGIN" | "PERMISSION_CHANGE";
  resourceType: string;
  resourceId?: string;
  details?: Record<string, any>;
  status: "SUCCESS" | "FAILED";
}

export async function createAuditLog(entry: AuditLogEntry) {
  try {
    // Registrar em banco de dados
    await prisma.auditLog.create({
      data: {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        resourceId: entry.resourceId,
        details: entry.details,
        status: entry.status,
        timestamp: new Date(),
      },
    });

    // Também registrar em logs estruturados
    logger.info(
      {
        userId: entry.userId,
        action: entry.action,
        resourceType: entry.resourceType,
        status: entry.status,
      },
      `Audit: ${entry.action} ${entry.resourceType}`
    );
  } catch (error) {
    logger.error({ error, entry }, "Failed to create audit log");
  }
}

// ✅ Uso
await createAuditLog({
  userId: req.user.id,
  action: "DELETE",
  resourceType: "Document",
  resourceId: documentId,
  status: "SUCCESS",
});
```

---

### 10. Proteção CSRF (se necessário)

**Adicionar ao index.ts:**

```typescript
import csrf from "csurf";

// ✅ CSRF protection para formulários
const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  },
});

// Endpoints sensíveis
app.post("/api/templates", csrfProtection, controller.create);
app.put("/api/templates/:id", csrfProtection, controller.update);
app.delete("/api/templates/:id", csrfProtection, controller.delete);

// Retornar token CSRF em GET
app.get("/api/csrf-token", csrfProtection, (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});
```

---

## 🛡️ PRÁTICAS DE SEGURANÇA CONTÍNUA

### 11. Dependências Seguras

```bash
# Checar vulnerabilidades regularmente
npm audit

# Atualizar packages
npm update

# Usar versões exatas para dependências críticas
npm install --save-exact bcryptjs jsonwebtoken helmet
```

### 12. Secrets Management em Produção

**NUNCA** colocar secrets em .env no servidor de produção.

**Use:**
- ✅ AWS Secrets Manager
- ✅ HashiCorp Vault
- ✅ GitHub Secrets (para CI/CD)
- ✅ Heroku Config Vars
- ✅ Variáveis de ambiente do Vercel

**Exemplo AWS Secrets Manager:**
```typescript
import { SecretsManager } from "aws-sdk";

const sm = new SecretsManager();

export async function getSecret(secretName: string): Promise<string> {
  try {
    const data = await sm.getSecretValue({ SecretId: secretName }).promise();
    return data.SecretString;
  } catch (error) {
    logger.error({ secretName }, "Failed to retrieve secret");
    throw error;
  }
}

// Uso
const dbUrl = await getSecret("prod/database-url");
const apiKey = await getSecret("prod/openai-api-key");
```

### 13. Criptografia de Dados Sensíveis

```typescript
import crypto from "crypto";

// Criptografar dados financeiros
export function encryptSensitiveData(data: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_KEY!, "hex"),
    iv
  );

  let encrypted = cipher.update(data);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decryptSensitiveData(data: string): string {
  const parts = data.split(":");
  const iv = Buffer.from(parts[0], "hex");
  const encrypted = Buffer.from(parts[1], "hex");

  const decipher = crypto.createDecipheriv(
    "aes-256-cbc",
    Buffer.from(process.env.ENCRYPTION_KEY!, "hex"),
    iv
  );

  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}

// Uso
export const DocumentScan = schema({
  // ...
  justification: {
    type: String,
    encryptWith: encryptSensitiveData, // ✅ Encriptar ao salvar
  },
});
```

### 14. Input Sanitization

```typescript
import DOMPurify from "isomorphic-dompurify";

// Sanitizar input do usuário
export function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // Sem tags HTML
    ALLOWED_ATTR: [],
  });
}

// Uso em controller
const sanitizedTitle = sanitizeInput(req.body.title);
```

### 15. 2FA (Autenticação de Dois Fatores)

**Usar TOTP (Time-based One-Time Password):**

```typescript
import speakeasy from "speakeasy";
import QRCode from "qrcode";

export async function generateTwoFactorSecret(userId: string) {
  const secret = speakeasy.generateSecret({
    name: "RAF Mapa Produção",
    issuer: "RAF",
    length: 32,
  });

  // Gerar QR Code
  const qrCode = await QRCode.toDataURL(secret.otpauth_url);

  return {
    secret: secret.base32,
    qrCode,
  };
}

export function verifyTwoFactorToken(secret: string, token: string): boolean {
  return speakeasy.totp.verify({
    secret,
    encoding: "base32",
    token,
    window: 2,
  });
}
```

---

## 📋 Checklist de Segurança para Deploy

- [ ] ✅ Credenciais revogadas e removidas do Git
- [ ] ✅ JWT_SECRET obrigatório em produção
- [ ] ✅ Validação de propriedade em todos endpoints
- [ ] ✅ Helmet configurado corretamente
- [ ] ✅ HTTPS forçado em produção
- [ ] ✅ Rate limiting por usuário
- [ ] ✅ Validação com Zod em todos endpoints
- [ ] ✅ Logging estruturado sem PII
- [ ] ✅ Audit log para ações críticas
- [ ] ✅ Senhas com bcrypt (13 rounds mínimo)
- [ ] ✅ CORS restritivo (whitelist específico)
- [ ] ✅ SQL Injection: Usar Prisma (safe by default)
- [ ] ✅ XSS: Sanitizar input com DOMPurify
- [ ] ✅ CSRF: Implementar tokens CSRF
- [ ] ✅ Dependências atualizadas (`npm audit`)
- [ ] ✅ Secrets em environment variables (não .env)
- [ ] ✅ Testes de segurança (OWASP Top 10)
- [ ] ✅ Documentação de segurança atualizada
- [ ] ✅ Backup e disaster recovery
- [ ] ✅ Monitoring e alertas ativados

---

## 🔍 Monitoramento em Produção

### Ferramentas Recomendadas

- **Sentry** - Erro tracking e monitoring
- **Datadog** - Logs estruturados
- **New Relic** - Performance monitoring
- **Snyk** - Vulnerability scanning
- **OWASP ZAP** - Security scanning

### Configurar Sentry

```typescript
import * as Sentry from "@sentry/node";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});

app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

---

## 📚 Referências de Segurança

- [OWASP Top 10 2021](https://owasp.org/Top10/)
- [OWASP Cheat Sheet Series](https://cheatsheetseries.owasp.org/)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)

---

## 🚨 Resposta a Incidentes

### Se credenciais forem expostas:
1. ✅ Revogar credenciais imediatamente
2. ✅ Alterar todas as senhas de acesso
3. ✅ Remover de histórico Git
4. ✅ Notificar usuários (se dados comprometidos)
5. ✅ Fazer audit de logs
6. ✅ Implementar 2FA

### Se houver breach:
1. ✅ Documentar o incidente
2. ✅ Notificar LGPD (se aplicável)
3. ✅ Revisar logs de acesso
4. ✅ Atualizar documentação de segurança
5. ✅ Treinar time em segurança

---

**Última atualização:** 2026-01-30
**Próxima revisão:** A cada 2 meses
**Responsável:** Security Lead

