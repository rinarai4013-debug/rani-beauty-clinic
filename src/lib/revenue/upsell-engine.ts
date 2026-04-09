/**
 * Smart Upsell / Cross-Sell Engine
 *
 * Analyzes every client touchpoint to find the highest-probability,
 * highest-value upsell and cross-sell opportunities. Generates scripts,
 * calculates propensity scores, and tracks average ticket improvement.
 *
 * CRITICAL: Rani does IM INJECTIONS only. Never say "infusion."
 */

// ── TYPES ──

export interface UpsellInput {
  client: UpsellClientProfile;
  currentService?: string;
  visitContext: 'pre-booking' | 'check-in' | 'during-treatment' | 'checkout' | 'post-visit';
  availableAddOns: AddOnService[];
  membershipPlans: MembershipPlanInfo[];
  productCatalog: RetailProduct[];
}

export interface UpsellClientProfile {
  id: string;
  name: string;
  totalSpend: number;
  visitCount: number;
  avgTicket: number;
  membershipTier?: string;
  membershipStatus?: string;
  purchaseHistory: PurchaseHistoryItem[];
  servicesUsed: string[];
  productsOwned: string[];
  lastVisitDate: string;
  preferredCategories: string[];
  priceSegment: 'budget' | 'mid' | 'premium' | 'luxury';
}

export interface PurchaseHistoryItem {
  date: string;
  service: string;
  amount: number;
  addOns: string[];
  products: string[];
  acceptedUpsell: boolean;
}

export interface AddOnService {
  name: string;
  category: string;
  price: number;
  duration: number; // minutes
  compatibleWith: string[];
  description: string;
}

export interface MembershipPlanInfo {
  tier: string;
  monthlyPrice: number;
  annualSavings: number;
  benefits: string[];
}

export interface RetailProduct {
  name: string;
  category: string;
  price: number;
  margin: number; // 0-1
  complementsServices: string[];
  description: string;
}

// ── OUTPUT TYPES ──

export interface UpsellResult {
  recommendations: UpsellRecommendation[];
  membershipConversion?: MembershipConversionOpp;
  packageUpgrade?: PackageUpgradeOpp;
  retailSuggestions: RetailSuggestion[];
  ticketImpact: TicketImpact;
  scripts: UpsellScript[];
}

export interface UpsellRecommendation {
  type: 'add-on' | 'upgrade' | 'cross-sell' | 'package' | 'membership';
  service: string;
  reason: string;
  price: number;
  propensityScore: number; // 0-100 likelihood they accept
  revenueImpact: number;
  timing: 'pre-booking' | 'check-in' | 'during-treatment' | 'checkout' | 'post-visit';
  confidence: 'high' | 'medium' | 'low';
}

export interface MembershipConversionOpp {
  eligible: boolean;
  suggestedTier: string;
  monthlyPrice: number;
  projectedAnnualSavings: number;
  breakEvenVisits: number;
  conversionLikelihood: number; // 0-100
  pitch: string;
}

export interface PackageUpgradeOpp {
  currentService: string;
  suggestedPackage: string;
  packagePrice: number;
  perSessionSavings: number;
  sessionsIncluded: number;
  pitch: string;
}

export interface RetailSuggestion {
  product: string;
  category: string;
  price: number;
  reason: string;
  propensity: number; // 0-100
  timing: string;
}

export interface TicketImpact {
  currentAvgTicket: number;
  projectedTicket: number;
  upliftPercent: number;
  upliftDollar: number;
  annualRevenueImpact: number;
}

export interface UpsellScript {
  scenario: string;
  timing: string;
  script: string;
  fallback: string;
  objectionHandler: string;
}

// ── SERVICE COMPATIBILITY MATRIX ──

