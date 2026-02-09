import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '@/contexts/auth-context';

// Mock the auth-client module
vi.mock('@/lib/auth-client', () => ({
  useSession: vi.fn(),
}));

// Import the mock to control it
import { useSession } from '@/lib/auth-client';
const mockUseSession = vi.mocked(useSession);

// Mock fetch for /api/user/role
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

function TestConsumer() {
  const auth = useAuth();
  return (
    <div>
      <span data-testid="loading">{String(auth.isLoading)}</span>
      <span data-testid="user">{auth.user?.email ?? 'none'}</span>
      <span data-testid="role">{auth.role ?? 'none'}</span>
      <span data-testid="admin">{String(auth.isAdmin)}</span>
      <span data-testid="approval">{auth.approvalStatus ?? 'none'}</span>
    </div>
  );
}

describe('AuthContext', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockFetch.mockReset();
  });

  it('shows loading state while session is pending', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: true,
    } as ReturnType<typeof useSession>);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('loading').textContent).toBe('true');
    expect(screen.getByTestId('user').textContent).toBe('none');
  });

  it('sets user data when session is available', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: { id: 'u1', email: 'test@example.com', name: 'Test' },
      },
      isPending: false,
    } as ReturnType<typeof useSession>);

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          role: 'admin',
          emailVerified: true,
          approvalStatus: 'approved',
        }),
    });

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('user').textContent).toBe('test@example.com');
      expect(screen.getByTestId('role').textContent).toBe('admin');
      expect(screen.getByTestId('admin').textContent).toBe('true');
      expect(screen.getByTestId('approval').textContent).toBe('approved');
    });
  });

  it('falls back to user role when /api/user/role fails', async () => {
    mockUseSession.mockReturnValue({
      data: {
        user: {
          id: 'u2',
          email: 'user@example.com',
          name: 'User',
          role: 'user',
          emailVerified: false,
        },
      },
      isPending: false,
    } as ReturnType<typeof useSession>);

    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId('role').textContent).toBe('user');
      expect(screen.getByTestId('admin').textContent).toBe('false');
    });
  });

  it('shows no user when session is null', () => {
    mockUseSession.mockReturnValue({
      data: null,
      isPending: false,
    } as ReturnType<typeof useSession>);

    render(
      <AuthProvider>
        <TestConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user').textContent).toBe('none');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('throws when useAuth is used outside AuthProvider', () => {
    // Suppress error output from React
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => render(<TestConsumer />)).toThrow(
      'useAuth must be used within AuthProvider',
    );

    consoleSpy.mockRestore();
  });
});
