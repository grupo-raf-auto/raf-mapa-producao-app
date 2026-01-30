import pino from "pino";

// Logger estruturado com níveis: trace, debug, info, warn, error, fatal
const isDevelopment = process.env.NODE_ENV !== "production";

export const logger = pino({
  level: process.env.LOG_LEVEL || (isDevelopment ? "debug" : "info"),
  transport: isDevelopment
    ? {
        target: "pino-pretty",
        options: {
          colorize: true,
          translateTime: "SYS:standard",
          ignore: "pid,hostname",
        },
      }
    : undefined,
  // Sanitizar logs para não expor dados sensíveis
  serializers: {
    req: (req) => ({
      method: req.method,
      url: req.url,
      headers: sanitizeHeaders(req.headers),
    }),
    err: pino.stdSerializers.err,
  },
});

/**
 * Sanitiza headers para não expor tokens/passwords
 */
function sanitizeHeaders(headers: Record<string, any>): Record<string, string> {
  const sanitized: Record<string, string> = {};
  const sensitiveKeys = [
    "authorization",
    "cookie",
    "x-api-key",
    "x-auth-token",
  ];

  for (const [key, value] of Object.entries(headers)) {
    if (sensitiveKeys.includes(key.toLowerCase())) {
      sanitized[key] = "[REDACTED]";
    } else {
      sanitized[key] = typeof value === "string" ? value : String(value);
    }
  }

  return sanitized;
}

/**
 * Log com contexto de requisição
 */
export function createRequestLogger(req: any) {
  return logger.child({
    requestId: req.id || "unknown",
    userId: req.user?.id || "anonymous",
  });
}

export default logger;
