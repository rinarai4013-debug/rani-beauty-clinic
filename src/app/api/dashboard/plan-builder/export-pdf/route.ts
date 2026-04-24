import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { getSession } from '@/lib/auth/session';
import { Tables } from '@/lib/airtable/client';

import { withSentry } from '@/lib/sentry-utils';
export const dynamic = 'force-dynamic';
export const revalidate = 0;


const LineItemSchema = z.object({
  service: z.string(),
  qty: z.number(),
  unitPrice: z.number(),
  total: z.number(),
});

const PackageSchema = z.object({
  tier: z.enum(['Start', 'Transform', 'Elite']),
  name: z.string(),
  price: z.number(),
  originalPrice: z.number(),
  discount: z.number(),
  sessions: z.number(),
  lineItems: z.array(LineItemSchema),
  monthlyPayment12: z.number(),
  monthlyPayment24: z.number(),
  highlighted: z.boolean(),
  extras: z.array(z.string()),
  subtitle: z.string().optional(),
  bestFor: z.string().optional(),
  resultIntensity: z.string().optional(),
  whyBest: z.string().optional(),
  savingsVsStandalone: z.number().optional(),
  concernsAddressed: z.array(z.string()).optional(),
});

const PhaseServiceSchema = z.object({
  name: z.string(),
  price: z.number(),
  quantity: z.number(),
  sessions: z.number(),
  notes: z.string().optional(),
  purpose: z.string().optional(),
  cadence: z.string().optional(),
  visibleImprovement: z.string().optional(),
});

const PhaseSchema = z.object({
  id: z.number(),
  label: z.string(),
  services: z.array(PhaseServiceSchema),
  why: z.string().optional(),
});

const PlanDataSchema = z.object({
  clientName: z.string().min(1),
  planName: z.string().optional().default('Custom Treatment Plan'),
  phases: z.array(PhaseSchema),
  packages: z.array(PackageSchema),
  providerName: z.string().optional(),
  concerns: z.array(z.string()).optional(),
  planObjective: z.string().optional(),
  aftercareNotes: z.array(z.string()).optional(),
});

