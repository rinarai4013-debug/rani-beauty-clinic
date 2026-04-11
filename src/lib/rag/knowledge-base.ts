/**
 * RAG Knowledge Base Engine
 *
 * Semantic search over Rani Beauty Clinic's treatment protocols,
 * aftercare guides, FAQs, consultation scripts, and service data.
 *
 * Uses Pinecone for vector storage + Claude for embedding generation.
 *
 * Capabilities:
 * 1. Ingest treatment protocols, FAQs, aftercare, service info
 * 2. Semantic search with relevance scoring
 * 3. Context retrieval for AI chat, consult co-pilot, phone agent
 * 4. Knowledge gap detection (what info is missing)
 * 5. Auto-categorization of ingested documents
 * 6. Source attribution for compliance
 */

import { env } from '@/lib/env';

// ── TYPES ──

export interface KnowledgeDocument {
  id: string;
  title: string;
  content: string;
  category: DocumentCategory;
  service?: string;
  tags: string[];
  source: 'manual' | 'protocol' | 'faq' | 'aftercare' | 'training';
  lastUpdated: string; // ISO date
  version: number;
  approved: boolean;
}

export type DocumentCategory =
  | 'treatment_protocol'
  | 'aftercare'
  | 'faq'
  | 'consultation_script'
  | 'pricing'
  | 'policy'
  | 'contraindication'
  | 'product_info'
  | 'training'
  | 'compliance';

export interface SearchResult {
  document: KnowledgeDocument;
  relevanceScore: number;
  matchedChunk: string;
  chunkIndex: number;
}

export interface KnowledgeBaseStats {
  totalDocuments: number;
  byCategory: Record<string, number>;
  byService: Record<string, number>;
  lastUpdated: string;
  coverageScore: number; // 0-100
  knowledgeGaps: KnowledgeGap[];
  recentSearches: RecentSearch[];
  indexHealth: 'healthy' | 'stale' | 'needs_update';
}

export interface KnowledgeGap {
  area: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  suggestedAction: string;
}

export interface RecentSearch {
  query: string;
  resultsFound: number;
  timestamp: string;
  category?: string;
}

export interface ChunkMetadata {
  documentId: string;
  chunkIndex: number;
  category: DocumentCategory;
  service?: string;
  title: string;
  tags: string[];
}

export interface RAGContext {
  query: string;
  results: SearchResult[];
  contextText: string;
  confidence: number; // 0-100
  sources: { title: string; category: string }[];
}

// ── CONSTANTS ──

const CHUNK_SIZE = 500; // characters per chunk
const CHUNK_OVERLAP = 50; // overlap between chunks
const TOP_K = 5; // default number of results
const INDEX_NAME = 'rani-knowledge-base';
const EMBEDDING_DIMENSION = 1536; // OpenAI text-embedding-3-small default; Voyage voyage-3-lite uses 1024 (auto-detected)

// Coverage requirements per service
const REQUIRED_COVERAGE: Record<string, DocumentCategory[]> = {
  'Botox': ['treatment_protocol', 'aftercare', 'faq', 'contraindication', 'pricing'],
  'HydraFacial': ['treatment_protocol', 'aftercare', 'faq', 'pricing'],
  'Sofwave': ['treatment_protocol', 'aftercare', 'faq', 'contraindication', 'pricing', 'consultation_script'],
  'VI Peel': ['treatment_protocol', 'aftercare', 'faq', 'contraindication', 'pricing'],
  'RF Microneedling': ['treatment_protocol', 'aftercare', 'faq', 'contraindication', 'pricing'],
  'Laser Hair Removal': ['treatment_protocol', 'aftercare', 'faq', 'contraindication', 'pricing'],
  'GLP-1': ['treatment_protocol', 'faq', 'contraindication', 'pricing', 'policy', 'consultation_script'],
  'Fillers': ['treatment_protocol', 'aftercare', 'faq', 'contraindication', 'pricing'],
  'NAD+ Injection': ['treatment_protocol', 'faq', 'pricing'],
  'PicoWay': ['treatment_protocol', 'aftercare', 'faq', 'contraindication', 'pricing'],
  'PRX-T33': ['treatment_protocol', 'aftercare', 'faq', 'pricing'],
};

// ── RANI KNOWLEDGE BASE (Built-in Content) ──

