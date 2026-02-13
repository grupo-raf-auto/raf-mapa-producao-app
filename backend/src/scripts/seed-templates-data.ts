/**
 * Lista de templates para seed da base de dados.
 * Cada template inclui as questões (por título) na ordem desejada.
 *
 * As questões devem existir previamente (npm run seed:questions).
 * Para aplicar via painel admin: botão "Restaurar templates iniciais".
 * Para aplicar via CLI: npm run seed:templates
 */

export interface SeedTemplateEntry {
  title: string;
  description?: string;
  modelType?: 'credito' | 'imobiliaria' | 'seguro';
  isPublic?: boolean;
  /** Títulos das questões na ordem em que aparecem no formulário */
  questionTitles: string[];
}

export const SEED_TEMPLATES: SeedTemplateEntry[] = [
  {
    title: 'Apontamento Seguros',
    description: 'Registo de apólices de seguros',
    modelType: 'seguro',
    isPublic: true,
    questionTitles: [
      'Data',
      'Apontador',
      'Agente',
      'Nome do Cliente',
      'Data nascimento',
      'Email',
      'Telefone',
      'Distrito',
      'Rating',
      'Seguradora',
      'Banco',
      'Valor',
      'Fracionamento',
    ],
  },
  {
    title: 'Apontamento Crédito',
    description: 'Registo de operações de crédito',
    modelType: 'credito',
    isPublic: true,
    questionTitles: [
      'Data',
      'Apontador',
      'Agente',
      'Nome do Cliente',
      'Data nascimento',
      'Email',
      'Telefone',
      'Distrito',
      'Rating',
      'Seguradora',
      'Banco',
      'Valor',
      'Fracionamento',
    ],
  },
  {
    title: 'Apontamento Imobiliário',
    description: 'Registo de operações imobiliárias',
    modelType: 'imobiliaria',
    isPublic: true,
    questionTitles: [
      'Data',
      'Apontador',
      'Agente',
      'Nome do Cliente',
      'Data nascimento',
      'Email',
      'Telefone',
      'Distrito',
      'Rating',
      'Seguradora',
      'Banco',
      'Valor',
      'Fracionamento',
    ],
  },
];
