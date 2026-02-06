// API helpers para Client Components
// Usa API route proxy do Next.js que lida com autenticação

const API_PROXY = '/api/proxy';

// Simple in-memory cache with TTL
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 30000; // 30 seconds

// Listen for model switch events and clear cache
if (typeof window !== 'undefined') {
  window.addEventListener('model-switched', () => {
    console.log('[API Client] Model switched - clearing cache');
    cache.clear();
  });
}

function getCacheKey(path: string, options?: RequestInit): string {
  return `${path}-${JSON.stringify(options?.body || '')}`;
}

function getCachedData(key: string): any | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  if (cached) {
    cache.delete(key);
  }
  return null;
}

function setCachedData(key: string, data: any): void {
  cache.set(key, { data, timestamp: Date.now() });
}

function invalidateCache(pathPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) {
      cache.delete(key);
    }
  }
}

// Export for external use
export function clearStatsCache(): void {
  invalidateCache('submissions/stats');
}

// Helper para verificar se o erro indica que o utilizador não foi encontrado ou não está autenticado
function isUnauthorizedError(errorMessage: string, status: number): boolean {
  const lowerMessage = errorMessage.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('no user session') ||
    lowerMessage.includes('user not found') ||
    lowerMessage.includes('not authenticated') ||
    lowerMessage.includes('invalid token')
  );
}

