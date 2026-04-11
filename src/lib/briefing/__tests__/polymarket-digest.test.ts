// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  identifyTopMovers,
  findResolvingMarkets,
  findNewHighVolumeMarkets,
  calculateCategoryMomentum,
  calculatePortfolio,
  detectSignals,
  detectCorrelations,
  buildEventCalendar,
  calculateMarketSummary,
  type PolymarketMarket,
  type PortfolioPosition,
} from '../polymarket-digest';

// ── Fixtures ──────────────────────────────────────────────────

function makeMarket(overrides: Partial<PolymarketMarket> = {}): PolymarketMarket {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setDate(endDate.getDate() + 7);

  return {
    id: 'market-1',
    slug: 'test-market',
    title: 'Will event X happen?',
    description: 'Test market description',
    category: 'Politics',
    endDate: endDate.toISOString(),
    active: true,
    closed: false,
    volume: 500000,
    volume24h: 25000,
    liquidity: 100000,
    outcomes: [
      { name: 'Yes', price: 0.65, priceChange24h: 0.05, volume24h: 15000 },
      { name: 'No', price: 0.35, priceChange24h: -0.05, volume24h: 10000 },
    ],
    createdAt: new Date(now.getTime() - 14 * 86400000).toISOString(),
    resolvedAt: null,
    resolution: null,
    ...overrides,
  };
}

function makePosition(overrides: Partial<PortfolioPosition> = {}): PortfolioPosition {
  return {
    marketId: 'market-1',
    marketTitle: 'Test Market',
    outcome: 'Yes',
    shares: 100,
    avgEntryPrice: 0.50,
    currentPrice: 0.65,
    pnl: 15,
    pnlPercent: 30,
    marketEndsIn: 168,
    ...overrides,
  };
}

// ── Tests ─────────────────────────────────────────────────────

