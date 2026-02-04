import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';
import { UserRole, UserApprovalStatus } from '../constants';

export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'admin' | 'user';
  _id: string; // alias de id para compatibilidade

  // NEW: Contexto de modelo
  activeModelId?: string;
  activeModelType?: string;
  availableModels?: Array<{
    id: string;
    modelType: string;
    isActive: boolean;
  }>;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Validação de segurança: JWT_SECRET é obrigatório em produção
const JWT_SECRET = process.env.JWT_SECRET;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

if (!JWT_SECRET) {
  if (IS_PRODUCTION) {
    console.error(
      'FATAL: JWT_SECRET must be defined in production environment',
    );
    process.exit(1);
  } else {
    console.warn(
      '⚠️  WARNING: JWT_SECRET not defined. Using insecure default for development only.',
    );
  }
}

const EFFECTIVE_JWT_SECRET = JWT_SECRET || 'dev-secret-change-in-production';

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;
    const modelHeader = req.headers['x-active-model'] as string | undefined;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.slice(7);

    let decoded: {
      sub: string;
      email?: string;
      name?: string | null;
      activeModelId?: string;
      activeModelType?: string;
    };
    try {
      decoded = jwt.verify(token, EFFECTIVE_JWT_SECRET) as typeof decoded;
    } catch {
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (!decoded?.sub) {
      return res
        .status(401)
        .json({ error: 'Unauthorized: Invalid token payload' });
    }

    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        status: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: 'Unauthorized: User not found' });
    }

    if (!user.isActive) {
      return res
        .status(403)
        .json({ error: 'Forbidden: User account is inactive' });
    }

    // Permitir utilizadores pendentes apenas em GET/POST "my-models" (seleção de modelos antes da aprovação)
    const isMyModelsSelf =
      (req.method === 'GET' || req.method === 'POST') &&
      typeof req.originalUrl === 'string' &&
      req.originalUrl.includes('/user-models/my-models') &&
      !req.originalUrl.includes('/user/');

    const canAccess =
      user.role === UserRole.admin ||
      user.status === UserApprovalStatus.approved ||
      (user.status === UserApprovalStatus.pending && isMyModelsSelf);

    if (!canAccess) {
      return res.status(403).json({
        error:
          'Forbidden: Conta pendente de aprovação ou rejeitada. Contacte o administrador.',
      });
    }

    const role = (
      user.role === UserRole.admin ? UserRole.admin : UserRole.user
    ) as 'admin' | 'user';

    // NEW: Load user's models
    const userModels = await prisma.userModel.findMany({
      where: { userId: user.id, isActive: true },
      select: {
        id: true,
        modelType: true,
        isActive: true,
      },
    });

    // Determine active model
    let activeModel = userModels.find((m) => m.id === modelHeader);
    if (!activeModel && userModels.length > 0) {
      activeModel = userModels[0]; // Default to first
    }

    req.user = {
      id: user.id,
      _id: user.id,
      email: user.email,
      name: user.name,
      role,
      activeModelId: activeModel?.id,
      activeModelType: activeModel?.modelType,
      availableModels: userModels,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res
      .status(500)
      .json({ error: 'Internal server error during authentication' });
  }
}
