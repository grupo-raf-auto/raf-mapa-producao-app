/**
 * Lista de questões para seed da base de dados.
 * Edita este ficheiro para adicionar ou alterar questões iniciais.
 *
 * Para aplicar: no diretório backend, corre:
 *   npm run seed:questions
 *
 * Tipos de input: text | date | select | email | tel | number | radio
 * Para select e radio, preenche o array options. Para os outros, usa [].
 */

export type SeedQuestionInputType =
  | 'text'
  | 'date'
  | 'select'
  | 'email'
  | 'tel'
  | 'number'
  | 'radio';

export interface SeedQuestionEntry {
  /** Título da questão (único; usado para evitar duplicados no seed) */
  title: string;
  /** Descrição opcional */
  description?: string;
  /** Tipo de campo no formulário */
  inputType: SeedQuestionInputType;
  /** Opções para select/radio; vazio para outros tipos */
  options?: string[];
}

// ============ Listas de opções (editar aqui para adicionar/remover) ============

const SEGURADORAS = [
  'Fidelidade',
  'Ageas',
  'Generali',
  'VidaCaixa',
  'Allianz',
  'AXA',
  'Mapfre',
  'Zurich',
  'Lusitania',
  'UNA Seguros',
  'Caravela Seguros',
  'MetLife',
  'CA Seguros',
  'Santander Seguros',
  'Ocidental',
  'GamaLife',
  'Logo Seguros',
  'Médis',
  'Multicare',
  'Bupa',
  'MGEN Seguros',
  'Victoria Seguros',
  'Tranquilidade',
  'Outra',
];

const BANCOS = [
  'Caixa Geral de Depósitos',
  'Santander',
  'Novo Banco',
  'BPI',
  'Millennium BCP',
  'Crédito Agrícola',
  'Banco CTT',
  'Bankinter',
  'Montepio',
  'ActivoBank',
  'Abanca',
  'Outro',
];

const DISTRITOS = [
  'Aveiro',
  'Beja',
  'Braga',
  'Bragança',
  'Castelo Branco',
  'Coimbra',
  'Évora',
  'Faro',
  'Guarda',
  'Leiria',
  'Lisboa',
  'Portalegre',
  'Porto',
  'Santarém',
  'Setúbal',
  'Viana do Castelo',
  'Vila Real',
  'Viseu',
  'Região Autónoma dos Açores',
  'Região Autónoma da Madeira',
];

const RATING_CLIENTE = ['1', '2', '3', '4', '5'];

const FRACIONAMENTO = ['Mensal', 'Trimestral', 'Semestral', 'Anual'];

// ============ Questões (adicionar novas entradas ao array) ============

export const SEED_QUESTIONS: SeedQuestionEntry[] = [
  {
    title: 'Data',
    description: 'Data do apontamento ou da operação',
    inputType: 'date',
    options: [],
  },
  {
    title: 'Apontador',
    description: 'Utilizador que regista o apontamento',
    inputType: 'text',
    options: [],
  },
  {
    title: 'Agente',
    description: 'Agente responsável (preenchido automaticamente com o utilizador logado)',
    inputType: 'text',
    options: [],
  },
  {
    title: 'Nome do Cliente',
    description: 'Nome completo do cliente',
    inputType: 'text',
    options: [],
  },
  {
    title: 'Data nascimento',
    description: 'Data de nascimento do cliente',
    inputType: 'date',
    options: [],
  },
  {
    title: 'Email',
    description: 'Email de contacto do cliente',
    inputType: 'email',
    options: [],
  },
  {
    title: 'Telefone',
    description: 'Telefone de contacto do cliente',
    inputType: 'tel',
    options: [],
  },
  {
    title: 'Distrito',
    description: 'Distrito ou região de residência do cliente',
    inputType: 'select',
    options: DISTRITOS,
  },
  {
    title: 'Rating',
    description: 'Classificação de risco do cliente (1 a 5)',
    inputType: 'select',
    options: RATING_CLIENTE,
  },
  {
    title: 'Seguradora',
    description: 'Seguradora da apólice ou produto',
    inputType: 'select',
    options: SEGURADORAS,
  },
  {
    title: 'Banco',
    description: 'Banco da operação ou financiamento',
    inputType: 'select',
    options: BANCOS,
  },
  {
    title: 'Valor',
    description: 'Valor da operação em euros',
    inputType: 'number',
    options: [],
  },
  {
    title: 'Fracionamento',
    description: 'Periodicidade do pagamento do prémio',
    inputType: 'select',
    options: FRACIONAMENTO,
  },
];
