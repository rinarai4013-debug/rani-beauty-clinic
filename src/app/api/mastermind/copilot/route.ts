/**
 * POST /api/mastermind/copilot
 *
 * Streaming AI Copilot for Mastermind consultation sessions.
 * Sends a contextual system prompt to Claude with full session data,
 * then streams the response back as a ReadableStream.
 *
 * Body: { sessionId: string, prompt: string, context: CopilotContext }
 */

import { NextRequest } from 'next/server';
import { getAnthropicClient } from '@/lib/ai/client';
import { getSessionByIdAsync } from '@/lib/mastermind/session';
import { parseJsonBody, apiError } from '@/lib/mastermind/api-helpers';
import type { MastermindSession, AuraScanResult, MastermindPlan } from '@/types/mastermind';

type CopilotContext =
  | 'scan_review'
  | 'plan_discussion'
  | 'objection_handling'
  | 'closing'
  | 'general';

const anthropic = getAnthropicClient();

// ── SERVICE CATALOG ──

const SERVICE_CATALOG = `
RANI BEAUTY CLINIC — FULL SERVICE CATALOG & PRICING

SKIN TIGHTENING & REJUVENATION
- Sofwave (HIFU skin tightening): $2,750–$4,500 per session
- RF Microneedling: $495–$850 per session
- PRX-T33 Biorevitalization: $495 per session

FACIALS & PEELS
- HydraFacial Signature: $275 per session
- VI Peel: $395 per session

LASER TREATMENTS
- PicoWay (pigment removal): $350–$600 per session
- Laser Hair Removal: packages from $800

INJECTABLES
- Botox: consultation-based pricing
- Dermal Fillers: consultation-based pricing
- NOTE: Rani performs IM INJECTIONS only. Never use the word "infusion."

WELLNESS INJECTIONS (IM only)
- Vitamin D3: $50
- B12: $35
- Tri-Immune Boost: $75
- Glutathione: $100
- NAD+ Injection: $150–$500

WEIGHT LOSS (GLP-1)
- Tirzepatide (Mounjaro): $399–$599/mo (via QualiphyRx Greenwich)
- Semaglutide (Ozempic): $399–$599/mo (via QualiphyRx Greenwich)

HORMONE REPLACEMENT THERAPY
- Men's TRT (Testosterone): $349/mo (via Olympia)
- Women's HRT (Estradiol/Progesterone): $199–$349/mo (via Olympia)

RX SKINCARE
- GHK-Cu Tighten: $149–$199
- NADvantage Topical: $149
- Retinoids: $99–$149

SEXUAL HEALTH
- Men's ED: $149–$599/mo (via Olympia)
- Women's Wellness: $129–$149 (via Olympia)

PEPTIDE THERAPY
- NAD+ (Olympia): $299
- Sermorelin (Olympia): $299
- CJC/Ipamorelin (QualiphyRx): $349
- Sermorelin Troches (Hallandale): $199
- NAD+ Troches (Hallandale): $149

HAIR RESTORATION
- Folix Hair Restoration: consultation-based pricing

MEMBERSHIPS & FINANCING
- Monthly memberships available (details vary by tier)
- Cherry financing available for larger packages
- Package discounts for multi-treatment plans
`.trim();

// ── SYSTEM PROMPT BUILDER ──

