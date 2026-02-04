import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

/**
 * GET /api/user/role
 * Retorna role, status de aprovação e emailVerified do utilizador autenticado.
 * Usado pelo middleware e pelo frontend para redirecionar para verify-email ou approval-status.
 */
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user?.id) {
      return NextResponse.json({ message: 'Não autenticado' }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        role: true,
        status: true,
        emailVerified: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Utilizador não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      role: user.role,
      approvalStatus: user.status,
      emailVerified: user.emailVerified,
    });
  } catch (error) {
    console.error('[api/user/role]', error);
    return NextResponse.json(
      { message: 'Erro ao obter dados do utilizador' },
      { status: 500 },
    );
  }
}