const COMPATIBILITY_MATRIX: Record<string, { addOns: string[]; crossSells: string[]; products: string[] }> = {
  'HydraFacial': {
    addOns: ['LED Light Therapy', 'Lip Perk', 'Eye Perk', 'Lymphatic Drainage'],
    crossSells: ['VI Peel', 'PRX-T33', 'RF Microneedling', 'BioRePeel'],
    products: ['Vitamin C Serum', 'SPF 50', 'Hyaluronic Acid Serum', 'Gentle Cleanser'],
  },
  'Botox': {
    addOns: ['Lip Flip', 'Jawline Slimming', 'Hyperhidrosis Treatment'],
    crossSells: ['Fillers', 'PicoWay', 'HydraFacial', 'RF Microneedling'],
    products: ['Retinol Serum', 'Peptide Cream', 'Eye Cream'],
  },
  'Fillers': {
    addOns: ['Additional Syringe', 'Cannula Technique'],
    crossSells: ['Botox', 'PicoWay', 'Sofwave', 'PRX-T33'],
    products: ['SPF 50', 'Arnica Cream', 'Hydrating Serum'],
  },
  'Lip Filler': {
    addOns: ['Lip Flip (Botox)', 'Hydrating Lip Treatment'],
    crossSells: ['Botox', 'HydraFacial', 'PRX-T33'],
    products: ['Lip Balm SPF', 'Hyaluronic Lip Treatment'],
  },
  'VI Peel': {
    addOns: ['VI Peel Boost', 'Post-Peel Kit'],
    crossSells: ['HydraFacial', 'RF Microneedling', 'PicoWay'],
    products: ['Post-Peel Recovery Kit', 'SPF 50', 'Gentle Cleanser'],
  },
  'PRX-T33': {
    addOns: ['LED Light Therapy', 'Post-Peel Hydration'],
    crossSells: ['HydraFacial', 'VI Peel', 'RF Microneedling'],
    products: ['Vitamin C Serum', 'SPF 50', 'Collagen Peptide Serum'],
  },
  'RF Microneedling': {
    addOns: ['PRP Enhancement', 'Growth Factor Serum', 'Exosome Treatment'],
    crossSells: ['Sofwave', 'PRX-T33', 'HydraFacial'],
    products: ['Growth Factor Serum', 'SPF 50', 'Hydrating Mask'],
  },
  'Sofwave': {
    addOns: ['Eye Area Treatment', 'Neck Treatment'],
    crossSells: ['RF Microneedling', 'PRX-T33', 'Botox', 'Fillers'],
    products: ['Firming Cream', 'SPF 50', 'Peptide Serum'],
  },
  'PicoWay': {
    addOns: ['Additional Area', 'Tone Treatment'],
    crossSells: ['HydraFacial', 'VI Peel', 'Botox'],
    products: ['Brightening Serum', 'SPF 50', 'Dark Spot Corrector'],
  },
  'Laser Hair Removal': {
    addOns: ['Additional Area', 'Skin Cooling Treatment'],
    crossSells: ['HydraFacial', 'PRX-T33'],
    products: ['Ingrown Hair Solution', 'Soothing Gel', 'SPF 50'],
  },
  'GLP-1': {
    addOns: ['Body Composition Scan', 'Nutrition Consultation'],
    crossSells: ['B12 Injection', 'Tri-Immune Injection', 'NAD+ Injection'],
    products: ['Protein Supplement', 'Vitamin Pack', 'Electrolyte Mix'],
  },
  'B12 Injection': {
    addOns: ['Glutathione Injection', 'Tri-Immune Injection'],
    crossSells: ['NAD+ Injection', 'Vitamin D3 Injection', 'GLP-1'],
    products: ['B-Complex Supplement', 'Energy Support Pack'],
  },
  'NAD+ Injection': {
    addOns: ['Glutathione Injection', 'B12 Injection'],
    crossSells: ['Tri-Immune Injection', 'GLP-1'],
    products: ['NAD+ Supplement', 'Anti-Aging Vitamin Pack'],
  },
};

// ── CORE ENGINE ──

export function generateUpsellRecommendations(input: UpsellInput): UpsellResult {
  const { client, currentService, visitContext } = input;

  const recommendations = findUpsellOpportunities(input);
  const membershipConversion = evaluateMembershipConversion(client, input.membershipPlans);
  const packageUpgrade = currentService ? evaluatePackageUpgrade(client, currentService) : undefined;
  const retailSuggestions = generateRetailSuggestions(client, currentService, input.productCatalog);
  const scripts = generateUpsellScripts(recommendations, visitContext, client);
  const ticketImpact = calculateTicketImpact(client, recommendations, retailSuggestions);

  return {
    recommendations: recommendations.sort((a, b) => b.propensityScore - a.propensityScore).slice(0, 5),
    membershipConversion: membershipConversion?.eligible ? membershipConversion : undefined,
    packageUpgrade,
    retailSuggestions: retailSuggestions.slice(0, 3),
    ticketImpact,
    scripts: scripts.slice(0, 5),
  };
}

