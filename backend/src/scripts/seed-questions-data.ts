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

/**
 * Questões existentes. Adiciona novas entradas aqui para ficarem
 * disponíveis ao criar/editar templates.
 */
export const SEED_QUESTIONS: SeedQuestionEntry[] = [
  {
    title: 'Data',
    description: 'Data do apontamento',
    inputType: 'date',
    options: [],
  },
  { title: 'Apontador', inputType: 'text', options: [] },
  { title: 'Agente', inputType: 'text', options: [] },
  { title: 'Nome do Cliente', inputType: 'text', options: [] },
  { title: 'Data nascimento', inputType: 'date', options: [] },
  { title: 'Email cliente', inputType: 'email', options: [] },
  { title: 'Telefone cliente', inputType: 'tel', options: [] },
  { title: 'Distrito cliente', inputType: 'text', options: [] },
  { title: 'Rating cliente', inputType: 'text', options: [] },
  { title: 'Seguradora', inputType: 'text', options: [] },
  { title: 'Banco', inputType: 'text', options: [] },
  { title: 'Valor', inputType: 'number', options: [] },
  { title: 'Fracionamento', inputType: 'text', options: [] },
  // Exemplo com opções (select/radio):
  // { title: 'Estado', inputType: 'select', options: ['Pendente', 'Concluído', 'Cancelado'] },
];
