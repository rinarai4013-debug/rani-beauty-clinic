import { describe, expect, it } from 'vitest';
import { buildRawSitemapById, getAllSitemapUrlsById, getSitemapIds } from '@/app/sitemap';

describe('sitemap segmentation', () => {
  it('does not emit duplicate URLs across sub-sitemaps', () => {
    const ids = getSitemapIds();

    const rawAppearanceMap = new Map<string, number[]>();
    const rawCount = ids.reduce((sum, id) => sum + buildRawSitemapById(id).length, 0);

    for (const id of ids) {
      for (const page of buildRawSitemapById(id)) {
        const existing = rawAppearanceMap.get(page.url) ?? [];
        existing.push(id);
        rawAppearanceMap.set(page.url, existing);
      }
    }

    const rawDuplicates = [...rawAppearanceMap.entries()].filter(([, idsForUrl]) => idsForUrl.length > 1);
    expect(rawDuplicates.length).toBe(0);

    const dedupedById = getAllSitemapUrlsById();
    const seen = new Set<string>();
    let hasCrossIdOverlap = false;
    let dedupedCount = 0;

    for (const id of ids) {
      const dedupedEntries = dedupedById.get(id) ?? [];
      dedupedCount += dedupedEntries.length;
      for (const entry of dedupedEntries) {
        if (seen.has(entry.url)) {
          hasCrossIdOverlap = true;
          break;
        }
        seen.add(entry.url);
      }
      if (hasCrossIdOverlap) break;
    }

    expect(hasCrossIdOverlap).toBe(false);
    expect(dedupedCount).toBeLessThanOrEqual(rawCount);
  });
});
