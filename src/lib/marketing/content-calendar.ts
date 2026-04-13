/**
 * Content Calendar & Automation Engine for Rani Beauty Clinic
 *
 * Generates 30/60/90-day content plans with topic clustering by service category,
 * SEO keyword mapping, performance scoring, repurposing suggestions, and seasonal
 * content triggers. Integrates with the existing social auto-post engine.
 *
 * IMPORTANT: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── Types ─────────────────────────────────────────────────────────────────

export interface ContentPiece {
  id: string;
  title: string;
  type: ContentType;
  category: ServiceCategory;
  topic: string;
  keywords: string[];
  targetPersona?: string;
  status: ContentStatus;
  scheduledDate?: string; // ISO date
  publishedDate?: string;
  author?: string;
  channel: ContentChannel[];
  estimatedTime: number; // minutes to create
  priority: 'high' | 'medium' | 'low';
  seasonalTrigger?: string;
  notes?: string;
}

export type ContentType =
  | 'blog_post'
  | 'social_post'
  | 'email_newsletter'
  | 'video_script'
  | 'infographic'
  | 'case_study'
  | 'how_to_guide'
  | 'faq'
  | 'testimonial'
  | 'before_after'
  | 'behind_the_scenes'
  | 'educational_reel'
  | 'story_series';

export type ContentChannel = 'blog' | 'instagram' | 'facebook' | 'tiktok' | 'email' | 'google_business' | 'youtube';

export type ContentStatus = 'idea' | 'planned' | 'in_progress' | 'review' | 'scheduled' | 'published' | 'repurposed';

export type ServiceCategory =
  | 'skin_tightening'
  | 'facials'
  | 'injectables'
  | 'laser'
  | 'peels'
  | 'body'
  | 'wellness_injections'
  | 'weight_loss'
  | 'hair_restoration'
  | 'membership'
  | 'general'
  | 'seasonal';

export interface ContentCalendar {
  period: '30_day' | '60_day' | '90_day';
  startDate: string;
  endDate: string;
  pieces: ContentPiece[];
  weeklyBreakdown: WeeklyContent[];
  topicClusters: TopicCluster[];
  totalPieces: number;
  byType: Record<ContentType, number>;
  byChannel: Record<ContentChannel, number>;
}

export interface WeeklyContent {
  weekNumber: number;
  startDate: string;
  endDate: string;
  theme: string;
  pieces: ContentPiece[];
  totalPieces: number;
}

export interface TopicCluster {
  category: ServiceCategory;
  pillarTopic: string;
  subtopics: string[];
  keywords: string[];
  contentCount: number;
  coverageScore: number; // 0-100 how well covered this topic is
}

export interface ContentPerformance {
  pieceId: string;
  title: string;
  type: ContentType;
  channel: ContentChannel;
  publishedDate: string;
  metrics: {
    pageViews?: number;
    uniqueVisitors?: number;
    avgTimeOnPage?: number;
    bounceRate?: number;
    socialShares?: number;
    comments?: number;
    likes?: number;
    saves?: number;
    emailOpens?: number;
    emailClicks?: number;
    conversions?: number;
    conversionRate?: number;
  };
  performanceScore: number; // 0-100
  roi?: number;
}

export interface RepurposingSuggestion {
  originalPiece: string; // ID or title
  originalType: ContentType;
  suggestions: {
    newType: ContentType;
    newChannel: ContentChannel;
    description: string;
    estimatedTime: number;
    priority: 'high' | 'medium' | 'low';
  }[];
}

export interface CompetitorContentGap {
  topic: string;
  category: ServiceCategory;
  competitorsCovering: number;
  ourCoverage: 'none' | 'partial' | 'full';
  opportunity: 'high' | 'medium' | 'low';
  suggestedContent: string;
  suggestedKeywords: string[];
}

export interface ContentROI {
  totalPieces: number;
  totalInvestment: number; // estimated time cost
  totalConversions: number;
  totalRevenue: number;
  avgPerformanceScore: number;
  topPerformers: ContentPerformance[];
  underperformers: ContentPerformance[];
  roiByType: Record<ContentType, { pieces: number; conversions: number; avgScore: number }>;
  roiByChannel: Record<ContentChannel, { pieces: number; conversions: number; avgScore: number }>;
}

// ── Constants ─────────────────────────────────────────────────────────────

/** Rani's service-specific topic clusters */
const TOPIC_CLUSTERS: TopicCluster[] = [
  {
    category: 'skin_tightening',
    pillarTopic: 'Non-Invasive Skin Tightening with Sofwave',
    subtopics: [
      'Sofwave vs surgical facelift',
      'What to expect during a Sofwave session',
      'Sofwave results timeline and longevity',
      'Is Sofwave right for your skin type?',
      'Combining Sofwave with other treatments',
    ],
    keywords: ['sofwave', 'skin tightening', 'non-invasive facelift', 'SUPERB technology', 'collagen stimulation'],
    contentCount: 0,
    coverageScore: 0,
  },
  {
    category: 'facials',
    pillarTopic: 'Medical-Grade Facials for Every Skin Concern',
    subtopics: [
      'HydraFacial: more than just a facial',
      'PRX-T33 biorevitalization explained',
      'VI Peel for hyperpigmentation and melasma',
      'How often should you get a facial?',
      'Pre and post facial skincare routine',
    ],
    keywords: ['hydrafacial', 'medical facial', 'prx-t33', 'vi peel', 'skin rejuvenation'],
    contentCount: 0,
    coverageScore: 0,
  },
  {
    category: 'injectables',
    pillarTopic: 'The Art of Injectable Treatments',
    subtopics: [
      'Botox for beginners: what to know',
      'Dermal fillers: natural-looking enhancement',
      'Injectable maintenance schedules',
      'Choosing the right provider for injectables',
      'Common injectable myths debunked',
    ],
    keywords: ['botox', 'dermal fillers', 'injectable treatments', 'wrinkle reduction', 'lip fillers'],
    contentCount: 0,
    coverageScore: 0,
  },
  {
    category: 'laser',
    pillarTopic: 'Advanced Laser Treatments',
    subtopics: [
      'PicoWay laser for pigmentation removal',
      'RF Microneedling for skin texture',
      'Laser hair removal: the complete guide',
      'Laser treatment downtime and recovery',
      'Which laser treatment is right for you?',
    ],
    keywords: ['picoway', 'rf microneedling', 'laser hair removal', 'laser skin treatment', 'pigmentation removal'],
    contentCount: 0,
    coverageScore: 0,
  },
  {
    category: 'wellness_injections',
    pillarTopic: 'Wellness Injections for Optimal Health',
    subtopics: [
      'NAD+ injection benefits for energy and aging',
      'Glutathione injection for skin brightening',
      'B12 injection for metabolism and energy',
      'Tri-Immune injection for immunity',
      'Vitamin D3 injection: why oral supplements fall short',
    ],
    keywords: ['wellness injections', 'nad+', 'glutathione', 'b12 injection', 'vitamin injection'],
    contentCount: 0,
    coverageScore: 0,
  },
  {
    category: 'weight_loss',
    pillarTopic: 'Medically-Supervised Weight Loss with GLP-1',
    subtopics: [
      'How GLP-1 medications work for weight loss',
      'GLP-1 program: what to expect month by month',
      'Nutrition and lifestyle alongside GLP-1',
      'GLP-1 vs other weight loss approaches',
      'Managing GLP-1 side effects',
    ],
    keywords: ['glp-1', 'weight loss', 'semaglutide', 'medical weight loss', 'weight management'],
    contentCount: 0,
    coverageScore: 0,
  },
  {
    category: 'hair_restoration',
    pillarTopic: 'Hair Restoration Solutions',
    subtopics: [
      'Folix hair restoration: how it works',
      'Understanding hair loss causes',
      'Hair restoration results timeline',
      'Combining treatments for maximum hair growth',
    ],
    keywords: ['hair restoration', 'hair loss treatment', 'folix', 'hair growth', 'thinning hair'],
    contentCount: 0,
    coverageScore: 0,
  },
];

