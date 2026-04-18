/**
 * Mastermind Aftercare Protocols
 *
 * Comprehensive, clinically accurate aftercare for every Rani treatment.
 * Used by the Mastermind plan generator to provide treatment-specific
 * post-care guidance in patient-facing treatment plans.
 *
 * CRITICAL: "injection" only — never "infusion"
 */

export interface AftercareProtocol {
  treatmentId: string;
  treatmentName: string;
  immediateAftercare: string[];  // Within first 24 hours
  weekOneGuidance: string[];     // Days 1-7
  longTermCare: string[];        // Ongoing
  productsRecommended: { product: string; reason: string; raniCarries: boolean }[];
  warningSignals: string[];      // When to call the clinic
  expectedTimeline: string;      // When to expect results
}

export const AFTERCARE_PROTOCOLS: Record<string, AftercareProtocol> = {
  botox: {
    treatmentId: 'botox',
    treatmentName: 'Botox',
    immediateAftercare: [
      'Do not lie down or bend over for 4 hours after treatment',
      'Do not rub, massage, or apply pressure to injection sites',
      'Avoid strenuous exercise for 24 hours',
      'Avoid alcohol for 24 hours',
      'You may gently apply makeup after 4 hours if needed',
    ],
    weekOneGuidance: [
      'Avoid facials, microneedling, or other facial treatments for 2 weeks',
      'Sleep face-up for the first 1-2 nights',
      'Avoid excessive heat (saunas, hot tubs, hot yoga) for 48 hours',
      'Stay upright and avoid prolonged face-down positions',
    ],
    longTermCare: [
      'Results typically last 3-4 months; schedule maintenance appointments accordingly',
      'Consistent treatments over time may extend duration between sessions',
      'Protect skin with daily SPF to preserve overall skin quality',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Daily sun protection to maintain skin quality', raniCarries: true },
      { product: 'Arnica Cream', reason: 'Helps reduce bruising at injection sites', raniCarries: false },
    ],
    warningSignals: [
      'Severe headache that does not resolve with over-the-counter pain relief',
      'Difficulty swallowing, speaking, or breathing',
      'Drooping eyelid that worsens over several days',
      'Signs of infection: increasing redness, warmth, pus, or fever',
      'Significant asymmetry that does not improve after 2 weeks',
    ],
    expectedTimeline: 'Results become visible in 3-5 days, with full effect at 10-14 days',
  },

  'dermal-fillers': {
    treatmentId: 'dermal-fillers',
    treatmentName: 'Dermal Fillers',
    immediateAftercare: [
      'Apply ice 10 minutes on, 10 minutes off for the first few hours to reduce swelling',
      'Avoid touching, pressing, or massaging the treated area',
      'Sleep with your head elevated the first night',
      'Avoid strenuous exercise for 24-48 hours',
      'Mild swelling and bruising are normal and expected',
    ],
    weekOneGuidance: [
      'Avoid dental work or dental procedures for 2 weeks',
      'Avoid facials, microneedling, laser treatments, or chemical peels for 2 weeks',
      'Avoid extreme heat (saunas, steam rooms) and extreme cold for 1 week',
      'Do not wear tight-fitting hats, headbands, or goggles over treated areas',
      'Stay hydrated to support optimal filler integration',
    ],
    longTermCare: [
      'Results typically last 6-18 months depending on the filler type and area',
      'Hyaluronic acid fillers can be dissolved with hyaluronidase if needed',
      'Schedule maintenance appointments before filler fully metabolizes for best results',
      'Protect skin with daily SPF',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Protects skin and prevents post-treatment hyperpigmentation', raniCarries: true },
      { product: 'Arnica Cream', reason: 'Reduces bruising at injection sites', raniCarries: false },
      { product: 'Gentle Hydrating Cleanser', reason: 'Keeps treated area clean without irritation', raniCarries: true },
    ],
    warningSignals: [
      'Severe or worsening pain that does not respond to ice or OTC pain relief',
      'Skin turning white (blanching) or blue/dusky around the injection site',
      'Vision changes or sudden onset of headache after treatment near the eyes/nose',
      'Signs of infection: increasing redness, warmth, pus, or fever',
      'Firm lumps that do not soften after gentle massage (after 2 weeks)',
    ],
    expectedTimeline: 'Initial results are visible immediately; final results settle in 2-4 weeks as swelling resolves',
  },

  sculptra: {
    treatmentId: 'sculptra',
    treatmentName: 'Sculptra',
    immediateAftercare: [
      'Begin the 5-5-5 rule immediately: massage the treated area for 5 minutes, 5 times per day, for 5 days',
      'Apply ice as needed to manage swelling',
      'Avoid strenuous exercise for 24 hours',
      'Mild swelling, redness, and tenderness at injection sites are normal',
    ],
    weekOneGuidance: [
      'Continue the 5-5-5 massage protocol diligently — this is critical for even distribution',
      'Avoid sun exposure and apply SPF 50+ daily',
      'Avoid other facial treatments for 2 weeks',
      'Swelling may fluctuate during the first week — this is expected',
    ],
    longTermCare: [
      'Results develop gradually over 4-6 weeks as collagen is stimulated',
      'A series of 2-3 sessions spaced 4-6 weeks apart is typically needed',
      'Results can last up to 2 years or more',
      'Maintain results with annual touch-up sessions as needed',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Sun protection is essential during collagen remodeling', raniCarries: true },
      { product: 'Gentle Moisturizer', reason: 'Keeps skin hydrated during the healing process', raniCarries: true },
    ],
    warningSignals: [
      'Hard nodules or lumps that do not respond to massage after 2 weeks',
      'Signs of infection: increasing redness, warmth, pus, or fever',
      'Significant asymmetry that does not improve after swelling resolves',
      'Persistent pain beyond the first week',
    ],
    expectedTimeline: 'Gradual improvement over 4-6 weeks as new collagen forms; full results after completing the treatment series',
  },

  'rf-microneedling': {
    treatmentId: 'rf-microneedling',
    treatmentName: 'RF Microneedling',
    immediateAftercare: [
      'Do not apply active ingredients (retinol, AHA/BHA, vitamin C) for 72 hours',
      'Use only a gentle, fragrance-free cleanser for the first 24 hours',
      'Apply SPF 50+ sunscreen starting the morning after treatment',
      'Avoid makeup for 24 hours',
      'Redness and mild swelling are normal and typically last 2-3 days',
    ],
    weekOneGuidance: [
      'Continue using gentle cleanser and moisturizer only for 3-5 days',
      'Apply SPF 50+ daily — reapply every 2 hours if outdoors',
      'Avoid swimming, hot tubs, saunas, and steam rooms for 5 days',
      'Avoid strenuous exercise and heavy sweating for 48 hours',
      'Do not pick at any flaking or dry patches',
    ],
    longTermCare: [
      'A series of 3-4 treatments spaced 4-6 weeks apart is recommended',
      'Gradually reintroduce active skincare products after 72 hours',
      'Results continue to improve over 3-6 months as collagen remodels',
      'Maintain with 1-2 sessions per year',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Critical post-treatment sun protection for 2+ weeks', raniCarries: true },
      { product: 'Gentle Hydrating Cleanser', reason: 'Non-irritating cleansing during recovery', raniCarries: true },
      { product: 'Hyaluronic Acid Serum', reason: 'Deep hydration to support healing skin', raniCarries: true },
      { product: 'GHK-Cu Tighten Serum', reason: 'Copper peptide to enhance collagen production post-treatment', raniCarries: true },
    ],
    warningSignals: [
      'Redness or swelling that worsens after day 3 instead of improving',
      'Signs of infection: increasing pain, pus, warmth, or fever',
      'Blistering or crusting beyond mild flaking',
      'Hyperpigmentation that appears and does not fade',
    ],
    expectedTimeline: 'Initial improvement visible in 1-2 weeks; collagen remodeling continues for 3-6 months after each session',
  },

  hydrafacial: {
    treatmentId: 'hydrafacial',
    treatmentName: 'HydraFacial',
    immediateAftercare: [
      'Avoid direct sun exposure for 24 hours',
      'Skip harsh products (retinoids, exfoliants, acids) for 24 hours',
      'Do not touch your face unnecessarily',
      'Results are immediate — enjoy the glow!',
    ],
    weekOneGuidance: [
      'Resume your normal skincare routine after 24 hours',
      'Apply SPF 30+ daily to protect refreshed skin',
      'Stay hydrated to maximize results',
    ],
    longTermCare: [
      'Monthly HydraFacials maintain and build on results',
      'Pair with a consistent at-home skincare routine for best outcomes',
      'Great maintenance treatment between more intensive procedures',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Protect freshly treated, glowing skin', raniCarries: true },
      { product: 'Hyaluronic Acid Serum', reason: 'Extend hydration benefits', raniCarries: true },
    ],
    warningSignals: [
      'Persistent redness beyond a few hours',
      'Breakouts that worsen significantly (mild purging can be normal)',
      'Signs of allergic reaction: hives, itching, swelling',
    ],
    expectedTimeline: 'Results are immediate — radiant, hydrated, glowing skin from the moment you leave',
  },

  'vi-peel': {
    treatmentId: 'vi-peel',
    treatmentName: 'VI Peel',
    immediateAftercare: [
      'Do NOT wash your face for at least 4 hours after application',
      'Apply the VI Peel post-peel protectant as directed',
      'Avoid touching or picking at your face',
      'No exercise or activities that cause sweating for 72 hours',
    ],
    weekOneGuidance: [
      'Peeling typically begins on day 3-4 and lasts through day 7',
      'Do NOT pick, pull, or peel flaking skin — let it shed naturally',
      'Apply SPF 50+ sunscreen daily — this is mandatory',
      'Moisturize frequently with provided or approved moisturizer',
      'Avoid retinoids and exfoliating acids for 10 days post-peel',
      'Avoid swimming, saunas, and hot tubs for 7 days',
    ],
    longTermCare: [
      'A series of 3-4 peels spaced 4-6 weeks apart delivers optimal results',
      'Maintain results with peels every 3-6 months',
      'Consistent SPF use is critical to prevent hyperpigmentation',
      'Gradually reintroduce retinoids after 10 days',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Mandatory sun protection — newly revealed skin is extremely sensitive', raniCarries: true },
      { product: 'Gentle Moisturizer', reason: 'Keeps peeling skin comfortable and hydrated', raniCarries: true },
      { product: 'Gentle Hydrating Cleanser', reason: 'Non-irritating cleansing during peel process', raniCarries: true },
    ],
    warningSignals: [
      'Blistering or open sores (beyond normal peeling)',
      'Signs of infection: increasing redness, warmth, pus, or fever',
      'Severe pain that does not resolve',
      'Dark spots or hyperpigmentation that worsen',
    ],
    expectedTimeline: 'Peeling days 3-7; fresh, improved skin revealed by days 7-10; full results in 4-6 weeks',
  },

  biorepeel: {
    treatmentId: 'biorepeel',
    treatmentName: 'BioRePeel',
    immediateAftercare: [
      'Avoid direct sun exposure for 48 hours',
      'Do not apply harsh products or active ingredients for 48 hours',
      'A light, gentle moisturizer is fine to apply',
      'Mild tingling is normal and expected — it resolves quickly',
    ],
    weekOneGuidance: [
      'Apply SPF 30+ daily',
      'Resume normal skincare routine after 48 hours',
      'Keep skin hydrated',
      'Avoid exfoliating products for 3-5 days',
    ],
    longTermCare: [
      'Best results with a series of 4-6 treatments spaced 1-2 weeks apart',
      'Maintenance treatments every 1-3 months',
      'Zero downtime makes this ideal for regular skin maintenance',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Protect freshly exfoliated skin from UV damage', raniCarries: true },
      { product: 'Gentle Moisturizer', reason: 'Support skin barrier recovery', raniCarries: true },
    ],
    warningSignals: [
      'Persistent burning or stinging beyond a few hours',
      'Blistering or severe redness',
      'Signs of allergic reaction: hives, itching, excessive swelling',
    ],
    expectedTimeline: 'Immediate brightening and smoother texture; cumulative improvement over the treatment series',
  },

  'cosmelan-peel': {
    treatmentId: 'cosmelan-peel',
    treatmentName: 'Cosmelan Peel',
    immediateAftercare: [
      'Follow the specific Cosmelan mask removal timing as instructed by your provider',
      'Apply Cosmelan 2 cream exactly as directed — this is your at-home maintenance product',
      'Do not apply any other products to the face until instructed',
      'Avoid sun exposure completely — even through windows',
    ],
    weekOneGuidance: [
      'Strict sun avoidance — wear a wide-brim hat and SPF 50+ at all times outdoors',
      'Peeling, redness, and tightness are expected during the first 1-2 weeks',
      'Do not pick or peel flaking skin',
      'Follow the Cosmelan Home Kit protocol exactly as prescribed',
      'Avoid harsh products, retinoids, and exfoliants unless part of the protocol',
    ],
    longTermCare: [
      'Strict sun avoidance for several months — this is critical for results',
      'Continue using Cosmelan 2 maintenance cream as directed (typically months)',
      'Results develop over 2-4 weeks with continued improvement over months',
      'Hyperpigmentation may initially darken before fading — this is normal',
      'SPF 50+ is a lifelong commitment after Cosmelan',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Non-negotiable — any sun exposure can reverse results', raniCarries: true },
      { product: 'Cosmelan 2 Cream', reason: 'Essential maintenance product included in the treatment protocol', raniCarries: true },
      { product: 'Gentle Hydrating Cleanser', reason: 'Non-irritating cleansing during the peeling phase', raniCarries: true },
    ],
    warningSignals: [
      'Severe blistering or open wounds',
      'Signs of infection: increasing redness, warmth, pus, or fever',
      'Significant worsening of pigmentation after 4 weeks',
      'Severe allergic reaction to any protocol products',
    ],
    expectedTimeline: 'Visible pigment lightening begins at 2-4 weeks; optimal results at 3-6 months with continued protocol adherence',
  },

  sofwave: {
    treatmentId: 'sofwave',
    treatmentName: 'Sofwave',
    immediateAftercare: [
      'Mild redness is normal and typically resolves within 1-2 hours',
      'You may resume normal activities immediately after treatment',
      'Apply SPF daily as part of your routine',
      'No special wound care is needed',
    ],
    weekOneGuidance: [
      'Continue your normal skincare routine',
      'Apply SPF 30+ daily',
      'Stay hydrated to support collagen production',
    ],
    longTermCare: [
      'Results develop gradually over 3-6 months as deep collagen remodels',
      'A single session may be sufficient; some patients benefit from a follow-up at 6-12 months',
      'Maintain skin health with SPF, hydration, and a good skincare routine',
      'Results can last 1-2+ years',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Daily protection to support long-term collagen health', raniCarries: true },
      { product: 'GHK-Cu Tighten Serum', reason: 'Copper peptide to enhance collagen remodeling', raniCarries: true },
    ],
    warningSignals: [
      'Redness lasting more than 24 hours',
      'Blistering or burns (very rare)',
      'Significant swelling or tenderness',
      'Numbness that persists beyond a few hours',
    ],
    expectedTimeline: 'Subtle initial tightening; progressive improvement over 3-6 months as collagen rebuilds',
  },

  picoway: {
    treatmentId: 'picoway',
    treatmentName: 'PicoWay',
    immediateAftercare: [
      'Do not pick at or scratch the treated area',
      'Apply SPF 50+ sunscreen — this is mandatory',
      'Avoid direct sun exposure',
      'Mild swelling and redness for 24-48 hours is normal',
      'Pinpoint bleeding or frosting at the treatment site may occur and is expected',
    ],
    weekOneGuidance: [
      'Keep the treated area clean and moisturized',
      'Apply SPF 50+ daily — reapply every 2 hours if outdoors',
      'Avoid swimming, hot tubs, and saunas for 5-7 days',
      'Do not use harsh skincare products on the treated area for 1 week',
      'Slight crusting or darkening of pigmented spots is normal and will shed naturally',
    ],
    longTermCare: [
      'Results develop over weeks as the body clears targeted pigment',
      'Multiple sessions may be needed depending on the condition being treated',
      'Sessions are typically spaced 4-8 weeks apart',
      'Long-term SPF use prevents recurrence of pigmentation',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Mandatory to prevent post-inflammatory hyperpigmentation', raniCarries: true },
      { product: 'Gentle Moisturizer', reason: 'Supports healing and prevents dryness', raniCarries: true },
      { product: 'Gentle Hydrating Cleanser', reason: 'Non-irritating cleansing during recovery', raniCarries: true },
    ],
    warningSignals: [
      'Blistering that does not heal within a few days',
      'Signs of infection: increasing redness, warmth, pus, or fever',
      'Significant hyperpigmentation or hypopigmentation',
      'Pain that worsens instead of improving',
    ],
    expectedTimeline: 'Pigmented lesions darken then flake off over 1-3 weeks; optimal results after completing the full treatment series',
  },

  'laser-hair-removal': {
    treatmentId: 'laser-hair-removal',
    treatmentName: 'Laser Hair Removal',
    immediateAftercare: [
      'Avoid sun exposure for 2 weeks before and after each session',
      'Do not wax, pluck, or use depilatory creams between sessions — shave only',
      'Apply aloe vera gel or soothing moisturizer for comfort',
      'Redness and mild bumps are normal and typically resolve within 24 hours',
      'Avoid hot showers, saunas, and strenuous exercise for 24 hours',
    ],
    weekOneGuidance: [
      'Apply SPF 30+ to any treated areas exposed to sun',
      'Treated hairs will begin shedding naturally over 1-3 weeks — do not pluck',
      'Gently exfoliate the area after a few days to help release shedding hairs',
      'Avoid fragrant lotions or deodorant on treated areas for 24-48 hours',
    ],
    longTermCare: [
      'A series of 6-8 sessions spaced 4-8 weeks apart is standard for optimal results',
      'Annual maintenance sessions (1-2) may be needed for hormonal hair regrowth',
      'Consistency between sessions is key — keep your appointment schedule',
      'Always shave (never wax or pluck) between sessions',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Essential to prevent burns and hyperpigmentation in treated areas', raniCarries: true },
      { product: 'Aloe Vera Gel', reason: 'Soothes skin and reduces post-treatment irritation', raniCarries: false },
    ],
    warningSignals: [
      'Blistering or burns',
      'Redness or swelling lasting more than 3 days',
      'Signs of infection: increasing pain, warmth, pus',
      'Significant skin color changes (lightening or darkening)',
    ],
    expectedTimeline: 'Hair shedding begins 1-3 weeks after each session; noticeable reduction after 3-4 sessions; optimal results after 6-8 sessions',
  },

  'laser-facial-ndyag': {
    treatmentId: 'laser-facial-ndyag',
    treatmentName: 'Laser Facial (ND:YAG)',
    immediateAftercare: [
      'Mild redness is expected and typically lasts 1-2 days',
      'Apply SPF 50+ sunscreen starting the morning after treatment',
      'Use only gentle skincare products for the first 48 hours',
      'Avoid makeup for 12-24 hours if possible',
    ],
    weekOneGuidance: [
      'Apply SPF 50+ daily for at least 2 weeks',
      'Avoid harsh exfoliants, retinoids, and active ingredients for 5-7 days',
      'Keep skin hydrated with a gentle moisturizer',
      'Avoid saunas, steam rooms, and hot tubs for 48 hours',
    ],
    longTermCare: [
      'Monthly maintenance sessions keep skin rejuvenated',
      'Consistent SPF use protects laser-treated skin',
      'Pair with a collagen-boosting skincare routine for best results',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Protects laser-treated skin and prevents hyperpigmentation', raniCarries: true },
      { product: 'Gentle Hydrating Cleanser', reason: 'Non-irritating cleansing during recovery', raniCarries: true },
      { product: 'Hyaluronic Acid Serum', reason: 'Boosts hydration for healing skin', raniCarries: true },
    ],
    warningSignals: [
      'Redness or swelling lasting more than 3-4 days',
      'Blistering or crusting',
      'Hyperpigmentation that appears and worsens',
      'Signs of infection: pain, warmth, pus, fever',
    ],
    expectedTimeline: 'Immediate glow after redness resolves (1-2 days); progressive improvement with a series of treatments',
  },

  'prx-t33': {
    treatmentId: 'prx-t33',
    treatmentName: 'PRX-T33',
    immediateAftercare: [
      'Do not get water on your face for 6-8 hours after treatment',
      'Apply SPF 50+ sunscreen — this is mandatory',
      'Moisturize the treated area as directed',
      'Avoid active ingredients (retinol, AHA/BHA, vitamin C) for 48 hours',
    ],
    weekOneGuidance: [
      'Continue daily SPF 50+ application',
      'Keep skin well moisturized',
      'Avoid harsh skincare products for the first week',
      'Mild tightness and slight frosting are normal and resolve quickly',
    ],
    longTermCare: [
      'A series of 4-6 treatments spaced 1-2 weeks apart is recommended',
      'No downtime — ideal for regular skin revitalization',
      'Results are cumulative and progressive',
      'Maintenance sessions every 1-3 months',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Protects newly stimulated skin', raniCarries: true },
      { product: 'Gentle Moisturizer', reason: 'Supports the biorevitalization process', raniCarries: true },
    ],
    warningSignals: [
      'Persistent burning or stinging beyond a few hours',
      'Blistering or severe peeling (mild tightness is normal)',
      'Signs of allergic reaction: hives, itching, excessive swelling',
    ],
    expectedTimeline: 'Immediate hydration boost; progressive firming and radiance over the treatment series',
  },

  'microneedling-arrissence-undereye': {
    treatmentId: 'microneedling-arrissence-undereye',
    treatmentName: 'Microneedling with Arrissence — Dark Undereyes',
    immediateAftercare: [
      'No makeup for 24 hours after treatment',
      'Avoid rubbing or touching the eye area for 48 hours',
      'Apply the recommended Arrissence eye serum as directed by your provider',
      'Use a cold compress gently if needed for comfort — do not press',
      'Mild bruising or swelling around the eye area is normal and expected',
    ],
    weekOneGuidance: [
      'Continue applying the Arrissence serum as prescribed',
      'Apply SPF 50+ daily — reapply if outdoors',
      'Avoid active ingredients (retinoids, AHA/BHA, vitamin C) near the eye area for 5 days',
      'Do not wear contact lenses for 24 hours',
      'Swelling and bruising may peak at day 2-3 and resolves within a week',
    ],
    longTermCare: [
      'A series of 3 sessions spaced 4-6 weeks apart is recommended for optimal results',
      'Continue with an eye-specific serum to maintain and enhance results',
      'Results become increasingly visible from 4-6 weeks post-treatment',
      'Protect the undereye area with SPF and avoid excess sun exposure long-term',
    ],
    productsRecommended: [
      { product: 'Arrissence Eye Serum', reason: 'Growth factor serum to enhance regeneration and dark circle correction', raniCarries: true },
      { product: 'SPF 50 Sunscreen', reason: 'Protects treated skin and prevents hyperpigmentation', raniCarries: true },
      { product: 'Gentle Eye Cream', reason: 'Supports healing and hydration in the delicate undereye area', raniCarries: true },
    ],
    warningSignals: [
      'Severe swelling or bruising that worsens after day 3',
      'Vision changes — contact your provider immediately',
      'Signs of infection: increasing pain, warmth, pus, or fever',
      'Blistering or open skin in the treatment area',
    ],
    expectedTimeline: 'Initial improvement in dark circles and texture visible at 2-4 weeks; optimal results after completing the 3-session series',
  },

  ariessence: {
    treatmentId: 'ariessence',
    treatmentName: 'Ariessence',
    immediateAftercare: [
      'Follow your provider\'s specific protocol instructions for the treatment performed',
      'Use only gentle skincare products for the first 48 hours',
      'Avoid touching or manipulating the treated area',
      'Mild redness and sensitivity are normal',
    ],
    weekOneGuidance: [
      'Apply SPF 30+ daily',
      'Keep skin hydrated with a gentle moisturizer',
      'Avoid harsh exfoliants and active ingredients for 5-7 days',
      'Do not undergo other facial treatments for 1-2 weeks',
    ],
    longTermCare: [
      'Follow the recommended treatment series for optimal results',
      'Maintain with periodic sessions as advised by your provider',
      'Support results with a consistent home skincare routine',
    ],
    productsRecommended: [
      { product: 'SPF 50 Sunscreen', reason: 'Daily sun protection for treated skin', raniCarries: true },
      { product: 'Gentle Moisturizer', reason: 'Supports healing and hydration', raniCarries: true },
    ],
    warningSignals: [
      'Severe redness, swelling, or pain beyond 48 hours',
      'Signs of infection: warmth, pus, or fever',
      'Unexpected skin reactions or blistering',
    ],
    expectedTimeline: 'Results vary by protocol; typically visible improvement within 1-4 weeks',
  },

  'glp-1': {
    treatmentId: 'glp-1',
    treatmentName: 'GLP-1 (Semaglutide/Tirzepatide)',
    immediateAftercare: [
      'Eat slowly and stop when you feel full — do not force meals',
      'Eat small, frequent meals rather than large ones',
      'Stay hydrated — aim for 64oz+ of water daily',
      'Mild nausea is common, especially during dose increases',
      'Report severe nausea, vomiting, or inability to keep fluids down to the clinic immediately',
    ],
    weekOneGuidance: [
      'Prioritize lean protein at every meal (minimum 60g daily)',
      'Avoid high-fat, greasy, and fried foods — they worsen GI side effects',
      'Avoid carbonated beverages and alcohol',
      'Take your weekly injection on the same day each week',
      'Rotate injection sites (abdomen, thigh, upper arm) to prevent irritation',
    ],
    longTermCare: [
      'Follow-up labs at 3 months to monitor metabolic markers',
      'Dose adjustments are made gradually based on tolerance and progress',
      'Consistent protein intake and light exercise accelerate results',
      'Track your weight, meals, and any side effects for review at appointments',
      'Do not stop medication abruptly without provider guidance',
    ],
    productsRecommended: [
      { product: 'Protein Supplement', reason: 'Helps meet daily protein goals to prevent muscle loss', raniCarries: false },
      { product: 'Electrolyte Mix', reason: 'Supports hydration, especially if experiencing nausea', raniCarries: false },
    ],
    warningSignals: [
      'Severe, persistent nausea or vomiting that prevents eating or drinking',
      'Severe abdominal pain (could indicate pancreatitis)',
      'Signs of gallbladder issues: upper right abdominal pain, especially after meals',
      'Rapid heart rate or dizziness',
      'Allergic reaction: rash, difficulty breathing, swelling',
      'Injection site reaction that worsens (spreading redness, pus)',
    ],
    expectedTimeline: 'Weight loss typically begins within the first 2-4 weeks; significant results at 3-6 months with consistent use',
  },

  'wellness-injections': {
    treatmentId: 'wellness-injections',
    treatmentName: 'Wellness Injections',
    immediateAftercare: [
      'Minor bruising at the injection site is possible and resolves quickly',
      'Stay hydrated — drink plenty of water for the rest of the day',
      'Light activity is fine immediately after',
      'A small bandage can be removed after 1 hour',
    ],
    weekOneGuidance: [
      'Continue your normal routine — no restrictions',
      'Effects may take 24-48 hours for full benefit',
      'You may notice increased energy, improved mood, or better sleep depending on the injection',
    ],
    longTermCare: [
      'Regular sessions (weekly or biweekly) deliver cumulative benefits',
      'Discuss your wellness goals with your provider to customize your injection protocol',
      'Pair with healthy nutrition and hydration for best results',
    ],
    productsRecommended: [
      { product: 'Quality Multivitamin', reason: 'Supports overall nutritional balance between injection sessions', raniCarries: false },
    ],
    warningSignals: [
      'Severe pain, swelling, or redness at the injection site',
      'Signs of allergic reaction: rash, itching, difficulty breathing, swelling',
      'Persistent nausea or dizziness',
      'Fever or chills',
    ],
    expectedTimeline: 'Some effects felt within 24-48 hours; full benefits build with consistent sessions over 4-8 weeks',
  },

  'folix-hair': {
    treatmentId: 'folix-hair',
    treatmentName: 'Folix Hair Restoration',
    immediateAftercare: [
      'Follow the Folix protocol instructions provided by your provider',
      'Avoid hair treatments (coloring, perming, chemical straightening) for the specified period',
      'Do not wash hair for 24 hours after treatment unless otherwise instructed',
      'Be gentle with the treated scalp area',
    ],
    weekOneGuidance: [
      'Use a gentle, sulfate-free shampoo',
      'Avoid heavy styling products on the treated area',
      'Do not scratch or pick at the scalp',
      'Mild redness or tenderness at the treatment site is normal',
    ],
    longTermCare: [
      'A series of treatments is typically required for optimal results',
      'Hair growth is gradual — patience is key',
      'Follow up at recommended intervals to assess progress',
      'Support hair health with proper nutrition, hydration, and stress management',
    ],
    productsRecommended: [
      { product: 'Sulfate-Free Shampoo', reason: 'Gentle cleansing that supports scalp health', raniCarries: false },
      { product: 'Biotin Supplement', reason: 'Supports hair growth from within', raniCarries: false },
    ],
    warningSignals: [
      'Significant scalp irritation or persistent redness beyond a few days',
      'Signs of infection: increasing pain, swelling, pus, or fever',
      'Unusual hair shedding that concerns you',
    ],
    expectedTimeline: 'Initial signs of improvement at 2-3 months; significant results at 6-12 months with full protocol adherence',
  },

  keravive: {
    treatmentId: 'keravive',
    treatmentName: 'Keravive Scalp Treatment',
    immediateAftercare: [
      'Do not wash your hair for 24 hours after treatment',
      'Avoid heavy styling products for 24 hours',
      'The scalp may feel slightly tingly — this is normal and temporary',
    ],
    weekOneGuidance: [
      'Use a gentle shampoo when you resume washing',
      'Avoid harsh chemical treatments (coloring, bleaching) for 1 week',
      'Apply the Keravive take-home spray as directed',
      'Avoid excessive heat styling for a few days',
    ],
    longTermCare: [
      'Monthly treatments are recommended for optimal scalp health',
      'Consistent at-home care between sessions extends results',
      'Maintain overall scalp hygiene with regular gentle cleansing',
    ],
    productsRecommended: [
      { product: 'Keravive Take-Home Spray', reason: 'Extends in-office treatment results between sessions', raniCarries: true },
      { product: 'Gentle Shampoo', reason: 'Supports scalp health without stripping natural oils', raniCarries: false },
    ],
    warningSignals: [
      'Severe scalp irritation or burning',
      'Persistent redness or swelling beyond 24 hours',
      'Signs of allergic reaction: hives, itching, swelling',
    ],
    expectedTimeline: 'Immediate improvement in scalp feel; visible hair health improvement over 3-6 monthly sessions',
  },
};

