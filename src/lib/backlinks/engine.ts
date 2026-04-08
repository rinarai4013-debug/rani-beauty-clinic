/**
 * Backlink Commander Engine
 *
 * Comprehensive backlink acquisition and monitoring system for Rani Beauty Clinic.
 * Generates directory submissions, HARO responses, broken link targets,
 * guest post prospects, outreach emails, and weekly action briefs.
 *
 * Location: 401 Olympia Ave NE, Suite 101, Renton, WA 98056
 * Phone: (425) 539-4440
 * Website: ranibeautyclinic.com
 * Medical Director: Dr. Alexander Landfield, Board-Certified Neurologist
 *
 * CRITICAL: Always "injection" — never "infusion."
 */

// ── TYPES ──

export interface BacklinkBrief {
  generatedAt: string;
  backlinkScore: number; // 0-100 overall health
  currentMetrics: BacklinkMetrics;
  directorySubmissions: DirectorySubmission[];
  haroOpportunities: HaroOpportunity[];
  brokenLinkTargets: BrokenLinkTarget[];
  guestPostProspects: GuestPostProspect[];
  outreachEmails: OutreachEmail[];
  weeklyActions: string[]; // prioritized action items
}

export interface BacklinkMetrics {
  dr: number;
  referringDomains: number;
  organicTraffic: number;
  trafficValue: number;
}

export type DirectoryCategory =
  | 'medical'
  | 'business'
  | 'local'
  | 'social'
  | 'industry'
  | 'citation'
  | 'beauty';

export interface DirectorySubmission {
  name: string;
  url: string;
  category: DirectoryCategory;
  estimatedDR: number;
  priority: 'high' | 'medium' | 'low';
  isFree: boolean;
  napRequired: boolean;
  status: 'not_submitted' | 'submitted' | 'verified';
  notes: string;
  submissionCopy: string;
}

export interface HaroOpportunity {
  queryTopic: string;
  relevanceScore: number;
  suggestedAngle: string;
  draftResponse: string;
  respondAs: string;
  deadline: string;
  estimatedDR: number;
}

export interface BrokenLinkTarget {
  targetSite: string;
  targetUrl: string;
  brokenUrl: string;
  replacementUrl: string;
  siteDR: number;
  outreachEmail: string;
}

export interface GuestPostProspect {
  siteName: string;
  siteUrl: string;
  contactPage: string;
  estimatedDR: number;
  topicSuggestions: string[];
  pitchEmail: string;
  category: 'local_news' | 'beauty_blog' | 'wellness' | 'lifestyle' | 'medical';
}

export type OutreachType =
  | 'haro_response'
  | 'guest_post_pitch'
  | 'broken_link'
  | 'local_partnership'
  | 'press_release';

export interface OutreachEmail {
  type: OutreachType;
  subject: string;
  body: string;
  followUpBody: string;
  followUpDelay: number; // days
  notes: string;
}

// ── CONSTANTS ──

const CLINIC = {
  name: 'Rani Beauty Clinic',
  address: '401 Olympia Ave NE, Suite 101, Renton, WA 98056',
  phone: '(425) 539-4440',
  website: 'https://ranibeautyclinic.com',
  email: 'info@ranibeautyclinic.com',
  medicalDirector: 'Dr. Alexander Landfield',
  medicalDirectorTitle: 'Board-Certified Neurologist & Medical Director',
  medicalDirectorCredentials: 'Dr. Alexander Landfield, Board-Certified Neurologist & Medical Director, Rani Beauty Clinic',
  owner: 'Raj Rai',
  ownerTitle: 'Founder & CEO',
} as const;

// ── BUSINESS DESCRIPTIONS ──

const BUSINESS_DESCRIPTIONS = {
  short: `Rani Beauty Clinic is a physician-supervised luxury medspa in Renton, WA. Led by a Board-Certified Medical Director, we offer advanced laser treatments with the Candela GentleMax Pro Plus, injectables, RF microneedling, medical weight loss, and wellness injections. Experience clinically-assured transformation.`,

  medium: `Rani Beauty Clinic is Renton's premier physician-supervised luxury medspa, where advanced medical aesthetics meets an elevated client experience. Under the guidance of our Board-Certified Medical Director, Dr. Alexander Landfield, every treatment is delivered with clinical precision and artistry. Our technology suite includes the Candela GentleMax Pro Plus for laser hair removal and skin rejuvenation, Sofwave for non-invasive skin tightening, and RF microneedling for deep dermal renewal. We specialize in injectables (Botox, fillers), HydraFacials, chemical peels, medical weight loss (GLP-1), and wellness injections including NAD+ and peptide therapy. Located at 401 Olympia Ave NE, Suite 101, Renton, WA 98056.`,

  long: `Rani Beauty Clinic is a physician-supervised luxury medical aesthetics clinic located in Renton, Washington, redefining the medspa experience through clinical excellence, advanced technology, and personalized treatment design. Under the leadership of Board-Certified Medical Director Dr. Alexander Landfield, every protocol is crafted with precision — combining medical rigor with an artist's eye for natural, transformative results.

Our state-of-the-art facility features the Candela GentleMax Pro Plus dual-wavelength laser platform for hair removal and pigment correction, Sofwave ultrasound technology for non-invasive skin tightening, and advanced RF microneedling systems for collagen induction therapy. We deliver expert injectable treatments including Botox and dermal fillers, signature HydraFacials, VI Peels, PRX-T33 biorevitalization, and PicoWay laser treatments.

Beyond aesthetics, Rani Beauty Clinic leads in physician-supervised medical weight loss featuring GLP-1 medications (tirzepatide, semaglutide), hormone replacement therapy for men and women, and a comprehensive wellness injection menu including NAD+, glutathione, Tri-Immune, and peptide therapy. Every client receives a customized treatment plan built around their unique goals, skin profile, and wellness aspirations.

Visit us at 401 Olympia Ave NE, Suite 101, Renton, WA 98056. Call (425) 539-4440 or book online at ranibeautyclinic.com.`,
} as const;

// ── HARO KEYWORD MONITORING ──

const HARO_WATCH_KEYWORDS = [
  // Injectables
  'botox', 'neurotoxin', 'dermal filler', 'lip filler', 'injectable', 'wrinkle treatment',
  // Laser
  'laser hair removal', 'laser treatment', 'IPL', 'skin rejuvenation', 'pigmentation',
  'laser skin', 'laser technology',
  // Skin
  'anti-aging', 'skin tightening', 'microneedling', 'RF microneedling', 'chemical peel',
  'hydrafacial', 'facial treatment', 'skin care routine', 'collagen',
  // Weight Loss
  'medical weight loss', 'GLP-1', 'semaglutide', 'tirzepatide', 'ozempic', 'wegovy',
  'weight management',
  // Wellness
  'NAD+', 'peptide therapy', 'wellness injection', 'vitamin injection', 'biohacking',
  'hormone therapy', 'HRT', 'testosterone therapy',
  // Industry
  'medspa', 'med spa', 'medical spa', 'aesthetics', 'cosmetic procedure',
  'beauty treatment', 'non-surgical', 'non-invasive',
  // Local
  'seattle beauty', 'pacific northwest', 'washington state', 'renton',
] as const;

const HARO_EXPERT_CATEGORIES = [
  'Beauty & Grooming',
  'Fitness & Healthcare',
  'Lifestyle & Fitness',
  'Business & Finance',
  'General',
] as const;

// ── CONTENT PAGE MAPPING ──

const RANI_CONTENT_PAGES: Record<string, string> = {
  'laser hair removal': 'https://ranibeautyclinic.com/services/laser-hair-removal',
  'hydrafacial': 'https://ranibeautyclinic.com/services/hydrafacial',
  'botox': 'https://ranibeautyclinic.com/services/botox-fillers',
  'fillers': 'https://ranibeautyclinic.com/services/botox-fillers',
  'injectables': 'https://ranibeautyclinic.com/services/botox-fillers',
  'rf microneedling': 'https://ranibeautyclinic.com/services/rf-microneedling',
  'microneedling': 'https://ranibeautyclinic.com/services/rf-microneedling',
  'sofwave': 'https://ranibeautyclinic.com/services/sofwave',
  'skin tightening': 'https://ranibeautyclinic.com/services/sofwave',
  'vi peel': 'https://ranibeautyclinic.com/services/vi-peel',
  'chemical peel': 'https://ranibeautyclinic.com/services/vi-peel',
  'picoway': 'https://ranibeautyclinic.com/services/picoway',
  'weight loss': 'https://ranibeautyclinic.com/services/weight-loss',
  'glp-1': 'https://ranibeautyclinic.com/services/weight-loss',
  'semaglutide': 'https://ranibeautyclinic.com/services/weight-loss',
  'tirzepatide': 'https://ranibeautyclinic.com/services/weight-loss',
  'wellness injections': 'https://ranibeautyclinic.com/services/wellness-injections',
  'nad+': 'https://ranibeautyclinic.com/services/wellness-injections',
  'peptides': 'https://ranibeautyclinic.com/services/wellness-injections',
  'hrt': 'https://ranibeautyclinic.com/services/hormone-therapy',
  'testosterone': 'https://ranibeautyclinic.com/services/hormone-therapy',
  'prx-t33': 'https://ranibeautyclinic.com/services/prx-t33',
  'about': 'https://ranibeautyclinic.com/about',
  'contact': 'https://ranibeautyclinic.com/contact',
  'services': 'https://ranibeautyclinic.com/services',
  'homepage': 'https://ranibeautyclinic.com',
};

