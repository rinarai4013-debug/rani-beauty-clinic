# Rani Beauty Clinic -- Profit Moves N8N Workflow Specifications

**Version:** 1.0
**Last Updated:** 2026-03-28
**Author:** Sukhi (sukhithebanker)
**Platform:** n8n (self-hosted)
**Integrations:** Mangomint, Web3Forms, QualiphyRx, Olympia Pharmacy, Hallandale Pharmacy, Twilio (SMS), Airtable

---

## Pharmacy Reference

| Pharmacy | Specialization | GFE Required | Key Products |
|----------|---------------|--------------|--------------|
| **QualiphyRx Greenwich** | GLP-1s, exclusive peptides | Yes (via Qualiphy) | Semaglutide, Tirzepatide, CJC-1295, Epithalon, MOTS-C, Tesamorelin |
| **Olympia Pharmacy** | HRT, NAD+/Sermorelin injectables, skincare, ED, supplies | Yes (for Rx items) | TRT, Female HRT, NAD+ injectable, Sermorelin injectable, Tighten (GHK-Cu), Tadalafil, TriMix, syringes, swabs |
| **Hallandale Pharmacy** | Troches, compounded oral | No (compounded) | Bella #1 SR, BPC-157 troche, custom troches |

---

## Workflow 1: `patient-intake-router`

**Trigger:** Web3Forms webhook (new intake submission from landing page)
**Purpose:** Route new patients to the correct pharmacy path based on requested service
**Move Alignment:** Foundation -- feeds all 10 Profit Moves
**Estimated Node Count:** 22-26 nodes

### Trigger Configuration

- **Webhook Node:** Receives POST from Web3Forms
- **Webhook URL:** `https://n8n.ranibeautyclinic.com/webhook/patient-intake`
- **Authentication:** Web3Forms API key validation in header

### Step-by-Step Logic

**Step 1 -- Parse Webhook Payload**
- Extract fields: `name`, `email`, `phone`, `services[]`, `gender`, `dob`, `preferred_contact`, `referral_source`
- Normalize phone to E.164 format
- Validate required fields (name, phone, at least one service)
- If validation fails -> send error to Airtable error log, stop

**Step 2 -- Service Classification Router (Switch Node)**

Route by primary service requested:

| Service Selected | Route | Pharmacy | GFE Required |
|-----------------|-------|----------|--------------|
| GLP-1: Semaglutide | QualiphyRx Greenwich | QualiphyRx Greenwich | Yes |
| GLP-1: Tirzepatide | QualiphyRx Greenwich | QualiphyRx Greenwich | Yes |
| Peptide: CJC-1295 | QualiphyRx Greenwich | QualiphyRx Greenwich | Yes |
| Peptide: Epithalon | QualiphyRx Greenwich | QualiphyRx Greenwich | Yes |
| Peptide: MOTS-C | QualiphyRx Greenwich | QualiphyRx Greenwich | Yes |
| Peptide: Tesamorelin | QualiphyRx Greenwich | QualiphyRx Greenwich | Yes |
| Peptide: NAD+ Injectable | Olympia | Olympia | Yes |
| Peptide: Sermorelin Injectable | Olympia | Olympia | Yes |
| HRT: Male TRT | Olympia | Olympia | Yes (Qualiphy GFE) |
| HRT: Female | Olympia | Olympia | Yes (Qualiphy GFE) |
| Skincare: Tighten / GHK-Cu | Olympia | Olympia | No (topical) |
| Sexual Health: ED / Tadalafil | Olympia | Olympia | Yes (Qualiphy GFE) |
| Sexual Health: TriMix | Olympia | Olympia | Yes (Qualiphy GFE) |
| Wellness Injections (B12, Lipo, etc.) | In-Clinic | None | No |

**Step 3 -- Create Mangomint Client Record**
- API: `POST /clients` to Mangomint
- Fields: first_name, last_name, email, phone, gender, dob
- Check for existing client by phone/email first (dedup)
- If existing client found -> update record, do not create duplicate

**Step 4 -- Apply Mangomint Tags**

Tags applied based on route:

| Route | Tags Applied |
|-------|-------------|
| QualiphyRx GLP-1 | `NEW-PATIENT`, `GLP1-INTAKE`, `QUALIPHYRX-GREENWICH`, `GFE-PENDING` |
| QualiphyRx Peptide | `NEW-PATIENT`, `PEPTIDE-INTAKE`, `QUALIPHYRX-GREENWICH`, `GFE-PENDING` |
| Olympia NAD+/Sermorelin | `NEW-PATIENT`, `PEPTIDE-INTAKE`, `OLYMPIA-PHARMACY`, `GFE-PENDING` |
| Olympia HRT | `NEW-PATIENT`, `HRT-INTAKE`, `OLYMPIA-PHARMACY`, `GFE-PENDING` |
| Olympia Skincare | `NEW-PATIENT`, `SKINCARE-INTAKE`, `OLYMPIA-PHARMACY` |
| Olympia ED/Sexual Health | `NEW-PATIENT`, `ED-INTAKE`, `OLYMPIA-PHARMACY`, `GFE-PENDING` |
| In-Clinic Wellness | `NEW-PATIENT`, `WELLNESS-INJECTION`, `IN-CLINIC` |

**Step 5 -- Send Welcome SMS**

SMS sent via Mangomint messaging API (or Twilio fallback):

- **QualiphyRx path:**
  ```
  Hi {{first_name}}, welcome to Rani Beauty Clinic! I'm Rina, your wellness
  concierge. I'm sending you a link to complete your medical evaluation so we
  can get your {{service}} started. You'll receive it shortly. Any questions,
  just text me back!
  ```

- **Olympia path (Rx items):**
  ```
  Hi {{first_name}}, welcome to Rani Beauty Clinic! I'm Rina, your wellness
  concierge. To get your {{service}} prescription started, I'm sending you a
  quick medical evaluation link. Once approved, your medication ships directly
  to you! Text me with any questions.
  ```

- **Olympia path (skincare/topicals):**
  ```
  Hi {{first_name}}, welcome to Rani Beauty Clinic! I'm Rina, your wellness
  concierge. Great news -- your {{service}} doesn't require a prescription
  evaluation. I'm placing your order now and it should arrive within 5-7
  business days. Text me anytime!
  ```