function getCrossSellReason(currentService: string, crossSell: string): string {
  return `Clients who love ${currentService} also see great results with ${crossSell}`;
}

// ── UPSELL OPPORTUNITY FINDER ──

function findUpsellOpportunities(input: UpsellInput): UpsellRecommendation[] {
  const { client, currentService, visitContext, availableAddOns } = input;
  const recs: UpsellRecommendation[] = [];

  if (!currentService) return recs;

  const compat = COMPATIBILITY_MATRIX[currentService];
  if (!compat) return recs;

  // Add-on recommendations
  for (const addOnName of compat.addOns) {
    const addOn = availableAddOns.find(a => a.name === addOnName);
    if (!addOn) continue;

    const propensity = calculatePropensity(client, addOnName, 'add-on');
    recs.push({
      type: 'add-on',
      service: addOnName,
      reason: `Enhances your ${currentService} results`,
      price: addOn.price,
      propensityScore: propensity,
      revenueImpact: addOn.price,
      timing: bestTimingForType('add-on', visitContext),
      confidence: propensity > 60 ? 'high' : propensity > 35 ? 'medium' : 'low',
    });
  }

  // Cross-sell recommendations
  for (const crossSell of compat.crossSells) {
    if (client.servicesUsed.includes(crossSell)) continue; // already tried it

    const propensity = calculatePropensity(client, crossSell, 'cross-sell');
    const servicePrice = getEstimatedPrice(crossSell);
    recs.push({
      type: 'cross-sell',
      service: crossSell,
      reason: getCrossSellReason(currentService, crossSell),
      price: servicePrice,
      propensityScore: propensity,
      revenueImpact: servicePrice,
      timing: 'checkout',
      confidence: propensity > 60 ? 'high' : propensity > 35 ? 'medium' : 'low',
    });
  }

  return recs;
}

// ── PROPENSITY SCORING ──

function calculatePropensity(client: UpsellClientProfile, service: string, type: string): number {
  let score = 40; // baseline

  // Price segment alignment
  const servicePrice = getEstimatedPrice(service);
  if (client.priceSegment === 'luxury' && servicePrice > 300) score += 15;
  else if (client.priceSegment === 'premium' && servicePrice > 200) score += 10;
  else if (client.priceSegment === 'budget' && servicePrice > 400) score -= 20;

  // Visit frequency (more visits = more trust)
  if (client.visitCount > 10) score += 15;
  else if (client.visitCount > 5) score += 10;
  else if (client.visitCount > 2) score += 5;

  // Past upsell acceptance
  const acceptedCount = client.purchaseHistory.filter(p => p.acceptedUpsell).length;
  const totalOpps = client.purchaseHistory.length;
  if (totalOpps > 0) {
    const acceptRate = acceptedCount / totalOpps;
    score += Math.round(acceptRate * 20);
  }

  // Membership status (members are more receptive)
  if (client.membershipStatus === 'active') score += 10;

  // Add-ons are easier sells than cross-sells
  if (type === 'add-on') score += 10;

  // Category preference alignment
  const serviceCategory = getServiceCategory(service);
  if (client.preferredCategories.includes(serviceCategory)) score += 10;

  return Math.min(100, Math.max(0, score));
}

// ── MEMBERSHIP CONVERSION ──