// ── DIRECTORY DATABASE ──

function buildDirectoryDatabase(): DirectorySubmission[] {
  const dirs: Omit<DirectorySubmission, 'submissionCopy' | 'status'>[] = [
    // ── MEDICAL / HEALTH ──
    { name: 'Healthgrades', url: 'https://www.healthgrades.com', category: 'medical', estimatedDR: 90, priority: 'high', isFree: true, napRequired: true, notes: 'List Medical Director. Requires NPI.' },
    { name: 'Vitals', url: 'https://www.vitals.com', category: 'medical', estimatedDR: 78, priority: 'high', isFree: true, napRequired: true, notes: 'Provider profile. Verify with office phone.' },
    { name: 'WebMD Physician Directory', url: 'https://doctor.webmd.com', category: 'medical', estimatedDR: 94, priority: 'high', isFree: true, napRequired: true, notes: 'High-authority medical directory. List Dr. Landfield.' },
    { name: 'ZocDoc', url: 'https://www.zocdoc.com', category: 'medical', estimatedDR: 85, priority: 'high', isFree: false, napRequired: true, notes: 'Paid listing. Strong for booking integration. Medspa category available.' },
    { name: 'RealSelf', url: 'https://www.realself.com', category: 'medical', estimatedDR: 82, priority: 'high', isFree: false, napRequired: true, notes: 'Top cosmetic procedure directory. Before/after photos drive traffic. Worth paid tier.' },
    { name: 'RateMDs', url: 'https://www.ratemds.com', category: 'medical', estimatedDR: 72, priority: 'medium', isFree: true, napRequired: true, notes: 'Provider rating platform. Claim and optimize profile.' },
    { name: 'CareDash', url: 'https://www.caredash.com', category: 'medical', estimatedDR: 65, priority: 'medium', isFree: true, napRequired: true, notes: 'Growing medical directory. Free listing with review management.' },
    { name: 'Wellness.com', url: 'https://www.wellness.com', category: 'medical', estimatedDR: 58, priority: 'medium', isFree: true, napRequired: true, notes: 'Holistic/wellness focus. Good for wellness injection services.' },
    { name: 'Sharecare', url: 'https://www.sharecare.com', category: 'medical', estimatedDR: 76, priority: 'medium', isFree: true, napRequired: true, notes: 'WebMD partner platform. Provider directory.' },
    { name: 'Doximity', url: 'https://www.doximity.com', category: 'medical', estimatedDR: 80, priority: 'high', isFree: true, napRequired: true, notes: 'Physician network. Dr. Landfield should claim profile for referral backlinks.' },
    { name: 'Castle Connolly', url: 'https://www.castleconnolly.com', category: 'medical', estimatedDR: 68, priority: 'medium', isFree: false, napRequired: true, notes: 'Top Doctors directory. Application required.' },
    { name: 'U.S. News Health', url: 'https://health.usnews.com/doctors', category: 'medical', estimatedDR: 93, priority: 'high', isFree: true, napRequired: true, notes: 'Extremely high DR. Provider listing via Doximity sync.' },

    // ── GENERAL BUSINESS ──
    { name: 'Yelp', url: 'https://biz.yelp.com', category: 'business', estimatedDR: 94, priority: 'high', isFree: true, napRequired: true, notes: 'Must-have. Respond to all reviews. Add photos weekly.' },
    { name: 'Better Business Bureau (BBB)', url: 'https://www.bbb.org', category: 'business', estimatedDR: 93, priority: 'high', isFree: false, napRequired: true, notes: 'Accreditation builds trust. Annual fee. High DR backlink.' },
    { name: 'Manta', url: 'https://www.manta.com', category: 'business', estimatedDR: 72, priority: 'medium', isFree: true, napRequired: true, notes: 'Free business listing. Keep NAP consistent.' },
    { name: 'Hotfrog', url: 'https://www.hotfrog.com', category: 'business', estimatedDR: 60, priority: 'low', isFree: true, napRequired: true, notes: 'Simple listing. NAP citation value.' },
    { name: 'Cylex', url: 'https://www.cylex.us.com', category: 'business', estimatedDR: 55, priority: 'low', isFree: true, napRequired: true, notes: 'Basic business directory. NAP citation.' },
    { name: 'EZLocal', url: 'https://www.ezlocal.com', category: 'business', estimatedDR: 52, priority: 'low', isFree: true, napRequired: true, notes: 'Local business directory. Simple listing.' },
    { name: 'ShowMeLocal', url: 'https://www.showmelocal.com', category: 'business', estimatedDR: 50, priority: 'low', isFree: true, napRequired: true, notes: 'Free local directory listing.' },
    { name: 'Merchant Circle', url: 'https://www.merchantcircle.com', category: 'business', estimatedDR: 62, priority: 'medium', isFree: true, napRequired: true, notes: 'Local merchant directory. Supports blog posts.' },
    { name: 'ChamberofCommerce.com', url: 'https://www.chamberofcommerce.com', category: 'business', estimatedDR: 70, priority: 'medium', isFree: true, napRequired: true, notes: 'Online chamber directory. Not affiliated with local chambers.' },
    { name: 'Alignable', url: 'https://www.alignable.com', category: 'business', estimatedDR: 65, priority: 'medium', isFree: true, napRequired: true, notes: 'B2B networking. Good for local partnerships.' },
    { name: 'Thumbtack', url: 'https://www.thumbtack.com', category: 'business', estimatedDR: 82, priority: 'medium', isFree: false, napRequired: true, notes: 'Lead gen platform. High DR. Consider for specific services.' },
    { name: 'Bark', url: 'https://www.bark.com', category: 'business', estimatedDR: 74, priority: 'medium', isFree: false, napRequired: true, notes: 'Service marketplace. Pay per lead model.' },
    { name: 'Expertise.com', url: 'https://www.expertise.com', category: 'business', estimatedDR: 72, priority: 'medium', isFree: true, napRequired: true, notes: 'Best-of lists by city. Apply for Renton/Seattle medspa category.' },

    // ── LOCAL / REGIONAL ──
    { name: 'Renton Chamber of Commerce', url: 'https://www.gorenton.com', category: 'local', estimatedDR: 45, priority: 'high', isFree: false, napRequired: true, notes: 'Local authority backlink. Membership includes directory listing + networking events.' },
    { name: 'Greater Renton Chamber', url: 'https://www.gorenton.com/member-directory', category: 'local', estimatedDR: 45, priority: 'high', isFree: false, napRequired: true, notes: 'Directory listing via chamber membership.' },
    { name: 'King County Chamber of Commerce', url: 'https://www.kingcountychamber.com', category: 'local', estimatedDR: 40, priority: 'medium', isFree: false, napRequired: true, notes: 'County-level chamber. Regional visibility.' },
    { name: 'Seattle Met', url: 'https://www.seattlemet.com', category: 'local', estimatedDR: 72, priority: 'high', isFree: false, napRequired: false, notes: 'Premium local publication. Pitch for Best Of lists and advertorials.' },
    { name: '425 Magazine', url: 'https://www.425magazine.com', category: 'local', estimatedDR: 42, priority: 'high', isFree: false, napRequired: false, notes: 'Eastside lifestyle magazine. Covers Renton area. Advertorial + editorial opportunities.' },
    { name: 'South Sound Magazine', url: 'https://www.southsoundmag.com', category: 'local', estimatedDR: 38, priority: 'medium', isFree: false, napRequired: false, notes: 'Regional lifestyle publication. Beauty/wellness features.' },
    { name: 'WA Secretary of State Business Directory', url: 'https://www.sos.wa.gov/corps', category: 'local', estimatedDR: 78, priority: 'high', isFree: true, napRequired: true, notes: 'Official state registration. Ensures business legitimacy signal.' },
    { name: 'Renton Reporter', url: 'https://www.rentonreporter.com', category: 'local', estimatedDR: 48, priority: 'high', isFree: false, napRequired: false, notes: 'Local newspaper. Press releases + community features.' },
    { name: 'Seattle Times Marketplace', url: 'https://marketplace.seattletimes.com', category: 'local', estimatedDR: 90, priority: 'high', isFree: false, napRequired: true, notes: 'Very high DR. Paid business listing in Seattle Times network.' },
    { name: 'The Stranger', url: 'https://www.thestranger.com', category: 'local', estimatedDR: 78, priority: 'medium', isFree: false, napRequired: false, notes: 'Alternative Seattle publication. Wellness + beauty content.' },
    { name: 'Puget Sound Business Journal', url: 'https://www.bizjournals.com/seattle', category: 'local', estimatedDR: 85, priority: 'medium', isFree: false, napRequired: false, notes: 'Business publication. Good for founder profile or business feature.' },

    // ── SOCIAL / REVIEW ──
    { name: 'Facebook Business Page', url: 'https://business.facebook.com', category: 'social', estimatedDR: 96, priority: 'high', isFree: true, napRequired: true, notes: 'Keep NAP synced. Post regularly. Enable reviews.' },
    { name: 'Instagram Business', url: 'https://business.instagram.com', category: 'social', estimatedDR: 96, priority: 'high', isFree: true, napRequired: true, notes: 'Link in bio to website. Location tag on all posts.' },
    { name: 'Nextdoor Business', url: 'https://business.nextdoor.com', category: 'social', estimatedDR: 88, priority: 'high', isFree: true, napRequired: true, notes: 'Hyperlocal. Renton + neighboring areas. Recommendations drive walk-ins.' },
    { name: 'LinkedIn Company Page', url: 'https://www.linkedin.com/company', category: 'social', estimatedDR: 98, priority: 'high', isFree: true, napRequired: true, notes: 'Highest DR social platform. Company page + Raj personal profile.' },
    { name: 'Pinterest Business', url: 'https://business.pinterest.com', category: 'social', estimatedDR: 94, priority: 'medium', isFree: true, napRequired: false, notes: 'Pin before/after content. Link pins to service pages. Long content lifespan.' },
    { name: 'TikTok Business', url: 'https://www.tiktok.com/business', category: 'social', estimatedDR: 92, priority: 'medium', isFree: true, napRequired: false, notes: 'Short-form video. Treatment process content performs well.' },
    { name: 'YouTube', url: 'https://www.youtube.com', category: 'social', estimatedDR: 99, priority: 'high', isFree: true, napRequired: false, notes: 'Highest DR. Educational treatment videos. About section links back to site.' },
    { name: 'X (Twitter)', url: 'https://x.com', category: 'social', estimatedDR: 94, priority: 'low', isFree: true, napRequired: false, notes: 'Lower priority for medspa. Industry commentary and news sharing.' },

    // ── INDUSTRY ──
    { name: 'AmSpa (American Med Spa Association)', url: 'https://www.americanmedspa.org', category: 'industry', estimatedDR: 55, priority: 'high', isFree: false, napRequired: true, notes: 'Industry authority. Membership includes directory listing + compliance resources.' },
    { name: 'IAPAM (International Association for Physicians in Aesthetic Medicine)', url: 'https://www.iapam.com', category: 'industry', estimatedDR: 48, priority: 'medium', isFree: false, napRequired: true, notes: 'Physician certification directory. List Dr. Landfield.' },
    { name: 'American Med Spa Association Directory', url: 'https://www.americanmedspa.org/page/find-a-med-spa', category: 'industry', estimatedDR: 55, priority: 'high', isFree: false, napRequired: true, notes: 'Consumer-facing medspa finder. Via AmSpa membership.' },
    { name: 'Aesthetic Society (ASAPS)', url: 'https://www.theaestheticsociety.org', category: 'industry', estimatedDR: 60, priority: 'medium', isFree: false, napRequired: true, notes: 'Surgeon-focused but has medspa member directory.' },
    { name: 'RealPatientRatings', url: 'https://www.realpatientratings.com', category: 'industry', estimatedDR: 50, priority: 'medium', isFree: false, napRequired: true, notes: 'Verified patient review platform for aesthetics.' },
    { name: 'NewBeauty', url: 'https://www.newbeauty.com', category: 'industry', estimatedDR: 68, priority: 'medium', isFree: false, napRequired: true, notes: 'Beauty industry publication with provider directory.' },
    { name: 'Candela Provider Directory', url: 'https://www.candelamedical.com/find-a-provider', category: 'industry', estimatedDR: 55, priority: 'high', isFree: true, napRequired: true, notes: 'Free listing as GentleMax Pro Plus owner. Equipment validation.' },
    { name: 'Sofwave Provider Locator', url: 'https://sofwave.com/find-a-provider', category: 'industry', estimatedDR: 45, priority: 'high', isFree: true, napRequired: true, notes: 'Free listing as Sofwave provider. Technology endorsement backlink.' },

    // ── CITATION / MAP DIRECTORIES ──
    { name: 'Apple Maps (Apple Business Connect)', url: 'https://businessconnect.apple.com', category: 'citation', estimatedDR: 97, priority: 'high', isFree: true, napRequired: true, notes: 'Critical for iPhone users. Claim via Apple Business Connect.' },
    { name: 'Bing Places', url: 'https://www.bingplaces.com', category: 'citation', estimatedDR: 93, priority: 'high', isFree: true, napRequired: true, notes: 'Import from Google Business Profile. Powers Bing + Cortana.' },
    { name: 'Foursquare', url: 'https://foursquare.com', category: 'citation', estimatedDR: 90, priority: 'high', isFree: true, napRequired: true, notes: 'Data aggregator. Feeds 100+ apps and services.' },
    { name: 'MapQuest', url: 'https://www.mapquest.com', category: 'citation', estimatedDR: 82, priority: 'medium', isFree: true, napRequired: true, notes: 'Navigation directory. NAP citation.' },
    { name: 'Superpages', url: 'https://www.superpages.com', category: 'citation', estimatedDR: 75, priority: 'medium', isFree: true, napRequired: true, notes: 'Yellow Pages network. Automated listing possible via data aggregator.' },
    { name: 'YellowPages', url: 'https://www.yellowpages.com', category: 'citation', estimatedDR: 85, priority: 'medium', isFree: true, napRequired: true, notes: 'Legacy directory still carries strong DA. Free basic listing.' },
    { name: 'WhitePages', url: 'https://www.whitepages.com', category: 'citation', estimatedDR: 82, priority: 'low', isFree: true, napRequired: true, notes: 'Business listing section. NAP citation value.' },
    { name: 'Yellowbook', url: 'https://www.yellowbook.com', category: 'citation', estimatedDR: 58, priority: 'low', isFree: true, napRequired: true, notes: 'Basic citation listing.' },
    { name: 'DexKnows', url: 'https://www.dexknows.com', category: 'citation', estimatedDR: 60, priority: 'low', isFree: true, napRequired: true, notes: 'Superpages sister site. Often auto-populates.' },
    { name: 'Factual (Foursquare)', url: 'https://location.foursquare.com', category: 'citation', estimatedDR: 75, priority: 'high', isFree: true, napRequired: true, notes: 'Data aggregator powering Apple Maps, Uber, Snapchat, etc.' },
    { name: 'Data Axle (InfoUSA)', url: 'https://www.data-axle.com', category: 'citation', estimatedDR: 70, priority: 'high', isFree: true, napRequired: true, notes: 'Major data aggregator. Submit directly for widest distribution.' },
    { name: 'Neustar Localeze', url: 'https://www.neustarlocaleze.biz', category: 'citation', estimatedDR: 68, priority: 'high', isFree: true, napRequired: true, notes: 'Data aggregator feeding 100+ directories. Submit directly.' },
    { name: 'HERE WeGo', url: 'https://wego.here.com', category: 'citation', estimatedDR: 80, priority: 'medium', isFree: true, napRequired: true, notes: 'Powers BMW, Mercedes, Amazon in-car nav. Submit via HERE Business.' },
    { name: 'TomTom Places', url: 'https://www.tomtom.com/places', category: 'citation', estimatedDR: 78, priority: 'low', isFree: true, napRequired: true, notes: 'Navigation system directory. NAP citation.' },
    { name: 'Waze', url: 'https://www.waze.com/business', category: 'citation', estimatedDR: 85, priority: 'medium', isFree: false, napRequired: true, notes: 'Google-owned navigation. Paid advertising + free pin.' },

    // ── NICHE BEAUTY ──
    { name: 'StyleSeat', url: 'https://www.styleseat.com', category: 'beauty', estimatedDR: 72, priority: 'medium', isFree: true, napRequired: true, notes: 'Beauty professional marketplace. Good for individual provider profiles.' },
    { name: 'Booksy', url: 'https://booksy.com', category: 'beauty', estimatedDR: 68, priority: 'medium', isFree: false, napRequired: true, notes: 'Beauty booking platform. Growing market share in medspa.' },
    { name: 'Treatwell', url: 'https://www.treatwell.com', category: 'beauty', estimatedDR: 72, priority: 'low', isFree: false, napRequired: true, notes: 'European-focused but expanding to US. Monitor for launch.' },
    { name: 'GlossGenius', url: 'https://www.glossgenius.com', category: 'beauty', estimatedDR: 55, priority: 'low', isFree: false, napRequired: true, notes: 'Beauty business management platform with directory.' },
    { name: 'Fresha', url: 'https://www.fresha.com', category: 'beauty', estimatedDR: 70, priority: 'medium', isFree: true, napRequired: true, notes: 'Free booking platform with marketplace listing.' },
    { name: 'Vagaro', url: 'https://www.vagaro.com', category: 'beauty', estimatedDR: 72, priority: 'medium', isFree: false, napRequired: true, notes: 'Spa/salon booking platform. Marketplace directory.' },
    { name: 'WeddingWire / The Knot', url: 'https://www.theknot.com/marketplace', category: 'beauty', estimatedDR: 88, priority: 'medium', isFree: false, napRequired: true, notes: 'Bridal beauty services listing. High DR. Seasonal relevance.' },
    { name: 'Peerspace', url: 'https://www.peerspace.com', category: 'beauty', estimatedDR: 65, priority: 'low', isFree: false, napRequired: true, notes: 'Venue marketplace. List for beauty event hosting.' },
  ];

  return dirs.map((d) => ({
    ...d,
    status: 'not_submitted' as const,
    submissionCopy: getSubmissionCopy(d.category, d.name),
  }));
}

