interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

const memoryStore = new Map<string, CacheEntry<any>>();

/**
 * Get a value from the in-memory cache if present and unexpired.
 */
export function getCached<T>(key: string): T | null {
  const entry = memoryStore.get(key);
  if (!entry) return null;

  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }

  return entry.data as T;
}

/**
 * Store a value in the in-memory cache with a TTL in seconds.
 */
export function setCache<T>(key: string, data: T, ttlSeconds: number = 60): void {
  memoryStore.set(key, {
    data,
    expiresAt: Date.now() + ttlSeconds * 1000,
  });
}

/**
 * Invalidate cache entries matching a prefix or pattern.
 * If no prefix provided, clears the entire cache.
 */
export function invalidateCache(prefix?: string): void {
  if (!prefix) {
    memoryStore.clear();
    return;
  }

  for (const key of memoryStore.keys()) {
    if (key.startsWith(prefix)) {
      memoryStore.delete(key);
    }
  }
}

/**
 * Helper to wrap an async database query with cache lookup & population.
 */
export async function withCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const cached = getCached<T>(key);
  if (cached !== null) {
    return cached;
  }

  const fresh = await fetcher();
  setCache(key, fresh, ttlSeconds);
  return fresh;
}