/** Seasonal content triggers for medspa marketing */
const SEASONAL_TRIGGERS: {
  month: number;
  trigger: string;
  topics: string[];
  category: ServiceCategory;
}[] = [
  { month: 1, trigger: 'New Year / New You', topics: ['New year skin reset', 'Treatment planning for the year', 'GLP-1 weight loss goals'], category: 'general' },
  { month: 2, trigger: 'Valentine\'s Day', topics: ['Date-night glow-up', 'Couples treatment packages', 'Injectable touch-ups'], category: 'injectables' },
  { month: 3, trigger: 'Spring Renewal', topics: ['Spring skin prep', 'Laser hair removal season starts', 'Peel away winter damage'], category: 'laser' },
  { month: 4, trigger: 'Pre-Summer Prep', topics: ['Body contouring timeline', 'Sun protection essentials', 'Start laser hair removal now'], category: 'body' },
  { month: 5, trigger: 'Mother\'s Day / Graduation', topics: ['Gift certificates', 'Mother-daughter treatments', 'Graduation glow packages'], category: 'general' },
  { month: 6, trigger: 'Summer Glow', topics: ['Summer-safe treatments', 'HydraFacial for summer hydration', 'Glutathione for sun protection'], category: 'facials' },
  { month: 7, trigger: 'Mid-Year Check-in', topics: ['Treatment plan review', 'Membership benefits refresh', 'Summer skin maintenance'], category: 'membership' },
  { month: 8, trigger: 'Back to School / Fall Prep', topics: ['Back to routine self-care', 'Fall treatment planning', 'Peel season approaches'], category: 'peels' },
  { month: 9, trigger: 'Fall Peel Season', topics: ['VI Peel for fall renewal', 'Laser treatments in cooler months', 'Sofwave before holidays'], category: 'skin_tightening' },
  { month: 10, trigger: 'Pre-Holiday Glow', topics: ['Holiday party prep timeline', 'Injectable timing for events', 'Gifting self-care'], category: 'injectables' },
  { month: 11, trigger: 'Black Friday / Gift Season', topics: ['Gift card specials', 'Package deals', 'Year-end treatment plans'], category: 'general' },
  { month: 12, trigger: 'Holiday Glow / Year-End', topics: ['Last-minute glow-ups', 'New year prep treatments', 'Year in review results'], category: 'seasonal' },
];

