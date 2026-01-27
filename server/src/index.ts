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
import questionRoutes from "./routes/question.routes";
import categoryRoutes from "./routes/category.routes";
import templateRoutes from "./routes/template.routes";
import submissionRoutes from "./routes/submission.routes";
import userRoutes from "./routes/user.routes";
import chatRoutes from "./routes/chat.routes";
import documentRoutes from "./routes/document.routes";
import scannerRoutes from "./routes/documentScanner.routes";
import { seedTemplates } from "./scripts/seed-templates";
import { authenticateUser } from "./middleware/auth.middleware";

const app = express();
const PORT = process.env.PORT || 3005;

// Trust proxy (required for X-Forwarded-For header from Next.js rewrites)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: "Too many requests from this IP, please try again later.",
});
app.use("/api/", limiter);

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3004",
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Server is running" });
});

// API Routes (protegidas)
app.use("/api/questions", authenticateUser, questionRoutes);
app.use("/api/categories", authenticateUser, categoryRoutes);
app.use("/api/templates", authenticateUser, templateRoutes);
app.use("/api/submissions", authenticateUser, submissionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/chat", chatRoutes);
app.use("/api/documents", authenticateUser, documentRoutes);
app.use("/api/scanner", authenticateUser, scannerRoutes);

// Error handling middleware
app.use(
  (
    err: Error,
    req: express.Request,
    res: express.Response,
    next: express.NextFunction,
  ) => {
    console.error("Error:", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

async function initializeServer() {
  try {
    await seedTemplates();
  } catch (error) {
    console.error("Error seeding templates:", error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);

  // Initialize after server starts
  await initializeServer();
});
