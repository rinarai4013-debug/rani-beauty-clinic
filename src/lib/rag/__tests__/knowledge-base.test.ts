import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  buildKnowledgeBase,
  buildRAGContext,
  getAllDocuments,
  getServiceDocuments,
  searchKnowledgeBase,
} from '@/lib/rag/knowledge-base';

describe('knowledge-base', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-04-10T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('buildKnowledgeBase summarizes built-in knowledge with category and service counts', () => {
    const stats = buildKnowledgeBase();

    expect(stats.totalDocuments).toBeGreaterThan(10);
    expect(stats.byCategory.treatment_protocol).toBeGreaterThan(0);
    expect(stats.byCategory.faq).toBeGreaterThan(0);
    expect(stats.byService.Botox).toBeGreaterThan(0);
    expect(stats.lastUpdated).toBe('2026-04-10T12:00:00.000Z');
    expect(stats.indexHealth).toBe('healthy');
  });

  it('buildKnowledgeBase merges additional documents into category and service tallies', () => {
    const stats = buildKnowledgeBase([
      {
        id: 'custom-pricing',
        title: 'Custom Pricing Note',
        content: 'PRX-T33 membership note for Renton clients.',
        category: 'pricing',
        service: 'PRX-T33',
        tags: ['pricing', 'membership'],
        source: 'manual',
        lastUpdated: '2026-04-01',
        version: 1,
        approved: true,
      },
    ]);

    expect(stats.byCategory.pricing).toBeGreaterThan(0);
    expect(stats.byService['PRX-T33']).toBeGreaterThan(0);
  });

  it('searchKnowledgeBase ranks relevant documents by keyword match', () => {
    const results = searchKnowledgeBase('botox aftercare upright', { topK: 3 });

    expect(results.length).toBeGreaterThan(0);
    expect(results.length).toBeLessThanOrEqual(3);
    expect(results[0].document.title).toBe('Botox Aftercare Instructions');
    expect(results[0].matchedChunk.toLowerCase()).toContain('stay upright');
    expect(results[0].relevanceScore).toBeGreaterThan(0);
  });

  it('searchKnowledgeBase respects category and service filters', () => {
    const categoryResults = searchKnowledgeBase('weight loss physician', {
      category: 'treatment_protocol',
      service: 'GLP-1',
    });

    expect(categoryResults.length).toBeGreaterThan(0);
    expect(categoryResults.every(result => result.document.category === 'treatment_protocol')).toBe(true);
    expect(categoryResults.every(result => result.document.service === 'GLP-1')).toBe(true);
  });

  it('buildRAGContext trims context text to the requested max length and reports sources', () => {
    const context = buildRAGContext('HydraFacial glow hydration', {
      service: 'HydraFacial',
      maxContextLength: 800,
    });

    expect(context.query).toBe('HydraFacial glow hydration');
    expect(context.results.length).toBeGreaterThan(0);
    expect(context.contextText.length).toBeLessThanOrEqual(250);
    expect(context.sources.length).toBeGreaterThan(0);
    expect(context.confidence).toBeGreaterThan(0);
  });

  it('getServiceDocuments returns all documents attached to a service', () => {
    const documents = getServiceDocuments('Botox');

    expect(documents.some(document => document.category === 'treatment_protocol')).toBe(true);
    expect(documents.some(document => document.category === 'aftercare')).toBe(true);
  });

  it('getAllDocuments applies category, service, and approval filters', () => {
    const faqDocs = getAllDocuments({ category: 'faq' });
    const approvedBotoxDocs = getAllDocuments({ service: 'Botox', approved: true });

    expect(faqDocs.every(document => document.category === 'faq')).toBe(true);
    expect(approvedBotoxDocs.length).toBeGreaterThan(0);
    expect(approvedBotoxDocs.every(document => document.service === 'Botox' && document.approved)).toBe(true);
  });

  it('coverage scoring surfaces documented knowledge gaps for missing service categories', () => {
    const stats = buildKnowledgeBase();

    expect(stats.coverageScore).toBeGreaterThan(0);
    expect(stats.knowledgeGaps.length).toBeGreaterThan(0);
    expect(stats.knowledgeGaps[0].priority).toMatch(/high|medium|low/);
  });
});
