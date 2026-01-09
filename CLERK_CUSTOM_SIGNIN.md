# Configuração do Login Customizado com Clerk

## Problema
O Clerk está redirecionando para `accounts.dev` ao invés de usar a página customizada.

## Solução

### 1. Variáveis de Ambiente

Adicione estas variáveis no arquivo `.env.local` do cliente:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

### 2. Clerk Dashboard

No Clerk Dashboard:
1. Vá em **User & Authentication** > **Paths**
2. Configure:
   - **Sign-in path**: `/sign-in`
   - **Sign-up path**: `/sign-up`
3. Opcional: Desabilite o **Account Portal** se quiser usar apenas páginas customizadas

### 3. Verificar Configuração

O `ClerkProvider` no `layout.tsx` já está configurado com:
- `signInUrl="/sign-in"`
- `signUpUrl="/sign-up"`
- `afterSignInUrl="/"`
- `afterSignUpUrl="/"`

### 4. Reiniciar o Servidor

Após adicionar as variáveis de ambiente:
```bash
cd client
npm run dev
```

## Nota Importante

Se ainda estiver redirecionando para `accounts.dev`, verifique:
1. Se as variáveis de ambiente estão corretas
2. Se o servidor foi reiniciado após adicionar as variáveis
3. Se o Clerk Dashboard está configurado corretamente
