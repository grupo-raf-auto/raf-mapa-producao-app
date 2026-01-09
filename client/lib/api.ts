import { getAuthHeadersServer } from './auth';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

// Helper para fazer requisições autenticadas em Server Components
async function fetchWithAuth(url: string, options: RequestInit = {}) {
  try {
    const headers = await getAuthHeadersServer();
    const res = await fetch(url, {
      ...options,
      headers: {
        ...headers,
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
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const url = `${API_URL}/api/questions${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(url);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/questions/${id}`);
    },
    create: async (data: any) => {
      return fetchWithAuth(`${API_URL}/api/questions`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`${API_URL}/api/questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/questions/${id}`, {
        method: 'DELETE',
      });
    },
  },
  categories: {
    getAll: async () => {
      return fetchWithAuth(`${API_URL}/api/categories`);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/categories/${id}`);
    },
    create: async (data: any) => {
      return fetchWithAuth(`${API_URL}/api/categories`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`${API_URL}/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
    },
  },
  templates: {
    getAll: async () => {
      return fetchWithAuth(`${API_URL}/api/templates`);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/templates/${id}`);
    },
    create: async (data: any) => {
      return fetchWithAuth(`${API_URL}/api/templates`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`${API_URL}/api/templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/templates/${id}`, {
        method: 'DELETE',
      });
    },
  },
  submissions: {
    getAll: async (params?: { templateId?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.templateId) queryParams.append('templateId', params.templateId);

      const url = `${API_URL}/api/submissions${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(url);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/submissions/${id}`);
    },
    create: async (data: { templateId: string; answers: { questionId: string; answer: string }[] }) => {
      return fetchWithAuth(`${API_URL}/api/submissions`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/submissions/${id}`, {
        method: 'DELETE',
      });
    },
    getStats: async (params?: { templateId?: string; detailed?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params?.templateId) queryParams.append('templateId', params.templateId);
      if (params?.detailed) queryParams.append('detailed', 'true');

      const url = `${API_URL}/api/submissions/stats${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(url);
    },
  },
  users: {
    getAll: async () => {
      return fetchWithAuth(`${API_URL}/api/users`);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/users/${id}`);
    },
    getCurrent: async () => {
      return fetchWithAuth(`${API_URL}/api/users/me`);
    },
    create: async (data: any) => {
      return fetchWithAuth(`${API_URL}/api/users`, {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`${API_URL}/api/users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`${API_URL}/api/users/${id}`, {
        method: 'DELETE',
      });
    },
  },
  chat: {
    sendMessage: async (message: string, conversationId?: string) => {
      return fetchWithAuth(`${API_URL}/api/chat/message`, {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      });
    },
    getConversation: async (conversationId: string) => {
      return fetchWithAuth(`${API_URL}/api/chat/conversation/${conversationId}`);
    },
  },
};