function getSubmissionCopy(category: DirectoryCategory, directoryName: string): string {
  // Use short for citation/low-value directories, medium for most, long for medical/industry
  const medicalDirs = ['Healthgrades', 'Vitals', 'WebMD Physician Directory', 'ZocDoc', 'RealSelf', 'Doximity', 'U.S. News Health'];
  const longDirs = [...medicalDirs, 'AmSpa (American Med Spa Association)', 'Yelp', 'Better Business Bureau (BBB)', 'Seattle Met'];

  if (longDirs.includes(directoryName)) {
    return BUSINESS_DESCRIPTIONS.long;
  }
  if (category === 'citation' || category === 'beauty') {
    return BUSINESS_DESCRIPTIONS.short;
  }
  return BUSINESS_DESCRIPTIONS.medium;
}

// ── HARO EXPERT QUOTE TEMPLATES ──

function buildHaroOpportunities(): HaroOpportunity[] {
  return [
    {
      queryTopic: 'Botox/Neurotoxin Safety and Trends',
      relevanceScore: 95,
      suggestedAngle: 'Board-certified medical director perspective on neurotoxin safety protocols and emerging trends in preventative Botox',
      draftResponse: `As Medical Director of Rani Beauty Clinic, I oversee every injectable protocol with the same clinical rigor I apply to neurology. The most important safety consideration patients should understand about neurotoxins is that the skill and training of the injector matters far more than the product itself. At our physician-supervised medspa, every Botox treatment follows a standardized protocol: comprehensive medical history review, facial anatomy assessment, and precise dosing calibrated to each patient's unique musculature.

We're seeing a significant trend toward "prejuvenation" — patients in their late 20s and early 30s using micro-doses of neurotoxin to prevent dynamic wrinkles before they become static lines. This proactive approach, when administered by qualified medical professionals, can reduce the total units needed over a lifetime while maintaining natural facial expression and movement.

The key differentiator in safety outcomes is physician supervision. In Washington State, medspas operating under a Board-Certified Medical Director follow strict protocols that reduce adverse events significantly compared to non-supervised settings.`,
      respondAs: CLINIC.medicalDirectorCredentials,
      deadline: '',
      estimatedDR: 60,
    },
    {
      queryTopic: 'Laser Hair Removal Technology Advances',
      relevanceScore: 90,
      suggestedAngle: 'Dual-wavelength laser technology (Candela GentleMax Pro Plus) and how it treats all skin types safely',
      draftResponse: `The most significant advancement in laser hair removal in the past decade is dual-wavelength platform technology. At Rani Beauty Clinic, we invested in the Candela GentleMax Pro Plus specifically because it combines the 755nm Alexandrite laser with the 1064nm Nd:YAG laser in a single device. This allows us to safely and effectively treat all skin types — from very fair Fitzpatrick I to the deepest Fitzpatrick VI skin tones — which was historically a major limitation in laser hair removal.

The Alexandrite wavelength delivers faster treatment for lighter skin types with excellent follicle targeting, while the Nd:YAG penetrates deeper with less melanin absorption, making it the gold standard for darker skin. Having both wavelengths available means we can customize every session to the individual patient's skin tone, hair color, and treatment area.

Patients should look for clinics that invest in FDA-cleared, medical-grade laser platforms rather than IPL devices, which are often marketed as "laser" but deliver inferior results with higher risk of burns, particularly on darker skin.`,
      respondAs: CLINIC.medicalDirectorCredentials,
      deadline: '',
      estimatedDR: 55,
    },
    {
      queryTopic: 'Medical Weight Loss / GLP-1 Medications',
      relevanceScore: 92,
      suggestedAngle: 'Physician-supervised GLP-1 programs at medspas vs online-only telehealth prescribers',
      draftResponse: `The GLP-1 medication revolution — tirzepatide and semaglutide specifically — represents the most impactful development in medical weight management in decades. However, the proliferation of online-only prescribers raises legitimate safety concerns. At Rani Beauty Clinic, our physician-supervised GLP-1 program includes in-person assessments, regular lab monitoring, and dosage titration under direct medical oversight.

What sets a medspa-based weight loss program apart is the integrative approach. Our patients don't just receive a prescription — they receive a comprehensive wellness protocol that may include metabolic support through wellness injections (B12, NAD+, Tri-Immune), body composition tracking, and nutritional guidance. The medication is most effective when it's one component of a physician-designed protocol.

Patients considering GLP-1 therapy should prioritize programs that offer: a licensed prescriber who performs a thorough medical evaluation, regular follow-up appointments, lab monitoring, and a plan for medication maintenance or tapering. The goal is sustainable metabolic health, not just short-term weight reduction.`,
      respondAs: CLINIC.medicalDirectorCredentials,
      deadline: '',
      estimatedDR: 65,
    },
    {
      queryTopic: 'Skin Rejuvenation and Anti-Aging Treatments',
      relevanceScore: 88,
      suggestedAngle: 'The shift from single treatments to multi-modal skin rejuvenation protocols',
      draftResponse: `Modern skin rejuvenation has moved far beyond the single-treatment approach. At Rani Beauty Clinic, we design multi-modal protocols that address skin health at every layer — surface texture, mid-dermal collagen, and deep structural support. A comprehensive anti-aging plan might combine Sofwave ultrasound for deep collagen stimulation with RF microneedling for mid-dermal remodeling and HydraFacials for surface-level exfoliation and hydration.

The most underappreciated factor in anti-aging results is treatment sequencing and timing. For example, we typically recommend beginning with a VI Peel or PRX-T33 biorevitalization to optimize the skin surface, followed by energy-based treatments like Sofwave or RF microneedling four to six weeks later when the skin's healing response is primed for maximum collagen induction.

Patients should be skeptical of any provider claiming a single treatment will "turn back the clock." The most natural, lasting results come from a physician-designed protocol that works with your skin's biology over time, not against it.`,
      respondAs: CLINIC.medicalDirectorCredentials,
      deadline: '',
      estimatedDR: 55,
    },
    {
      queryTopic: 'RF Microneedling vs Other Skin Treatments',
      relevanceScore: 85,
      suggestedAngle: 'How RF microneedling compares to traditional microneedling, laser resurfacing, and other collagen-induction therapies',
      draftResponse: `RF microneedling represents a significant evolution from traditional microneedling because it delivers radiofrequency energy through the needles directly into the dermis. This dual-mechanism approach — controlled micro-injury plus thermal energy — triggers a substantially stronger collagen remodeling response than mechanical needling alone.

Compared to ablative laser resurfacing, RF microneedling offers a compelling advantage: comparable collagen induction with significantly less downtime and a much lower risk profile for darker skin types. The radiofrequency energy is delivered beneath the skin surface, bypassing the epidermis and reducing the risk of post-inflammatory hyperpigmentation that can occur with surface-level laser treatments.

At Rani Beauty Clinic, we position RF microneedling as the workhorse of our skin renewal protocols. It addresses fine lines, acne scarring, pore size, and mild skin laxity in a single treatment. For patients seeking more dramatic tightening, we may layer it with Sofwave ultrasound, which targets the deeper SMAS layer that RF microneedling doesn't reach.`,
      respondAs: CLINIC.medicalDirectorCredentials,
      deadline: '',
      estimatedDR: 50,
    },
    {
      queryTopic: 'Wellness Injections — NAD+, Peptides, Vitamin Therapy',
      relevanceScore: 80,
      suggestedAngle: 'The clinical rationale for IM wellness injections vs oral supplements and the importance of physician oversight',
      draftResponse: `Intramuscular wellness injections offer a significant bioavailability advantage over oral supplementation. When patients take oral NAD+ or glutathione, gut absorption and first-pass liver metabolism can reduce bioavailability to as low as 5-15%. IM injection bypasses the digestive system entirely, delivering the compound directly into muscle tissue for near-complete absorption.

At Rani Beauty Clinic, our wellness injection menu — including NAD+, glutathione, Tri-Immune, B12, and vitamin D3 — is physician-designed and administered under medical supervision. This distinction matters because proper dosing, injection technique, and screening for contraindications are essential for safety and efficacy. NAD+ in particular requires careful attention to injection rate and patient monitoring.

The key question patients should ask any provider offering wellness injections: Is a licensed physician overseeing the protocols? Are the compounds sourced from FDA-registered pharmacies? At Rani, every injection is sourced through vetted compounding pharmacies and administered according to protocols established by our Board-Certified Medical Director.`,
      respondAs: CLINIC.medicalDirectorCredentials,
      deadline: '',
      estimatedDR: 50,
    },
  ];
}