describe('Polymarket Digest', () => {
  // ── Top Movers ──

  describe('identifyTopMovers', () => {
    it('should identify markets with significant price changes', () => {
      const markets = [
        makeMarket({ outcomes: [
          { name: 'Yes', price: 0.70, priceChange24h: 0.15, volume24h: 50000 },
          { name: 'No', price: 0.30, priceChange24h: -0.15, volume24h: 20000 },
        ]}),
      ];
      const movers = identifyTopMovers(markets, 5);
      expect(movers.length).toBeGreaterThan(0);
    });

    it('should sort by absolute price change descending', () => {
      const markets = [
        makeMarket({ id: 'm1', title: 'Small move', outcomes: [
          { name: 'Yes', price: 0.55, priceChange24h: 0.06, volume24h: 10000 },
          { name: 'No', price: 0.45, priceChange24h: -0.06, volume24h: 10000 },
        ]}),
        makeMarket({ id: 'm2', title: 'Big move', outcomes: [
          { name: 'Yes', price: 0.80, priceChange24h: 0.20, volume24h: 50000 },
          { name: 'No', price: 0.20, priceChange24h: -0.20, volume24h: 20000 },
        ]}),
      ];
      const movers = identifyTopMovers(markets, 1);
      expect(movers[0].market.title).toBe('Big move');
    });

    it('should skip inactive markets', () => {
      const markets = [makeMarket({ active: false, outcomes: [
        { name: 'Yes', price: 0.70, priceChange24h: 0.20, volume24h: 50000 },
        { name: 'No', price: 0.30, priceChange24h: -0.20, volume24h: 20000 },
      ]})];
      const movers = identifyTopMovers(markets, 1);
      expect(movers.length).toBe(0);
    });

    it('should skip closed markets', () => {
      const markets = [makeMarket({ closed: true, outcomes: [
        { name: 'Yes', price: 0.70, priceChange24h: 0.20, volume24h: 50000 },
        { name: 'No', price: 0.30, priceChange24h: -0.20, volume24h: 20000 },
      ]})];
      const movers = identifyTopMovers(markets, 1);
      expect(movers.length).toBe(0);
    });

    it('should limit to 10 results', () => {
      const markets = Array.from({ length: 20 }, (_, i) =>
        makeMarket({ id: `m${i}`, outcomes: [
          { name: 'Yes', price: 0.50, priceChange24h: 0.10 + i * 0.01, volume24h: 10000 },
          { name: 'No', price: 0.50, priceChange24h: -0.10 - i * 0.01, volume24h: 10000 },
        ]})
      );
      const movers = identifyTopMovers(markets, 1);
      expect(movers.length).toBeLessThanOrEqual(10);
    });

    it('should include direction (up/down) for each mover', () => {
      const markets = [makeMarket({ outcomes: [
        { name: 'Yes', price: 0.70, priceChange24h: 0.10, volume24h: 10000 },
        { name: 'No', price: 0.30, priceChange24h: -0.10, volume24h: 10000 },
      ]})];
      const movers = identifyTopMovers(markets, 1);
      expect(['up', 'down']).toContain(movers[0].direction);
    });

    it('should include signal description', () => {
      const markets = [makeMarket({ outcomes: [
        { name: 'Yes', price: 0.80, priceChange24h: 0.20, volume24h: 100000 },
        { name: 'No', price: 0.20, priceChange24h: -0.20, volume24h: 20000 },
      ]})];
      const movers = identifyTopMovers(markets, 1);
      expect(movers[0].signal).toBeTruthy();
    });
  });

  // ── Resolving Markets ──

  describe('findResolvingMarkets', () => {
    it('should find markets resolving within threshold', () => {
      const endDate = new Date();
      endDate.setHours(endDate.getHours() + 12);
      const markets = [makeMarket({ endDate: endDate.toISOString() })];
      const resolving = findResolvingMarkets(markets, 48);
      expect(resolving.length).toBe(1);
    });

    it('should not include markets past threshold', () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 10);
      const markets = [makeMarket({ endDate: endDate.toISOString() })];
      const resolving = findResolvingMarkets(markets, 48);
      expect(resolving.length).toBe(0);
    });

    it('should sort by hours until resolution ascending', () => {
      const end1 = new Date(); end1.setHours(end1.getHours() + 6);
      const end2 = new Date(); end2.setHours(end2.getHours() + 24);
      const markets = [
        makeMarket({ id: 'm1', title: 'Later', endDate: end2.toISOString() }),
        makeMarket({ id: 'm2', title: 'Sooner', endDate: end1.toISOString() }),
      ];
      const resolving = findResolvingMarkets(markets, 48);
      expect(resolving[0].market.title).toBe('Sooner');
    });

    it('should classify confidence based on leading price', () => {
      const endDate = new Date(); endDate.setHours(endDate.getHours() + 12);
      const markets = [makeMarket({ endDate: endDate.toISOString(), outcomes: [
        { name: 'Yes', price: 0.95, priceChange24h: 0, volume24h: 0 },
        { name: 'No', price: 0.05, priceChange24h: 0, volume24h: 0 },
      ]})];
      const resolving = findResolvingMarkets(markets, 48);
      expect(resolving[0].confidence).toBe('high');
    });

    it('should skip closed markets', () => {
      const endDate = new Date(); endDate.setHours(endDate.getHours() + 12);
      const markets = [makeMarket({ closed: true, endDate: endDate.toISOString() })];
      const resolving = findResolvingMarkets(markets, 48);
      expect(resolving.length).toBe(0);
    });
  });

  // ── New High-Volume Markets ──

  describe('findNewHighVolumeMarkets', () => {
    it('should find new markets with high volume', () => {
      const created = new Date();
      created.setDate(created.getDate() - 3);
      const markets = [makeMarket({ createdAt: created.toISOString(), volume: 100000 })];
      const results = findNewHighVolumeMarkets(markets, 7, 50000);
      expect(results.length).toBe(1);
    });

    it('should exclude old markets', () => {
      const created = new Date();
      created.setDate(created.getDate() - 30);
      const markets = [makeMarket({ createdAt: created.toISOString(), volume: 100000 })];
      const results = findNewHighVolumeMarkets(markets, 7, 50000);
      expect(results.length).toBe(0);
    });

    it('should exclude low-volume markets', () => {
      const created = new Date();
      created.setDate(created.getDate() - 2);
      const markets = [makeMarket({ createdAt: created.toISOString(), volume: 1000 })];
      const results = findNewHighVolumeMarkets(markets, 7, 50000);
      expect(results.length).toBe(0);
    });

    it('should sort by volume24h descending', () => {
      const created = new Date(); created.setDate(created.getDate() - 2);
      const markets = [
        makeMarket({ id: 'm1', title: 'Low', createdAt: created.toISOString(), volume: 100000, volume24h: 5000 }),
        makeMarket({ id: 'm2', title: 'High', createdAt: created.toISOString(), volume: 100000, volume24h: 50000 }),
      ];
      const results = findNewHighVolumeMarkets(markets, 7, 50000);
      expect(results[0].market.title).toBe('High');
    });

    it('should limit to 10 results', () => {
      const created = new Date(); created.setDate(created.getDate() - 1);
      const markets = Array.from({ length: 15 }, (_, i) =>
        makeMarket({ id: `m${i}`, createdAt: created.toISOString(), volume: 100000 })
      );
      const results = findNewHighVolumeMarkets(markets, 7, 50000);
      expect(results.length).toBeLessThanOrEqual(10);
    });
  });

  // ── Category Momentum ──

  describe('calculateCategoryMomentum', () => {
    it('should group markets by category', () => {
      const markets = [
        makeMarket({ id: 'm1', category: 'Politics' }),
        makeMarket({ id: 'm2', category: 'Politics' }),
        makeMarket({ id: 'm3', category: 'Crypto' }),
      ];
      const momentum = calculateCategoryMomentum(markets);
      const politics = momentum.find(m => m.category === 'Politics');
      expect(politics).toBeDefined();
      expect(politics!.marketCount).toBe(2);
    });

    it('should calculate total volume per category', () => {
      const markets = [
        makeMarket({ id: 'm1', category: 'Politics', volume: 100000, volume24h: 5000 }),
        makeMarket({ id: 'm2', category: 'Politics', volume: 200000, volume24h: 10000 }),
      ];
      const momentum = calculateCategoryMomentum(markets);
      const politics = momentum.find(m => m.category === 'Politics');
      expect(politics!.totalVolume).toBe(300000);
      expect(politics!.volume24h).toBe(15000);
    });

    it('should sort by volume24h descending', () => {
      const markets = [
        makeMarket({ id: 'm1', category: 'Politics', volume24h: 5000 }),
        makeMarket({ id: 'm2', category: 'Crypto', volume24h: 50000 }),
      ];
      const momentum = calculateCategoryMomentum(markets);
      expect(momentum[0].category).toBe('Crypto');
    });

    it('should skip inactive markets', () => {
      const markets = [
        makeMarket({ id: 'm1', category: 'Politics', active: false }),
      ];
      const momentum = calculateCategoryMomentum(markets);
      const politics = momentum.find(m => m.category === 'Politics');
      expect(politics).toBeUndefined();
    });
  });

  // ── Portfolio ──

  describe('calculatePortfolio', () => {
    it('should calculate total P&L', () => {
      const positions = [makePosition({ shares: 100, avgEntryPrice: 0.50, currentPrice: 0.65 })];
      const markets = [makeMarket({ outcomes: [
        { name: 'Yes', price: 0.65, priceChange24h: 0.05, volume24h: 10000 },
        { name: 'No', price: 0.35, priceChange24h: -0.05, volume24h: 10000 },
      ]})];
      const portfolio = calculatePortfolio(positions, markets);
      expect(portfolio.totalPnL).toBeGreaterThan(0);
    });

    it('should identify best and worst positions', () => {
      const positions = [
        makePosition({ marketId: 'm1', outcome: 'Yes', shares: 100, avgEntryPrice: 0.30, currentPrice: 0.70 }),
        makePosition({ marketId: 'm2', outcome: 'Yes', shares: 50, avgEntryPrice: 0.80, currentPrice: 0.40 }),
      ];
      const markets = [
        makeMarket({ id: 'm1', outcomes: [{ name: 'Yes', price: 0.70, priceChange24h: 0, volume24h: 0 }, { name: 'No', price: 0.30, priceChange24h: 0, volume24h: 0 }] }),
        makeMarket({ id: 'm2', outcomes: [{ name: 'Yes', price: 0.40, priceChange24h: 0, volume24h: 0 }, { name: 'No', price: 0.60, priceChange24h: 0, volume24h: 0 }] }),
      ];
      const portfolio = calculatePortfolio(positions, markets);
      expect(portfolio.bestPosition).not.toBeNull();
      expect(portfolio.worstPosition).not.toBeNull();
    });

    it('should handle empty positions', () => {
      const portfolio = calculatePortfolio([], []);
      expect(portfolio.totalInvested).toBe(0);
      expect(portfolio.totalPnL).toBe(0);
      expect(portfolio.positions.length).toBe(0);
    });

    it('should identify positions at risk', () => {
      const positions = [makePosition({ shares: 100, avgEntryPrice: 0.80, currentPrice: 0.40, pnlPercent: -50 })];
      const markets = [makeMarket({ outcomes: [{ name: 'Yes', price: 0.40, priceChange24h: -0.2, volume24h: 0 }, { name: 'No', price: 0.60, priceChange24h: 0.2, volume24h: 0 }] })];
      const portfolio = calculatePortfolio(positions, markets);
      expect(portfolio.positionsAtRisk.length).toBeGreaterThan(0);
    });
  });

  // ── Signal Detection ──

  describe('detectSignals', () => {
    it('should detect volume spikes', () => {
      const markets = [makeMarket({ volume: 100000, volume24h: 80000 })]; // 80k vs ~3333 daily avg
      const signals = detectSignals(markets, 3);
      const volumeSpike = signals.find(s => s.type === 'volume_spike');
      expect(volumeSpike).toBeDefined();
    });

    it('should detect price reversals', () => {
      const markets = [makeMarket({ outcomes: [
        { name: 'Yes', price: 0.40, priceChange24h: -0.35, volume24h: 10000 }, // was 0.75, now 0.40
        { name: 'No', price: 0.60, priceChange24h: 0.35, volume24h: 10000 },
      ]})];
      const signals = detectSignals(markets, 3);
      const reversal = signals.find(s => s.type === 'price_reversal');
      expect(reversal).toBeDefined();
    });

    it('should sort by severity', () => {
      const markets = [
        makeMarket({ id: 'm1', volume: 100000, volume24h: 80000 }),
        makeMarket({ id: 'm2', outcomes: [
          { name: 'Yes', price: 0.40, priceChange24h: -0.35, volume24h: 10000 },
          { name: 'No', price: 0.60, priceChange24h: 0.35, volume24h: 10000 },
        ]}),
      ];
      const signals = detectSignals(markets, 3);
      if (signals.length >= 2) {
        const sOrder = { high: 0, medium: 1, low: 2 };
        expect(sOrder[signals[0].severity]).toBeLessThanOrEqual(sOrder[signals[1].severity]);
      }
    });

    it('should skip inactive markets', () => {
      const markets = [makeMarket({ active: false, volume: 100000, volume24h: 80000 })];
      const signals = detectSignals(markets, 3);
      expect(signals.length).toBe(0);
    });
  });

  // ── Correlations ──

  describe('detectCorrelations', () => {
    it('should detect same-category markets moving in opposite directions', () => {
      const markets = [
        makeMarket({ id: 'm1', category: 'Politics', outcomes: [
          { name: 'Yes', price: 0.70, priceChange24h: 0.10, volume24h: 10000 },
          { name: 'No', price: 0.30, priceChange24h: -0.10, volume24h: 10000 },
        ]}),
        makeMarket({ id: 'm2', category: 'Politics', outcomes: [
          { name: 'Yes', price: 0.30, priceChange24h: -0.10, volume24h: 10000 },
          { name: 'No', price: 0.70, priceChange24h: 0.10, volume24h: 10000 },
        ]}),
      ];
      const alerts = detectCorrelations(markets);
      expect(alerts.length).toBeGreaterThan(0);
    });

    it('should limit to 5 results', () => {
      const markets = Array.from({ length: 20 }, (_, i) =>
        makeMarket({
          id: `m${i}`, category: 'Politics',
          outcomes: [
            { name: 'Yes', price: 0.50, priceChange24h: i % 2 === 0 ? 0.10 : -0.10, volume24h: 10000 },
            { name: 'No', price: 0.50, priceChange24h: i % 2 === 0 ? -0.10 : 0.10, volume24h: 10000 },
          ],
        })
      );
      const alerts = detectCorrelations(markets);
      expect(alerts.length).toBeLessThanOrEqual(5);
    });
  });

  // ── Event Calendar ──

  describe('buildEventCalendar', () => {
    it('should include markets ending within days ahead', () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 3);
      const markets = [makeMarket({ endDate: endDate.toISOString() })];
      const events = buildEventCalendar(markets, 7);
      expect(events.length).toBeGreaterThan(0);
    });

    it('should exclude markets ending beyond threshold', () => {
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);
      const markets = [makeMarket({ endDate: endDate.toISOString() })];
      const events = buildEventCalendar(markets, 7);
      expect(events.length).toBe(0);
    });

    it('should sort by date ascending', () => {
      const end1 = new Date(); end1.setDate(end1.getDate() + 5);
      const end2 = new Date(); end2.setDate(end2.getDate() + 2);
      const markets = [
        makeMarket({ id: 'm1', endDate: end1.toISOString(), category: 'A' }),
        makeMarket({ id: 'm2', endDate: end2.toISOString(), category: 'B' }),
      ];
      const events = buildEventCalendar(markets, 7);
      expect(events.length).toBe(2);
      expect(events[0].date <= events[1].date).toBe(true);
    });
  });

  // ── Market Summary ──

  describe('calculateMarketSummary', () => {
    it('should count active markets', () => {
      const markets = [
        makeMarket({ id: 'm1', active: true }),
        makeMarket({ id: 'm2', active: true }),
        makeMarket({ id: 'm3', active: false }),
      ];
      const summary = calculateMarketSummary(markets, []);
      expect(summary.totalActiveMarkets).toBe(2);
    });

    it('should sum 24h volume', () => {
      const markets = [
        makeMarket({ id: 'm1', volume24h: 10000 }),
        makeMarket({ id: 'm2', volume24h: 20000 }),
      ];
      const summary = calculateMarketSummary(markets, []);
      expect(summary.totalVolume24h).toBe(30000);
    });

    it('should set overall sentiment', () => {
      const markets = [makeMarket()];
      const summary = calculateMarketSummary(markets, []);
      expect(['risk_on', 'risk_off', 'neutral']).toContain(summary.overallSentiment);
    });

    it('should reference biggest mover from topMovers', () => {
      const markets = [makeMarket()];
      const topMovers = [{
        market: makeMarket({ title: 'Big Mover' }),
        biggestOutcome: 'Yes',
        priceChange24h: 0.15,
        priceChangePercent: 25,
        direction: 'up' as const,
        currentPrice: 0.75,
        volume24h: 50000,
        signal: 'Major shift',
      }];
      const summary = calculateMarketSummary(markets, topMovers);
      expect(summary.biggestMover).toBe('Big Mover');
    });
  });
});
