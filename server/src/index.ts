import path from "path";
import dotenv from "dotenv";

// Load .env: raiz do projeto e depois server/ (o server pode ser executado de server/ ou da raiz)
const root = path.resolve(process.cwd(), "..");
dotenv.config({ path: path.join(root, ".env") });
dotenv.config({ path: path.join(root, ".env.local") });
dotenv.config({ path: path.join(process.cwd(), ".env") });
dotenv.config({ path: path.join(process.cwd(), ".env.local") });

import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import compression from "compression";
import questionRoutes from "./routes/question.routes";
import categoryRoutes from "./routes/category.routes";
import templateRoutes from "./routes/template.routes";
import submissionRoutes from "./routes/submission.routes";
import userRoutes from "./routes/user.routes";
import userModelRoutes from "./routes/user-model.routes";
import chatRoutes from "./routes/chat.routes";
import documentRoutes from "./routes/document.routes";
import scannerRoutes from "./routes/documentScanner.routes";
import { seedTemplates } from "./scripts/seed-templates";
import { seedUserModels } from "./scripts/seed-user-models";
import { authenticateUser } from "./middleware/auth.middleware";

const app = express();
const PORT = process.env.PORT || 3005;
const isProduction = process.env.NODE_ENV === "production";

// Trust proxy (required for X-Forwarded-For header from Next.js rewrites)
app.set('trust proxy', 1);

// Security middleware (only in production to avoid dev issues)
if (isProduction) {
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for API server
    crossOriginEmbedderPolicy: false,
  }));
}

// Compression middleware - reduces response size
app.use(compression());

// Rate limiting - configurable via env vars
// For 250 users: ~10000 requests per 15 min window is reasonable
const RATE_LIMIT_WINDOW_MS = parseInt(process.env.RATE_LIMIT_WINDOW_MS || "900000"); // 15 min
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "10000"); // 10k requests per window
const SKIP_RATE_LIMIT = process.env.SKIP_RATE_LIMIT === "true";

if (!SKIP_RATE_LIMIT) {
  const limiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW_MS,
    max: RATE_LIMIT_MAX,
    message: {
      error: "Too many requests",
      retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
    },
    standardHeaders: true,
    legacyHeaders: false,
    // Skip rate limiting for health checks
    skip: (req) => req.path === "/health",
  });
  app.use("/api/", limiter);
  console.log(`🔒 Rate limiting enabled: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS / 1000}s window`);
} else {
  console.log("⚠️ Rate limiting DISABLED - use only for development/testing");
}

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3004",
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request timeout middleware
app.use((req, res, next) => {
  res.setTimeout(30000, () => { // 30 second timeout
    res.status(408).json({ error: "Request timeout" });
  });
  next();
});

// Health check
app.get("/health", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API Routes (protegidas)
app.use("/api/questions", authenticateUser, questionRoutes);
app.use("/api/categories", authenticateUser, categoryRoutes);
app.use("/api/templates", authenticateUser, templateRoutes);
app.use("/api/submissions", authenticateUser, submissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/user-models", userModelRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", authenticateUser, documentRoutes);
app.use("/api/scanner", authenticateUser, scannerRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    
    // Don't leak error details in production
    if (isProduction) {
      res.status(500).json({ error: "Internal server error" });
    } else {
      res.status(500).json({ 
        error: "Internal server error",
        message: err.message,
        stack: err.stack,
      });
    }
  },
);

async function initializeServer() {
  try {
    await seedTemplates();
    await seedUserModels();
  } catch (error) {
    console.error("Error during initialization:", error);
  }
}

// Start server
const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  console.log(`🏥 Health check: http://localhost:${PORT}/health`);
  console.log(`🔧 Environment: ${isProduction ? "production" : "development"}`);

  // Initialize after server starts
  await initializeServer();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully");
  server.close(() => {
    console.log("Server closed");
    process.exit(0);
  });
});