function buildSystemPrompt(
  session: MastermindSession,
  context: CopilotContext
): string {
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;
  const intake = session.intakeData;

  let patientSection = '';
  if (intake || session.patientName) {
    patientSection = `
## PATIENT PROFILE
- Name: ${session.patientName || 'Unknown'}
- Email: ${session.patientEmail || 'Not provided'}
${intake ? formatIntakeData(intake) : '- No detailed intake data available'}
`;
  }

  let scanSection = '';
  if (scan) {
    scanSection = `
## AURA SCAN RESULTS
${formatScanResults(scan)}
`;
  }

  let planSection = '';
  if (plan) {
    planSection = `
## TREATMENT PLAN
${formatPlanData(plan)}
`;
  }

  const contextInstructions = getContextInstructions(context, session);

  return `You are the AI Copilot for Rani Beauty Clinic — a luxury medical aesthetics provider in Renton, WA. You serve as a real-time consultation assistant for the provider during patient consultations.

## YOUR ROLE
You are the provider's secret weapon during consultations. You speak DIRECTLY to the provider (not the patient). Your job is to give the provider:
- Precise talking points and scripts they can use verbatim
- Clinical insights to build patient confidence
- Strategic upsell and cross-sell opportunities
- Objection handling responses ready to deliver
- Closing techniques tailored to this specific patient

## BRAND VOICE RULES (CRITICAL)
- Luxury, confident, clinically-assured tone
- Educational and aspirational — never discount-first
- NEVER use the word "infusion" — Rani does IM INJECTIONS only. Always say "injection."
- Frame everything as a "transformation journey" not a "treatment list"
- Position Rani as the premier destination — never defensive about pricing
- Lead with clinical authority, follow with luxury experience

## SERVICE CATALOG
${SERVICE_CATALOG}

${patientSection}
${scanSection}
${planSection}

## CURRENT CONSULTATION CONTEXT
Phase: ${context.replace(/_/g, ' ').toUpperCase()}
Session Phase: ${session.phase}

${contextInstructions}

## RESPONSE FORMAT
- Be concise but thorough — the provider is reading this during a live consultation
- Use bullet points and clear structure
- Bold key phrases the provider can say verbatim (wrap in **)
- Include specific numbers (prices, percentages, timelines) whenever possible
- Always suggest at least one upsell or cross-sell opportunity
- End with a recommended next action for the provider
- Keep responses focused — max 300 words unless a detailed walkthrough is requested
`.trim();
}

// ── DATA FORMATTERS ──

function formatIntakeData(intake: Record<string, unknown>): string {
  const lines: string[] = [];
  if (intake.firstName || intake.lastName) {
    lines.push(`- Full Name: ${intake.firstName || ''} ${intake.lastName || ''}`.trim());
  }
  if (intake.age || intake.dateOfBirth) {
    lines.push(`- Age: ${intake.age || intake.dateOfBirth || 'Unknown'}`);
  }
  if (intake.skinConcerns) {
    const concerns = Array.isArray(intake.skinConcerns)
      ? intake.skinConcerns.join(', ')
      : String(intake.skinConcerns);
    lines.push(`- Primary Concerns: ${concerns}`);
  }
  if (intake.goals) {
    lines.push(`- Goals: ${Array.isArray(intake.goals) ? intake.goals.join(', ') : intake.goals}`);
  }
  if (intake.budget) {
    lines.push(`- Budget: ${intake.budget}`);
  }
  if (intake.timeline) {
    lines.push(`- Timeline: ${intake.timeline}`);
  }
  if (intake.currentSkincare) {
    lines.push(`- Current Skincare: ${intake.currentSkincare}`);
  }
  if (intake.medications) {
    lines.push(`- Medications: ${intake.medications}`);
  }
  if (intake.allergies) {
    lines.push(`- Allergies: ${intake.allergies}`);
  }
  if (intake.medicalConditions) {
    lines.push(`- Medical Conditions: ${intake.medicalConditions}`);
  }
  if (intake.previousTreatments) {
    lines.push(`- Previous Treatments: ${intake.previousTreatments}`);
  }
  if (intake.sunExposure) {
    lines.push(`- Sun Exposure: ${intake.sunExposure}`);
  }
  if (intake.smoking !== undefined) {
    lines.push(`- Smoking: ${intake.smoking ? 'Yes' : 'No'}`);
  }
  if (intake.fitzpatrickType) {
    lines.push(`- Fitzpatrick Type: ${intake.fitzpatrickType}`);
  }
  return lines.length > 0 ? lines.join('\n') : '- Intake data minimal';
}

