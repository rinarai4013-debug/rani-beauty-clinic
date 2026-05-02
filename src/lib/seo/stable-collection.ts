export function stableHash(value: string): number {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }

  return hash;
}

export function takeStableRotated<T>(items: T[], seed: string, count: number): T[] {
  if (count <= 0 || items.length === 0) return [];
  if (items.length <= count) return items;

  const start = stableHash(seed) % items.length;
  return Array.from({ length: count }, (_, index) => items[(start + index) % items.length]);
}
