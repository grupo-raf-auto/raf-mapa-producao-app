import { Request, Response } from 'express';
import { Webhook } from 'svix';
import { UserModel } from '../models/user.model';
import { User } from '../types';

// Tipos do webhook do Clerk
interface ClerkWebhookEvent {
  data: {
    id: string;
    email_addresses: Array<{ email_address: string }>;
    first_name?: string;
    last_name?: string;
  };
  type: 'user.created' | 'user.updated' | 'user.deleted';
}

export class WebhookController {
  static async handleClerkWebhook(req: Request, res: Response) {
    try {
      const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;

      if (!WEBHOOK_SECRET) {
        console.error('CLERK_WEBHOOK_SECRET is not set');
        return res.status(500).json({ error: 'Webhook secret not configured' });
      }

      // Log para debug (sem expor dados sensíveis)
      console.log('Webhook: Received Clerk webhook event');

      // Obter headers
      const svix_id = req.headers['svix-id'] as string;
      const svix_timestamp = req.headers['svix-timestamp'] as string;
      const svix_signature = req.headers['svix-signature'] as string;

      if (!svix_id || !svix_timestamp || !svix_signature) {
        return res.status(400).json({ error: 'Missing svix headers' });
      }

      // Obter body
      const body = JSON.stringify(req.body);

      // Criar webhook
      const wh = new Webhook(WEBHOOK_SECRET);

      let evt: ClerkWebhookEvent;

      try {
        evt = wh.verify(body, {
          'svix-id': svix_id,
          'svix-timestamp': svix_timestamp,
          'svix-signature': svix_signature,
        }) as ClerkWebhookEvent;
      } catch (err) {
        console.error('Webhook verification failed:', err);
        return res.status(400).json({ error: 'Webhook verification failed' });
      }

      // Processar evento
      const { type, data } = evt;
      const clerkId = data.id;
      const email = data.email_addresses[0]?.email_address || '';
      const firstName = data.first_name || '';
      const lastName = data.last_name || '';

      switch (type) {
        case 'user.created':
          // Verificar se já existe (com verificação dupla para evitar race condition)
          let existing = await UserModel.findByClerkId(clerkId);
          if (!existing) {
            // Verificar novamente antes de criar (double-check locking pattern)
            existing = await UserModel.findByClerkId(clerkId);
            
            if (!existing) {
              // Lista de emails que devem ser admin automaticamente
              const adminEmails = ['tiagosousa.tams@hotmail.com'];
              
              // Primeiro usuário é admin, outros são user
              // Mas se o email estiver na lista de adminEmails, sempre será admin
              const allUsers = await UserModel.findAll();
              const isFirstUser = allUsers.length === 0;
              const isAdminEmail = adminEmails.includes(email.toLowerCase());
              const role = isFirstUser || isAdminEmail ? 'admin' : 'user';

              try {
                await UserModel.create({
                  clerkId,
                  email,
                  firstName,
                  lastName,
                  role,
                  isActive: true,
                });
                console.log(`User created via webhook: ${email} (${clerkId})`);
              } catch (error: any) {
                // Se falhar (possível duplicata), verificar se foi criado por outro processo
                const checkAgain = await UserModel.findByClerkId(clerkId);
                if (checkAgain) {
                  console.log(`User already exists (created by another process): ${email} (${clerkId})`);
                } else {
                  console.error(`Failed to create user via webhook: ${error.message}`);
                  throw error;
                }
              }
            } else {
              console.log(`User already exists (double-check): ${email} (${clerkId})`);
            }
          } else {
            console.log(`User already exists: ${email} (${clerkId})`);
          }
          break;

        case 'user.updated':
          await UserModel.updateByClerkId(clerkId, {
            email,
            firstName,
            lastName,
          });
          console.log(`User updated: ${email} (${clerkId})`);
          break;

        case 'user.deleted':
          await UserModel.deleteByClerkId(clerkId);
          console.log(`User deactivated: ${clerkId}`);
          break;
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
}
