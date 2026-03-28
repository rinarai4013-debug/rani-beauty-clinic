// ─── Informed Consent Templates ──────────────────────────────────────────────
// Treatment-specific consent form content for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface ConsentFormTemplate {
  id: string;
  formName: string;
  treatmentCategory: string;
  version: string;
  lastUpdated: string;
  purpose: string;
  treatmentDescription: string;
  risks: string[];
  benefits: string[];
  alternatives: string[];
  patientAcknowledgments: string[];
  additionalDisclosures: string[];
  signatureRequirements: {
    patientSignature: boolean;
    witnessSignature: boolean;
    providerSignature: boolean;
    dateRequired: boolean;
    photoConsentIncluded: boolean;
    initialRequiredSections: string[];
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLP-1 SEMAGLUTIDE CONSENT
// ═══════════════════════════════════════════════════════════════════════════════

export const GLP1_SEMAGLUTIDE_CONSENT: ConsentFormTemplate = {
  id: 'consent-glp1-semaglutide',
  formName: 'Informed Consent for Semaglutide (GLP-1 Receptor Agonist) Therapy',
  treatmentCategory: 'GLP-1 Weight Management',
  version: '2.0',
  lastUpdated: '2026-03-26',
  purpose: 'This consent form provides information about semaglutide therapy for medical weight management. Please read carefully, ask any questions, and sign to indicate your informed consent to proceed with treatment.',
  treatmentDescription: 'Semaglutide is a glucagon-like peptide-1 (GLP-1) receptor agonist administered as a weekly subcutaneous injection. It works by mimicking the GLP-1 hormone, which regulates appetite, slows gastric emptying, and improves insulin sensitivity. Treatment involves a structured titration protocol with gradually increasing doses over 16+ weeks, along with regular monitoring appointments and lab work.',
  risks: [
    'Gastrointestinal effects: nausea, vomiting, diarrhea, constipation, abdominal pain (common, especially during dose escalation)',
    'Pancreatitis: inflammation of the pancreas, which can be serious and require hospitalization',
    'Gallbladder disease: increased risk of gallstones, especially with rapid weight loss',
    'Thyroid tumors: animal studies showed increased risk of thyroid C-cell tumors; human risk is unknown',
    'Hypoglycemia: low blood sugar, especially if taking concurrent diabetes medications',
    'Kidney injury: dehydration from vomiting or diarrhea can affect kidney function',
    'Allergic reactions: including anaphylaxis (rare but potentially life-threatening)',
    'Injection site reactions: redness, swelling, pain at the injection site',
    'Changes in vision: potential worsening of diabetic retinopathy',
    'Hair thinning: related to rapid weight loss and potential nutritional deficiency',
    'Mental health effects: reports of depression, suicidal ideation (rare; causal link not established)',
    'Nutritional deficiencies: from reduced food intake',
    'Muscle loss: potential loss of lean muscle mass along with fat mass',
    'Weight regain: possible upon discontinuation of medication',
    'Unknown long-term effects: semaglutide for weight management is relatively new; long-term effects beyond clinical trial durations are not yet fully known',
  ],
  benefits: [
    'Significant weight loss (clinical trials show 10-15% average body weight reduction)',
    'Improved metabolic health markers (blood sugar, insulin resistance, cholesterol)',
    'Reduced cardiovascular risk factors',
    'Improved blood pressure',
    'Enhanced quality of life and mobility',
    'Potential improvement in sleep apnea, joint pain, and other weight-related conditions',
    'Structured medical support and monitoring throughout treatment',
  ],
  alternatives: [
    'Diet and exercise modification alone',
    'Other GLP-1 medications (tirzepatide, liraglutide)',
    'Other weight management medications (phentermine, naltrexone-bupropion, orlistat)',
    'Bariatric surgery (for qualifying candidates)',
    'Behavioral therapy and nutritional counseling alone',
    'No treatment',
  ],
  patientAcknowledgments: [
    'I understand that semaglutide is being prescribed for medical weight management',
    'I understand the FDA black box warning regarding thyroid C-cell tumors and that semaglutide is contraindicated in patients with a personal or family history of medullary thyroid carcinoma (MTC) or Multiple Endocrine Neoplasia syndrome type 2 (MEN 2)',
    'I confirm that I do NOT have a personal or family history of MTC or MEN 2',
    'I understand that pancreatitis is a serious potential side effect and I will report severe abdominal pain immediately',
    'I understand that I must attend all scheduled monitoring appointments and complete required lab work',
    'I understand the titration schedule and that dose adjustments will be made by my provider',
    'I understand that I should not become pregnant while on this medication and must use reliable contraception',
    'I understand that results vary and are not guaranteed',
    'I understand that weight regain is possible after discontinuation',
    'I understand that this medication works best in conjunction with dietary changes and exercise',
    'I understand the importance of adequate protein intake and hydration while on this medication',
    'I have disclosed all current medications, supplements, and medical conditions to my provider',
    'I have had the opportunity to ask questions and all my questions have been answered to my satisfaction',
  ],
  additionalDisclosures: [
    'Compounded semaglutide is not FDA-approved; it is compounded by a licensed pharmacy per a valid prescription',
    'Off-label use may apply depending on specific circumstances',
    'This clinic does not guarantee specific weight loss amounts or timelines',
    'Insurance may not cover this medication or associated visits',
    'Monthly monitoring is required; failure to attend may result in treatment discontinuation',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: true,
    providerSignature: true,
    dateRequired: true,
    photoConsentIncluded: true,
    initialRequiredSections: [
      'Thyroid cancer warning acknowledgment',
      'Pancreatitis risk acknowledgment',
      'Pregnancy contraindication acknowledgment',
      'Weight regain possibility acknowledgment',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GLP-1 TIRZEPATIDE CONSENT
// ═══════════════════════════════════════════════════════════════════════════════

export const GLP1_TIRZEPATIDE_CONSENT: ConsentFormTemplate = {
  id: 'consent-glp1-tirzepatide',
  formName: 'Informed Consent for Tirzepatide (GIP/GLP-1 Dual Agonist) Therapy',
  treatmentCategory: 'GLP-1 Weight Management',
  version: '2.0',
  lastUpdated: '2026-03-26',
  purpose: 'This consent form provides information about tirzepatide therapy for medical weight management. Tirzepatide is a dual glucose-dependent insulinotropic polypeptide (GIP) and GLP-1 receptor agonist, targeting two incretin pathways for enhanced metabolic effects.',
  treatmentDescription: 'Tirzepatide is administered as a weekly subcutaneous injection. The dual GIP/GLP-1 mechanism provides appetite suppression, improved insulin sensitivity, and metabolic enhancement through two distinct hormonal pathways. Treatment follows a 16+ week titration protocol with regular monitoring and lab work.',
  risks: [
    'Gastrointestinal effects: nausea, vomiting, diarrhea, constipation (may be more pronounced than single-mechanism GLP-1 agents)',
    'Pancreatitis: inflammation of the pancreas',
    'Gallbladder disease: increased cholelithiasis risk',
    'Thyroid tumors: animal studies showed thyroid C-cell tumor risk; human risk unknown',
    'Hypoglycemia: especially with concurrent insulin or sulfonylureas (higher risk with dual mechanism)',
    'Kidney injury: from dehydration secondary to GI side effects',
    'Allergic reactions: including potential anaphylaxis',
    'Injection site reactions',
    'GERD/acid reflux',
    'Hair thinning related to weight loss',
    'Mental health effects (depression, mood changes)',
    'Nutritional deficiencies',
    'Muscle loss',
    'Weight regain upon discontinuation',
    'Unknown long-term effects',
    'Potential interference with oral contraceptive absorption',
  ],
  benefits: [
    'Superior weight loss compared to single-mechanism GLP-1 agents (clinical trials show 15-22% average body weight reduction)',
    'Significant improvement in insulin sensitivity',
    'Improved metabolic markers (blood sugar, A1c, cholesterol, triglycerides)',
    'Reduced cardiovascular risk factors',
    'Improved blood pressure',
    'Enhanced quality of life',
    'Dual mechanism may provide benefits where single-mechanism agents have plateaued',
  ],
  alternatives: [
    'Semaglutide (GLP-1 single-mechanism)',
    'Other GLP-1 medications (liraglutide)',
    'Other weight management medications',
    'Diet and exercise modification alone',
    'Bariatric surgery',
    'Behavioral therapy',
    'No treatment',
  ],
  patientAcknowledgments: [
    'I understand that tirzepatide is a dual GIP/GLP-1 receptor agonist',
    'I understand the FDA black box warning regarding thyroid C-cell tumors',
    'I confirm that I do NOT have a personal or family history of MTC or MEN 2',
    'I understand that the dual mechanism may produce more intense GI side effects than other GLP-1 medications',
    'I understand that I must attend all monitoring appointments and complete required labs',
    'I understand that oral medications (including contraceptives) may be affected by delayed gastric emptying',
    'I understand that I should not become pregnant while on this medication',
    'I understand that results vary and are not guaranteed',
    'I understand that weight regain is possible after discontinuation',
    'I have disclosed all current medications, supplements, and medical conditions',
    'I have had the opportunity to ask questions and all questions have been answered',
  ],
  additionalDisclosures: [
    'Compounded tirzepatide is not FDA-approved; it is compounded by a licensed pharmacy per a valid prescription',
    'Off-label use may apply',
    'This clinic does not guarantee specific outcomes',
    'Insurance may not cover this medication',
    'Monthly monitoring is required',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: true,
    providerSignature: true,
    dateRequired: true,
    photoConsentIncluded: true,
    initialRequiredSections: [
      'Thyroid cancer warning acknowledgment',
      'Pancreatitis risk acknowledgment',
      'Pregnancy contraindication acknowledgment',
      'Oral medication absorption warning',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PEPTIDE THERAPY CONSENT (GENERAL)
// ═══════════════════════════════════════════════════════════════════════════════

export const PEPTIDE_THERAPY_CONSENT: ConsentFormTemplate = {
  id: 'consent-peptide-therapy',
  formName: 'Informed Consent for Peptide Therapy',
  treatmentCategory: 'Peptide Therapy',
  version: '1.0',
  lastUpdated: '2026-03-26',
  purpose: 'This consent form covers peptide therapy treatments including NAD+, Sermorelin, Glutathione, BPC-157, GHK-Cu, and PT-141. Please read the section(s) relevant to your prescribed peptide(s).',
  treatmentDescription: 'Peptide therapies use synthetic or naturally-derived peptides to support specific biological functions including cellular repair, growth hormone optimization, antioxidant defense, tissue healing, and sexual health. Peptides are administered via subcutaneous or intramuscular injection, or topical application, depending on the specific compound.',
  risks: [
    'Injection site reactions: redness, swelling, pain, bruising',
    'Allergic reactions: ranging from mild (rash) to severe (anaphylaxis, rare)',
    'NAD+ specific: flushing, nausea, chest tightness, headache (rate-dependent for IV)',
    'Sermorelin specific: headache, flushing, joint stiffness, water retention, elevated blood glucose',
    'BPC-157 specific: nausea, dizziness (rare); promotes angiogenesis (contraindicated with active cancer)',
    'GHK-Cu specific: skin irritation, copper accumulation (rare with proper monitoring)',
    'PT-141 specific: nausea (40%), blood pressure elevation, skin hyperpigmentation with repeated use',
    'Glutathione specific: injection site soreness, rare allergic reaction',
    'Unknown long-term effects: many peptides have limited long-term human safety data',
    'Drug interactions: potential interactions with current medications',
    'Hormonal effects: some peptides affect growth hormone, testosterone, or estrogen levels',
    'Contamination risk: compounded peptides depend on pharmacy quality and handling',
  ],
  benefits: [
    'NAD+: cellular energy restoration, cognitive enhancement, anti-aging',
    'Sermorelin: improved sleep, body composition, skin health, recovery',
    'Glutathione: detoxification, skin brightening, immune support',
    'BPC-157: accelerated healing of tendons, ligaments, gut lining, and tissues',
    'GHK-Cu: collagen production, skin repair, anti-aging, DNA repair',
    'PT-141: increased sexual desire and arousal through central nervous system activation',
  ],
  alternatives: [
    'Lifestyle modifications (diet, exercise, sleep optimization)',
    'Conventional pharmaceutical treatments for specific conditions',
    'Surgical interventions where applicable',
    'Other regenerative medicine approaches',
    'No treatment',
  ],
  patientAcknowledgments: [
    'I understand that peptide therapies may be compounded and are not all individually FDA-approved for the indicated use',
    'I understand that some peptides promote cell growth (angiogenesis) and are contraindicated in patients with active cancer',
    'I understand the importance of proper storage and handling of peptide medications',
    'I understand that lab monitoring is required for certain peptides (IGF-1 for sermorelin, copper/zinc for GHK-Cu)',
    'I understand that cycling protocols should be followed to prevent receptor desensitization',
    'I have disclosed all current medications, supplements, and medical conditions',
    'I understand that results vary and are not guaranteed',
    'I understand the specific risks of my prescribed peptide(s) as discussed with my provider',
    'I have had the opportunity to ask questions and all questions have been answered',
  ],
  additionalDisclosures: [
    'Peptide therapies are prescribed off-label in many cases',
    'Compounded peptides are produced by licensed pharmacies but are not FDA-approved finished products',
    'Quality of compounded peptides depends on the compounding pharmacy',
    'Some peptides (especially BPC-157 and GHK-Cu) have limited human clinical trial data',
    'Self-injection training will be provided and documented',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: false,
    providerSignature: true,
    dateRequired: true,
    photoConsentIncluded: false,
    initialRequiredSections: [
      'Cancer/angiogenesis risk acknowledgment (BPC-157, sermorelin)',
      'Off-label/compounded acknowledgment',
      'Specific peptide risks reviewed',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HORMONE THERAPY CONSENT
// ═══════════════════════════════════════════════════════════════════════════════

export const HORMONE_THERAPY_CONSENT: ConsentFormTemplate = {
  id: 'consent-hormone-therapy',
  formName: 'Informed Consent for Hormone Optimization Therapy',
  treatmentCategory: 'Hormone Therapy',
  version: '1.0',
  lastUpdated: '2026-03-26',
  purpose: 'This consent form covers hormone optimization therapies including testosterone replacement (men and women), thyroid optimization, and DHEA supplementation.',
  treatmentDescription: 'Hormone optimization therapy involves restoring hormone levels to optimal physiologic ranges through prescription medications administered via injection, topical application, or oral route. Treatment includes baseline labs, ongoing monitoring, and dose adjustment to achieve and maintain target levels.',
  risks: [
    'Testosterone (women): acne, increased body hair, voice deepening (may be irreversible), clitoral changes, mood changes, elevated hematocrit',
    'Testosterone (men): polycythemia (elevated red blood cells), testicular atrophy, reduced fertility, acne, gynecomastia, mood changes, sleep apnea worsening, prostate effects',
    'Testosterone (all): cardiovascular effects (risk varies by study), lipid changes, liver effects, injection site reactions',
    'Thyroid: palpitations, anxiety, insomnia (if over-replaced), temporary hair shedding, bone density concerns with long-term TSH suppression',
    'DHEA: acne, mood changes, hormonal imbalance if not properly monitored, theoretical cancer risk with hormone-sensitive conditions',
    'Allergic reactions to any medication component',
    'Drug interactions with current medications',
    'Psychological dependence on exogenous hormones',
    'Need for ongoing monitoring and potential lifelong therapy',
  ],
  benefits: [
    'Improved energy, mood, and cognitive function',
    'Enhanced libido and sexual function',
    'Better body composition (muscle gain, fat loss)',
    'Improved bone density',
    'Better cardiovascular health markers (in appropriate patients)',
    'Improved sleep quality',
    'Enhanced quality of life and vitality',
    'Metabolic improvements (thyroid optimization)',
  ],
  alternatives: [
    'Lifestyle modifications (exercise, sleep, stress management, nutrition)',
    'Herbal or natural supplements',
    'No treatment (continue with current hormone levels)',
    'Referral to endocrinologist for conventional management',
  ],
  patientAcknowledgments: [
    'I understand that hormone therapy requires ongoing monitoring with blood work',
    'I understand that testosterone is a Schedule III controlled substance',
    'I understand that testosterone therapy can reduce fertility and sperm production in men',
    'Women: I understand the risks of virilization (voice changes, body hair, acne) and that some effects may be irreversible',
    'Men: I understand the importance of PSA and hematocrit monitoring',
    'I understand that thyroid medication must be taken on an empty stomach and separated from certain supplements',
    'I understand that DHEA can convert to both testosterone and estrogen and requires monitoring',
    'I understand that abruptly stopping hormone therapy is not recommended without medical guidance',
    'I have disclosed all current medications, supplements, and medical conditions including history of cancer, blood clots, or cardiovascular disease',
    'I understand that results vary and optimal levels may take 3-6 months to achieve',
    'I have had the opportunity to ask questions',
  ],
  additionalDisclosures: [
    'Testosterone is a DEA Schedule III controlled substance and is subject to prescribing regulations',
    'Hormone optimization targets differ from conventional reference ranges; our targets reflect current evidence for optimal wellness',
    'Insurance may not cover all hormone-related labs or medications',
    'Compounded hormones are not FDA-approved finished drug products',
    'Patients must not share, sell, or transfer controlled substance prescriptions',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: true,
    providerSignature: true,
    dateRequired: true,
    photoConsentIncluded: false,
    initialRequiredSections: [
      'Controlled substance acknowledgment (testosterone)',
      'Fertility impact acknowledgment (men)',
      'Virilization risk acknowledgment (women)',
      'Monitoring compliance acknowledgment',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// WELLNESS INJECTION CONSENT
// ═══════════════════════════════════════════════════════════════════════════════

export const WELLNESS_INJECTION_CONSENT: ConsentFormTemplate = {
  id: 'consent-wellness-injection',
  formName: 'Informed Consent for Wellness Injections',
  treatmentCategory: 'Wellness Injections',
  version: '1.0',
  lastUpdated: '2026-03-26',
  purpose: 'This consent form covers vitamin and wellness injections including B12, Biotin, Vitamin D3, Tri-Immune Boost, Lipo-Mino, and NAD+ injection/IV treatments.',
  treatmentDescription: 'Wellness injections deliver vitamins, minerals, amino acids, and other nutrients directly into the muscle or bloodstream for rapid absorption. These injections bypass the digestive system, providing higher bioavailability than oral supplementation. Treatments are administered by trained clinical staff.',
  risks: [
    'Injection site pain, bruising, redness, or swelling (most common)',
    'Allergic reaction (rare; can range from mild rash to anaphylaxis)',
    'Infection at injection site (rare with proper sterile technique)',
    'Vasovagal response (lightheadedness or fainting during/after injection)',
    'NAD+ specific: flushing, nausea, chest tightness, headache, abdominal cramping',
    'NAD+ IV specific: vein irritation, extravasation, prolonged discomfort if rate too fast',
    'Vitamin D specific: hypercalcemia with excessive dosing',
    'B12 specific: hypokalemia during severe deficiency repletion (rare)',
    'Biotin specific: false lab results if not discontinued before blood work',
    'Lipo-Mino specific: mild nausea, diarrhea, increased urination',
    'Tri-Immune specific: metallic taste from zinc',
    'Nerve damage at injection site (extremely rare)',
    'Hematoma (blood collection under skin)',
  ],
  benefits: [
    'Rapid nutrient delivery with high bioavailability',
    'B12: improved energy, cognitive function, and red blood cell production',
    'Biotin: stronger hair, skin, and nails',
    'Vitamin D: immune support, bone health, mood improvement',
    'Tri-Immune: enhanced immune defense and antioxidant protection',
    'Lipo-Mino: metabolic support and enhanced fat metabolism',
    'NAD+: cellular energy, cognitive clarity, anti-aging, DNA repair',
    'Bypasses digestive absorption issues',
  ],
  alternatives: [
    'Oral vitamin and supplement forms',
    'Dietary modifications to increase nutrient intake',
    'No treatment',
  ],
  patientAcknowledgments: [
    'I understand that wellness injections are administered by trained clinical staff',
    'I understand the risks specific to my selected treatment(s)',
    'I understand that I should disclose all allergies, medications, and medical conditions',
    'I understand that results vary by individual',
    'I understand that biotin must be stopped 72 hours before any blood work',
    'I understand the recommended frequency and that consistency improves results',
    'I understand that for NAD+ IV, I must remain in the clinic for the duration of the treatment and monitoring period',
    'I have had the opportunity to ask questions',
  ],
  additionalDisclosures: [
    'Wellness injections are not a substitute for a balanced diet and healthy lifestyle',
    'Insurance typically does not cover wellness injections',
    'Some injections may be compounded by a licensed pharmacy',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: false,
    providerSignature: true,
    dateRequired: true,
    photoConsentIncluded: false,
    initialRequiredSections: [
      'Allergy disclosure',
      'Specific treatment selection',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// GENERAL TREATMENT CONSENT
// ═══════════════════════════════════════════════════════════════════════════════

export const GENERAL_TREATMENT_CONSENT: ConsentFormTemplate = {
  id: 'consent-general',
  formName: 'General Treatment Consent',
  treatmentCategory: 'General',
  version: '1.0',
  lastUpdated: '2026-03-26',
  purpose: 'This general consent form covers standard medical aesthetic and wellness treatments at Rani Beauty Clinic. Treatment-specific consent forms may also be required and will be provided separately.',
  treatmentDescription: 'Rani Beauty Clinic provides a range of medical aesthetic and wellness treatments including injectables (neurotoxins, dermal fillers), laser treatments, skin treatments (HydraFacial, chemical peels, microneedling), and wellness injection services. All treatments are performed by licensed, trained professionals under physician supervision.',
  risks: [
    'Pain, discomfort, bruising, swelling, or redness at or near treatment sites',
    'Allergic reaction to treatment products or materials',
    'Infection (rare with proper sterile technique)',
    'Scarring (rare)',
    'Pigmentation changes (hyperpigmentation or hypopigmentation)',
    'Asymmetry or uneven results',
    'Need for additional treatments or touch-ups',
    'Unsatisfactory aesthetic outcome',
    'Nerve injury (temporary or, rarely, permanent)',
    'Burns (laser or chemical treatments)',
    'Tissue damage (vascular occlusion from filler, rare)',
    'Systemic reactions',
    'Unknown risks not yet identified',
  ],
  benefits: [
    'Improved aesthetic appearance',
    'Enhanced self-confidence and quality of life',
    'Skin health improvement',
    'Treatment of specific cosmetic concerns',
    'Wellness and vitality support',
  ],
  alternatives: [
    'Alternative treatment approaches (discussed with provider)',
    'Over-the-counter or prescription topical treatments',
    'Surgical intervention',
    'No treatment',
  ],
  patientAcknowledgments: [
    'I am voluntarily consenting to treatment at Rani Beauty Clinic',
    'I have provided accurate and complete medical history',
    'I understand that results are not guaranteed and may vary',
    'I understand that I may need multiple treatments for optimal results',
    'I understand the estimated costs and payment terms',
    'I understand that I have the right to refuse treatment at any time',
    'I understand the clinic is not responsible for complications arising from non-compliance with aftercare instructions',
    'I understand that I should not make important decisions about my treatment while under the influence of sedation or medications',
    'I authorize the treatment team to perform the discussed procedure(s)',
    'I have had the opportunity to ask questions and have received satisfactory answers',
  ],
  additionalDisclosures: [
    'Rani Beauty Clinic is a physician-supervised medical aesthetics practice',
    'All treatments are performed by licensed and trained professionals',
    'Emergency protocols are in place and staff is trained in emergency response',
    'Patient records are maintained in accordance with HIPAA regulations',
    'Treatments are non-refundable once administered',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: false,
    providerSignature: true,
    dateRequired: true,
    photoConsentIncluded: false,
    initialRequiredSections: [
      'Medical history accuracy acknowledgment',
      'No guarantee of results acknowledgment',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// TELEHEALTH / GFE CONSENT
// ═══════════════════════════════════════════════════════════════════════════════

export const TELEHEALTH_GFE_CONSENT: ConsentFormTemplate = {
  id: 'consent-telehealth-gfe',
  formName: 'Informed Consent for Telehealth / Good Faith Exam (GFE)',
  treatmentCategory: 'Telehealth',
  version: '1.0',
  lastUpdated: '2026-03-26',
  purpose: 'This consent form authorizes the delivery of healthcare services via telehealth technology (video, audio, or electronic communication) and covers the Good Faith Exam (GFE) required before certain treatments.',
  treatmentDescription: 'A Good Faith Exam (GFE) is a medical evaluation conducted by a licensed healthcare provider to assess your suitability for specific treatments (such as GLP-1 medications, peptide therapy, or hormone therapy). This exam may be conducted via telehealth when appropriate, including video consultation, medical history review, and treatment planning.',
  risks: [
    'Technical difficulties may interrupt or prevent the telehealth session',
    'Limitations of remote examination compared to in-person assessment',
    'Privacy risks inherent to electronic communication (despite HIPAA-compliant platforms)',
    'Potential for miscommunication without in-person visual or physical cues',
    'Provider may determine that an in-person visit is necessary based on telehealth findings',
    'Diagnosis and treatment recommendations may differ from what an in-person exam would reveal',
    'Emergency situations cannot be managed via telehealth',
  ],
  benefits: [
    'Convenient access to medical evaluation from home or office',
    'Reduced travel time and waiting room exposure',
    'Faster initiation of treatment when appropriate',
    'Accessible to patients with mobility or transportation challenges',
    'Compliant pathway for GFE requirements',
  ],
  alternatives: [
    'In-person Good Faith Exam at the clinic',
    'Referral to another provider for in-person evaluation',
    'Declining the exam (treatment would not proceed without GFE)',
  ],
  patientAcknowledgments: [
    'I understand that telehealth is the delivery of healthcare services via electronic technology',
    'I understand that the telehealth session will be conducted on a HIPAA-compliant platform',
    'I understand that I must be in a private location with stable internet for the session',
    'I understand that the provider may require an in-person follow-up based on the telehealth evaluation',
    'I understand that I have the right to refuse telehealth and request an in-person visit instead',
    'I understand that I should have a government-issued ID available for identity verification',
    'I understand that the GFE is a medical requirement and not a guarantee of treatment approval',
    'I understand that the provider may determine that the requested treatment is not appropriate for me',
    'I understand that my telehealth visit is part of my permanent medical record',
    'I understand that I must provide accurate medical history and current medication information',
  ],
  additionalDisclosures: [
    'Telehealth services are conducted on HIPAA-compliant platforms',
    'The GFE satisfies regulatory requirements for prescribing certain medications',
    'The GFE provider makes an independent medical judgment about treatment appropriateness',
    'State-specific telehealth regulations apply',
    'GFE fees are non-refundable regardless of treatment approval outcome',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: false,
    providerSignature: true,
    dateRequired: true,
    photoConsentIncluded: false,
    initialRequiredSections: [
      'Telehealth technology understanding',
      'Privacy acknowledgment',
      'GFE purpose and outcome acknowledgment',
    ],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// PHOTO/VIDEO CONSENT
// ═══════════════════════════════════════════════════════════════════════════════

export const PHOTO_VIDEO_CONSENT: ConsentFormTemplate = {
  id: 'consent-photo-video',
  formName: 'Photo and Video Consent',
  treatmentCategory: 'Documentation',
  version: '1.0',
  lastUpdated: '2026-03-26',
  purpose: 'This consent authorizes Rani Beauty Clinic to take, use, and/or publish photographs and/or video recordings as described below.',
  treatmentDescription: 'Before-and-after photographs and/or video recordings may be taken to document treatment progress, for medical record purposes, and potentially for marketing or educational use. All photos are taken by trained staff using standardized lighting and positioning.',
  risks: [
    'Photos may be identifiable even with cropping or editing',
    'Published photos could be shared or reposted by third parties beyond the clinic\'s control',
    'Emotional discomfort with viewing personal before-and-after images',
    'Data breach risk (clinic maintains security, but no system is 100% secure)',
  ],
  benefits: [
    'Accurate documentation of treatment progress for your medical record',
    'Ability to compare before-and-after results objectively',
    'Contributing to educational content that helps other patients make informed decisions',
    'Quality assurance and treatment planning',
  ],
  alternatives: [
    'Medical record photos only (no marketing use)',
    'Declining all photography (this may limit the clinic\'s ability to document progress)',
  ],
  patientAcknowledgments: [
    'I consent to photographs/videos for my MEDICAL RECORD: [ ] Yes [ ] No',
    'I consent to use of photographs/videos for EDUCATIONAL purposes (staff training, presentations): [ ] Yes [ ] No',
    'I consent to use of photographs/videos for MARKETING (website, social media, printed materials): [ ] Yes [ ] No',
    'I understand that I can select which uses I consent to and decline others',
    'I understand that photos used for marketing will be anonymized to the extent possible',
    'I understand that I may revoke marketing consent at any time in writing',
    'I understand that revoking consent does not affect materials already published',
    'I understand that I will not receive financial compensation for the use of my photos/videos',
    'I understand that the clinic will store photos securely in my medical record',
  ],
  additionalDisclosures: [
    'Photos are stored on HIPAA-compliant, encrypted systems',
    'Only authorized clinical staff have access to medical record photos',
    'Marketing photos are reviewed and approved before publication',
    'Patients may request copies of their own photos at any time',
    'Revoking marketing consent requires written notice to the clinic',
  ],
  signatureRequirements: {
    patientSignature: true,
    witnessSignature: false,
    providerSignature: false,
    dateRequired: true,
    photoConsentIncluded: true,
    initialRequiredSections: [
      'Medical record photo consent',
      'Marketing use consent (opt-in)',
      'Revocation rights acknowledgment',
    ],
  },
};

// ─── Export All Consent Templates ────────────────────────────────────────────

export const ALL_CONSENT_FORMS: ConsentFormTemplate[] = [
  GLP1_SEMAGLUTIDE_CONSENT,
  GLP1_TIRZEPATIDE_CONSENT,
  PEPTIDE_THERAPY_CONSENT,
  HORMONE_THERAPY_CONSENT,
  WELLNESS_INJECTION_CONSENT,
  GENERAL_TREATMENT_CONSENT,
  TELEHEALTH_GFE_CONSENT,
  PHOTO_VIDEO_CONSENT,
];