/** Content type to estimated creation time (minutes) */
const CREATION_TIME: Record<ContentType, number> = {
  blog_post: 180,
  social_post: 30,
  email_newsletter: 90,
  video_script: 120,
  infographic: 150,
  case_study: 240,
  how_to_guide: 200,
  faq: 60,
  testimonial: 45,
  before_after: 30,
  behind_the_scenes: 20,
  educational_reel: 60,
  story_series: 45,
};

/** Weekly content mix template */
const WEEKLY_MIX: { type: ContentType; channel: ContentChannel[]; count: number }[] = [
  { type: 'social_post', channel: ['instagram', 'facebook'], count: 3 },
  { type: 'educational_reel', channel: ['instagram', 'tiktok'], count: 2 },
  { type: 'story_series', channel: ['instagram'], count: 2 },
  { type: 'blog_post', channel: ['blog'], count: 1 },
  { type: 'google_business' as ContentType, channel: ['google_business'], count: 1 },
  { type: 'email_newsletter', channel: ['email'], count: 0.25 }, // 1 per month
];

// ── Content Calendar Generation ───────────────────────────────────────────

let contentIdCounter = 0;
function generateContentId(): string {
  contentIdCounter++;
  return `content_${Date.now()}_${contentIdCounter}`;
}

/**
 * Generate a content calendar for 30, 60, or 90 days.
 */
