/**
 * Social Media Auto-Post Engine
 *
 * Generates and schedules content for Instagram and Google Business Profile.
 * Uses service data, seasonal events, and clinic performance to create
 * engaging social media content automatically.
 *
 * Capabilities:
 * 1. Content calendar generation (weekly/monthly)
 * 2. Instagram post/reel/story ideas with captions + hashtags
 * 3. Google Business Profile posts
 * 4. Before/after template generation
 * 5. Educational content creation
 * 6. Promotional content with urgency drivers
 * 7. Optimal posting time recommendations
 */

// ── TYPES ──

export interface SocialInput {
  services: ServiceInfo[];
  recentPromotions: Promotion[];
  clinicStats: ClinicStats;
  seasonality: SeasonalContext;
  previousPosts?: PreviousPost[];
  brandVoice?: string;
}

export interface ServiceInfo {
  name: string;
  category: string;
  price: number;
  popularity: number; // 0-100
  beforeAfterAvailable: boolean;
  educationalPoints: string[];
}

export interface Promotion {
  title: string;
  discount: string;
  validUntil: string;
  services: string[];
}

export interface ClinicStats {
  totalClients: number;
  monthlyBookings: number;
  googleRating: number;
  reviewCount: number;
  topService: string;
  membershipCount: number;
}

export interface SeasonalContext {
  currentMonth: number;
  upcomingHolidays: string[];
  season: 'spring' | 'summer' | 'fall' | 'winter';
  weddingSeason: boolean;
}

export interface PreviousPost {
  date: string;
  platform: 'instagram' | 'gbp';
  type: string;
  engagement: number;
}

// ── OUTPUT TYPES ──

export interface SocialContentPlan {
  weeklyCalendar: ContentDay[];
  monthlyThemes: MonthlyTheme[];
  contentQueue: ContentItem[];
  hashtagSets: HashtagSet[];
  optimalPostingTimes: PostingTime[];
  performanceInsights: string[];
  contentScore: number; // 0-100
}

export interface ContentDay {
  dayOfWeek: string;
  date: string;
  posts: ContentItem[];
}

export interface ContentItem {
  platform: 'instagram' | 'gbp' | 'both';
  type: 'feed_post' | 'reel' | 'story' | 'carousel' | 'gbp_update' | 'gbp_offer';
  category: ContentCategory;
  title: string;
  caption: string;
  hashtags: string[];
  callToAction: string;
  suggestedImageDesc: string;
  bestPostTime: string;
  priority: 'high' | 'medium' | 'low';
  estimatedEngagement: number; // 0-100
}

export type ContentCategory =
  | 'educational'
  | 'before_after'
  | 'promotional'
  | 'behind_the_scenes'
  | 'testimonial'
  | 'seasonal'
  | 'team_spotlight'
  | 'service_highlight'
  | 'wellness_tip'
  | 'community';

export interface MonthlyTheme {
  week: number;
  theme: string;
  focusService: string;
  contentMix: { type: string; count: number }[];
}

export interface HashtagSet {
  category: string;
  hashtags: string[];
  reach: 'broad' | 'niche' | 'branded';
}

export interface PostingTime {
  dayOfWeek: string;
  bestTime: string;
  engagement: number; // relative score
  platform: 'instagram' | 'gbp';
}

// ── CONSTANTS ──

const BRAND_HASHTAGS = [
  '#RaniBeautyClinic', '#RaniGlow', '#RentonMedspa',
  '#SeattleMedspa', '#RentonBeauty', '#WashingtonMedspa',
];

const CATEGORY_HASHTAGS: Record<string, string[]> = {
  'Facial': ['#HydraFacial', '#GlowingSkin', '#FacialTreatment', '#SkinCare', '#FacialRejuvenation', '#GlassSkin'],
  'Injectable': ['#Botox', '#Fillers', '#AntiAging', '#InjectableExperts', '#NaturalResults', '#BotoxSeattle'],
  'Laser': ['#LaserTreatment', '#SkinRenewal', '#Sofwave', '#RFMicroneedling', '#SkinTightening'],
  'Hair Removal': ['#LaserHairRemoval', '#SmoothSkin', '#HairFree', '#GentleMaxPro'],
  'Peel': ['#ChemicalPeel', '#VIPeel', '#SkinResurfacing', '#PeelSeason'],
  'Wellness': ['#GLP1', '#WeightLoss', '#NAD', '#WellnessInjections', '#BiohackingSeattle', '#VitaminInjections'],
};