// ── BROKEN LINK TARGETS ──

function buildBrokenLinkTargets(): BrokenLinkTarget[] {
  // Common dead link patterns in the beauty/wellness/medspa space
  return [
    {
      targetSite: 'Beauty blogs and magazines',
      targetUrl: '',
      brokenUrl: 'Links to closed medspas or removed service pages',
      replacementUrl: RANI_CONTENT_PAGES['services'],
      siteDR: 50,
      outreachEmail: buildBrokenLinkEmail('a broken link to a medspa service page', RANI_CONTENT_PAGES['services'], 'our comprehensive services page'),
    },
    {
      targetSite: 'Health/wellness resource pages',
      targetUrl: '',
      brokenUrl: 'Dead links to laser hair removal guides',
      replacementUrl: RANI_CONTENT_PAGES['laser hair removal'],
      siteDR: 55,
      outreachEmail: buildBrokenLinkEmail('a broken link in your laser hair removal resource', RANI_CONTENT_PAGES['laser hair removal'], 'our laser hair removal page featuring the Candela GentleMax Pro Plus'),
    },
    {
      targetSite: 'Weight loss and health blogs',
      targetUrl: '',
      brokenUrl: 'Dead links to GLP-1/semaglutide provider pages',
      replacementUrl: RANI_CONTENT_PAGES['weight loss'],
      siteDR: 60,
      outreachEmail: buildBrokenLinkEmail('a broken link to a GLP-1 provider page', RANI_CONTENT_PAGES['weight loss'], 'our physician-supervised medical weight loss page'),
    },
    {
      targetSite: 'Skincare and anti-aging blogs',
      targetUrl: '',
      brokenUrl: 'Dead links to microneedling or skin tightening clinics',
      replacementUrl: RANI_CONTENT_PAGES['rf microneedling'],
      siteDR: 50,
      outreachEmail: buildBrokenLinkEmail('a broken link to an RF microneedling provider', RANI_CONTENT_PAGES['rf microneedling'], 'our RF microneedling page with before/after results'),
    },
    {
      targetSite: 'Local Seattle/Renton resource pages',
      targetUrl: '',
      brokenUrl: 'Dead links to closed local beauty businesses',
      replacementUrl: RANI_CONTENT_PAGES['homepage'],
      siteDR: 45,
      outreachEmail: buildBrokenLinkEmail('a broken link to a local beauty business that appears to have closed', RANI_CONTENT_PAGES['homepage'], 'Rani Beauty Clinic — an active, physician-supervised luxury medspa in Renton'),
    },
    {
      targetSite: 'Wellness and biohacking blogs',
      targetUrl: '',
      brokenUrl: 'Dead links to NAD+ or peptide therapy providers',
      replacementUrl: RANI_CONTENT_PAGES['wellness injections'],
      siteDR: 55,
      outreachEmail: buildBrokenLinkEmail('a broken link to a wellness injection provider', RANI_CONTENT_PAGES['wellness injections'], 'our physician-supervised wellness injection menu (NAD+, glutathione, peptides)'),
    },
    {
      targetSite: 'HydraFacial and facial treatment review sites',
      targetUrl: '',
      brokenUrl: 'Dead links to HydraFacial provider locator entries',
      replacementUrl: RANI_CONTENT_PAGES['hydrafacial'],
      siteDR: 50,
      outreachEmail: buildBrokenLinkEmail('a broken link to a HydraFacial provider', RANI_CONTENT_PAGES['hydrafacial'], 'our HydraFacial page — we offer signature and platinum-tier treatments'),
    },
    {
      targetSite: 'Hormone therapy and men\'s health blogs',
      targetUrl: '',
      brokenUrl: 'Dead links to TRT or HRT clinic pages',
      replacementUrl: RANI_CONTENT_PAGES['hrt'],
      siteDR: 55,
      outreachEmail: buildBrokenLinkEmail('a broken link to an HRT provider page', RANI_CONTENT_PAGES['hrt'], 'our physician-supervised hormone replacement therapy program for men and women'),
    },
  ];
}

