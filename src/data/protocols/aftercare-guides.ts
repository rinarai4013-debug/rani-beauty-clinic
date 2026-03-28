// ─── Patient Aftercare Guides ────────────────────────────────────────────────
// Comprehensive aftercare instructions by treatment for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface AftercareGuide {
  id: string;
  treatmentName: string;
  category: string;
  immediateCare: string[];
  first24Hours: string[];
  first7Days: string[];
  whatToExpect: string[];
  whenToCallClinic: string[];
  whenToCallER: string[];
  productsToAvoid: string[];
  productsRecommended: string[];
  activityRestrictions: string[];
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLP-1 INJECTION AFTERCARE (BY DOSE LEVEL)
// ═══════════════════════════════════════════════════════════════════════════════

export const GLP1_AFTERCARE_BY_DOSE: Record<string, AftercareGuide> = {
  dose1: {
    id: 'aftercare-glp1-d1',
    treatmentName: 'GLP-1 Injection Aftercare (D1: Starting Dose)',
    category: 'glp1',
    immediateCare: [
      'Apply gentle pressure to the injection site for 10 seconds',
      'Do not rub or massage the injection site',
      'A small amount of bruising or redness is normal',
    ],
    first24Hours: [
      'Eat small, light meals (avoid large, heavy, or high-fat meals)',
      'Drink at least 64 oz of water throughout the day',
      'Nausea is common and typically mild at this dose; ginger tea or ginger chews can help',
      'Avoid alcohol for 24 hours (increases nausea and dehydration risk)',
      'Take your anti-nausea medication if prescribed',
    ],
    first7Days: [
      'Continue eating small, frequent meals (5-6 per day instead of 3 large meals)',
      'Prioritize protein at every meal (minimum 60g daily)',
      'Stay hydrated consistently (64-80 oz water daily)',
      'Gentle exercise is encouraged (walking 20-30 minutes daily)',
      'Keep a food diary to track what you eat and how you feel',
      'Note any side effects for discussion at your next appointment',
    ],
    whatToExpect: [
      'Mild nausea in the first 3-5 days (affects 20-30% of patients at this dose)',
      'Reduced appetite (this is the medication working as intended)',
      'Possible mild constipation or loose stools as your body adjusts',
      'Slight fatigue as your caloric intake naturally decreases',
      'Most side effects improve significantly within the first 2 weeks',
    ],
    whenToCallClinic: [
      'Nausea that does not improve with ginger or anti-nausea medication',
      'No bowel movement for 3 or more days',
      'Persistent headache not relieved by hydration and acetaminophen',
      'Injection site redness that increases in size or becomes warm',
      'Questions about diet, exercise, or your treatment plan',
    ],
    whenToCallER: [
      'Severe abdominal pain (especially upper abdomen radiating to back)',
      'Persistent vomiting (more than 24 hours, unable to keep fluids down)',
      'Signs of dehydration (dizziness, fainting, very dark urine, rapid heartbeat)',
      'Signs of allergic reaction (hives, swelling of face/throat, difficulty breathing)',
      'Blood glucose below 54 mg/dL with symptoms',
    ],
    productsToAvoid: [
      'Alcohol (increases nausea and impairs weight loss)',
      'High-fat, greasy, or fried foods (worsen GI symptoms)',
      'Carbonated beverages (increase bloating)',
      'Excessive caffeine (can increase nausea)',
      'Processed sugars and simple carbohydrates',
    ],
    productsRecommended: [
      'Ginger tea, ginger chews, or ginger supplements',
      'Electrolyte drink mix (sugar-free)',
      'High-quality protein powder',
      'Fiber supplement (psyllium husk)',
      'Daily multivitamin with B12 and vitamin D',
      'Probiotic supplement',
    ],
    activityRestrictions: [
      'No restrictions on normal daily activities',
      'Start with gentle exercise (walking, yoga, light cycling)',
      'Avoid intense exercise on an empty stomach (hypoglycemia risk)',
      'Listen to your body and reduce intensity if nauseous',
    ],
  },
  dose2: {
    id: 'aftercare-glp1-d2',
    treatmentName: 'GLP-1 Injection Aftercare (D2: Escalation Dose)',
    category: 'glp1',
    immediateCare: [
      'Apply gentle pressure to the injection site for 10 seconds',
      'Injection at the same time each week helps maintain consistent levels',
      'A small bruise or redness at the site is expected',
    ],
    first24Hours: [
      'GI side effects may temporarily increase with the dose escalation',
      'Eat very small, bland meals for the first 24 hours after escalation',
      'Hydrate aggressively (aim for 80 oz water)',
      'Take anti-nausea medication proactively if you experienced nausea at D1',
      'Rest if you feel fatigued; your body is adjusting',
    ],
    first7Days: [
      'Appetite suppression will likely be more noticeable at this dose',
      'Despite reduced appetite, do not skip meals (risk of muscle loss and nutrient deficiency)',
      'Focus on protein-first eating at every meal or snack',
      'Continue daily fiber supplement for digestive regularity',
      'Weight loss typically accelerates at this dose level',
      'Begin or continue a regular exercise routine (30 min, 5x per week)',
    ],
    whatToExpect: [
      'Nausea may return or increase for 3-7 days after escalation (30-40% of patients)',
      'Significantly reduced appetite and earlier fullness during meals',
      'Possible constipation (proactively manage with fiber and hydration)',
      'Measurable weight loss becomes more consistent',
      'Potential for food aversions (especially fatty or greasy foods)',
      'Improved energy as your body adapts',
    ],
    whenToCallClinic: [
      'Nausea persisting beyond 7 days after dose increase',
      'Unable to eat minimum 1,200 calories (women) or 1,500 calories (men) daily',
      'Constipation not improving with fiber and hydration',
      'Hair thinning or excessive hair shedding',
      'Mood changes or increased anxiety',
    ],
    whenToCallER: [
      'Severe abdominal pain (especially upper abdomen radiating to back)',
      'Persistent vomiting (more than 24 hours)',
      'Signs of severe dehydration',
      'Allergic reaction symptoms',
      'Blood glucose below 54 mg/dL with symptoms',
    ],
    productsToAvoid: [
      'Alcohol', 'High-fat foods', 'Carbonated beverages', 'Large meals', 'Excessive caffeine',
    ],
    productsRecommended: [
      'Ginger supplements', 'Electrolyte drink mix', 'Protein powder (whey or plant-based)',
      'Fiber supplement', 'Multivitamin', 'Probiotic', 'Collagen peptide supplement',
    ],
    activityRestrictions: [
      'Resume normal exercise 24-48 hours after dose escalation if feeling well',
      'Prioritize resistance training to preserve muscle mass during weight loss',
      'Avoid hot yoga or intense exercise if experiencing nausea',
    ],
  },
  dose3: {
    id: 'aftercare-glp1-d3',
    treatmentName: 'GLP-1 Injection Aftercare (D3: Therapeutic Dose)',
    category: 'glp1',
    immediateCare: [
      'Apply gentle pressure to the injection site for 10 seconds',
      'Rotate injection sites according to your rotation guide',
      'Document your injection site for tracking',
    ],
    first24Hours: [
      'You are now at a therapeutic dose; side effects may briefly increase',
      'Eat small, protein-focused meals and snacks throughout the day',
      'Stay on top of hydration (dehydration risk increases at higher doses)',
      'Take anti-nausea medication if needed',
      'Avoid lying flat after eating (wait 30 minutes)',
    ],
    first7Days: [
      'Appetite may be significantly suppressed; eating can feel like a chore',
      'Set meal reminders on your phone if needed to ensure adequate intake',
      'Protein target: 60-80g daily (critical for muscle preservation)',
      'Continue fiber supplement and probiotic daily',
      'Track body measurements (not just scale weight)',
      'This is a key dose level; many patients reach their stride here',
    ],
    whatToExpect: [
      'Strong appetite suppression and early satiety',
      'Consistent, predictable weight loss trajectory',
      'Improved metabolic markers (blood sugar, cholesterol)',
      'Possible temporary plateau followed by continued loss',
      'Clothing fitting noticeably different',
      'Improved energy and motivation as weight decreases',
    ],
    whenToCallClinic: [
      'Rapid weight loss (more than 5% in a single month)',
      'Persistent fatigue despite adequate nutrition',
      'New or worsening hair thinning',
      'Difficulty meeting minimum caloric intake',
      'Any new symptoms not previously experienced',
    ],
    whenToCallER: [
      'Severe abdominal pain', 'Persistent vomiting', 'Severe dehydration', 'Allergic reaction', 'Chest pain or severe headache',
    ],
    productsToAvoid: ['Alcohol', 'High-fat foods', 'Carbonated beverages', 'Processed foods'],
    productsRecommended: [
      'Protein-rich snacks (Greek yogurt, protein bars, cheese sticks)',
      'Electrolyte supplements', 'Fiber supplement', 'Multivitamin with B12 and D',
      'Iron supplement if labs indicate', 'Bone broth for protein and hydration',
    ],
    activityRestrictions: [
      'Resistance training 2-3x per week is strongly recommended at this dose',
      'Ensure adequate protein before and after workouts',
      'Avoid exercising in a fasted state',
      'Listen to your body; reduce intensity if feeling lightheaded',
    ],
  },
  dose4: {
    id: 'aftercare-glp1-d4',
    treatmentName: 'GLP-1 Injection Aftercare (D4: Maximum Dose)',
    category: 'glp1',
    immediateCare: [
      'Apply gentle pressure to the injection site for 10 seconds',
      'Maximum dose; monitor closely for any new side effects',
      'Document injection site and note any reactions',
    ],
    first24Hours: [
      'This is the highest dose level; be proactive with anti-nausea strategies',
      'Eat only small amounts at each sitting; do not force food',
      'Hydrate consistently throughout the day (80-100 oz)',
      'Take antiemetic medication proactively if prescribed',
    ],
    first7Days: [
      'Appetite suppression is strongest at this level',
      'Eating adequate nutrition becomes the primary challenge',
      'Protein-rich smoothies and shakes may be easier to tolerate than solid meals',
      'Nutrient deficiency risk is highest at maximum dose; supplements are not optional',
      'Continue all previously recommended supplements',
      'Maintain exercise routine to preserve lean muscle mass',
    ],
    whatToExpect: [
      'Maximum appetite suppression',
      'Continued weight loss (may slow as you approach target weight)',
      'Possible need for nutritional counseling to ensure adequacy',
      'Lab changes may require supplement adjustments',
      'Discussions about maintenance dose timeline at this level',
    ],
    whenToCallClinic: [
      'Unable to eat a minimum of 1,000 calories daily for more than 2 days',
      'Losing more than 1.5% of body weight per week consistently',
      'Persistent nausea not controlled by medication',
      'Any new symptoms at this dose level',
      'Feeling faint, dizzy, or very weak',
    ],
    whenToCallER: [
      'Severe abdominal pain', 'Persistent vomiting (> 12 hours)', 'Severe dehydration',
      'Allergic reaction', 'Fainting', 'Chest pain',
    ],
    productsToAvoid: ['Alcohol', 'High-fat foods', 'Carbonated drinks', 'Processed sugars'],
    productsRecommended: [
      'Protein shakes and smoothies', 'Bone broth', 'Electrolyte supplements',
      'High-quality multivitamin', 'B12 supplement', 'Vitamin D supplement',
      'Iron supplement (if indicated by labs)', 'Collagen peptides',
    ],
    activityRestrictions: [
      'Maintain consistent exercise but reduce intensity if energy is low',
      'Focus on resistance training for muscle preservation',
      'Do not exercise while fasting or severely calorie-restricted',
      'Prioritize recovery (sleep, stretching, adequate protein)',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PEPTIDE INJECTION AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const PEPTIDE_AFTERCARE: AftercareGuide = {
  id: 'aftercare-peptide-general',
  treatmentName: 'Peptide Injection Aftercare (General)',
  category: 'peptide',
  immediateCare: [
    'Apply gentle pressure to the injection site for 10 seconds',
    'Do not rub, massage, or apply heat to the injection site',
    'Mild redness or a small bump at the site is normal and resolves within hours',
  ],
  first24Hours: [
    'Stay well hydrated (minimum 64 oz water)',
    'Avoid alcohol for 24 hours (can affect peptide metabolism)',
    'Light activity is fine; avoid intense exercise at the specific injection site area',
    'For sermorelin (bedtime injection): go to sleep within 30-60 minutes of injection',
    'For BPC-157: light movement of the affected area promotes healing',
    'Store remaining peptide supply in the refrigerator immediately after use',
  ],
  first7Days: [
    'Maintain consistent injection timing for best results',
    'Follow your specific cycling schedule (5 on/2 off for GH peptides)',
    'Track your symptoms and any changes you notice in a journal',
    'Eat a nutrient-rich diet with adequate protein to support peptide function',
    'Report any persistent injection site reactions to the clinic',
  ],
  whatToExpect: [
    'Results vary by peptide type and individual physiology',
    'NAD+: Energy improvement within 24-48 hours',
    'Sermorelin: Sleep quality improvement within 1-2 weeks; body composition changes over 3-6 months',
    'BPC-157: Pain and inflammation reduction within 3-7 days; healing over 4-8 weeks',
    'Glutathione: Skin brightening visible after 4-6 weeks of consistent treatment',
    'GHK-Cu: Skin texture improvement in 2-4 weeks; collagen rebuilding over 3-6 months',
    'PT-141: Effects begin within 45 minutes and last up to 24 hours',
  ],
  whenToCallClinic: [
    'Injection site redness that grows larger or becomes warm to the touch',
    'Persistent pain at the injection site beyond 48 hours',
    'Any unusual or unexpected symptoms',
    'Questions about dosing, timing, or technique',
    'No improvement after the expected timeline for your peptide',
  ],
  whenToCallER: [
    'Signs of allergic reaction (hives, swelling, difficulty breathing)',
    'Signs of infection (spreading redness, pus, fever)',
    'Severe headache, chest pain, or difficulty breathing',
    'Uncontrolled bleeding at injection site',
  ],
  productsToAvoid: [
    'Alcohol within 24 hours of injection',
    'NSAIDs (ibuprofen) immediately before/after BPC-157 (may reduce healing benefit)',
    'High-sugar foods before sermorelin injection (blunts GH release)',
  ],
  productsRecommended: [
    'High-quality protein sources', 'Adequate hydration', 'Zinc and magnesium supplements',
    'Vitamin C for collagen support (with GHK-Cu)',
    'Anti-inflammatory foods (with BPC-157)',
  ],
  activityRestrictions: [
    'Light exercise is encouraged for most peptides',
    'For BPC-157 (injury recovery): follow physical therapy guidance',
    'For sermorelin: exercise earlier in the day (evening injection is for sleep)',
    'For PT-141: no specific activity restrictions',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// HORMONE THERAPY AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const HORMONE_THERAPY_AFTERCARE: AftercareGuide = {
  id: 'aftercare-hormone',
  treatmentName: 'Hormone Therapy Aftercare',
  category: 'hormone',
  immediateCare: [
    'For injections: apply pressure for 10 seconds, avoid rubbing',
    'For topical testosterone cream: apply to clean, dry skin and wash hands thoroughly',
    'For oral thyroid medication: take on an empty stomach with water only',
    'Document your injection or application time for consistency',
  ],
  first24Hours: [
    'Testosterone injection: mild soreness at injection site is normal',
    'Testosterone cream: avoid skin-to-skin contact at the application site with children or partners for 2 hours',
    'Thyroid medication: wait 60 minutes before food, coffee, or other supplements',
    'DHEA: take in the morning with breakfast',
  ],
  first7Days: [
    'Maintain consistent timing for medications and injections',
    'Some patients experience mood fluctuations during early hormone adjustment',
    'Track energy levels, mood, libido, and sleep quality in a journal',
    'Continue all other medications as prescribed',
    'Stay hydrated and maintain balanced nutrition',
  ],
  whatToExpect: [
    'Testosterone (women): Libido and energy improvements often within 3-6 weeks',
    'Testosterone (men): Energy and mood improvement in 3-6 weeks; body composition over 3-6 months',
    'Thyroid: Some symptom improvement in 2-4 weeks; full effect of dose change takes 6-8 weeks',
    'DHEA: Gradual improvements in energy and mood over 4-8 weeks',
    'Temporary hair shedding with thyroid medication is normal (weeks 4-8)',
    'Hormone optimization is a process that takes 3-6 months to dial in',
  ],
  whenToCallClinic: [
    'Acne that is new or worsening (testosterone-related)',
    'Increased facial or body hair growth in women',
    'Mood changes (irritability, anxiety, depression)',
    'Breast tenderness or swelling (in men on testosterone)',
    'Menstrual cycle changes',
    'Persistent headache or vision changes',
    'Questions about lab timing or dose adjustments',
  ],
  whenToCallER: [
    'Chest pain or difficulty breathing',
    'Severe headache with vision changes',
    'Swelling in legs (possible blood clot)',
    'Severe depression or suicidal thoughts',
    'Signs of allergic reaction',
    'Palpitations that are severe or do not resolve',
  ],
  productsToAvoid: [
    'Biotin supplements 72 hours before any lab draws (causes false results)',
    'Calcium and iron supplements within 4 hours of thyroid medication',
    'Antacids within 4 hours of thyroid medication',
    'Coffee or espresso within 60 minutes of thyroid medication',
    'Soy products in large quantities (may affect thyroid absorption)',
  ],
  productsRecommended: [
    'Vitamin D3 with K2 (especially with thyroid and testosterone optimization)',
    'Zinc and magnesium (support testosterone and thyroid function)',
    'DIM (diindolylmethane) if estrogen management is needed',
    'Selenium 200 mcg (thyroid enzyme support)',
    'Quality sleep supplements if needed (magnesium glycinate, melatonin low-dose)',
  ],
  activityRestrictions: [
    'Exercise is strongly encouraged (resistance training supports hormone optimization)',
    'For testosterone injection sites: avoid direct pressure on injection site for 24 hours',
    'Adequate sleep (7-9 hours) is critical for hormone production and balance',
    'Stress management practices (cortisol opposes testosterone and thyroid function)',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// WELLNESS INJECTION AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const WELLNESS_INJECTION_AFTERCARE: AftercareGuide = {
  id: 'aftercare-wellness-injection',
  treatmentName: 'Wellness Injection Aftercare (B12, Biotin, Vitamin D, Tri-Immune, Lipo-Mino)',
  category: 'wellness-injection',
  immediateCare: [
    'Apply gentle pressure to the injection site for 10 seconds',
    'A small bandage is applied; you may remove it after 1 hour',
    'Mild soreness at the injection site is completely normal',
  ],
  first24Hours: [
    'Drink plenty of water (injection supports detoxification and hydration helps)',
    'B12: you may notice an energy boost within hours',
    'Lipo-Mino: try to exercise within 24 hours for best metabolic benefit',
    'Tri-Immune: rest if you are receiving this during illness recovery',
    'Vitamin D: no special restrictions',
    'Avoid strenuous exercise of the injected arm for 24 hours if sore',
  ],
  first7Days: [
    'Continue your regular supplement routine',
    'Note any positive changes (energy, mood, skin, sleep) for discussion at your next visit',
    'Injection site soreness should resolve within 1-2 days',
    'If receiving a series: keep your next appointment on schedule for best results',
  ],
  whatToExpect: [
    'B12: Improved energy, mental clarity within 24-48 hours',
    'Biotin: Nail improvement in 4-6 weeks, hair improvement in 2-3 months',
    'Vitamin D: Energy and mood improvement over 4-8 weeks',
    'Tri-Immune: Immune support begins immediately',
    'Lipo-Mino: Metabolic support; best results with exercise and nutrition',
    'NAD+ IV: Enhanced clarity and energy within hours; potential fatigue day-of (recovery response)',
  ],
  whenToCallClinic: [
    'Injection site redness lasting more than 48 hours',
    'Persistent pain at the injection site',
    'Any unusual symptoms after injection',
    'Questions about your injection schedule or adding services',
  ],
  whenToCallER: [
    'Signs of allergic reaction (hives, swelling, difficulty breathing)',
    'Signs of infection at injection site (increasing redness, warmth, pus, fever)',
    'Severe headache or chest pain',
  ],
  productsToAvoid: [
    'Biotin: stop 72 hours before any blood work',
    'Alcohol within 24 hours (reduces effectiveness and hydration)',
  ],
  productsRecommended: [
    'Electrolyte drink after injection', 'Continued oral supplement support between injections',
    'Nutrient-rich diet with colorful fruits and vegetables',
  ],
  activityRestrictions: [
    'No significant restrictions for wellness injections',
    'For NAD+ IV: rest for the remainder of the day; resume normal activity next day',
    'For Lipo-Mino: exercise encouraged same day or next day',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// BOTOX AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const BOTOX_AFTERCARE: AftercareGuide = {
  id: 'aftercare-botox',
  treatmentName: 'Botox (Neurotoxin) Aftercare',
  category: 'injectable',
  immediateCare: [
    'Stay upright for 4 hours after treatment (do not lie down)',
    'Gently exercise the treated muscles (frown, raise eyebrows, squint) for 30 minutes',
    'Do not touch, rub, or massage the treated areas',
    'Apply ice gently if there is any swelling (10 minutes on, 10 minutes off)',
  ],
  first24Hours: [
    'Avoid strenuous exercise, heavy lifting, or bending over for 24 hours',
    'Avoid alcohol for 24 hours (increases bruising risk)',
    'Do not lie face-down or wear tight headbands or hats that press on treated areas',
    'Avoid facials, chemical peels, or any facial treatments for 24 hours',
    'Sleep on your back if possible (avoid sleeping face-down)',
    'Some patients experience a mild headache; acetaminophen is preferred over ibuprofen (less bruising risk)',
    'Avoid hot tubs, saunas, and prolonged sun exposure for 24 hours',
  ],
  first7Days: [
    'Results begin to appear in 3-5 days; full effect at 10-14 days',
    'Do not have any other facial treatments (laser, microneedling, peels) for at least 2 weeks',
    'Avoid blood-thinning supplements (fish oil, vitamin E, ginkgo) for 48 hours if you had pre-treatment bruising',
    'Return for your 2-week follow-up to assess results and determine if a touch-up is needed',
  ],
  whatToExpect: [
    'Small bumps at injection sites that resolve within 30-60 minutes',
    'Possible mild bruising (resolves in 5-7 days; arnica cream can help)',
    'Gradual relaxation of treated muscles over 3-14 days',
    'Full results visible at 2 weeks',
    'Results last 3-4 months (may last longer with consistent treatment)',
    'Slight asymmetry is normal and can be corrected at 2-week follow-up',
  ],
  whenToCallClinic: [
    'Significant asymmetry after 2 weeks',
    'Eyelid drooping (ptosis) that does not resolve',
    'Excessive bruising or swelling',
    'No visible effect after 2 weeks',
    'Questions about your results or next treatment timeline',
  ],
  whenToCallER: [
    'Difficulty breathing or swallowing (extremely rare)',
    'Severe allergic reaction',
    'Vision changes',
    'Slurred speech or muscle weakness beyond the treated area',
  ],
  productsToAvoid: [
    'Retinol/retinoids for 24-48 hours', 'AHA/BHA acids for 24-48 hours',
    'Blood-thinning supplements', 'Alcohol for 24 hours',
    'Avoid rubbing or massaging treated areas',
  ],
  productsRecommended: [
    'Arnica cream or gel for bruise prevention', 'SPF 30+ daily',
    'Gentle, hydrating skincare only for 24 hours',
  ],
  activityRestrictions: [
    'No exercise for 24 hours', 'No lying face-down for 4 hours',
    'No hot tubs, saunas, or steam rooms for 24 hours',
    'No facial massage for 2 weeks',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// DERMAL FILLER AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const FILLER_AFTERCARE: AftercareGuide = {
  id: 'aftercare-filler',
  treatmentName: 'Dermal Filler Aftercare',
  category: 'injectable',
  immediateCare: [
    'Apply ice gently to treated areas (10 minutes on, 10 minutes off) for the first few hours',
    'Do not press, squeeze, or massage the treated areas unless instructed by your provider',
    'Swelling and mild tenderness are normal and expected',
    'Avoid touching the treated area with unwashed hands',
  ],
  first24Hours: [
    'Expect swelling (most noticeable in lips and under-eye area; peaks at 24-48 hours)',
    'Sleep with head elevated on 2 pillows to reduce swelling',
    'Avoid strenuous exercise for 24-48 hours',
    'Avoid alcohol for 24 hours',
    'Avoid hot environments (sauna, steam room, hot yoga) for 24 hours',
    'Apply ice as needed for comfort (do not apply directly to skin)',
    'Eat soft foods if lips were treated',
    'Avoid kissing or puckering if lips were treated for 24 hours',
    'Acetaminophen for discomfort (avoid NSAIDs for 48 hours to reduce bruising)',
  ],
  first7Days: [
    'Swelling will gradually reduce over 5-7 days (lips may take up to 2 weeks)',
    'Bruising may appear and will resolve over 7-14 days',
    'Avoid dental work for 2 weeks after lip or cheek filler',
    'Avoid facial treatments (laser, microneedling, peels, waxing) for 2 weeks',
    'Do not have additional filler for at least 2 weeks',
    'Lumps or bumps may be felt; most resolve as swelling subsides',
    'Return for your 2-week follow-up assessment',
    'Avoid excessive facial expressions for the first few days',
  ],
  whatToExpect: [
    'Immediate volume and shape improvement, but final result is visible at 2-4 weeks',
    'Swelling makes the area look larger than the final result (especially lips)',
    'Possible bruising at injection points (5-10 days to resolve)',
    'Mild tenderness when touching treated areas for 1-2 weeks',
    'Lips may feel stiff or lumpy for 1-2 weeks as filler integrates',
    'Hyaluronic acid fillers last 6-18 months depending on area and product',
    'Touch-up may be recommended at your 2-week follow-up',
  ],
  whenToCallClinic: [
    'Lumps or bumps that persist beyond 2 weeks',
    'Asymmetry that concerns you after swelling resolves (2 weeks)',
    'Persistent numbness or tingling',
    'Moderate bruising that is not improving after 10 days',
    'Questions about your results or timeline for next treatment',
  ],
  whenToCallER: [
    'Sudden vision changes or eye pain (sign of vascular occlusion; requires EMERGENCY treatment)',
    'Skin turning white, blue, or mottled in the treated area (vascular compromise)',
    'Severe or worsening pain that is disproportionate to the treatment',
    'Signs of infection (increasing redness, warmth, pus, fever)',
    'Difficulty breathing (if treated near nose/lips)',
  ],
  productsToAvoid: [
    'NSAIDs (ibuprofen, aspirin) for 48 hours', 'Retinol for 48 hours',
    'AHA/BHA acids for 48 hours', 'Alcohol for 24 hours',
    'Blood-thinning supplements', 'Makeup on injection sites for 12 hours',
  ],
  productsRecommended: [
    'Arnica cream or pills for bruise prevention',
    'Gentle, fragrance-free moisturizer',
    'SPF 30+ daily', 'Aquaphor for lips (if lip filler)',
  ],
  activityRestrictions: [
    'No exercise for 24-48 hours', 'No facial massage for 2 weeks',
    'No dental work for 2 weeks (lip/cheek filler)',
    'No hot environments for 48 hours', 'Sleep elevated for 2-3 nights',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// LASER TREATMENT AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const LASER_AFTERCARE: AftercareGuide = {
  id: 'aftercare-laser',
  treatmentName: 'Laser Treatment Aftercare (General)',
  category: 'laser',
  immediateCare: [
    'Mild redness, warmth, and swelling are normal (similar to a mild sunburn)',
    'Apply provided soothing gel or aloe to the treated area',
    'Cold compresses or cooling gel masks can provide relief',
    'Do not scratch or pick at the treated skin',
  ],
  first24Hours: [
    'Redness and warmth may persist for 12-24 hours (longer for ablative treatments)',
    'Apply fragrance-free, gentle moisturizer as needed',
    'Avoid sun exposure and apply SPF 50+ if going outdoors',
    'Do not apply makeup to the treated area for 24 hours (mineral makeup OK after 12 hours for non-ablative)',
    'Avoid hot showers, hot tubs, and saunas for 24 hours',
    'Sleep on your back with head elevated if facial treatment',
    'For laser hair removal: avoid hot baths and tight clothing on treated area',
  ],
  first7Days: [
    'Continue applying moisturizer and SPF religiously',
    'For pigment treatments: treated spots may darken and crust (this is normal; they will flake off naturally)',
    'Do not pick, peel, or exfoliate treated skin',
    'Avoid retinol, AHA/BHA acids, and vitamin C serums for 5-7 days',
    'For hair removal: exfoliate gently after 5 days to prevent ingrown hairs',
    'Avoid direct sun exposure for 2-4 weeks',
    'Treated skin may feel dry; increase hydration (water and topical)',
    'Avoid swimming (pool chlorine and ocean salt) for 5-7 days',
  ],
  whatToExpect: [
    'Redness for 1-3 days (non-ablative) or 5-10 days (ablative)',
    'Mild swelling, especially around the eyes, for 1-3 days',
    'Pigmented lesions will darken before lightening (3-14 days)',
    'Skin may feel rough or textured as it heals (1-2 weeks)',
    'For hair removal: treated hair will shed over 10-21 days (not immediate)',
    'Multiple sessions are typically needed for optimal results',
    'Full collagen remodeling takes 3-6 months after the treatment series',
  ],
  whenToCallClinic: [
    'Blistering or burns', 'Pigmentation changes that concern you',
    'Redness that worsens after 48 hours instead of improving',
    'Signs of herpes/cold sore outbreak (if history; antiviral should be started)',
    'Any unexpected reactions',
  ],
  whenToCallER: [
    'Signs of infection (increasing redness, pus, fever, red streaking)',
    'Allergic reaction', 'Severe burn with blistering and pain',
    'Eye injury or vision changes (for facial treatments)',
  ],
  productsToAvoid: [
    'Retinol/retinoids for 7+ days', 'AHA/BHA exfoliants for 7+ days',
    'Vitamin C serums for 5-7 days', 'Fragrance-containing products for 7 days',
    'Self-tanner for 2 weeks', 'Waxing or depilatory creams for 2+ weeks',
    'Hot water on treated area for 48 hours',
  ],
  productsRecommended: [
    'SPF 50+ broad-spectrum sunscreen (mineral preferred: zinc oxide, titanium dioxide)',
    'Hyaluronic acid serum (gentle hydration)',
    'CeraVe or Vanicream moisturizer (fragrance-free)',
    'Aloe vera gel (pure, fragrance-free)',
    'Growth factor serums (after first 48 hours for regenerative treatments)',
  ],
  activityRestrictions: [
    'No exercise causing heavy sweating for 24-48 hours',
    'No swimming for 5-7 days',
    'No direct sun exposure for 2-4 weeks (wear hat and SPF)',
    'No saunas, steam rooms, or hot yoga for 1 week',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHEMICAL PEEL AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const CHEMICAL_PEEL_AFTERCARE: AftercareGuide = {
  id: 'aftercare-peel',
  treatmentName: 'Chemical Peel Aftercare',
  category: 'skin-treatment',
  immediateCare: [
    'Skin will feel tight, warm, and may appear red (normal and expected)',
    'Do not wash your face for the time specified by your provider (typically 4-8 hours)',
    'Avoid touching your face with unwashed hands',
    'Some tingling or mild stinging is normal for the first 1-2 hours',
  ],
  first24Hours: [
    'When instructed, wash gently with the provided cleanser',
    'Apply provided post-peel moisturizer or balm',
    'Do not apply any active ingredients (retinol, acids, vitamin C)',
    'Avoid sun exposure; apply SPF 50+ if going outdoors',
    'Avoid makeup for 24 hours (mineral makeup OK after that)',
    'Sleep on your back to avoid friction on treated skin',
  ],
  first7Days: [
    'Peeling typically begins day 2-3 and may last 5-7 days',
    'Do NOT pick, pull, or peel flaking skin (risk of scarring and hyperpigmentation)',
    'Let dead skin shed naturally',
    'Keep skin moisturized at all times (moisturize multiple times daily)',
    'Avoid all exfoliants, retinoids, and active serums until peeling is complete',
    'Avoid sweating (exercise, hot environments) for 48-72 hours',
    'Stay out of direct sun; wear a wide-brimmed hat outdoors',
  ],
  whatToExpect: [
    'Light peels: slight flaking for 2-3 days',
    'Medium peels (VI Peel, TCA): noticeable peeling days 2-5, some redness for up to a week',
    'Skin may appear darker before it peels (normal part of the process)',
    'Peeling may be patchy and uneven (does not affect final results)',
    'Fresh skin underneath will be pink and sensitive',
    'Final results visible 2-4 weeks post-peel',
    'Series of peels provides cumulative improvement',
  ],
  whenToCallClinic: [
    'Excessive redness or irritation beyond expected',
    'Blistering or open sores',
    'Severe itching that does not respond to moisturizer',
    'Hyperpigmentation concerns after peeling completes',
    'Signs of herpes outbreak (take prescribed antiviral immediately)',
  ],
  whenToCallER: [
    'Signs of infection (fever, increasing redness, pus)',
    'Severe allergic reaction (swelling, hives, breathing difficulty)',
    'Severe burn sensation that worsens instead of improving',
  ],
  productsToAvoid: [
    'Retinol/retinoids for 7-14 days', 'AHA/BHA acids for 7-14 days',
    'Vitamin C serums for 7 days', 'Physical scrubs or exfoliants for 14 days',
    'Fragrance-containing products', 'Alcohol-based toners',
    'Self-tanner', 'Waxing or hair removal on treated area',
  ],
  productsRecommended: [
    'Gentle cleanser (CeraVe, Vanicream)', 'Rich, occlusive moisturizer',
    'SPF 50+ mineral sunscreen', 'Hyaluronic acid serum (once peeling starts)',
    'Post-procedure healing balm (provided by clinic)',
  ],
  activityRestrictions: [
    'No exercise causing sweating for 48-72 hours',
    'No swimming for 7 days', 'No direct sun for 2-4 weeks minimum',
    'No picking or pulling at peeling skin',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// MICRONEEDLING AFTERCARE
// ═══════════════════════════════════════════════════════════════════════════════

export const MICRONEEDLING_AFTERCARE: AftercareGuide = {
  id: 'aftercare-microneedling',
  treatmentName: 'Microneedling / RF Microneedling Aftercare',
  category: 'skin-treatment',
  immediateCare: [
    'Skin will appear red and feel warm, similar to a sunburn (normal and expected)',
    'Tiny pinpoint bleeding may occur (resolves within minutes to hours)',
    'Do not touch your face with unwashed hands',
    'Provider will apply post-treatment serum (hyaluronic acid or growth factors)',
    'Do not wash face for 4-6 hours after treatment',
  ],
  first24Hours: [
    'Redness is most intense in the first 12-24 hours and will gradually subside',
    'Apply only the approved post-treatment products (no active ingredients)',
    'Do NOT apply makeup for 24 hours',
    'Avoid direct sun exposure',
    'Sleep on your back with a clean pillowcase',
    'Avoid sweating, hot showers, saunas, or steam',
    'Some mild swelling is normal, especially around the eyes',
    'Cool compresses can help with discomfort',
  ],
  first7Days: [
    'Redness may persist for 2-5 days (RF microneedling may have slightly longer recovery)',
    'Skin may feel dry, tight, or rough as it heals',
    'Begin gentle skincare at 24 hours: gentle cleanser + hyaluronic acid + moisturizer + SPF',
    'Avoid all active ingredients (retinol, AHA, BHA, vitamin C) for 5-7 days',
    'Do not exfoliate for 7 days',
    'May resume mineral makeup after 24 hours',
    'Tiny scabs at needling points may form; do not pick them',
    'Stay very well hydrated (water and topical hydration)',
  ],
  whatToExpect: [
    'Day 1: Redness, warmth, tightness, mild swelling',
    'Days 2-3: Redness fading, skin may feel rough or sandy',
    'Days 4-7: Skin smoothing out, glow beginning to emerge',
    'Week 2-4: Continued improvement as collagen remodeling begins',
    'Month 1-3: Progressive firmness and texture refinement',
    'Month 3-6: Peak collagen production and final results from single session',
    'A series of 3-4 treatments, spaced 4-6 weeks apart, provides optimal results',
  ],
  whenToCallClinic: [
    'Redness or swelling worsening after 48 hours instead of improving',
    'Persistent warmth or oozing at treatment points',
    'Excessive dryness or flaking that does not respond to moisturizer',
    'Hyperpigmentation concerns',
    'Cold sore outbreak (take antiviral immediately if prescribed)',
  ],
  whenToCallER: [
    'Signs of infection (increasing redness, warmth, fever, pus)',
    'Severe allergic reaction',
    'Severe swelling or pain disproportionate to treatment',
  ],
  productsToAvoid: [
    'Retinol/retinoids for 7 days', 'AHA/BHA acids for 7 days',
    'Vitamin C serums for 5 days (can irritate micro-channels)',
    'Physical scrubs for 7-10 days', 'Fragranced products for 7 days',
    'Alcohol-based products', 'Benzoyl peroxide for 7 days',
  ],
  productsRecommended: [
    'Hyaluronic acid serum (gold standard post-microneedling)',
    'Growth factor serum (applied immediately post-treatment and days 1-3)',
    'Gentle, fragrance-free cleanser',
    'Rich, barrier-repair moisturizer (ceramide-based)',
    'SPF 50+ mineral sunscreen',
    'Peptide serums (after day 3)',
  ],
  activityRestrictions: [
    'No exercise causing sweating for 24-48 hours',
    'No swimming for 5-7 days', 'No direct sun for 2 weeks',
    'No saunas or steam for 48 hours',
    'No other facial treatments for 2-4 weeks',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENERAL POST-TREATMENT GUIDELINES
// ═══════════════════════════════════════════════════════════════════════════════

export const GENERAL_POST_TREATMENT_GUIDELINES = {
  hydration: 'Drink at least 64 oz of water daily following any treatment. Proper hydration supports healing, product integration, and optimal results.',
  sunProtection: 'SPF 30+ daily is non-negotiable after any aesthetic treatment. Reapply every 2 hours when outdoors. Sun damage can reverse treatment benefits and cause hyperpigmentation.',
  skincare: 'Use only gentle, fragrance-free products for 24-48 hours after any treatment. Gradually reintroduce active ingredients only after your provider confirms it is safe.',
  exercise: 'Avoid strenuous exercise for 24-48 hours after most treatments. Sweating can irritate treated skin, increase bruising risk, and affect injectable placement.',
  alcohol: 'Avoid alcohol for 24 hours before and after treatments. Alcohol thins the blood (increased bruising), dehydrates the body, and can interact with medications.',
  smoking: 'Smoking impairs healing and reduces treatment effectiveness. Avoid smoking or vaping for 48 hours before and after treatments (ideally, quit altogether).',
  followUp: 'Attend all scheduled follow-up appointments. These allow your provider to assess results, make adjustments, and plan your ongoing treatment strategy.',
  communication: 'When in doubt, call the clinic. No question is too small. We would always rather hear from you than have you worry. Our clinical team is available to support you.',
};

// ─── Export All Aftercare Guides ─────────────────────────────────────────────

export const ALL_AFTERCARE_GUIDES: AftercareGuide[] = [
  GLP1_AFTERCARE_BY_DOSE.dose1,
  GLP1_AFTERCARE_BY_DOSE.dose2,
  GLP1_AFTERCARE_BY_DOSE.dose3,
  GLP1_AFTERCARE_BY_DOSE.dose4,
  PEPTIDE_AFTERCARE,
  HORMONE_THERAPY_AFTERCARE,
  WELLNESS_INJECTION_AFTERCARE,
  BOTOX_AFTERCARE,
  FILLER_AFTERCARE,
  LASER_AFTERCARE,
  CHEMICAL_PEEL_AFTERCARE,
  MICRONEEDLING_AFTERCARE,
];