const RequestSchema = z.object({
  planId: z.string().optional(),
  planData: PlanDataSchema.optional(),
});

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatCurrency(amount: number): string {
  return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

// ─── Cover Page ─────────────────────────────────────────────────────

function buildCoverPage(data: z.infer<typeof PlanDataSchema>, dateStr: string): string {
  const provider = data.providerName ? escapeHtml(data.providerName) : 'Your Provider';
  return `
    <div style="page-break-after: always; background: #0F1D2C; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; padding: 80px 60px; margin: -0.5in; margin-bottom: 0;">
      <div style="border: 1px solid rgba(201,169,110,0.3); padding: 80px 60px; border-radius: 2px; max-width: 600px; width: 100%;">
        <div style="width: 60px; height: 1px; background: #C9A96E; margin: 0 auto 40px;"></div>
        <div style="font-family: 'Playfair Display', serif; font-size: 36px; font-weight: 700; color: #C9A96E; letter-spacing: 3px; line-height: 1.2;">
          RANI BEAUTY<br>CLINIC
        </div>
        <div style="font-family: 'Montserrat', sans-serif; font-size: 10px; color: rgba(201,169,110,0.7); text-transform: uppercase; letter-spacing: 4px; margin-top: 12px;">
          Luxury Medical Aesthetics
        </div>
        <div style="width: 60px; height: 1px; background: #C9A96E; margin: 40px auto;"></div>
        <div style="font-family: 'Playfair Display', serif; font-size: 42px; font-weight: 400; color: #FFFFFF; line-height: 1.2; margin-bottom: 16px;">
          ${escapeHtml(data.clientName)}
        </div>
        <div style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: rgba(255,255,255,0.6); letter-spacing: 1px; margin-bottom: 40px;">
          Your Personalized Treatment Plan
        </div>
        <div style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: rgba(255,255,255,0.4);">
          ${dateStr}
        </div>
        <div style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: rgba(255,255,255,0.4); margin-top: 6px;">
          Prepared by ${provider}
        </div>
      </div>
    </div>`;
}

// ─── Concern Summary ────────────────────────────────────────────────

function buildConcernSummary(concerns: string[]): string {
  if (!concerns || concerns.length === 0) return '';

  const pills = concerns
    .map(
      (c) => `
      <span style="display: inline-block; background: #F8F6F1; color: #0F1D2C; font-family: 'Montserrat', sans-serif; font-size: 12px; font-weight: 500; padding: 8px 20px; border-radius: 100px; margin: 4px 6px; border: 1px solid #E8E4DE;">
        ${escapeHtml(c.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()))}
      </span>`,
    )
    .join('');

  return `
    <div style="margin-bottom: 40px; page-break-inside: avoid;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #0F1D2C; margin-bottom: 4px;">
        We Listened.
      </h2>
      <p style="font-family: 'Playfair Display', serif; font-size: 16px; color: #888; font-style: italic; margin-bottom: 16px;">
        Here&rsquo;s what we heard.
      </p>
      <div style="text-align: center; padding: 16px 0;">
        ${pills}
      </div>
    </div>`;
}

// ─── Plan Objective ─────────────────────────────────────────────────

function buildObjective(objective?: string): string {
  if (!objective) return '';
  return `
    <div style="margin-bottom: 40px; padding: 24px 32px; background: #F8F6F1; border-left: 3px solid #C9A96E; border-radius: 0 8px 8px 0; page-break-inside: avoid;">
      <p style="font-family: 'Playfair Display', serif; font-size: 16px; color: #0F1D2C; line-height: 1.6; margin: 0;">
        ${escapeHtml(objective)}
      </p>
    </div>`;
}

// ─── Phase Timeline Visual ──────────────────────────────────────────

function buildTimeline(phases: z.infer<typeof PhaseSchema>[]): string {
  const activePhasesData = phases.filter((p) => p.services.length > 0);
  if (activePhasesData.length === 0) return '';

  const monthLabels = ['Month 1', 'Month 2', 'Month 3+'];
  const phaseBlocks = activePhasesData
    .map((phase, idx) => {
      const serviceNames = phase.services.map((s) => escapeHtml(s.name)).join('<br>');
      const isLast = idx === activePhasesData.length - 1;
      return `
        <div style="flex: 1; text-align: center; position: relative;">
          <div style="width: 16px; height: 16px; border-radius: 50%; background: #C9A96E; margin: 0 auto 12px; position: relative; z-index: 1;"></div>
          ${
            !isLast
              ? '<div style="position: absolute; top: 8px; left: calc(50% + 8px); right: -50%; height: 2px; background: linear-gradient(to right, #C9A96E, #E8E4DE); z-index: 0;"></div>'
              : ''
          }
          <div style="font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; color: #C9A96E; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 6px;">
            ${monthLabels[idx] || `Month ${idx + 1}`}
          </div>
          <div style="font-family: 'Playfair Display', serif; font-size: 13px; color: #0F1D2C; font-weight: 600; margin-bottom: 4px;">
            Phase ${phase.id}: ${escapeHtml(phase.label)}
          </div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #888; line-height: 1.5;">
            ${serviceNames}
          </div>
        </div>`;
    })
    .join('');

  return `
    <div style="margin-bottom: 48px; padding: 32px 24px; background: #FFFFFF; border: 1px solid #E8E4DE; border-radius: 12px; page-break-inside: avoid;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 18px; color: #0F1D2C; text-align: center; margin-bottom: 32px;">
        Your Treatment Timeline
      </h2>
      <div style="display: flex; gap: 16px; align-items: flex-start; padding: 0 16px;">
        ${phaseBlocks}
      </div>
    </div>`;
}

// ─── Phase Section ──────────────────────────────────────────────────

function buildPhaseSection(phase: z.infer<typeof PhaseSchema>): string {
  if (phase.services.length === 0) return '';

  const treatmentCards = phase.services
    .map(
      (svc) => `
      <div style="background: #FFFFFF; border: 1px solid #E8E4DE; border-radius: 10px; padding: 20px; margin-bottom: 12px; page-break-inside: avoid;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
          <h4 style="font-family: 'Playfair Display', serif; font-size: 15px; color: #0F1D2C; margin: 0; font-weight: 600;">
            ${escapeHtml(svc.name)}
          </h4>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 14px; color: #C9A96E; font-weight: 600; white-space: nowrap; margin-left: 16px;">
            ${formatCurrency(svc.price)}${svc.quantity * svc.sessions > 1 ? ` <span style="font-size: 11px; color: #999; font-weight: 400;">&times; ${svc.quantity * svc.sessions}</span>` : ''}
          </div>
        </div>
        ${
          svc.purpose || svc.notes
            ? `<p style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: #666; line-height: 1.5; margin: 0 0 8px;">
          <strong style="color: #0F1D2C;">Purpose:</strong> ${escapeHtml(svc.purpose || svc.notes || '')}
        </p>`
            : ''
        }
        ${
          svc.cadence
            ? `<p style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #888; margin: 0 0 4px;">
          <strong style="color: #555;">Cadence:</strong> ${escapeHtml(svc.cadence)}
        </p>`
            : ''
        }
        ${
          svc.visibleImprovement
            ? `<p style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #888; margin: 0;">
          <strong style="color: #555;">Visible improvement starts:</strong> ${escapeHtml(svc.visibleImprovement)}
        </p>`
            : ''
        }
      </div>`,
    )
    .join('');

  return `
    <div style="margin-bottom: 36px; page-break-inside: avoid;">
      <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 16px;">
        <div style="width: 36px; height: 36px; border-radius: 50%; background: #0F1D2C; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">
          <span style="font-family: 'Montserrat', sans-serif; font-size: 14px; font-weight: 700; color: #C9A96E;">${phase.id}</span>
        </div>
        <div>
          <h3 style="font-family: 'Playfair Display', serif; font-size: 18px; color: #0F1D2C; margin: 0;">
            ${escapeHtml(phase.label)}
          </h3>
          ${
            phase.why
              ? `<p style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: #888; margin: 2px 0 0; font-style: italic;">
            ${escapeHtml(phase.why)}
          </p>`
              : ''
          }
        </div>
      </div>
      ${treatmentCards}
    </div>`;
}

// ─── Package Cards ──────────────────────────────────────────────────

function buildPackageCards(packages: z.infer<typeof PackageSchema>[]): string {
  if (packages.length === 0) return '';

  const tierMap: Record<string, { label: string; accent: string }> = {
    Start: { label: 'Start', accent: '#888' },
    Essential: { label: 'Start', accent: '#888' },
    Transform: { label: 'Transform', accent: '#C9A96E' },
    Recommended: { label: 'Transform', accent: '#C9A96E' },
    Elite: { label: 'Elite', accent: '#0F1D2C' },
    Platinum: { label: 'Elite', accent: '#0F1D2C' },
  };

  const cards = packages
    .map((pkg) => {
      const isTransform = pkg.highlighted;
      const tier = tierMap[pkg.tier] || { label: pkg.tier, accent: '#888' };
      const borderColor = isTransform ? '#C9A96E' : '#E8E4DE';
      const headerBg = isTransform ? '#0F1D2C' : '#FAFAF8';
      const headerColor = isTransform ? '#FFFFFF' : '#0F1D2C';

      const lineItemsHtml = pkg.lineItems
        .map(
          (li) => `
          <div style="display: flex; justify-content: space-between; padding: 4px 0; font-family: 'Montserrat', sans-serif; font-size: 11px; color: #666;">
            <span>${escapeHtml(li.service)} &times; ${li.qty}</span>
            <span>${formatCurrency(li.total)}</span>
          </div>`,
        )
        .join('');

      const extrasHtml =
        pkg.extras.length > 0
          ? pkg.extras
              .map(
                (e) =>
                  `<div style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #C9A96E; margin-bottom: 2px;">+ ${escapeHtml(e)}</div>`,
              )
              .join('')
          : '';

      return `
        <div style="border: ${isTransform ? '2px' : '1px'} solid ${borderColor}; border-radius: 12px; overflow: hidden; flex: 1; min-width: 210px; max-width: 260px;${isTransform ? ' box-shadow: 0 8px 24px rgba(201,169,110,0.15);' : ''}">
          <div style="background: ${headerBg}; padding: 20px 16px; text-align: center;">
            ${isTransform ? '<div style="font-family: \'Montserrat\', sans-serif; font-size: 9px; font-weight: 700; color: #C9A96E; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 6px;">Most Popular</div>' : ''}
            <div style="font-family: 'Playfair Display', serif; font-size: 20px; color: ${headerColor}; font-weight: 700;">
              ${escapeHtml(pkg.name)}
            </div>
            ${pkg.subtitle ? `<div style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: ${isTransform ? 'rgba(255,255,255,0.6)' : '#888'}; margin-top: 4px;">${escapeHtml(pkg.subtitle)}</div>` : ''}
            ${pkg.bestFor ? `<div style="font-family: 'Montserrat', sans-serif; font-size: 10px; color: ${isTransform ? 'rgba(255,255,255,0.5)' : '#aaa'}; margin-top: 4px;">Best for: ${escapeHtml(pkg.bestFor)}</div>` : ''}
          </div>
          <div style="padding: 20px 16px;">
            <div style="text-align: center; margin-bottom: 16px;">
              ${pkg.discount > 0 ? `<span style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: #bbb; text-decoration: line-through;">${formatCurrency(pkg.originalPrice)}</span><br>` : ''}
              <span style="font-family: 'Playfair Display', serif; font-size: 32px; font-weight: 700; color: #0F1D2C;">${formatCurrency(pkg.price)}</span>
              ${pkg.discount > 0 ? `<div style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #C9A96E; font-weight: 600; margin-top: 2px;">Save ${formatCurrency(pkg.savingsVsStandalone || Math.round((pkg.originalPrice * pkg.discount) / 100))}</div>` : ''}
            </div>
            ${pkg.resultIntensity ? `<div style="text-align: center; margin-bottom: 12px;"><span style="font-family: 'Montserrat', sans-serif; font-size: 10px; color: #0F1D2C; background: #F8F6F1; padding: 4px 12px; border-radius: 100px;">${escapeHtml(pkg.resultIntensity)}</span></div>` : ''}
            <div style="border-top: 1px solid #E8E4DE; padding-top: 12px; margin-bottom: 12px;">
              ${lineItemsHtml}
            </div>
            ${extrasHtml ? `<div style="border-top: 1px solid #E8E4DE; padding-top: 8px; margin-bottom: 12px;">${extrasHtml}</div>` : ''}
            <div style="border-top: 1px solid #E8E4DE; padding-top: 12px; text-align: center;">
              <div style="font-family: 'Montserrat', sans-serif; font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px;">Monthly from</div>
              <div style="font-family: 'Montserrat', sans-serif; font-size: 18px; color: #0F1D2C; font-weight: 700;">
                ${formatCurrency(pkg.monthlyPayment12)}/mo
              </div>
              <div style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #999;">
                or ${formatCurrency(pkg.monthlyPayment24)}/mo over 24 mo
              </div>
            </div>
          </div>
          ${
            isTransform && pkg.whyBest
              ? `<div style="background: #FBF8F3; padding: 12px 16px; border-top: 1px solid #E8E4DE;">
            <p style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #0F1D2C; margin: 0; line-height: 1.5; text-align: center; font-style: italic;">${escapeHtml(pkg.whyBest)}</p>
          </div>`
              : ''
          }
        </div>`;
    })
    .join('');

  return `
    <div style="margin-bottom: 48px; page-break-inside: avoid;" class="page-break">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #0F1D2C; margin-bottom: 6px;">
        Your Investment Options
      </h2>
      <p style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: #888; margin-bottom: 24px;">
        Choose the plan that fits your goals and budget. Every option delivers real results.
      </p>
      <div style="display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
        ${cards}
      </div>
    </div>`;
}

// ─── Financing Section ──────────────────────────────────────────────

function buildFinancingSection(packages: z.infer<typeof PackageSchema>[]): string {
  const rows = packages
    .map(
      (pkg) => `
      <tr>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E8E4DE; font-family: 'Montserrat', sans-serif; font-size: 13px; color: #0F1D2C; font-weight: 600;">
          ${escapeHtml(pkg.name)}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E8E4DE; font-family: 'Montserrat', sans-serif; font-size: 13px; color: #333; text-align: center;">
          ${formatCurrency(pkg.price)}
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E8E4DE; font-family: 'Montserrat', sans-serif; font-size: 13px; color: #333; text-align: center;">
          ${formatCurrency(pkg.monthlyPayment12)}/mo
        </td>
        <td style="padding: 10px 14px; border-bottom: 1px solid #E8E4DE; font-family: 'Montserrat', sans-serif; font-size: 13px; color: #333; text-align: center;">
          ${formatCurrency(pkg.monthlyPayment24)}/mo
        </td>
      </tr>`,
    )
    .join('');

  return `
    <div style="margin-bottom: 48px; page-break-inside: avoid;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #0F1D2C; margin-bottom: 20px;">
        Flexible Financing
      </h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
        <thead>
          <tr style="background: #0F1D2C;">
            <th style="padding: 10px 14px; text-align: left; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.5px;">Package</th>
            <th style="padding: 10px 14px; text-align: center; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.5px;">Total</th>
            <th style="padding: 10px 14px; text-align: center; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.5px;">Cherry (12 mo)</th>
            <th style="padding: 10px 14px; text-align: center; font-family: 'Montserrat', sans-serif; font-size: 11px; font-weight: 600; color: #C9A96E; text-transform: uppercase; letter-spacing: 0.5px;">PatientFi (24 mo)</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="display: flex; gap: 24px;">
        <div style="flex: 1; background: #F8F6F1; border-radius: 8px; padding: 16px;">
          <div style="font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600; color: #0F1D2C; margin-bottom: 4px;">Cherry</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #666; line-height: 1.6;">0% APR plans available. Apply in minutes with no impact to your credit score.</div>
        </div>
        <div style="flex: 1; background: #F8F6F1; border-radius: 8px; padding: 16px;">
          <div style="font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600; color: #0F1D2C; margin-bottom: 4px;">PatientFi</div>
          <div style="font-family: 'Montserrat', sans-serif; font-size: 11px; color: #666; line-height: 1.6;">Affordable monthly payments with flexible terms up to 24 months.</div>
        </div>
      </div>
    </div>`;
}

// ─── Aftercare ──────────────────────────────────────────────────────

function buildAftercare(
  aftercareNotes: string[] | undefined,
  phases: z.infer<typeof PhaseSchema>[],
): string {
  // Generate default aftercare based on service categories if none provided
  const notes =
    aftercareNotes && aftercareNotes.length > 0 ? aftercareNotes : generateDefaultAftercare(phases);
  if (notes.length === 0) return '';

  const items = notes
    .map(
      (note) => `
      <div style="display: flex; align-items: flex-start; gap: 10px; margin-bottom: 10px;">
        <div style="width: 6px; height: 6px; border-radius: 50%; background: #C9A96E; margin-top: 6px; flex-shrink: 0;"></div>
        <p style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: #555; line-height: 1.6; margin: 0;">
          ${escapeHtml(note)}
        </p>
      </div>`,
    )
    .join('');

  return `
    <div style="margin-bottom: 48px; page-break-inside: avoid;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 20px; color: #0F1D2C; margin-bottom: 16px;">
        Aftercare Overview
      </h2>
      <div style="background: #F8F6F1; border-radius: 10px; padding: 24px;">
        ${items}
      </div>
    </div>`;
}

function generateDefaultAftercare(phases: z.infer<typeof PhaseSchema>[]): string[] {
  const serviceNames = phases.flatMap((p) => p.services.map((s) => s.name.toLowerCase()));
  const notes: string[] = [];
  const seen = new Set<string>();

  function add(category: string, note: string) {
    if (!seen.has(category)) {
      seen.add(category);
      notes.push(note);
    }
  }

  for (const name of serviceNames) {
    if (name.includes('hydrafacial'))
      add(
        'facial',
        'After facial treatments: avoid direct sun exposure for 24 hours. Apply SPF 30+ daily.',
      );
    if (name.includes('rf microneedling') || name.includes('microneedling'))
      add(
        'microneedling',
        'After RF microneedling: expect mild redness for 24-48 hours. Avoid makeup and active ingredients for 48 hours.',
      );
    if (name.includes('sofwave'))
      add(
        'sofwave',
        'After Sofwave: minimal downtime. Mild swelling may occur for 1-2 days. Results develop over 3-6 months.',
      );
    if (name.includes('vi peel') || name.includes('biorepeel') || name.includes('prx'))
      add(
        'peel',
        'After chemical peels: do not pick or peel flaking skin. Keep skin moisturized and use gentle cleanser only.',
      );
    if (name.includes('botox'))
      add(
        'botox',
        'After Botox: avoid lying down for 4 hours. Do not rub the treated area. Full results visible in 7-14 days.',
      );
    if (name.includes('filler'))
      add(
        'filler',
        'After dermal fillers: apply ice to reduce swelling. Avoid strenuous exercise for 24 hours. Minor bruising is normal.',
      );
    if (name.includes('laser'))
      add(
        'laser',
        'After laser treatments: avoid sun exposure and tanning for 2 weeks. Apply SPF 50+ religiously.',
      );
    if (name.includes('tretinoin'))
      add(
        'tretinoin',
        'Tretinoin: start every other night, increase to nightly as tolerated. Always pair with moisturizer and daily SPF.',
      );
  }

  if (notes.length === 0) {
    notes.push('Apply broad-spectrum SPF 30+ sunscreen daily, even on cloudy days.');
    notes.push('Stay hydrated and maintain a consistent skincare routine between treatments.');
    notes.push('Contact our clinic if you experience any unexpected reactions.');
  }

  return notes;
}

// ─── Next Step CTA ──────────────────────────────────────────────────

function buildNextStep(): string {
  return `
    <div style="margin-bottom: 48px; text-align: center; page-break-inside: avoid;">
      <div style="background: #0F1D2C; border-radius: 12px; padding: 40px 32px;">
        <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #FFFFFF; margin-bottom: 8px;">
          Ready to Begin?
        </h2>
        <p style="font-family: 'Montserrat', sans-serif; font-size: 13px; color: rgba(255,255,255,0.6); margin-bottom: 24px; line-height: 1.6;">
          Book your consultation and take the first step toward your transformation.
        </p>
        <div style="display: inline-block; background: #C9A96E; color: #0F1D2C; font-family: 'Montserrat', sans-serif; font-size: 13px; font-weight: 600; padding: 14px 40px; border-radius: 8px; letter-spacing: 0.5px;">
          ranibeautyclinic.com &nbsp;|&nbsp; (425) 539-4440
        </div>
      </div>
    </div>`;
}

// ─── Page Footer ────────────────────────────────────────────────────

function buildFooterStyles(): string {
  return `
    @page {
      margin: 0.6in 0.5in 0.8in 0.5in;
      size: letter;
      @bottom-center {
        content: "Rani Beauty Clinic | 401 Olympia Ave NE, Suite 101, Renton, WA 98056 | (425) 539-4440";
        font-family: 'Montserrat', sans-serif;
        font-size: 8px;
        color: #999;
      }
    }`;
}

function buildRunningFooter(): string {
  return `
    <div style="position: fixed; bottom: 0; left: 0; right: 0; text-align: center; padding: 12px 0; font-family: 'Montserrat', sans-serif; font-size: 9px; color: #bbb; border-top: 1px solid #E8E4DE; background: #fff;">
      Rani Beauty Clinic &nbsp;&middot;&nbsp; 401 Olympia Ave NE, Suite 101, Renton, WA 98056 &nbsp;&middot;&nbsp; (425) 539-4440
    </div>`;
}

// ─── Full HTML Build ────────────────────────────────────────────────

function buildPlanHtml(data: z.infer<typeof PlanDataSchema>): string {
  const today = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Treatment Plan - ${escapeHtml(data.clientName)} | Rani Beauty Clinic</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Montserrat:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Montserrat', sans-serif;
      color: #333;
      background: #fff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }
    @media print {
      body { background: #fff; }
      .no-print { display: none !important; }
      .page-break { page-break-before: always; }
      .avoid-break { page-break-inside: avoid; }
      ${buildFooterStyles()}
    }
    @media screen {
      body { max-width: 850px; margin: 0 auto; padding: 40px 24px; background: #FAF8F5; }
    }
  </style>
</head>
<body>
  <!-- Print button (screen only) -->
  <div class="no-print" style="text-align: center; margin-bottom: 24px;">
    <button onclick="window.print()" style="
      font-family: 'Montserrat', sans-serif;
      font-size: 14px;
      font-weight: 600;
      color: #fff;
      background: #0F1D2C;
      border: none;
      padding: 14px 40px;
      border-radius: 8px;
      cursor: pointer;
      letter-spacing: 0.5px;
    ">
      Print / Save as PDF
    </button>
  </div>

  <!-- Cover Page -->
  ${buildCoverPage(data, today)}

  <!-- Content Pages -->
  <div style="padding: 40px 0;">

    <!-- Concern Summary -->
    ${buildConcernSummary(data.concerns || [])}

    <!-- Plan Objective -->
    ${buildObjective(data.planObjective)}

    <!-- Phase Timeline -->
    ${buildTimeline(data.phases)}

    <!-- Detailed Phases -->
    <div style="margin-bottom: 48px;">
      <h2 style="font-family: 'Playfair Display', serif; font-size: 22px; color: #0F1D2C; margin-bottom: 24px; padding-bottom: 8px; border-bottom: 1px solid #E8E4DE;">
        Your Treatment Plan
      </h2>
      ${data.phases
        .filter((p) => p.services.length > 0)
        .map((p) => buildPhaseSection(p))
        .join('')}
    </div>

    <!-- Package Options -->
    ${buildPackageCards(data.packages)}

    <!-- Financing -->
    ${data.packages.length > 0 ? buildFinancingSection(data.packages) : ''}

    <!-- Aftercare -->
    ${buildAftercare(data.aftercareNotes, data.phases)}

    <!-- Next Step CTA -->
    ${buildNextStep()}

    <!-- Final Footer -->
    <div style="border-top: 2px solid #C9A96E; padding-top: 24px; text-align: center;">
      <div style="font-family: 'Playfair Display', serif; font-size: 18px; font-weight: 600; color: #0F1D2C; margin-bottom: 8px;">
        Rani Beauty Clinic
      </div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 12px; color: #888; line-height: 1.8;">
        401 Olympia Ave NE, Suite 101, Renton, WA 98056<br>
        (425) 539-4440 &middot; info@ranibeautyclinic.com<br>
        ranibeautyclinic.com
      </div>
      <div style="font-family: 'Montserrat', sans-serif; font-size: 10px; color: #bbb; margin-top: 12px;">
        This treatment plan is personalized to your goals and may be adjusted during your consultation.
        Pricing is valid for 30 days from the date of this plan.
      </div>
    </div>

  </div>
  ${buildRunningFooter()}
</body>
</html>`;
}

export async function POST(request: NextRequest) {
  return withSentry('dashboard/plan-builder/export-pdf', async () => {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const body = await request.json().catch(() => null);

      if (!body) {
        return NextResponse.json(
          { error: 'Invalid request data', details: { body: ['Invalid JSON'] } },
          { status: 400 },
        );
      }

      const parsed = RequestSchema.safeParse(body);

      if (!parsed.success) {
        return NextResponse.json(
          { error: 'Invalid request data', details: parsed.error.flatten() },
          { status: 400 },
        );
      }

      let planData: z.infer<typeof PlanDataSchema>;

      if (parsed.data.planData) {
        planData = parsed.data.planData;
      } else if (parsed.data.planId) {
        // Fetch from Airtable
        const record = await Tables.treatmentPlans().find(parsed.data.planId);
        const fields = record.fields as Record<string, unknown>;
        const servicesJson = fields['Services Included'] as string;
        const servicesData = JSON.parse(servicesJson);

        planData = {
          clientName: (fields['Client Name'] as string) || 'Client',
          planName: (fields['Plan Name'] as string) || 'Custom Treatment Plan',
          phases: servicesData.phases || [],
          packages: servicesData.packages || [],
          providerName: servicesData.providerName,
          concerns: servicesData.concerns,
          planObjective: servicesData.planObjective,
          aftercareNotes: servicesData.aftercareNotes,
        };
      } else {
        return NextResponse.json(
          { error: 'Either planId or planData is required' },
          { status: 400 },
        );
      }

      const html = buildPlanHtml(planData);

      return NextResponse.json({ html });
    } catch (error) {
      console.error('[Export PDF API] Error:', error);
      return NextResponse.json({ error: 'Failed to generate plan document' }, { status: 500 });
    }
  });
}