function buildBrokenLinkEmail(brokenContext: string, replacementUrl: string, replacementDesc: string): string {
  return `Subject: Quick fix for a broken link on your site

Hi [Name],

I was reading your article on [Article Topic] and noticed ${brokenContext} that's returning a 404 error.

I thought you might want to know — broken links can impact both user experience and SEO.

If you're looking for a replacement resource, we have ${replacementDesc} that could be a great fit:
${replacementUrl}

We're a physician-supervised luxury medspa in Renton, WA, led by Board-Certified Medical Director ${CLINIC.medicalDirector}. Our content is clinically reviewed and regularly updated.

Either way, wanted to flag the broken link for you. Happy to help if you need any expert quotes or content for your article as well.

Best,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.website}
${CLINIC.phone}`;
}

// ── GUEST POST PROSPECTS ──

function buildGuestPostProspects(): GuestPostProspect[] {
  return [
    // ── LOCAL NEWS ──
    {
      siteName: 'Renton Reporter',
      siteUrl: 'https://www.rentonreporter.com',
      contactPage: 'https://www.rentonreporter.com/contact/',
      estimatedDR: 48,
      topicSuggestions: [
        'New luxury medspa opens in Renton: What physician-supervised aesthetics means for patients',
        'Renton clinic brings advanced GLP-1 weight loss program to South King County',
        '5 things to know before your first medspa visit — advice from a Renton medical director',
      ],
      pitchEmail: buildGuestPostPitch('local_news', 'Renton Reporter'),
      category: 'local_news',
    },
    {
      siteName: 'Seattle Refined (KOMO)',
      siteUrl: 'https://seattlerefined.com',
      contactPage: 'https://seattlerefined.com/contact',
      estimatedDR: 72,
      topicSuggestions: [
        'The rise of luxury medspas in the Pacific Northwest: Where clinical precision meets self-care',
        'Seattle-area expert weighs in on the GLP-1 weight loss revolution',
        'Beyond Botox: The advanced medspa treatments Seattle women are booking now',
      ],
      pitchEmail: buildGuestPostPitch('local_news', 'Seattle Refined'),
      category: 'local_news',
    },
    {
      siteName: '425 Magazine',
      siteUrl: 'https://www.425magazine.com',
      contactPage: 'https://www.425magazine.com/contact/',
      estimatedDR: 42,
      topicSuggestions: [
        'Eastside aesthetics: Why Renton is becoming a destination for luxury skincare',
        'Expert guide to choosing the right medspa on the Eastside',
        'The wellness injection trend: What a Renton physician wants you to know',
      ],
      pitchEmail: buildGuestPostPitch('lifestyle', '425 Magazine'),
      category: 'local_news',
    },
    {
      siteName: 'South Sound Magazine',
      siteUrl: 'https://www.southsoundmag.com',
      contactPage: 'https://www.southsoundmag.com/contact/',
      estimatedDR: 38,
      topicSuggestions: [
        'Your complete guide to physician-supervised weight loss in the South Sound',
        'Advanced skin treatments: What South Sound residents should know about Sofwave and RF microneedling',
      ],
      pitchEmail: buildGuestPostPitch('lifestyle', 'South Sound Magazine'),
      category: 'local_news',
    },

    // ── BEAUTY BLOGS ──
    {
      siteName: 'Byrdie',
      siteUrl: 'https://www.byrdie.com',
      contactPage: 'https://www.byrdie.com/about-us',
      estimatedDR: 85,
      topicSuggestions: [
        'A neurologist explains why Botox is more than cosmetic',
        'RF Microneedling vs. Microneedling: A medical director breaks down the real differences',
        'The medspa treatments dermatologists secretly book for themselves',
      ],
      pitchEmail: buildGuestPostPitch('beauty_blog', 'Byrdie'),
      category: 'beauty_blog',
    },
    {
      siteName: 'Allure',
      siteUrl: 'https://www.allure.com',
      contactPage: 'https://www.allure.com/about/contact',
      estimatedDR: 90,
      topicSuggestions: [
        'The dual-wavelength laser advantage: Why not all hair removal is created equal',
        'Sofwave explained: The non-invasive skin tightening treatment changing the game',
      ],
      pitchEmail: buildGuestPostPitch('beauty_blog', 'Allure'),
      category: 'beauty_blog',
    },
    {
      siteName: 'NewBeauty',
      siteUrl: 'https://www.newbeauty.com',
      contactPage: 'https://www.newbeauty.com/about/',
      estimatedDR: 68,
      topicSuggestions: [
        'Inside a physician-supervised medspa: What makes the luxury difference',
        'The peptide therapy primer: NAD+, sermorelin, and what your provider should tell you',
      ],
      pitchEmail: buildGuestPostPitch('beauty_blog', 'NewBeauty'),
      category: 'beauty_blog',
    },
    {
      siteName: 'Into The Gloss',
      siteUrl: 'https://intothegloss.com',
      contactPage: 'https://intothegloss.com/contact',
      estimatedDR: 75,
      topicSuggestions: [
        'My philosophy on "natural results": A medical director\'s approach to injectables',
        'The skincare treatments that actually build collagen, according to a physician',
      ],
      pitchEmail: buildGuestPostPitch('beauty_blog', 'Into The Gloss'),
      category: 'beauty_blog',
    },

    // ── WELLNESS ──
    {
      siteName: 'Healthline',
      siteUrl: 'https://www.healthline.com',
      contactPage: 'https://www.healthline.com/about/contact-us',
      estimatedDR: 92,
      topicSuggestions: [
        'GLP-1 medications for weight loss: What a medical director wants patients to know',
        'NAD+ injections: The science behind the wellness trend',
        'Hormone replacement therapy: A physician\'s guide to safe treatment',
      ],
      pitchEmail: buildGuestPostPitch('wellness', 'Healthline'),
      category: 'wellness',
    },
    {
      siteName: 'MindBodyGreen',
      siteUrl: 'https://www.mindbodygreen.com',
      contactPage: 'https://www.mindbodygreen.com/contact',
      estimatedDR: 82,
      topicSuggestions: [
        'The wellness injection menu: A physician\'s guide to NAD+, glutathione, and beyond',
        'Why biohackers are turning to medspas for peptide therapy',
      ],
      pitchEmail: buildGuestPostPitch('wellness', 'MindBodyGreen'),
      category: 'wellness',
    },
    {
      siteName: 'Well+Good',
      siteUrl: 'https://www.wellandgood.com',
      contactPage: 'https://www.wellandgood.com/about/',
      estimatedDR: 80,
      topicSuggestions: [
        'A neurologist-turned-medspa-director on why brain health and skin health are connected',
        'The 2026 medspa menu: Treatments worth your time and money, according to a physician',
      ],
      pitchEmail: buildGuestPostPitch('wellness', 'Well+Good'),
      category: 'wellness',
    },

    // ── LIFESTYLE ──
    {
      siteName: 'PureWow',
      siteUrl: 'https://www.purewow.com',
      contactPage: 'https://www.purewow.com/contact',
      estimatedDR: 78,
      topicSuggestions: [
        'The pre-wedding medspa timeline: When to book every treatment for your best bridal skin',
        'I tried Sofwave for skin tightening — here\'s what happened',
      ],
      pitchEmail: buildGuestPostPitch('lifestyle', 'PureWow'),
      category: 'lifestyle',
    },
    {
      siteName: 'The Everygirl',
      siteUrl: 'https://theeverygirl.com',
      contactPage: 'https://theeverygirl.com/contact/',
      estimatedDR: 72,
      topicSuggestions: [
        'Your first medspa visit: What to expect, what to ask, and how to find the right provider',
        'The HydraFacial hype: Is it worth it? A medical director weighs in',
      ],
      pitchEmail: buildGuestPostPitch('lifestyle', 'The Everygirl'),
      category: 'lifestyle',
    },
    {
      siteName: 'Who What Wear',
      siteUrl: 'https://www.whowhatwear.com',
      contactPage: 'https://www.whowhatwear.com/about/contact',
      estimatedDR: 82,
      topicSuggestions: [
        'The treatments fashion insiders actually get at the medspa',
        'Chemical peels decoded: VI Peel vs PRX-T33 vs everything else',
      ],
      pitchEmail: buildGuestPostPitch('lifestyle', 'Who What Wear'),
      category: 'lifestyle',
    },

    // ── MEDICAL ──
    {
      siteName: 'RealSelf',
      siteUrl: 'https://www.realself.com',
      contactPage: 'https://www.realself.com/content-guidelines',
      estimatedDR: 82,
      topicSuggestions: [
        'RF Microneedling: What patients need to know about results, downtime, and safety',
        'Choosing between Sofwave and Ultherapy: A medical director\'s comparison',
        'GLP-1 weight loss at a medspa: The physician-supervised advantage',
      ],
      pitchEmail: buildGuestPostPitch('medical', 'RealSelf'),
      category: 'medical',
    },
    {
      siteName: 'Aesthetic Authority',
      siteUrl: 'https://www.aestheticauthority.com',
      contactPage: 'https://www.aestheticauthority.com/contact',
      estimatedDR: 55,
      topicSuggestions: [
        'Building a physician-supervised medspa: Clinical protocols that drive outcomes',
        'Integrating GLP-1 programs into aesthetic practice: A case study',
      ],
      pitchEmail: buildGuestPostPitch('medical', 'Aesthetic Authority'),
      category: 'medical',
    },
    {
      siteName: 'Dermatology Times',
      siteUrl: 'https://www.dermatologytimes.com',
      contactPage: 'https://www.dermatologytimes.com/contact',
      estimatedDR: 68,
      topicSuggestions: [
        'Dual-wavelength laser platforms in clinical practice: Outcomes with the GentleMax Pro Plus',
        'The role of PRX-T33 biorevitalization in multi-modal treatment protocols',
      ],
      pitchEmail: buildGuestPostPitch('medical', 'Dermatology Times'),
      category: 'medical',
    },
    {
      siteName: 'Modern Aesthetics',
      siteUrl: 'https://modernaesthetics.com',
      contactPage: 'https://modernaesthetics.com/contact',
      estimatedDR: 52,
      topicSuggestions: [
        'From neurology to aesthetics: A medical director\'s cross-disciplinary approach',
        'Wellness injections as an entry point to aesthetic services: Building patient pipelines',
      ],
      pitchEmail: buildGuestPostPitch('medical', 'Modern Aesthetics'),
      category: 'medical',
    },
  ];
}

