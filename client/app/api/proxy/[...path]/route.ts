import { auth } from '@clerk/nextjs/server';
import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, 'GET');
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, 'POST');
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, 'PATCH');
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ path: string[] }> | { path: string[] } }
) {
  const params = await Promise.resolve(context.params);
  return handleRequest(request, params, 'DELETE');
}

async function handleRequest(
  request: NextRequest,
  params: { path: string[] },
  method: string
) {
  try {
    const authResult = await auth();

    if (!authResult.userId) {
      console.error('Proxy: No user ID found');
      return NextResponse.json(
        { error: 'Unauthorized: No user session' },
        { status: 401 }
      );
    }

    const { getToken } = authResult;
    const token = await getToken();

    if (!token) {
      console.error('Proxy: No token obtained from Clerk');
      return NextResponse.json(
        { error: 'Unauthorized: No token available' },
        { status: 401 }
      );
    }

    // Garantir que params.path existe e é um array
    if (!params || !params.path || !Array.isArray(params.path)) {
      console.error('Proxy: Invalid params.path:', params);
      return NextResponse.json(
        { error: 'Invalid request path' },
        { status: 400 }
      );
    }

    const path = params.path.join('/');
    const url = new URL(request.url);
    const queryString = url.search;

    const backendUrl = `${BACKEND_URL}/api/${path}${queryString}`;

    const body =
      method !== 'GET' && method !== 'DELETE'
        ? await request.text()
        : undefined;

    console.log(`Proxy: ${method} ${backendUrl}`);

    const response = await fetch(backendUrl, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body,
    });

    // Verificar Content-Type antes de tentar fazer parse
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    let data: any;
    
    try {
      if (isJson) {
        data = await response.json();
      } else {
        // Se não for JSON, ler como texto e criar objeto de erro
        const text = await response.text();
        data = { error: text || `HTTP ${response.status}: ${response.statusText}` };
      }
    } catch (parseError) {
      // Se falhar ao fazer parse, criar objeto de erro
      console.error('Proxy: Failed to parse response:', parseError);
      data = { 
        error: `Failed to parse response: ${response.status} ${response.statusText}` 
      };
    }

    if (!response.ok) {
      console.error(`Proxy: Backend error ${response.status}:`, data);
      
      // Se for rate limiting, incluir informação de retry
      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After');
        if (retryAfter) {
          data.retryAfter = retryAfter;
          data.error = `Muitas requisições. Tente novamente em ${retryAfter} segundos.`;
        }
      }
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error: any) {
    console.error('Proxy error:', error);
    
    // Se o erro for de parsing JSON, retornar erro mais descritivo
    if (error.message?.includes('JSON') || error.message?.includes('Unexpected token')) {
      return NextResponse.json(
        { error: 'Resposta inválida do servidor. O servidor pode estar sobrecarregado.' },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
