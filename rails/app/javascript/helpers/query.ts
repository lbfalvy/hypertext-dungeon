export function query(params: Record<string, void|Parameters<typeof encodeURIComponent>[0]>): string {
  const pairs = Object.entries(params).reduce<[string, string][]>((pairs, [key, value]) =>
    value === undefined || value === null ? pairs : [
      ...pairs,
      [encodeURIComponent(key), encodeURIComponent(value)]
  ], [])
  return pairs.length == 0 ? '' : '?' + pairs.map(p => p.join('=')).join('&')
}