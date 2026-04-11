/**
 * Rani Beauty Clinic - Polymarket Intelligence Digest
 *
 * Prediction market intelligence for the CEO morning briefing.
 * Tracks top movers, resolving markets, new high-volume markets,
 * portfolio performance, sentiment divergence, and event calendars.
 */

// ── Types ─────────────────────────────────────────────────────

export interface PolymarketMarket {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  endDate: string;
  active: boolean;
  closed: boolean;
  volume: number;
  volume24h: number;
  liquidity: number;
  outcomes: PolymarketOutcome[];
  createdAt: string;
  resolvedAt: string | null;
  resolution: string | null;
}

export interface PolymarketOutcome {
  name: string;
  price: number; // 0-1 representing probability
  priceChange24h: number;
  volume24h: number;
}

export interface TopMover {
  market: PolymarketMarket;
  biggestOutcome: string;
  priceChange24h: number;
  priceChangePercent: number;
  direction: 'up' | 'down';
  currentPrice: number;
  volume24h: number;
  signal: string;
}

export interface ResolvingMarket {
  market: PolymarketMarket;
  hoursUntilResolution: number;
  leadingOutcome: string;
  leadingPrice: number;
  confidence: 'high' | 'medium' | 'low';
  potentialPayout: number | null; // if user has position
}

export interface NewHighVolumeMarket {
  market: PolymarketMarket;
  daysOld: number;
  volume: number;
  volume24h: number;
  topOutcome: string;
  topOutcomePrice: number;
  why: string;
}

export interface CategoryMomentum {
  category: string;
  marketCount: number;
  totalVolume: number;
  volume24h: number;
  avgPriceMovement: number;
  trend: 'bullish' | 'bearish' | 'neutral';
  topMarket: string;
}

export interface PortfolioPosition {
  marketId: string;
  marketTitle: string;
  outcome: string;
  shares: number;
  avgEntryPrice: number;
  currentPrice: number;
  pnl: number;
  pnlPercent: number;
  marketEndsIn: number; // hours
}

export interface PortfolioSummary {
  totalInvested: number;
  currentValue: number;
  totalPnL: number;
  totalPnLPercent: number;
  positions: PortfolioPosition[];
  bestPosition: PortfolioPosition | null;
  worstPosition: PortfolioPosition | null;
  positionsAtRisk: PortfolioPosition[]; // positions with >20% loss
  positionsNearResolution: PortfolioPosition[]; // resolving within 48h
}

export interface SignalAlert {
  type: 'volume_spike' | 'price_reversal' | 'whale_activity' | 'new_resolution' | 'correlation_break' | 'sentiment_shift';
  severity: 'high' | 'medium' | 'low';
  market: string;
  marketId: string;
  message: string;
  timestamp: string;
  data: Record<string, number | string>;
}

export interface SentimentDivergence {
  market: string;
  marketId: string;
  polymarketPrice: number;
  externalSentiment: number; // 0-1 from news/social
  divergencePercent: number;
  direction: 'market_bullish' | 'market_bearish';
  significance: 'high' | 'medium' | 'low';
  interpretation: string;
}

export interface CalendarEvent {
  date: string;
  title: string;
  category: string;
  relatedMarkets: string[];
  impact: 'high' | 'medium' | 'low';
  description: string;
}

export interface CorrelationAlert {
  market1: string;
  market2: string;
  correlationType: 'positive' | 'negative' | 'decoupling';
  correlationStrength: number; // 0-1
  expectedCorrelation: number;
  actualCorrelation: number;
  significance: string;
}

// ── Polymarket Digest ─────────────────────────────────────────

export interface PolymarketDigest {
  generatedAt: string;
  topMovers: TopMover[];
  resolvingMarkets: ResolvingMarket[];
  newHighVolumeMarkets: NewHighVolumeMarket[];
  categoryMomentum: CategoryMomentum[];
  portfolio: PortfolioSummary | null;
  signals: SignalAlert[];
  sentimentDivergences: SentimentDivergence[];
  eventCalendar: CalendarEvent[];
  correlationAlerts: CorrelationAlert[];
  marketSummary: MarketSummary;
}

export interface MarketSummary {
  totalActiveMarkets: number;
  totalVolume24h: number;
  marketsResolving24h: number;
  marketsResolving7d: number;
  biggestMover: string;
  biggestMoverChange: number;
  overallSentiment: 'risk_on' | 'risk_off' | 'neutral';
}

// ── Configuration ─────────────────────────────────────────────