export function generateContentCalendar(
  period: '30_day' | '60_day' | '90_day',
  startDate?: string,
): ContentCalendar {
  const start = startDate ? new Date(startDate) : new Date();
  start.setUTCHours(0, 0, 0, 0);

  const daysMap = { '30_day': 30, '60_day': 60, '90_day': 90 };
  const totalDays = daysMap[period];
  const end = new Date(start.getTime() + totalDays * 86400000);

  const weeks = Math.ceil(totalDays / 7);
  const pieces: ContentPiece[] = [];
  const weeklyBreakdown: WeeklyContent[] = [];

  // Rotate through categories to ensure even coverage
  const categories: ServiceCategory[] = [
    'skin_tightening', 'facials', 'injectables', 'laser',
    'wellness_injections', 'weight_loss', 'hair_restoration',
  ];

  for (let w = 0; w < weeks; w++) {
    const weekStart = new Date(start.getTime() + w * 7 * 86400000);
    const weekEnd = new Date(weekStart.getTime() + 6 * 86400000);
    const weekMonth = weekStart.getMonth() + 1;

    // Get seasonal trigger for this week
    const seasonal = SEASONAL_TRIGGERS.find(s => s.month === weekMonth);
    const weekTheme = seasonal?.trigger || `Week ${w + 1}`;

    // Primary category for this week (rotate)
    const primaryCategory = categories[w % categories.length];
    const cluster = TOPIC_CLUSTERS.find(c => c.category === primaryCategory);
    const subtopicIdx = w % (cluster?.subtopics.length || 1);

    const weekPieces: ContentPiece[] = [];

    // Blog post (1/week)
    if (cluster) {
      const blogPiece: ContentPiece = {
        id: generateContentId(),
        title: cluster.subtopics[subtopicIdx] || `${cluster.pillarTopic} — Part ${w + 1}`,
        type: 'blog_post',
        category: primaryCategory,
        topic: cluster.pillarTopic,
        keywords: cluster.keywords,
        status: 'planned',
        scheduledDate: new Date(weekStart.getTime() + 2 * 86400000).toISOString().slice(0, 10), // Wednesday
        channel: ['blog'],
        estimatedTime: CREATION_TIME.blog_post,
        priority: 'high',
        seasonalTrigger: seasonal?.trigger,
      };
      weekPieces.push(blogPiece);
    }

    // Social posts (3/week)
    for (let d = 0; d < 3; d++) {
      const dayOffset = [1, 3, 5][d]; // Mon, Wed, Fri
      const socialCategory = d === 0 ? primaryCategory : categories[(w + d) % categories.length];
      const socialCluster = TOPIC_CLUSTERS.find(c => c.category === socialCategory);

      weekPieces.push({
        id: generateContentId(),
        title: `${socialCluster?.subtopics[(w + d) % (socialCluster?.subtopics.length || 1)] || weekTheme} — Social`,
        type: 'social_post',
        category: socialCategory,
        topic: socialCluster?.pillarTopic || weekTheme,
        keywords: socialCluster?.keywords.slice(0, 3) || [],
        status: 'planned',
        scheduledDate: new Date(weekStart.getTime() + dayOffset * 86400000).toISOString().slice(0, 10),
        channel: ['instagram', 'facebook'],
        estimatedTime: CREATION_TIME.social_post,
        priority: 'medium',
        seasonalTrigger: seasonal?.trigger,
      });
    }

    // Educational reels (2/week)
    for (let r = 0; r < 2; r++) {
      const reelDay = [2, 4][r]; // Tue, Thu
      weekPieces.push({
        id: generateContentId(),
        title: `${primaryCategory.replace(/_/g, ' ')} — Quick Tip ${w * 2 + r + 1}`,
        type: 'educational_reel',
        category: primaryCategory,
        topic: cluster?.pillarTopic || '',
        keywords: cluster?.keywords.slice(0, 2) || [],
        status: 'planned',
        scheduledDate: new Date(weekStart.getTime() + reelDay * 86400000).toISOString().slice(0, 10),
        channel: ['instagram', 'tiktok'],
        estimatedTime: CREATION_TIME.educational_reel,
        priority: 'medium',
      });
    }

    // Seasonal content (if applicable)
    if (seasonal && w % 4 === 0) {
      weekPieces.push({
        id: generateContentId(),
        title: seasonal.topics[0] || seasonal.trigger,
        type: 'social_post',
        category: 'seasonal',
        topic: seasonal.trigger,
        keywords: [seasonal.trigger.toLowerCase().replace(/\s+/g, '-')],
        status: 'planned',
        scheduledDate: weekStart.toISOString().slice(0, 10),
        channel: ['instagram', 'facebook', 'email'],
        estimatedTime: CREATION_TIME.social_post,
        priority: 'high',
        seasonalTrigger: seasonal.trigger,
      });
    }

    // Email newsletter (1/month — every 4th week)
    if (w % 4 === 0) {
      weekPieces.push({
        id: generateContentId(),
        title: `Monthly Newsletter: ${weekTheme}`,
        type: 'email_newsletter',
        category: 'general',
        topic: weekTheme,
        keywords: [],
        status: 'planned',
        scheduledDate: new Date(weekStart.getTime() + 4 * 86400000).toISOString().slice(0, 10), // Friday
        channel: ['email'],
        estimatedTime: CREATION_TIME.email_newsletter,
        priority: 'high',
      });
    }

    pieces.push(...weekPieces);
    weeklyBreakdown.push({
      weekNumber: w + 1,
      startDate: weekStart.toISOString().slice(0, 10),
      endDate: weekEnd.toISOString().slice(0, 10),
      theme: weekTheme,
      pieces: weekPieces,
      totalPieces: weekPieces.length,
    });
  }

  // Aggregate stats
  const byType: Record<string, number> = {};
  const byChannel: Record<string, number> = {};
  for (const p of pieces) {
    byType[p.type] = (byType[p.type] || 0) + 1;
    for (const ch of p.channel) {
      byChannel[ch] = (byChannel[ch] || 0) + 1;
    }
  }

  return {
    period,
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
    pieces,
    weeklyBreakdown,
    topicClusters: TOPIC_CLUSTERS.map(c => ({
      ...c,
      contentCount: pieces.filter(p => p.category === c.category).length,
      coverageScore: Math.min(100, Math.round((pieces.filter(p => p.category === c.category).length / 5) * 100)),
    })),
    totalPieces: pieces.length,
    byType: byType as Record<ContentType, number>,
    byChannel: byChannel as Record<ContentChannel, number>,
  };
}

