// Backlink Action Kit - Rani Beauty Clinic
// Copy-paste prompts, outreach templates, and automation scripts

// ============================================
// SECTION 1: LISTING CORRECTIONS
// ============================================

export const listingCorrections = {
  yelp: {
    platform: "Yelp",
    url: "https://biz.yelp.com",
    issue: "Says 'Established 1990' - should be 2022",
    fix: "Go to biz.yelp.com → Business Information → Year Established → Change to 2022",
    updatedDescription:
      "Rani Beauty Clinic is a luxury, physician-supervised medical spa in Renton, WA. Under the direction of board-certified neurologist Dr. Alexander Landfield, we offer Botox, dermal fillers, laser hair removal, HydraFacials, Sofwave skin tightening, RF microneedling, GLP-1 weight management, NAD+ IM injections, and red light therapy. Woman-owned. Open 7 days a week.",
  },

  healthgrades: {
    platform: "Healthgrades",
    url: "https://www.healthgrades.com/physician/dr-alexander-landfield-3stcc",
    issue: "Lists Dr. Landfield in Winchester, KY - not linked to Rani Beauty Clinic",
    fix: "Claim profile → Update Practice Location to: 401 Olympia Ave NE, Suite 101, Renton, WA 98056 → Add practice name: Rani Beauty Clinic → Add specialties: Medical Aesthetics, Neurotoxin Injections, Laser Treatments",
  },

  groupon: {
    platform: "Groupon",
    url: "https://www.groupon.com/biz/renton-wa/rani-beauty-clinic",
    issue: "Listed without authorization - conflicts with luxury brand positioning",
    fix: "Email merchantsupport@groupon.com with subject: 'Remove Unauthorized Business Listing' and body below",
    removalEmail: `Subject: Remove Unauthorized Business Listing - Rani Beauty Clinic

To Groupon Merchant Support,

I am the owner of Rani Beauty Clinic located at 401 Olympia Ave NE, Suite 101, Renton, WA 98056.

We have never created an account with Groupon nor authorized our business to be listed on your platform. Please remove our business listing immediately:
https://www.groupon.com/biz/renton-wa/rani-beauty-clinic

We do not offer discounted services and this listing misrepresents our brand. Please confirm removal within 5 business days.

Thank you,
Rina
Owner, Rani Beauty Clinic
(425) 539-4440
info@ranibeautyclinic.com`,
  },

  facebook: {
    platform: "Facebook",
    issue: "Two pages found - duplicate pages hurt SEO",
    fix: "Go to facebook.com/ranibeautyclinic → Settings → Merge Pages → Select the duplicate page (ID: 100088589917658) → Submit merge request",
  },

  squareSite: {
    platform: "Square Site (rani-beauty-clinic.square.site)",
    issue: "Separate booking site competes with main domain for rankings",
    fix: "Add a 301 redirect from Square site to ranibeautyclinic.com, or add a canonical tag pointing to your main domain. In Square Dashboard → Online → Website → SEO → Add canonical URL",
  },
};

// ============================================
// SECTION 2: NEW DIRECTORY SUBMISSIONS
// ============================================

