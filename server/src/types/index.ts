export type QuestionStatus = 'active' | 'inactive';

export type QuestionInputType = 'text' | 'date' | 'select' | 'email' | 'tel' | 'number' | 'radio';

export type UserRole = 'admin' | 'user';

export interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: QuestionStatus;
  inputType?: QuestionInputType; // Tipo de input
  options?: string[]; // Opções para select
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Clerk ID do usuário que criou
}

export interface Category {
  _id?: string;
  name: QuestionCategory;
  description?: string;
  color?: string;
  createdAt: Date;
}

export type QuestionCategory = 'Finance' | 'Marketing' | 'HR' | 'Tech' | 'Custom';

export interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[]; // Question IDs
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean; // Indica se é um template padrão do sistema
  createdBy?: string; // Clerk ID do usuário que criou
  isPublic?: boolean; // Templates públicos podem ser usados por todos
}

export interface FormSubmission {
  _id?: string;
  templateId: string; // Referência ao template usado
  answers: {
    questionId: string;
    answer: string;
  }[];
  submittedAt: Date;
  submittedBy: string; // OBRIGATÓRIO - Clerk ID do usuário que submeteu
}

export interface User {
  _id?: string;
  clerkId: string; // ID do Clerk
  email: string;
  firstName?: string;
  lastName?: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  createdBy?: string; // ID do admin que criou (se aplicável)
}

export interface Document {
  _id?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  uploadedBy: string; // Clerk ID
  uploadedAt: Date;
  processedAt?: Date;
  vectorIds?: string[]; // IDs dos vetores no vector database
  isActive: boolean;
}

export interface ChatMessage {
  _id?: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
  userId: string; // Clerk ID
}
