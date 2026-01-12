# raf-mapa-producao-app

## Configuração

### Variáveis de Ambiente do Servidor

Crie um arquivo `.env` na pasta `server/` com as seguintes variáveis:

```env
# MongoDB
MONGODB_URI=your_mongodb_connection_string
DATABASE_NAME=raf_mapa_producao

# Clerk (Autenticação)
CLERK_SECRET_KEY=your_clerk_secret_key

# OpenAI (Para o MySabichão)
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini  # Opcional, padrão: gpt-4o-mini

# Server
PORT=3001
CLIENT_URL=http://localhost:3000
NODE_ENV=development
```

### Variáveis de Ambiente do Cliente

Crie um arquivo `.env.local` na pasta `client/` com:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Funcionalidades

### MySabichão - Chat com IA

O MySabichão é um assistente virtual integrado com OpenAI que ajuda os usuários com:
- Dúvidas sobre templates e formulários
- Perguntas sobre o sistema
- Orientação sobre funcionalidades
- Análise de dados e relatórios

**Configuração:**
1. Obtenha uma API key da OpenAI em https://platform.openai.com/api-keys
2. Adicione `OPENAI_API_KEY` no arquivo `.env` do servidor
3. (Opcional) Configure `OPENAI_MODEL` para usar um modelo específico (padrão: `gpt-4o-mini`)

## Instalação

```bash
# Instalar dependências do servidor
cd server
npm install

# Instalar dependências do cliente
cd ../client
npm install
```

## Execução

```bash
# Servidor (terminal 1)
cd server
npm run dev

# Cliente (terminal 2)
cd client
npm run dev
```