export const newDirectorySubmissions = {
  // Copy-paste this info for every directory
  standardInfo: {
    businessName: "Rani Beauty Clinic",
    address: "401 Olympia Ave NE, Suite 101, Renton, WA 98056",
    phone: "(425) 539-4440",
    website: "https://www.ranibeautyclinic.com",
    email: "info@ranibeautyclinic.com",
    hours: "Monday-Sunday: 10:00 AM - 7:00 PM",
    yearEstablished: "2022",
    ownerName: "Rina",
    medicalDirector: "Dr. Alexander Landfield, Board-Certified Neurologist",
    categories: ["Medical Spa", "Skin Care Clinic", "Wellness Center"],
    shortBio:
      "Physician-supervised luxury medspa in Renton, WA. Botox, fillers, laser hair removal, HydraFacials, Sofwave, RF microneedling, GLP-1 weight management, NAD+ injections. Woman-owned.",
  },

  directories: [
    {
      name: "RealSelf",
      url: "https://www.realself.com/practices/signup",
      priority: 1,
      drValue: 80,
      cost: "Free",
      timeToComplete: "15 min",
      notes: "Create provider profile for Dr. Landfield. Add before/after photos. This is THE aesthetics directory.",
    },
    {
      name: "Zocdoc",
      url: "https://www.zocdoc.com/join",
      priority: 2,
      drValue: 80,
      cost: "Free listing (paid for bookings)",
      timeToComplete: "10 min",
      notes: "Create profile for Dr. Landfield + Rani Beauty Clinic. Add specialties.",
    },
    {
      name: "Bing Places",
      url: "https://www.bingplaces.com",
      priority: 3,
      drValue: 95,
      cost: "Free",
      timeToComplete: "3 min",
      notes: "Import directly from Google Business Profile. One-click setup.",
    },
    {
      name: "Apple Maps",
      url: "https://mapsconnect.apple.com",
      priority: 4,
      drValue: 95,
      cost: "Free",
      timeToComplete: "5 min",
      notes: "Sign in with Apple ID. Claim business. Verify.",
    },
    {
      name: "BBB (Better Business Bureau)",
      url: "https://www.bbb.org/get-listed",
      priority: 5,
      drValue: 90,
      cost: "Free (basic) / $500/yr (accredited)",
      timeToComplete: "10 min",
      notes: "Free listing gets you a DR 90 backlink. Accreditation optional.",
    },
    {
      name: "WebMD",
      url: "https://doctor.webmd.com/doctors-claim",
      priority: 6,
      drValue: 92,
      cost: "Free",
      timeToComplete: "10 min",
      notes: "Claim Dr. Landfield's profile. DR 92 = massive authority boost.",
    },
    {
      name: "Vitals",
      url: "https://www.vitals.com/about/providers",
      priority: 7,
      drValue: 75,
      cost: "Free",
      timeToComplete: "10 min",
      notes: "Physician directory. Create Dr. Landfield profile.",
    },
    {
      name: "Yellow Pages",
      url: "https://adsolutions.yp.com/listings",
      priority: 8,
      drValue: 85,
      cost: "Free",
      timeToComplete: "5 min",
      notes: "Still has high domain authority. Free basic listing.",
    },
    {
      name: "MapQuest",
      url: "https://www.mapquest.com/my-business",
      priority: 9,
      drValue: 80,
      cost: "Free",
      timeToComplete: "5 min",
      notes: "Free listing, decent authority.",
    },
    {
      name: "Foursquare",
      url: "https://business.foursquare.com/claim",
      priority: 10,
      drValue: 90,
      cost: "Free",
      timeToComplete: "5 min",
      notes: "Powers many other apps (Uber, Snapchat, etc). DR 90.",
    },
  ],
};

// ============================================
// SECTION 3: BACKLINK OUTREACH TEMPLATES
// ============================================

