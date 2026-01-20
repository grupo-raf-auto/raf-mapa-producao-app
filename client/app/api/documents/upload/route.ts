import { auth } from '@/lib/auth';
import { createAppToken } from '@/lib/jwt';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized: No user session' },
        { status: 401 }
      );
    }

    const token = createAppToken({
      sub: session.user.id,
      email: session.user.email,
      name: session.user.name,
    });

    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'Ficheiro não fornecido' },
        { status: 400 }
      );
    }

    const backendFormData = new FormData();
    backendFormData.append('file', file);

    const response = await fetch(`${BACKEND_URL}/api/documents/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: backendFormData,
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: unknown) {
    console.error('Upload error:', error);
    const msg = error instanceof Error ? error.message : 'Erro ao fazer upload do documento';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
