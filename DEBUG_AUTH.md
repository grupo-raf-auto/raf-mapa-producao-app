# Debug de Autenticação

## Problema: "Unauthorized: No token provided"

### Checklist de Verificação

1. **Variáveis de Ambiente do Backend** (`server/.env`)
   ```env
   CLERK_SECRET_KEY=sk_test_... (ou sk_live_...)
   ```

2. **Variáveis de Ambiente do Frontend** (`client/.env.local`)
   ```env
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... (ou pk_live_...)
   ```

3. **Usuário está autenticado?**
   - Verificar se o usuário fez login no Clerk
   - Verificar se a sessão está ativa no navegador

4. **Logs do Servidor**
   - Verificar logs do backend para ver se o token está chegando
   - Verificar logs da API route proxy no frontend

### Como Testar

1. **Verificar se o token está sendo gerado:**
   - Abrir DevTools → Network
   - Fazer uma requisição
   - Verificar se o header `Authorization` está presente

2. **Verificar logs:**
   - Backend: `Auth middleware: Token received, length: X`
   - Frontend: `Proxy: GET /api/...`

3. **Testar diretamente:**
   ```bash
   # Obter token do Clerk (via API route proxy)
   curl http://localhost:3000/api/proxy/users/me
   ```

### Soluções Comuns

1. **Token não está sendo gerado:**
   - Verificar se `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` está configurado
   - Verificar se o usuário está autenticado

2. **Token inválido:**
   - Verificar se `CLERK_SECRET_KEY` está correto no backend
   - Verificar se as chaves são do mesmo ambiente (test vs live)

3. **CORS ou Network:**
   - Verificar se `CLIENT_URL` no backend está correto
   - Verificar se o backend está acessível

### Comandos Úteis

```bash
# Verificar variáveis de ambiente do backend
cd server
cat .env | grep CLERK

# Verificar variáveis de ambiente do frontend
cd client
cat .env.local | grep CLERK

# Testar conexão com backend
curl http://localhost:3001/health
```
