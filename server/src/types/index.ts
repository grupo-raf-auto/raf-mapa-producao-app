export type QuestionStatus = 'active' | 'inactive';

export type QuestionInputType = 'text' | 'date' | 'select' | 'email' | 'tel' | 'number' | 'radio';

export interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: QuestionStatus;
  inputType?: QuestionInputType; // Tipo de input
  options?: string[]; // Opções para select
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  _id?: string;
  name: QuestionCategory;
  description?: string;
  color?: string;
  createdAt: Date;
}

export interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[]; // Question IDs
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean; // Indica se é um template padrão do sistema
}

export interface FormSubmission {
  _id?: string;
  templateId: string; // Referência ao template usado
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date;
  submittedBy?: string; // ID do usuário que submeteu (quando implementar login)
}
