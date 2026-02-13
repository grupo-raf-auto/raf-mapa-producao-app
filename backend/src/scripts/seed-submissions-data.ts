/**
 * Dados dummy para submissions.
 *
 * Apenas via CLI: npm run seed:dummy
 *
 * Requer que existam templates e questões. Usa o primeiro utilizador admin
 * como submittedBy. Se não houver admin, usa o primeiro utilizador.
 */

export interface SeedSubmissionEntry {
  templateTitle: string;
  modelContext?: 'credito' | 'imobiliaria' | 'seguro';
  /** Respostas por título da questão */
  answersByQuestionTitle: Record<string, string>;
}

export const SEED_SUBMISSIONS: SeedSubmissionEntry[] = [
  {
    templateTitle: 'Apontamento Seguros',
    modelContext: 'seguro',
    answersByQuestionTitle: {
      'Data': '2025-01-15',
      'Agente': 'Maria Silva',
      'Nome do Cliente': 'João Santos',
      'Seguradora': 'Fidelidade',
      'Valor': '1500',
      'Fracionamento': 'Anual',
      'Rating cliente': '4',
      'Distrito cliente': 'Lisboa',
    },
  },
  {
    templateTitle: 'Apontamento Seguros',
    modelContext: 'seguro',
    answersByQuestionTitle: {
      'Data': '2025-01-18',
      'Agente': 'Pedro Costa',
      'Nome do Cliente': 'Ana Ferreira',
      'Seguradora': 'Ageas',
      'Valor': '850',
      'Fracionamento': 'Mensal',
      'Rating cliente': '5',
      'Distrito cliente': 'Porto',
    },
  },
  {
    templateTitle: 'Apontamento Crédito',
    modelContext: 'credito',
    answersByQuestionTitle: {
      'Data': '2025-01-20',
      'Agente': 'Maria Silva',
      'Nome do Cliente': 'Carlos Mendes',
      'Banco': 'Caixa Geral de Depósitos',
      'Valor': '250000',
      'Distrito cliente': 'Lisboa',
    },
  },
  {
    templateTitle: 'Apontamento Crédito',
    modelContext: 'credito',
    answersByQuestionTitle: {
      'Data': '2025-01-22',
      'Agente': 'Pedro Costa',
      'Nome do Cliente': 'Rita Almeida',
      'Banco': 'Santander',
      'Valor': '180000',
      'Distrito cliente': 'Setúbal',
    },
  },
  {
    templateTitle: 'Apontamento Imobiliário',
    modelContext: 'imobiliaria',
    answersByQuestionTitle: {
      'Data': '2025-01-25',
      'Agente': 'Maria Silva',
      'Nome do Cliente': 'Luís Oliveira',
      'Valor': '320000',
      'Distrito cliente': 'Lisboa',
    },
  },
];
