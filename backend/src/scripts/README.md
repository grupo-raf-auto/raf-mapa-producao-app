# Scripts do servidor

## Seed de questões

Para ter um conjunto de **questões existentes** disponíveis ao criar/editar templates (sem as criar uma a uma na UI), usa o seed de questões.

### 1. Editar a lista de questões

Abre e edita o ficheiro:

**`seed-questions-data.ts`**

- Cada entrada tem: `title`, `description` (opcional), `inputType`, `options` (para select/radio).
- Tipos de input: `text`, `date`, `select`, `email`, `tel`, `number`, `radio`.
- Adiciona novas linhas ao array `SEED_QUESTIONS` para novas questões.

Exemplo:

```ts
{ title: 'Estado', inputType: 'select', options: ['Pendente', 'Concluído', 'Cancelado'] },
```

### 2. Executar o seed

No diretório **backend**:

```bash
npm run seed:questions
```

- Questões que já existam (mesmo título) são ignoradas.
- As novas entradas em `SEED_QUESTIONS` são criadas na base de dados e passam a aparecer em "Novo Template" / "Editar Template" ao adicionar questões.

### Outros scripts

- `npm run seed` – seed de templates (atualmente vazio; templates são criados pelo admin na aplicação).
- `npm run set-admin` – define um utilizador como admin pelo email.
- `fix-credential-accounts.ts` – ver comentários no ficheiro.