// Helper para fazer requisições autenticadas em Client Components
// Usa a API route proxy que adiciona o token automaticamente
async function fetchWithAuth(path: string, options: RequestInit = {}) {
  const method = options.method || 'GET';
  const cacheKey = getCacheKey(path, options);
  const skipCache = path === 'users/stats' || path === 'notifications'; // Admin stats e notificações: sempre dados frescos

  // Use cache for GET requests (exceto users/stats)
  if (method === 'GET' && !skipCache) {
    const cachedData = getCachedData(cacheKey);
    if (cachedData) {
      return cachedData;
    }
  }

  const url = `${API_PROXY}/${path}`;
  const res = await fetch(url, {
    ...options,
    credentials: 'include',
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
        errorMessage =
          error.error ||
          error.message ||
          `HTTP ${res.status}: ${res.statusText}`;
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

    // Se o erro indicar que o utilizador não foi encontrado ou não está autenticado, redirecionar para login
    if (isUnauthorizedError(errorMessage, res.status)) {
      // Limpar cache antes de redirecionar
      cache.clear();
      window.location.href = '/sign-in';
      // Lançar erro para interromper a execução
      throw new Error('Redirecting to login');
    }

    throw new Error(errorMessage);
  }

  // Verificar Content-Type antes de fazer parse da resposta de sucesso
  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');

  let result;
  if (isJson) {
    try {
      result = await res.json();
    } catch (parseError) {
      // Se falhar ao fazer parse, tentar ler como texto
      const text = await res.text();
      throw new Error(`Resposta inválida do servidor: ${text}`);
    }
  } else {
    // Se não for JSON, retornar como texto
    result = await res.text();
  }

  // Unwrap API response if it has the { success: true, data: ... } format
  if (
    result &&
    typeof result === 'object' &&
    'success' in result &&
    'data' in result
  ) {
    result = result.data;
  }

  // Unwrap paginated response if it has { items: [...], total, ... } format
  // This normalizes the response so consumers always get arrays for list endpoints
  if (
    result &&
    typeof result === 'object' &&
    'items' in result &&
    Array.isArray(result.items)
  ) {
    result = result.items;
  }

  // Cache successful GET responses
  if (method === 'GET') {
    setCachedData(cacheKey, result);
  }

  return result;
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
      const result = await fetchWithAuth('questions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      invalidateCache('questions');
      return result;
    },
    update: async (id: string, data: any) => {
      const result = await fetchWithAuth(`questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      invalidateCache('questions');
      return result;
    },
    delete: async (id: string) => {
      const result = await fetchWithAuth(`questions/${id}`, {
        method: 'DELETE',
      });
      invalidateCache('questions');
      return result;
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
      const result = await fetchWithAuth('categories', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      invalidateCache('categories');
      return result;
    },
    update: async (id: string, data: any) => {
      const result = await fetchWithAuth(`categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      invalidateCache('categories');
      return result;
    },
    delete: async (id: string) => {
      const result = await fetchWithAuth(`categories/${id}`, {
        method: 'DELETE',
      });
      invalidateCache('categories');
      return result;
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
      const result = await fetchWithAuth('templates', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      invalidateCache('templates');
      return result;
    },
    update: async (id: string, data: any) => {
      const result = await fetchWithAuth(`templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      invalidateCache('templates');
      return result;
    },
    delete: async (id: string) => {
      const result = await fetchWithAuth(`templates/${id}`, {
        method: 'DELETE',
      });
      invalidateCache('templates');
      return result;
    },
  },
  submissions: {
    getAll: async (params?: {
      templateId?: string;
      scope?: 'all' | 'personal';
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.templateId)
        queryParams.append('templateId', params.templateId);
      if (params?.scope) queryParams.append('scope', params.scope);

      const path = `submissions${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(path);
    },
    getById: async (id: string) => {
      return fetchWithAuth(`submissions/${id}`);
    },
    create: async (data: {
      templateId: string;
      answers: { questionId: string; answer: string }[];
    }) => {
      const result = await fetchWithAuth('submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      invalidateCache('submissions');
      return result;
    },
    update: async (
      id: string,
      data: {
        answers?: { questionId: string; answer: string }[];
        commissionPaid?: boolean;
      },
    ) => {
      const result = await fetchWithAuth(`submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      invalidateCache('submissions');
      return result;
    },
    delete: async (id: string) => {
      const result = await fetchWithAuth(`submissions/${id}`, {
        method: 'DELETE',
      });
      invalidateCache('submissions');
      return result;
    },
    getStats: async (params?: {
      templateId?: string;
      detailed?: boolean;
      scope?: 'personal' | 'all';
      granularity?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    }) => {
      const queryParams = new URLSearchParams();
      if (params?.templateId)
        queryParams.append('templateId', params.templateId);
      if (params?.detailed) queryParams.append('detailed', 'true');
      if (params?.scope) queryParams.append('scope', params.scope);
      if (params?.granularity)
        queryParams.append('granularity', params.granularity);

      const path = `submissions/stats${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(path);
    },
    getYearlyStats: async (params?: { templateId?: string }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('period', 'yearly');
      if (params?.templateId)
        queryParams.append('templateId', params.templateId);

      const path = `submissions/stats${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(path);
    },
    getMonthlyStats: async (params?: { templateId?: string }) => {
      const queryParams = new URLSearchParams();
      queryParams.append('period', 'monthly');
      if (params?.templateId)
        queryParams.append('templateId', params.templateId);

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
      const result = await fetchWithAuth('users', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      invalidateCache('users');
      return result;
    },
    update: async (id: string, data: any) => {
      const result = await fetchWithAuth(`users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      invalidateCache('users');
      return result;
    },
    delete: async (id: string) => {
      const result = await fetchWithAuth(`users/${id}`, {
        method: 'DELETE',
      });
      invalidateCache('users');
      return result;
    },
    approve: async (id: string) => {
      const result = await fetchWithAuth(`users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      });
      invalidateCache('users');
      return result;
    },
    reject: async (id: string, reason: string) => {
      const result = await fetchWithAuth(`users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: reason?.trim().slice(0, 500) || null,
        }),
      });
      invalidateCache('users');
      return result;
    },
  },
  chat: {
    sendMessage: async (
      message: string,
      conversationId?: string,
      context?: 'sabichao' | 'support',
    ) => {
      return fetchWithAuth('chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId, context }),
      });
    },
    getConversation: async (conversationId: string) => {
      return fetchWithAuth(`chat/conversation/${conversationId}`);
    },
  },
  documents: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Erro ao fazer upload');
      }

      return res.json();
    },
    getAll: async () => {
      return fetchWithAuth('documents');
    },
    getById: async (id: string) => {
      return fetchWithAuth(`documents/${id}`);
    },
    delete: async (id: string) => {
      const result = await fetchWithAuth(`documents/${id}`, {
        method: 'DELETE',
      });
      invalidateCache('documents');
      return result;
    },
  },
  // NEW: User Models management
  userModels: {
    getMyModels: async () => {
      const raw = await fetchWithAuth('user-models/my-models');
      // Ensure we always return an array (backend may return { success, data: [] })
      if (Array.isArray(raw)) return raw;
      if (
        raw &&
        typeof raw === 'object' &&
        'data' in raw &&
        Array.isArray((raw as { data: unknown }).data)
      ) {
        return (raw as { data: unknown[] }).data;
      }
      return [];
    },
    addModelToMyUser: async (modelType: string) => {
      const result = await fetchWithAuth('user-models/my-models', {
        method: 'POST',
        body: JSON.stringify({ modelType }),
      });
      invalidateCache('user-models');
      return result;
    },
    switchModel: async (modelId: string) => {
      const result = await fetchWithAuth(
        `user-models/switch-model/${modelId}`,
        {
          method: 'POST',
        },
      );
      invalidateCache('user-models');
      return result;
    },
    getUserModels: async (userId: string) => {
      return fetchWithAuth(`user-models/user/${userId}/models`);
    },
    addModelToUser: async (userId: string, modelType: string) => {
      const result = await fetchWithAuth(`user-models/user/${userId}/models`, {
        method: 'POST',
        body: JSON.stringify({ modelType }),
      });
      invalidateCache('user-models');
      return result;
    },
    removeModelFromUser: async (userId: string, modelId: string) => {
      const result = await fetchWithAuth(
        `user-models/user/${userId}/models/${modelId}`,
        {
          method: 'DELETE',
        },
      );
      invalidateCache('user-models');
      return result;
    },
    toggleModelStatus: async (userId: string, modelId: string) => {
      const result = await fetchWithAuth(
        `user-models/user/${userId}/models/${modelId}/toggle`,
        {
          method: 'PATCH',
        },
      );
      invalidateCache('user-models');
      return result;
    },
  },
  tickets: {
    create: async (data: { title: string; description: string }) => {
      const result = await fetchWithAuth('tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      invalidateCache('notifications');
      return result;
    },
    getAll: async (params?: { status?: string; unreadOnly?: boolean }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.unreadOnly) queryParams.append('unreadOnly', 'true');
      const path = `tickets${queryParams.toString() ? `?${queryParams}` : ''}`;
      return fetchWithAuth(path);
    },
    getById: async (id: string) => fetchWithAuth(`tickets/${id}`),
    update: async (
      id: string,
      data: { readAt?: boolean; status?: 'open' | 'in_progress' | 'resolved' },
    ) => {
      const result = await fetchWithAuth(`tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      invalidateCache('tickets');
      invalidateCache('notifications');
      return result;
    },
  },
  notifications: {
    get: async () => fetchWithAuth('notifications'),
  },
};
