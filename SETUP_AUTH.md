# Configuração de Autenticação e Sistema de Roles

## Variáveis de Ambiente Necessárias

### Backend (`server/.env`)

```env
# MongoDB
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/
DATABASE_NAME=raf_mapa_producao

# Server
PORT=3001
CLIENT_URL=http://localhost:3000

# Clerk Authentication
CLERK_SECRET_KEY=sk_test_...
CLERK_WEBHOOK_SECRET=whsec_...

# AI/Chatbot (opcional - para implementação futura)
# OPENAI_API_KEY=sk-...
# ANTHROPIC_API_KEY=sk-ant-...
```

### Frontend (`client/.env.local`)

```env
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...

# API
NEXT_PUBLIC_API_URL=http://localhost:3001

# Clerk URLs (opcional - padrões funcionam)
# NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
# NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
# NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
# NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
```

## Configuração do Clerk

1. Criar conta no [Clerk](https://clerk.com)
2. Criar uma nova aplicação
3. Copiar as chaves:
   - `Publishable Key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `Secret Key` → `CLERK_SECRET_KEY`
4. Configurar Webhook:
   - URL: `https://seu-dominio.com/api/webhooks/clerk`
   - Eventos: `user.created`, `user.updated`, `user.deleted`
   - Copiar `Signing Secret` → `CLERK_WEBHOOK_SECRET`
5. Configurar Email Allowlist (opcional):
   - Em Settings → Email Addresses
   - Adicionar emails permitidos para login

## Sistema de Roles

### Roles Disponíveis

- **admin**: Acesso total + painel administrativo
- **user**: Acesso limitado às funcionalidades básicas

### Permissões

**User:**
- ✅ Dashboard (métricas próprias)
- ✅ Consultas (visualização de dados)
- ✅ Templates (criar e usar templates)
- ✅ MySabichão (chatbot)
- ✅ Criar formulários
- ✅ Visualizar suas próprias submissões
- ❌ Gestão de usuários
- ❌ Painel administrativo

**Admin:**
- ✅ Tudo que User tem acesso
- ✅ Painel de administração (`/admin`)
- ✅ Criar e gerenciar usuários
- ✅ Ver todas as submissões
- ✅ Estatísticas globais
- ✅ Gestão de templates do sistema

### Primeiro Usuário

O primeiro usuário criado automaticamente recebe role `admin`. Usuários subsequentes recebem role `user` por padrão.

## Rotas Protegidas

### Frontend
- `/` - Dashboard (ambos roles)
- `/consultas` - Consultas (ambos roles)
- `/templates` - Templates (ambos roles)
- `/mysabichao` - Chatbot (ambos roles)
- `/admin` - Painel Admin (apenas admin)

### Backend
- `/api/questions/*` - Protegido, ambos roles
- `/api/templates/*` - Protegido, ambos roles (com restrições)
- `/api/submissions/*` - Protegido, users veem apenas suas, admins veem todas
- `/api/users/*` - Protegido, apenas admin
- `/api/chat/*` - Protegido, ambos roles
- `/api/webhooks/*` - Público (usa assinatura)

## Como Funciona

1. Usuário faz login via Clerk
2. Clerk retorna token JWT
3. Frontend envia token em todas as requisições (header `Authorization: Bearer <token>`)
4. Backend valida token com Clerk e busca/cria usuário no MongoDB
5. Middleware verifica role e aplica permissões
6. Webhook do Clerk sincroniza dados quando usuário é criado/atualizado/deletado

## Próximos Passos

- [ ] Integrar IA no chatbot (OpenAI/Anthropic)
- [ ] Implementar RAG para PDFs
- [ ] Adicionar upload de documentos
- [ ] Melhorar interface do chatbot
- [ ] Adicionar mais estatísticas no dashboard admin