- **In-Clinic path:**
  ```
  Hi {{first_name}}, welcome to Rani Beauty Clinic! I'm Rina. Let's get your
  {{service}} scheduled. Here's our booking link: [mangomint_booking_url].
  Looking forward to seeing you!
  ```

**Step 6 -- Send Welcome Email**
- Template: Rani branded HTML welcome email via Mangomint
- Include: service summary, what to expect, Rina's direct contact, clinic hours

**Step 7 -- Log Revenue Estimate**
- Write to Airtable `Revenue Pipeline` table
- Fields: patient_id, service, estimated_mrr, pharmacy_source, intake_date, status: `INTAKE`

### Error Handling

| Error | Action |
|-------|--------|
| Webhook payload missing required fields | Log to Airtable `Errors` table, send Slack alert to Rina |
| Mangomint API timeout | Retry 3x with 30s backoff, then alert Rina |
| Duplicate client detected | Update existing record, skip creation, continue flow |
| SMS send failure | Log error, queue for retry in 1 hour, send email as fallback |
| Unrecognized service selection | Route to manual review queue, tag `MANUAL-REVIEW`, alert Rina |

---

## Workflow 2: `tirz-routing-optimizer`

**Trigger:** Mangomint webhook -- patient tagged with `TIRZ-*` (any tirzepatide dose tag)
**Purpose:** Auto-select QualiphyRx Greenwich for all tirzepatide orders (Profit Move 1)
**Move Alignment:** Move 1 -- Tirzepatide via QualiphyRx Greenwich
**Estimated Node Count:** 14-18 nodes

### Trigger Configuration

- **Webhook Node:** Mangomint tag-change webhook
- **Filter:** Tag matches pattern `TIRZ-D1`, `TIRZ-D2`, `TIRZ-D3`, or `TIRZ-D4`

### Step-by-Step Logic

**Step 1 -- Identify Dose Tier**
- Parse tag to extract dose level
- Dose tier mapping:

| Tag | Dose | 3-Month Package Price | COGS |
|-----|------|----------------------|------|
| `TIRZ-D1` | 2.5mg (starter) | $1,347 | $450 |
| `TIRZ-D2` | 5mg | $1,497 | $525 |
| `TIRZ-D3` | 7.5mg | $1,647 | $600 |
| `TIRZ-D4` | 10mg+ (maintenance) | $1,797 | $675 |

**Step 2 -- Force QualiphyRx Greenwich Selection**
- IF pharmacy_source != `QUALIPHYRX-GREENWICH` -> override and alert
- ALWAYS route to Greenwich (never Nova, never Olympia, never Hallandale)
- This is a hard rule -- no exceptions

**Step 3 -- Generate Qualiphy Invite Link**
- API call to Qualiphy: `POST /invites`
- Include: patient name, email, phone, medication: "tirzepatide", dose_tier
- Store invite_link in patient record

**Step 4 -- Send SMS**
```
Hi {{first_name}}, your tirzepatide prescription is being processed through
our partner pharmacy. Your 3-month supply includes B12 and anti-nausea
medication at no extra cost! Expected delivery: 5-7 business days. I'll keep
you updated every step of the way. - Rina
```

**Step 5 -- Apply/Verify Tags**
- Ensure tags: `QUALIPHYRX-GREENWICH`, `GLP1-PATIENT`, `TIRZ-ACTIVE`, `{{dose_tag}}`
- Remove any conflicting pharmacy tags (e.g., `OLYMPIA-PHARMACY`, `HALLANDALE`)

**Step 6 -- Set Refill Reminder**
- Calculate refill date: `current_date + 85 days`
- Create Airtable record in `Refill Schedule` table
- Fields: patient_id, medication: "tirzepatide", dose_tier, refill_date, pharmacy: "QualiphyRx Greenwich"
- Set reminder trigger for Day 80 (first nudge) and Day 85 (second nudge)

**Step 7 -- Log COGS**
- Write to Airtable `Revenue Tracker` table
- Fields: patient_id, medication, dose_tier, revenue (package price), cogs, margin, pharmacy, order_date

### Mangomint Tags

| Tag | Purpose |
|-----|---------|
| `TIRZ-D1` through `TIRZ-D4` | Dose tier identifier |
| `TIRZ-ACTIVE` | Currently on tirzepatide |
| `QUALIPHYRX-GREENWICH` | Pharmacy source |
| `GLP1-PATIENT` | Service category |
| `GFE-PENDING` / `GFE-APPROVED` | Qualiphy evaluation status |

### Error Handling

| Error | Action |
|-------|--------|
| Dose tier unrecognized | Default to D1 (starter), alert Rina for manual confirmation |
| Qualiphy API failure | Retry 3x, then queue for manual invite, alert Rina |
| Patient already has active TIRZ order | Skip order, update refill date only |
| Conflicting pharmacy tag found | Remove conflicting tag, log correction, alert Rina |

---

## Workflow 3: `cost-routing-guard`

**Trigger:** Any medication order being placed (webhook from order system or manual trigger)
**Purpose:** Prevent routing errors that cost money -- enforce pharmacy decision matrix (Profit Move 3)
**Move Alignment:** Move 3 -- Cost Optimization via Pharmacy Routing
**Estimated Node Count:** 16-20 nodes

### Trigger Configuration

- **Webhook Node:** Order placement webhook (pre-submission gate)
- **Manual Trigger:** Button in n8n dashboard for ad-hoc checks
- **This workflow acts as a GATE -- it must approve before order proceeds**

### Step-by-Step Logic

**Step 1 -- Extract Order Details**
- Parse: medication_name, dose, quantity, patient_id, target_pharmacy
- Look up patient record from Mangomint for tags and history

**Step 2 -- GLP-1 Misroute Check (CRITICAL)**
- Condition: Is medication a GLP-1 (semaglutide OR tirzepatide)?
- If YES and target_pharmacy is NOT `QualiphyRx Greenwich`:
  - **BLOCK ORDER**
  - Calculate savings: `target_pharmacy_cost - greenwich_cost`
  - Send alert to Rina:
    ```
    ROUTING ALERT: {{patient_name}}'s {{medication}} is being sent to
    {{target_pharmacy}} instead of QualiphyRx Greenwich. This costs us
    ${{overspend}} more per order. I've blocked the order. Please confirm
    redirect to Greenwich.
    ```
  - Tag patient: `ROUTING-REVIEW`
  - Log in `Routing Errors` Airtable table

