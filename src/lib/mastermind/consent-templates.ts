/**
 * Consent Templates for Rani Beauty Clinic — Mastermind Engine
 *
 * Five informed consent templates covering all treatment scenarios.
 * Each uses {{variable}} placeholders resolved at render time.
 *
 * Variables available:
 *   {{patientName}}   — Full patient name
 *   {{treatmentList}} — Comma-separated list of planned treatments
 *   {{totalCost}}     — Formatted dollar amount
 *   {{providerName}}  — Licensed provider performing/supervising
 *   {{date}}          — Current date in readable format
 */

import type { ConsentTemplate } from '@/types/consent';
import { escapeHtml } from '@/lib/security/sanitize-html';

export const CONSENT_TEMPLATES: ConsentTemplate[] = [
  // ── 1. GENERAL TREATMENT CONSENT ──
  {
    type: 'general_treatment',
    title: 'Informed Consent for Aesthetic Treatment',
    acknowledgments: [
      'I confirm that I have provided accurate and complete medical history information.',
      'I understand the potential risks, benefits, and alternatives to the proposed treatment(s).',
      'I have had the opportunity to ask questions and all of my questions have been answered to my satisfaction.',
      'I understand that results vary between individuals and no specific outcome is guaranteed.',
      'I understand I may withdraw consent and refuse treatment at any time.',
    ],
    body: `
<h2>Informed Consent for Medical Aesthetic Treatment</h2>
<p><strong>Patient:</strong> {{patientName}}<br/>
<strong>Date:</strong> {{date}}<br/>
<strong>Provider:</strong> {{providerName}}<br/>
<strong>Planned Treatment(s):</strong> {{treatmentList}}</p>

<h3>Purpose &amp; Nature of Treatment</h3>
<p>I, {{patientName}}, voluntarily consent to the medical aesthetic treatment(s) listed above, to be performed at Rani Beauty Clinic by or under the supervision of {{providerName}}. I understand these procedures are elective and are being pursued for cosmetic and/or wellness purposes.</p>

<h3>Benefits</h3>
<p>The expected benefits of the proposed treatment(s) include, but are not limited to, improvement in skin quality, facial contour, skin tone, texture, or overall appearance. Individual results vary and are influenced by factors including skin type, age, health status, lifestyle, and adherence to aftercare instructions.</p>

<h3>Risks &amp; Potential Complications</h3>
<p>All medical procedures carry inherent risks. General risks associated with aesthetic treatments may include but are not limited to:</p>
<ul>
  <li>Pain, discomfort, or tenderness at the treatment site</li>
  <li>Redness, swelling, or bruising (typically temporary)</li>
  <li>Infection (rare with proper aftercare)</li>
  <li>Allergic reaction to products or medications used</li>
  <li>Unsatisfactory results or need for additional treatment</li>
  <li>Scarring or changes in skin pigmentation (rare)</li>
  <li>Nerve injury (rare)</li>
</ul>
<p>Specific risks related to each individual procedure will be discussed separately in the procedure-specific consent form.</p>

<h3>Alternatives</h3>
<p>I understand that alternatives to the proposed treatment(s) may include other aesthetic procedures, non-invasive approaches, topical products, or no treatment at all. The relative benefits and risks of alternatives have been discussed with me.</p>

<h3>Right to Refuse</h3>
<p>I understand that I have the right to refuse or withdraw consent for any procedure at any time before or during the treatment, without prejudice to my future care at Rani Beauty Clinic.</p>

<h3>Medical History Disclosure</h3>
<p>I confirm that I have disclosed my complete medical history, including all medications (prescription, over-the-counter, and supplements), allergies, prior cosmetic procedures, and any medical conditions that may affect treatment safety or outcomes. I understand that withholding or providing inaccurate medical information may increase the risk of complications.</p>

<h3>Post-Treatment Care</h3>
<p>I agree to follow all aftercare instructions provided by Rani Beauty Clinic and to contact the clinic promptly if I experience any unexpected symptoms or concerns following treatment.</p>
`.trim(),
  },

  // ── 2. PHOTO RELEASE ──
  {
    type: 'photo_release',
    title: 'Photograph &amp; Image Release Authorization',
    acknowledgments: [
      'I consent to clinical photographs being taken before, during, and/or after treatment for my medical record.',
      'I understand that AI-based skin analysis may process my photographs for treatment planning purposes.',
      'I understand I may opt out of marketing use without affecting my treatment or care.',
    ],
    body: `
<h2>Photograph &amp; Image Release Authorization</h2>
<p><strong>Patient:</strong> {{patientName}}<br/>
<strong>Date:</strong> {{date}}</p>

<h3>Clinical Photography</h3>
<p>I, {{patientName}}, authorize Rani Beauty Clinic and its staff to take photographs, videos, or other visual recordings of me before, during, and/or after treatment. These images will be securely stored as part of my clinical record and used for:</p>
<ul>
  <li><strong>Treatment Documentation:</strong> Tracking my progress and treatment outcomes</li>
  <li><strong>AI Skin Analysis:</strong> Processing through Rani Beauty Clinic's Aura Scan technology for objective skin health assessment and treatment planning</li>
  <li><strong>Provider Consultation:</strong> Sharing with authorized clinical staff involved in my care</li>
</ul>

<h3>Marketing Use (Optional)</h3>
<p>Separately, I may choose to authorize the use of my images for educational and marketing purposes, including but not limited to before-and-after presentations, website content, social media, and print materials. If authorized for marketing use:</p>
<ul>
  <li>My full name will not be associated with the images unless I provide separate written consent</li>
  <li>Images may be cropped or edited for presentation purposes but will not be materially altered</li>
  <li>I may revoke marketing authorization at any time by contacting the clinic in writing</li>
</ul>
<p><em>Note: Declining marketing authorization will have no effect on the quality of your care or treatment at Rani Beauty Clinic.</em></p>

<h3>Data Security</h3>
<p>All images are stored securely in compliance with applicable privacy regulations. Access is restricted to authorized clinical staff and, if consented, marketing personnel. Images used for AI analysis are processed in accordance with our data security and privacy policies.</p>
`.trim(),
  },

  // ── 3. SPECIFIC PROCEDURE CONSENT ──
  {
    type: 'specific_procedure',
    title: 'Procedure-Specific Informed Consent',
    requiredForTreatments: [
      'Botox', 'Fillers', 'Sculptra', 'Laser', 'PicoWay',
      'Chemical Peel', 'VI Peel', 'PRX-T33', 'RF Microneedling',
      'HydraFacial', 'Sofwave', 'GLP-1', 'HRT', 'Laser Hair Removal',
    ],
    acknowledgments: [
      'I have read and understand the specific risks associated with my planned procedure(s).',
      'I understand the expected recovery timeline and commit to following aftercare instructions.',
      'I confirm I am not aware of any medical condition that has not been disclosed that could increase my risk.',
      'I understand that additional sessions may be required to achieve optimal results.',
    ],
    body: `
<h2>Procedure-Specific Informed Consent</h2>
<p><strong>Patient:</strong> {{patientName}}<br/>
<strong>Date:</strong> {{date}}<br/>
<strong>Provider:</strong> {{providerName}}<br/>
<strong>Procedure(s):</strong> {{treatmentList}}</p>

<p>In addition to the general treatment consent, the following procedure-specific information, risks, and considerations apply to your planned treatment(s):</p>

<h3>Injectable Treatments (Botox, Dermal Fillers, Sculptra)</h3>
<p>If your treatment plan includes injectable procedures, you should be aware of the following:</p>
<ul>
  <li><strong>Common effects:</strong> Bruising, swelling, redness, and tenderness at injection sites (typically resolving within 3-14 days)</li>
  <li><strong>Asymmetry:</strong> Mild asymmetry may occur and may require touch-up treatment</li>
  <li><strong>Migration:</strong> Filler material may shift from the original injection site (uncommon)</li>
  <li><strong>Nodules or lumps:</strong> Palpable or visible irregularities may develop (treatable)</li>
  <li><strong>Vascular occlusion:</strong> In rare cases, filler may compress or enter a blood vessel, potentially causing tissue damage, skin necrosis, or vision changes. This is a medical emergency requiring immediate treatment</li>
  <li><strong>Allergic reaction:</strong> Hypersensitivity to product components (rare)</li>
  <li><strong>Duration:</strong> Results are temporary and maintenance treatments will be needed (Botox: 3-4 months; Fillers: 6-18 months; Sculptra: up to 2 years)</li>
</ul>

<h3>Laser Treatments (PicoWay, Laser Hair Removal, Other Laser Procedures)</h3>
<p>If your treatment plan includes laser-based procedures:</p>
<ul>
  <li><strong>Burns:</strong> Superficial or deep burns may occur, particularly if skin has recent sun exposure or active tan</li>
  <li><strong>Hyperpigmentation or hypopigmentation:</strong> Temporary or, rarely, permanent changes in skin color, particularly in darker skin types</li>
  <li><strong>Scarring:</strong> Rare, but possible, especially with improper aftercare or secondary infection</li>
  <li><strong>Eye injury:</strong> Protective eyewear must be worn at all times during treatment</li>
  <li><strong>Herpes reactivation:</strong> Laser treatment near the mouth may trigger cold sore outbreaks in susceptible individuals</li>
  <li><strong>Incomplete results:</strong> Multiple sessions are typically required; some conditions may not fully resolve</li>
</ul>

<h3>Chemical Peels (VI Peel, PRX-T33)</h3>
<p>If your treatment plan includes chemical peeling procedures:</p>
<ul>
  <li><strong>Prolonged redness:</strong> Redness and sensitivity lasting days to weeks depending on peel depth</li>
  <li><strong>Peeling and flaking:</strong> Expected part of the process; skin should not be picked or forced to peel</li>
  <li><strong>Infection:</strong> Bacterial, viral, or fungal infection (rare with proper aftercare)</li>
  <li><strong>Scarring:</strong> Rare, more likely with deeper peels or improper aftercare</li>
  <li><strong>Pigmentary changes:</strong> Temporary or persistent lightening or darkening of treated skin</li>
  <li><strong>Sun sensitivity:</strong> Treated skin is significantly more sensitive to UV exposure; strict sun protection is required</li>
</ul>

<h3>RF Microneedling</h3>
<p>If your treatment plan includes radiofrequency microneedling:</p>
<ul>
  <li><strong>Redness and swelling:</strong> Expected for 24-72 hours; may persist longer in sensitive skin</li>
  <li><strong>Pinpoint bleeding:</strong> Minor bleeding at needle entry points (normal)</li>
  <li><strong>Infection:</strong> Rare, but possible if aftercare instructions are not followed</li>
  <li><strong>Scarring:</strong> Rare; risk is higher with aggressive settings or improper technique</li>
  <li><strong>Prolonged redness:</strong> May last 1-2 weeks in some patients</li>
  <li><strong>Burns:</strong> Radiofrequency energy may cause thermal injury (uncommon with proper technique)</li>
</ul>

<h3>GLP-1 Weight Management (Tirzepatide, Semaglutide)</h3>
<p>If your treatment plan includes GLP-1 receptor agonist injections for weight management:</p>
<ul>
  <li><strong>Gastrointestinal effects:</strong> Nausea, vomiting, diarrhea, and constipation are common, especially during dose titration</li>
  <li><strong>Injection site reactions:</strong> Redness, swelling, or itching at the injection site</li>
  <li><strong>Pancreatitis:</strong> Rare but serious inflammation of the pancreas; seek immediate medical attention for severe abdominal pain</li>
  <li><strong>Gallbladder disease:</strong> Increased risk of gallstones with rapid weight loss</li>
  <li><strong>Thyroid concerns:</strong> GLP-1 receptor agonists carry a boxed warning regarding medullary thyroid carcinoma observed in animal studies; these medications are contraindicated in patients with a personal or family history of medullary thyroid carcinoma or Multiple Endocrine Neoplasia syndrome type 2</li>
  <li><strong>Hypoglycemia:</strong> Low blood sugar may occur, particularly in patients taking other diabetes medications</li>
  <li><strong>Monitoring:</strong> Regular follow-up appointments and lab work are required throughout treatment</li>
</ul>

<h3>Hormone Replacement Therapy (HRT)</h3>
<p>If your treatment plan includes hormone replacement therapy:</p>
<ul>
  <li><strong>Blood clots:</strong> Increased risk of deep vein thrombosis and pulmonary embolism (risk varies by route of administration and individual factors)</li>
  <li><strong>Mood changes:</strong> Mood swings, irritability, or emotional changes may occur during dosage adjustment</li>
  <li><strong>Cardiovascular effects:</strong> Potential impact on blood pressure, cholesterol, and cardiovascular risk; requires monitoring</li>
  <li><strong>Liver function:</strong> Oral hormones may affect liver function; periodic lab monitoring is required</li>
  <li><strong>Fluid retention:</strong> Swelling or bloating may occur</li>
  <li><strong>Hormone-sensitive conditions:</strong> Certain cancers and conditions may be exacerbated by hormone therapy</li>
  <li><strong>Ongoing monitoring:</strong> Regular lab work and clinical follow-up are required throughout the course of therapy to ensure safety and appropriate dosing</li>
</ul>

<h3>Acknowledgment</h3>
<p>I acknowledge that the risks described above are not exhaustive. Rare and unforeseen complications may occur with any medical procedure. I have been given the opportunity to ask questions about procedure-specific risks, and my questions have been answered to my satisfaction.</p>
`.trim(),
  },

  // ── 4. FINANCIAL CONSENT ──
  {
    type: 'financial',
    title: 'Financial Agreement &amp; Treatment Cost Acknowledgment',
    acknowledgments: [
      'I understand and accept the estimated costs for my planned treatment(s).',
      'I understand the cancellation and rescheduling policy.',
      'I understand that additional sessions or treatments may incur additional costs.',
      'I acknowledge that cosmetic procedures are generally not covered by health insurance.',
    ],
    body: `
<h2>Financial Agreement &amp; Treatment Cost Acknowledgment</h2>
<p><strong>Patient:</strong> {{patientName}}<br/>
<strong>Date:</strong> {{date}}<br/>
<strong>Planned Treatment(s):</strong> {{treatmentList}}</p>

<h3>Treatment Cost Estimate</h3>
<p>The estimated cost for the treatment plan outlined above is <strong>{{totalCost}}</strong>. This estimate includes the procedures listed and standard supplies. I understand that:</p>
<ul>
  <li>Final costs may vary based on the actual products and quantities used during treatment</li>
  <li>Additional sessions, touch-up treatments, or complementary procedures may be recommended and will incur additional charges</li>
  <li>The estimate provided does not include optional add-on services, skincare products, or follow-up treatments beyond the scope of the current plan</li>
</ul>

<h3>Payment Terms</h3>
<ul>
  <li>Payment is due at the time of service unless a financing arrangement has been established</li>
  <li>Rani Beauty Clinic accepts major credit cards, debit cards, and approved third-party financing (Cherry, CareCredit)</li>
  <li>Financing terms, including interest rates and repayment schedules, are governed by the financing provider's agreement and are separate from this consent</li>
</ul>

<h3>Package &amp; Membership Terms</h3>
<ul>
  <li>Treatment packages must be used within 12 months of purchase unless otherwise specified</li>
  <li>Packages are non-transferable and may not be shared between individuals</li>
  <li>Unused sessions in a package are non-refundable after 30 days from purchase, except as required by applicable law</li>
  <li>Membership benefits are active only while the membership is in good standing with current payments</li>
</ul>

<h3>Cancellation &amp; Rescheduling Policy</h3>
<ul>
  <li>Appointments must be cancelled or rescheduled at least <strong>24 hours in advance</strong></li>
  <li>Late cancellations (less than 24 hours) may be subject to a cancellation fee of up to 50% of the scheduled service cost</li>
  <li>No-shows may be charged the full cost of the scheduled service</li>
  <li>Rani Beauty Clinic reserves the right to require a deposit for future appointments following a no-show</li>
</ul>

<h3>Refund Policy</h3>
<ul>
  <li>Refunds for individual treatments are evaluated on a case-by-case basis</li>
  <li>Product returns are accepted within 14 days of purchase in unopened condition</li>
  <li>Refund requests should be directed to the front desk or clinic management</li>
</ul>

<h3>Insurance</h3>
<p>Cosmetic and elective aesthetic procedures are generally not covered by health insurance. Rani Beauty Clinic does not bill insurance for aesthetic services. It is the patient's responsibility to verify coverage for any wellness or medical services.</p>
`.trim(),
  },

  // ── 5. TELEHEALTH CONSENT ──
  {
    type: 'telehealth',
    title: 'Telehealth Consultation Consent',
    acknowledgments: [
      'I understand the limitations of virtual assessments compared to in-person evaluation.',
      'I consent to the use of electronic communication for this consultation.',
      'I understand that technical difficulties may interrupt or prevent the consultation.',
      'I understand that an in-person visit may be required before any treatment can proceed.',
    ],
    body: `
<h2>Telehealth Consultation Consent</h2>
<p><strong>Patient:</strong> {{patientName}}<br/>
<strong>Date:</strong> {{date}}<br/>
<strong>Provider:</strong> {{providerName}}</p>

<h3>Nature of Telehealth</h3>
<p>I, {{patientName}}, consent to participate in a telehealth (virtual) consultation with {{providerName}} at Rani Beauty Clinic. I understand that telehealth involves the delivery of healthcare services using electronic communications, including video conferencing, secure messaging, and digital image sharing.</p>

<h3>Limitations of Virtual Assessment</h3>
<p>I understand and acknowledge that:</p>
<ul>
  <li>A virtual consultation is not equivalent to an in-person examination and has inherent limitations</li>
  <li>The provider may not be able to fully assess my skin condition, facial anatomy, or treatment needs through video or photographs alone</li>
  <li>Lighting, camera quality, and screen calibration may affect the accuracy of visual assessment</li>
  <li>Certain diagnoses, treatment plans, or recommendations may require an in-person visit to confirm</li>
  <li>No treatment will be performed during a telehealth session; an in-person appointment will be scheduled for any approved procedures</li>
</ul>

<h3>Technology &amp; Privacy</h3>
<ul>
  <li>I understand that electronic communications carry a risk of interception or technical failure, despite reasonable security measures</li>
  <li>I will ensure I am in a private location during the consultation to protect my own confidentiality</li>
  <li>I consent to the electronic transmission of my personal health information for the purpose of this consultation</li>
  <li>Rani Beauty Clinic uses secure, encrypted platforms for telehealth sessions</li>
</ul>

<h3>Emergency Situations</h3>
<p>I understand that telehealth is not appropriate for medical emergencies. In the event of a medical emergency, I will call 911 or proceed to the nearest emergency department.</p>

<h3>Photographs &amp; Digital Images</h3>
<p>I may be asked to submit photographs of the treatment area before or during the consultation. These images become part of my clinical record and are subject to the same privacy protections as all medical records.</p>

<h3>Right to Discontinue</h3>
<p>I may withdraw consent and discontinue the telehealth consultation at any time without affecting my right to future care at Rani Beauty Clinic.</p>
`.trim(),
  },
];

