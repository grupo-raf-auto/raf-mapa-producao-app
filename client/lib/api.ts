import { headers } from 'next/headers';

const APP_URL = process.env.NEXTAUTH_URL || process.env.CLIENT_URL || 'http://localhost:3004';

// Helper para fazer requisições autenticadas em Server Components
// Usa o proxy /api/proxy e reenvia o Cookie para o Better Auth obter a sessão
async function fetchWithAuth(path: string, options: RequestInit = {}) {
  try {
    const h = await headers();
    const cookie = h.get('cookie') || '';
    const url = `${APP_URL}/api/proxy/${path}`;
    const res = await fetch(url, {
      ...options,
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
        Cookie: cookie,
        ...options.headers,
      },
    });
    
    if (!res.ok) {
      let errorMessage = 'Request failed';
      
      // Verificar Content-Type antes de tentar fazer parse
      const contentType = res.headers.get('content-type');
      const isJson = contentType?.includes('application/json');
      
      try {
        if (isJson) {
          const error = await res.json();
          errorMessage = error.error || error.message || `HTTP ${res.status}: ${res.statusText}`;
        } else {
          // Se não for JSON, ler como texto
          const text = await res.text();
          errorMessage = text || `HTTP ${res.status}: ${res.statusText}`;
        }
      } catch (parseError) {
        // Se falhar ao fazer parse, usar status e statusText
        errorMessage = `HTTP ${res.status}: ${res.statusText}`;
      }
      
      // Tratamento especial para 429 (Too Many Requests)
      if (res.status === 429) {
        const retryAfter = res.headers.get('Retry-After');
        const retryMessage = retryAfter 
          ? `Muitas requisições. Tente novamente em ${retryAfter} segundos.`
          : 'Muitas requisições. Por favor, aguarde um momento e tente novamente.';
        throw new Error(retryMessage);
      }
      
      throw new Error(errorMessage);
    }
    
    // Verificar Content-Type antes de fazer parse da resposta de sucesso
    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    
    if (isJson) {
      try {
        return await res.json();
      } catch (parseError) {
        // Se falhar ao fazer parse, tentar ler como texto
        const text = await res.text();
        throw new Error(`Resposta inválida do servidor: ${text}`);
      }
    } else {
      // Se não for JSON, retornar como texto
      return await res.text();
    }
  } catch (error) {
    // Re-throw with more context if it's not already an Error
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Network error: ${String(error)}`);
  }
}

export const api = {
  questions: {
    getAll: async (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      const path = `questions${q.toString() ? `?${q}` : ''}`;
      return fetchWithAuth(path);
    },
    getById: async (id: string) => fetchWithAuth(`questions/${id}`),
    create: async (data: any) => fetchWithAuth('questions', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => fetchWithAuth(`questions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchWithAuth(`questions/${id}`, { method: 'DELETE' }),
  },
  categories: {
    getAll: async () => fetchWithAuth('categories'),
    getById: async (id: string) => fetchWithAuth(`categories/${id}`),
    create: async (data: any) => fetchWithAuth('categories', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => fetchWithAuth(`categories/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchWithAuth(`categories/${id}`, { method: 'DELETE' }),
  },
  templates: {
    getAll: async () => fetchWithAuth('templates'),
    getById: async (id: string) => fetchWithAuth(`templates/${id}`),
    create: async (data: any) => fetchWithAuth('templates', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => fetchWithAuth(`templates/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchWithAuth(`templates/${id}`, { method: 'DELETE' }),
  },
  submissions: {
    getAll: async (params?: { templateId?: string }) => {
      const q = new URLSearchParams();
      if (params?.templateId) q.append('templateId', params.templateId);
      return fetchWithAuth(`submissions${q.toString() ? `?${q}` : ''}`);
    },
    getById: async (id: string) => fetchWithAuth(`submissions/${id}`),
    create: async (data: { templateId: string; answers: { questionId: string; answer: string }[] }) =>
      fetchWithAuth('submissions', { method: 'POST', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchWithAuth(`submissions/${id}`, { method: 'DELETE' }),
    getStats: async (params?: { templateId?: string; detailed?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.templateId) q.append('templateId', params.templateId);
      if (params?.detailed) q.append('detailed', 'true');
      return fetchWithAuth(`submissions/stats${q.toString() ? `?${q}` : ''}`);
    },
  },
  users: {
    getAll: async () => fetchWithAuth('users'),
    getById: async (id: string) => fetchWithAuth(`users/${id}`),
    getCurrent: async () => fetchWithAuth('users/me'),
    create: async (data: any) => fetchWithAuth('users', { method: 'POST', body: JSON.stringify(data) }),
    update: async (id: string, data: any) => fetchWithAuth(`users/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: async (id: string) => fetchWithAuth(`users/${id}`, { method: 'DELETE' }),
  },
  chat: {
    sendMessage: async (message: string, conversationId?: string) =>
      fetchWithAuth('chat/message', { method: 'POST', body: JSON.stringify({ message, conversationId }) }),
    getConversation: async (conversationId: string) => fetchWithAuth(`chat/conversation/${conversationId}`),
  },
};