**Step 3 -- NAD+/Sermorelin Injectable Misroute Check**
- Condition: Is medication NAD+ injectable or Sermorelin injectable?
- If YES and target_pharmacy is NOT `Olympia`:
  - Send alert to Rina:
    ```
    COST ALERT: {{medication}} for {{patient_name}} is routed to
    {{target_pharmacy}}. Olympia saves ${{savings}} per order. Redirecting
    to Olympia.
    ```
  - Auto-redirect to Olympia (soft block -- auto-corrects)
  - Log redirect in `Routing Corrections` table

**Step 4 -- HRT Misroute Check**
- Condition: Is medication HRT (TRT, estradiol, progesterone)?
- If YES and target_pharmacy is `Hallandale`:
  - Pull price comparison: Hallandale vs Olympia for this specific product
  - Send alert with comparison:
    ```
    PRICE CHECK: {{medication}} for {{patient_name}}
    Hallandale: ${{hallandale_price}}
    Olympia: ${{olympia_price}}
    Savings with Olympia: ${{difference}}
    Redirecting to Olympia unless you override.
    ```
  - Auto-redirect to Olympia
  - Log with price comparison data

**Step 5 -- Skincare Misroute Check**
- Condition: Is medication a topical skincare product (Tighten, GHK-Cu, etc.)?
- If YES and target_pharmacy is NOT `Olympia`:
  - Alert and redirect to Olympia (Olympia is exclusive source for these)

**Step 6 -- No Violations Found**
- If all checks pass -> set order status to `APPROVED`
- Allow order to proceed to pharmacy submission
- Log clean pass in `Order Audit` table

### Price Comparison Matrix (Reference Data)

| Medication | QualiphyRx Greenwich | Olympia | Hallandale | Correct Route |
|-----------|---------------------|---------|------------|---------------|
| Semaglutide (3mo) | $375 | $480 | N/A | QualiphyRx |
| Tirzepatide (3mo) | $450-675 | N/A | N/A | QualiphyRx |
| NAD+ Injectable | N/A | $199 | N/A | Olympia |
| Sermorelin Injectable | N/A | $249 | N/A | Olympia |
| TRT (5mL vial) | N/A | $89 | $120 | Olympia |
| Tighten (GHK-Cu) | N/A | $50 | N/A | Olympia |
| Bella #1 SR | N/A | N/A | $75 | Hallandale |
| BPC-157 Troche | N/A | N/A | $60 | Hallandale |

### Error Handling

| Error | Action |
|-------|--------|
| Unknown medication | Route to manual review, tag `MANUAL-REVIEW`, alert Rina |
| Price data unavailable | Allow order but flag for audit, alert Rina |
| Pharmacy API unreachable | Queue order, retry in 30 minutes, alert if still failing |
| Override requested by Rina | Allow with override tag `ROUTING-OVERRIDE`, log reason |

---

## Workflow 4: `refill-engine`

**Trigger:** Daily CRON at 8:00 AM PST
**Purpose:** Send refill reminders across all service lines, generate batch orders (Profit Move 5)
**Move Alignment:** Move 5 -- Automated Refill Revenue
**Estimated Node Count:** 28-34 nodes

### Trigger Configuration

- **Cron Node:** `0 8 * * *` (PST / America/Los_Angeles)
- **Runs:** Every day at 8:00 AM Pacific

### Step-by-Step Logic

**Step 1 -- Query All Active Patients**
- Pull from Airtable `Patients` table where status = `ACTIVE`
- Include fields: patient_id, name, phone, services[], last_order_date, pharmacy_source, dose_tier, tags[]

**Step 2 -- Calculate Refill Windows**

For each patient, check if they fall into a refill window:

| Service Line | Supply Duration | First Reminder | Second Nudge |
|-------------|----------------|----------------|--------------|
| GLP-1 (Sema/Tirz) | 90 days | Day 80 | Day 85 |
| TRT 5mL vial | 150 days | Day 140 | Day 145 |
| Skincare (Tighten) | 30 days | Day 25 | Day 28 |
| Troches (BPC-157, etc.) | 30 days | Day 25 | Day 28 |
| Bella #1 SR | 30 days | Day 25 | Day 28 |
| ED (Tadalafil) | 30 days | Day 25 | Day 28 |
| HRT Oral | 30 days | Day 25 | Day 28 |
| NAD+ Injectable | 30 days | Day 25 | Day 28 |
| Sermorelin Injectable | 30 days | Day 25 | Day 28 |

**Step 3 -- Send Personalized SMS per Service Type**

- **GLP-1 Day 80 (First Reminder):**
  ```
  Hi {{first_name}}, you're about 10 days from finishing your current
  {{medication}} supply. Want me to get your refill started so there's no gap?
  Reply YES and I'll take care of everything! - Rina
  ```

- **GLP-1 Day 85 (Second Nudge):**
  ```
  Hey {{first_name}}, just checking in -- your {{medication}} will run out in
  about 5 days. I don't want you to lose your progress! Reply YES to refill
  or call me if you have questions. - Rina
  ```

- **TRT Day 140:**
  ```
  Hi {{first_name}}, your TRT vial should be running low soon. Want me to get
  your next 5mL vial ordered? Same great results, zero hassle. Reply YES! - Rina
  ```

- **Monthly Products Day 25:**
  ```
  Hi {{first_name}}, your {{product}} is up for renewal in a few days.
  Want me to reorder? Reply YES to continue without interruption! - Rina
  ```

- **Monthly Products Day 28 (Nudge):**
  ```
  Hey {{first_name}}, last reminder -- your {{product}} runs out in a couple
  days. Don't want you to miss a day! Reply YES to reorder. - Rina
  ```

**Step 4 -- Generate Batch Olympia Order**
- Collect all Olympia refills confirmed today
- Group by patient to minimize shipping
- Create single batch order payload:
  - Items: medication, dose, quantity, patient_info
  - Ship-to: patient addresses
- Submit via Olympia ordering API/portal

**Step 5 -- Generate Batch Hallandale Order**
- Collect all Hallandale refills confirmed today (Bella, troches)
- Create batch order:
  - Items: Bella #1 SR 30ct, BPC-157 troche, other troches
  - Ship-to: patient addresses
