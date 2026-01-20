# Casos de Uso Completos - RAF Mapa Produção App

## 📋 Índice

1. [Autenticação e Autorização](#1-autenticação-e-autorização)
2. [Dashboard e Análises](#2-dashboard-e-análises)
3. [Gestão de Templates](#3-gestão-de-templates)
4. [Gestão de Formulários](#4-gestão-de-formulários)
5. [Gestão de Perguntas e Categorias](#5-gestão-de-perguntas-e-categorias)
6. [MySabichão - Chat com IA](#6-mysabichão---chat-com-ia)
7. [Painel Administrativo](#7-painel-administrativo)
8. [Funcionalidades Técnicas](#8-funcionalidades-técnicas)
9. [Interface e Navegação](#9-interface-e-navegação)

---

## 1. Autenticação e Autorização

### UC-001: Login
**Ator:** Usuário, Administrador  
**Descrição:** Usuário faz login no sistema através do Clerk  
**Pré-condições:** Conta criada no Clerk  
**Fluxo Principal:**
1. Usuário acessa página de login
2. Sistema redireciona para Clerk
3. Usuário autentica no Clerk
4. Sistema valida credenciais
5. Usuário é redirecionado para dashboard

### UC-002: Registro
**Ator:** Usuário, Administrador  
**Descrição:** Novo usuário cria conta no sistema  
**Pré-condições:** Não possui conta  
**Fluxo Principal:**
1. Usuário acessa página de registro
2. Sistema redireciona para Clerk
3. Usuário preenche dados
4. Sistema cria conta
5. Usuário é redirecionado para login

### UC-003: Logout
**Ator:** Usuário, Administrador  
**Descrição:** Usuário encerra sessão  
**Fluxo Principal:**
1. Usuário clica em logout
2. Sistema encerra sessão no Clerk
3. Usuário é redirecionado para login

### UC-004: Verificar Sessão
**Ator:** Sistema  
**Descrição:** Sistema verifica se usuário está autenticado  
**Fluxo Principal:**
1. Sistema verifica token do Clerk
2. Se válido, mantém sessão
3. Se inválido, redireciona para login

### UC-005: Visualizar Perfil
**Ator:** Usuário, Administrador  
**Descrição:** Usuário visualiza seus dados de perfil  
**Endpoint:** `GET /api/users/me`  
**Fluxo Principal:**
1. Usuário acessa perfil
2. Sistema busca dados do usuário
3. Sistema exibe informações

### UC-007: Sincronizar Usuário (Webhook Clerk)
**Ator:** Sistema Clerk  
**Descrição:** Clerk notifica sistema sobre eventos de usuário  
**Endpoint:** `POST /api/webhooks/clerk`  
**Fluxo Principal:**
1. Clerk envia webhook
2. Sistema valida assinatura
3. Sistema cria/atualiza usuário no banco

---

## 2. Dashboard e Análises

### UC-008: Visualizar KPIs
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar cards com métricas principais  
**Componente:** `KPICards`  
**Métricas:**
- Total de Vendas
- Valor Total
- Valor Médio
- Total de Templates

### UC-009: Visualizar Estatísticas
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar estatísticas detalhadas de vendas  
**Endpoint:** `GET /api/submissions/stats?detailed=true`  
**Dados retornados:**
- Total de submissões
- Valor total
- Valor médio
- Estatísticas por período

### UC-010: Filtrar por Período
**Ator:** Usuário, Administrador  
**Descrição:** Filtrar dados do dashboard por período  
**Componente:** `TimeFilter`  
**Opções:** Dia, Semana, Mês  
**Fluxo Principal:**
1. Usuário seleciona período
2. Sistema atualiza gráficos
3. Sistema recalcula métricas

### UC-011: Gráfico de Atividade
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar gráfico de atividade ao longo do tempo  
**Componente:** `ActivityChart`

### UC-012: Gráfico de Perguntas
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar distribuição de perguntas  
**Componente:** `QuestionsChart`

### UC-013: Vendas por Banco
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar gráfico de vendas agrupadas por banco  
**Componente:** `SalesByBancoChart`

### UC-014: Vendas por Distrito
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar gráfico de vendas agrupadas por distrito  
**Componente:** `SalesByDistritoChart`

### UC-015: Vendas por Seguradora
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar gráfico de vendas agrupadas por seguradora  
**Componente:** `SalesBySeguradoraChart`

### UC-016: Timeline de Vendas
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar linha do tempo de vendas  
**Componente:** `SalesTimelineChart`

### UC-017: Top Bancos (Pizza)
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar gráfico de pizza com top bancos  
**Componente:** `TopBancosPieChart`

---

## 3. Gestão de Templates

### UC-018: Listar Templates
**Ator:** Usuário, Administrador  
**Descrição:** Listar todos os templates disponíveis  
**Endpoint:** `GET /api/templates`  
**Fluxo Principal:**
1. Sistema busca templates no banco
2. Sistema retorna lista de templates

### UC-019: Visualizar Template
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar detalhes de um template específico  
**Endpoint:** `GET /api/templates/:id`  
**Dados retornados:**
- Título
- Descrição
- Lista de perguntas
- Datas de criação/atualização

### UC-020: Criar Template
**Ator:** Administrador  
**Descrição:** Criar novo template de formulário  
**Endpoint:** `POST /api/templates`  
**Dados necessários:**
- Título
- Descrição (opcional)
- Lista de perguntas (IDs)

### UC-021: Atualizar Template
**Ator:** Administrador  
**Descrição:** Atualizar template existente  
**Endpoint:** `PATCH /api/templates/:id`  
**Dados atualizáveis:**
- Título
- Descrição
- Lista de perguntas

### UC-022: Deletar Template
**Ator:** Administrador  
**Descrição:** Remover template do sistema  
**Endpoint:** `DELETE /api/templates/:id`  
**Validações:**
- Verificar se não há submissões associadas

### UC-023: Visualizar Lista (Interface)
**Ator:** Administrador  
**Descrição:** Visualizar lista de templates na interface  
**Componente:** `TemplatesList`  
**Funcionalidades:**
- Listagem paginada
- Busca e filtros
- Ações de edição/exclusão

### UC-024: Criar via Diálogo
**Ator:** Administrador  
**Descrição:** Criar template através de diálogo modal  
**Componente:** `CreateTemplateDialog`  
**Fluxo Principal:**
1. Admin clica em "Novo Template"
2. Diálogo abre
3. Admin preenche dados
4. Sistema cria template
5. Lista é atualizada

### UC-025: Editar Template
**Ator:** Administrador  
**Descrição:** Editar template existente na interface  
**Fluxo Principal:**
1. Admin clica em editar
2. Diálogo abre com dados preenchidos
3. Admin modifica dados
4. Sistema atualiza template

### UC-026: Deletar Template (Interface)
**Ator:** Administrador  
**Descrição:** Deletar template através da interface  
**Fluxo Principal:**
1. Admin clica em deletar
2. Sistema solicita confirmação
3. Admin confirma
4. Sistema remove template

### UC-027: Seed Templates Padrão
**Ator:** Sistema  
**Descrição:** Inicializar templates padrão no sistema  
**Execução:** Automática no startup do servidor  
**Arquivo:** `server/src/scripts/seed-templates.ts`

---

## 4. Gestão de Formulários

### UC-028: Listar Templates Disponíveis
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar templates disponíveis para preenchimento  
**Página:** `/formularios`  
**Componente:** `FormulariosContent`  
**Fluxo Principal:**
1. Usuário acessa página de formulários
2. Sistema lista templates disponíveis
3. Usuário visualiza cards com informações

### UC-029: Selecionar Template
**Ator:** Usuário, Administrador  
**Descrição:** Selecionar template para preencher  
**Fluxo Principal:**
1. Usuário visualiza lista de templates
2. Usuário clica em "Preencher Formulário"
3. Sistema abre diálogo de preenchimento

### UC-030: Preencher Formulário
**Ator:** Usuário, Administrador  
**Descrição:** Preencher formulário com respostas  
**Componente:** `FillTemplateDialog`  
**Fluxo Principal:**
1. Sistema carrega perguntas do template
2. Usuário preenche respostas
3. Sistema valida dados
4. Usuário confirma preenchimento

### UC-031: Submeter Formulário
**Ator:** Usuário, Administrador  
**Descrição:** Submeter formulário preenchido  
**Endpoint:** `POST /api/submissions`  
**Dados enviados:**
- templateId
- answers (array de respostas)
- submittedBy (automático)

### UC-032: Listar Submissões
**Ator:** Usuário, Administrador  
**Descrição:** Listar submissões do usuário  
**Endpoint:** `GET /api/submissions`  
**Filtros:**
- Usuário: apenas próprias submissões
- Admin: todas as submissões
- Opcional: filtrar por templateId

### UC-033: Visualizar Submissão
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar detalhes de uma submissão  
**Endpoint:** `GET /api/submissions/:id`  
**Validações:**
- Usuário só vê próprias submissões
- Admin vê todas

### UC-034: Filtrar por Template
**Ator:** Usuário, Administrador  
**Descrição:** Filtrar submissões por template  
**Componente:** `ConsultasFilters`  
**Fluxo Principal:**
1. Usuário seleciona template no filtro
2. Sistema filtra lista
3. Sistema atualiza tabela

### UC-035: Pesquisar Submissões
**Ator:** Usuário, Administrador  
**Descrição:** Buscar submissões por texto  
**Componente:** `ConsultasFilters`  
**Busca em:**
- Título do template
- Conteúdo das respostas

### UC-036: Filtrar por Banco
**Ator:** Usuário, Administrador  
**Descrição:** Filtrar submissões por banco  
**Componente:** `ConsultasFilters`  
**Fluxo Principal:**
1. Sistema extrai valores únicos de banco
2. Usuário seleciona banco
3. Sistema filtra resultados

### UC-037: Filtrar por Seguradora
**Ator:** Usuário, Administrador  
**Descrição:** Filtrar submissões por seguradora  
**Componente:** `ConsultasFilters`  
**Fluxo Principal:**
1. Sistema extrai valores únicos de seguradora
2. Usuário seleciona seguradora
3. Sistema filtra resultados

### UC-038: Filtrar por Valor
**Ator:** Usuário, Administrador  
**Descrição:** Filtrar submissões por faixa de valor  
**Componente:** `ConsultasFilters`  
**Filtros:**
- Valor mínimo
- Valor máximo

### UC-039: Editar Submissão
**Ator:** Usuário, Administrador  
**Descrição:** Editar submissão própria  
**Endpoint:** `PATCH /api/submissions/:id`  
**Validações:**
- Usuário só edita próprias submissões
- Admin pode editar qualquer submissão

### UC-040: Deletar Submissão
**Ator:** Usuário, Administrador  
**Descrição:** Remover submissão  
**Endpoint:** `DELETE /api/submissions/:id`  
**Validações:**
- Usuário só deleta próprias submissões
- Admin pode deletar qualquer submissão

### UC-041: Visualizar Detalhes
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar detalhes completos da submissão  
**Componente:** `ConsultasDataTable`  
**Informações exibidas:**
- Template usado
- Todas as respostas
- Data de submissão
- Usuário que submeteu

---

## 5. Gestão de Perguntas e Categorias

### UC-042: Listar Perguntas
**Ator:** Administrador  
**Descrição:** Listar todas as perguntas do sistema  
**Endpoint:** `GET /api/questions`

### UC-043: Visualizar Pergunta
**Ator:** Administrador  
**Descrição:** Visualizar detalhes de uma pergunta  
**Endpoint:** `GET /api/questions/:id`

### UC-044: Criar Pergunta
**Ator:** Administrador  
**Descrição:** Criar nova pergunta  
**Endpoint:** `POST /api/questions`  
**Dados necessários:**
- Título
- Tipo de input
- Categoria (opcional)
- Opções (se aplicável)

### UC-045: Atualizar Pergunta
**Ator:** Administrador  
**Descrição:** Atualizar pergunta existente  
**Endpoint:** `PATCH /api/questions/:id`

### UC-046: Deletar Pergunta
**Ator:** Administrador  
**Descrição:** Remover pergunta do sistema  
**Endpoint:** `DELETE /api/questions/:id`  
**Validações:**
- Verificar se não está sendo usada em templates

### UC-047: Listar Categorias
**Ator:** Administrador  
**Descrição:** Listar todas as categorias  
**Endpoint:** `GET /api/categories`

### UC-048: Visualizar Categoria
**Ator:** Administrador  
**Descrição:** Visualizar detalhes de uma categoria  
**Endpoint:** `GET /api/categories/:id`

### UC-049: Criar Categoria
**Ator:** Administrador  
**Descrição:** Criar nova categoria  
**Endpoint:** `POST /api/categories`  
**Dados necessários:**
- Nome
- Descrição (opcional)

### UC-050: Atualizar Categoria
**Ator:** Administrador  
**Descrição:** Atualizar categoria existente  
**Endpoint:** `PATCH /api/categories/:id`

### UC-051: Deletar Categoria
**Ator:** Administrador  
**Descrição:** Remover categoria do sistema  
**Endpoint:** `DELETE /api/categories/:id`  
**Validações:**
- Verificar se não está sendo usada

---

## 6. MySabichão - Chat com IA

### UC-052: Enviar Mensagem
**Ator:** Usuário, Administrador  
**Descrição:** Enviar mensagem ao chatbot  
**Endpoint:** `POST /api/chat/message`  
**Dados enviados:**
- message (texto)
- conversationId (opcional)
- context ('sabichao' ou 'support')

### UC-053: Receber Resposta com RAG
**Ator:** Sistema IA  
**Descrição:** Receber resposta da IA com contexto RAG  
**Fluxo Principal:**
1. Sistema busca chunks relevantes
2. Sistema enriquece prompt com contexto
3. IA gera resposta
4. Sistema retorna resposta ao usuário

### UC-054: Visualizar Histórico
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar histórico de conversação  
**Endpoint:** `GET /api/chat/conversation/:conversationId`  
**Validações:**
- Usuário só vê próprias conversas

### UC-055: Manter Contexto
**Ator:** Sistema  
**Descrição:** Manter contexto de conversa entre mensagens  
**Implementação:**
- conversationId único por conversa
- Histórico armazenado no banco
- Contexto incluído em cada requisição

### UC-056: Ações Rápidas
**Ator:** Usuário, Administrador  
**Descrição:** Usar ações rápidas pré-definidas  
**Componente:** `V0AIChat`  
**Exemplos:**
- "Explique sobre templates"
- "Como preencher formulário?"

### UC-057: Upload Documento
**Ator:** Usuário, Administrador  
**Descrição:** Fazer upload de documento para RAG  
**Endpoint:** `POST /api/documents/upload`  
**Formatos suportados:**
- PDF
- DOCX
- TXT
- MD
**Limite:** 10MB

### UC-058: Listar Documentos
**Ator:** Usuário, Administrador  
**Descrição:** Listar documentos enviados  
**Endpoint:** `GET /api/documents`  
**Componente:** `DocumentsManager`

### UC-059: Visualizar Documento
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar detalhes de um documento  
**Endpoint:** `GET /api/documents/:id`  
**Informações:**
- Nome original
- Tamanho
- Data de upload
- Status de processamento

### UC-060: Deletar Documento
**Ator:** Usuário, Administrador  
**Descrição:** Remover documento e seus chunks  
**Endpoint:** `DELETE /api/documents/:id`  
**Ações:**
1. Deletar chunks do banco
2. Deletar documento
3. Deletar arquivo físico (se existir)

### UC-061: Processar Documento (Assíncrono)
**Ator:** Sistema  
**Descrição:** Processar documento em background  
**Fluxo Principal:**
1. Extrair texto do arquivo
2. Dividir em chunks
3. Gerar embeddings
4. Armazenar no banco
5. Atualizar status do documento

### UC-062: Buscar Chunks Relevantes (RAG)
**Ator:** Sistema  
**Descrição:** Buscar chunks relevantes para contexto  
**Serviço:** `rag.service.ts`  
**Algoritmo:**
1. Gerar embedding da pergunta
2. Buscar chunks similares (cosine similarity)
3. Retornar top N chunks mais relevantes

---

## 7. Painel Administrativo

### UC-063: Listar Usuários
**Ator:** Administrador  
**Descrição:** Listar todos os usuários do sistema  
**Endpoint:** `GET /api/users`  
**Componente:** `UsersManagement`

### UC-064: Visualizar Usuário
**Ator:** Administrador  
**Descrição:** Visualizar detalhes de um usuário  
**Endpoint:** `GET /api/users/:id`

### UC-065: Criar Usuário
**Ator:** Administrador  
**Descrição:** Criar novo usuário manualmente  
**Endpoint:** `POST /api/users`  
**Dados necessários:**
- Email
- Nome
- Sobrenome
- Role (admin/user)

### UC-066: Atualizar Usuário
**Ator:** Administrador  
**Descrição:** Atualizar dados de usuário  
**Endpoint:** `PATCH /api/users/:id`  
**Dados atualizáveis:**
- Nome
- Sobrenome
- Role
- Status (ativo/inativo)

### UC-067: Deletar Usuário
**Ator:** Administrador  
**Descrição:** Remover usuário do sistema  
**Endpoint:** `DELETE /api/users/:id`  
**Validações:**
- Não pode deletar a si mesmo
- Verificar submissões associadas

### UC-068: Estatísticas Usuários
**Ator:** Administrador  
**Descrição:** Visualizar estatísticas de usuários  
**Endpoint:** `GET /api/users/stats`  
**Componente:** `SystemStats`

### UC-069: Desempenho Usuários
**Ator:** Administrador  
**Descrição:** Visualizar desempenho individual dos usuários  
**Componente:** `UserPerformance`  
**Métricas:**
- Número de submissões
- Valor total gerado
- Média por submissão

### UC-070: Estatísticas Sistema
**Ator:** Administrador  
**Descrição:** Visualizar estatísticas gerais do sistema  
**Componente:** `SystemStats`  
**Métricas:**
- Total de usuários
- Total de templates
- Total de submissões
- Uso do sistema

### UC-071: Gerenciar Usuários (Interface)
**Ator:** Administrador  
**Descrição:** Gerenciar usuários através da interface  
**Componente:** `UsersManagement`  
**Funcionalidades:**
- Listar usuários
- Filtrar e buscar
- Editar em linha
- Deletar com confirmação

### UC-072: Configurações
**Ator:** Administrador  
**Descrição:** Acessar painel de configurações  
**Componente:** `SettingsPanel`  
**Configurações:**
- Parâmetros do sistema
- Integrações
- Notificações

### UC-073: Gerenciar Templates (Admin)
**Ator:** Administrador  
**Descrição:** Gerenciar templates via painel admin  
**Componente:** `TemplatesManagementDialog`  
**Funcionalidades:**
- CRUD completo de templates
- Visualização consolidada

### UC-074: Verificar Permissões
**Ator:** Sistema  
**Descrição:** Verificar permissões de acesso  
**Middleware:** `requireAdmin`, `requireRole`  
**Validações:**
- Role do usuário
- Permissões específicas

### UC-075: Restringir Acesso
**Ator:** Sistema  
**Descrição:** Restringir acesso a páginas/funcionalidades  
**Implementação:**
- Verificação no servidor
- Verificação no cliente
- Redirecionamento se necessário

### UC-076: Ver Todas Submissões
**Ator:** Administrador  
**Descrição:** Administrador visualiza todas as submissões  
**Diferença:** Usuário comum vê apenas próprias submissões  
**Endpoint:** `GET /api/submissions` (sem filtro de usuário)

---

## 8. Funcionalidades Técnicas

### UC-077: Rate Limiting
**Ator:** Sistema  
**Descrição:** Limitar requisições por IP  
**Configuração:** 100 requests / 15 minutos

### UC-078: Helmet Security
**Ator:** Sistema  
**Descrição:** Aplicar headers de segurança  
**Middleware:** Helmet.js

### UC-079: CORS
**Ator:** Sistema  
**Descrição:** Configurar CORS para cliente  
**Origem permitida:** Configurada via env

### UC-080: Middleware de Autenticação
**Ator:** Sistema  
**Descrição:** Validar autenticação em rotas protegidas  
**Middleware:** `authenticateUser`

### UC-081: Health Check
**Ator:** Sistema  
**Descrição:** Verificar status do servidor  
**Endpoint:** `GET /health`

### UC-082: Inicializar Índices
**Ator:** Sistema  
**Descrição:** Criar índices do banco na inicialização  
**Execução:** Automática no startup

### UC-083: Seed Templates Padrão
**Ator:** Sistema  
**Descrição:** Inicializar templates padrão  
**Execução:** Automática no startup

### UC-084: Proxy de API
**Ator:** Sistema  
**Descrição:** Proxificar requisições de API  
**Rota:** `/api/proxy/[...path]`

---

## 9. Interface e Navegação

### UC-085: Navegar pelo Sidebar
**Ator:** Usuário, Administrador  
**Descrição:** Navegar entre páginas usando sidebar  
**Componente:** `Sidebar`

### UC-086: Visualizar Topbar
**Ator:** Usuário, Administrador  
**Descrição:** Visualizar informações do usuário no topbar  
**Componente:** `Topbar`

### UC-087: Acessar Dashboard
**Ator:** Usuário, Administrador  
**Descrição:** Acessar página principal (dashboard)  
**Rota:** `/`

### UC-088: Acessar Formulários
**Ator:** Usuário, Administrador  
**Descrição:** Acessar página de formulários  
**Rota:** `/formularios`

### UC-089: Acessar Consultas
**Ator:** Usuário, Administrador  
**Descrição:** Acessar página de consultas  
**Rota:** `/consultas`

### UC-090: Acessar MySabichão
**Ator:** Usuário, Administrador  
**Descrição:** Acessar página do chatbot  
**Rota:** `/mysabichao`

### UC-091: Acessar Templates (Admin)
**Ator:** Administrador  
**Descrição:** Acessar página de gestão de templates  
**Rota:** `/templates`  
**Restrição:** Apenas admin

### UC-092: Acessar Admin
**Ator:** Administrador  
**Descrição:** Acessar painel administrativo  
**Rota:** `/admin`  
**Restrição:** Apenas admin

---

## 📊 Resumo Estatístico

| Módulo | Casos de Uso |
|--------|--------------|
| Autenticação e Autorização | 6 |
| Dashboard e Análises | 10 |
| Gestão de Templates | 10 |
| Gestão de Formulários | 14 |
| Gestão de Perguntas e Categorias | 10 |
| MySabichão - Chat com IA | 11 |
| Painel Administrativo | 14 |
| Funcionalidades Técnicas | 8 |
| Interface e Navegação | 8 |
| **TOTAL** | **91** |

---

## 🔄 Relações e Dependências

### Extends (Estende)
- UC-031 estende UC-030 (Submeter estende Preencher)
- UC-020 estende UC-024 (Criar Template estende Criar via Diálogo)
- UC-021 estende UC-025 (Atualizar Template estende Editar)
- UC-022 estende UC-026 (Deletar Template estende Deletar Interface)

### Includes (Inclui)
- UC-053 inclui UC-062 (Resposta RAG inclui Buscar Chunks)
- UC-052 inclui UC-055 (Enviar Mensagem inclui Manter Contexto)
- UC-032 inclui UC-034, UC-035, UC-036, UC-037, UC-038 (Listar inclui filtros)
- UC-076 estende UC-032 (Admin ver todas estende Listar)

---

## 📝 Notas Finais

- Todos os casos de uso requerem autenticação (exceto webhooks)
- Permissões baseadas em role (admin/user)
- Sistema integrado com Clerk para autenticação
- RAG implementado para contexto inteligente no chat
- Processamento assíncrono para documentos grandes