const RANI_KNOWLEDGE: KnowledgeDocument[] = [
  // ── TREATMENT PROTOCOLS ──
  {
    id: 'proto-botox',
    title: 'Botox Treatment Protocol',
    content: `Botox (onabotulinumtoxinA) is administered by our physician provider.

    Pre-treatment: Review medical history, confirm no contraindications (pregnancy, neuromuscular disorders, allergy to botulinum toxin). Photograph treatment areas. Discuss goals and expected outcomes.

    Treatment areas: Forehead lines (10-20 units), glabellar/frown lines (20-25 units), crow's feet (12-24 units), bunny lines (5-10 units), lip flip (4-6 units), chin dimpling (6-8 units), masseter/jawline slimming (25-50 units per side), platysmal bands (20-40 units).

    Technique: Use 30-gauge needle. Mark injection points. Clean with alcohol prep. Inject intramuscularly at marked points. Apply gentle pressure post-injection.

    Expected results: Onset 3-5 days, full effect at 14 days. Duration 3-4 months. First-time patients may metabolize faster. Recommend maintenance every 3 months for consistent results.

    Pricing: Per unit pricing. Average treatment $300-500 depending on areas treated. Membership includes 10% off all injectables.`,
    category: 'treatment_protocol',
    service: 'Botox',
    tags: ['injectable', 'neurotoxin', 'wrinkles', 'anti-aging', 'physician'],
    source: 'protocol',
    lastUpdated: '2026-03-01',
    version: 3,
    approved: true,
  },
  {
    id: 'proto-hydrafacial',
    title: 'HydraFacial Treatment Protocol',
    content: `HydraFacial uses patented Vortex-Fusion technology for a multi-step treatment.

    Steps: 1) Cleanse + Peel - gentle exfoliation using hydradermabrasion tip, 2) Extract + Hydrate - painless suction removes debris from pores while delivering moisturizing serums, 3) Fuse + Protect - antioxidants and peptides are infused to maximize glow.

    Duration: 30-45 minutes for signature facial. 60 minutes with boosters.

    Boosters available: Dermabuilder (peptide complex $75), Britenol (brightening $75), Growth Factor ($100), CTGF (connective tissue $50).

    Contraindications: Active rashes, sunburn, open wounds in treatment area. Safe for all skin types and tones. Can be performed during pregnancy (no chemical agents).

    Results: Immediate improvement in skin texture, tone, and hydration. No downtime. Recommend monthly maintenance for optimal results. Series of 6 for best transformation.

    Pricing: Signature HydraFacial $249. Deluxe with boosters $350. Package of 3: $675.`,
    category: 'treatment_protocol',
    service: 'HydraFacial',
    tags: ['facial', 'hydration', 'exfoliation', 'no-downtime', 'all-skin-types'],
    source: 'protocol',
    lastUpdated: '2026-03-01',
    version: 2,
    approved: true,
  },
  {
    id: 'proto-sofwave',
    title: 'Sofwave SUPERB Treatment Protocol',
    content: `Sofwave uses Synchronous Ultrasound Parallel Beam (SUPERB) technology for non-invasive skin tightening and lifting.

    Treatment depth: 1.5mm in the mid-dermis, precisely targeting the area that generates new collagen and elastin.

    Areas: Full face, neck, submental (double chin), brow lift, jowl tightening. Can treat above and below the neck.

    Duration: 30-45 minutes for full face. Integrated cooling (Sofcool) for patient comfort.

    Pre-treatment: Clean skin, remove all makeup. Apply ultrasound gel. No topical numbing required in most cases (integrated cooling provides comfort).

    Technique: Systematic passes across treatment zone. Ensure proper contact with skin. Follow Sofwave treatment grid for consistent coverage.

    Results: Collagen remodeling begins immediately. Visible lifting at 4-6 weeks. Optimal results at 3 months. Results last 1-2 years. Single treatment typically sufficient.

    Pricing: Full face $2,750. Face + neck $3,500. Face + neck + submental $4,500. Financing available through Cherry (0% APR for 12 months).

    Contraindications: Open wounds in treatment area, active skin infection, implanted electrical devices in treatment area. Safe for all skin types.`,
    category: 'treatment_protocol',
    service: 'Sofwave',
    tags: ['skin-tightening', 'ultrasound', 'non-invasive', 'collagen', 'lifting', 'high-value'],
    source: 'protocol',
    lastUpdated: '2026-02-15',
    version: 2,
    approved: true,
  },
  {
    id: 'proto-glp1',
    title: 'GLP-1 Medical Weight Loss Protocol',
    content: `GLP-1 receptor agonist (semaglutide/tirzepatide) program for medical weight loss under physician supervision.

    Eligibility: BMI >= 27 with weight-related comorbidity OR BMI >= 30. Must complete medical intake and lab work. Not suitable for: pregnancy/planning pregnancy, personal/family history of medullary thyroid carcinoma, MEN2 syndrome.

    Program structure:
    - Month 1: 0.25mg weekly (titration dose)
    - Month 2: 0.5mg weekly
    - Month 3: 1.0mg weekly
    - Month 4+: 1.7-2.4mg weekly (maintenance)

    Monthly visits include: weight check, body composition measurement, side effect management, dose adjustment, nutritional guidance.

    Common side effects: Nausea (managed with anti-nausea protocol), decreased appetite, constipation. Most side effects resolve within 2-4 weeks at each dose level.

    Expected results: 15-20% body weight reduction over 6-12 months. Average 2-4 lbs/week during active weight loss phase.

    Pricing: $499/month includes medication, physician oversight, monthly monitoring. $399/month for members. Lab work additional if needed.

    IMPORTANT: This is a medical program requiring physician oversight. All injections are IM (intramuscular) - never use the word "infusion."`,
    category: 'treatment_protocol',
    service: 'GLP-1',
    tags: ['weight-loss', 'semaglutide', 'medical', 'physician', 'monthly-program'],
    source: 'protocol',
    lastUpdated: '2026-03-10',
    version: 4,
    approved: true,
  },

  // ── AFTERCARE GUIDES ──
  {
    id: 'after-botox',
    title: 'Botox Aftercare Instructions',
    content: `Post-Botox Instructions - Rani Beauty Clinic

    First 4 hours: Stay upright, do not lie down. Avoid touching, rubbing, or massaging treated areas. Gently exercise facial muscles (frown, raise eyebrows, squint) to help product settle into muscles.

    First 24 hours: Avoid strenuous exercise, alcohol, blood thinners (aspirin, ibuprofen), hot tubs, saunas, and facials. Do not wear hats or headbands that press on treated areas.

    First 2 weeks: Avoid dental work if possible (especially jaw/masseter treatments). No facial massages or treatments. Mild bruising or swelling is normal - use cold compress if needed.

    When to call us: Severe headache that doesn't resolve with Tylenol, difficulty swallowing or breathing (rare), significant asymmetry after 2 weeks, drooping eyelid (ptosis).

    Follow-up: Schedule 2-week follow-up to assess results. Touch-ups available if needed (within 30 days of initial treatment at no additional charge). Book your next appointment at 3-month mark for maintenance.`,
    category: 'aftercare',
    service: 'Botox',
    tags: ['post-treatment', 'instructions', 'safety', 'injectable'],
    source: 'aftercare',
    lastUpdated: '2026-02-01',
    version: 2,
    approved: true,
  },
  {
    id: 'after-laser',
    title: 'Laser Hair Removal Aftercare',
    content: `Post-Laser Hair Removal Instructions - Rani Beauty Clinic (GentleMax Pro Plus)

    Immediately after: Mild redness and warmth is normal (like mild sunburn). Apply provided aloe vera gel to treated areas.

    First 24-48 hours: Avoid hot showers, saunas, steam rooms, and hot tubs. No strenuous exercise. Do not apply makeup or deodorant to treated areas. Wear loose, breathable clothing.

    First 2 weeks: Apply SPF 50+ sunscreen daily to treated areas (even if under clothing and UV exposure is limited). Avoid direct sun exposure. Do not wax, tweeze, or pluck hairs - shaving is OK. Exfoliate gently starting day 5 to help shedding.

    Hair shedding: Treated hairs will fall out over 1-3 weeks. This is normal and a sign the treatment is working. Avoid picking or pulling at hairs.

    Between sessions: Continue shaving as needed. Avoid self-tanning products on treated areas. Maintain SPF protection.

    Next appointment: Schedule 4-6 weeks apart for face, 6-8 weeks for body areas. Total of 6-8 sessions typically needed for 80-90% permanent reduction.`,
    category: 'aftercare',
    service: 'Laser Hair Removal',
    tags: ['post-treatment', 'instructions', 'laser', 'hair-removal', 'spf'],
    source: 'aftercare',
    lastUpdated: '2026-02-01',
    version: 2,
    approved: true,
  },

  // ── FAQs ──
  {
    id: 'faq-general',
    title: 'General Clinic FAQs',
    content: `Frequently Asked Questions - Rani Beauty Clinic

    Q: Where is Rani Beauty Clinic located?
    A: We are located at 401 Olympia Ave NE, Suite 101, Renton, WA 98056. We serve clients from Renton, Bellevue, Seattle, Kent, Auburn, and surrounding areas.

    Q: What are your hours?
    A: Monday-Friday 9AM-6PM, Saturday 10AM-4PM. Closed Sundays. Extended hours available by appointment.

    Q: Do you offer free consultations?
    A: Yes! All consultations are complimentary. Book online or call (425) 539-4440.

    Q: What forms of payment do you accept?
    A: We accept all major credit cards, cash, and Cherry financing (0% APR plans available). HSA/FSA cards accepted for eligible treatments.

    Q: Do you offer financing?
    A: Yes, through Cherry Patient Financing. Apply in-clinic or online. Plans from 0% APR for 6-24 months. Most patients are approved in minutes.

    Q: Is there a membership program?
    A: Yes! Our Rani Beauty Membership includes exclusive discounts (10-15% off services), priority booking, complimentary monthly services, and member-only pricing on products.

    Q: Are your treatments physician-supervised?
    A: Yes, all medical treatments at Rani Beauty Clinic are performed under physician supervision. Our provider is a licensed medical professional with extensive aesthetic training.

    Q: Do you offer package pricing?
    A: Yes, we offer treatment packages for most services at significant savings. Ask about our current packages during your consultation.`,
    category: 'faq',
    tags: ['general', 'location', 'hours', 'payment', 'financing', 'membership'],
    source: 'faq',
    lastUpdated: '2026-03-15',
    version: 5,
    approved: true,
  },
  {
    id: 'faq-safety',
    title: 'Safety & Contraindication FAQs',
    content: `Safety FAQs - Rani Beauty Clinic

    Q: Is Botox safe?
    A: Yes, Botox has been FDA-approved since 2002 and has an excellent safety profile. Side effects are typically minor and temporary (mild bruising, headache). Serious complications are extremely rare when administered by a trained professional.

    Q: Can I get laser treatments on dark skin?
    A: Yes! Our GentleMax Pro Plus laser is specifically designed to work safely and effectively on all skin tones, including melanin-rich skin (Fitzpatrick types IV-VI). This dual-wavelength laser (Alexandrite + Nd:YAG) allows us to customize treatment for every skin type.

    Q: Is Sofwave safe?
    A: Yes, Sofwave is FDA-cleared and clinically proven safe for all skin types. The SUPERB technology targets only the mid-dermis (1.5mm) with integrated Sofcool cooling to protect the skin surface.

    Q: Can I get treatments while pregnant or nursing?
    A: Most aesthetic treatments are not recommended during pregnancy or nursing. HydraFacial (without chemical boosters) is generally considered safe. Always inform us if you are pregnant, nursing, or planning to become pregnant.

    Q: What should I tell my provider before treatment?
    A: Please inform us of all medications (especially blood thinners), allergies, recent dental work, skin conditions, autoimmune disorders, and if you are pregnant/nursing. Complete our intake form before your appointment.`,
    category: 'faq',
    tags: ['safety', 'contraindications', 'pregnancy', 'skin-types', 'medications'],
    source: 'faq',
    lastUpdated: '2026-03-01',
    version: 3,
    approved: true,
  },

  // ── POLICIES ──
  {
    id: 'policy-cancel',
    title: 'Cancellation & No-Show Policy',
    content: `Rani Beauty Clinic - Cancellation Policy

    We require 24-hour notice for all cancellations and rescheduling. Late cancellations (less than 24 hours) are subject to a $50 fee. No-shows will be charged 50% of the scheduled service cost.

    Exceptions: Emergency situations will be handled on a case-by-case basis. First-time clients receive one courtesy waiver.

    How to cancel/reschedule: Call (425) 539-4440, text us, or rebook through your Mangomint client portal.

    Deposits: Some high-value treatments (Sofwave, laser packages) require a deposit at booking. Deposits are applied to your treatment cost. Deposits are non-refundable for no-shows.

    Late arrivals: Appointments starting 15+ minutes late may need to be shortened or rescheduled. We do our best to accommodate but cannot guarantee full treatment time.`,
    category: 'policy',
    tags: ['cancellation', 'no-show', 'deposit', 'reschedule', 'policy'],
    source: 'manual',
    lastUpdated: '2026-01-15',
    version: 2,
    approved: true,
  },
  {
    id: 'policy-consent',
    title: 'Informed Consent & Privacy Policy',
    content: `Rani Beauty Clinic - Consent & Privacy

    All clients must complete our digital intake form (via Typeform) before their first appointment. This includes medical history, treatment consent, photo consent, and privacy acknowledgment.

    Before/After Photos: We request permission to photograph treatment areas for your personal records and progress tracking. Photos used for marketing require separate written consent. All photos are stored securely.

    HIPAA Compliance: We follow HIPAA guidelines for all medical records and personal health information. Your information is never shared with third parties without your explicit consent.

    Communication: By providing your phone number, you consent to receive appointment confirmations and reminders via SMS. Marketing messages require separate opt-in. You can opt out of SMS at any time by texting STOP.`,
    category: 'policy',
    tags: ['consent', 'privacy', 'hipaa', 'photos', 'communication'],
    source: 'manual',
    lastUpdated: '2026-01-15',
    version: 2,
    approved: true,
  },

  // ── PRODUCT INFO ──
  {
    id: 'product-skincare',
    title: 'Rx Skincare Products',
    content: `Rani Beauty Clinic - Prescription Skincare

    Tretinoin (Rx): $99/month subscription. Available in 0.025%, 0.05%, and 0.1% concentrations. Gold standard for anti-aging, acne, and skin texture. Physician prescribed based on skin assessment.

    How to use: Apply pea-sized amount to clean, dry skin at night. Start every other night for 2-4 weeks, then nightly. Always use SPF 50+ during the day. Expect mild peeling/dryness during initial adjustment period (2-6 weeks).

    Recommended supporting products:
    - Gentle cleanser (CeraVe, La Roche-Posay)
    - Hyaluronic acid serum (morning and night)
    - Moisturizer (morning and night)
    - SPF 50+ broad spectrum (morning, reapply every 2 hours in sun)

    When to avoid: Pregnancy/nursing, active eczema flare-ups, recent chemical peels or laser treatments (wait 2 weeks). Discontinue 1 week before waxing.`,
    category: 'product_info',
    tags: ['tretinoin', 'skincare', 'prescription', 'anti-aging', 'acne'],
    source: 'manual',
    lastUpdated: '2026-02-01',
    version: 2,
    approved: true,
  },

  // ── WELLNESS ──
  {
    id: 'proto-wellness',
    title: 'Wellness Injection Protocols',
    content: `Rani Beauty Clinic - Wellness Injection Menu

    All wellness injections are IM (intramuscular). NEVER use the word "infusion."

    Vitamin B12 ($35): Energy boost, metabolism support. IM injection, gluteal or deltoid. Recommended weekly or bi-weekly.

    Vitamin D3 ($50): Bone health, immune support, mood regulation. IM injection. Recommended monthly for deficient patients.

    Tri-Immune ($75): Vitamin C + Zinc + Glutathione. Immune system boost. IM injection. Popular during cold/flu season or pre-travel.

    Glutathione ($100): Master antioxidant. Skin brightening, detox support, anti-aging at cellular level. IM injection. Recommended weekly for 4-8 weeks, then monthly maintenance.

    NAD+ ($150-500): Cellular energy, anti-aging, mental clarity. IM injection. Dose-dependent pricing. Recommended weekly for 4 weeks, then bi-weekly or monthly.

    Important: All wellness injections require brief health screening. Not suitable for patients with certain allergies or conditions. Physician approval required for first-time patients.`,
    category: 'treatment_protocol',
    service: 'NAD+ Injection',
    tags: ['wellness', 'injections', 'b12', 'nad', 'glutathione', 'immune'],
    source: 'protocol',
    lastUpdated: '2026-03-01',
    version: 3,
    approved: true,
  },
];

