import { vi } from 'vitest';

/**
 * Creates a chainable Supabase mock that simulates the query builder pattern.
 * Each method returns the mock itself, allowing `.from('x').select('*').eq('id', v)` chains.
 */
export function createSupabaseMock(responseData: unknown = [], responseError: unknown = null) {
  const queryBuilder: Record<string, ReturnType<typeof vi.fn>> = {};

  const makeChainable = () => {
    const methods = [
      'select', 'insert', 'update', 'delete', 'upsert',
      'eq', 'neq', 'gt', 'gte', 'lt', 'lte',
      'like', 'ilike', 'is', 'in',
      'order', 'limit', 'range', 'single',
      'filter', 'match', 'not', 'or', 'contains',
      'textSearch', 'maybeSingle',
    ];

    const chain: Record<string, any> = {};
    for (const method of methods) {
      chain[method] = vi.fn().mockReturnValue(chain);
    }

    // Terminal methods that resolve the promise
    chain.then = vi.fn((resolve) =>
      resolve({ data: responseData, error: responseError })
    );

    // Make chain thenable (works with await)
    Object.defineProperty(chain, Symbol.toStringTag, { value: 'Promise' });

    // Override single to return the resolved promise directly
    chain.single = vi.fn().mockResolvedValue({ data: responseData, error: responseError });

    return chain;
  };

  const supabaseMock = {
    from: vi.fn(() => makeChainable()),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: null }, error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({ data: {}, error: null }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      updateUser: vi.fn().mockResolvedValue({ data: {}, error: null }),
    },
    storage: {
      from: vi.fn(() => ({
        upload: vi.fn().mockResolvedValue({ data: { path: 'test-path' }, error: null }),
        getPublicUrl: vi.fn(() => ({ data: { publicUrl: 'https://example.com/test.png' } })),
      })),
    },
  };

  return supabaseMock;
}

/**
 * Helper to set up Supabase client mock for admin or client modules.
 */
export function mockSupabaseClient(responseData?: unknown, responseError?: unknown) {
  const mock = createSupabaseMock(responseData, responseError);

  vi.mock('@/lib/supabase/client', () => ({
    createClient: () => mock,
  }));

  return mock;
}