const SEASONAL_THEMES: Record<string, { theme: string; services: string[]; hooks: string[] }> = {
  'spring': {
    theme: 'Spring Renewal',
    services: ['HydraFacial', 'VI Peel', 'Laser Hair Removal'],
    hooks: ['Spring cleaning for your skin', 'Fresh start, fresh face', 'Get wedding-ready'],
  },
  'summer': {
    theme: 'Summer Glow',
    services: ['HydraFacial', 'Laser Hair Removal', 'GLP-1'],
    hooks: ['Summer body confidence', 'Beach-ready skin', 'Sun damage repair'],
  },
  'fall': {
    theme: 'Fall Reset',
    services: ['VI Peel', 'RF Microneedling', 'Sofwave'],
    hooks: ['Repair summer damage', 'Peel season is here', 'Fall into self-care'],
  },
  'winter': {
    theme: 'Holiday Glow',
    services: ['HydraFacial', 'Botox', 'Fillers'],
    hooks: ['Holiday party ready', 'Gift of glow', 'New year, new skin'],
  },
};

const OPTIMAL_TIMES: Record<string, { instagram: string; gbp: string }> = {
  'Monday': { instagram: '11:00 AM', gbp: '9:00 AM' },
  'Tuesday': { instagram: '10:00 AM', gbp: '10:00 AM' },
  'Wednesday': { instagram: '11:00 AM', gbp: '9:00 AM' },
  'Thursday': { instagram: '12:00 PM', gbp: '10:00 AM' },
  'Friday': { instagram: '10:00 AM', gbp: '9:00 AM' },
  'Saturday': { instagram: '9:00 AM', gbp: '10:00 AM' },
  'Sunday': { instagram: '5:00 PM', gbp: '11:00 AM' },
};

// ── ENGINE ──

export function generateSocialPlan(input: SocialInput): SocialContentPlan {
  const weeklyCalendar = generateWeeklyCalendar(input);
  const monthlyThemes = generateMonthlyThemes(input);
  const contentQueue = generateContentQueue(input);
  const hashtagSets = generateHashtagSets(input);
  const optimalPostingTimes = generatePostingTimes();
  const performanceInsights = generateSocialInsights(input);
  const contentScore = calculateContentScore(input, contentQueue);

  return {
    weeklyCalendar,
    monthlyThemes,
    contentQueue,
    hashtagSets,
    optimalPostingTimes,
    performanceInsights,
    contentScore,
  };
}

// ── WEEKLY CALENDAR ──

function generateWeeklyCalendar(input: SocialInput): ContentDay[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const now = new Date();

  // Find next Monday
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now.getTime() + daysUntilMonday * 86400000);

  return days.map((day, i) => {
    const date = new Date(nextMonday.getTime() + i * 86400000);
    const dateStr = date.toISOString().slice(0, 10);
    const posts = generateDayContent(day, input, dateStr);

    return { dayOfWeek: day, date: dateStr, posts };
  });
}