// ── MAIN ENGINE ──

export function buildKnowledgeBase(
  additionalDocs: KnowledgeDocument[] = []
): KnowledgeBaseStats {
  const allDocs = [...RANI_KNOWLEDGE, ...additionalDocs];

  const byCategory: Record<string, number> = {};
  const byService: Record<string, number> = {};

  allDocs.forEach(doc => {
    byCategory[doc.category] = (byCategory[doc.category] || 0) + 1;
    if (doc.service) {
      byService[doc.service] = (byService[doc.service] || 0) + 1;
    }
  });

  const knowledgeGaps = detectKnowledgeGaps(allDocs);
  const coverageScore = calculateCoverageScore(allDocs);

  return {
    totalDocuments: allDocs.length,
    byCategory,
    byService,
    lastUpdated: new Date().toISOString(),
    coverageScore,
    knowledgeGaps,
    recentSearches: [],
    indexHealth: allDocs.length > 10 ? 'healthy' : 'needs_update',
  };
}

/**
 * Search the knowledge base using keyword matching.
 * In production, this would use Pinecone vector similarity search.
 */
export function searchKnowledgeBase(
  query: string,
  options: {
    category?: DocumentCategory;
    service?: string;
    topK?: number;
  } = {}
): SearchResult[] {
  const { category, service, topK = TOP_K } = options;

  let docs = [...RANI_KNOWLEDGE];

  // Filter by category/service if specified
  if (category) docs = docs.filter(d => d.category === category);
  if (service) docs = docs.filter(d => d.service === service);

  // Simple keyword scoring (Pinecone would do this via embeddings)
  const queryTerms = query.toLowerCase().split(/\s+/).filter(t => t.length > 2);

  const scored = docs.map(doc => {
    const contentLower = doc.content.toLowerCase();
    const titleLower = doc.title.toLowerCase();
    const tagStr = doc.tags.join(' ').toLowerCase();

    let score = 0;

    queryTerms.forEach(term => {
      // Title match (highest weight)
      if (titleLower.includes(term)) score += 30;
      // Tag match (high weight)
      if (tagStr.includes(term)) score += 20;
      // Content match (frequency-based)
      const contentMatches = (contentLower.match(new RegExp(term, 'g')) || []).length;
      score += Math.min(contentMatches * 5, 25); // cap at 25
    });

    // Find best matching chunk
    const chunks = chunkDocument(doc.content);
    let bestChunk = chunks[0] || '';
    let bestChunkScore = 0;
    let bestChunkIndex = 0;

    chunks.forEach((chunk, idx) => {
      const chunkLower = chunk.toLowerCase();
      const chunkScore = queryTerms.reduce((s, term) => {
        return s + (chunkLower.includes(term) ? 10 : 0);
      }, 0);
      if (chunkScore > bestChunkScore) {
        bestChunk = chunk;
        bestChunkScore = chunkScore;
        bestChunkIndex = idx;
      }
    });

    return {
      document: doc,
      relevanceScore: Math.min(score, 100),
      matchedChunk: bestChunk,
      chunkIndex: bestChunkIndex,
    };
  });

  return scored
    .filter(r => r.relevanceScore > 0)
    .sort((a, b) => b.relevanceScore - a.relevanceScore)
    .slice(0, topK);
}

