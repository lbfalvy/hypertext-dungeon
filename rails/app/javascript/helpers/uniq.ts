export function uniq<T extends object>(hash: (t: T) => string): (t: T) => T {
  const cache = new Map<string, WeakRef<T>>()
  return (t:T) => {
    const existing = cache.get(hash(t))?.deref()
    if (existing) return existing
    cache.set(hash(t), new WeakRef(t))
    return t
  }
}