/**
 * Look up aftercare protocol by treatment ID or a fuzzy treatment name match.
 * Returns null if no protocol is found.
 */
export function getAftercareProtocol(treatmentIdOrName: string): AftercareProtocol | null {
  // Direct ID match
  const directMatch = AFTERCARE_PROTOCOLS[treatmentIdOrName];
  if (directMatch) return directMatch;

  // Fuzzy match by treatment name (case-insensitive, partial)
  const normalized = treatmentIdOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  for (const protocol of Object.values(AFTERCARE_PROTOCOLS)) {
    const protoNormalized = protocol.treatmentName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (protoNormalized.includes(normalized) || normalized.includes(protoNormalized)) {
      return protocol;
    }
  }

  // Try matching common aliases
  const ALIASES: Record<string, string> = {
    'filler': 'dermal-fillers',
    'fillers': 'dermal-fillers',
    'juvederm': 'dermal-fillers',
    'restylane': 'dermal-fillers',
    'radiesse': 'dermal-fillers',
    'dysport': 'botox',
    'xeomin': 'botox',
    'tox': 'botox',
    'neurotoxin': 'botox',
    'semaglutide': 'glp-1',
    'tirzepatide': 'glp-1',
    'mounjaro': 'glp-1',
    'ozempic': 'glp-1',
    'wegovy': 'glp-1',
    'zepbound': 'glp-1',
    'morpheus8': 'rf-microneedling',
    'morpheus': 'rf-microneedling',
    'microneedling': 'rf-microneedling',
    'vitamin': 'wellness-injections',
    'b12': 'wellness-injections',
    'nad': 'wellness-injections',
    'glutathione': 'wellness-injections',
    'tri-immune': 'wellness-injections',
    'ndyag': 'laser-facial-ndyag',
    'nd:yag': 'laser-facial-ndyag',
    'laser facial': 'laser-facial-ndyag',
    'pico': 'picoway',
    'biorepeel': 'biorepeel',
    'bio re peel': 'biorepeel',
    'cosmelan': 'cosmelan-peel',
    'arrissence undereye': 'microneedling-arrissence-undereye',
    'arrissence': 'microneedling-arrissence-undereye',
    'undereye microneedling': 'microneedling-arrissence-undereye',
    'hair removal': 'laser-hair-removal',
    'lhr': 'laser-hair-removal',
    'prx': 'prx-t33',
    'keravive scalp': 'keravive',
    'scalp treatment': 'keravive',
    'folix': 'folix-hair',
    'hair restoration': 'folix-hair',
  };

  const aliasKey = Object.keys(ALIASES).find(
    (alias) => normalized.includes(alias.replace(/[^a-z0-9]/g, ''))
  );
  if (aliasKey) {
    return AFTERCARE_PROTOCOLS[ALIASES[aliasKey]] || null;
  }

  return null;
}

/**
 * Get all aftercare protocols as an array.
 */
export function getAllAftercareProtocols(): AftercareProtocol[] {
  return Object.values(AFTERCARE_PROTOCOLS);
}