/**
 * Build RAG context for AI responses.
 * Searches knowledge base and formats results as context for Claude.
 */
export function buildRAGContext(
  query: string,
  options: {
    category?: DocumentCategory;
    service?: string;
    maxContextLength?: number;
  } = {}
): RAGContext {
  const { maxContextLength = 3000 } = options;
  const results = searchKnowledgeBase(query, options);

  // Build context string from results
  let contextText = '';
  const sources: { title: string; category: string }[] = [];

  for (const result of results) {
    const chunk = `### ${result.document.title}\n${result.matchedChunk}\n\n`;
    if (contextText.length + chunk.length > maxContextLength) break;
    contextText += chunk;
    sources.push({
      title: result.document.title,
      category: result.document.category,
    });
  }

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.relevanceScore, 0) / results.length)
    : 0;

  return {
    query,
    results,
    contextText,
    confidence: avgScore,
    sources,
  };
}

/**
 * Get all documents for a specific service.
 */
export function getServiceDocuments(service: string): KnowledgeDocument[] {
  return RANI_KNOWLEDGE.filter(d => d.service === service || d.tags.includes(service.toLowerCase()));
}

/**
 * Get all documents, optionally filtered.
 */
export function getAllDocuments(filter?: {
  category?: DocumentCategory;
  service?: string;
  approved?: boolean;
}): KnowledgeDocument[] {
  let docs = [...RANI_KNOWLEDGE];
  if (filter?.category) docs = docs.filter(d => d.category === filter.category);
  if (filter?.service) docs = docs.filter(d => d.service === filter.service);
  if (filter?.approved !== undefined) docs = docs.filter(d => d.approved === filter.approved);
  return docs;
}