function generateDayContent(day: string, input: SocialInput, date: string): ContentItem[] {
  const posts: ContentItem[] = [];
  const seasonal = SEASONAL_THEMES[input.seasonality.season];

  switch (day) {
    case 'Monday':
      // Motivational + Educational
      posts.push(createContentItem({
        platform: 'instagram',
        type: 'feed_post',
        category: 'educational',
        title: 'Motivation Monday',
        service: input.services.find(s => s.popularity > 50) || input.services[0],
        seasonal,
        input,
      }));
      posts.push(createGBPUpdate(input, seasonal));
      break;

    case 'Tuesday':
      // Transformation Tuesday
      const baService = input.services.find(s => s.beforeAfterAvailable);
      if (baService) {
        posts.push(createContentItem({
          platform: 'instagram',
          type: 'carousel',
          category: 'before_after',
          title: 'Transformation Tuesday',
          service: baService,
          seasonal,
          input,
        }));
      }
      break;

    case 'Wednesday':
      // Wellness Wednesday
      const wellnessService = input.services.find(s => s.category === 'Wellness');
      posts.push(createContentItem({
        platform: 'both',
        type: 'feed_post',
        category: 'wellness_tip',
        title: 'Wellness Wednesday',
        service: wellnessService || input.services[0],
        seasonal,
        input,
      }));
      break;

    case 'Thursday':
      // Service Spotlight / Promotional
      posts.push(createContentItem({
        platform: 'instagram',
        type: 'reel',
        category: 'service_highlight',
        title: 'Treatment Spotlight',
        service: seasonal.services.length > 0
          ? input.services.find(s => seasonal.services.includes(s.name)) || input.services[0]
          : input.services[0],
        seasonal,
        input,
      }));
      break;

    case 'Friday':
      // Behind the scenes / Team
      posts.push(createContentItem({
        platform: 'instagram',
        type: 'story',
        category: 'behind_the_scenes',
        title: 'Friday BTS',
        service: input.services[Math.floor(Math.random() * input.services.length)],
        seasonal,
        input,
      }));
      // GBP weekly offer
      if (input.recentPromotions.length > 0) {
        posts.push({
          platform: 'gbp',
          type: 'gbp_offer',
          category: 'promotional',
          title: input.recentPromotions[0].title,
          caption: `Limited time: ${input.recentPromotions[0].discount}. Book now at ranibeautyclinic.com`,
          hashtags: [],
          callToAction: 'Book Now',
          suggestedImageDesc: 'Clean promotional graphic with Rani branding',
          bestPostTime: OPTIMAL_TIMES['Friday'].gbp,
          priority: 'high',
          estimatedEngagement: 60,
        });
      }
      break;

    case 'Saturday':
      // Client testimonial / Community
      posts.push(createContentItem({
        platform: 'instagram',
        type: 'feed_post',
        category: 'testimonial',
        title: 'Client Love',
        service: input.services.sort((a, b) => b.popularity - a.popularity)[0],
        seasonal,
        input,
      }));
      break;

    case 'Sunday':
      // Self-care Sunday
      posts.push(createContentItem({
        platform: 'instagram',
        type: 'story',
        category: 'wellness_tip',
        title: 'Self-Care Sunday',
        service: input.services.find(s => s.category === 'Facial') || input.services[0],
        seasonal,
        input,
      }));
      break;
  }

  return posts;
}

interface ContentItemParams {
  platform: 'instagram' | 'gbp' | 'both';
  type: ContentItem['type'];
  category: ContentCategory;
  title: string;
  service: ServiceInfo;
  seasonal: { theme: string; services: string[]; hooks: string[] };
  input: SocialInput;
}

