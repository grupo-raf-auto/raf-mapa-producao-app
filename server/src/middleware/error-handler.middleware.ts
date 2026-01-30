import { Request, Response, NextFunction } from "express";
import logger from "../lib/logger";
import {
  HttpError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ApiResponse,
} from "../types/index";

/**
 * Middleware central para tratamento de erros
 * Normaliza todas as respostas de erro e previne stack traces em produção
 */
export function errorHandlerMiddleware(
  error: Error | HttpError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isDevelopment = process.env.NODE_ENV !== "production";

  // Log do erro
  if (error instanceof HttpError) {
    logger.warn(
      {
        err: error,
        statusCode: error.statusCode,
        path: req.path,
        method: req.method,
      },
      `HTTP Error: ${error.message}`
    );
  } else {
    logger.error(
      {
        err: error,
        path: req.path,
        method: req.method,
        userId: (req as any).user?.id,
      },
      "Unhandled error"
    );
  }

  // Formatar resposta de erro
  if (error instanceof ValidationError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      errors: error.errors,
    } as ApiResponse);
  }

  if (error instanceof HttpError) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      ...(isDevelopment && { details: error.details }),
    } as ApiResponse);
  }

  // Erro genérico desconhecido
  const statusCode = (error as any).statusCode || 500;
  const isDuplicateKeyError = error.message.includes("Unique constraint failed");

  if (isDuplicateKeyError) {
    return res.status(409).json({
      success: false,
      error: "Resource already exists",
    } as ApiResponse);
  }

  return res.status(statusCode).json({
    success: false,
    error: isDevelopment ? error.message : "Internal server error",
    ...(isDevelopment && { stack: error.stack }),
  } as ApiResponse);
}

/**
 * Middleware para capturar erros em rotas assincronas
 * Uso: app.get("/route", asyncHandler(controllerMethod))
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