// ── PINECONE INTEGRATION ──
// These functions are ready for Pinecone when the index is created

export interface PineconeConfig {
  apiKey: string;
  indexName: string;
}

/**
 * Initialize Pinecone index for the knowledge base.
 * Call once to set up the vector store.
 */
export async function initializePineconeIndex(config: PineconeConfig): Promise<{
  success: boolean;
  message: string;
  vectorCount?: number;
}> {
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pc = new Pinecone({ apiKey: config.apiKey });

    // Check if index exists
    const indexes = await pc.listIndexes();
    const indexExists = indexes.indexes?.some(idx => idx.name === config.indexName);

    if (!indexExists) {
      // Create serverless index
      await pc.createIndex({
        name: config.indexName,
        dimension: EMBEDDING_DIMENSION,
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1',
          },
        },
      });
      return {
        success: true,
        message: `Index "${config.indexName}" created. Ready to ingest documents.`,
        vectorCount: 0,
      };
    }

    const index = pc.index(config.indexName);
    const stats = await index.describeIndexStats();

    return {
      success: true,
      message: `Index "${config.indexName}" exists with ${stats.totalRecordCount || 0} vectors.`,
      vectorCount: stats.totalRecordCount || 0,
    };
  } catch (error) {
    return {
      success: false,
      message: `Pinecone error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

/**
 * Upsert documents into Pinecone as chunked vectors.
 * Uses Voyage AI / OpenAI for real embeddings.
 * Requires VOYAGE_API_KEY or OPENAI_API_KEY to be set; aborts if unavailable.
 */
export async function upsertDocuments(
  config: PineconeConfig,
  documents: KnowledgeDocument[]
): Promise<{ success: boolean; chunksUpserted: number }> {
  try {
    const { Pinecone } = await import('@pinecone-database/pinecone');
    const pc = new Pinecone({ apiKey: config.apiKey });
    const index = pc.index(config.indexName);

    let totalChunks = 0;

    for (const doc of documents) {
      const chunks = chunkDocument(doc.content);

      const vectors = [];
      for (let i = 0; i < chunks.length; i++) {
        const embedding = await generateEmbedding(chunks[i]);
        if (!embedding) {
          console.error(`[RAG] Cannot upsert documents without embedding API key. Aborting upsert.`);
          return { success: false, chunksUpserted: 0 };
        }
        vectors.push({
          id: `${doc.id}_chunk_${i}`,
          values: embedding,
          metadata: {
            documentId: doc.id,
            chunkIndex: i,
            category: doc.category,
            service: doc.service || '',
            title: doc.title,
            tags: doc.tags.join(','),
            content: chunks[i],
          },
        });
      }

      // Batch upsert (Pinecone limit: 100 vectors per batch)
      for (let i = 0; i < vectors.length; i += 100) {
        await index.upsert({ records: vectors.slice(i, i + 100) } as Parameters<typeof index.upsert>[0]);
      }

      totalChunks += vectors.length;
    }

    return { success: true, chunksUpserted: totalChunks };
  } catch (error) {
    console.error('Pinecone upsert error:', error);
    return { success: false, chunksUpserted: 0 };
  }
}

/**
 * Search Pinecone vector database for semantically similar documents.
 * Requires PINECONE_API_KEY and VOYAGE_API_KEY or OPENAI_API_KEY environment variables.
 */
export async function searchPinecone(
  query: string,
  options: {
    category?: DocumentCategory;
    service?: string;
    topK?: number;
  } = {}
): Promise<RAGContext> {
  const { topK = TOP_K } = options;

  const queryEmbedding = await generateEmbedding(query);
  if (!queryEmbedding) {
    throw new Error('Cannot generate query embedding - VOYAGE_API_KEY or OPENAI_API_KEY not set');
  }

  const { Pinecone } = await import('@pinecone-database/pinecone');
  const pc = new Pinecone({ apiKey: env.PINECONE_API_KEY });
  const index = pc.index(INDEX_NAME);

  const filter: Record<string, string> = {};
  if (options.category) filter.category = options.category;
  if (options.service) filter.service = options.service;

  const queryResult = await index.query({
    vector: queryEmbedding,
    topK,
    includeMetadata: true,
    ...(Object.keys(filter).length > 0 ? { filter } : {}),
  });

  const results: SearchResult[] = (queryResult.matches || []).map(match => ({
    document: {
      id: (match.metadata?.documentId as string) || match.id,
      title: (match.metadata?.title as string) || '',
      content: (match.metadata?.content as string) || '',
      category: (match.metadata?.category as DocumentCategory) || 'faq',
      service: (match.metadata?.service as string) || undefined,
      tags: ((match.metadata?.tags as string) || '').split(',').filter(Boolean),
      source: 'manual' as const,
      lastUpdated: new Date().toISOString(),
      version: 1,
      approved: true,
    },
    relevanceScore: Math.round((match.score || 0) * 100),
    matchedChunk: (match.metadata?.content as string) || '',
    chunkIndex: (match.metadata?.chunkIndex as number) || 0,
  }));

  let contextText = '';
  const sources: { title: string; category: string }[] = [];

  for (const result of results) {
    const chunk = `### ${result.document.title}\n${result.matchedChunk}\n\n`;
    if (contextText.length + chunk.length > 3000) break;
    contextText += chunk;
    sources.push({
      title: result.document.title,
      category: result.document.category,
    });
  }

  const avgScore = results.length > 0
    ? Math.round(results.reduce((s, r) => s + r.relevanceScore, 0) / results.length)
    : 0;

  return { query, results, contextText, confidence: avgScore, sources };
}

