// API helpers para Client Components
// Usa API route proxy do Next.js que lida com autenticação

const API_PROXY = '/api/proxy';

// Helper para fazer requisições autenticadas em Client Components
// Usa a API route proxy que adiciona o token automaticamente
async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const url = `${API_PROXY}/${path}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
}

export const apiClient = {
  questions: {
    getAll: async (params?: { status?: string; search?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const path = `questions${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(path);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`questions/${id}`);
    },
    create: async (data: any) => {
      return fetchWithAuth('questions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`questions/${id}`, {
        method: 'DELETE',
      });
    },
  },
  categories: {
    getAll: async () => {
      return fetchWithAuth('categories');
    },
    getById: async (id: string) => {
      return fetchWithAuth(`categories/${id}`);
    },
    create: async (data: any) => {
      return fetchWithAuth('categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`categories/${id}`, {
        method: 'DELETE',
      });
    },
  },
  templates: {
    getAll: async () => {
      return fetchWithAuth('templates');
    },
    getById: async (id: string) => {
      return fetchWithAuth(`templates/${id}`);
    },
    create: async (data: any) => {
      return fetchWithAuth('templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`templates/${id}`, {
        method: 'DELETE',
      });
    },
  },
  submissions: {
    getAll: async (params?: { templateId?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.templateId) queryParams.append('templateId', params.templateId);

      const path = `submissions${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(path);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`submissions/${id}`);
    },
    create: async (data: { templateId: string; answers: { questionId: string; answer: string }[] }) => {
      return fetchWithAuth('submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: { answers: { questionId: string; answer: string }[] }) => {
      return fetchWithAuth(`submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`submissions/${id}`, {
        method: 'DELETE',
      });
    },
    getStats: async (params?: { templateId?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.templateId) queryParams.append('templateId', params.templateId);

      const path = `submissions/stats${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(path);
    },
  },
  users: {
    getAll: async () => {
      return fetchWithAuth('users');
    },
    getStats: async () => {
      return fetchWithAuth('users/stats');
    },
    getById: async (id: string) => {
      return fetchWithAuth(`users/${id}`);
    },
    getCurrent: async () => {
      return fetchWithAuth('users/me');
    },
    create: async (data: any) => {
      return fetchWithAuth('users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, data: any) => {
      return fetchWithAuth(`users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
    },
    delete: async (id: string) => {
      return fetchWithAuth(`users/${id}`, {
        method: 'DELETE',
      });
    },
  },
  chat: {
    sendMessage: async (message: string, conversationId?: string) => {
      return fetchWithAuth('chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId }),
      });
    },
    getConversation: async (conversationId: string) => {
      return fetchWithAuth(`chat/conversation/${conversationId}`);
    },
  },
};
