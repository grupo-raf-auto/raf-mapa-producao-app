export type QuestionStatus = "active" | "inactive";

export type QuestionInputType =
  | "text"
  | "date"
  | "select"
  | "email"
  | "tel"
  | "number"
  | "radio";

export type UserRole = "admin" | "user";

export interface Question {
  _id?: string;
  title: string;
  description?: string;
  status: QuestionStatus;
  inputType?: QuestionInputType; // Tipo de input
  options?: string[]; // Opções para select
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string; // Clerk ID do utilizador que criou
}

export interface Category {
  _id?: string;
  name: QuestionCategory;
  description?: string;
  color?: string;
  createdAt: Date;
}

export type QuestionCategory =
  | "Finance"
  | "Marketing"
  | "HR"
  | "Tech"
  | "Custom";

export interface Template {
  _id?: string;
  title: string;
  description?: string;
  questions: string[]; // Question IDs
  createdAt: Date;
  updatedAt: Date;
  isDefault?: boolean; // Indica se é um template padrão do sistema
  createdBy?: string; // Clerk ID do utilizador que criou
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
  submittedBy: string; // OBRIGATÓRIO - Clerk ID do utilizador que submeteu
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
  vectorIds?: string[]; // IDs dos chunks no MongoDB
  isActive: boolean;
}

export interface DocumentChunk {
  _id?: string;
  documentId: string; // ID do documento original
  chunkIndex: number; // Índice do chunk no documento
  content: string; // Texto do chunk
  embedding?: number[]; // Embedding vector (1536 dimensões para text-embedding-3-small)
  metadata?: {
    startChar?: number;
    endChar?: number;
    pageNumber?: number; // Para PDFs
  };
  createdAt: Date;
}

export interface ChatMessage {
  _id?: string;
  conversationId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: Date;
  userId: string; // Clerk ID
}

// ============ TIPOS BASE PARA ARQUITETURA ============

/**
 * Request estendido com dados do usuário autenticado
 */
export interface AuthenticatedRequest {
  user?: {
    id: string;
    email: string;
    role: "admin" | "user";
  };
}

/**
 * Resposta padrão da API
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

/**
 * Erro customizado com status HTTP
 */
export class HttpError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: Record<string, unknown> | string
  ) {
    super(message);
    this.name = "HttpError";
  }
}

/**
 * Erros de validação
 */
export class ValidationError extends HttpError {
  constructor(public errors: Record<string, string[]>) {
    super(400, "Validation error");
    this.name = "ValidationError";
  }
}

/**
 * Recurso não encontrado
 */
export class NotFoundError extends HttpError {
  constructor(resource: string, id?: string) {
    super(404, `${resource} not found` + (id ? `: ${id}` : ""));
    this.name = "NotFoundError";
  }
}

/**
 * Acesso negado
 */
export class ForbiddenError extends HttpError {
  constructor(message = "Access denied") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

/**
 * Não autenticado
 */
export class UnauthorizedError extends HttpError {
  constructor(message = "Unauthorized") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Filtros comuns para listagem
 */
export interface ListFilters {
  skip?: number;
  take?: number;
  search?: string;
  orderBy?: string;
  orderDirection?: "asc" | "desc";
}

/**
 * Resposta paginada
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  take: number;
  hasMore: boolean;
}

/**
 * Interface para Repository
 */
export interface RepositoryFilters {
  where?: Record<string, unknown>;
  skip?: number;
  take?: number;
  orderBy?: Record<string, "asc" | "desc">;
}

export interface IRepository<T, CreateInput = unknown, UpdateInput = unknown> {
  findMany(filters?: RepositoryFilters): Promise<T[]>;
  findUnique(id: string): Promise<T | null>;
  create(data: CreateInput): Promise<T>;
  update(id: string, data: UpdateInput): Promise<T>;
  delete(id: string): Promise<T>;
  count(filters?: Pick<RepositoryFilters, "where">): Promise<number>;
}

/**
 * Interface para UseCase
 */
export interface IUseCase<TRequest, TResponse> {
  execute(request: TRequest): Promise<TResponse>;
}
