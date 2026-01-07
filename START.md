# 🚀 Como Iniciar o Projeto

## Opção 1: Rodar ambos simultaneamente (Recomendado)

```bash
npm run dev
```

Isso iniciará:
- ✅ Servidor Express na porta **3001**
- ✅ Cliente Next.js na porta **3000**

## Opção 2: Rodar separadamente

### Terminal 1 - Servidor
```bash
cd server
npm run dev
```

### Terminal 2 - Cliente
```bash
cd client
npm run dev
```

## 🔧 Solução de Problemas

### Erro: "Port 3000 is in use"
```bash
# Matar processos nas portas
lsof -ti:3000,3001,3002 | xargs kill -9

# Ou matar processos Next.js
pkill -f "next dev"
```

### Erro: "Unable to acquire lock"
```bash
cd client
rm -rf .next
npm run dev
```

### Erro: "MongoDB URI not found"
Verifique se o arquivo `server/.env` existe e contém:
```
MONGODB_URI=mongodb+srv://...
DATABASE_NAME=raf_mapa_producao
PORT=3001
CLIENT_URL=http://localhost:3000
```

### Erro: "next: command not found"
```bash
cd client
npm install
```

## 📍 URLs

- **Cliente**: http://localhost:3000
- **Servidor API**: http://localhost:3001
- **Health Check**: http://localhost:3001/health
