// ─── Emergency Response Protocols ────────────────────────────────────────────
// Clinical emergency protocols for Rani Beauty Clinic
// CRITICAL: "injection" only — never "infusion"

// ─── Types ───────────────────────────────────────────────────────────────────

export interface EmergencyProtocol {
  id: string;
  name: string;
  severity: 'critical' | 'moderate' | 'mild';
  recognitionSigns: string[];
  immediateActions: string[];
  monitoringSteps: string[];
  whenToCall911: string[];
  inClinicManagement: string[];
  postEmergencyDocumentation: string[];
  followUpProtocol: string[];
  equipmentNeeded: string[];
}

export interface AllergyGrade {
  grade: number;
  severity: string;
  symptoms: string[];
  management: string[];
}

export interface PatientCommunicationTemplate {
  id: string;
  scenario: string;
  immediateScript: string;
  followUpCallScript: string;
  followUpEmailTemplate: string;
}

// ─── Emergency Equipment Checklist ───────────────────────────────────────────

export const EMERGENCY_EQUIPMENT_CHECKLIST = {
  required: [
    { item: 'Epinephrine auto-injector (EpiPen) 0.3 mg adult', quantity: 2, location: 'Emergency kit (every treatment room)', expirationCheck: 'Monthly' },
    { item: 'Epinephrine 1:1000 (1 mg/mL) ampules', quantity: 4, location: 'Emergency kit', expirationCheck: 'Monthly' },
    { item: 'Diphenhydramine (Benadryl) 50 mg/mL injectable', quantity: 4, location: 'Emergency kit', expirationCheck: 'Monthly' },
    { item: 'Diphenhydramine (Benadryl) 25 mg oral tablets', quantity: 10, location: 'Emergency kit', expirationCheck: 'Quarterly' },
    { item: 'Hydrocortisone 100 mg injectable', quantity: 2, location: 'Emergency kit', expirationCheck: 'Monthly' },
    { item: 'Albuterol inhaler', quantity: 1, location: 'Emergency kit', expirationCheck: 'Monthly' },
    { item: 'Nitroglycerin 0.4 mg sublingual tablets', quantity: 1, location: 'Emergency kit', expirationCheck: 'Monthly' },
    { item: 'Aspirin 325 mg (chewable)', quantity: 10, location: 'Emergency kit', expirationCheck: 'Quarterly' },
    { item: 'Blood pressure cuff (manual and automatic)', quantity: 1, location: 'Every treatment room', expirationCheck: 'Annual calibration' },
    { item: 'Pulse oximeter', quantity: 2, location: 'Emergency kit and front desk', expirationCheck: 'Annual' },
    { item: 'Stethoscope', quantity: 2, location: 'Treatment rooms', expirationCheck: 'Annual' },
    { item: 'AED (Automated External Defibrillator)', quantity: 1, location: 'Main hallway, visible and accessible', expirationCheck: 'Monthly check, pad replacement per manufacturer' },
    { item: 'Oxygen tank with nasal cannula and mask', quantity: 1, location: 'Emergency cart', expirationCheck: 'Monthly pressure check' },
    { item: 'Glucose gel or tablets', quantity: 1, location: 'Emergency kit', expirationCheck: 'Quarterly' },
    { item: 'Ice packs (instant cold packs)', quantity: 10, location: 'Every treatment room', expirationCheck: 'N/A' },
    { item: 'Sterile gauze and bandages', quantity: 20, location: 'Emergency kit', expirationCheck: 'Quarterly' },
    { item: 'Sharps container', quantity: 1, location: 'Every treatment room', expirationCheck: 'Replace when 2/3 full' },
    { item: 'Syringes (1 mL, 3 mL, 5 mL) and needles (18G, 21G, 25G)', quantity: 10, location: 'Emergency kit', expirationCheck: 'Quarterly' },
    { item: 'Tourniquet', quantity: 2, location: 'Emergency kit', expirationCheck: 'Annual' },
  ],
  inspectionSchedule: {
    daily: ['AED status light check', 'Emergency kit sealed and accessible'],
    monthly: ['Full inventory check of all emergency medications', 'Expiration date verification', 'Oxygen tank pressure check', 'AED pad and battery check'],
    quarterly: ['Restock non-medication supplies', 'Staff emergency drill', 'Update emergency contact numbers'],
    annually: ['AED service and battery replacement', 'Equipment calibration', 'Emergency protocol review and staff retraining'],
  },
};