// ── TEMPLATE HELPERS ──

/**
 * Resolve {{variable}} placeholders in a consent template body.
 */
export function renderConsentTemplate(
  template: ConsentTemplate,
  variables: {
    patientName: string;
    treatmentList?: string;
    totalCost?: string;
    providerName?: string;
    date?: string;
  }
): string {
  const now = new Date();
  const dateStr =
    variables.date ||
    now.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  let rendered = template.body;
  rendered = rendered.replace(/\{\{patientName\}\}/g, escapeHtml(variables.patientName || ''));
  rendered = rendered.replace(/\{\{treatmentList\}\}/g, escapeHtml(variables.treatmentList || 'As discussed'));
  rendered = rendered.replace(/\{\{totalCost\}\}/g, escapeHtml(variables.totalCost || 'As quoted'));
  rendered = rendered.replace(/\{\{providerName\}\}/g, escapeHtml(variables.providerName || 'Rani Beauty Clinic Provider'));
  rendered = rendered.replace(/\{\{date\}\}/g, escapeHtml(dateStr));

  return rendered;
}

/**
 * Find a consent template by type.
 */
export function getConsentTemplate(type: ConsentTemplate['type']): ConsentTemplate | undefined {
  return CONSENT_TEMPLATES.find((t) => t.type === type);
}
