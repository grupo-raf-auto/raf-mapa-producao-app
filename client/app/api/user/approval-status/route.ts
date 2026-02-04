import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { prisma } from '@/lib/db';

/**
 * GET /api/user/approval-status
 * Retorna o estado detalhado de verificação de email e aprovação admin.
 * Usado na página /approval-status para mostrar mensagem e auto-refresh.
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
        emailVerified: true,
        status: true,
        approvedAt: true,
        rejectedAt: true,
        rejectionReason: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: 'Utilizador não encontrado' },
        { status: 404 },
      );
    }

    return NextResponse.json({
      emailVerified: user.emailVerified,
      approvalStatus: user.status,
      approvedAt: user.approvedAt?.toISOString() ?? null,
      rejectedAt: user.rejectedAt?.toISOString() ?? null,
      rejectionReason: user.rejectionReason ?? null,
      createdAt: user.createdAt.toISOString(),
    });
  } catch (error) {
    console.error('[api/user/approval-status]', error);
    return NextResponse.json(
      { message: 'Erro ao obter estado de aprovação' },
      { status: 500 },
    );
  }
}