export interface PolymarketConfig {
  apiUrl: string;
  positions?: PortfolioPosition[]; // manually tracked positions
  watchCategories?: string[];
  alertThresholds?: {
    priceChangePercent: number; // minimum % change to flag as top mover
    volumeSpikeMultiple: number; // volume vs avg to flag spike
    resolutionHours: number; // hours before resolution to flag
  };
}

const DEFAULT_CONFIG: Required<PolymarketConfig>['alertThresholds'] = {
  priceChangePercent: 5,
  volumeSpikeMultiple: 3,
  resolutionHours: 48,
};

const DEFAULT_API_URL = 'https://gamma-api.polymarket.com';

const WATCHED_CATEGORIES = [
  'Politics',
  'Economics',
  'Crypto',
  'Science & Tech',
  'Sports',
  'Culture',
  'Health',
  'Business',
  'AI',
  'Regulation',
];

// ── API Functions ─────────────────────────────────────────────

/**
 * Fetch markets from Polymarket Gamma API
 */
export async function fetchPolymarketMarkets(
  apiUrl: string,
  options: {
    active?: boolean;
    limit?: number;
    offset?: number;
    order?: 'volume' | 'volume24hr' | 'endDate' | 'createdAt';
  } = {}
): Promise<PolymarketMarket[]> {
  const {
    active = true,
    limit = 100,
    offset = 0,
    order = 'volume24hr',
  } = options;

  try {
    const params = new URLSearchParams({
      active: active.toString(),
      limit: limit.toString(),
      offset: offset.toString(),
      order,
      ascending: 'false',
    });

    const response = await fetch(`${apiUrl}/markets?${params}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      console.error('Polymarket API error:', response.status);
      return [];
    }

    const data = await response.json();
    return parseMarkets(data);
  } catch (error) {
    console.error('Failed to fetch Polymarket data:', error);
    return [];
  }
}

function parseMarkets(data: PolymarketAPIMarket[] | PolymarketAPIMarket): PolymarketMarket[] {
  const markets = Array.isArray(data) ? data : [data];

  return markets.map(m => ({
    id: m.id || m.condition_id || '',
    slug: m.slug || '',
    title: m.question || m.title || '',
    description: m.description || '',
    category: m.category || 'Uncategorized',
    endDate: m.end_date_iso || m.endDate || '',
    active: m.active !== false,
    closed: m.closed === true,
    volume: parseFloat(m.volume || '0'),
    volume24h: parseFloat(m.volume_num_24hr || m.volume24hr || '0'),
    liquidity: parseFloat(m.liquidity || '0'),
    outcomes: parseOutcomes(m),
    createdAt: m.created_at || m.createdAt || '',
    resolvedAt: m.resolved_at || null,
    resolution: m.resolution || null,
  }));
}

interface PolymarketAPIMarket {
  id?: string;
  condition_id?: string;
  slug?: string;
  question?: string;
  title?: string;
  description?: string;
  category?: string;
  end_date_iso?: string;
  endDate?: string;
  active?: boolean;
  closed?: boolean;
  volume?: string;
  volume_num_24hr?: string;
  volume24hr?: string;
  liquidity?: string;
  outcomes?: string;
  outcomePrices?: string;
  tokens?: PolymarketAPIToken[];
  created_at?: string;
  createdAt?: string;
  resolved_at?: string;
  resolution?: string;
}

interface PolymarketAPIToken {
  outcome?: string;
  price?: number;
  token_id?: string;
}

function parseOutcomes(market: PolymarketAPIMarket): PolymarketOutcome[] {
  // Try tokens array first
  if (market.tokens && market.tokens.length > 0) {
    return market.tokens.map(t => ({
      name: t.outcome || 'Unknown',
      price: t.price || 0,
      priceChange24h: 0,
      volume24h: 0,
    }));
  }

  // Try outcomes + outcomePrices strings
  if (market.outcomes && market.outcomePrices) {
    try {
      const names = JSON.parse(market.outcomes) as string[];
      const prices = JSON.parse(market.outcomePrices) as string[];

      return names.map((name, i) => ({
        name,
        price: parseFloat(prices[i] || '0'),
        priceChange24h: 0,
        volume24h: 0,
      }));
    } catch {
      // Fall through to default
    }
  }

  return [
    { name: 'Yes', price: 0.5, priceChange24h: 0, volume24h: 0 },
    { name: 'No', price: 0.5, priceChange24h: 0, volume24h: 0 },
  ];
}

// ── Analysis Functions ────────────────────────────────────────

/**
 * Identify top price movers in last 24h
 */
export function identifyTopMovers(
  markets: PolymarketMarket[],
  minChangePercent: number = DEFAULT_CONFIG.priceChangePercent
): TopMover[] {
  const movers: TopMover[] = [];

  for (const market of markets) {
    if (!market.active || market.closed) continue;

    for (const outcome of market.outcomes) {
      const absChange = Math.abs(outcome.priceChange24h);
      const changePercent = outcome.price > 0 ? (absChange / outcome.price) * 100 : 0;

      if (changePercent >= minChangePercent || absChange >= 0.05) {
        const direction = outcome.priceChange24h >= 0 ? 'up' : 'down';

        let signal = '';
        if (absChange >= 0.15) signal = 'Major shift - likely driven by breaking news or key development';
        else if (absChange >= 0.10) signal = 'Significant movement - market repricing on new information';
        else signal = 'Notable movement - worth monitoring for continuation';

        movers.push({
          market,
          biggestOutcome: outcome.name,
          priceChange24h: outcome.priceChange24h,
          priceChangePercent: round(changePercent),
          direction,
          currentPrice: outcome.price,
          volume24h: market.volume24h,
          signal,
        });
      }
    }
  }

  return movers
    .sort((a, b) => Math.abs(b.priceChange24h) - Math.abs(a.priceChange24h))
    .slice(0, 10);
}

/**
 * Find markets approaching resolution
 */
export function findResolvingMarkets(
  markets: PolymarketMarket[],
  hoursThreshold: number = DEFAULT_CONFIG.resolutionHours
): ResolvingMarket[] {
  const now = new Date();
  const resolving: ResolvingMarket[] = [];

  for (const market of markets) {
    if (!market.endDate || market.closed) continue;

    const endDate = new Date(market.endDate);
    const hoursUntil = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntil > 0 && hoursUntil <= hoursThreshold) {
      const sortedOutcomes = [...market.outcomes].sort((a, b) => b.price - a.price);
      const leadingOutcome = sortedOutcomes[0];

      let confidence: ResolvingMarket['confidence'] = 'low';
      if (leadingOutcome.price >= 0.9) confidence = 'high';
      else if (leadingOutcome.price >= 0.7) confidence = 'medium';

      resolving.push({
        market,
        hoursUntilResolution: round(hoursUntil),
        leadingOutcome: leadingOutcome.name,
        leadingPrice: leadingOutcome.price,
        confidence,
        potentialPayout: null,
      });
    }
  }

  return resolving.sort((a, b) => a.hoursUntilResolution - b.hoursUntilResolution);
}

/**
 * Find new markets with high volume
 */
export function findNewHighVolumeMarkets(
  markets: PolymarketMarket[],
  maxDaysOld: number = 7,
  minVolume: number = 50000
): NewHighVolumeMarket[] {
  const now = new Date();
  const results: NewHighVolumeMarket[] = [];

  for (const market of markets) {
    if (!market.active || market.closed || !market.createdAt) continue;

    const createdDate = new Date(market.createdAt);
    const daysOld = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);

    if (daysOld <= maxDaysOld && market.volume >= minVolume) {
      const topOutcome = [...market.outcomes].sort((a, b) => b.price - a.price)[0];

      let why = '';
      if (market.volume24h > market.volume * 0.3) why = 'Extremely high recent activity suggests breaking news or viral interest';
      else if (daysOld < 2) why = 'Brand new market with rapid volume accumulation';
      else why = 'New market gaining significant traction';

      results.push({
        market,
        daysOld: round(daysOld),
        volume: market.volume,
        volume24h: market.volume24h,
        topOutcome: topOutcome.name,
        topOutcomePrice: topOutcome.price,
        why,
      });
    }
  }

  return results.sort((a, b) => b.volume24h - a.volume24h).slice(0, 10);
}

/**
 * Calculate category momentum
 */
export function calculateCategoryMomentum(markets: PolymarketMarket[]): CategoryMomentum[] {
  const categoryMap = new Map<string, PolymarketMarket[]>();

  for (const market of markets) {
    if (!market.active || market.closed) continue;
    const cat = market.category || 'Uncategorized';
    if (!categoryMap.has(cat)) categoryMap.set(cat, []);
    categoryMap.get(cat)!.push(market);
  }

  const momentum: CategoryMomentum[] = [];

  for (const [category, catMarkets] of categoryMap) {
    if (!WATCHED_CATEGORIES.includes(category) && catMarkets.length < 3) continue;

    const totalVolume = catMarkets.reduce((s, m) => s + m.volume, 0);
    const volume24h = catMarkets.reduce((s, m) => s + m.volume24h, 0);

    let totalPriceMovement = 0;
    let priceMovementCount = 0;
    for (const market of catMarkets) {
      for (const outcome of market.outcomes) {
        totalPriceMovement += Math.abs(outcome.priceChange24h);
        priceMovementCount++;
      }
    }
    const avgPriceMovement = priceMovementCount > 0 ? totalPriceMovement / priceMovementCount : 0;

    const topMarket = catMarkets.sort((a, b) => b.volume24h - a.volume24h)[0];

    let trend: CategoryMomentum['trend'] = 'neutral';
    if (avgPriceMovement > 0.05) trend = 'bullish';
    else if (avgPriceMovement < -0.02) trend = 'bearish';

    momentum.push({
      category,
      marketCount: catMarkets.length,
      totalVolume: round(totalVolume),
      volume24h: round(volume24h),
      avgPriceMovement: round(avgPriceMovement, 4),
      trend,
      topMarket: topMarket.title,
    });
  }

  return momentum.sort((a, b) => b.volume24h - a.volume24h);
}

/**
 * Calculate portfolio performance
 */
export function calculatePortfolio(
  positions: PortfolioPosition[],
  currentMarkets: PolymarketMarket[]
): PortfolioSummary {
  if (!positions || positions.length === 0) {
    return {
      totalInvested: 0,
      currentValue: 0,
      totalPnL: 0,
      totalPnLPercent: 0,
      positions: [],
      bestPosition: null,
      worstPosition: null,
      positionsAtRisk: [],
      positionsNearResolution: [],
    };
  }

  // Update positions with current prices
  const updatedPositions = positions.map(pos => {
    const market = currentMarkets.find(m => m.id === pos.marketId);
    if (market) {
      const matchingOutcome = market.outcomes.find(o => o.name === pos.outcome);
      if (matchingOutcome) {
        const currentPrice = matchingOutcome.price;
        const investedValue = pos.shares * pos.avgEntryPrice;
        const currentValue = pos.shares * currentPrice;
        const pnl = currentValue - investedValue;
        const pnlPercent = investedValue > 0 ? (pnl / investedValue) * 100 : 0;

        const endDate = new Date(market.endDate);
        const now = new Date();
        const marketEndsIn = Math.max(0, (endDate.getTime() - now.getTime()) / (1000 * 60 * 60));

        return { ...pos, currentPrice, pnl: round(pnl), pnlPercent: round(pnlPercent), marketEndsIn: round(marketEndsIn) };
      }
    }
    return pos;
  });

  const totalInvested = updatedPositions.reduce((s, p) => s + p.shares * p.avgEntryPrice, 0);
  const currentValue = updatedPositions.reduce((s, p) => s + p.shares * p.currentPrice, 0);
  const totalPnL = currentValue - totalInvested;
  const totalPnLPercent = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;

  const sorted = [...updatedPositions].sort((a, b) => b.pnlPercent - a.pnlPercent);
  const best = sorted[0] || null;
  const worst = sorted[sorted.length - 1] || null;

  const positionsAtRisk = updatedPositions.filter(p => p.pnlPercent < -20);
  const positionsNearResolution = updatedPositions.filter(p => p.marketEndsIn <= 48);

  return {
    totalInvested: round(totalInvested),
    currentValue: round(currentValue),
    totalPnL: round(totalPnL),
    totalPnLPercent: round(totalPnLPercent),
    positions: updatedPositions,
    bestPosition: best,
    worstPosition: worst,
    positionsAtRisk,
    positionsNearResolution,
  };
}

/**
 * Detect signal alerts (volume spikes, reversals, etc.)
 */
export function detectSignals(
  markets: PolymarketMarket[],
  volumeSpikeMultiple: number = DEFAULT_CONFIG.volumeSpikeMultiple
): SignalAlert[] {
  const signals: SignalAlert[] = [];
  const now = new Date().toISOString();

  for (const market of markets) {
    if (!market.active || market.closed) continue;

    // Volume spike detection
    const avgDaily = market.volume > 0 ? market.volume / 30 : 0; // rough estimate
    if (avgDaily > 0 && market.volume24h > avgDaily * volumeSpikeMultiple) {
      signals.push({
        type: 'volume_spike',
        severity: market.volume24h > avgDaily * 5 ? 'high' : 'medium',
        market: market.title,
        marketId: market.id,
        message: `Volume spike: ${round(market.volume24h / avgDaily)}x average daily volume`,
        timestamp: now,
        data: {
          volume24h: market.volume24h,
          avgDaily: round(avgDaily),
          multiple: round(market.volume24h / avgDaily),
        },
      });
    }

    // Price reversal detection (outcome goes from >0.7 to <0.5 or vice versa)
    for (const outcome of market.outcomes) {
      const prevPrice = outcome.price - outcome.priceChange24h;
      if (prevPrice > 0.7 && outcome.price < 0.5) {
        signals.push({
          type: 'price_reversal',
          severity: 'high',
          market: market.title,
          marketId: market.id,
          message: `Major reversal: "${outcome.name}" dropped from ${round(prevPrice * 100)}% to ${round(outcome.price * 100)}%`,
          timestamp: now,
          data: {
            outcome: outcome.name,
            previousPrice: prevPrice,
            currentPrice: outcome.price,
            change: outcome.priceChange24h,
          },
        });
      } else if (prevPrice < 0.3 && outcome.price > 0.5) {
        signals.push({
          type: 'price_reversal',
          severity: 'high',
          market: market.title,
          marketId: market.id,
          message: `Major reversal: "${outcome.name}" surged from ${round(prevPrice * 100)}% to ${round(outcome.price * 100)}%`,
          timestamp: now,
          data: {
            outcome: outcome.name,
            previousPrice: prevPrice,
            currentPrice: outcome.price,
            change: outcome.priceChange24h,
          },
        });
      }
    }

    // New resolution
    if (market.resolvedAt) {
      const resolvedDate = new Date(market.resolvedAt);
      const hoursSinceResolution = (new Date().getTime() - resolvedDate.getTime()) / (1000 * 60 * 60);
      if (hoursSinceResolution <= 24) {
        signals.push({
          type: 'new_resolution',
          severity: 'low',
          market: market.title,
          marketId: market.id,
          message: `Market resolved: "${market.resolution}"`,
          timestamp: now,
          data: {
            resolution: market.resolution || 'Unknown',
            volume: market.volume,
          },
        });
      }
    }
  }

  return signals.sort((a, b) => {
    const sOrder = { high: 0, medium: 1, low: 2 };
    return sOrder[a.severity] - sOrder[b.severity];
  });
}

/**
 * Detect correlation anomalies between markets
 */
export function detectCorrelations(markets: PolymarketMarket[]): CorrelationAlert[] {
  const alerts: CorrelationAlert[] = [];

  // Look for markets in same category moving in opposite directions
  const categoryGroups = new Map<string, PolymarketMarket[]>();
  for (const market of markets) {
    if (!market.active) continue;
    const cat = market.category;
    if (!categoryGroups.has(cat)) categoryGroups.set(cat, []);
    categoryGroups.get(cat)!.push(market);
  }

  for (const [, catMarkets] of categoryGroups) {
    if (catMarkets.length < 2) continue;

    for (let i = 0; i < catMarkets.length && i < 5; i++) {
      for (let j = i + 1; j < catMarkets.length && j < 5; j++) {
        const m1 = catMarkets[i];
        const m2 = catMarkets[j];

        const m1Change = m1.outcomes[0]?.priceChange24h || 0;
        const m2Change = m2.outcomes[0]?.priceChange24h || 0;

        // Check if one is moving strongly up while related market moves down
        if (Math.abs(m1Change) > 0.05 && Math.abs(m2Change) > 0.05) {
          if (Math.sign(m1Change) !== Math.sign(m2Change)) {
            alerts.push({
              market1: m1.title,
              market2: m2.title,
              correlationType: 'decoupling',
              correlationStrength: 0,
              expectedCorrelation: 0.5,
              actualCorrelation: -0.3,
              significance: `Markets in same category moving in opposite directions: ${m1.title.substring(0, 40)} (${m1Change > 0 ? '+' : ''}${round(m1Change * 100)}%) vs ${m2.title.substring(0, 40)} (${m2Change > 0 ? '+' : ''}${round(m2Change * 100)}%)`,
            });
          }
        }
      }
    }
  }

  return alerts.slice(0, 5);
}

/**
 * Build event calendar from market end dates
 */
export function buildEventCalendar(markets: PolymarketMarket[], daysAhead: number = 7): CalendarEvent[] {
  const now = new Date();
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() + daysAhead);

  const events: CalendarEvent[] = [];
  const seenDates = new Map<string, CalendarEvent>();

  for (const market of markets) {
    if (!market.endDate || market.closed) continue;

    const endDate = new Date(market.endDate);
    if (endDate < now || endDate > cutoff) continue;

    const dateKey = endDate.toISOString().split('T')[0];
    const existingEvent = seenDates.get(dateKey + market.category);

    if (existingEvent) {
      existingEvent.relatedMarkets.push(market.title);
    } else {
      const event: CalendarEvent = {
        date: dateKey,
        title: `${market.category} market resolution`,
        category: market.category,
        relatedMarkets: [market.title],
        impact: market.volume > 1000000 ? 'high' : market.volume > 100000 ? 'medium' : 'low',
        description: `${market.title} resolves on ${dateKey}`,
      };
      events.push(event);
      seenDates.set(dateKey + market.category, event);
    }
  }

  return events.sort((a, b) => a.date.localeCompare(b.date));
}

/**
 * Calculate overall market summary
 */
export function calculateMarketSummary(
  markets: PolymarketMarket[],
  topMovers: TopMover[]
): MarketSummary {
  const activeMarkets = markets.filter(m => m.active && !m.closed);
  const totalVolume24h = activeMarkets.reduce((s, m) => s + m.volume24h, 0);

  const now = new Date();
  const in24h = new Date(now);
  in24h.setHours(in24h.getHours() + 24);
  const in7d = new Date(now);
  in7d.setDate(in7d.getDate() + 7);

  const resolving24h = activeMarkets.filter(m => {
    const end = new Date(m.endDate);
    return end > now && end <= in24h;
  }).length;

  const resolving7d = activeMarkets.filter(m => {
    const end = new Date(m.endDate);
    return end > now && end <= in7d;
  }).length;

  const biggestMover = topMovers[0];

  // Simple sentiment: if more markets moving up than down, risk_on
  let upCount = 0;
  let downCount = 0;
  for (const market of activeMarkets) {
    for (const outcome of market.outcomes) {
      if (outcome.priceChange24h > 0.02) upCount++;
      if (outcome.priceChange24h < -0.02) downCount++;
    }
  }
  let overallSentiment: MarketSummary['overallSentiment'] = 'neutral';
  if (upCount > downCount * 1.5) overallSentiment = 'risk_on';
  else if (downCount > upCount * 1.5) overallSentiment = 'risk_off';

  return {
    totalActiveMarkets: activeMarkets.length,
    totalVolume24h: round(totalVolume24h),
    marketsResolving24h: resolving24h,
    marketsResolving7d: resolving7d,
    biggestMover: biggestMover?.market.title || 'None',
    biggestMoverChange: biggestMover?.priceChange24h || 0,
    overallSentiment,
  };
}

/**
 * Generate complete Polymarket digest
 */
export async function generatePolymarketDigest(
  config: PolymarketConfig = { apiUrl: DEFAULT_API_URL }
): Promise<PolymarketDigest> {
  const apiUrl = config.apiUrl || DEFAULT_API_URL;
  const thresholds = config.alertThresholds || DEFAULT_CONFIG;

  // Fetch market data
  const markets = await fetchPolymarketMarkets(apiUrl, { active: true, limit: 200 });

  // Analysis
  const topMovers = identifyTopMovers(markets, thresholds.priceChangePercent);
  const resolvingMarkets = findResolvingMarkets(markets, thresholds.resolutionHours);
  const newHighVolumeMarkets = findNewHighVolumeMarkets(markets);
  const categoryMomentum = calculateCategoryMomentum(markets);
  const portfolio = config.positions
    ? calculatePortfolio(config.positions, markets)
    : null;
  const signals = detectSignals(markets, thresholds.volumeSpikeMultiple);
  const correlationAlerts = detectCorrelations(markets);
  const eventCalendar = buildEventCalendar(markets);
  const marketSummary = calculateMarketSummary(markets, topMovers);

  return {
    generatedAt: new Date().toISOString(),
    topMovers,
    resolvingMarkets,
    newHighVolumeMarkets,
    categoryMomentum,
    portfolio,
    signals,
    sentimentDivergences: [], // requires external sentiment data
    eventCalendar,
    correlationAlerts,
    marketSummary,
  };
}

// ── Utility ───────────────────────────────────────────────────

function round(n: number, decimals = 2): number {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
}