function buildGuestPostPitch(category: GuestPostProspect['category'], siteName: string): string {
  const angles: Record<GuestPostProspect['category'], string> = {
    local_news: `Subject: Expert Source Available — Luxury Medspa Opens in Renton

Hi [Editor's Name],

I'm ${CLINIC.owner}, founder of ${CLINIC.name}, a new physician-supervised luxury medspa in Renton, WA. I'm reaching out because I believe our story and our Medical Director's expertise would resonate with ${siteName}'s readers.

${CLINIC.medicalDirector}, our Board-Certified Neurologist and Medical Director, brings a unique cross-disciplinary perspective to medical aesthetics. Under his supervision, we've built a clinic that combines clinical precision with a luxury patient experience — featuring the Candela GentleMax Pro Plus laser platform, Sofwave technology, and a comprehensive wellness program including GLP-1 medical weight loss.

I'd love to contribute a guest article or serve as an expert source for any upcoming stories related to:
- The growth of physician-supervised medspas in the Pacific Northwest
- Medical weight loss (GLP-1) trends and patient safety
- Advanced aesthetic technology and what it means for patients
- Wellness injections and integrative health

We can provide high-resolution photos, patient testimonials (with consent), and clinical insights on any of these topics.

Would any of these angles work for an upcoming issue or feature?

Best regards,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.phone} | ${CLINIC.website}`,

    beauty_blog: `Subject: Guest Post Pitch — Expert Aesthetic Insights for ${siteName}

Hi [Editor's Name],

I'm writing on behalf of ${CLINIC.medicalDirector}, Board-Certified Neurologist and Medical Director at ${CLINIC.name} in Renton, WA. Dr. Landfield brings a physician's perspective to aesthetic medicine that we think would provide exceptional value to ${siteName}'s audience.

Unlike many medspa voices in the beauty space, Dr. Landfield approaches aesthetics through the lens of neuroscience and clinical medicine — offering evidence-based insights that go beyond surface-level beauty tips.

We'd love to contribute expert commentary or a guest article on topics such as:
- The science behind popular treatments (Botox, RF microneedling, laser hair removal)
- How to evaluate medspa safety and provider qualifications
- Emerging treatment technology and what actually works
- The intersection of wellness and aesthetics (NAD+, peptides, GLP-1)

Dr. Landfield is available for interviews, written contributions, or expert quotes. We can also provide clinical photography and treatment-specific data.

Looking forward to hearing from you.

Best,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.phone} | ${CLINIC.website}`,

    wellness: `Subject: Physician Expert Available — Wellness & Aesthetics Content for ${siteName}

Hi [Editor's Name],

I'm reaching out from ${CLINIC.name}, a physician-supervised luxury medspa in Renton, WA. Our Medical Director, ${CLINIC.medicalDirector} (Board-Certified Neurologist), is available as an expert source for wellness-focused content.

Dr. Landfield oversees our comprehensive wellness program, which includes:
- NAD+ and glutathione IM injections (not IV — targeted intramuscular delivery)
- GLP-1 medical weight loss (tirzepatide, semaglutide) with physician monitoring
- Peptide therapy (sermorelin, BPC-157, CJC/Ipamorelin)
- Hormone replacement therapy for men and women
- Vitamin injection protocols (B12, D3, Tri-Immune)

We'd love to contribute a guest article or expert quotes on topics such as:
- The clinical rationale for IM wellness injections vs oral supplements
- Physician-supervised vs direct-to-consumer health optimization
- The biohacking treatments that actually have clinical evidence behind them

Happy to provide written content, answer interview questions, or serve as a quoted expert.

Best,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.phone} | ${CLINIC.website}`,

    lifestyle: `Subject: Expert Contributor Pitch — Beauty & Wellness for ${siteName}

Hi [Editor's Name],

I'm ${CLINIC.owner} from ${CLINIC.name}, a luxury medspa in Renton, WA. We'd love to contribute expert content to ${siteName} on the topics your readers care about most — approachable beauty, self-care, and making informed decisions about aesthetic treatments.

Our Medical Director, ${CLINIC.medicalDirector} (Board-Certified Neurologist), has a talent for translating complex medical aesthetics into accessible, actionable advice. We specialize in:
- Injectables (Botox, fillers) with a "natural results" philosophy
- Advanced skin treatments (Sofwave, RF microneedling, HydraFacial)
- Laser hair removal with the Candela GentleMax Pro Plus (safe for all skin types)
- Medical weight loss and wellness optimization

Potential article topics:
- "Your first medspa visit: The complete guide from a medical director"
- "The pre-event skin prep timeline every woman should know"
- "Medspa treatments ranked by downtime: From zero to a week"

We're flexible on format — happy to write a full guest post, provide expert quotes, or collaborate on a Q&A.

Best,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.phone} | ${CLINIC.website}`,

    medical: `Subject: Clinical Contribution — ${CLINIC.medicalDirector} for ${siteName}

Hi [Editor's Name],

I'm reaching out on behalf of ${CLINIC.medicalDirector}, Board-Certified Neurologist and Medical Director at ${CLINIC.name} in Renton, WA.

Dr. Landfield brings a unique perspective to aesthetic medicine, applying neurological expertise to injectable precision and an evidence-based approach to all clinical protocols. Under his direction, our clinic operates with technology including the Candela GentleMax Pro Plus dual-wavelength laser, Sofwave SUPERB ultrasound, and advanced RF microneedling systems.

Dr. Landfield is available to contribute clinical articles, case studies, or expert commentary on:
- Multi-modal treatment protocol design
- Physician supervision standards in the medspa industry
- Integrating medical weight loss (GLP-1) into aesthetic practice
- Dual-wavelength laser technology clinical outcomes
- The neuroscience of neuromodulators (Botox from a neurologist's perspective)
- Wellness injection protocols and compounding pharmacy partnerships

Happy to discuss contribution format, word count, and deadlines.

Best,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.phone} | ${CLINIC.website}`,
  };

  return angles[category];
}

