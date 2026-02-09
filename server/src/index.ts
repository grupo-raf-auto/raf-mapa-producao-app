import path from 'path';
import dotenv from 'dotenv';

// Load .env: raiz do projeto e depois server/
const root = path.resolve(process.cwd(), '..');
dotenv.config({ path: path.join(root, '.env') });
dotenv.config({ path: path.join(root, '.env.local') });
dotenv.config({ path: path.join(process.cwd(), '.env') });
dotenv.config({ path: path.join(process.cwd(), '.env.local') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import compression from 'compression';
import questionRoutes from './routes/question.routes';
import categoryRoutes from './routes/category.routes';
import templateRoutes from './routes/template.routes';
import submissionRoutes from './routes/submission.routes';
import userRoutes from './routes/user.routes';
import userInfoRoutes from './routes/user-info.routes';
import userModelRoutes from './routes/user-model.routes';
import chatRoutes from './routes/chat.routes';
import documentRoutes from './routes/document.routes';
import scannerRoutes from './routes/documentScanner.routes';
import ticketRoutes from './routes/ticket.routes';
import notificationsRoutes from './routes/notifications.routes';
import { seedUserModels } from './scripts/seed-user-models';
import { authenticateUser } from './middleware/auth.middleware';

const PORT = process.env.PORT || 3005;
const isProduction = process.env.NODE_ENV === 'production';

async function main() {
  const app = express();

  app.set('trust proxy', 1);

  app.use(
    helmet({
      contentSecurityPolicy: isProduction
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: ["'self'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", 'data:', 'blob:'],
              connectSrc: ["'self'", process.env.CLIENT_URL || 'http://localhost:3004'],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              frameAncestors: ["'none'"],
            },
          }
        : false,
      crossOriginEmbedderPolicy: false,
    }),
  );

  app.use(compression());

  const RATE_LIMIT_WINDOW_MS = parseInt(
    process.env.RATE_LIMIT_WINDOW_MS || '900000',
  );
  const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || '10000');
  const SKIP_RATE_LIMIT = !isProduction && process.env.SKIP_RATE_LIMIT === 'true';

  if (!SKIP_RATE_LIMIT) {
    const limiter = rateLimit({
      windowMs: RATE_LIMIT_WINDOW_MS,
      max: RATE_LIMIT_MAX,
      message: {
        error: 'Too many requests',
        retryAfter: Math.ceil(RATE_LIMIT_WINDOW_MS / 1000),
      },
      standardHeaders: true,
      legacyHeaders: false,
      skip: (req) => req.path === '/health',
    });
    app.use('/api/', limiter);
    console.log(
      `🔒 Rate limiting: ${RATE_LIMIT_MAX} requests per ${RATE_LIMIT_WINDOW_MS / 1000}s`,
    );
  } else {
    console.log('⚠️ Rate limiting DISABLED');
  }

  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3004',
      credentials: true,
    }),
  );

  // Better Auth must be mounted BEFORE express.json() (see better-auth Express docs)
  const { toNodeHandler } = await import('better-auth/node');
  const { auth } = await import('./auth');
  const authHandler = toNodeHandler(auth);

  app.get('/api/auth/allowed-email-domain', (_req, res) => {
    const domain = process.env.ALLOWED_EMAIL_DOMAIN || null;
    res.json({ allowedEmailDomain: domain });
  });
  app.use('/api/auth', authHandler as express.RequestHandler);

  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  app.use((_req, res, next) => {
    res.setTimeout(30000, () => {
      res.status(408).json({ error: 'Request timeout' });
    });
    next();
  });

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'Server is running',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    });
  });

  app.use('/api/user', userInfoRoutes);

  app.use('/api/questions', authenticateUser, questionRoutes);
  app.use('/api/categories', authenticateUser, categoryRoutes);
  app.use('/api/templates', authenticateUser, templateRoutes);
  app.use('/api/submissions', authenticateUser, submissionRoutes);
  app.use('/api/users', userRoutes);
  app.use('/api/user-models', userModelRoutes);
  app.use('/api/chat', chatRoutes);
  app.use('/api/documents', authenticateUser, documentRoutes);
  app.use('/api/scanner', authenticateUser, scannerRoutes);
  app.use('/api/tickets', authenticateUser, ticketRoutes);
  app.use('/api/notifications', authenticateUser, notificationsRoutes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });

  app.use(
    (
      err: Error,
      _req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error('Error:', err);
      if (isProduction) {
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.status(500).json({
          error: 'Internal server error',
          message: err.message,
          stack: err.stack,
        });
      }
    },
  );

  const server = app.listen(PORT, async () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API at http://localhost:${PORT}/api`);
    console.log(`🔐 Auth at http://localhost:${PORT}/api/auth`);
    console.log(`🏥 Health: http://localhost:${PORT}/health`);
    console.log(`🔧 Env: ${isProduction ? 'production' : 'development'}`);

    try {
      await seedUserModels();
    } catch (error) {
      console.error('Init error:', error);
    }
  });

  process.on('SIGTERM', () => {
    console.log('SIGTERM received, shutting down');
    server.close(() => process.exit(0));
  });
  process.on('SIGINT', () => {
    console.log('SIGINT received, shutting down');
    server.close(() => process.exit(0));
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
