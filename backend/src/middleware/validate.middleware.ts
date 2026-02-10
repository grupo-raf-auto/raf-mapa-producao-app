import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import logger from "../lib/logger";
import { ValidationError } from "../types/index";

/**
 * Middleware de validação Zod genérico
 *
 * Uso:
 * router.post('/users', validate(createUserSchema), userController.create);
 *
 * Extrai dados validados para req.validatedData
 */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse(req.body);

      if (!validation.success) {
        const errors: Record<string, string[]> = {};

        const zodErrors = validation.error as any;
        zodErrors.errors?.forEach((err: any) => {
          const path = err.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });

        logger.warn(
          { errors, path: req.path, method: req.method },
          "Validation failed"
        );

        throw new ValidationError(errors);
      }

      // Armazenar dados validados no request
      (req as any).validatedData = validation.data;
      next();
    } catch (error) {
      logger.error({ error, path: req.path }, "Validation middleware error");
      throw error;
    }
  };
}

/**
 * Middleware para validar dados de query
 *
 * Uso:
 * router.get('/questions', validateQuery(listQuestionsSchema), questionsController.getAll);
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const validation = schema.safeParse(req.query);

      if (!validation.success) {
        const errors: Record<string, string[]> = {};

        const zodErrors = validation.error as any;
        zodErrors.errors?.forEach((err: any) => {
          const path = err.path.join(".");
          if (!errors[path]) errors[path] = [];
          errors[path].push(err.message);
        });

        logger.warn(
          { errors, path: req.path, method: req.method },
          "Query validation failed"
        );

        throw new ValidationError(errors);
      }

      // Armazenar dados validados no request
      (req as any).validatedQuery = validation.data;
      next();
    } catch (error) {
      logger.error({ error, path: req.path }, "Query validation middleware error");
      throw error;
    }
  };
}
