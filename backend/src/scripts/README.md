# Scripts do servidor

## Seed de questões

Para ter um conjunto de **questões existentes** disponíveis ao criar/editar templates (sem as criar uma a uma na UI), usa o seed de questões.

### 1. Editar a lista de questões

Abre e edita o ficheiro:

**`seed-questions-data.ts`**

#### Estrutura do ficheiro

- **Listas de opções** (topo do ficheiro): `SEGURADORAS`, `BANCOS`, `DISTRITOS`, `RATING_CLIENTE`, `FRACIONAMENTO`. Edita estes arrays para adicionar ou remover opções.
- **Questões**: array `SEED_QUESTIONS`. Cada entrada tem: `title`, `description` (opcional), `inputType`, `options` (para select/radio).
- Tipos de input: `text`, `date`, `select`, `email`, `tel`, `number`, `radio`.

#### Adicionar nova questão

Adiciona uma nova entrada ao array `SEED_QUESTIONS`:

```ts
{
  title: 'Estado',
  description: 'Estado do processo',
  inputType: 'select',
  options: ['Pendente', 'Concluído', 'Cancelado'],
},
```

#### Adicionar opções a uma lista existente

Edita a constante correspondente no topo do ficheiro, por exemplo:

```ts
const SEGURADORAS = [
  'Fidelidade',
  'Ageas',
  'Nova Seguradora',  // ← adicionar aqui
  // ...
];
```

### 2. Executar o seed

No diretório **backend**:

```bash
npm run seed:questions
```

- Questões que já existam (mesmo título) são **ignoradas** (não são atualizadas).
- Para aplicar alterações a questões existentes (ex.: mudar de text para select com opções), edita-as na interface de administração ou usa um script de migração.
- As novas entradas em `SEED_QUESTIONS` são criadas na base de dados e passam a aparecer em "Novo Template" / "Editar Template" ao adicionar questões.

### Seed de templates

- `npm run seed:templates` – cria questões e templates iniciais (seed-templates-data.ts).
- Via painel admin: Admin → Templates → botão "Restaurar Templates".

### Seed de dados dummy (apenas CLI)

- `npm run seed:dummy` – cria submissions de exemplo (seed-submissions-data.ts).
- Requer templates e questões já criados. Usa o primeiro admin como submittedBy.

### Outros scripts

- `npm run seed` – alias de seed:templates.
- `npm run set-admin` – define um utilizador como admin pelo email.
- `fix-credential-accounts.ts` – ver comentários no ficheiro.
