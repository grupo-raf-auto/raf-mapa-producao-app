export type QuestionStatus = 'active' | 'inactive';
export type QuestionCategory = 'Finance' | 'Marketing' | 'HR' | 'Tech' | 'Custom';

export interface Question {
  _id?: string;
  title: string;
  description?: string;
  category: QuestionCategory;
  status: QuestionStatus;
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

export interface Form {
  _id?: string;
  title: string;
  description?: string;
  questions: string[]; // Question IDs
  createdAt: Date;
  updatedAt: Date;
  isTemplate?: boolean; // Indica se é um template
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
  formId: string;
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date;
}
