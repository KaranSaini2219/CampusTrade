const TTL_MS = 5_000;
const MAX_ENTRIES = 100;
const cache = new Map();

// Small per-process cache absorbs identical public-feed bursts without retaining data long.
export function getCachedListingFeed(key) {
  const entry = cache.get(key);
  if (!entry || entry.expiresAt <= Date.now()) {
    cache.delete(key);
    return null;
  }
  return entry.value;
}

export function cacheListingFeed(key, value) {
  if (cache.size >= MAX_ENTRIES) cache.delete(cache.keys().next().value);
  cache.set(key, { value, expiresAt: Date.now() + TTL_MS });
}

// Mutations clear rather than selectively update every sorted/filter variant.
export function invalidateListingFeedCache() {
  cache.clear();
}