/**
 * Score content performance on a 0-100 scale.
 */
export function scoreContentPerformance(metrics: ContentPerformance['metrics']): number {
  let score = 0;
  let factors = 0;

  if (metrics.pageViews !== undefined) {
    score += Math.min(25, (metrics.pageViews / 500) * 25);
    factors++;
  }
  if (metrics.avgTimeOnPage !== undefined) {
    score += Math.min(20, (metrics.avgTimeOnPage / 180) * 20); // 3 min = max
    factors++;
  }
  if (metrics.socialShares !== undefined) {
    score += Math.min(15, (metrics.socialShares / 50) * 15);
    factors++;
  }
  if (metrics.likes !== undefined) {
    score += Math.min(15, (metrics.likes / 200) * 15);
    factors++;
  }
  if (metrics.conversions !== undefined) {
    score += Math.min(25, (metrics.conversions / 5) * 25);
    factors++;
  }

  return factors > 0 ? Math.round(score) : 0;
}

/**
 * Generate repurposing suggestions for a content piece.
 */
export function suggestRepurposing(piece: ContentPiece): RepurposingSuggestion {
  const suggestions: RepurposingSuggestion['suggestions'] = [];

  const repurposeMap: Record<ContentType, { type: ContentType; channel: ContentChannel; desc: string }[]> = {
    blog_post: [
      { type: 'social_post', channel: 'instagram', desc: 'Extract key points as carousel slides' },
      { type: 'educational_reel', channel: 'tiktok', desc: 'Turn main takeaway into 60-second video' },
      { type: 'email_newsletter', channel: 'email', desc: 'Summarize as newsletter feature' },
      { type: 'infographic', channel: 'instagram', desc: 'Visualize data/steps as infographic' },
      { type: 'faq', channel: 'blog', desc: 'Extract FAQ section from blog content' },
    ],
    social_post: [
      { type: 'story_series', channel: 'instagram', desc: 'Expand into multi-story series' },
      { type: 'blog_post', channel: 'blog', desc: 'Develop into full blog post with more detail' },
    ],
    video_script: [
      { type: 'blog_post', channel: 'blog', desc: 'Transcribe and edit as blog post' },
      { type: 'social_post', channel: 'instagram', desc: 'Pull key quotes for social graphics' },
      { type: 'educational_reel', channel: 'tiktok', desc: 'Edit into short-form clips' },
    ],
    case_study: [
      { type: 'testimonial', channel: 'instagram', desc: 'Pull client quote for testimonial post' },
      { type: 'before_after', channel: 'instagram', desc: 'Create before/after visual' },
      { type: 'blog_post', channel: 'blog', desc: 'Write up as detailed success story' },
    ],
    email_newsletter: [
      { type: 'social_post', channel: 'instagram', desc: 'Share key highlights on social' },
      { type: 'blog_post', channel: 'blog', desc: 'Expand main article into blog post' },
    ],
    educational_reel: [
      { type: 'blog_post', channel: 'blog', desc: 'Expand video topic into written guide' },
      { type: 'social_post', channel: 'facebook', desc: 'Create text version for Facebook' },
    ],
    how_to_guide: [
      { type: 'educational_reel', channel: 'instagram', desc: 'Film step-by-step video' },
      { type: 'infographic', channel: 'instagram', desc: 'Create visual step-by-step' },
    ],
    testimonial: [
      { type: 'case_study', channel: 'blog', desc: 'Expand into full case study' },
      { type: 'social_post', channel: 'instagram', desc: 'Design quote graphic' },
    ],
    before_after: [
      { type: 'case_study', channel: 'blog', desc: 'Document full treatment journey' },
      { type: 'educational_reel', channel: 'tiktok', desc: 'Create transformation video' },
    ],
    infographic: [],
    faq: [
      { type: 'educational_reel', channel: 'tiktok', desc: 'Answer top questions on video' },
    ],
    behind_the_scenes: [
      { type: 'story_series', channel: 'instagram', desc: 'Expand into day-in-the-life series' },
    ],
    story_series: [
      { type: 'educational_reel', channel: 'tiktok', desc: 'Compile highlights into reel' },
    ],
  };

  const mappings = repurposeMap[piece.type] || [];
  for (const m of mappings) {
    suggestions.push({
      newType: m.type,
      newChannel: m.channel,
      description: m.desc,
      estimatedTime: CREATION_TIME[m.type] * 0.6, // repurposing is faster
      priority: piece.priority === 'high' ? 'high' : 'medium',
    });
  }

  return {
    originalPiece: piece.id,
    originalType: piece.type,
    suggestions,
  };
}