function evaluateMembershipConversion(
  client: UpsellClientProfile,
  plans: MembershipPlanInfo[],
): MembershipConversionOpp | undefined {
  // Skip if already a member
  if (client.membershipStatus === 'active') return undefined;

  // Need at least 2 visits to pitch membership
  if (client.visitCount < 2) return undefined;

  const annualSpend = calculateAnnualSpend(client);

  // Find the best-fit tier
  let bestTier: MembershipPlanInfo | undefined;
  for (const plan of plans.sort((a, b) => b.monthlyPrice - a.monthlyPrice)) {
    if (plan.monthlyPrice * 12 <= annualSpend * 1.2) {
      bestTier = plan;
      break;
    }
  }

  if (!bestTier) bestTier = plans[0]; // default to entry tier
  if (!bestTier) return undefined;

  const annualMembershipCost = bestTier.monthlyPrice * 12;
  const projectedSavings = Math.max(0, annualSpend - annualMembershipCost + bestTier.annualSavings);
  const breakEvenVisits = Math.ceil(bestTier.monthlyPrice / client.avgTicket * 12);

  // Conversion likelihood
  let likelihood = 30;
  if (client.visitCount > 6) likelihood += 20;
  if (client.avgTicket > bestTier.monthlyPrice * 0.8) likelihood += 15;
  if (annualSpend > annualMembershipCost) likelihood += 20;
  likelihood = Math.min(95, likelihood);

  return {
    eligible: true,
    suggestedTier: bestTier.tier,
    monthlyPrice: bestTier.monthlyPrice,
    projectedAnnualSavings: Math.round(projectedSavings),
    breakEvenVisits,
    conversionLikelihood: likelihood,
    pitch: `Based on your treatment frequency, the ${bestTier.tier} membership at $${bestTier.monthlyPrice}/mo would save you approximately $${Math.round(projectedSavings).toLocaleString()} annually while unlocking priority scheduling and exclusive perks.`,
  };
}

// ── PACKAGE UPGRADE ──

function evaluatePackageUpgrade(client: UpsellClientProfile, currentService: string): PackageUpgradeOpp | undefined {
  const packages: Record<string, { name: string; sessions: number; pricePerSession: number; totalPrice: number }> = {
    'HydraFacial': { name: 'HydraFacial Series of 6', sessions: 6, pricePerSession: 235, totalPrice: 1410 },
    'VI Peel': { name: 'VI Peel Series of 4', sessions: 4, pricePerSession: 340, totalPrice: 1360 },
    'PRX-T33': { name: 'PRX-T33 Series of 4', sessions: 4, pricePerSession: 425, totalPrice: 1700 },
    'RF Microneedling': { name: 'RF Microneedling Series of 3', sessions: 3, pricePerSession: 750, totalPrice: 2250 },
    'Laser Hair Removal': { name: 'Laser Hair Removal Package', sessions: 6, pricePerSession: 140, totalPrice: 840 },
  };

  const pkg = packages[currentService];
  if (!pkg) return undefined;

  const singlePrice = getEstimatedPrice(currentService);
  const savings = singlePrice - pkg.pricePerSession;

  return {
    currentService,
    suggestedPackage: pkg.name,
    packagePrice: pkg.totalPrice,
    perSessionSavings: savings,
    sessionsIncluded: pkg.sessions,
    pitch: `Invest in a ${pkg.name} for $${pkg.totalPrice.toLocaleString()} and save $${savings}/session. That is $${(savings * pkg.sessions).toLocaleString()} in total savings while ensuring consistent, transformative results.`,
  };
}

// ── RETAIL SUGGESTIONS ──

function generateRetailSuggestions(
  client: UpsellClientProfile,
  currentService: string | undefined,
  catalog: RetailProduct[],
): RetailSuggestion[] {
  const suggestions: RetailSuggestion[] = [];

  if (!currentService) return suggestions;

  const compat = COMPATIBILITY_MATRIX[currentService];
  if (!compat) return suggestions;

  for (const productName of compat.products) {
    if (client.productsOwned.includes(productName)) continue;

    const product = catalog.find(p => p.name === productName);
    if (!product) continue;

    let propensity = 30;
    if (client.priceSegment === 'luxury' || client.priceSegment === 'premium') propensity += 15;
    if (client.visitCount > 5) propensity += 10;
    if (client.membershipStatus === 'active') propensity += 10;

    suggestions.push({
      product: productName,
      category: product.category,
      price: product.price,
      reason: `Maximizes and extends your ${currentService} results at home`,
      propensity: Math.min(85, propensity),
      timing: 'checkout',
    });
  }

  return suggestions.sort((a, b) => b.propensity - a.propensity);
}

