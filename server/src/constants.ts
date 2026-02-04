/**
 * Constantes globais da aplicação
 * Centralizar valores mágicos para fácil manutenção
 */

import {
  UserRole as PrismaUserRole,
  UserApprovalStatus as PrismaUserApprovalStatus,
} from '@prisma/client';

// ============ PAGINATION ============
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;
export const MIN_PAGE_SIZE = 1;

// ============ STATS & ANALYTICS ============
export const STATS_DATE_RANGE_DAYS = 30;
export const STATS_TRENDING_LIMIT = 10;
export const STATS_LARGE_BATCH_THRESHOLD = 100;

// ============ TIME RANGES ============
export const TIME_RANGE_7_DAYS = 7;
export const TIME_RANGE_30_DAYS = 30;
export const TIME_RANGE_90_DAYS = 90;

// ============ VALIDATION ============
export const STRING_MIN_LENGTH = 1;
export const STRING_MAX_LENGTH = 255;
export const STRING_LONG_MAX_LENGTH = 1000;
export const STRING_DESCRIPTION_MAX_LENGTH = 1000;
export const EMAIL_MAX_LENGTH = 255;

// ============ FILE UPLOAD ============
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// ============ RATE LIMITING ============
export const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
export const RATE_LIMIT_MAX_REQUESTS = 100;

// ============ TIMEOUTS ============
export const API_TIMEOUT_MS = 30000; // 30 seconds
export const DOCUMENT_PROCESSING_TIMEOUT_MS = 120000; // 2 minutes

// ============ DOCUMENT SCANNER ============
export const SCANNER_MAX_POLL_ATTEMPTS = 15;
export const SCANNER_POLL_INTERVAL_MS = 2000;

// ============ ROLES (enum UserRole na DB) ============
export type UserRole = PrismaUserRole;
export const UserRole = PrismaUserRole;
export const ROLE_ADMIN = UserRole.admin;
export const ROLE_USER = UserRole.user;
export const VALID_ROLES = [UserRole.user, UserRole.admin] as const;

// ============ STATUS ============
export const STATUS_ACTIVE = 'active';
export const STATUS_INACTIVE = 'inactive';
export const VALID_STATUSES = [STATUS_ACTIVE, STATUS_INACTIVE] as const;

// ============ USER APPROVAL STATUS (enum UserApprovalStatus na DB) ============
export type UserApprovalStatus = PrismaUserApprovalStatus;
export const UserApprovalStatus = PrismaUserApprovalStatus;
export const USER_STATUS_PENDING = UserApprovalStatus.pending;
export const USER_STATUS_APPROVED = UserApprovalStatus.approved;
export const USER_STATUS_REJECTED = UserApprovalStatus.rejected;
export const VALID_USER_STATUSES = [
  UserApprovalStatus.pending,
  UserApprovalStatus.approved,
  UserApprovalStatus.rejected,
] as const;

// ============ INPUT TYPES ============
export const INPUT_TYPES = [
  'text',
  'date',
  'select',
  'email',
  'tel',
  'number',
  'radio',
] as const;

// ============ MIME TYPES ============
export const ALLOWED_DOCUMENT_MIME_TYPES = [
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
] as const;

// ============ CHAT ============
export const CHAT_CONTEXT_SABICHAO = 'sabichao';
export const CHAT_CONTEXT_GENERAL = 'general';
export const VALID_CHAT_CONTEXTS = [
  CHAT_CONTEXT_SABICHAO,
  CHAT_CONTEXT_GENERAL,
] as const;

// ============ COLORS ============
export const COLOR_HEX_REGEX = /^#[0-9A-F]{6}$/i;

// ============ LOGGING ============
export const LOG_LEVELS = ['debug', 'info', 'warn', 'error'] as const;

// ============ USER MODELS ============
// Note: Não há limite máximo de modelos ativos por utilizador
// Um utilizador pode ter qualquer combinação de credito, imobiliaria e seguro ativos
export const VALID_MODEL_TYPES = ['credito', 'imobiliaria', 'seguro'] as const;
export const MAX_ACTIVE_MODELS = VALID_MODEL_TYPES.length; // 3 modelos no máximo