function formatScanResults(scan: AuraScanResult): string {
  const lines: string[] = [];

  // Aura Score
  lines.push(`### Aura Score`);
  lines.push(`- Overall: ${scan.auraScore.overall}/100 (Grade: ${scan.auraScore.grade}, "${scan.auraScore.label}")`);
  lines.push(`- Skin Age: ${scan.auraScore.skinAge} | Chronological Age: ${scan.auraScore.chronologicalAge} | Delta: ${scan.auraScore.skinAgeDelta > 0 ? '+' : ''}${scan.auraScore.skinAgeDelta} years`);
  lines.push(`- Percentile: ${scan.auraScore.percentile}th (vs same age/skin type)`);

  // Score breakdown
  const bd = scan.auraScore.breakdown;
  if (bd) {
    lines.push(`\n### Score Breakdown (0-100 per dimension)`);
    for (const [key, val] of Object.entries(bd)) {
      if (typeof val === 'number') {
        lines.push(`- ${key.replace(/([A-Z])/g, ' $1').trim()}: ${val}`);
      }
    }
  }

  // AUCA device analysis
  if (scan.auraDeviceAnalysis?.categories) {
    lines.push(`\n### Device Analysis Categories`);
    for (const cat of scan.auraDeviceAnalysis.categories) {
      lines.push(`- ${cat.label}: absolute ${cat.absoluteScore}/5, peer ${cat.peerScore > 0 ? '+' : ''}${cat.peerScore}, severity: ${cat.severity} — ${cat.description}`);
    }
  }

  // Detected concerns
  if (scan.detectedConcerns.length > 0) {
    lines.push(`\n### Detected Concerns (ranked by score)`);
    for (const c of scan.detectedConcerns) {
      lines.push(`- ${String(c.concern).replace(/_/g, ' ')} — Score: ${c.score}/100, Severity: ${c.severity}, Urgency: ${c.urgency}, Trending: ${c.trending}`);
      lines.push(`  Zones: ${c.zones.join(', ')}`);
      lines.push(`  Clinical: ${c.clinicalNote}`);
    }
  }

  // Zone analysis (top 5 worst zones)
  if (scan.zoneAnalysis.length > 0) {
    const worstZones = [...scan.zoneAnalysis]
      .sort((a, b) => a.overallScore - b.overallScore)
      .slice(0, 5);
    lines.push(`\n### Worst Zones (focus areas)`);
    for (const z of worstZones) {
      lines.push(`- ${z.zoneName}: ${z.overallScore}/100 (skin age: ${z.skinAge})`);
      if (z.concerns.length > 0) {
        lines.push(`  Top concerns: ${z.concerns.map(c => `${c.type} (${c.severity}/100)`).join(', ')}`);
      }
    }
  }

  // Predictive metrics
  const pred = scan.predictiveMetrics;
  if (pred) {
    lines.push(`\n### Predictive Metrics`);
    lines.push(`WITHOUT treatment (6mo): Aura Score → ${pred.withoutIntervention.sixMonths.auraScore}, Skin Age → ${pred.withoutIntervention.sixMonths.skinAge}`);
    lines.push(`WITH treatment (6mo): Aura Score → ${pred.withTreatment.sixMonths.auraScore}, Skin Age → ${pred.withTreatment.sixMonths.skinAge}`);
    if (pred.riskFactors.length > 0) {
      lines.push(`Risk Factors: ${pred.riskFactors.map(r => `${r.factor} (${r.impact})`).join(', ')}`);
    }
  }

  // Treatment readiness
  if (scan.treatmentReadiness) {
    lines.push(`\n### Treatment Readiness`);
    lines.push(`- Ready: ${scan.treatmentReadiness.readyForTreatment ? 'Yes' : 'No'}`);
    lines.push(`- Skin Barrier: ${scan.treatmentReadiness.skinBarrierStatus}`);
    if (scan.treatmentReadiness.requiredPrep.length > 0) {
      lines.push(`- Required Prep: ${scan.treatmentReadiness.requiredPrep.join(', ')}`);
    }
    if (scan.treatmentReadiness.seasonalConsiderations.length > 0) {
      lines.push(`- Seasonal Notes: ${scan.treatmentReadiness.seasonalConsiderations.join(', ')}`);
    }
  }

  // Medical flags
  if (scan.medicalFlags.length > 0) {
    lines.push(`\n### Medical Flags`);
    for (const f of scan.medicalFlags) {
      lines.push(`- ${f.flag}: ${f.severity} — ${f.recommendation || f.action}`);
    }
  }

  return lines.join('\n');
}

