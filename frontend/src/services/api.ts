/**
 * API client for frontend – calls backend REST API.
 * With Vite dev proxy, /api is forwarded to the backend; credentials (cookies) are sent.
 */

const API_BASE = '/api';

const cache = new Map<string, { data: unknown; timestamp: number }>();
const CACHE_TTL = 30000;

if (typeof window !== 'undefined') {
  window.addEventListener('model-switched', () => {
    cache.clear();
  });
}

function getCacheKey(path: string, options?: RequestInit): string {
  return `${path}-${JSON.stringify(options?.body ?? '')}`;
}

function getCachedData(key: string): unknown | null {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) return cached.data;
  if (cached) cache.delete(key);
  return null;
}

function setCachedData(key: string, data: unknown): void {
  cache.set(key, { data, timestamp: Date.now() });
}

export function invalidateCache(pathPrefix: string): void {
  for (const key of cache.keys()) {
    if (key.startsWith(pathPrefix)) cache.delete(key);
  }
}

export function clearStatsCache(): void {
  invalidateCache('submissions/stats');
}

function getActiveModelId(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/activeModelId=([^;]+)/);
  return match ? decodeURIComponent(match[1]) : null;
}

function isUnauthorizedError(errorMessage: string, status: number): boolean {
  const lower = errorMessage.toLowerCase();
  return (
    status === 401 ||
    status === 403 ||
    lower.includes('unauthorized') ||
    lower.includes('no user session') ||
    lower.includes('user not found') ||
    lower.includes('not authenticated') ||
    lower.includes('invalid token')
  );
}

