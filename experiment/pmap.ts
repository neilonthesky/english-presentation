/** Run `fn` over the items with at most `workers` calls in flight; the results keep their sequence. */
export async function pmap<T, R>(items: readonly T[], workers: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const out = new Array<R>(items.length)
  let next = 0
  const runner = async (): Promise<void> => {
    for (;;) {
      const index = next++
      if (index >= items.length) return
      out[index] = await fn(items[index])
    }
  }
  await Promise.all(Array.from({ length: Math.min(Math.max(1, workers), items.length) }, runner))
  return out
}