- Submit via Hallandale ordering process

**Step 6 -- Generate QualiphyRx Renewal Invites**
- For each GLP-1 refill confirmed:
  - Generate individual Qualiphy renewal invite (GFE re-evaluation)
  - Send invite link via SMS
  - These are individual, not batched (Qualiphy requires per-patient GFE)

**Step 7 -- Log Refill Attempts**
- Write to Airtable `Refill Log` table
- Fields: patient_id, medication, reminder_type (first/nudge), sent_at, response (YES/NO/NONE), pharmacy, order_status

### Mangomint Tags

| Tag | Applied When |
|-----|-------------|
| `REFILL-REMINDER-SENT` | First reminder sent |
| `REFILL-NUDGE-SENT` | Second nudge sent |
| `REFILL-CONFIRMED` | Patient replied YES |
| `REFILL-LAPSED` | No response after nudge + 7 days |
| `AT-RISK` | Refill lapsed, potential churn |

### Error Handling

| Error | Action |
|-------|--------|
| SMS delivery failure | Log, retry in 2 hours, email fallback |
| Olympia batch order failure | Alert Rina immediately, queue for manual submission |
| Hallandale batch order failure | Alert Rina, queue for manual submission |
| Qualiphy invite generation failure | Retry 3x, then manual invite, alert Rina |
| Patient has no phone on file | Send email only, tag `MISSING-PHONE` |
| Refill for discontinued product | Skip, tag `PRODUCT-DISCONTINUED`, alert Rina |

---

## Workflow 5: `cross-sell-engine`

**Trigger:** Weekly CRON -- every Wednesday at 10:00 AM PST
**Purpose:** Scan for revenue opportunities across all 10 Profit Moves
**Move Alignment:** Moves 2, 4, 6, 8, 9 -- Cross-Sell and Upsell
**Estimated Node Count:** 30-38 nodes

### Trigger Configuration

- **Cron Node:** `0 10 * * 3` (PST / America/Los_Angeles)
- **Runs:** Every Wednesday at 10:00 AM Pacific

### Step-by-Step Logic

**Step 1 -- Pull All Active Patients**
- Query Airtable: status = `ACTIVE`
- Include: patient_id, name, phone, gender, services[], tags[], months_active, last_cross_sell_date, cross_sell_count_this_month

**Step 2 -- Apply Cross-Sell Rules (evaluated in order of dollar impact)**

| Rule ID | Condition | Offer | Monthly Revenue | Monthly Profit | Priority |
|---------|-----------|-------|----------------|----------------|----------|
| CS-01 | GLP-1 + Female + Month 2+ + no `SKINCARE-PATIENT` tag | Tighten cream (GHK-Cu 0.5%) | +$149 | +$99 | High |
| CS-02 | GLP-1 + Female + Month 2+ + no `BELLA-PATIENT` tag | Bella #1 SR | +$199 | +$124 | High |
| CS-03 | GLP-1 + Month 3+ + no `PEPTIDE-PATIENT` tag | Sermorelin injectable | +$299 | +$199 | High |
| CS-04 | Male + GLP-1 + no `TRT-PATIENT` tag | TRT program | +$349 | +$249 | Very High |
| CS-05 | Male + TRT + no `GLP1-PATIENT` tag | GLP-1 program | +$449-599 | +$300-450 | Very High |
| CS-06 | Male + (TRT or GLP-1) + no `ED-PATIENT` tag | ED program (Tadalafil) | +$149 | +$99 | Medium |
| CS-07 | Female + HRT + no `INTIMATE-WELLNESS` tag | Intimate wellness program | +$129 | +$79 | Medium |
| CS-08 | `AT-RISK` tag + injectable peptide | Troche downsell (oral alternative) | +$149-199 | +$89-124 | Retention |

**Step 3 -- Frequency Limit Check**
- For each patient with matching rules:
  - Check `cross_sell_count_this_month`
  - If >= 2 -> skip this patient (max 2 cross-sell messages per patient per month)
  - Check `last_cross_sell_date`
  - If < 7 days ago -> skip (minimum 7-day gap between messages)

**Step 4 -- Prioritize by Dollar Impact**
- Sort all eligible cross-sell opportunities by monthly profit (descending)
- For patients matching multiple rules, select the highest-value offer first

**Step 5 -- Send Personalized SMS**

- **CS-01 (Tighten Cream):**
  ```
  Hi {{first_name}}, now that you're seeing amazing results on your weight loss
  journey, I wanted to share something our patients love -- our medical-grade
  skin tightening cream helps your skin keep up with your transformation. Only
  $149/month. Want me to add it to your next order? Reply YES! - Rina
  ```