// ── OUTREACH EMAIL TEMPLATES ──

function buildOutreachEmails(): OutreachEmail[] {
  return [
    // 1. HARO Response
    {
      type: 'haro_response',
      subject: 'RE: [HARO Query Subject] — Board-Certified Medical Director, Renton WA',
      body: `Hi [Reporter Name],

I saw your query on [Source] and wanted to offer expert commentary from ${CLINIC.medicalDirector}, Board-Certified Neurologist and Medical Director at ${CLINIC.name} in Renton, WA.

[INSERT RELEVANT EXPERT QUOTE FROM TEMPLATES ABOVE]

**About the Expert:**
${CLINIC.medicalDirector} is a Board-Certified Neurologist serving as Medical Director of ${CLINIC.name}, a physician-supervised luxury medspa in Renton, Washington. His clinical background in neuroscience provides a unique, evidence-based perspective on aesthetic medicine, injectables, and wellness protocols.

**Clinic:** ${CLINIC.name}
**Location:** ${CLINIC.address}
**Website:** ${CLINIC.website}

Dr. Landfield is available for follow-up questions, phone interviews, or additional commentary. High-resolution headshots and clinic photography available upon request.

Best regards,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.phone}`,
      followUpBody: `Hi [Reporter Name],

Just following up on my response to your [Topic] query from [Date]. Wanted to make sure it didn't get buried — I know your inbox is probably overflowing.

${CLINIC.medicalDirector} is still available if you need any additional expert commentary. Happy to hop on a quick call or provide additional written responses.

Best,
${CLINIC.owner}`,
      followUpDelay: 3,
      notes: 'Respond within 24 hours of query posting. HARO responses sent faster get higher placement. Keep initial response under 300 words.',
    },

    // 2. Guest Post Pitch
    {
      type: 'guest_post_pitch',
      subject: 'Guest Post Pitch: [Specific Topic] — Expert Medical Aesthetics Perspective',
      body: `Hi [Editor's Name],

I'm ${CLINIC.owner}, founder of ${CLINIC.name}. I'd love to contribute a guest article to [Publication Name] on [Specific Topic].

**Why this topic matters to your readers:**
[2-3 sentences connecting the topic to the publication's audience]

**Proposed angle:**
[1-2 sentences on the unique perspective Dr. Landfield brings]

**About our expert:**
${CLINIC.medicalDirector} is a Board-Certified Neurologist and Medical Director of a physician-supervised luxury medspa in Renton, WA. His cross-disciplinary background allows him to translate complex medical aesthetics into accessible, evidence-based content.

**What I can deliver:**
- 800-1,500 word article (or your preferred length)
- Original clinical insights and data
- High-resolution images if applicable
- Revisions to match your editorial style

I've attached/linked our previous published content for reference. Happy to discuss topic refinements or alternative angles.

Best regards,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.website} | ${CLINIC.phone}`,
      followUpBody: `Hi [Editor's Name],

Circling back on my guest post pitch from [Date] about [Topic]. I understand editorial calendars fill up quickly — if the timing isn't right, I'd welcome the opportunity to contribute to a future issue.

Alternatively, if you have upcoming topics where a physician expert source would be valuable, Dr. Landfield is available for expert quotes or interviews as well.

Best,
${CLINIC.owner}`,
      followUpDelay: 7,
      notes: 'Research the publication thoroughly before pitching. Reference recent articles. Personalize the angle to their audience. Avoid generic mass pitches.',
    },

    // 3. Broken Link Replacement
    {
      type: 'broken_link',
      subject: 'Found a broken link on your site — quick heads up',
      body: `Hi [Name],

I was reading your article "[Article Title]" on [Website Name] and really enjoyed it — great resource on [Topic].

I did notice that the link to [Broken Link Anchor Text] is returning a 404 error. Just wanted to flag it since it can affect your page's SEO and user experience.

If you're looking for a replacement resource, we have a comprehensive, clinically-reviewed page on the same topic:
[Our Replacement URL]

${CLINIC.name} is a physician-supervised luxury medspa in Renton, WA, led by Board-Certified Medical Director ${CLINIC.medicalDirector}. Our content is regularly updated and medically reviewed.

No pressure at all — just thought I'd flag the broken link regardless. Great article otherwise.

Best,
${CLINIC.owner}
${CLINIC.name} | ${CLINIC.website}`,
      followUpBody: `Hi [Name],

Just a friendly follow-up — I flagged a broken link on your [Article Title] page last week. Totally understand if you've been busy.

The link to [Broken Link Anchor Text] is still showing a 404. Our replacement resource is here if it's helpful: [URL]

Either way, hope you have a great week.

${CLINIC.owner}`,
      followUpDelay: 10,
      notes: 'Always lead with genuine value (flagging the broken link). Never be pushy about the replacement. Use tools like Ahrefs, Check My Links extension, or Screaming Frog to find broken links.',
    },

    // 4. Local Partnership / Cross-Promotion
    {
      type: 'local_partnership',
      subject: 'Partnership idea — [Their Business Name] x Rani Beauty Clinic',
      body: `Hi [Name],

I'm ${CLINIC.owner}, founder of ${CLINIC.name} — a luxury medspa here in Renton on Olympia Ave NE.

I've been following [Their Business Name] and love what you're doing with [specific compliment about their business]. I think there's a natural synergy between our businesses and wanted to explore a partnership.

**What I'm thinking:**
- Cross-referral program (we refer clients to you, you refer to us)
- Co-hosted event or workshop (wellness, self-care, seasonal themes)
- Mutual website features (blog mention, partner page, or resource list)
- Collaborative social media content (joint Instagram Lives, shared stories)

**About Rani Beauty Clinic:**
We're a physician-supervised medspa offering laser treatments, injectables, medical weight loss, HydraFacials, and wellness injections. We serve clients throughout Renton, Bellevue, Kent, and the greater Seattle area.

Our clientele tends to be health-conscious professionals who value quality and expertise — which seems very aligned with your audience.

Would you be open to a quick coffee or call to explore ideas? I'm flexible on timing.

Best,
${CLINIC.owner}
${CLINIC.ownerTitle}, ${CLINIC.name}
${CLINIC.phone} | ${CLINIC.website}`,
      followUpBody: `Hi [Name],

Just wanted to circle back on my partnership note from last week. I know everyone's busy — no pressure at all.

If a formal partnership isn't the right fit right now, I'd still love to connect as a fellow local business owner. Always good to know the people building great things in our community.

Best,
${CLINIC.owner}`,
      followUpDelay: 7,
      notes: 'Target: fitness studios, yoga studios, bridal shops, hair salons, nutritionists, wellness coaches, spas, high-end restaurants, real estate agents, photographers. Always research the business first and reference something specific.',
    },

    // 5. Press Release / New Treatment Announcement
    {
      type: 'press_release',
      subject: '[FOR IMMEDIATE RELEASE] ${CLINIC.name} Introduces [New Treatment/Service] in Renton, WA',
      body: `FOR IMMEDIATE RELEASE

**${CLINIC.name} Introduces [New Treatment/Service], Expanding Physician-Supervised Aesthetic Options in Renton**

*[Treatment] offers [key benefit] under the supervision of Board-Certified Medical Director ${CLINIC.medicalDirector}*

**RENTON, WA — [Date]** — ${CLINIC.name}, a physician-supervised luxury medspa located at ${CLINIC.address}, announces the addition of [New Treatment/Service] to its comprehensive aesthetic and wellness menu.

[New Treatment] represents [describe significance — e.g., "the latest advancement in non-invasive skin tightening technology" or "a physician-supervised approach to medical weight management"]. Under the clinical oversight of Medical Director ${CLINIC.medicalDirector}, a Board-Certified Neurologist, the treatment will be administered following evidence-based protocols designed to maximize patient safety and outcomes.

"[Quote from Dr. Landfield about the treatment, its benefits, and why it matters to patients]," said ${CLINIC.medicalDirector}, Medical Director of ${CLINIC.name}.

**Key highlights of [Treatment]:**
- [Benefit 1]
- [Benefit 2]
- [Benefit 3]

${CLINIC.name} is the [first/only/leading] clinic in [Renton/South King County] to offer [Treatment], which [describe what makes the offering unique — technology, physician oversight, pricing, etc.].

**About ${CLINIC.name}**
${CLINIC.name} is a physician-supervised luxury medical aesthetics clinic in Renton, Washington. Led by Board-Certified Medical Director ${CLINIC.medicalDirector}, the clinic offers advanced laser treatments, injectables, RF microneedling, HydraFacials, medical weight loss, hormone replacement therapy, and wellness injections. The clinic features the Candela GentleMax Pro Plus dual-wavelength laser platform and Sofwave ultrasound technology.

**Contact:**
${CLINIC.owner}, ${CLINIC.ownerTitle}
${CLINIC.name}
${CLINIC.phone}
${CLINIC.email}
${CLINIC.website}

###`,
      followUpBody: `Hi [Editor/Journalist Name],

I sent over a press release last week about our new [Treatment] offering at ${CLINIC.name}. Wanted to follow up in case it might be a fit for an upcoming feature or health/beauty roundup.

${CLINIC.medicalDirector} is available for an interview if you'd like a more in-depth story on [Treatment] or the growing trend of physician-supervised medspas in the Pacific Northwest.

Best,
${CLINIC.owner}
${CLINIC.phone}`,
      followUpDelay: 5,
      notes: 'Distribute via: local papers (Renton Reporter, Seattle Times), local TV stations (KOMO, KING5, KIRO7), industry publications (Aesthetic Authority, Modern Aesthetics), and PR distribution services (PRWeb, Newswire).',
    },
  ];
}