function formatPlanData(plan: MastermindPlan): string {
  const lines: string[] = [];

  // AI Summary
  if (plan.aiSummary) {
    lines.push(`### AI Summary`);
    lines.push(`Provider Notes: ${plan.aiSummary.providerFacing}`);
    lines.push(`Key Highlights: ${plan.aiSummary.keyHighlights.join(' | ')}`);
    if (plan.aiSummary.addressedConcerns.length > 0) {
      lines.push(`\nConcerns Addressed:`);
      for (const ac of plan.aiSummary.addressedConcerns) {
        lines.push(`- ${ac.concern} → ${ac.solution} (${ac.timeline})`);
      }
    }
  }

  // Primary treatments
  if (plan.recommendations.primary.length > 0) {
    lines.push(`\n### Primary Treatments`);
    for (const t of plan.recommendations.primary) {
      lines.push(`- ${t.treatmentName} (${t.category})`);
      lines.push(`  ${t.sessionsRequired} sessions @ $${t.perSession}/ea = $${t.totalEstimate} total`);
      lines.push(`  Priority: ${t.priority} | Urgency: ${t.urgency} | Downtime: ${t.downtime}`);
      lines.push(`  Results in: ${t.timeToResults} | Lasts: ${t.longevity}`);
      lines.push(`  Clinical: ${t.clinicalRationale}`);
    }
  }

  // Complementary
  if (plan.recommendations.complementary.length > 0) {
    lines.push(`\n### Complementary Treatments`);
    for (const t of plan.recommendations.complementary) {
      lines.push(`- ${t.treatmentName}: $${t.totalEstimate} — ${t.clinicalRationale}`);
    }
  }

  // Maintenance
  if (plan.recommendations.maintenance.length > 0) {
    lines.push(`\n### Maintenance Treatments`);
    for (const t of plan.recommendations.maintenance) {
      lines.push(`- ${t.treatmentName}: $${t.perSession}/session — ${t.clinicalRationale}`);
    }
  }

  // Packages
  if (plan.packages.length > 0) {
    lines.push(`\n### Packages`);
    for (const pkg of plan.packages) {
      const highlighted = 'highlighted' in pkg && pkg.highlighted ? ' ★ RECOMMENDED' : '';
      const pkgTotal = pkg.totalPrice ?? pkg.price;
      lines.push(`- ${pkg.name}${highlighted}: $${pkgTotal} (${pkg.discount || 0}% savings)`);
      if ('services' in pkg && Array.isArray(pkg.services)) {
        lines.push(`  Includes: ${pkg.services.map((s: { name?: string }) => s.name || 'treatment').join(', ')}`);
      }
      lines.push(`  Monthly financing: ~$${Math.round(pkgTotal / 24)}/mo (24mo) or ~$${Math.round(pkgTotal / 12)}/mo (12mo)`);
    }
  }

  // Sequencing
  if (plan.sequencing.length > 0) {
    lines.push(`\n### Treatment Sequencing`);
    for (const phase of plan.sequencing) {
      lines.push(`- Phase ${phase.phase} (${phase.phaseName}, ${phase.duration}): ${phase.expectedMilestone}`);
    }
  }

  // Contraindications
  if (plan.contraindications.length > 0) {
    lines.push(`\n### Contraindications`);
    for (const c of plan.contraindications) {
      lines.push(`- ${c.condition || c.treatment}: ${c.severity} — ${c.recommendation}`);
    }
  }

  return lines.join('\n');
}

// ── CONTEXT-SPECIFIC INSTRUCTIONS ──