export const backlinkOutreach = {
  // Template 1: Guest Post Pitch (for beauty/wellness blogs)
  guestPostPitch: `Subject: Expert Article Contribution - Physician-Supervised Aesthetics

Hi [Editor Name],

I'm Dr. Alexander Landfield, Medical Director of Rani Beauty Clinic in Renton, WA. I'm a board-certified neurologist specializing in medical aesthetics.

I'd love to contribute an expert article to [Publication Name]. A few topic ideas:

1. "Why Your Botox Provider's Medical Background Matters More Than You Think"
2. "The Science Behind GLP-1 Weight Management: What Patients Should Know"
3. "Laser Hair Removal for All Skin Types: What's Changed in 2026"

Each article would be original, medically accurate, and written for your audience. Happy to include relevant research citations.

Would any of these work for your editorial calendar?

Best,
Dr. Alexander Landfield, MD
Board-Certified Neurologist
Medical Director, Rani Beauty Clinic
ranibeautyclinic.com`,

  // Template 2: Resource Page Link Request
  resourcePageOutreach: `Subject: Resource suggestion for your [Topic] page

Hi [Name],

I came across your [specific page title] page and found it really helpful for people researching [topic].

We recently published a free [Botox Cost Calculator / Treatment Finder Quiz] that helps people estimate treatment costs and find the right aesthetic procedure:

- Botox Cost Calculator: https://www.ranibeautyclinic.com/tools/botox-cost-calculator
- Treatment Finder Quiz: https://www.ranibeautyclinic.com/tools/treatment-finder

Both tools are free, no signup required, and medically reviewed by our board-certified physician. I think your readers would find them useful.

Would you consider adding either as a resource on your page?

Thanks,
Rina
Rani Beauty Clinic`,

  // Template 3: Local Business Partnership
  localPartnershipOutreach: `Subject: Partnership opportunity - Rani Beauty Clinic x [Business Name]

Hi [Name],

I'm Rina, owner of Rani Beauty Clinic - a physician-supervised medspa in Renton.

I noticed [Business Name] serves a similar clientele, and I think there's a great opportunity for us to cross-promote:

- We'd feature [Business Name] on our website's partner page with a backlink
- In return, a mention/link on your website or social media would be amazing
- We could also explore joint promotions or referral programs

We serve 2,000+ clients across King County and are always looking to connect with quality local businesses.

Would you be open to a quick chat?

Best,
Rina
Owner, Rani Beauty Clinic
(425) 539-4440`,

  // Template 4: HARO / Connectively Response
  haroTemplate: `[For responding to journalist queries on Connectively/HARO]

Subject: Expert Source: Board-Certified Physician on [Topic]

Hi [Journalist Name],

I'm Dr. Alexander Landfield, a board-certified neurologist and Medical Director of Rani Beauty Clinic, a physician-supervised medspa in Renton, WA.

[Answer their specific question in 2-3 sentences with medical expertise]

Key credentials:
- Board-certified neurologist (University of Kentucky College of Medicine, 2006)
- Specializing in neurotoxin injections (Botox/Dysport) - neuroscience background provides unique precision
- Medical Director overseeing 12+ aesthetic and wellness treatments

Happy to provide additional quotes, data, or a full interview.

Dr. Alexander Landfield, MD
Rani Beauty Clinic | ranibeautyclinic.com
(425) 539-4440`,

  // Template 5: Press Release Distribution
  pressReleaseTemplate: `FOR IMMEDIATE RELEASE

Rani Beauty Clinic Launches Free Botox Cost Calculator for Washington Residents

RENTON, WA - Rani Beauty Clinic, a physician-supervised luxury medspa in Renton, Washington, has launched a free online Botox Cost Calculator to help patients estimate treatment costs before their consultation.

The interactive tool at ranibeautyclinic.com/tools/botox-cost-calculator allows users to select specific treatment areas - from forehead lines to jawline slimming - and instantly see estimated unit ranges and costs.

"Transparency in pricing builds trust," said Dr. Alexander Landfield, Medical Director of Rani Beauty Clinic. "Our calculator gives patients a realistic cost range so they can make informed decisions before their first visit."

The tool is free to use, requires no signup, and is embeddable on other websites.

About Rani Beauty Clinic:
Rani Beauty Clinic is a woman-owned, physician-supervised medical spa offering Botox, dermal fillers, laser hair removal, HydraFacials, and wellness IM injections. Every treatment is overseen by Dr. Alexander Landfield, a board-certified neurologist.

Contact:
Rani Beauty Clinic
401 Olympia Ave NE, Suite 101, Renton, WA 98056
(425) 539-4440
info@ranibeautyclinic.com
https://www.ranibeautyclinic.com`,
};

// ============================================
// SECTION 4: BACKLINK STRATEGY - PATH TO 2,000
// ============================================

