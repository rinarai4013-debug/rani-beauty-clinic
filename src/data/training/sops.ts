// Standard Operating Procedures - Rani Beauty Clinic
// 15 SOPs covering daily operations, clinical protocols, and emergency procedures

export interface SOPStep {
  step: number;
  description: string;
  notes?: string;
}

export interface SOP {
  id: string;
  title: string;
  category: 'daily-ops' | 'clinical' | 'financial' | 'emergency' | 'client-management';
  steps: SOPStep[];
  lastUpdated: string;
}

export const SOPS: SOP[] = [
  // ── Daily Operations ──────────────────────────────────────
  {
    id: 'sop-001',
    title: 'Clinic Opening Procedure',
    category: 'daily-ops',
    lastUpdated: '2026-03-01',
    steps: [
      { step: 1, description: 'Arrive 30 minutes before first appointment. Disarm security system and turn on all lights.', notes: 'Security code is stored in the manager safe. Never share the code via text or email.' },
      { step: 2, description: 'Walk through the entire clinic checking for overnight issues - leaks, temperature anomalies, equipment left on, supplies out of place.' },
      { step: 3, description: 'Power on all treatment devices and allow calibration/warm-up time (Sofwave requires 10 minutes, lasers require 5 minutes).', notes: 'Document any device error codes in the equipment log immediately.' },
      { step: 4, description: 'Boot up front desk computers, open Mangomint, and review the day\'s schedule. Print the daily appointment sheet for the provider clipboard.' },
      { step: 5, description: 'Check the Rani Dashboard for overnight alerts, AI phone agent callback requests, and any flagged items in the Attention Panel.' },
      { step: 6, description: 'Verify treatment rooms are stocked: gloves, gauze, alcohol swabs, topical numbing cream, aftercare kits, consent forms, photo documentation setup.' },
      { step: 7, description: 'Check refrigerated product storage - verify temperature log is within range (2-8°C). Document the reading.' },
      { step: 8, description: 'Set the reception area ambiance: adjust lighting to warm setting, start background music playlist, verify the diffuser is running with signature scent, arrange fresh flowers if delivery day.' },
      { step: 9, description: 'Review any pre-treatment instructions that need to be sent for same-day appointments. Send manual reminders if automated ones have not triggered.' },
      { step: 10, description: 'Confirm Square POS terminal is online and processing. Run a test transaction if there were issues the previous day.' },
    ],
  },
  {
    id: 'sop-002',
    title: 'Clinic Closing Procedure',
    category: 'daily-ops',
    lastUpdated: '2026-03-01',
    steps: [
      { step: 1, description: 'Verify all clients have departed and all treatments are completed. Check treatment rooms for personal belongings left behind.' },
      { step: 2, description: 'Complete end-of-day financial reconciliation: compare Square POS daily total with Mangomint appointment revenue. Flag any discrepancies for morning review.', notes: 'Discrepancies over $50 must be reported to the manager before leaving.' },
      { step: 3, description: 'Run the End-of-Day Recap in the dashboard (Dashboard > Entry > EOD Recap). Document total clients seen, revenue collected, notable events, and any issues.' },
      { step: 4, description: 'Sanitize all treatment rooms: wipe down treatment beds, chairs, and equipment with hospital-grade disinfectant. Replace table paper. Restock supplies for tomorrow.' },
      { step: 5, description: 'Dispose of biohazard waste properly. Seal any full sharps containers. Ensure biohazard bags are tied and placed in the designated medical waste bin.' },
      { step: 6, description: 'Power down treatment devices following manufacturer shutdown procedures. Do NOT simply unplug devices.', notes: 'Sofwave requires a software shutdown sequence before powering off.' },
      { step: 7, description: 'Check tomorrow\'s schedule for any special preparation needs: room setups, supply orders, new client intake form completions.' },
      { step: 8, description: 'Lock all cabinets containing controlled substances, prescription products, and sensitive materials.' },
      { step: 9, description: 'Set HVAC to overnight mode (68°F), turn off all non-essential lights, arm the security system.' },
      { step: 10, description: 'Lock all entry points. Verify the front door auto-lock engages. Check the back exit is secured.' },
    ],
  },

  // ── Client Management ─────────────────────────────────────
  {
    id: 'sop-003',
    title: 'No-Show Management',
    category: 'client-management',
    lastUpdated: '2026-02-15',
    steps: [
      { step: 1, description: 'If a client has not arrived within 10 minutes of their scheduled time, call their primary phone number.', notes: 'Use the Mangomint client profile for the number - do not use personal records.' },
      { step: 2, description: 'If no answer on call, send a text: "Hi [Name], we noticed you haven\'t arrived for your [time] appointment at Rani. We\'re holding your spot - are you on your way?"' },
      { step: 3, description: 'Wait an additional 5 minutes (15 minutes total past appointment time). If no response, mark the appointment as "No-Show" in Mangomint.' },
      { step: 4, description: 'Check the client\'s no-show history in their profile. Apply the appropriate policy: 1st no-show = courtesy call + reschedule offer. 2nd no-show = deposit required for future bookings. 3rd+ no-show = prepayment required.' },
      { step: 5, description: 'If the client had a deposit on file, process the deposit forfeiture per the financial policy they signed.' },
      { step: 6, description: 'Check the waitlist in Mangomint for clients who could fill the now-open slot. Contact top matches by text within 15 minutes of marking the no-show.' },
      { step: 7, description: 'Send the no-show follow-up message within 2 hours: "Hi [Name], we missed you today at Rani. We hope everything is okay! We\'d love to reschedule your [treatment]. Reply to this message or call us at [number] to find a new time."' },
      { step: 8, description: 'Log the no-show in Airtable via Dashboard > Entry > Staff Note, including the date, attempted contact methods, and client response (if any).' },
    ],
  },
  {
    id: 'sop-004',
    title: 'New Patient Intake Process',
    category: 'client-management',
    lastUpdated: '2026-03-01',
    steps: [
      { step: 1, description: 'Upon booking confirmation, send the Typeform intake link (ID: Ecgz85JA) to the new client via Mangomint automated message.' },
      { step: 2, description: 'Monitor Airtable Client Intakes table for submission. The n8n automation should process the intake within 5 minutes, populating the "Intake Summary (AI)" field.' },
      { step: 3, description: 'If the intake is not completed 24 hours before the appointment, send a manual reminder: "Hi [Name], just a quick reminder to complete your intake form before your appointment tomorrow. Here\'s the link: [link]. It takes about 5 minutes."' },
      { step: 4, description: 'On arrival: verify government-issued photo ID (first visit only). Scan or photograph the ID for the secure client file.' },
      { step: 5, description: 'Confirm all required consents are signed: general consent, treatment-specific consent, HIPAA Notice of Privacy Practices, financial policy acknowledgment, photography consent.' },
      { step: 6, description: 'Create or verify the Mangomint client profile with complete information: name, DOB, phone, email, referral source, service interest tags.' },
      { step: 7, description: 'Brief the provider before the consultation: share the AI intake summary, highlight any medical history flags (allergies, medications, contraindications), and note the client\'s stated goals.' },
      { step: 8, description: 'Add 10 minutes of buffer time for the new client experience: welcome, paperwork review, optional clinic tour, provider introduction.' },
      { step: 9, description: 'After the first visit, verify the automated welcome sequence triggers: same-day thank you email, next-day follow-up, 7-day check-in.' },
      { step: 10, description: 'Tag the client record in Mangomint with "New Client" and applicable interest tags. Note the referral source for marketing attribution.' },
    ],
  },

  // ── Financial ─────────────────────────────────────────────
  {
    id: 'sop-005',
    title: 'Membership Signup Process',
    category: 'financial',
    lastUpdated: '2026-02-20',
    steps: [
      { step: 1, description: 'Present membership benefits using the standard pitch: savings calculation based on the client\'s typical treatments, member-exclusive perks, and priority booking access.' },
      { step: 2, description: 'Review membership terms with the client: monthly recurring charge, minimum commitment period (if any), cancellation policy, what\'s included vs. add-on pricing.' },
      { step: 3, description: 'Have the client sign the membership agreement form (paper or digital). Ensure they receive a copy.' },
      { step: 4, description: 'Set up the recurring payment in Square. Enter the credit card on file with the client\'s authorization. Process the first month\'s payment.' },
      { step: 5, description: 'Create the membership record in Mangomint: select the correct membership tier, set the start date, and link to the client profile.' },
      { step: 6, description: 'Update the Airtable Memberships table via Dashboard > Entry > Sale (select "Membership Enrollment" as the sale type).' },
      { step: 7, description: 'Send the membership welcome email via Mangomint with tier details, benefits summary, and booking instructions for member-exclusive services.' },
      { step: 8, description: 'Schedule the client\'s first member appointment if they want to book immediately.' },
    ],
  },
  {
    id: 'sop-006',
    title: 'Package Sale Process',
    category: 'financial',
    lastUpdated: '2026-02-20',
    steps: [
      { step: 1, description: 'When a provider recommends a treatment series, present the package pricing at checkout. Show the individual session price vs. package price, highlighting dollar savings.' },
      { step: 2, description: 'For packages over $1,000, proactively present financing options (CareCredit, Cherry): "Many clients prefer to spread the investment over monthly payments."' },
      { step: 3, description: 'Process the package payment through Square. For full prepayment, apply the package discount. For financed packages, initiate the financing application on the client\'s device.' },
      { step: 4, description: 'Create the package record in Mangomint with the correct number of sessions, service type, expiration date (packages expire 12 months from purchase unless otherwise noted).' },
      { step: 5, description: 'Log the package sale in Airtable via Dashboard > Entry > Sale, noting the package type, total value, payment method, and sessions included.' },
      { step: 6, description: 'Schedule the first session in the package series (or confirm the just-completed session counts as session 1).' },
      { step: 7, description: 'Provide the client with a package confirmation showing: treatment name, number of sessions, sessions used, sessions remaining, expiration date, and recommended spacing between sessions.' },
    ],
  },
  {
    id: 'sop-007',
    title: 'Refund Processing',
    category: 'financial',
    lastUpdated: '2026-02-15',
    steps: [
      { step: 1, description: 'Listen to the client\'s refund request fully. Document the reason for the request before responding.', notes: 'Never approve a refund on the spot for amounts over $250 - escalate to the manager.' },
      { step: 2, description: 'Verify the refund request against the financial policy: unused package sessions may be refunded minus a 10% administrative fee. Membership refunds follow the cancellation policy terms. Treatment refunds are evaluated case-by-case by the provider/manager.' },
      { step: 3, description: 'For approved refunds: process through Square to the original payment method. Refund processing takes 5-10 business days.' },
      { step: 4, description: 'For financed treatments (CareCredit/Cherry): contact the financing company to process the refund on their end. Document the financing reference number.' },
      { step: 5, description: 'Update the Mangomint record: adjust the package sessions or membership status accordingly.' },
      { step: 6, description: 'Log the refund in Airtable via Dashboard > Entry > Sale (negative amount), noting the reason, approval authority, and original transaction reference.' },
      { step: 7, description: 'Send the client a refund confirmation email with the expected processing timeline.' },
      { step: 8, description: 'If the refund is related to a service complaint, escalate to the provider/manager for a follow-up conversation with the client.' },
    ],
  },

  // ── Emergency & Clinical ──────────────────────────────────
  {
    id: 'sop-008',
    title: 'Adverse Reaction Response',
    category: 'emergency',
    lastUpdated: '2026-03-10',
    steps: [
      { step: 1, description: 'When a client reports an adverse reaction (in person, by phone, or message), remain calm and empathetic. Do NOT dismiss their concern or attempt to diagnose over the phone.' },
      { step: 2, description: 'Gather essential information: What treatment did they receive? When was it performed? When did symptoms start? What symptoms are they experiencing? Are symptoms worsening?' },
      { step: 3, description: 'Assess urgency: If the client reports vision changes after filler, severe breathing difficulty, chest pain, or signs of anaphylaxis - instruct them to call 911 or go to the nearest emergency room immediately. Do NOT have them come to the clinic for these emergencies.' },
      { step: 4, description: 'For non-emergency adverse reactions: notify the treating provider within 15 minutes. If the treating provider is unavailable, escalate to the supervising physician or clinic owner.' },
      { step: 5, description: 'The provider will determine the appropriate response: come-in-now assessment, scheduled next-day evaluation, phone/video guidance, or ER referral.' },
      { step: 6, description: 'Document the adverse reaction in the client\'s chart including: date/time of report, symptoms described, provider notified, response plan, and follow-up timeline.' },
      { step: 7, description: 'Create an alert in Airtable via Dashboard > Entry > Staff Note (tag as "Adverse Reaction") for tracking and quality improvement.' },
      { step: 8, description: 'Follow up with the client within 24 hours (or sooner if indicated) to check on their status. Document the follow-up outcome.' },
      { step: 9, description: 'If the reaction is reportable (device malfunction, product defect), notify the clinic owner for FDA MedWatch reporting requirements.' },
    ],
  },
  {
    id: 'sop-009',
    title: 'Equipment Malfunction Response',
    category: 'emergency',
    lastUpdated: '2026-02-28',
    steps: [
      { step: 1, description: 'If a device malfunctions during treatment: STOP the procedure immediately. Ensure the client is safe and comfortable. Do not attempt to continue the treatment.' },
      { step: 2, description: 'If the malfunction caused any injury (burn, electrical shock, unexpected reaction): treat as a medical emergency - follow the Adverse Reaction SOP and Incident Report procedures.' },
      { step: 3, description: 'Power down the malfunctioning device using the proper shutdown procedure. Do NOT unplug forcefully unless there is an electrical safety hazard (sparking, smoke).' },
      { step: 4, description: 'Document the malfunction: device name, serial number, error code (if displayed), what happened, time of occurrence, treatment in progress at the time.' },
      { step: 5, description: 'Place an "OUT OF SERVICE" tag on the device. Do not allow anyone to use it until it has been inspected and cleared by the manufacturer or authorized service technician.' },
      { step: 6, description: 'Contact the device manufacturer\'s service line to report the malfunction and schedule repair/inspection. Document the service ticket number.' },
      { step: 7, description: 'Assess impact on today\'s schedule: reschedule any appointments that require the malfunctioning device. Contact affected clients with apology and alternative time options.' },
      { step: 8, description: 'Log the equipment issue in Dashboard > Entry > Room Issue with all details. This creates an Airtable record for maintenance tracking.' },
      { step: 9, description: 'After repair, do NOT resume client treatments until the device passes a test run and the provider confirms proper function.' },
    ],
  },
  {
    id: 'sop-010',
    title: 'Inventory Reorder Process',
    category: 'daily-ops',
    lastUpdated: '2026-03-01',
    steps: [
      { step: 1, description: 'Check the Dashboard > Inventory Intelligence page weekly (every Monday). Review items flagged as below reorder point or approaching expiration.' },
      { step: 2, description: 'For injectable products (Botox, fillers): verify current stock against the next 2 weeks of scheduled appointments. Order enough to cover scheduled treatments plus 20% buffer.' },
      { step: 3, description: 'For consumables (gloves, gauze, topical products, aftercare kits): maintain par levels as defined in the Inventory Intelligence system. Reorder when stock reaches the par level minimum.' },
      { step: 4, description: 'Submit purchase orders through approved suppliers only. Verify pricing against contracted rates before submitting.', notes: 'Do NOT order from new suppliers without manager approval. Product authenticity is critical for patient safety.' },
      { step: 5, description: 'For temperature-sensitive products (Botox, certain fillers): confirm the supplier ships with cold chain packaging and select appropriate shipping speed.' },
      { step: 6, description: 'Upon delivery: inspect all items immediately. Verify quantities match the order, check expiration dates (do not accept products expiring within 90 days), and inspect packaging for damage.' },
      { step: 7, description: 'Store products per manufacturer specifications. Refrigerated items go directly to the medical refrigerator. Log receipt in Dashboard > Entry > Inventory with quantities, lot numbers, and expiration dates.' },
      { step: 8, description: 'Rotate stock: move older inventory to the front (FIFO - first in, first out). This prevents expiration waste.' },
    ],
  },

  // ── Client Management (continued) ─────────────────────────
  {
    id: 'sop-011',
    title: 'Review Response Protocol',
    category: 'client-management',
    lastUpdated: '2026-03-10',
    steps: [
      { step: 1, description: 'Check the Dashboard > Reviews page daily. The Review Commander automation monitors Google reviews and flags new reviews requiring response.' },
      { step: 2, description: 'For positive reviews (4-5 stars): respond within 24 hours with a warm, personalized thank you. HIPAA compliance: NEVER mention specific treatments, even if the reviewer does.', notes: 'Template: "Thank you for your kind words, [Name]! We\'re so glad you had a wonderful experience at Rani. We look forward to seeing you again soon!"' },
      { step: 3, description: 'For negative reviews (1-3 stars): DO NOT respond emotionally or defensively. Draft a response and have the manager review before posting.', notes: 'Template: "Thank you for sharing your feedback, [Name]. We take every experience seriously and would love the opportunity to address your concerns. Please call us at [number] so we can discuss this personally."' },
      { step: 4, description: 'Never argue publicly with a reviewer. Take the conversation offline by inviting them to call or email.' },
      { step: 5, description: 'For reviews that contain specific medical claims, treatment details, or potential defamation: escalate to the clinic owner before responding. Legal review may be needed.' },
      { step: 6, description: 'After responding to a negative review, create a staff note in the Dashboard documenting the complaint, investigation findings, and resolution.' },
      { step: 7, description: 'Track review trends monthly: average rating, review volume, common themes. Present findings in the weekly management meeting.' },
    ],
  },
  {
    id: 'sop-012',
    title: 'Client Complaint Resolution',
    category: 'client-management',
    lastUpdated: '2026-02-28',
    steps: [
      { step: 1, description: 'When a client expresses dissatisfaction (in person, phone, email, or review), acknowledge their concern immediately: "I\'m sorry to hear about your experience. Your satisfaction is extremely important to us."' },
      { step: 2, description: 'Listen fully without interrupting or becoming defensive. Take notes on their specific concerns.' },
      { step: 3, description: 'Classify the complaint: Service quality (treatment results, provider bedside manner), Operational (wait times, scheduling errors, billing issues), or Facility (cleanliness, ambiance, comfort).' },
      { step: 4, description: 'For service quality complaints involving treatment outcomes: schedule the client for a complimentary provider assessment. The treating provider (or supervising physician if preferred) will evaluate and recommend corrective action.', notes: 'Never admit fault or liability without manager/owner approval.' },
      { step: 5, description: 'For operational complaints: apologize sincerely, identify the root cause, and explain what corrective action will be taken to prevent recurrence.' },
      { step: 6, description: 'Resolution options (escalate to manager for approval if needed): complimentary touch-up treatment, service credit for future visit, partial refund, full refund (manager approval required), enhanced follow-up care.' },
      { step: 7, description: 'Document the complaint, investigation, and resolution in the client\'s Airtable record via Dashboard > Entry > Staff Note. Tag as "Complaint Resolution."' },
      { step: 8, description: 'Follow up with the client within 72 hours after resolution to confirm satisfaction. A sincere follow-up often converts a dissatisfied client into a loyal advocate.' },
    ],
  },

  // ── Clinical Protocols ────────────────────────────────────
  {
    id: 'sop-013',
    title: 'GLP-1 Injection Protocol',
    category: 'clinical',
    lastUpdated: '2026-03-15',
    steps: [
      { step: 1, description: 'Verify the client is enrolled in the GLP-1 Weight Loss Program and has a current physician authorization on file.' },
      { step: 2, description: 'Review the client\'s chart for: current dosage, previous injection date, any reported side effects from the last injection, current weight, and recent lab results.' },
      { step: 3, description: 'For first-visit clients: confirm 8-hour fasting for initial lab draw. Perform phlebotomy (see Lab Draw SOP) before the GLP-1 injection.', notes: 'Initial labs include: CBC, CMP, lipid panel, A1c, TSH, and lipase. Results must be reviewed by the supervising physician before initiating GLP-1.' },
      { step: 4, description: 'Prepare the injection: verify the medication name, dose, lot number, and expiration date. Prepare the syringe using aseptic technique.' },
      { step: 5, description: 'Select the injection site: subcutaneous injection in the abdomen (rotating sites), thigh, or upper arm. Rotate injection sites each visit to prevent lipodystrophy.' },
      { step: 6, description: 'Clean the injection site with an alcohol swab. Allow to dry completely. Administer the subcutaneous injection at a 45-90 degree angle depending on body habitus.' },
      { step: 7, description: 'Monitor the client for 15 minutes post-injection for any immediate adverse reactions (nausea, dizziness, injection site reaction).' },
      { step: 8, description: 'Document in the chart: medication, dose, lot number, injection site, client\'s current weight, any side effects reported, and next appointment scheduled.' },
      { step: 9, description: 'Provide the client with post-injection instructions: eat small, frequent meals, stay hydrated, report severe nausea/vomiting, abdominal pain, or signs of pancreatitis immediately.' },
      { step: 10, description: 'Schedule the next injection appointment (typically every 4 weeks). Confirm any dose titration changes per the physician\'s protocol.' },
    ],
  },
  {
    id: 'sop-014',
    title: 'Lab Draw (Phlebotomy) Protocol',
    category: 'clinical',
    lastUpdated: '2026-03-15',
    steps: [
      { step: 1, description: 'Verify the lab order: confirm which tests are ordered, confirm fasting requirements were met (if applicable), and confirm the client\'s identity (name + DOB).' },
      { step: 2, description: 'Prepare supplies: tourniquet, alcohol swab, appropriate collection tubes (color-coded per test requirements), butterfly needle or straight needle (gauge appropriate for client), gauze, adhesive bandage, tube labels, biohazard bag.' },
      { step: 3, description: 'Apply PPE: clean nitrile gloves. Wash/sanitize hands before gloving.' },
      { step: 4, description: 'Apply tourniquet 3-4 inches above the intended puncture site. Ask the client to make a fist. Palpate for a suitable vein (antecubital fossa preferred: median cubital, cephalic, or basilic vein).' },
      { step: 5, description: 'Clean the puncture site with an alcohol swab in a circular motion from center outward. Allow to air dry - do not blow on it or fan it.' },
      { step: 6, description: 'Perform venipuncture: anchor the vein, insert the needle bevel-up at a 15-30 degree angle. Observe for flashback. Collect tubes in the correct order of draw: blood culture (yellow) → coagulation (light blue) → serum (red/gold) → heparin (green) → EDTA (lavender) → oxalate/fluoride (gray).' },
      { step: 7, description: 'Release the tourniquet before removing the needle. Remove the needle and apply firm pressure with gauze for 2-3 minutes. Apply adhesive bandage.' },
      { step: 8, description: 'Label all tubes at the bedside (never pre-label): client name, DOB, date and time of collection, collector\'s initials.' },
      { step: 9, description: 'Place labeled tubes in the biohazard transport bag with the completed lab requisition form.' },
      { step: 10, description: 'Arrange for specimen transport to the contracted lab within the required timeframe. Most specimens must reach the lab within 4 hours of collection.', notes: 'Some tests require specific handling (e.g., kept on ice, protected from light). Check test-specific requirements.' },
      { step: 11, description: 'Document the lab draw in the client\'s chart: tests ordered, tubes collected, site used, any complications (difficult stick, hematoma), and specimen disposition.' },
      { step: 12, description: 'Dispose of sharps and biohazard materials properly. Remove gloves and wash hands.' },
    ],
  },
  {
    id: 'sop-015',
    title: 'Emergency Response Protocol',
    category: 'emergency',
    lastUpdated: '2026-03-10',
    steps: [
      { step: 1, description: 'Identify the emergency type: medical (anaphylaxis, cardiac, syncope, vascular occlusion), fire, active threat, natural disaster, or utility failure.' },
      { step: 2, description: 'For MEDICAL EMERGENCIES: Alert the provider immediately. The most senior clinical staff member takes charge of patient care. Front desk calls 911 and provides: clinic address (401 Olympia Ave NE #101, Renton, WA 98056), nature of emergency, number of people affected.' },
      { step: 3, description: 'Retrieve the emergency kit from the supply room. Know the contents: epinephrine auto-injectors, diphenhydramine, nitroglycerin, albuterol inhaler, BP cuff, pulse oximeter, glucose tablets.' },
      { step: 4, description: 'AED location: wall-mounted between treatment rooms 1 and 2. If cardiac arrest is suspected, retrieve the AED immediately. Follow voice prompts.' },
      { step: 5, description: 'Clear the path from the treatment room to the front entrance for paramedics. Assign a team member to meet paramedics at the door and guide them to the patient.' },
      { step: 6, description: 'For FIRE: Activate the fire alarm. Follow the RACE protocol: Rescue (anyone in immediate danger), Alarm (pull fire alarm, call 911), Contain (close doors to limit spread), Evacuate (primary exit: front entrance, secondary: back door through break room). Gather at southeast corner of parking lot.' },
      { step: 7, description: 'For ACTIVE THREAT: Follow Run-Hide-Fight. Run if safe, Hide if you cannot escape (lock doors, silence phones, barricade), Fight only as last resort. Activate the panic button under the front desk counter.' },
      { step: 8, description: 'After the emergency is resolved: complete an incident report within 1 hour. Collect witness statements. Preserve all relevant records.' },
      { step: 9, description: 'Notify the clinic owner (Rina) immediately regardless of the time. Do not discuss the incident with other clients or on social media.' },
      { step: 10, description: 'Conduct a team debrief within 24 hours to review the response, identify improvements, and provide emotional support to affected staff members.' },
    ],
  },
];

export const SOP_CATEGORIES: Record<SOP['category'], string> = {
  'daily-ops': 'Daily Operations',
  'clinical': 'Clinical Protocols',
  'financial': 'Financial Procedures',
  'emergency': 'Emergency Response',
  'client-management': 'Client Management',
};

export const SOP_CATEGORY_COLORS: Record<SOP['category'], string> = {
  'daily-ops': '#3B82F6',
  'clinical': '#8B5CF6',
  'financial': '#059669',
  'emergency': '#DC2626',
  'client-management': '#C9A96E',
};

export function getSOPById(id: string): SOP | undefined {
  return SOPS.find(s => s.id === id);
}

export function getSOPsByCategory(category: SOP['category']): SOP[] {
  return SOPS.filter(s => s.category === category);
}