function createContentItem(params: ContentItemParams): ContentItem {
  const { platform, type, category, title, service, seasonal, input } = params;
  const categoryHashtags = CATEGORY_HASHTAGS[service.category] || [];

  const captions: Record<ContentCategory, string> = {
    educational: `Did you know? ${service.educationalPoints[0] || `${service.name} is one of the most effective treatments for skin renewal.`} At Rani Beauty Clinic, we combine medical expertise with luxury care for results you can see and feel.\n\nBook your consultation today.`,
    before_after: `The transformation speaks for itself. This client came to us wanting a fresh, rejuvenated look. After ${service.name}, the results are stunning.\n\nReal results. Real confidence. Real beauty.`,
    promotional: `${seasonal.hooks[0] || 'Limited time offer'}: ${service.name} starting at $${service.price}. ${input.clinicStats.googleRating}+ rating with ${input.clinicStats.reviewCount}+ reviews.\n\nBook now at ranibeautyclinic.com`,
    behind_the_scenes: `A peek inside our treatment room. This is what ${service.name} looks like in action at Rani Beauty Clinic. Our medical-grade equipment and trained providers ensure you get the best results every time.`,
    testimonial: `"I cannot believe the difference!" Another happy Rani client after their ${service.name} treatment. With ${input.clinicStats.reviewCount}+ 5-star reviews, our results speak for themselves.`,
    seasonal: `${seasonal.theme} is here! ${seasonal.hooks[Math.floor(Math.random() * seasonal.hooks.length)]}. Start with ${service.name} and let your glow do the talking.`,
    team_spotlight: `Meet the team behind your glow. At Rani Beauty Clinic, every treatment is overseen by a physician and delivered by experienced, certified providers.`,
    service_highlight: `${service.name} explained: ${service.educationalPoints[0] || `A revolutionary treatment that delivers visible results.`}\n\nDuration: ${service.price > 1000 ? '45-90' : '15-60'} minutes | Results: Immediate to progressive\n\nBook your appointment today.`,
    wellness_tip: `Your wellness journey starts from within. ${service.name} supports your body's natural processes for lasting health and vitality.\n\nAt Rani, we believe beauty starts with wellness.`,
    community: `We are proud to serve the Renton community. From ${input.clinicStats.totalClients.toLocaleString()}+ clients to ${input.clinicStats.membershipCount} Angel Glow members, Rani Beauty Clinic is your partner in confidence.`,
  };

  const ctas: Record<ContentCategory, string> = {
    educational: 'Learn more — Link in bio',
    before_after: 'Book your transformation — Link in bio',
    promotional: 'Book now before spots fill up',
    behind_the_scenes: 'Book your next visit',
    testimonial: 'Join our happy clients — Book today',
    seasonal: 'Limited availability — Book now',
    team_spotlight: 'Meet us at your next appointment',
    service_highlight: 'Book your consultation today',
    wellness_tip: 'Start your wellness journey',
    community: 'Join the Rani family',
  };

  return {
    platform,
    type,
    category,
    title,
    caption: captions[category] || `Discover ${service.name} at Rani Beauty Clinic.`,
    hashtags: [...BRAND_HASHTAGS.slice(0, 3), ...categoryHashtags.slice(0, 5)],
    callToAction: ctas[category] || 'Book now at ranibeautyclinic.com',
    suggestedImageDesc: generateImageDescription(category, service),
    bestPostTime: OPTIMAL_TIMES[new Date().toLocaleDateString('en-US', { weekday: 'long' })]?.instagram || '11:00 AM',
    priority: category === 'promotional' || category === 'before_after' ? 'high' : 'medium',
    estimatedEngagement: estimateEngagement(category, type),
  };
}

function createGBPUpdate(input: SocialInput, seasonal: { theme: string; services: string[]; hooks: string[] }): ContentItem {
  return {
    platform: 'gbp',
    type: 'gbp_update',
    category: 'service_highlight',
    title: `${seasonal.theme} at Rani Beauty Clinic`,
    caption: `${seasonal.hooks[0]}. Visit us at 401 Olympia Ave NE #101, Renton, WA 98056. Book online at ranibeautyclinic.com`,
    hashtags: [],
    callToAction: 'Book Online',
    suggestedImageDesc: 'Professional clinic photo showcasing treatment room or provider',
    bestPostTime: OPTIMAL_TIMES['Monday'].gbp,
    priority: 'medium',
    estimatedEngagement: 40,
  };
}

function generateImageDescription(category: ContentCategory, service: ServiceInfo): string {
  const descriptions: Record<ContentCategory, string> = {
    educational: `Clean infographic about ${service.name} benefits. Use Rani brand colors (navy, gold, cream).`,
    before_after: `Before/after split image of ${service.name} results. Include "Results may vary" disclaimer.`,
    promotional: `Promotional graphic for ${service.name}. Price point visible, Rani logo, clean luxury design.`,
    behind_the_scenes: `Candid photo of treatment room during ${service.name}. Provider at work, warm lighting.`,
    testimonial: `Client quote overlay on clean background with ${service.name} results visible.`,
    seasonal: `Seasonal themed graphic aligned with current season. ${service.name} highlighted.`,
    team_spotlight: `Professional headshot or candid of provider/team member. Warm, approachable.`,
    service_highlight: `High-quality image showing ${service.name} equipment or procedure. Clean, medical-grade aesthetic.`,
    wellness_tip: `Soft, calming imagery related to ${service.name}. Wellness-focused with natural tones.`,
    community: `Clinic exterior or team group photo. Community-focused, welcoming atmosphere.`,
  };
  return descriptions[category] || `Professional photo related to ${service.name}`;
}