// ── GUEST POST SEARCH QUERIES ──

const GUEST_POST_SEARCH_QUERIES: Record<string, string[]> = {
  local_news: [
    '"renton" "write for us" OR "contribute" OR "guest post"',
    '"seattle" "beauty" OR "medspa" "write for us"',
    '"pacific northwest" "wellness" "contribute"',
    '"king county" "health" OR "beauty" "submit"',
    '"425 magazine" OR "south sound" "contributors"',
  ],
  beauty_blog: [
    '"medspa" OR "med spa" "write for us" OR "guest post"',
    '"skincare" "contribute" OR "guest author" -pinterest',
    '"beauty" "submit a post" OR "write for us" OR "become a contributor"',
    '"anti-aging" OR "skin rejuvenation" "guest post"',
    '"laser hair removal" "write for us" OR "contribute"',
    '"injectable" OR "botox" "write for us" -jobs',
  ],
  wellness: [
    '"wellness" "write for us" OR "contribute" OR "guest post"',
    '"weight loss" "expert" "write for us" OR "contribute"',
    '"biohacking" OR "peptides" "write for us"',
    '"NAD+" OR "hormone therapy" "contribute" OR "guest post"',
    '"vitamin injection" OR "IV therapy" "write for us"',
  ],
  lifestyle: [
    '"lifestyle" "beauty" "write for us" OR "guest post"',
    '"self-care" OR "wellness" "contribute" OR "submit"',
    '"women\'s health" OR "women\'s wellness" "write for us"',
    '"bridal" OR "wedding" "beauty" "guest post"',
  ],
  medical: [
    '"medical aesthetics" "write for us" OR "submit" OR "contribute"',
    '"dermatology" OR "aesthetic medicine" "guest author"',
    '"cosmetic procedure" "write for us" OR "expert contributor"',
    '"physician" "aesthetics" "contribute"',
    'site:realself.com "contribute" OR "write" OR "expert"',
  ],
};

// ── SCORING ──

function calculateBacklinkScore(metrics: BacklinkMetrics, directories: DirectorySubmission[]): number {
  const submittedCount = directories.filter((d) => d.status === 'submitted' || d.status === 'verified').length;
  const verifiedCount = directories.filter((d) => d.status === 'verified').length;
  const totalDirectories = directories.length;

  // DR score (0-30 points)
  const drScore = Math.min(30, (metrics.dr / 100) * 30);

  // Referring domains score (0-25 points)
  const rdScore = Math.min(25, (metrics.referringDomains / 500) * 25);

  // Directory coverage (0-20 points)
  const coverageScore = (submittedCount / totalDirectories) * 15 + (verifiedCount / totalDirectories) * 5;

  // Organic traffic score (0-15 points)
  const trafficScore = Math.min(15, (metrics.organicTraffic / 5000) * 15);

  // Traffic value score (0-10 points)
  const valueScore = Math.min(10, (metrics.trafficValue / 10000) * 10);

  return Math.round(drScore + rdScore + coverageScore + trafficScore + valueScore);
}

// ── WEEKLY ACTIONS GENERATOR ──

function generateWeeklyActionItems(
  directories: DirectorySubmission[],
  haroOpps: HaroOpportunity[],
  brokenLinks: BrokenLinkTarget[],
  guestPosts: GuestPostProspect[],
  metrics: BacklinkMetrics,
): string[] {
  const actions: string[] = [];

  // Priority 1: High-DR directory submissions not yet done
  const unsubmittedHighPriority = directories
    .filter((d) => d.status === 'not_submitted' && d.priority === 'high')
    .sort((a, b) => b.estimatedDR - a.estimatedDR)
    .slice(0, 5);

  if (unsubmittedHighPriority.length > 0) {
    actions.push(
      `[CRITICAL] Submit to ${unsubmittedHighPriority.length} high-priority directories: ${unsubmittedHighPriority.map((d) => d.name).join(', ')}`,
    );
  }

  // Priority 2: Claim and optimize key profiles
  const keyProfiles = directories.filter(
    (d) =>
      d.status === 'not_submitted' &&
      ['Apple Maps (Apple Business Connect)', 'Bing Places', 'Yelp', 'LinkedIn Company Page', 'YouTube'].includes(d.name),
  );
  if (keyProfiles.length > 0) {
    actions.push(
      `[HIGH] Claim essential profiles: ${keyProfiles.map((d) => d.name).join(', ')}`,
    );
  }

  // Priority 3: HARO monitoring
  actions.push(
    `[HIGH] Set up HARO/Connectively alerts for keywords: botox, laser hair removal, GLP-1, medspa, wellness injections, skin tightening`,
  );
  actions.push(
    `[HIGH] Monitor Qwoted, SourceBottle, and ProfNet for journalist queries in beauty/health/wellness categories`,
  );

  // Priority 4: Data aggregator submissions
  const aggregators = directories.filter(
    (d) =>
      d.status === 'not_submitted' &&
      ['Data Axle (InfoUSA)', 'Neustar Localeze', 'Factual (Foursquare)', 'Foursquare'].includes(d.name),
  );
  if (aggregators.length > 0) {
    actions.push(
      `[HIGH] Submit to data aggregators (these feed 100+ directories): ${aggregators.map((d) => d.name).join(', ')}`,
    );
  }

  // Priority 5: Industry directories
  const industryDirs = directories.filter(
    (d) => d.category === 'industry' && d.status === 'not_submitted' && d.isFree,
  );
  if (industryDirs.length > 0) {
    actions.push(
      `[MEDIUM] Submit to free industry directories: ${industryDirs.map((d) => d.name).join(', ')}`,
    );
  }

  // Priority 6: Equipment manufacturer directories
  actions.push(
    `[MEDIUM] Register on Candela Provider Directory and Sofwave Provider Locator — free backlinks from equipment manufacturers`,
  );

  // Priority 7: Local chamber membership
  actions.push(
    `[MEDIUM] Join Renton Chamber of Commerce — directory listing + local networking + community backlinks`,
  );

  // Priority 8: Guest post outreach
  const topGuestTargets = guestPosts
    .sort((a, b) => b.estimatedDR - a.estimatedDR)
    .slice(0, 3);
  actions.push(
    `[MEDIUM] Send guest post pitches to top 3 targets: ${topGuestTargets.map((g) => g.siteName).join(', ')}`,
  );

  // Priority 9: Broken link prospecting
  actions.push(
    `[MEDIUM] Run broken link scans on competitor and resource pages using Ahrefs/Screaming Frog. Target sites with DR 40+ in beauty/wellness/health niches`,
  );

  // Priority 10: Social profile optimization
  actions.push(
    `[LOW] Optimize all social profiles: ensure NAP consistency, add website links, update descriptions with keyword-rich copy`,
  );

  // Priority 11: Content creation for link-worthy assets
  actions.push(
    `[LOW] Create link-worthy content assets: "Ultimate Guide to Medspa Treatments in Renton," "How to Choose a Medspa: A Patient's Guide," treatment comparison infographics`,
  );

  // Priority 12: Monitor and maintain
  actions.push(
    `[LOW] Audit existing backlinks monthly: check for lost links, disavow toxic backlinks, track DR growth`,
  );

  return actions;
}

// ── MAIN GENERATOR ──

export function generateWeeklyBrief(
  currentMetrics?: Partial<BacklinkMetrics>,
): BacklinkBrief {
  const metrics: BacklinkMetrics = {
    dr: currentMetrics?.dr ?? 0,
    referringDomains: currentMetrics?.referringDomains ?? 0,
    organicTraffic: currentMetrics?.organicTraffic ?? 0,
    trafficValue: currentMetrics?.trafficValue ?? 0,
  };

  const directories = buildDirectoryDatabase();
  const haroOpportunities = buildHaroOpportunities();
  const brokenLinkTargets = buildBrokenLinkTargets();
  const guestPostProspects = buildGuestPostProspects();
  const outreachEmails = buildOutreachEmails();

  const backlinkScore = calculateBacklinkScore(metrics, directories);
  const weeklyActions = generateWeeklyActionItems(
    directories,
    haroOpportunities,
    brokenLinkTargets,
    guestPostProspects,
    metrics,
  );

  return {
    generatedAt: new Date().toISOString(),
    backlinkScore,
    currentMetrics: metrics,
    directorySubmissions: directories,
    haroOpportunities,
    brokenLinkTargets,
    guestPostProspects,
    outreachEmails,
    weeklyActions,
  };
}

// ── UTILITY EXPORTS ──

export { BUSINESS_DESCRIPTIONS };
export { HARO_WATCH_KEYWORDS };
export { RANI_CONTENT_PAGES };
export { GUEST_POST_SEARCH_QUERIES };
export { CLINIC as CLINIC_INFO };
