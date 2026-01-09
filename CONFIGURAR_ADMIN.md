# Configurar Usuário como Admin

## Opção 1: Automático (Recomendado)

O sistema agora configura automaticamente o email `tiagosousa.tams@hotmail.com` como admin quando você faz login.

**Basta fazer login uma vez e você terá acesso ao painel admin!**

## Opção 2: Script Manual

Se você já fez login e quer atualizar manualmente:

```bash
cd server
npm run set-admin tiagosousa.tams@hotmail.com
```

## Opção 3: Via Painel Admin (se já tiver acesso)

1. Acesse `/admin`
2. Vá na aba "Usuários"
3. Clique no dropdown de role do usuário
4. Selecione "Admin"

## Verificar se está funcionando

Após fazer login, você deve ver:
- ✅ Botão "Admin" no canto superior direito de todas as páginas
- ✅ Acesso à rota `/admin`
- ✅ Aba "Desempenho" com todas as métricas
