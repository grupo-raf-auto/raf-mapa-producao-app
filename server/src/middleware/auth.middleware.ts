import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '@clerk/backend';
import { UserModel } from '../models/user.model';
import { User } from '../types';

// Estender o tipo Request para incluir user
declare global {
  namespace Express {
    interface Request {
      user?: User & { _id: string };
    }
  }
}

export async function authenticateUser(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    // Obter token do header Authorization
    const authHeader = req.headers.authorization;
    
    // Debug: log headers (sem o token completo por segurança)
    console.log('Auth middleware: Authorization header present:', !!authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('Auth middleware: No valid Authorization header');
      return res.status(401).json({ error: 'Unauthorized: No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '
    console.log('Auth middleware: Token received, length:', token.length);

    // Verificar token com Clerk
    const secretKey = process.env.CLERK_SECRET_KEY;
    if (!secretKey) {
      console.error('Auth middleware: CLERK_SECRET_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    let clerkUser;
    
    try {
      clerkUser = await verifyToken(token, { secretKey });
      console.log('Auth middleware: Token verified, user ID:', clerkUser.sub);
    } catch (error: any) {
      console.error('Auth middleware: Token verification failed:', error.message);
      return res.status(401).json({ error: 'Unauthorized: Invalid token' });
    }

    if (!clerkUser || !clerkUser.sub) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token payload' });
    }

    // Buscar ou criar usuário no MongoDB
    // Usar findOneAndUpdate com upsert para evitar race conditions
    let user = await UserModel.findByClerkId(clerkUser.sub);

    if (!user) {
      // Criar usuário se não existir (primeiro login)
      // Usar operação atômica para evitar duplicatas
      const email = clerkUser.email || clerkUser.primaryEmailAddress?.emailAddress || '';
      const firstName = clerkUser.firstName || '';
      const lastName = clerkUser.lastName || '';

      // Lista de emails que devem ser admin automaticamente
      const adminEmails = ['tiagosousa.tams@hotmail.com'];
      
      // Por padrão, primeiro usuário é admin, outros são user
      // Mas se o email estiver na lista de adminEmails, sempre será admin
      const existingUsers = await UserModel.findAll();
      const isFirstUser = existingUsers.length === 0;
      const isAdminEmail = adminEmails.includes(email.toLowerCase());
      const role = isFirstUser || isAdminEmail ? 'admin' : 'user';

      try {
        // Tentar criar com verificação dupla para evitar race condition
        // Verificar novamente antes de criar
        const doubleCheck = await UserModel.findByClerkId(clerkUser.sub);
        if (doubleCheck) {
          user = doubleCheck;
        } else {
          const userId = await UserModel.create({
            clerkId: clerkUser.sub,
            email,
            firstName,
            lastName,
            role,
            isActive: true,
          });

          user = await UserModel.findById(userId);
        }
      } catch (error: any) {
        // Se falhar (possível duplicata), buscar novamente
        console.log('Auth middleware: Possible duplicate user creation, fetching existing user');
        user = await UserModel.findByClerkId(clerkUser.sub);
        
        // Se ainda não existir, lançar erro
        if (!user) {
          throw new Error('Failed to create or find user');
        }
      }
    } else {
      // Atualizar role se o email estiver na lista de adminEmails
      const adminEmails = ['tiagosousa.tams@hotmail.com'];
      const email = clerkUser.email || clerkUser.primaryEmailAddress?.emailAddress || '';
      
      if (adminEmails.includes(email.toLowerCase()) && user.role !== 'admin') {
        await UserModel.updateByClerkId(clerkUser.sub, { role: 'admin' });
        user = await UserModel.findByClerkId(clerkUser.sub);
      }
      
      if (!user.isActive) {
        return res.status(403).json({ error: 'Forbidden: User account is inactive' });
      }
    }

    // Adicionar usuário ao request
    req.user = user as User & { _id: string };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication' });
  }
}