// ── SCRIPT GENERATION ──

function generateUpsellScripts(
  recs: UpsellRecommendation[],
  context: string,
  client: UpsellClientProfile,
): UpsellScript[] {
  const scripts: UpsellScript[] = [];

  for (const rec of recs.slice(0, 5)) {
    const firstName = client.name.split(' ')[0];

    if (rec.type === 'add-on') {
      scripts.push({
        scenario: `${rec.service} add-on during ${rec.timing}`,
        timing: rec.timing,
        script: `${firstName}, many of our clients add ${rec.service} to enhance their results. It takes just ${getEstimatedDuration(rec.service)} extra minutes and clients love the difference it makes. Would you like to add it today for $${rec.price}?`,
        fallback: `No problem at all! We can always add it at your next visit.`,
        objectionHandler: `I completely understand. The reason we suggest it is that your skin is already prepped and receptive right now, so you get the maximum benefit. But there is no pressure -- we want you to feel comfortable with every step of your treatment journey.`,
      });
    } else if (rec.type === 'cross-sell') {
      scripts.push({
        scenario: `${rec.service} cross-sell at ${rec.timing}`,
        timing: rec.timing,
        script: `${firstName}, based on your goals, many clients who love their current treatment find ${rec.service} is the perfect complement. It addresses different concerns and together the results are remarkable. Would you like to learn more about it for your next visit?`,
        fallback: `Absolutely, let us focus on today. I will leave some information for you to review at your leisure.`,
        objectionHandler: `That is completely fair. What I can do is schedule a complimentary consultation so you can see if it is right for you, with zero commitment.`,
      });
    }
  }

  return scripts;
}

// ── TICKET IMPACT CALCULATION ──

function calculateTicketImpact(
  client: UpsellClientProfile,
  recs: UpsellRecommendation[],
  retail: RetailSuggestion[],
): TicketImpact {
  const currentAvgTicket = client.avgTicket || 250;

  // Estimate additional revenue from top recommendations
  const topRecs = recs.filter(r => r.propensityScore > 40).slice(0, 2);
  const expectedAddOnRevenue = topRecs.reduce(
    (s, r) => s + (r.price * r.propensityScore / 100),
    0,
  );

  const expectedRetailRevenue = retail
    .filter(r => r.propensity > 40)
    .slice(0, 1)
    .reduce((s, r) => s + (r.price * r.propensity / 100), 0);

  const projectedTicket = currentAvgTicket + expectedAddOnRevenue + expectedRetailRevenue;
  const upliftDollar = projectedTicket - currentAvgTicket;
  const upliftPercent = currentAvgTicket > 0 ? (upliftDollar / currentAvgTicket) * 100 : 0;

  // Estimate annual impact based on visit frequency
  const visitsPerYear = Math.max(4, client.visitCount > 0 ? (client.visitCount / Math.max(1, yearsAsClient(client))) : 6);

  return {
    currentAvgTicket: Math.round(currentAvgTicket),
    projectedTicket: Math.round(projectedTicket),
    upliftPercent: Math.round(upliftPercent * 10) / 10,
    upliftDollar: Math.round(upliftDollar),
    annualRevenueImpact: Math.round(upliftDollar * visitsPerYear),
  };
}

// ── BATCH ANALYSIS ──

export interface BatchUpsellResult {
  totalClientsAnalyzed: number;
  avgPropensityScore: number;
  totalRevenueOpportunity: number;
  avgTicketUplift: number;
  membershipConversionCandidates: number;
  topOpportunities: Array<{
    clientName: string;
    recommendation: string;
    estimatedRevenue: number;
    propensity: number;
  }>;
}

