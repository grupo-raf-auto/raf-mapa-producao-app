# Autenticação – Better Auth (email + senha)

## Estrutura de pastas

```
client/
├── app/
│   ├── api/
│   │   └── auth/
│   │       └── [...all]/
│   │           └── route.ts    # Handler Better Auth (toNextJsHandler)
│   ├── sign-in/[[...sign-in]]/page.tsx
│   ├── sign-up/[[...sign-up]]/page.tsx
│   ├── forgot-password/page.tsx
│   └── reset-password/page.tsx
├── lib/
│   ├── auth.ts           # Configuração betterAuth, getAuthTokenServer, getAuthHeadersServer
│   ├── auth-client.ts    # createAuthClient, useSession, forgetPassword, resetPassword
│   ├── email-reset.ts    # sendResetPasswordEmail (Resend ou log em dev)
│   ├── jwt.ts            # createAppToken (para o proxy/backend Express)
│   └── db.ts             # Prisma client
└── middleware.ts         # Proteção de rotas (cookie de sessão), rotas públicas: sign-in, sign-up, forgot-password, reset-password, /api/auth
```

## O que cada parte faz

| Ficheiro | Função |
|----------|--------|
| **lib/auth.ts** | `betterAuth({ ... })`: BD (Prisma), emailAndPassword (min/max senha, reset, sendResetPassword, revokeSessionsOnPasswordReset), user additionalFields (firstName, lastName, role, isActive), databaseHooks (opcional ALLOWED_EMAIL_DOMAIN, primeiro user=admin). `getAuthTokenServer` / `getAuthHeadersServer`: sessão Better Auth → JWT para o backend Express. |
| **lib/auth-client.ts** | `authClient` (signIn.email, signUp.email, signOut), `useSession`, `forgetPassword` (POST /api/auth/request-password-reset), `resetPassword` (POST /api/auth/reset-password). |
| **lib/email-reset.ts** | Envia o email de recuperação de senha. Se `RESEND_API_KEY`: Resend; senão, em dev imprime o link no terminal. |
| **app/api/auth/[...all]/route.ts** | Encaminha GET/POST para o Better Auth (`toNextJsHandler(auth)`). |
| **middleware.ts** | Rotas públicas: sign-in, sign-up, forgot-password, reset-password, /api/auth. O resto exige cookie de sessão; caso contrário, redirect para /sign-in?callbackUrl=... |
| **app/api/proxy/[...path]/route.ts** | Obtém sessão via `auth.api.getSession`, gera JWT com `createAppToken`, chama o backend Express com `Authorization: Bearer <JWT>`. |

## Fluxos

### Cadastro

1. Utilizador em `/sign-up`: nome, email, senha, confirmar senha.
2. Frontend: validação (mín. 8 caracteres, senhas iguais).
3. `authClient.signUp.email({ email, password, name, firstName, lastName, callbackURL: '/' })`.
4. Better Auth: cria User e Account (password hasheado com scrypt), sessão se `autoSignIn: true`.
5. `databaseHooks.user.create.after`: primeiro user recebe `role: admin`; todos `emailVerified: true`. Opcional `before`: restringe domínio se `ALLOWED_EMAIL_DOMAIN`.

### Login

1. `/sign-in`: email + senha.
2. `authClient.signIn.email({ email, password, callbackURL: '/' })`.
3. Better Auth valida, cria sessão, define cookie (httpOnly, secure em produção).

### Logout

1. `authClient.signOut()`.
2. Better Auth invalida a sessão no servidor e remove o cookie.

### Recuperação de senha

1. **Pedido:** `/forgot-password` → `forgetPassword({ email, redirectTo: '/reset-password' })` → POST `/api/auth/request-password-reset`. Better Auth gera token (1h), grava em `Verification`, chama `sendResetPassword`. O email usa o link: `{base}/api/auth/reset-password/{token}?callbackURL=/reset-password`. Resposta genérica (não revela se o email existe).

2. **Link no email:** utilizador abre `.../api/auth/reset-password/{token}?callbackURL=/reset-password`. Better Auth (GET) valida o token e redireciona para `callbackURL?token={token}` → `/reset-password?token=...`.

3. **Nova senha:** `/reset-password` lê `?token=`, pede nova senha + confirmação. `resetPassword({ newPassword, token })` → POST `/api/auth/reset-password`. Better Auth atualiza a password, apaga o token, e, se `revokeSessionsOnPasswordReset`, apaga as outras sessões.

## Proteção de rotas

- **Middleware (client):** verifica presença do cookie de sessão (`better-auth.session_token` ou `__Secure-better-auth.session_token`). Rotas em `publicPaths` não são protegidas. Redireciona para `/sign-in?callbackUrl=...` se não houver sessão.

- **Backend Express:** `authenticateUser` valida `Authorization: Bearer <JWT>`. O JWT é criado no proxy a partir da sessão Better Auth (`getAuthTokenServer` → `createAppToken`). O Express usa `JWT_SECRET` para verificar.

## Segurança e boas práticas

1. **Senhas:** scrypt (padrão Better Auth), 8–128 caracteres. Confirmação de senha apenas no frontend; o backend aplica min/max.

2. **Token de reset:** uso único, expira em 1h (`resetPasswordTokenExpiresIn`). Armazenado como identificador em `Verification`; o valor é o `userId`.

3. **Revogação de sessões:** `revokeSessionsOnPasswordReset: true` invalida as outras sessões ao alterar a senha.

4. **Resposta no “esqueci minha senha”:** sempre a mesma mensagem, quer o email exista ou não, para evitar enumeração de contas.

5. **Cookies:** httpOnly, secure em produção (Better Auth + nextCookies). `trustedOrigins` com as URLs do frontend.

6. **Domínio opcional:** `ALLOWED_EMAIL_DOMAIN` no `databaseHooks.user.create.before` restringe o registo. Se não estiver definido, qualquer email pode registar-se.

7. **Brute force:** Better Auth não faz rate limit próprio. Recomenda-se rate limit em `/api/auth/*` (edge, reverse proxy ou middleware) em produção.

8. **Variáveis obrigatórias:** `BETTER_AUTH_SECRET`, `JWT_SECRET`, `DATABASE_URL`, `NEXTAUTH_URL`/`CLIENT_URL`. Para emails de reset em produção: `RESEND_API_KEY` e `EMAIL_FROM`.