/**
 * Identify content gaps compared to competitors.
 */
export function analyzeContentGaps(
  ourContent: ContentPiece[],
  competitorTopics: { topic: string; category: ServiceCategory; competitorCount: number }[],
): CompetitorContentGap[] {
  return competitorTopics.map(ct => {
    const ourPieces = ourContent.filter(
      p => p.category === ct.category &&
        (p.title.toLowerCase().includes(ct.topic.toLowerCase()) ||
         p.keywords.some(k => ct.topic.toLowerCase().includes(k.toLowerCase())))
    );

    let coverage: CompetitorContentGap['ourCoverage'];
    if (ourPieces.length >= 3) coverage = 'full';
    else if (ourPieces.length >= 1) coverage = 'partial';
    else coverage = 'none';

    let opportunity: CompetitorContentGap['opportunity'];
    if (coverage === 'none' && ct.competitorCount >= 3) opportunity = 'high';
    else if (coverage === 'partial' && ct.competitorCount >= 2) opportunity = 'medium';
    else opportunity = 'low';

    const cluster = TOPIC_CLUSTERS.find(c => c.category === ct.category);

    return {
      topic: ct.topic,
      category: ct.category,
      competitorsCovering: ct.competitorCount,
      ourCoverage: coverage,
      opportunity,
      suggestedContent: `Create ${coverage === 'none' ? 'comprehensive' : 'additional'} content about ${ct.topic}`,
      suggestedKeywords: cluster?.keywords.slice(0, 5) || [],
    };
  }).sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.opportunity] - priorityOrder[b.opportunity];
  });
}

