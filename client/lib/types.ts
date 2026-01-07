export type QuestionStatus = 'active' | 'inactive';
export type QuestionCategory = 'Finance' | 'Marketing' | 'HR' | 'Tech' | 'Custom';

export type QuestionInputType = 'text' | 'date' | 'select' | 'email' | 'tel' | 'number' | 'radio';

export interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: QuestionStatus;
  inputType?: QuestionInputType;
  options?: string[];
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