export const backlinkStrategy = {
  summary:
    "Realistic path from 105 → 2,000 backlinks over 6-12 months. Focus on free/low-cost methods first.",

  tiers: [
    {
      tier: "Tier 1 - Free Directory Submissions (Target: +50 backlinks)",
      cost: "$0",
      timeline: "Week 1-2",
      effort: "3-4 hours total",
      actions: [
        "Submit to 10 directories listed above (RealSelf, Zocdoc, Bing, Apple, BBB, WebMD, Vitals, YellowPages, MapQuest, Foursquare)",
        "Submit to 15 additional niche directories: Manta, CitySearch, Superpages, Hotfrog, Brownbook, EZLocal, ShowMeLocal, USCity.net, MerchantCircle, Local.com, DexKnows, ChamberOfCommerce.com, Alignable, Nextdoor Business, Angi",
        "Submit to 10 medical/beauty specific: RealPatientRatings, Aesthetic Everything, AmericanMedSpa.org, RateMDs, Wellness.com, Booksy, StyleSeat, Fresha, Vagaro, GlossGenius",
        "Submit to 15 local WA/Seattle directories: SeattleMet, ParentMap, 425Magazine, RentonReporter, KingCounty.gov business directory, WAStateBusiness, PugetSoundBusiness",
      ],
    },
    {
      tier: "Tier 2 - HARO/Connectively Responses (Target: +100 backlinks)",
      cost: "$0",
      timeline: "Ongoing, 15 min/day",
      effort: "15 minutes per day",
      actions: [
        "Sign up at connectively.us (formerly HARO) - FREE",
        "Set alerts for: beauty, skincare, aesthetics, weight loss, wellness, medical spa",
        "Respond to 2-3 journalist queries per week using the HARO template above",
        "Each successful placement = 1 high-DR backlink from news sites (DR 60-90)",
        "Expected hit rate: ~10-15% of responses get published",
        "At 10 responses/week, expect 4-6 backlinks/month from news publications",
      ],
    },
    {
      tier: "Tier 3 - Guest Posting (Target: +50 backlinks)",
      cost: "$0 (your time) or $50-150/post (if outsourced)",
      timeline: "Month 1-6",
      effort: "2-3 hours per post",
      actions: [
        "Pitch 5 beauty/wellness blogs per week using the guest post template above",
        "Target blogs with DR 30+ for maximum link value",
        "Topics: Botox myths, laser hair removal for dark skin, GLP-1 weight management, medspa safety",
        "Include 1-2 natural links back to ranibeautyclinic.com in each article",
        "Expected hit rate: 10-20% of pitches accepted",
        "Platforms to pitch: MindBodyGreen, Byrdie, Allure (reach high), Well+Good, The Zoe Report, NewBeauty, RealSelf blog, Healthline contributor",
      ],
    },
    {
      tier: "Tier 4 - Press Releases (Target: +200 backlinks per release)",
      cost: "$50-200 per release",
      timeline: "Monthly",
      effort: "30 min per release",
      actions: [
        "Distribute press release using the template above",
        "Cheap distribution: EIN Presswire ($49), PR.com (free), OpenPR (free)",
        "Mid-tier: Newswire ($149), PRWeb ($189)",
        "Each release gets syndicated to 100-400 news sites = 100-400 backlinks",
        "Do 1 press release per month - new service launches, tools, milestones",
        "Press release topics: Botox Cost Calculator launch, new treatment additions, community events, hiring announcements",
      ],
    },
    {
      tier: "Tier 5 - Linkable Asset Promotion (Target: +500 backlinks)",
      cost: "$0-500",
      timeline: "Month 1-12",
      effort: "2-3 hours/week",
      actions: [
        "Share Botox Cost Calculator in Facebook groups (Botox support groups, beauty groups, medspa groups)",
        "Share on Reddit: r/PlasticSurgery, r/SkincareAddiction, r/30PlusSkinCare, r/Botox",
        "Share on Quora: Answer questions about Botox cost, link to calculator",
        "Reach out to beauty bloggers: 'Hey, we built a free Botox cost calculator your readers might find useful'",
        "Create an infographic about Botox pricing by region - infographics get shared and linked",
        "Submit calculator to Product Hunt, BetaList, and tool directories",
        "Embed code on the press page means other sites can embed your calculator (each embed = a backlink)",
      ],
    },
    {
      tier: "Tier 6 - Local Community Backlinks (Target: +100 backlinks)",
      cost: "$0-500 (sponsorships/donations)",
      timeline: "Ongoing",
      effort: "1-2 hours/week",
      actions: [
        "Sponsor local Renton events (each sponsor page = backlink from .org or .edu sites)",
        "Partner with local gyms, yoga studios, salons for cross-promotion (backlink exchange)",
        "Join Renton Chamber of Commerce ($200-400/yr) - backlink from their member directory",
        "Donate to local school fundraisers - many schools list sponsors on their websites (.edu backlinks are gold)",
        "Collaborate with local influencers - they link to you from their blog/YouTube",
        "Offer free educational workshops at community centers - they promote you on their site",
      ],
    },
    {
      tier: "Tier 7 - Social Profile Backlinks (Target: +30 backlinks)",
      cost: "$0",
      timeline: "Week 1",
      effort: "2 hours total",
      actions: [
        "Create/claim profiles with website link on: LinkedIn (company page), Pinterest, Twitter/X, TikTok, YouTube, Instagram (already have?), Threads, Alignable, Nextdoor Business",
        "Add ranibeautyclinic.com as website on every profile",
        "These are nofollow links but still count toward total backlink count and brand signals",
      ],
    },
  ],

  projectedTimeline: {
    month1: "105 → 200 backlinks (directories + social profiles + first HARO placements)",
    month3: "200 → 500 backlinks (press releases + guest posts + calculator promotion)",
    month6: "500 → 1,000 backlinks (ongoing HARO + more press releases + community)",
    month12: "1,000 → 2,000 backlinks (compound growth as linkable assets get shared organically)",
  },

  totalEstimatedCost: {
    freeRoute: "$0-500 (your time + optional Chamber of Commerce)",
    budgetRoute: "$1,000-2,000 over 12 months (press releases + small sponsorships)",
    acceleratedRoute: "$3,000-5,000 over 12 months (outsourced guest posts + press releases + sponsored content)",
  },
};