// ── HELPER FUNCTIONS ──

function chunkDocument(content: string): string[] {
  const chunks: string[] = [];
  const sentences = content.split(/(?<=[.!?])\s+/);

  let currentChunk = '';

  for (const sentence of sentences) {
    if (currentChunk.length + sentence.length > CHUNK_SIZE && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // Overlap: keep last portion
      const words = currentChunk.split(' ');
      const overlapWords = words.slice(-Math.ceil(CHUNK_OVERLAP / 5));
      currentChunk = overlapWords.join(' ') + ' ' + sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks;
}

/**
 * Generate embeddings using Voyage AI / OpenAI.
 * Prefers Voyage AI (voyage-3-lite, 1024d) when VOYAGE_API_KEY is set.
 * Falls back to OpenAI (text-embedding-3-small, 1536d) if only OPENAI_API_KEY is available.
 * Returns null if no API key is available (caller should use keyword search instead).
 */
async function generateEmbedding(text: string): Promise<number[] | null> {
  const voyageApiKey = env.VOYAGE_API_KEY;
  const openaiApiKey = env.OPENAI_API_KEY;

  if (!voyageApiKey && !openaiApiKey) {
    console.warn('[RAG] No VOYAGE_API_KEY or OPENAI_API_KEY set - cannot generate embeddings. Falling back to keyword search.');
    return null;
  }

  // Determine which provider to use (Voyage AI preferred)
  const useVoyage = !!voyageApiKey;
  const apiKey = useVoyage ? voyageApiKey! : openaiApiKey!;
  const apiUrl = useVoyage
    ? 'https://api.voyageai.com/v1/embeddings'
    : 'https://api.openai.com/v1/embeddings';
  const model = useVoyage ? 'voyage-3-lite' : 'text-embedding-3-small';
  const provider = useVoyage ? 'Voyage AI' : 'OpenAI';

  try {
    const requestBody: Record<string, unknown> = {
      model,
      input: text,
    };

    // OpenAI supports explicit dimensions parameter; Voyage voyage-3-lite returns 1024d natively
    if (!useVoyage) {
      requestBody.dimensions = EMBEDDING_DIMENSION;
    }

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error(`[RAG] ${provider} embedding API error (${response.status}):`, errorBody);
      return null;
    }

    const result = await response.json();
    return result.data?.[0]?.embedding ?? null;
  } catch (error) {
    console.error(`[RAG] Failed to generate embedding via ${provider}:`, error);
    return null;
  }
}

function detectKnowledgeGaps(docs: KnowledgeDocument[]): KnowledgeGap[] {
  const gaps: KnowledgeGap[] = [];

  for (const [service, required] of Object.entries(REQUIRED_COVERAGE)) {
    const serviceDocs = docs.filter(d => d.service === service);
    const existingCategories = new Set(serviceDocs.map(d => d.category));

    for (const cat of required) {
      if (!existingCategories.has(cat)) {
        gaps.push({
          area: `${service} - ${cat.replace('_', ' ')}`,
          description: `Missing ${cat.replace('_', ' ')} documentation for ${service}`,
          priority: ['treatment_protocol', 'contraindication', 'aftercare'].includes(cat) ? 'high' : 'medium',
          suggestedAction: `Create ${cat.replace('_', ' ')} document for ${service} treatment`,
        });
      }
    }
  }

  // Check for stale documents (>90 days old)
  const now = new Date();
  docs.forEach(doc => {
    const updated = new Date(doc.lastUpdated);
    const daysSinceUpdate = Math.floor((now.getTime() - updated.getTime()) / (1000 * 60 * 60 * 24));
    if (daysSinceUpdate > 90) {
      gaps.push({
        area: doc.title,
        description: `Document last updated ${daysSinceUpdate} days ago`,
        priority: 'low',
        suggestedAction: `Review and update "${doc.title}" to ensure accuracy`,
      });
    }
  });

  return gaps.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

function calculateCoverageScore(docs: KnowledgeDocument[]): number {
  let totalRequired = 0;
  let totalCovered = 0;

  for (const [service, required] of Object.entries(REQUIRED_COVERAGE)) {
    const serviceDocs = docs.filter(d => d.service === service);
    const existingCategories = new Set(serviceDocs.map(d => d.category));

    totalRequired += required.length;
    totalCovered += required.filter(cat => existingCategories.has(cat)).length;
  }

  return totalRequired > 0 ? Math.round((totalCovered / totalRequired) * 100) : 0;
}
