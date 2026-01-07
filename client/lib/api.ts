const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export const api = {
  questions: {
    getAll: async (params?: { status?: string; search?: string }) => {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.append('status', params.status);
      if (params?.search) queryParams.append('search', params.search);

      const url = `${API_URL}/api/questions${queryParams.toString() ? `?${queryParams}` : ''}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch questions');
      return res.json();
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_URL}/api/questions/${id}`);
      if (!res.ok) throw new Error('Failed to fetch question');
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/api/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create question');
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/api/questions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update question');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/api/questions/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete question');
      return res.json();
    },
  },
  categories: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/api/categories`);
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_URL}/api/categories/${id}`);
      if (!res.ok) throw new Error('Failed to fetch category');
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/api/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create category');
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/api/categories/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
  },
  forms: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/api/forms`);
      if (!res.ok) throw new Error('Failed to fetch forms');
      return res.json();
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_URL}/api/forms/${id}`);
      if (!res.ok) throw new Error('Failed to fetch form');
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/api/forms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create form');
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/api/forms/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update form');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/api/forms/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete form');
      return res.json();
    },
  },
  templates: {
    getAll: async () => {
      const res = await fetch(`${API_URL}/api/templates`);
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
    getById: async (id: string) => {
      const res = await fetch(`${API_URL}/api/templates/${id}`);
      if (!res.ok) throw new Error('Failed to fetch template');
      return res.json();
    },
    create: async (data: any) => {
      const res = await fetch(`${API_URL}/api/templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to create template');
      return res.json();
    },
    update: async (id: string, data: any) => {
      const res = await fetch(`${API_URL}/api/templates/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Failed to update template');
      return res.json();
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/api/templates/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete template');
      return res.json();
    },
  },
};