function estimateEngagement(category: ContentCategory, type: ContentItem['type']): number {
  const categoryScores: Record<ContentCategory, number> = {
    before_after: 85,
    testimonial: 75,
    promotional: 60,
    educational: 65,
    behind_the_scenes: 70,
    seasonal: 55,
    service_highlight: 60,
    wellness_tip: 50,
    team_spotlight: 55,
    community: 45,
  };

  const typeMultiplier: Record<string, number> = {
    reel: 1.3,
    carousel: 1.2,
    story: 0.8,
    feed_post: 1.0,
    gbp_update: 0.6,
    gbp_offer: 0.7,
  };

  return Math.round(
    (categoryScores[category] || 50) * (typeMultiplier[type] || 1.0)
  );
}

// ── MONTHLY THEMES ──

function generateMonthlyThemes(input: SocialInput): MonthlyTheme[] {
  const seasonal = SEASONAL_THEMES[input.seasonality.season];
  const topServices = input.services.sort((a, b) => b.popularity - a.popularity);

  return [
    {
      week: 1,
      theme: `${seasonal.theme} Kickoff`,
      focusService: seasonal.services[0] || topServices[0].name,
      contentMix: [
        { type: 'feed_post', count: 3 },
        { type: 'reel', count: 1 },
        { type: 'story', count: 5 },
        { type: 'gbp_update', count: 1 },
      ],
    },
    {
      week: 2,
      theme: 'Results & Testimonials',
      focusService: topServices[0].name,
      contentMix: [
        { type: 'carousel', count: 2 },
        { type: 'reel', count: 1 },
        { type: 'story', count: 4 },
        { type: 'gbp_update', count: 1 },
      ],
    },
    {
      week: 3,
      theme: 'Education & Expertise',
      focusService: seasonal.services[1] || topServices[1]?.name || topServices[0].name,
      contentMix: [
        { type: 'feed_post', count: 2 },
        { type: 'reel', count: 2 },
        { type: 'story', count: 5 },
        { type: 'gbp_offer', count: 1 },
      ],
    },
    {
      week: 4,
      theme: 'Community & Celebration',
      focusService: topServices[Math.min(2, topServices.length - 1)].name,
      contentMix: [
        { type: 'feed_post', count: 3 },
        { type: 'reel', count: 1 },
        { type: 'story', count: 4 },
        { type: 'gbp_update', count: 1 },
      ],
    },
  ];
}

// ── CONTENT QUEUE ──

function generateContentQueue(input: SocialInput): ContentItem[] {
  const queue: ContentItem[] = [];
  const seasonal = SEASONAL_THEMES[input.seasonality.season];

  // Top 5 services get content
  const topServices = input.services.sort((a, b) => b.popularity - a.popularity).slice(0, 5);

  for (const service of topServices) {
    // Educational post
    queue.push(createContentItem({
      platform: 'instagram',
      type: 'carousel',
      category: 'educational',
      title: `${service.name}: What You Need to Know`,
      service,
      seasonal,
      input,
    }));

    // Service highlight reel
    queue.push(createContentItem({
      platform: 'instagram',
      type: 'reel',
      category: 'service_highlight',
      title: `Watch: ${service.name} in Action`,
      service,
      seasonal,
      input,
    }));

    // Before/after if available
    if (service.beforeAfterAvailable) {
      queue.push(createContentItem({
        platform: 'instagram',
        type: 'carousel',
        category: 'before_after',
        title: `${service.name} Transformation`,
        service,
        seasonal,
        input,
      }));
    }
  }

  // Seasonal promotional content
  queue.push(createContentItem({
    platform: 'both',
    type: 'feed_post',
    category: 'seasonal',
    title: `${seasonal.theme} Special`,
    service: topServices[0],
    seasonal,
    input,
  }));

  return queue.sort((a, b) => b.estimatedEngagement - a.estimatedEngagement);
}

// ── HASHTAG SETS ──

