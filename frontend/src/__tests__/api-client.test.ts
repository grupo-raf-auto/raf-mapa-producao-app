import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Stub document.cookie
Object.defineProperty(document, 'cookie', {
  writable: true,
  value: '',
});

describe('API client (fetchWithAuth)', () => {
  beforeEach(() => {
    vi.resetModules();
    mockFetch.mockReset();
    document.cookie = '';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('makes GET requests with credentials and JSON headers', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [{ id: '1' }] }),
    });

    const { apiClient } = await import('@/services/api');
    const result = await apiClient.templates.getAll();

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, opts] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/templates');
    expect(opts.credentials).toBe('include');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(result).toEqual([{ id: '1' }]);
  });

  it('unwraps { success, data } response envelope', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () =>
        Promise.resolve({
          success: true,
          data: { items: [{ id: 'a' }, { id: 'b' }], total: 2 },
        }),
    });

    const { apiClient } = await import('@/services/api');
    const result = await apiClient.submissions.getAll();

    // Should unwrap data.items
    expect(result).toEqual([{ id: 'a' }, { id: 'b' }]);
  });

  it('throws on non-ok response with error message', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ error: 'Database error' }),
    });

    const { apiClient } = await import('@/services/api');
    await expect(apiClient.templates.getAll()).rejects.toThrow('Database error');
  });

  it('redirects to /sign-in on 401 unauthorized', async () => {
    // Mock window.location
    const locationSpy = vi.spyOn(window, 'location', 'get').mockReturnValue({
      ...window.location,
      href: 'http://localhost:3004/',
    } as Location);

    const hrefSetter = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    });

    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    });

    const { apiClient } = await import('@/services/api');
    await expect(apiClient.templates.getAll()).rejects.toThrow();
    expect(window.location.href).toBe('/sign-in');
  });

  it('sends x-active-model header when cookie is set', async () => {
    document.cookie = 'activeModelId=model-123';

    mockFetch.mockResolvedValueOnce({
      ok: true,
      headers: new Headers({ 'content-type': 'application/json' }),
      json: () => Promise.resolve({ success: true, data: [] }),
    });

    const { apiClient } = await import('@/services/api');
    await apiClient.templates.getAll();

    const [, opts] = mockFetch.mock.calls[0];
    expect(opts.headers['x-active-model']).toBe('model-123');
  });

  it('handles 429 rate limit with meaningful error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      headers: new Headers({
        'content-type': 'application/json',
        'Retry-After': '30',
      }),
      json: () => Promise.resolve({ error: 'Too many requests' }),
    });

    const { apiClient } = await import('@/services/api');
    await expect(apiClient.templates.getAll()).rejects.toThrow(
      'Muitas requisições. Tente novamente em 30 segundos.',
    );
  });
});