async function fetchWithAuth(
  path: string,
  options: RequestInit = {},
): Promise<unknown> {
  const method = (options.method || 'GET') as string;
  const cacheKey = getCacheKey(path, options);
  const skipCache = path === 'users/stats';

  if (method === 'GET' && !skipCache) {
    const cached = getCachedData(cacheKey);
    if (cached) return cached;
  }

  const url = `${API_BASE}/${path}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  const activeModelId = getActiveModelId();
  if (activeModelId) headers['x-active-model'] = activeModelId;

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  if (!res.ok) {
    const contentType = res.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    let errorMessage = 'Request failed';
    try {
      if (isJson) {
        const err = (await res.json()) as { error?: string; message?: string };
        errorMessage =
          err.error ?? err.message ?? `${res.status}: ${res.statusText}`;
      } else {
        errorMessage = (await res.text()) || `${res.status}: ${res.statusText}`;
      }
    } catch {
      errorMessage = `${res.status}: ${res.statusText}`;
    }
    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After');
      throw new Error(
        retryAfter
          ? `Muitas requisições. Tente novamente em ${retryAfter} segundos.`
          : 'Muitas requisições. Aguarde e tente novamente.',
      );
    }
    if (isUnauthorizedError(errorMessage, res.status)) {
      cache.clear();
      window.location.href = '/sign-in';
      throw new Error('Redirecting to login');
    }
    throw new Error(errorMessage);
  }

  const contentType = res.headers.get('content-type');
  const isJson = contentType?.includes('application/json');
  let result: unknown;
  if (isJson) {
    try {
      result = await res.json();
    } catch {
      const text = await res.text();
      throw new Error(`Resposta inválida: ${text}`);
    }
  } else {
    result = await res.text();
  }

  if (
    result &&
    typeof result === 'object' &&
    'success' in result &&
    'data' in result
  ) {
    result = (result as { data: unknown }).data;
  }
  if (
    result &&
    typeof result === 'object' &&
    'items' in result &&
    Array.isArray((result as { items: unknown[] }).items)
  ) {
    result = (result as { items: unknown[] }).items;
  }

  if (method === 'GET') setCachedData(cacheKey, result);
  return result;
}

export const apiClient = {
  questions: {
    getAll: async (params?: { status?: string; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.status) q.append('status', params.status);
      if (params?.search) q.append('search', params.search);
      return fetchWithAuth(`questions${q.toString() ? `?${q}` : ''}`);
    },
    getById: (id: string) => fetchWithAuth(`questions/${id}`),
    create: async (data: unknown) => {
      const result = await fetchWithAuth('questions', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      invalidateCache('questions');
      return result;
    },
    update: async (id: string, data: unknown) => {
      const result = await fetchWithAuth(`questions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      });
      invalidateCache('questions');
      return result;
    },
    delete: (id: string) =>
      fetchWithAuth(`questions/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('questions'),
      ),
  },
  categories: {
    getAll: () => fetchWithAuth('categories'),
    getById: (id: string) => fetchWithAuth(`categories/${id}`),
    create: (data: unknown) =>
      fetchWithAuth('categories', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('categories')),
    update: (id: string, data: unknown) =>
      fetchWithAuth(`categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('categories')),
    delete: (id: string) =>
      fetchWithAuth(`categories/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('categories'),
      ),
  },
  templates: {
    getAll: () => fetchWithAuth('templates'),
    getById: (id: string) => fetchWithAuth(`templates/${id}`),
    create: (data: unknown) =>
      fetchWithAuth('templates', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('templates')),
    update: (id: string, data: unknown) =>
      fetchWithAuth(`templates/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('templates')),
    delete: (id: string) =>
      fetchWithAuth(`templates/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('templates'),
      ),
  },
  submissions: {
    getAll: (params?: { templateId?: string; scope?: 'all' | 'personal' }) => {
      const q = new URLSearchParams();
      if (params?.templateId) q.append('templateId', params.templateId);
      if (params?.scope) q.append('scope', params.scope);
      return fetchWithAuth(`submissions${q.toString() ? `?${q}` : ''}`);
    },
    getById: (id: string) => fetchWithAuth(`submissions/${id}`),
    create: (data: {
      templateId: string;
      answers: { questionId: string; answer: string }[];
    }) =>
      fetchWithAuth('submissions', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('submissions')),
    update: (
      id: string,
      data: {
        answers?: { questionId: string; answer: string }[];
        commissionPaid?: boolean;
      },
    ) =>
      fetchWithAuth(`submissions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('submissions')),
    delete: (id: string) =>
      fetchWithAuth(`submissions/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('submissions'),
      ),
    getStats: (params?: {
      templateId?: string;
      detailed?: boolean;
      scope?: 'personal' | 'all';
      granularity?: string;
    }) => {
      const q = new URLSearchParams();
      if (params?.templateId) q.append('templateId', params.templateId);
      if (params?.detailed) q.append('detailed', 'true');
      if (params?.scope) q.append('scope', params.scope);
      if (params?.granularity) q.append('granularity', params.granularity);
      return fetchWithAuth(`submissions/stats${q.toString() ? `?${q}` : ''}`);
    },
    getYearlyStats: (params?: { templateId?: string }) => {
      const q = new URLSearchParams();
      q.append('period', 'yearly');
      if (params?.templateId) q.append('templateId', params.templateId);
      return fetchWithAuth(`submissions/stats${q.toString() ? `?${q}` : ''}`);
    },
    getMonthlyStats: (params?: { templateId?: string }) => {
      const q = new URLSearchParams();
      q.append('period', 'monthly');
      if (params?.templateId) q.append('templateId', params.templateId);
      return fetchWithAuth(`submissions/stats${q.toString() ? `?${q}` : ''}`);
    },
  },
  users: {
    getAll: (params?: { withoutTeam?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.withoutTeam) q.append('withoutTeam', 'true');
      return fetchWithAuth(q.toString() ? `users?${q}` : 'users');
    },
    getStats: () => fetchWithAuth('users/stats'),
    getById: (id: string) => fetchWithAuth(`users/${id}`),
    getCurrent: () => fetchWithAuth('users/me'),
    create: (data: unknown) =>
      fetchWithAuth('users', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('users')),
    update: (id: string, data: unknown) =>
      fetchWithAuth(`users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('users')),
    delete: (id: string) =>
      fetchWithAuth(`users/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('users'),
      ),
    approve: (id: string) =>
      fetchWithAuth(`users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'approved' }),
      }).then(() => invalidateCache('users')),
    reject: (id: string, reason: string) =>
      fetchWithAuth(`users/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'rejected',
          rejectionReason: reason?.trim().slice(0, 500) || null,
        }),
      }).then(() => invalidateCache('users')),
  },
  chat: {
    sendMessage: (
      message: string,
      conversationId?: string,
      context?: 'sabichao' | 'support',
    ) =>
      fetchWithAuth('chat/message', {
        method: 'POST',
        body: JSON.stringify({ message, conversationId, context }),
      }),
    getConversation: (conversationId: string) =>
      fetchWithAuth(`chat/conversation/${conversationId}`),
  },
  messageGenerator: {
    getContexts: () => fetchWithAuth('message-generator/contexts'),
    getTemplates: (contextId?: string) => {
      const q = contextId ? `?contextId=${encodeURIComponent(contextId)}` : '';
      return fetchWithAuth(`message-generator/templates${q}`);
    },
    generate: (body: {
      contextId: string;
      templateId?: string;
      userInput: string;
    }) =>
      fetchWithAuth('message-generator/generate', {
        method: 'POST',
        body: JSON.stringify(body),
      }),
  },
  documents: {
    upload: async (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(`${API_BASE}/documents/upload`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
      });
      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        throw new Error(err.error ?? 'Erro ao fazer upload');
      }
      return res.json();
    },
    getAll: () => fetchWithAuth('documents'),
    getById: (id: string) => fetchWithAuth(`documents/${id}`),
    syncFromDisk: () =>
      fetchWithAuth('documents/sync', { method: 'POST' }).then((data) => {
        invalidateCache('documents');
        return data;
      }),
    delete: (id: string) =>
      fetchWithAuth(`documents/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('documents'),
      ),
  },
  notifications: {
    get: () => fetchWithAuth('notifications'),
  },
  tickets: {
    create: (data: { title: string; description: string }) =>
      fetchWithAuth('tickets', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('notifications')),
    getAll: (params?: { status?: string; unreadOnly?: boolean }) => {
      const search = new URLSearchParams();
      if (params?.status && params.status !== 'all')
        search.set('status', params.status);
      if (params?.unreadOnly) search.set('unreadOnly', 'true');
      const qs = search.toString();
      return fetchWithAuth(qs ? `tickets?${qs}` : 'tickets');
    },
    getById: (id: string) => fetchWithAuth(`tickets/${id}`),
    update: (id: string, data: { readAt?: boolean; status?: string }) =>
      fetchWithAuth(`tickets/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('notifications')),
  },
  user: {
    getGoal: () => fetchWithAuth('user/goal'),
    setGoal: (data: {
      goalType: string;
      targetValue: number;
      period?: string;
    }) =>
      fetchWithAuth('user/goal', {
        method: 'PUT',
        body: JSON.stringify(data),
      }).then((result) => {
        invalidateCache('user');
        return result;
      }),
  },
  userModels: {
    getMyModels: async () => {
      const raw = await fetchWithAuth('user-models/my-models');
      if (Array.isArray(raw)) return raw;
      if (
        raw &&
        typeof raw === 'object' &&
        'data' in raw &&
        Array.isArray((raw as { data: unknown }).data)
      )
        return (raw as { data: unknown[] }).data;
      return [];
    },
    addModelToMyUser: (modelType: string) =>
      fetchWithAuth('user-models/my-models', {
        method: 'POST',
        body: JSON.stringify({ modelType }),
      }).then(() => invalidateCache('user-models')),
    switchModel: (modelId: string) =>
      fetchWithAuth(`user-models/switch-model/${modelId}`, {
        method: 'POST',
      }).then(() => invalidateCache('user-models')),
    getUserModels: (userId: string) =>
      fetchWithAuth(`user-models/user/${userId}/models`),
    addModelToUser: (userId: string, modelType: string) =>
      fetchWithAuth(`user-models/user/${userId}/models`, {
        method: 'POST',
        body: JSON.stringify({ modelType }),
      }).then(() => invalidateCache('user-models')),
    removeModelFromUser: (userId: string, modelId: string) =>
      fetchWithAuth(`user-models/user/${userId}/models/${modelId}`, {
        method: 'DELETE',
      }).then(() => invalidateCache('user-models')),
    toggleModelStatus: (userId: string, modelId: string) =>
      fetchWithAuth(`user-models/user/${userId}/models/${modelId}/toggle`, {
        method: 'PATCH',
      }).then(() => invalidateCache('user-models')),
  },
  objectives: {
    getTree: (teamId?: string) => {
      const q = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      return fetchWithAuth(`objectives${q}`);
    },
    getFlat: (teamId?: string) => {
      const q = teamId ? `?teamId=${encodeURIComponent(teamId)}` : '';
      return fetchWithAuth(`objectives/flat${q}`);
    },
    create: (data: { title: string; description?: string; parentId?: string; teamId?: string; order?: number }) =>
      fetchWithAuth('objectives', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('objectives')),
    update: (id: string, data: { title?: string; description?: string; parentId?: string | null; order?: number }) =>
      fetchWithAuth(`objectives/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('objectives')),
    delete: (id: string) =>
      fetchWithAuth(`objectives/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('objectives'),
      ),
    reorder: (updates: { id: string; order: number; parentId?: string | null }[]) =>
      fetchWithAuth('objectives/reorder', {
        method: 'POST',
        body: JSON.stringify({ updates }),
      }).then(() => invalidateCache('objectives')),
  },
  teams: {
    getList: (all?: boolean) =>
      fetchWithAuth(all ? 'teams?all=true' : 'teams').then((raw) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: unknown[] }).data;
        return [];
      }),
    getMy: () => fetchWithAuth('teams/my'),
    join: (teamId: string) =>
      fetchWithAuth('teams/join', {
        method: 'POST',
        body: JSON.stringify({ teamId }),
      }).then(() => {
        invalidateCache('teams');
        invalidateCache('user');
      }),
    getRankings: () =>
      fetchWithAuth('teams/rankings').then((raw) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: unknown[] }).data;
        return [];
      }),
    getById: (id: string) => fetchWithAuth(`teams/${id}`),
    getMembers: (id: string) =>
      fetchWithAuth(`teams/${id}/members`).then((raw) => {
        if (Array.isArray(raw)) return raw;
        if (raw && typeof raw === 'object' && 'data' in raw) return (raw as { data: unknown[] }).data;
        return [];
      }),
    create: (data: { name: string; description?: string }) =>
      fetchWithAuth('teams', {
        method: 'POST',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('teams')),
    update: (id: string, data: { name?: string; description?: string; isActive?: boolean }) =>
      fetchWithAuth(`teams/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }).then(() => invalidateCache('teams')),
    delete: (id: string) =>
      fetchWithAuth(`teams/${id}`, { method: 'DELETE' }).then(() =>
        invalidateCache('teams'),
      ),
  },
};