- **CS-02 (Bella #1 SR):**
  ```
  Hi {{first_name}}, have you heard about Bella #1 SR? It's a wellness
  supplement our female patients love alongside their GLP-1. Supports mood,
  metabolism, and overall wellness. Only $199/month. Reply YES to try it! - Rina
  ```

- **CS-03 (Sermorelin):**
  ```
  Hi {{first_name}}, you're doing great on your GLP-1! A lot of my patients
  add Sermorelin to boost recovery, sleep, and lean muscle. It's a perfect
  complement. $299/month. Want to learn more? Reply YES! - Rina
  ```

- **CS-04 (TRT for Male GLP-1 Patients):**
  ```
  Hi {{first_name}}, many of our male patients on GLP-1 see even better results
  when they optimize their testosterone too. Our TRT program is $349/month and
  includes everything. Interested? Reply YES! - Rina
  ```

- **CS-05 (GLP-1 for TRT Patients):**
  ```
  Hi {{first_name}}, a lot of my TRT patients are adding our GLP-1 program
  to shed stubborn fat while building lean muscle -- the combo is
  incredible. Starting at $449/month. Want details? Reply YES! - Rina
  ```

- **CS-06 (ED Program):**
  ```
  Hi {{first_name}}, we have a discreet men's wellness program that pairs
  perfectly with your current treatment. Prescription Tadalafil, $149/month,
  shipped directly to you. Reply YES for details. - Rina
  ```

- **CS-07 (Intimate Wellness):**
  ```
  Hi {{first_name}}, we offer a women's intimate wellness program that many of
  our HRT patients love. $129/month, completely private and discreet. Reply YES
  if you'd like to learn more. - Rina
  ```

- **CS-08 (Troche Downsell):**
  ```
  Hi {{first_name}}, I noticed it's been a bit since your last order. If
  injections aren't your thing, we have an oral alternative -- same benefits
  in a troche form, starting at $149/month. No needles! Reply YES to switch. - Rina
  ```

**Step 6 -- Log Cross-Sell Attempts**
- Write to Airtable `Cross-Sell Log` table
- Fields: patient_id, rule_id, offer, message_sent, sent_at, response, conversion (YES/NO), revenue_added

### Mangomint Tags (Applied on Conversion)

| Tag | Applied When |
|-----|-------------|
| `CROSS-SELL-ACTIVE` | Patient accepted any cross-sell |
| `SKINCARE-PATIENT` | Accepted Tighten cream |
| `BELLA-PATIENT` | Accepted Bella #1 SR |
| `PEPTIDE-PATIENT` | Accepted Sermorelin |
| `TRT-PATIENT` | Accepted TRT program |
| `GLP1-PATIENT` | Accepted GLP-1 (from TRT base) |
| `ED-PATIENT` | Accepted ED program |
| `INTIMATE-WELLNESS` | Accepted intimate wellness |
| `TROCHE-PATIENT` | Accepted troche downsell |

### Error Handling

| Error | Action |
|-------|--------|
| Patient data incomplete (missing gender) | Skip patient, tag `DATA-INCOMPLETE`, alert Rina |
| SMS delivery failure | Log, do not retry (weekly cadence handles it) |
| Airtable query timeout | Retry once, then alert and skip this week's run |
| Patient replied STOP | Remove from cross-sell pool, tag `OPT-OUT`, respect immediately |

---

## Workflow 6: `free-kit-fulfillment`

**Trigger:** Mangomint tag change -- patient tagged `GLP1-PATIENT` moves to `MED-SHIPPED`
**Purpose:** Auto-ship free injection kits to build loyalty (Profit Move 7)
**Move Alignment:** Move 7 -- Free Injection Kit Loyalty Play
**Estimated Node Count:** 10-14 nodes

### Trigger Configuration

- **Webhook Node:** Mangomint tag-change webhook
- **Filter:** Patient has both `GLP1-PATIENT` AND `MED-SHIPPED` tags

### Step-by-Step Logic

**Step 1 -- Eligibility Check**
- Query Mangomint: Does patient have tag `FREE-KIT-SENT`?
- If YES -> stop (kit already sent, do not send duplicate)
- If NO -> proceed

**Step 2 -- Add Kit to Olympia Batch Order**
- Kit contents:
  - Insulin syringes (10-pack): $2.00
  - Alcohol swabs (100-pack): $5.00
  - Sharps container (1x): $0.00 (included with Olympia orders over threshold)
- Total kit cost: ~$7.00
- Add to next Olympia batch order queue (or create standalone if no batch pending)
- Ship-to: patient address from Mangomint record

**Step 3 -- Send SMS**
```
Hi {{first_name}}, I'm also sending you a FREE injection kit with alcohol
swabs, syringes, and a sharps container. It's on us -- we want to make sure
you have everything you need for a smooth experience! - Rina
```

**Step 4 -- Apply Tag**
- Add Mangomint tag: `FREE-KIT-SENT`
- Add tag: `KIT-SHIPPED-{{date}}`

**Step 5 -- Log Cost**
- Write to Airtable `COGS Tracker` table
- Fields: patient_id, item: "GLP-1 Injection Kit", cost: $7.00, pharmacy: "Olympia", date, category: "loyalty"

### Error Handling

| Error | Action |
|-------|--------|
| Olympia order queue unavailable | Queue kit order for next batch, alert Rina |
| Patient address missing | Tag `MISSING-ADDRESS`, alert Rina, hold kit |
| Duplicate trigger (tag applied twice) | `FREE-KIT-SENT` check prevents duplicate, log and skip |

---

## Workflow 7: `bella-upsell`

**Trigger:** Scheduled check -- Female patient tagged `GLP1-PATIENT` at Day 7 of active status
**Purpose:** Cross-sell Bella #1 SR to female GLP-1 patients (Profit Move 8)
**Move Alignment:** Move 8 -- Bella #1 SR for Female GLP-1 Patients
**Estimated Node Count:** 14-18 nodes

### Trigger Configuration

- **Cron Node:** Daily at 9:00 AM PST (`0 9 * * *`)
- **Filter:** Query patients where:
  - Gender = Female
  - Has tag `GLP1-PATIENT`
  - Does NOT have tag `BELLA-PATIENT`
  - `active_since` date is exactly 7 days ago

### Step-by-Step Logic

**Step 1 -- Eligibility Verification**
- Confirm: Female + `GLP1-PATIENT` + NOT `BELLA-PATIENT`
- Also check: NOT `OPT-OUT` (patient has not opted out of marketing)
- Also check: NOT `BELLA-DECLINED` (patient previously declined)

**Step 2 -- Send SMS**
```
Hi {{first_name}}, have you heard of Bella #1 SR? It's a wellness supplement
our female patients love alongside their GLP-1. Supports mood, metabolism, and
overall wellness. Only $199/month. Want me to add it to your program? Reply
YES! - Rina
```

**Step 3 -- Monitor for YES Reply (Webhook or Polling)**
- Listen for inbound SMS reply containing "YES" (case-insensitive)
- Timeout: 48 hours
- If no reply -> tag `BELLA-OFFERED` (for tracking, do not re-offer for 30 days)

**Step 4 -- On YES Reply: Process Order**
- Apply Mangomint tags: `BELLA-PATIENT`, `HALLANDALE-ORDER`, `CROSS-SELL-ACTIVE`
- Place Hallandale order:
  - Product: Bella #1 SR 30ct
  - Ship-to: patient address
- Send confirmation SMS:
  ```
  Amazing choice {{first_name}}! Your Bella #1 SR is being ordered now and
  will arrive within 5-7 business days. You're going to love it! - Rina
  ```

**Step 5 -- Update Revenue Tracker**
- Write to Airtable `Revenue Tracker`:
  - patient_id, product: "Bella #1 SR", mrr_added: $199, cogs: $75, profit: $124, pharmacy: "Hallandale", source: "cross-sell", date

### Error Handling

| Error | Action |
|-------|--------|
| Patient replied NO or STOP | Tag `BELLA-DECLINED` or `OPT-OUT`, do not re-offer |
| Hallandale order failure | Alert Rina, queue for manual order |
| SMS delivery failure | Send email fallback with same offer |
| Patient already has Bella (tag missing) | Check order history before placing duplicate |

---

## Workflow 8: `skincare-crosssell`

**Trigger:** GLP-1 patient reaches Month 2 (active for 60+ days)
**Purpose:** Cross-sell GHK-Cu Tighten cream to weight loss patients (Profit Move 4)
**Move Alignment:** Move 4 -- Skin Tightening for GLP-1 Patients
**Estimated Node Count:** 14-18 nodes

### Trigger Configuration

- **Cron Node:** Daily at 9:30 AM PST (`30 9 * * *`)
- **Filter:** Query patients where:
  - Has tag `GLP1-PATIENT`
  - Does NOT have tag `SKINCARE-PATIENT`
  - `active_since` date is exactly 60 days ago

### Step-by-Step Logic

**Step 1 -- Eligibility Check**
- Confirm: `GLP1-PATIENT` + NOT `SKINCARE-PATIENT`
- Check: NOT `OPT-OUT`
- Check: NOT `SKINCARE-DECLINED`
- Check: cross_sell_count_this_month < 2

**Step 2 -- Send SMS**
```
Hi {{first_name}}, now that you're seeing amazing results on your weight loss
journey, our medical-grade skin tightening cream helps your skin keep up with
your transformation. It's pharmaceutical-grade GHK-Cu -- only available through
a medical provider. Only $149/month. Reply YES to add it! - Rina
```

**Step 3 -- Monitor for YES Reply**
- Listen for inbound SMS "YES" (case-insensitive)
- Timeout: 48 hours
- If no reply -> tag `SKINCARE-OFFERED`

**Step 4 -- On YES Reply: Process Order**
- Apply Mangomint tags: `SKINCARE-PATIENT`, `OLYMPIA-PHARMACY`, `CROSS-SELL-ACTIVE`
- Place Olympia order:
  - Product: Tighten (GHK-Cu 0.5%) 30g
  - Ship-to: patient address
- Send confirmation SMS:
  ```
  Love it {{first_name}}! Your Tighten skin tightening cream is being ordered
  now. Apply it daily to areas where you're losing weight -- you'll start
  noticing firmer skin within 2-3 weeks. Arrives in 5-7 days! - Rina
  ```

**Step 5 -- Update Revenue Tracker**
- Write to Airtable `Revenue Tracker`:
  - patient_id, product: "Tighten (GHK-Cu)", mrr_added: $149, cogs: $50, profit: $99, pharmacy: "Olympia", source: "cross-sell", date

### Error Handling

| Error | Action |
|-------|--------|
| Patient replied NO or STOP | Tag `SKINCARE-DECLINED` or `OPT-OUT` |
| Olympia order failure | Alert Rina, queue for manual order |
| SMS delivery failure | Email fallback |
| Patient already on skincare (missing tag) | Check order history to prevent duplicate |

---

## Workflow 9: `pharmacy-cost-audit`

**Trigger:** Weekly CRON -- every Monday at 9:00 AM PST
**Purpose:** Verify all orders routed to cheapest pharmacy, flag misroutes (Profit Move 10)
**Move Alignment:** Move 10 -- Pharmacy Cost Optimization Audit
**Estimated Node Count:** 20-26 nodes

### Trigger Configuration

- **Cron Node:** `0 9 * * 1` (PST / America/Los_Angeles)
- **Runs:** Every Monday at 9:00 AM Pacific

### Step-by-Step Logic

**Step 1 -- Pull All Orders from Past 7 Days**
- Query Airtable `Orders` table: `order_date >= 7_days_ago`
- Include: order_id, patient_id, medication, dose, quantity, pharmacy_source, cost, revenue

**Step 2 -- GLP-1 Routing Audit**
- Filter: all GLP-1 orders (semaglutide, tirzepatide)
- Check: pharmacy_source == `QualiphyRx Greenwich`?
- If any NOT Greenwich:
  - Flag as `MISROUTED`
  - Calculate overspend: `actual_cost - greenwich_cost`
  - Add to misroute report

**Step 3 -- NAD+/Sermorelin Routing Audit**
- Filter: all NAD+ and Sermorelin injectable orders
- Check: pharmacy_source == `Olympia`?
- If any NOT Olympia:
  - Flag as `MISROUTED`
  - Calculate overspend
  - Add to misroute report

**Step 4 -- HRT Routing Audit**
- Filter: all HRT orders (TRT, estradiol, progesterone)
- Check: pharmacy_source == `Olympia`?
- If any NOT Olympia:
  - Flag and calculate price difference vs Olympia
  - Add to misroute report

**Step 5 -- Skincare Routing Audit**
- Filter: all skincare/topical orders
- Check: pharmacy_source == `Olympia`?
- If any NOT Olympia:
  - Flag as `MISROUTED`
  - Add to misroute report

**Step 6 -- Generate Misroute Alert (if any found)**
- If misrouted orders exist:
  - Send SMS to Rina:
    ```
    WEEKLY COST AUDIT: I found {{count}} misrouted orders this week costing
    us ${{total_overspend}} in extra COGS. Check your email for the full
    breakdown. Let's fix these! - RaniOS
    ```
  - Send detailed email report with line-by-line misroute details

**Step 7 -- Generate Weekly Cost Report**
- Calculate and write to Airtable `Weekly Cost Reports` table:

| Metric | Calculation |
|--------|-------------|
| Total COGS by pharmacy | Sum of costs grouped by pharmacy |
| Total revenue by pharmacy | Sum of revenue grouped by pharmacy |
| Blended margin | (total_revenue - total_cogs) / total_revenue |
| Margin by service line | Per-service profitability |
| Savings vs single-source | What COGS would be if all went to one pharmacy |
| Misrouted order count | Count of flagged orders |
| Misrouted order cost | Total overspend from misroutes |

- Send summary to Rina via email (formatted HTML report)

### Error Handling

| Error | Action |
|-------|--------|
| No orders in past 7 days | Send "quiet week" summary, no alert |
| Airtable query failure | Retry 3x, alert Rina if persistent |
| Price data missing for comparison | Use last known price, flag for manual review |
| Report generation failure | Send raw data dump to Rina via email as fallback |

---

## Workflow 10: `revenue-dashboard-updater`

**Trigger:** Daily CRON at 11:00 PM PST
**Purpose:** Calculate daily MRR, COGS, margins across all service lines (Profit Move 10)
**Move Alignment:** Move 10 -- Revenue Intelligence Dashboard
**Estimated Node Count:** 24-30 nodes

### Trigger Configuration

- **Cron Node:** `0 23 * * *` (PST / America/Los_Angeles)
- **Runs:** Every night at 11:00 PM Pacific
- **Follow-up:** SMS summary sent at 7:00 AM next day

### Step-by-Step Logic

**Step 1 -- Count Active Patients by Pharmacy Source**
- Query Airtable `Patients` where status = `ACTIVE`
- Group by pharmacy_source:
  - QualiphyRx Greenwich: count
  - Olympia: count
  - Hallandale: count
  - In-Clinic only: count
  - Multi-source (patients using 2+ pharmacies): count

**Step 2 -- Calculate MRR by Service Line**

| Service Line | Calculation |
|-------------|-------------|
| GLP-1 (Sema) | Count of `SEMA-ACTIVE` * monthly_price |
| GLP-1 (Tirz) | Count of `TIRZ-ACTIVE` * monthly_price (by dose tier) |
| TRT | Count of `TRT-PATIENT` * $349 |
| Female HRT | Count of `HRT-FEMALE` * price |
| Peptides (Injectable) | Count of `PEPTIDE-PATIENT` (injectable) * price |
| Peptides (Troche) | Count of `TROCHE-PATIENT` * price |
| Skincare (Tighten) | Count of `SKINCARE-PATIENT` * $149 |
| ED Program | Count of `ED-PATIENT` * $149 |
| Bella #1 SR | Count of `BELLA-PATIENT` * $199 |
| Intimate Wellness | Count of `INTIMATE-WELLNESS` * $129 |
| Wellness Injections | Count of in-clinic injection appointments * avg_price |
| **Total MRR** | Sum of all above |

**Step 3 -- Calculate COGS by Pharmacy Source**

| Source | Calculation |
|--------|-------------|
| QualiphyRx Greenwich | Sum of COGS for all QualiphyRx orders this month |
| Olympia | Sum of COGS for all Olympia orders this month |
| Hallandale | Sum of COGS for all Hallandale orders this month |
| In-Clinic | Sum of supply costs for in-clinic injections |
| Loyalty Costs | Free kits, samples, etc. |
| **Total COGS** | Sum of all above |

**Step 4 -- Calculate Gross Margin by Service Line**
- For each service line: `(revenue - cogs) / revenue * 100`
- Flag any service line with margin < 50% as `LOW-MARGIN`
- Flag any service line with margin > 80% as `HIGH-MARGIN`

**Step 5 -- Track Cross-Sell Conversion Rate**
- Query `Cross-Sell Log` for current month
- Calculate: total_offers_sent, total_conversions, conversion_rate
- Break down by cross-sell rule (CS-01 through CS-08)
- Identify best-performing and worst-performing cross-sell

**Step 6 -- Track Churn Rate**
- Identify patients who were `ACTIVE` but did not refill within expected window + 14 days grace
- Calculate monthly churn rate: `churned_patients / total_active_start_of_month`
- Tag churned patients: `CHURNED-{{month}}`
- Segment churn by service line

**Step 7 -- Calculate Pipeline Value**
- Query patients by stage:
  - `INTAKE` stage: count and estimated MRR
  - `GFE-PENDING` stage: count and estimated MRR
  - `GFE-APPROVED` (not yet ordered): count and estimated MRR
  - `MED-SHIPPED` (pending activation): count and estimated MRR
- Total pipeline value = sum of estimated MRR for all pre-active patients

**Step 8 -- Write Dashboard Data to Airtable**
- Update `Dashboard` table with all calculated metrics
- Include: date, all MRR figures, all COGS figures, margins, churn, pipeline, cross-sell metrics

**Step 9 -- Send Daily Summary SMS to Rina (7:00 AM Next Day)**
- Schedule delayed SMS for 7:00 AM PST next morning:
```
Good morning Rina! Yesterday's numbers:

MRR: ${{total_mrr}}
Active patients: {{active_count}}
New intakes: {{new_intakes}}
Refills processed: {{refills_count}}
Cross-sells converted: {{cross_sell_count}}
Margin: {{blended_margin}}%

Let's get this money.
- RaniOS
```

### Airtable Dashboard Schema

| Field | Type | Description |
|-------|------|-------------|
| date | Date | Report date |
| total_mrr | Currency | Total monthly recurring revenue |
| mrr_glp1 | Currency | GLP-1 MRR |
| mrr_hrt | Currency | HRT MRR |
| mrr_peptides | Currency | Peptides MRR |
| mrr_skincare | Currency | Skincare MRR |
| mrr_ed | Currency | ED program MRR |
| mrr_bella | Currency | Bella MRR |
| mrr_other | Currency | Other services MRR |
| total_cogs | Currency | Total cost of goods sold |
| cogs_qualiphyrx | Currency | QualiphyRx COGS |
| cogs_olympia | Currency | Olympia COGS |
| cogs_hallandale | Currency | Hallandale COGS |
| cogs_inclinic | Currency | In-clinic supply costs |
| gross_margin_pct | Percent | Blended gross margin |
| active_patients | Number | Total active patients |
| new_intakes | Number | New intakes today |
| refills_processed | Number | Refills processed today |
| cross_sell_sent | Number | Cross-sell offers sent |
| cross_sell_converted | Number | Cross-sells accepted |
| cross_sell_rate | Percent | Conversion rate |
| churn_count | Number | Patients churned this month |
| churn_rate | Percent | Monthly churn rate |
| pipeline_value | Currency | Estimated MRR in pipeline |
| pipeline_count | Number | Patients in pipeline |

### Error Handling

| Error | Action |
|-------|--------|
| Airtable data incomplete | Calculate with available data, flag gaps in report |
| Division by zero (no patients in a category) | Default to 0, skip that line in report |
| SMS send failure for morning summary | Send via email instead |
| Calculation produces negative margin | Flag as `DATA-ERROR`, alert Rina, do not publish |
| Cron missed (server downtime) | Run on next available window, note gap in report |

---

## Appendix A: Complete Mangomint Tag Dictionary

| Tag | Category | Applied By | Description |
|-----|----------|-----------|-------------|
| `NEW-PATIENT` | Status | Workflow 1 | New intake received |
| `GLP1-INTAKE` | Intake | Workflow 1 | GLP-1 service requested |
| `PEPTIDE-INTAKE` | Intake | Workflow 1 | Peptide service requested |
| `HRT-INTAKE` | Intake | Workflow 1 | HRT service requested |
| `SKINCARE-INTAKE` | Intake | Workflow 1 | Skincare service requested |
| `ED-INTAKE` | Intake | Workflow 1 | ED service requested |
| `WELLNESS-INJECTION` | Intake | Workflow 1 | In-clinic injection requested |
| `IN-CLINIC` | Route | Workflow 1 | No pharmacy needed |
| `QUALIPHYRX-GREENWICH` | Pharmacy | Workflows 1, 2 | QualiphyRx Greenwich source |
| `OLYMPIA-PHARMACY` | Pharmacy | Workflows 1, 8 | Olympia Pharmacy source |
| `HALLANDALE` | Pharmacy | Workflow 7 | Hallandale Pharmacy source |
| `GFE-PENDING` | Status | Workflow 1 | Awaiting Qualiphy evaluation |
| `GFE-APPROVED` | Status | External | Qualiphy approved |
| `GLP1-PATIENT` | Active Service | Multiple | Active GLP-1 patient |
| `TIRZ-ACTIVE` | Active Service | Workflow 2 | Active tirzepatide patient |
| `TIRZ-D1` - `TIRZ-D4` | Dose | Workflow 2 | Tirzepatide dose tier |
| `SEMA-ACTIVE` | Active Service | External | Active semaglutide patient |
| `TRT-PATIENT` | Active Service | Workflow 5 | Active TRT patient |
| `HRT-FEMALE` | Active Service | External | Active female HRT patient |
| `PEPTIDE-PATIENT` | Active Service | Workflow 5 | Active peptide patient |
| `SKINCARE-PATIENT` | Active Service | Workflow 8 | Active skincare patient |
| `BELLA-PATIENT` | Active Service | Workflow 7 | Active Bella patient |
| `ED-PATIENT` | Active Service | Workflow 5 | Active ED patient |
| `INTIMATE-WELLNESS` | Active Service | Workflow 5 | Active intimate wellness |
| `TROCHE-PATIENT` | Active Service | Workflow 5 | Active troche patient |
| `CROSS-SELL-ACTIVE` | Revenue | Workflows 5, 7, 8 | Has accepted a cross-sell |
| `MED-SHIPPED` | Fulfillment | External | Medication shipped |
| `FREE-KIT-SENT` | Loyalty | Workflow 6 | Free kit already sent |
| `REFILL-REMINDER-SENT` | Refill | Workflow 4 | First reminder sent |
| `REFILL-NUDGE-SENT` | Refill | Workflow 4 | Second nudge sent |
| `REFILL-CONFIRMED` | Refill | Workflow 4 | Patient confirmed refill |
| `REFILL-LAPSED` | Churn Risk | Workflow 4 | No refill response |
| `AT-RISK` | Churn Risk | Workflow 4 | Potential churn |
| `ROUTING-REVIEW` | Alert | Workflow 3 | Misrouted order flagged |
| `ROUTING-OVERRIDE` | Alert | Workflow 3 | Override approved by Rina |
| `MANUAL-REVIEW` | Alert | Workflows 1, 3 | Needs manual review |
| `OPT-OUT` | Marketing | Workflows 5, 7, 8 | Opted out of marketing |
| `BELLA-OFFERED` | Marketing | Workflow 7 | Bella offer sent, no reply |
| `BELLA-DECLINED` | Marketing | Workflow 7 | Patient declined Bella |
| `SKINCARE-OFFERED` | Marketing | Workflow 8 | Skincare offer sent, no reply |
| `SKINCARE-DECLINED` | Marketing | Workflow 8 | Patient declined skincare |
| `DATA-INCOMPLETE` | Data Quality | Workflow 5 | Missing required patient data |
| `MISSING-PHONE` | Data Quality | Workflow 4 | No phone number on file |
| `MISSING-ADDRESS` | Data Quality | Workflow 6 | No address on file |

## Appendix B: Airtable Tables Required

| Table | Used By | Purpose |
|-------|---------|---------|
| `Patients` | All workflows | Master patient records |
| `Revenue Pipeline` | Workflow 1 | Intake tracking and revenue estimates |
| `Revenue Tracker` | Workflows 2, 7, 8 | Active revenue and COGS per patient |
| `Refill Schedule` | Workflow 2, 4 | Refill dates and reminders |
| `Refill Log` | Workflow 4 | Refill attempt history |
| `Cross-Sell Log` | Workflow 5 | Cross-sell offers and conversions |
| `Orders` | Workflows 3, 9 | All pharmacy orders |
| `COGS Tracker` | Workflow 6 | Loyalty and supply costs |
| `Routing Errors` | Workflow 3 | Misrouted order log |
| `Routing Corrections` | Workflow 3 | Auto-corrected routes |
| `Order Audit` | Workflow 3 | Clean order pass log |
| `Weekly Cost Reports` | Workflow 9 | Weekly audit summaries |
| `Dashboard` | Workflow 10 | Daily dashboard metrics |
| `Errors` | All workflows | Error and exception log |

## Appendix C: Total Estimated Node Count

| Workflow | Nodes | Complexity |
|----------|-------|-----------|
| 1. patient-intake-router | 22-26 | High |
| 2. tirz-routing-optimizer | 14-18 | Medium |
| 3. cost-routing-guard | 16-20 | Medium-High |
| 4. refill-engine | 28-34 | Very High |
| 5. cross-sell-engine | 30-38 | Very High |
| 6. free-kit-fulfillment | 10-14 | Low |
| 7. bella-upsell | 14-18 | Medium |
| 8. skincare-crosssell | 14-18 | Medium |
| 9. pharmacy-cost-audit | 20-26 | High |
| 10. revenue-dashboard-updater | 24-30 | Very High |
| **TOTAL** | **192-242** | -- |
