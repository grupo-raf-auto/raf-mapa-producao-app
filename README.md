# raf-mapa-producao-app

## Stack

- **Frontend:** React (Vite), Better Auth (email/password)
- **Backend:** Express, Prisma, PostgreSQL (Neon)
- **Autenticação:** Better Auth — email + senha; cadastro, login, logout, recuperação de senha (esqueci minha senha)

## Variáveis de ambiente

Basta ter **`server/.env`**. O frontend em dev usa o proxy para o backend; as variáveis do servidor aplicam-se ao correr `npm run dev`.

Exemplo para **server/.env** (ajusta os valores):

```env
DATABASE_URL=postgresql://...?sslmode=require
BETTER_AUTH_SECRET=um-segredo-longo-aleatorio
JWT_SECRET=um-segredo-longo-aleatorio
NEXTAUTH_URL=http://localhost:3004
CLIENT_URL=http://localhost:3004
PORT=3005
NEXT_PUBLIC_API_URL=http://localhost:3005
OPENAI_API_KEY=sk-...
```

Opcionais:

- **`ALLOWED_EMAIL_DOMAIN`** (ex: `gruporaf.pt`): se definido, apenas emails `@<domínio>` podem registar-se. Para desenvolvimento ou testes com outros emails (ex.: @hotmail.com), não definas esta variável ou deixa-a vazia no `server/.env`.
- **`RESEND_API_KEY`** e **`EMAIL_FROM`**: para enviar emails de recuperação de senha em produção. Sem `RESEND_API_KEY`, em dev o link é impresso no terminal.

### Base de dados (Neon)

1. Em [neon.tech](https://neon.tech) crie um projeto e copie a **Connection string** para `DATABASE_URL`.

### Autenticação

- `BETTER_AUTH_SECRET`: segredo do Better Auth (sessões, cookies, tokens de reset). Ex: `openssl rand -base64 32`.
- `JWT_SECRET`: segredo partilhado entre Next.js e Express para o token de API (ex: `openssl rand -base64 32`).
- **Recuperação de senha:** o link no email aponta para `/api/auth/reset-password/:token`. Em produção, defina `RESEND_API_KEY` (e `EMAIL_FROM`) para enviar o email; em dev, o link é mostrado no terminal.

**Segurança:** senhas com scrypt; token de reset de uso único e expiração 1h; revogação de outras sessões ao alterar senha. Em produção, recomenda-se rate limiting em `/api/auth/*` (ex.: no edge ou reverse proxy) para mitigar brute force.

### URLs

- `NEXTAUTH_URL`: URL do frontend (ex: `http://localhost:3004`).
- `CLIENT_URL`: URL do frontend em produção ou desenvolvimento (ex: `http://localhost:3004`).
- `NEXT_PUBLIC_API_URL`: URL do backend (ex: `http://localhost:3005`).
- `PORT`: porta do Express (predefinido: 3005). O frontend (Vite) corre na 3004.

## Instalação

```bash
# Raiz (opcional, para scripts)
npm run install:all

# Ou em cada pasta:
cd server && npm install
cd ../frontend && npm install
```

## Base de dados

```bash
cd server
# Aplicar migrações (cria tabelas)
npx prisma migrate dev --schema=../prisma/schema.prisma

# (Opcional) abrir Prisma Studio (a partir da raiz do projeto; usa server/.env)
npm run db:studio
```

O seed de templates é executado ao arrancar o servidor. Para definir um admin:

```bash
cd server
npm run set-admin -- email@gruporaf.pt
```

## Execução

Por predefinição: **frontend em http://localhost:3004**, **backend em http://localhost:3005**.

```bash
# Do root:
npm run dev

# Ou em terminais separados:
# Terminal 1 – backend (porta 3005)
cd server && npm run dev

# Terminal 2 – frontend (porta 3004)
cd frontend && npm run dev
```

## Regras de acesso

- **Registo:** email único, senha 8–128 caracteres, confirmação de senha. Se `ALLOWED_EMAIL_DOMAIN` estiver definido, só emails desse domínio podem registar-se.
- **Login:** email + senha. Sessão em cookie (httpOnly; secure em produção).
- **Logout:** invalida a sessão no servidor.
- **Recuperação de senha:** “Esqueci minha senha” em `/sign-in` → email com link → `/reset-password?token=...` para definir nova senha. Token expira em 1h; ao trocar, as outras sessões são revogadas.
- **Primeiro utilizador** a registar-se fica com role `admin`. Os restantes `user`.
- Admins podem alterar roles em `/admin` e aceder a `/templates`.
