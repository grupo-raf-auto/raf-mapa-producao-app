import { z } from 'zod';
import {
  STRING_MIN_LENGTH,
  STRING_MAX_LENGTH,
  STRING_DESCRIPTION_MAX_LENGTH,
  INPUT_TYPES,
  VALID_STATUSES,
  VALID_USER_STATUSES,
  ALLOWED_DOCUMENT_MIME_TYPES,
  VALID_CHAT_CONTEXTS,
  VALID_ROLES,
  COLOR_HEX_REGEX,
} from '../constants';

// ============ QUESTION ============

export const createQuestionSchema = z.object({
  title: z
    .string()
    .min(STRING_MIN_LENGTH, 'Title is required')
    .max(
      STRING_MAX_LENGTH,
      `Title must be less than ${STRING_MAX_LENGTH} characters`,
    ),
  description: z.string().max(STRING_DESCRIPTION_MAX_LENGTH).optional(),
  status: z.enum(VALID_STATUSES).default('active'),
  inputType: z.enum(INPUT_TYPES).optional(),
  options: z.array(z.string()).optional(),
  categoryId: z.string().uuid().optional().nullable(),
});

export const updateQuestionSchema = createQuestionSchema.partial();

// ============ CATEGORY ============

export const createCategorySchema = z.object({
  name: z.string().min(STRING_MIN_LENGTH).max(100),
  description: z.string().max(500).optional(),
  color: z.string().regex(COLOR_HEX_REGEX).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ============ TEMPLATE ============

export const createTemplateSchema = z.object({
  title: z.string().min(STRING_MIN_LENGTH).max(STRING_MAX_LENGTH),
  description: z.string().max(STRING_DESCRIPTION_MAX_LENGTH).optional(),
  isPublic: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  questionIds: z
    .array(z.string().uuid())
    .min(1, 'At least one question required'),
});

export const updateTemplateSchema = createTemplateSchema.partial().omit({
  questionIds: true,
});

// ============ FORM SUBMISSION ============

export const answerSchema = z.object({
  questionId: z.string().uuid(),
  answer: z.string(),
});

export const createSubmissionSchema = z.object({
  templateId: z.string().uuid(),
  answers: z.array(answerSchema).min(1),
});

// ============ DOCUMENT ============

export const uploadDocumentSchema = z.object({
  // Validação de arquivo é feita por multer, aqui apenas metadados
  originalName: z.string().min(STRING_MIN_LENGTH).max(STRING_MAX_LENGTH),
  mimeType: z.enum(ALLOWED_DOCUMENT_MIME_TYPES),
});

// ============ CHAT ============

export const sendMessageSchema = z.object({
  conversationId: z.string().min(STRING_MIN_LENGTH),
  message: z.string().min(STRING_MIN_LENGTH).max(5000),
  chatContext: z.enum(VALID_CHAT_CONTEXTS).default('general'),
});

// ============ USER ============

export const updateUserSchema = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  role: z.enum(VALID_ROLES).optional(),
  status: z.enum(VALID_USER_STATUSES).optional(),
  isActive: z.boolean().optional(),
  rejectionReason: z.string().max(500).optional(),
});

// ============ DOCUMENT SCANNER ============

export const scanDocumentSchema = z.object({
  fileType: z.enum(['pdf', 'image']),
  fileName: z.string().min(STRING_MIN_LENGTH).max(STRING_MAX_LENGTH),
});

export type CreateQuestionInput = z.infer<typeof createQuestionSchema>;
export type UpdateQuestionInput = z.infer<typeof updateQuestionSchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type CreateTemplateInput = z.infer<typeof createTemplateSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionSchema>;
export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