function generateHashtagSets(input: SocialInput): HashtagSet[] {
  const sets: HashtagSet[] = [
    {
      category: 'Branded',
      hashtags: BRAND_HASHTAGS,
      reach: 'branded',
    },
    {
      category: 'Location',
      hashtags: [
        '#RentonWA', '#SeattleBeauty', '#PNWBeauty', '#WashingtonMedspa',
        '#RentonSkincare', '#SeattleSkincare', '#PacificNorthwestBeauty',
      ],
      reach: 'niche',
    },
    {
      category: 'Industry',
      hashtags: [
        '#MedSpa', '#Aesthetics', '#MedicalAesthetics', '#BeautyClinic',
        '#SkinClinic', '#AntiAging', '#BeautyTreatment', '#GlowUp',
      ],
      reach: 'broad',
    },
  ];

  // Add service-specific sets
  const categories = [...new Set(input.services.map(s => s.category))];
  for (const cat of categories) {
    const hashtags = CATEGORY_HASHTAGS[cat];
    if (hashtags) {
      sets.push({
        category: cat,
        hashtags,
        reach: 'niche',
      });
    }
  }

  return sets;
}

// ── POSTING TIMES ──

function generatePostingTimes(): PostingTime[] {
  const times: PostingTime[] = [];
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  for (const day of days) {
    const dayTimes = OPTIMAL_TIMES[day];
    times.push(
      { dayOfWeek: day, bestTime: dayTimes.instagram, engagement: getEngagementScore(day, 'instagram'), platform: 'instagram' },
      { dayOfWeek: day, bestTime: dayTimes.gbp, engagement: getEngagementScore(day, 'gbp'), platform: 'gbp' },
    );
  }

  return times;
}

function getEngagementScore(day: string, platform: string): number {
  const baseScores: Record<string, number> = {
    Monday: 65, Tuesday: 70, Wednesday: 75, Thursday: 80,
    Friday: 72, Saturday: 85, Sunday: 60,
  };
  const platformMult = platform === 'instagram' ? 1.0 : 0.7;
  return Math.round((baseScores[day] || 70) * platformMult);
}

// ── INSIGHTS ──

function generateSocialInsights(input: SocialInput): string[] {
  const insights: string[] = [];
  const seasonal = SEASONAL_THEMES[input.seasonality.season];

  insights.push(
    `${seasonal.theme} content strategy: Focus on ${seasonal.services.join(', ')} for maximum seasonal relevance.`
  );

  const topService = input.services.sort((a, b) => b.popularity - a.popularity)[0];
  if (topService) {
    insights.push(
      `${topService.name} is your most popular service — create 2-3 pieces of content around it weekly for maximum engagement.`
    );
  }

  const baServices = input.services.filter(s => s.beforeAfterAvailable);
  if (baServices.length > 0) {
    insights.push(
      `Before/after content for ${baServices.map(s => s.name).join(', ')} drives 40% higher engagement than text-only posts.`
    );
  }

  if (input.clinicStats.googleRating >= 4.5) {
    insights.push(
      `Your ${input.clinicStats.googleRating}-star rating is a powerful social proof element. Feature it prominently in GBP and Instagram posts.`
    );
  }

  if (input.clinicStats.membershipCount > 20) {
    insights.push(
      `Highlight your ${input.clinicStats.membershipCount} Angel Glow members in content — membership social proof drives 25% higher conversion.`
    );
  }

  insights.push(
    `Optimal Instagram posting: Tuesday-Saturday, 9-12 PM. Reels outperform static posts by 30%.`
  );

  return insights;
}

// ── CONTENT SCORE ──

function calculateContentScore(input: SocialInput, queue: ContentItem[]): number {
  let score = 50;

  // Variety of content types
  const types = new Set(queue.map(c => c.type));
  score += Math.min(15, types.size * 3);

  // Both platforms covered
  const platforms = new Set(queue.map(c => c.platform));
  if (platforms.has('gbp') || platforms.has('both')) score += 10;
  if (platforms.has('instagram') || platforms.has('both')) score += 10;

  // High engagement content present
  const highEngagement = queue.filter(c => c.estimatedEngagement > 70).length;
  score += Math.min(10, highEngagement * 2);

  // Category diversity
  const categories = new Set(queue.map(c => c.category));
  score += Math.min(10, categories.size * 2);

  // Before/after content (highest engagement)
  const baCount = queue.filter(c => c.category === 'before_after').length;
  if (baCount > 0) score += 5;

  return Math.min(100, score);
}