/**
 * Calculate content ROI across all published pieces.
 */
export function calculateContentROI(performances: ContentPerformance[]): ContentROI {
  const hourlyRate = 75; // estimated hourly content creation cost

  const totalInvestment = performances.reduce(
    (sum, p) => sum + (CREATION_TIME[p.type] || 60) / 60 * hourlyRate,
    0,
  );

  const totalConversions = performances.reduce(
    (sum, p) => sum + (p.metrics.conversions || 0),
    0,
  );

  const avgConversionValue = 500; // average service booking value
  const totalRevenue = totalConversions * avgConversionValue;

  const avgScore = performances.length > 0
    ? Math.round(performances.reduce((sum, p) => sum + p.performanceScore, 0) / performances.length)
    : 0;

  // Group by type and channel
  const roiByType: Record<string, { pieces: number; conversions: number; avgScore: number; scoreSum: number }> = {};
  const roiByChannel: Record<string, { pieces: number; conversions: number; avgScore: number; scoreSum: number }> = {};

  for (const p of performances) {
    if (!roiByType[p.type]) roiByType[p.type] = { pieces: 0, conversions: 0, avgScore: 0, scoreSum: 0 };
    roiByType[p.type].pieces++;
    roiByType[p.type].conversions += p.metrics.conversions || 0;
    roiByType[p.type].scoreSum += p.performanceScore;

    if (!roiByChannel[p.channel]) roiByChannel[p.channel] = { pieces: 0, conversions: 0, avgScore: 0, scoreSum: 0 };
    roiByChannel[p.channel].pieces++;
    roiByChannel[p.channel].conversions += p.metrics.conversions || 0;
    roiByChannel[p.channel].scoreSum += p.performanceScore;
  }

  // Calculate averages
  for (const key of Object.keys(roiByType)) {
    roiByType[key].avgScore = Math.round(roiByType[key].scoreSum / roiByType[key].pieces);
  }
  for (const key of Object.keys(roiByChannel)) {
    roiByChannel[key].avgScore = Math.round(roiByChannel[key].scoreSum / roiByChannel[key].pieces);
  }

  const sorted = [...performances].sort((a, b) => b.performanceScore - a.performanceScore);

  return {
    totalPieces: performances.length,
    totalInvestment: Math.round(totalInvestment),
    totalConversions,
    totalRevenue,
    avgPerformanceScore: avgScore,
    topPerformers: sorted.slice(0, 5),
    underperformers: sorted.slice(-5).reverse(),
    roiByType: roiByType as never,
    roiByChannel: roiByChannel as never,
  };
}

/**
 * Get keyword suggestions mapped to content pieces.
 */
export function getKeywordContentMap(): {
  keyword: string;
  category: ServiceCategory;
  suggestedTypes: ContentType[];
  searchVolume: 'high' | 'medium' | 'low';
}[] {
  const keywords: ReturnType<typeof getKeywordContentMap> = [];

  for (const cluster of TOPIC_CLUSTERS) {
    for (const kw of cluster.keywords) {
      keywords.push({
        keyword: kw,
        category: cluster.category,
        suggestedTypes: ['blog_post', 'educational_reel', 'social_post'],
        searchVolume: cluster.keywords.indexOf(kw) < 2 ? 'high' : 'medium',
      });
    }
  }

  return keywords;
}

/**
 * Get seasonal content triggers for the current or specified month.
 */
export function getSeasonalTriggers(month?: number): typeof SEASONAL_TRIGGERS[number][] {
  const targetMonth = month || (new Date().getMonth() + 1);
  return SEASONAL_TRIGGERS.filter(s => s.month === targetMonth);
}

/**
 * Get all topic clusters with coverage status.
 */
export function getTopicClusters(): TopicCluster[] {
  return [...TOPIC_CLUSTERS];
}