export function analyzeBatchUpsells(
  clients: UpsellClientProfile[],
  availableAddOns: AddOnService[],
  membershipPlans: MembershipPlanInfo[],
  productCatalog: RetailProduct[],
): BatchUpsellResult {
  let totalPropensity = 0;
  let totalRevOpp = 0;
  let totalUplift = 0;
  let membershipCandidates = 0;
  const topOpps: BatchUpsellResult['topOpportunities'] = [];

  for (const client of clients) {
    const lastService = client.servicesUsed[client.servicesUsed.length - 1];
    const result = generateUpsellRecommendations({
      client,
      currentService: lastService,
      visitContext: 'checkout',
      availableAddOns,
      membershipPlans,
      productCatalog,
    });

    const topRec = result.recommendations[0];
    if (topRec) {
      totalPropensity += topRec.propensityScore;
      totalRevOpp += topRec.revenueImpact;
      topOpps.push({
        clientName: client.name,
        recommendation: topRec.service,
        estimatedRevenue: topRec.revenueImpact,
        propensity: topRec.propensityScore,
      });
    }

    totalUplift += result.ticketImpact.upliftDollar;
    if (result.membershipConversion?.eligible) membershipCandidates++;
  }

  return {
    totalClientsAnalyzed: clients.length,
    avgPropensityScore: clients.length > 0 ? Math.round(totalPropensity / clients.length) : 0,
    totalRevenueOpportunity: Math.round(totalRevOpp),
    avgTicketUplift: clients.length > 0 ? Math.round(totalUplift / clients.length) : 0,
    membershipConversionCandidates: membershipCandidates,
    topOpportunities: topOpps
      .sort((a, b) => b.estimatedRevenue * b.propensity - a.estimatedRevenue * a.propensity)
      .slice(0, 20),
  };
}

// ── HELPERS ──

function getEstimatedPrice(service: string): number {
  const prices: Record<string, number> = {
    'HydraFacial': 275, 'VI Peel': 395, 'PRX-T33': 495, 'RF Microneedling': 650,
    'Sofwave': 3500, 'PicoWay': 475, 'Botox': 350, 'Fillers': 650, 'Lip Filler': 550,
    'Laser Hair Removal': 200, 'BioRePeel': 350, 'GLP-1': 499,
    'B12 Injection': 35, 'Glutathione Injection': 100, 'Vitamin D3 Injection': 50,
    'Tri-Immune Injection': 75, 'NAD+ Injection': 300,
    'LED Light Therapy': 75, 'Lip Perk': 50, 'Eye Perk': 50,
    'Lymphatic Drainage': 100, 'PRP Enhancement': 200, 'Growth Factor Serum': 150,
    'Exosome Treatment': 300, 'Post-Peel Kit': 65, 'VI Peel Boost': 100,
  };
  return prices[service] || 250;
}

function getEstimatedDuration(service: string): number {
  const durations: Record<string, number> = {
    'LED Light Therapy': 15, 'Lip Perk': 10, 'Eye Perk': 10,
    'Lymphatic Drainage': 20, 'PRP Enhancement': 15,
    'Growth Factor Serum': 5, 'Exosome Treatment': 10,
  };
  return durations[service] || 15;
}

function getServiceCategory(service: string): string {
  const categories: Record<string, string> = {
    'HydraFacial': 'Facial', 'VI Peel': 'Facial', 'PRX-T33': 'Facial',
    'RF Microneedling': 'Skin Renewal', 'Sofwave': 'Skin Tightening',
    'PicoWay': 'Laser', 'Botox': 'Injectable', 'Fillers': 'Injectable',
    'Lip Filler': 'Injectable', 'Laser Hair Removal': 'Laser',
    'GLP-1': 'Wellness', 'B12 Injection': 'Wellness', 'NAD+ Injection': 'Wellness',
  };
  return categories[service] || 'Other';
}

function calculateAnnualSpend(client: UpsellClientProfile): number {
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

  return client.purchaseHistory
    .filter(p => new Date(p.date) >= oneYearAgo)
    .reduce((s, p) => s + p.amount, 0);
}

function yearsAsClient(client: UpsellClientProfile): number {
  if (client.purchaseHistory.length === 0) return 1;
  const firstVisit = new Date(client.purchaseHistory[client.purchaseHistory.length - 1].date);
  return Math.max(1, (Date.now() - firstVisit.getTime()) / (365.25 * 86400000));
}

function bestTimingForType(type: string, currentContext: string): UpsellRecommendation['timing'] {
  if (type === 'add-on') return currentContext === 'during-treatment' ? 'during-treatment' : 'check-in';
  return 'checkout';
}

export { COMPATIBILITY_MATRIX };
