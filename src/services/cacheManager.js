/**
 * Simple in-memory cache with TTL (Time To Live)
 * This significantly reduces redundant API calls
 */
class CacheManager {
  constructor() {
    this.cache = new Map();
    this.defaultTTL = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Generate cache key from request details
   */
  generateKey(url, params = {}) {
    const sortedParams = Object.keys(params).sort().reduce((acc, key) => {
      acc[key] = params[key];
      return acc;
    }, {});
    return `${url}:${JSON.stringify(sortedParams)}`;
  }

  /**
   * Set cache entry with TTL
   */
  set(key, data, ttl = this.defaultTTL) {
    const expiresAt = Date.now() + ttl;
    this.cache.set(key, { data, expiresAt });
  }

  /**
   * Get cache entry if not expired
   */
  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;

    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Invalidate specific key or pattern
   */
  invalidate(keyPattern) {
    if (typeof keyPattern === 'string') {
      this.cache.delete(keyPattern);
    } else if (keyPattern instanceof RegExp) {
      for (const key of this.cache.keys()) {
        if (keyPattern.test(key)) {
          this.cache.delete(key);
        }
      }
    }
  }

  /**
   * Clear all cache
   */
  clear() {
    this.cache.clear();
  }

  /**
   * Get cache stats
   */
  stats() {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }
}

// Singleton instance
const cacheManager = new CacheManager();

// Export for use across the app
export default cacheManager;

/**
 * HOF to wrap fetch calls with caching
 */
export async function cachedFetch(url, options = {}, cacheTTL) {
  const cacheKey = cacheManager.generateKey(url, options);
  
  // Check cache first
  const cached = cacheManager.get(cacheKey);
  if (cached) {
    console.log(`✓ Cache hit: ${url}`);
    return cached;
  }

  // Fetch from network
  console.log(`⟳ Cache miss, fetching: ${url}`);
  const response = await fetch(url, options);
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  const data = await response.json();
  
  // Store in cache
  cacheManager.set(cacheKey, data, cacheTTL);
  
  return data;
}

/**
 * Invalidate cache when data changes
 */
export function invalidateCache(pattern) {
  cacheManager.invalidate(pattern);
}
