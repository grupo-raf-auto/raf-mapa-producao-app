import { describe, it, expect, vi, beforeEach } from 'vitest';

// Must mock import.meta.env before importing the module
vi.stubEnv('DEV', true);

describe('logger', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('debug logs in dev mode', async () => {
    vi.stubEnv('DEV', true);
    // Re-import to pick up env change
    vi.resetModules();
    const { logger } = await import('@/lib/logger');
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    logger.debug('test label', { data: 1 });
    expect(spy).toHaveBeenCalledWith('[DEBUG] test label', { data: 1 });
  });

  it('error always logs regardless of mode', async () => {
    vi.resetModules();
    const { logger } = await import('@/lib/logger');
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    logger.error('fail', 'details');
    expect(spy).toHaveBeenCalledWith('[ERROR] fail', 'details');
  });

  it('warn always logs regardless of mode', async () => {
    vi.resetModules();
    const { logger } = await import('@/lib/logger');
    const spy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.warn('caution');
    expect(spy).toHaveBeenCalledWith('[WARN] caution');
  });
});
