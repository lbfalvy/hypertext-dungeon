export class MultiMap<K, V> extends Map<K, V[]> {
  push(k: K, ...values: V[]): number {
    const arr = [...this.get(k) ?? [], ...values]
    this.set(k, arr)
    return arr.length
  }

  keyIncludes(k: K, value: V, fromIndex: number | void): boolean {
    return this.get(k)?.includes(value, fromIndex ?? undefined) ?? false
  }

  deleteValue(arg: V) {
    for (const [k, values] of this.entries()) {
      const result = values.filter(v => v != arg)
      if (result.length != values.length) this.set(k, result)
    }
  }
}