function getContextInstructions(context: CopilotContext, session: MastermindSession): string {
  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;

  switch (context) {
    case 'scan_review':
      return `
## SCAN REVIEW INSTRUCTIONS
The provider is reviewing the Aura Scan results with the patient. Focus on:
1. How to explain the Aura Score in a compelling but non-alarming way
2. Key zones and concerns to highlight — lead with the most impactful visually
3. The skin age gap as a motivational tool (not fear-based)
4. Predictive metrics: "Here's what happens if we act now vs. wait"
5. Transition language from scan review into treatment plan discussion
6. Any medical flags the provider needs to address before proceeding

Tone: Clinical authority meets luxury reassurance. The scan is a "clarity moment" — not a diagnosis of doom.
`;

    case 'plan_discussion':
      return `
## PLAN DISCUSSION INSTRUCTIONS
The provider is presenting the treatment plan. Focus on:
1. Walk-through script: how to present each treatment and why it was selected
2. Package comparison strategy — always present the recommended (Transform) package first
3. Value framing: cost per result, cost of delay, comparison to alternatives
4. ${plan ? `Budget alignment: the patient's intake suggests their budget is around "${session.intakeData?.budget || 'not specified'}". Suggest how to position packages within or just above this range.` : 'No plan data yet — suggest the provider complete the plan generation first.'}
5. Financing pitch: Cherry financing makes any package accessible at $X/month
6. Cross-sell opportunities based on the patient's specific concerns
7. How to sequence the conversation: lead with clinical rationale, then results timeline, then pricing

Tone: Confident recommendation, not a sales pitch. "Based on your scan, here's what I recommend..."
`;

    case 'objection_handling':
      return `
## OBJECTION HANDLING INSTRUCTIONS
The provider needs help responding to patient hesitation. Focus on:
1. Provide word-for-word response scripts the provider can deliver naturally
2. Use these techniques: feel-felt-found, reframe, social proof, normalize, urgency, value comparison
3. NEVER suggest discounting — reframe value instead
4. Common objections to be ready for:
   - "Too expensive" → reframe as cost per month, cost of delay, value vs. OTC products
   - "Need to think about it" → trial close with first session, urgency of skin age
   - "Is this safe?" → FDA clearance, clinical studies, provider expertise
   - "Does it hurt?" → comfort protocols, numbing, sequential comfort building
   - "How long until results?" → specific timelines from the plan, milestone preview
5. After handling each objection, suggest a natural bridge back to the close

Tone: Empathetic but unwavering confidence. Never defensive. "I completely understand, and here's what I want you to know..."
`;

    case 'closing':
      return `
## CLOSING INSTRUCTIONS
The provider is ready to close. Focus on:
1. Specific closing techniques tailored to this patient's profile and concerns
2. Assumptive close scripts: "Let's get you scheduled..."
3. Choice close: give two options (not yes/no)
4. Future pacing: paint the picture of their transformation ${scan ? `("Imagine your Aura Score going from ${scan.auraScore.overall} to ${scan.predictiveMetrics.withTreatment.sixMonths.auraScore} in six months")` : ''}
5. Membership pitch if applicable — recurring revenue lock-in
6. Financing breakdown with specific monthly numbers
7. "Today-only" urgency that feels authentic (schedule availability, treatment sequencing timeline)
8. If the patient is still hesitant: suggest booking just the first treatment as a trial

Tone: Warm but decisive. The provider should project absolute certainty that this is the right path.
`;

    case 'general':
    default:
      return `
## GENERAL COPILOT INSTRUCTIONS
Respond to whatever the provider asks. You have full access to the patient's scan data, treatment plan, and intake information. Be ready to:
- Answer clinical questions about treatment combinations
- Provide talking points on any topic
- Suggest upsell/cross-sell opportunities
- Draft objection responses on the fly
- Help with financing calculations
- Provide aftercare information
- Suggest next steps

Always be specific and actionable. Reference the patient's actual data in your responses.
`;
  }
}

// ── ROUTE HANDLER ──

export async function POST(request: NextRequest) {
  try {
    const parsed = await parseJsonBody(request);
    if ('error' in parsed) return parsed.error;
    const { body } = parsed;

    const sessionId = typeof body?.sessionId === 'string' ? body.sessionId : null;
    const prompt = typeof body?.prompt === 'string' ? body.prompt : null;
    const context = (typeof body?.context === 'string' ? body.context : 'general') as CopilotContext;

    if (!sessionId) {
      return apiError('Missing sessionId', 400);
    }
    if (!prompt) {
      return apiError('Missing prompt', 400);
    }

    // Validate context
    const validContexts: CopilotContext[] = ['scan_review', 'plan_discussion', 'objection_handling', 'closing', 'general'];
    if (!validContexts.includes(context)) {
      return apiError('Invalid context. Must be one of: scan_review, plan_discussion, objection_handling, closing, general', 400);
    }

    // Load session
    const session = await getSessionByIdAsync(sessionId);
    if (!session) {
      return apiError('Session not found', 404);
    }

    // Build the system prompt with full session context
    const systemPrompt = buildSystemPrompt(session, context);

    // Create streaming response from Claude
    const stream = await anthropic.messages.stream({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Convert the Anthropic stream to a ReadableStream
    const readableStream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        try {
          for await (const event of stream) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              controller.enqueue(encoder.encode(event.delta.text));
            }
          }
          controller.close();
        } catch (err) {
          controller.error(err);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (err) {
    console.error('[Copilot API Error]', err);
    return apiError('Failed to generate copilot response', 500);
  }
}