// ═══════════════════════════════════════════════════════════════════════════════
// ANAPHYLAXIS PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const ANAPHYLAXIS_PROTOCOL: EmergencyProtocol = {
  id: 'emergency-anaphylaxis',
  name: 'Anaphylaxis Emergency Protocol',
  severity: 'critical',
  recognitionSigns: [
    'Rapid onset (seconds to minutes) of skin symptoms: hives, flushing, itching, swelling',
    'Respiratory compromise: wheezing, stridor, shortness of breath, throat tightness, difficulty swallowing',
    'Cardiovascular symptoms: hypotension, dizziness, syncope, tachycardia, weak pulse',
    'GI symptoms: nausea, vomiting, abdominal cramping, diarrhea',
    'Sense of impending doom or severe anxiety',
    'Swelling of lips, tongue, or throat (angioedema)',
    'Two or more body systems involved simultaneously',
  ],
  immediateActions: [
    '1. STOP the treatment or injection immediately',
    '2. Call 911 immediately (do not wait to see if it improves)',
    '3. Administer epinephrine 0.3 mg IM in mid-outer thigh (through clothing if needed)',
    '4. Position patient: Flat on back with legs elevated (unless vomiting or dyspneic, then seated upright)',
    '5. Administer diphenhydramine 50 mg IM',
    '6. Apply supplemental oxygen via nasal cannula or mask if available',
    '7. Monitor vital signs continuously (BP, HR, O2 sat, respiratory rate)',
    '8. Prepare for repeat epinephrine in 5-15 minutes if symptoms do not improve',
    '9. If cardiac arrest: begin CPR and apply AED immediately',
    '10. Do NOT leave the patient unattended',
  ],
  monitoringSteps: [
    'Vital signs every 2 minutes until EMS arrives',
    'Continuous pulse oximetry',
    'Assess airway patency continuously',
    'Document time of each intervention',
    'Note response to epinephrine',
    'Monitor for biphasic reaction (can recur 4-12 hours later; advise ER staff)',
  ],
  whenToCall911: [
    'ALWAYS call 911 for suspected anaphylaxis (do not delay)',
    'Call immediately upon recognizing signs involving two or more body systems',
    'Call if any respiratory symptoms are present',
    'Call if blood pressure drops below 90/60',
    'Call if patient loses consciousness',
  ],
  inClinicManagement: [
    'Anaphylaxis always requires 911 and ER transport',
    'Provide all interventions listed above while waiting for EMS',
    'Have a second staff member meet EMS at the door and direct them to patient',
    'Provide EMS with: what was administered, time of onset, interventions given, patient medical history',
    'A staff member should accompany patient if possible, or call the receiving ER with information',
  ],
  postEmergencyDocumentation: [
    'Time symptoms began',
    'Treatment or product that triggered the reaction',
    'Product lot number, manufacturer, and expiration date',
    'Time and dose of all medications administered',
    'Vital signs throughout the event',
    'Response to treatment at each interval',
    'Time 911 was called and EMS arrival time',
    'Names of all staff involved',
    'Patient outcome at time of transfer to EMS',
    'Hospital where patient was transported',
    'Complete incident report within 24 hours',
    'Notify medical director immediately',
    'Report to adverse event reporting system if applicable (VAERS, FDA MedWatch)',
  ],
  followUpProtocol: [
    'Contact patient or patient\'s emergency contact within 6 hours',
    'Phone call from provider within 24 hours to check on status',
    'Document the triggering agent permanently in the patient record as an ALLERGY',
    'Schedule follow-up appointment within 1 week of discharge',
    'Refer to allergist for comprehensive allergy testing',
    'Prescribe EpiPen for patient to carry at all times',
    'Create personalized anaphylaxis action plan for patient',
    'Internal team debrief within 48 hours',
    'Review and update emergency protocols if gaps identified',
  ],
  equipmentNeeded: [
    'Epinephrine 0.3 mg auto-injector or 1:1000 ampule',
    'Diphenhydramine 50 mg injectable',
    'Oxygen with mask/cannula',
    'AED',
    'Blood pressure cuff',
    'Pulse oximeter',
    'Stethoscope',
    'Phone (911 on speed dial)',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// ALLERGIC REACTION GRADING SYSTEM
// ═══════════════════════════════════════════════════════════════════════════════

export const ALLERGIC_REACTION_GRADES: AllergyGrade[] = [
  {
    grade: 1,
    severity: 'Mild (localized)',
    symptoms: [
      'Localized erythema (redness) at injection or treatment site',
      'Localized itching',
      'Mild swelling confined to treatment area',
      'Mild hives (< 10 wheals) near treatment site',
    ],
    management: [
      'Stop treatment if still in progress',
      'Apply ice to affected area',
      'Administer oral diphenhydramine 25-50 mg',
      'Monitor for 30 minutes for progression',
      'If no progression, patient may be discharged with instructions to take antihistamines for 48 hours',
      'Follow up by phone in 24 hours',
      'Document in patient record',
    ],
  },
  {
    grade: 2,
    severity: 'Moderate (generalized, no respiratory compromise)',
    symptoms: [
      'Generalized hives (widespread, beyond treatment area)',
      'Diffuse flushing',
      'Generalized itching',
      'Mild facial swelling (not involving airway)',
      'Nausea without vomiting',
      'Abdominal discomfort',
      'Mild tachycardia (HR 100-120)',
    ],
    management: [
      'Stop treatment immediately',
      'Administer diphenhydramine 50 mg IM',
      'Consider epinephrine 0.3 mg IM if symptoms are progressing rapidly',
      'Monitor vital signs every 5 minutes',
      'Position patient comfortably (seated or supine)',
      'Apply ice packs as needed',
      'Observe in clinic for minimum 60 minutes',
      'If symptoms resolve: discharge with oral antihistamines, steroid taper consideration, and 24-hour follow-up',
      'If symptoms progress to Grade 3: activate anaphylaxis protocol',
      'Consider calling 911 even at this grade if any concern for progression',
    ],
  },
  {
    grade: 3,
    severity: 'Severe (anaphylaxis)',
    symptoms: [
      'Any respiratory compromise (wheezing, stridor, dyspnea)',
      'Tongue or throat swelling',
      'Difficulty speaking or swallowing',
      'Hypotension (systolic < 90 mmHg)',
      'Altered mental status (confusion, loss of consciousness)',
      'Severe vomiting or diarrhea with other systemic symptoms',
      'Two or more body systems involved',
    ],
    management: [
      'ACTIVATE FULL ANAPHYLAXIS PROTOCOL (see above)',
      'Epinephrine 0.3 mg IM IMMEDIATELY',
      'Call 911 IMMEDIATELY',
      'All interventions per anaphylaxis protocol',
      'This is a life-threatening emergency',
    ],
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// INJECTION SITE REACTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const INJECTION_SITE_REACTION_PROTOCOL: EmergencyProtocol = {
  id: 'emergency-injection-site',
  name: 'Injection Site Reaction Management Protocol',
  severity: 'mild',
  recognitionSigns: [
    'Localized redness at injection site (beyond expected)',
    'Swelling or induration at injection site',
    'Pain or tenderness beyond normal post-injection soreness',
    'Warmth at injection site',
    'Small hematoma or bruising',
    'Hard lump or nodule at injection site',
    'Possible signs of infection: increasing redness, warmth, streaking, pus, fever',
  ],
  immediateActions: [
    '1. Assess the severity (measure area of redness and swelling)',
    '2. Apply ice pack for 10-15 minutes (wrapped in cloth, not directly on skin)',
    '3. Elevate the affected area if applicable',
    '4. Take photos for documentation',
    '5. If signs of infection: temperature check, mark borders of redness with pen',
    '6. For mild reaction: reassure patient, apply cold compress, monitor',
    '7. For moderate reaction: consider oral antihistamine and topical hydrocortisone',
    '8. For suspected infection: do not apply heat; refer for evaluation',
  ],
  monitoringSteps: [
    'Measure and document the size of redness/swelling',
    'Mark the borders of redness with a pen to track progression',
    'Check temperature',
    'Reassess in 15-30 minutes before discharge',
    'Phone follow-up in 24 hours',
    'In-person follow-up if not resolving in 48-72 hours',
  ],
  whenToCall911: [
    'Signs of anaphylaxis (hives, swelling, breathing difficulty)',
    'Signs of vascular emergency (severe pain, color change of extremity, loss of pulse)',
  ],
  inClinicManagement: [
    'Mild (redness < 5 cm, no systemic symptoms): ice, antihistamine, observation 30 min, discharge with monitoring instructions',
    'Moderate (redness 5-10 cm, mild swelling, no infection signs): ice, oral/IM antihistamine, topical steroid, observation 60 min',
    'Signs of infection (spreading redness, warmth, pus, fever): culture if possible, refer for antibiotic evaluation same day',
    'Suspected abscess (fluctuant mass): refer to urgent care or ER for drainage',
    'Vascular compromise (blanching, severe pain, necrosis): refer to ER immediately',
  ],
  postEmergencyDocumentation: [
    'Product administered (name, concentration, lot number, expiration)',
    'Injection site location and technique used',
    'Onset time of reaction',
    'Description and measurements of reaction',
    'Photos with patient consent',
    'Interventions and response',
    'Patient education and discharge instructions provided',
    'Follow-up plan documented',
  ],
  followUpProtocol: [
    'Phone call within 24 hours',
    'In-person follow-up at 72 hours if not fully resolved',
    'Document resolution or progression',
    'Adjust future injection technique, site, or product if needed',
    'Add note to patient file for future treatments',
  ],
  equipmentNeeded: [
    'Ice packs',
    'Ruler or measuring tape',
    'Camera (with consent)',
    'Skin marking pen',
    'Oral antihistamine',
    'Topical hydrocortisone 1%',
    'Sterile gauze',
    'Thermometer',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// VASOVAGAL RESPONSE PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const VASOVAGAL_PROTOCOL: EmergencyProtocol = {
  id: 'emergency-vasovagal',
  name: 'Vasovagal Response Protocol',
  severity: 'moderate',
  recognitionSigns: [
    'Feeling lightheaded, dizzy, or "woozy"',
    'Pale or gray skin color',
    'Nausea',
    'Sweating (diaphoresis), especially forehead and palms',
    'Tunnel vision or blurred vision',
    'Ringing in ears (tinnitus)',
    'Feeling warm or flushed followed by feeling cold',
    'Slow heart rate (bradycardia)',
    'Brief loss of consciousness (fainting/syncope)',
    'Brief convulsive movements (may occur during syncope but are NOT a seizure)',
  ],
  immediateActions: [
    '1. STOP the treatment or procedure immediately',
    '2. If patient is seated: recline the chair or move patient to supine position',
    '3. Elevate legs above heart level (Trendelenburg position)',
    '4. Loosen any tight clothing',
    '5. Apply cool, damp cloth to forehead and back of neck',
    '6. Ensure airway is clear (turn head to side if vomiting)',
    '7. Speak calmly and reassuringly',
    '8. Monitor pulse and blood pressure',
    '9. If patient loses consciousness: time the episode (most resolve in < 60 seconds)',
    '10. Do NOT splash water on face or slap patient',
  ],
  monitoringSteps: [
    'Continuous observation until fully recovered',
    'Blood pressure and heart rate every 5 minutes for first 30 minutes',
    'Assess alertness and orientation',
    'Monitor for repeat episodes',
    'Offer small sips of water or juice when fully alert',
    'Observe for minimum 20-30 minutes after full recovery before discharge',
  ],
  whenToCall911: [
    'Loss of consciousness lasting > 60 seconds',
    'Seizure activity lasting > 30 seconds',
    'Patient does not regain full orientation within 5 minutes',
    'Persistent bradycardia (HR < 40) or tachycardia (HR > 150)',
    'Blood pressure does not normalize within 15 minutes',
    'Patient hit head during fall and shows signs of concussion',
    'History of cardiac disease with syncope',
    'Suspicion that syncope is NOT vasovagal (cardiac syncope)',
  ],
  inClinicManagement: [
    'Most vasovagal episodes resolve within 30-60 seconds and are benign',
    'Keep patient supine with legs elevated until color and vitals normalize',
    'Offer juice or crackers once fully alert (blood sugar support)',
    'Do not allow patient to sit up too quickly (risk of recurrence)',
    'If occurred during injection: do not resume treatment today',
    'Discuss prevention strategies for future visits (eat before appointment, hydrate, recline during procedures)',
    'For known vasovagal patients: pre-treat with applied cold packs, reclined position, and distraction techniques',
  ],
  postEmergencyDocumentation: [
    'Precipitating event (what triggered the episode)',
    'Time of onset and duration of syncope if occurred',
    'Symptoms reported by patient',
    'Vital signs throughout the event',
    'Interventions provided',
    'Recovery time and patient condition at discharge',
    'Any injuries sustained (from falling)',
    'Flag patient chart for vasovagal history',
    'Prevention plan for future visits',
  ],
  followUpProtocol: [
    'Phone call within 24 hours',
    'For first-time vasovagal event: recommend primary care follow-up to rule out cardiac causes',
    'Note in chart for future visits: prone to vasovagal, pre-treatment positioning',
    'At next visit: recline patient, offer water, apply cold packs, and have smelling salts available',
  ],
  equipmentNeeded: [
    'Treatment chair that reclines fully',
    'Cold damp cloths',
    'Blood pressure cuff',
    'Pulse oximeter',
    'Juice and crackers',
    'Ammonia inhalant (smelling salts) - use only if patient is unconscious and airway is protected',
    'Pillow or leg elevation support',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// SEVERE GLP-1 REACTION PROTOCOL
// ═══════════════════════════════════════════════════════════════════════════════

export const SEVERE_GLP1_REACTION_PROTOCOL: EmergencyProtocol = {
  id: 'emergency-glp1-severe',
  name: 'Severe GLP-1 Reaction Emergency Protocol',
  severity: 'critical',
  recognitionSigns: [
    'Severe, persistent epigastric pain radiating to the back (pancreatitis)',
    'Persistent vomiting (> 6 hours, unable to keep fluids down)',
    'Severe abdominal distension',
    'Fever with abdominal symptoms',
    'Signs of dehydration (dry mucous membranes, tachycardia, hypotension, dark urine)',
    'Right upper quadrant pain (gallbladder)',
    'Jaundice (yellowing of skin or eyes)',
    'Severe hypoglycemia symptoms (confusion, shakiness, loss of consciousness)',
    'Severe allergic reaction (hives, swelling, breathing difficulty)',
    'Suicidal ideation or severe mental health crisis',
    'Thyroid mass or neck swelling (rare, but requires evaluation per MTC warning)',
  ],
  immediateActions: [
    '1. Assess vital signs immediately',
    '2. HOLD GLP-1 medication (do not administer next dose)',
    '3. For suspected pancreatitis: NPO, assess for ER referral',
    '4. For severe vomiting/dehydration: attempt small sips of electrolyte solution; if unable to tolerate, ER referral for IV hydration',
    '5. For hypoglycemia: check blood glucose, administer 15-20g fast-acting carbs if conscious',
    '6. For allergic reaction: follow anaphylaxis protocol',
    '7. For suicidal ideation: do not leave patient alone, contact 988 Suicide Prevention Lifeline or 911',
    '8. Document all symptoms and interventions',
  ],
  monitoringSteps: [
    'Vital signs every 5-15 minutes based on severity',
    'Blood glucose monitoring if hypoglycemia suspected',
    'Pain assessment and tracking',
    'Hydration status (urine output, skin turgor, mucous membranes)',
    'Mental status assessment if altered consciousness',
  ],
  whenToCall911: [
    'Signs of acute pancreatitis (severe epigastric pain, vomiting, fever)',
    'Unable to maintain hydration (persistent vomiting, signs of severe dehydration)',
    'Blood glucose < 54 mg/dL with altered consciousness',
    'Anaphylaxis or severe allergic reaction',
    'Loss of consciousness',
    'Active suicidal ideation with plan or intent',
    'Signs of acute abdomen (rigid, distended abdomen with severe pain)',
    'Severe chest pain',
  ],
  inClinicManagement: [
    'Mild GI distress (nausea, mild vomiting): ondansetron 4 mg, observation, hydration, dose adjustment discussion',
    'Moderate GI distress (persistent nausea, unable to eat): hold medication, antiemetics, follow-up in 48 hours',
    'Severe (per recognition signs above): ER referral, hold medication, provider notification immediately',
    'Hypoglycemia management: glucose, monitoring, medication review (check concurrent diabetes meds)',
    'Mental health concern: immediate safety assessment, warm handoff to crisis resources',
  ],
  postEmergencyDocumentation: [
    'GLP-1 medication, dose, last injection date, lot number',
    'Symptom onset, duration, and severity',
    'Vital signs and any point-of-care tests',
    'Interventions provided',
    'ER referral details if applicable',
    'Provider notification and response',
    'Medication hold order documented',
    'Follow-up plan and timeline',
    'Adverse event report if applicable',
  ],
  followUpProtocol: [
    'Phone call within 6 hours of acute event',
    'Provider review within 24 hours',
    'If ER visit: obtain ER records and integrate into chart',
    'Do not resume GLP-1 medication until provider authorization',
    'If pancreatitis confirmed: permanently discontinue GLP-1 therapy',
    'If gallbladder event: surgical consult, potential resumption after recovery',
    'If dose-related GI: restart at lower dose after full symptom resolution',
    'Updated treatment plan documented',
  ],
  equipmentNeeded: [
    'Blood pressure cuff',
    'Pulse oximeter',
    'Glucometer and test strips',
    'Thermometer',
    'Ondansetron (Zofran) 4 mg oral or sublingual',
    'Glucose gel or tablets',
    'IV start kit (if IV-capable)',
    'Phone (911 and provider on speed dial)',
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// PATIENT COMMUNICATION TEMPLATES (EMERGENCY)
// ═══════════════════════════════════════════════════════════════════════════════

export const EMERGENCY_COMMUNICATION_TEMPLATES: PatientCommunicationTemplate[] = [
  {
    id: 'comm-post-allergic',
    scenario: 'Post-Allergic Reaction (Grade 1-2)',
    immediateScript: 'I want you to know that your safety is our absolute top priority. What you experienced today is a known, though uncommon, reaction. We responded immediately per our medical protocols, and you are doing well now. We have documented everything and added this to your medical record so we can adjust your treatment plan going forward. I am going to call you tomorrow to check on you personally.',
    followUpCallScript: 'Hi {{clientName}}, this is [provider name] from Rani Beauty Clinic. I am calling to check on you after your appointment yesterday. How are you feeling today? [Assess symptoms, ask about any delayed reactions, redness, itching, swelling]. I want to make sure you are fully recovered. [If symptoms persist or worsened: recommend follow-up visit or ER evaluation]. Your safety matters deeply to us, and we have updated your chart to ensure the best experience for any future treatments.',
    followUpEmailTemplate: 'Subject: Checking In After Your Visit\n\nDear {{clientName}},\n\nThank you for your patience and trust during your visit yesterday. Your comfort and safety are central to everything we do at Rani Beauty Clinic.\n\nAs discussed, we have documented the reaction in your medical record and updated your treatment profile accordingly. This helps us personalize your future care and ensure the best possible experience.\n\nPlease do not hesitate to reach out if you have any questions, concerns, or notice any new symptoms. You can call us directly at (425) 295-2819 or reply to this email.\n\nWe look forward to seeing you again and continuing your wellness journey with the highest level of care.\n\nWith care,\nRani Beauty Clinic Team',
  },
  {
    id: 'comm-post-anaphylaxis',
    scenario: 'Post-Anaphylaxis (ER Transport)',
    immediateScript: '[At the clinic, before EMS transport]: We are getting you the best care right now. Emergency medical services are on their way. You are safe. We are staying right here with you. We have given you medication to help, and we will make sure the hospital team has all the information they need.',
    followUpCallScript: 'Hi {{clientName}}, this is [medical director name] from Rani Beauty Clinic. I am calling to check on you and see how you are doing since your visit to the emergency room. First, I want you to know that we take this incredibly seriously, and we are grateful you are safe. [Listen and validate]. We have identified the triggering agent and have permanently flagged it in your medical record. We also want to make sure you have an EpiPen prescription and an allergist referral. When you are feeling up to it, we would like to schedule a follow-up appointment at the clinic, at no charge, to review everything and discuss a safe path forward for your care.',
    followUpEmailTemplate: 'Subject: Following Up After Your Emergency Visit\n\nDear {{clientName}},\n\nI am writing to you personally following the emergency response during your recent visit. Your health and safety are the most important things to us, and I want to express our genuine concern and commitment to your well-being.\n\nWe have completed a thorough review of the incident and have taken the following steps:\n\n1. The triggering agent has been permanently flagged in your medical record\n2. Our team has completed an internal review of the event\n3. We are coordinating with your emergency care team to ensure continuity of care\n\nI would like to schedule a complimentary follow-up appointment at your convenience to:\n- Review the incident and answer any questions\n- Discuss safe treatment alternatives going forward\n- Ensure you have appropriate prescriptions (EpiPen) and referrals (allergist)\n\nPlease call us at (425) 295-2819 to schedule, or reply to this email with times that work for you.\n\nYour trust means everything to us.\n\nSincerely,\n[Medical Director Name]\nRani Beauty Clinic',
  },
  {
    id: 'comm-post-vasovagal',
    scenario: 'Post-Vasovagal Episode',
    immediateScript: 'You are okay. What happened is called a vasovagal response, and it is actually quite common with injections and medical procedures. It is your body\'s overreaction to stress or pain, not a sign of anything dangerous. You fainted briefly but you are recovering well. We are going to keep you resting here until you feel completely back to normal. There is absolutely no rush.',
    followUpCallScript: 'Hi {{clientName}}, this is [staff name] from Rani Beauty Clinic checking in after your appointment. I wanted to make sure you are feeling completely back to normal. [Ask about dizziness, fatigue, any falls later]. For your next visit, we have a plan to make things more comfortable: we will have you recline during the procedure, keep you extra hydrated, and take everything at a slower pace. Some patients find that eating a good meal beforehand and applying a cold pack to the forehead during the procedure makes a big difference.',
    followUpEmailTemplate: 'Subject: Following Up on Your Visit\n\nDear {{clientName}},\n\nThank you for your visit today. We wanted to check in and make sure you are feeling well this evening.\n\nThe vasovagal response you experienced is a common physiological reaction, and we want you to know it does not affect your treatment results or your overall health.\n\nFor your future appointments, we have noted some helpful adjustments in your chart:\n- Reclining position during treatment\n- Additional hydration before and during\n- Cold compress application\n- Extended observation time\n\nWe recommend eating a good meal and drinking plenty of water before your next visit. Please let us know if you have any questions or concerns.\n\nWarm regards,\nRani Beauty Clinic Team',
  },
  {
    id: 'comm-post-glp1-emergency',
    scenario: 'Post-Severe GLP-1 Reaction',
    immediateScript: 'I understand you are not feeling well, and I want to take this seriously. Based on your symptoms, we are going to [hold your medication / refer you for further evaluation]. Your health is more important than any protocol timeline, and we will work together to find the right approach for you.',
    followUpCallScript: 'Hi {{clientName}}, this is [provider name] from Rani Beauty Clinic. I am calling to check on you after the symptoms you experienced. [Assess current symptoms, ER visit outcome if applicable, any ongoing issues]. Based on what happened, we are holding your GLP-1 medication until we can review your labs and have a detailed conversation about next steps. This might mean adjusting your dose, switching medications, or modifying your treatment plan. Whatever we decide, it will be based on what is safest and most effective for you. Can we schedule a time to come in and review everything together?',
    followUpEmailTemplate: 'Subject: Your Treatment Plan Update\n\nDear {{clientName}},\n\nI am following up regarding the symptoms you recently experienced. Your health and comfort are our priority, and I want to update you on our plan.\n\nNext steps:\n1. Your GLP-1 medication is currently on hold pending review\n2. We have ordered updated lab work [details if applicable]\n3. We have scheduled a follow-up appointment to review results and discuss your options\n\nPlease do not take your next scheduled dose until we have spoken. If you experience any additional symptoms, please call us immediately at (425) 295-2819.\n\nWe are committed to finding the right approach that works for your body and your goals.\n\nWith care,\n[Provider Name]\nRani Beauty Clinic',
  },
];

// ─── Export All Emergency Protocols ──────────────────────────────────────────

export const EMERGENCY_PROTOCOLS: EmergencyProtocol[] = [
  ANAPHYLAXIS_PROTOCOL,
  INJECTION_SITE_REACTION_PROTOCOL,
  VASOVAGAL_PROTOCOL,
  SEVERE_GLP1_REACTION_PROTOCOL,
];
