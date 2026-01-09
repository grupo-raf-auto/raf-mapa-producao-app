import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import questionRoutes from './routes/question.routes';
import categoryRoutes from './routes/category.routes';
import templateRoutes from './routes/template.routes';
import submissionRoutes from './routes/submission.routes';
import userRoutes from './routes/user.routes';
import chatRoutes from './routes/chat.routes';
import webhookRoutes from './routes/webhook.routes';
import { seedTemplates } from './scripts/seed-templates';
import { authenticateUser } from './middleware/auth.middleware';
import { UserModel } from './models/user.model';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api/', limiter);

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Webhook routes (sem autenticação normal, usa assinatura)
app.use('/api/webhooks', webhookRoutes);

// API Routes (protegidas)
app.use('/api/questions', authenticateUser, questionRoutes);
app.use('/api/categories', authenticateUser, categoryRoutes);
app.use('/api/templates', authenticateUser, templateRoutes);
app.use('/api/submissions', authenticateUser, submissionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/chat', chatRoutes);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database indexes and default templates on server start
async function initializeServer() {
  try {
    // Criar índices únicos para prevenir duplicatas
    await UserModel.createIndexes();
  } catch (error) {
    console.error('Error creating database indexes:', error);
  }

  try {
    // Initialize default templates
    await seedTemplates();
  } catch (error) {
    console.error('Error seeding templates:', error);
  }
}

// Start server
app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
  
  // Initialize after server starts
  await initializeServer();
});
