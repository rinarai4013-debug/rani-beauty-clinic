/**
 * PDF Generator — Branded Consultation Plan PDF
 *
 * Generates a treatment plan PDF from MastermindSession data.
 * Returns an HTML string that the API route converts to PDF
 * via a headless renderer (or serves as a printable page).
 *
 * All data is read from MastermindSession — no external fetching.
 */

import type { MastermindSession, AuraScanResult, MastermindPlan, MastermindTreatment } from '@/types/mastermind';
import { generateProtocolPacket } from './protocol-packet';
import type { ProtocolPacketResult } from './protocol-packet';
import type { GeneratedPackage } from '@/lib/plan-builder/types';
import { getSelectedPackage, calculateFinancingOptions, getPlanTotalCost, getAllTreatments } from './index';

// ── PDF Generation Result ──

export interface PdfResult {
  html: string;
  filename: string;
  generatedAt: string;
}

// ── Main Generator ──

export function generateConsultationPdf(session: MastermindSession): PdfResult {
  if (!session.auraScanResult || !session.mastermindPlan) {
    throw new Error('Session requires scan result and plan to generate PDF');
  }

  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;
  const selectedPkg = getSelectedPackage(session);
  const financing = selectedPkg ? calculateFinancingOptions(selectedPkg.price) : [];

  const html = buildPdfHtml({
    patientName: session.patientName,
    date: new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    scan,
    plan,
    selectedPackage: selectedPkg,
    financing,
  });

  const safeName = (session.patientName || 'patient').replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'patient';
  const dateStr = new Date().toISOString().split('T')[0];

  return {
    html,
    filename: `rani-treatment-plan-${safeName}-${dateStr}.pdf`,
    generatedAt: new Date().toISOString(),
  };
}

// ── HTML Builder ──

interface PdfData {
  patientName: string;
  date: string;
  scan: AuraScanResult;
  plan: MastermindPlan;
  selectedPackage: GeneratedPackage | null;
  financing: ReturnType<typeof calculateFinancingOptions>;
}

function buildPdfHtml(data: PdfData): string {
  const { patientName, date, scan, plan, selectedPackage, financing } = data;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Treatment Plan — ${escapeHtml(patientName)}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    :root {
      --navy: #0F1D2C;
      --gold: #C9A96E;
      --cream: #F8F6F1;
      --text: #2D3748;
      --text-light: #718096;
      --green: #059669;
      --red: #DC2626;
    }

    body {
      font-family: 'Montserrat', sans-serif;
      color: var(--text);
      line-height: 1.6;
      background: white;
    }

    .page { max-width: 800px; margin: 0 auto; padding: 40px; }

    @media print {
      .page { padding: 20px; }
      .page-break { page-break-before: always; }
    }

    h1, h2, h3 { font-family: 'Playfair Display', serif; }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-bottom: 24px;
      border-bottom: 2px solid var(--gold);
      margin-bottom: 32px;
    }
    .header-logo {
      font-family: 'Playfair Display', serif;
      font-size: 28px;
      color: var(--navy);
      font-weight: 700;
    }
    .header-logo span { color: var(--gold); }
    .header-meta {
      text-align: right;
      font-size: 12px;
      color: var(--text-light);
    }

    /* Patient & Score Section */
    .hero {
      display: flex;
      gap: 32px;
      margin-bottom: 32px;
    }
    .hero-left { flex: 1; }
    .hero-right {
      width: 180px;
      text-align: center;
    }

    .patient-name {
      font-size: 24px;
      color: var(--navy);
      margin-bottom: 8px;
    }
    .patient-meta {
      font-size: 12px;
      color: var(--text-light);
      margin-bottom: 16px;
    }

    .score-circle {
      width: 140px;
      height: 140px;
      border-radius: 50%;
      border: 6px solid var(--gold);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      margin: 0 auto 8px;
    }
    .score-number {
      font-family: 'Playfair Display', serif;
      font-size: 42px;
      font-weight: 700;
      color: var(--navy);
      line-height: 1;
    }
    .score-label {
      font-size: 11px;
      color: var(--gold);
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    /* Key Metrics */
    .metrics-row {
      display: flex;
      gap: 16px;
      margin-bottom: 32px;
    }
    .metric-card {
      flex: 1;
      background: var(--cream);
      border-radius: 12px;
      padding: 16px;
      text-align: center;
    }
    .metric-value {
      font-family: 'Playfair Display', serif;
      font-size: 24px;
      font-weight: 700;
      color: var(--navy);
    }
    .metric-label {
      font-size: 11px;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-top: 4px;
    }

    /* Summary */
    .summary-box {
      background: var(--cream);
      border-radius: 16px;
      padding: 24px;
      margin-bottom: 32px;
      border-left: 4px solid var(--gold);
    }
    .summary-title {
      font-size: 16px;
      color: var(--navy);
      margin-bottom: 8px;
    }
    .summary-text {
      font-size: 13px;
      color: var(--text-light);
    }

    /* Section Headers */
    .section-header {
      font-size: 20px;
      color: var(--navy);
      margin-bottom: 16px;
      padding-bottom: 8px;
      border-bottom: 1px solid #E2E8F0;
    }

    /* Treatment Cards */
    .treatment-card {
      background: white;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 12px;
    }
    .treatment-name {
      font-family: 'Playfair Display', serif;
      font-size: 16px;
      color: var(--navy);
      margin-bottom: 4px;
    }
    .treatment-meta {
      display: flex;
      gap: 16px;
      font-size: 12px;
      color: var(--text-light);
      margin-top: 8px;
    }
    .treatment-meta strong { color: var(--text); }
    .priority-badge {
      display: inline-block;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 2px 8px;
      border-radius: 4px;
      margin-left: 8px;
    }
    .priority-essential { background: #FEF3C7; color: #92400E; }
    .priority-recommended { background: #DBEAFE; color: #1E40AF; }
    .priority-optional { background: #E5E7EB; color: #374151; }

    /* Package */
    .package-box {
      background: var(--navy);
      color: white;
      border-radius: 16px;
      padding: 24px;
      margin-top: 32px;
    }
    .package-name {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      color: var(--gold);
      margin-bottom: 4px;
    }
    .package-price {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 700;
      color: white;
    }
    .package-details {
      margin-top: 16px;
      font-size: 12px;
      color: rgba(255,255,255,0.6);
    }
    .package-details li { margin-bottom: 4px; }

    /* Financing */
    .financing-row {
      display: flex;
      gap: 12px;
      margin-top: 16px;
    }
    .financing-option {
      flex: 1;
      background: rgba(255,255,255,0.1);
      border-radius: 8px;
      padding: 12px;
      text-align: center;
    }
    .financing-amount {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 700;
      color: var(--gold);
    }
    .financing-term {
      font-size: 11px;
      color: rgba(255,255,255,0.4);
    }

    /* Footer */
    .footer {
      margin-top: 40px;
      padding-top: 16px;
      border-top: 1px solid #E2E8F0;
      font-size: 10px;
      color: var(--text-light);
      text-align: center;
    }
    .footer-brand {
      font-family: 'Playfair Display', serif;
      color: var(--navy);
      font-size: 12px;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-logo">Rani <span>Beauty</span> Clinic</div>
      <div class="header-meta">
        <div>Personalized Treatment Plan</div>
        <div>${escapeHtml(date)}</div>
      </div>
    </div>

    <!-- Hero: Patient + Score -->
    <div class="hero">
      <div class="hero-left">
        <h1 class="patient-name">${escapeHtml(patientName)}</h1>
        <div class="patient-meta">
          Skin Age: ${scan.auraScore?.skinAge ?? '—'} | Chronological Age: ${scan.auraScore?.chronologicalAge ?? '—'} |
          Fitzpatrick ${scan.skinAnalysis?.fitzpatrickType ?? '—'}
        </div>

        <div class="summary-box">
          <h3 class="summary-title">Your Personalized Analysis</h3>
          <p class="summary-text">${escapeHtml(plan.aiSummary.patientFacing)}</p>
        </div>
      </div>
      <div class="hero-right">
        <div class="score-circle">
          <div class="score-number">${scan.auraScore?.overall ?? '—'}</div>
          <div class="score-label">${escapeHtml(scan.auraScore?.grade ?? '—')} — ${escapeHtml(scan.auraScore?.label ?? '—')}</div>
        </div>
        <div style="font-size: 11px; color: var(--text-light);">Aura Score</div>
      </div>
    </div>

    <!-- Key Metrics -->
    <div class="metrics-row">
      <div class="metric-card">
        <div class="metric-value">${scan.auraScore?.skinAge ?? '—'}</div>
        <div class="metric-label">Current Skin Age</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" style="color: var(--green);">${scan.predictiveMetrics?.withTreatment?.sixMonths?.skinAge ?? '—'}</div>
        <div class="metric-label">Projected (6 mo)</div>
      </div>
      <div class="metric-card">
        <div class="metric-value" style="color: var(--green);">${scan.predictiveMetrics?.withTreatment?.sixMonths?.auraScore ?? '—'}</div>
        <div class="metric-label">Projected Score</div>
      </div>
      <div class="metric-card">
        <div class="metric-value">${scan.auraScore?.percentile ?? '—'}th</div>
        <div class="metric-label">Peer Percentile</div>
      </div>
    </div>

    <!-- Concerns Addressed -->
    <h2 class="section-header">Concerns Addressed</h2>
    ${(plan.aiSummary?.addressedConcerns || [])
      .map(
        (ac) => `
    <div class="treatment-card">
      <div class="treatment-name">${escapeHtml(ac.concern)}</div>
      <div class="treatment-meta">
        <span><strong>Solution:</strong> ${escapeHtml(ac.solution)}</span>
        <span><strong>Timeline:</strong> ${escapeHtml(ac.timeline)}</span>
      </div>
    </div>`
      )
      .join('\n')}

    <!-- Treatment Plan -->
    <div class="page-break"></div>
    <h2 class="section-header">Your Treatment Plan</h2>

    ${renderTreatmentSection('Primary Treatments', plan.recommendations?.primary || [])}
    ${renderTreatmentSection('Complementary Treatments', plan.recommendations?.complementary || [])}
    ${renderTreatmentSection('Maintenance', plan.recommendations?.maintenance || [])}

    <!-- Selected Package -->
    ${selectedPackage ? renderPackageSection(selectedPackage, financing) : ''}

    <!-- Footer -->
    <div class="footer">
      <div class="footer-brand">Rani Beauty Clinic</div>
      <div>401 Olympia Ave NE #101, Renton, WA 98056 | (425) 999-7264 | ranibeautyclinic.com</div>
      <div style="margin-top: 8px;">
        This plan is a personalized recommendation based on your consultation.
        Individual results may vary. Not a guarantee of outcomes.
      </div>
    </div>
  </div>
</body>
</html>`;
}

// ── Helpers ──

function renderTreatmentSection(title: string, treatments: MastermindTreatment[]): string {
  if (treatments.length === 0) return '';

  return `
    <h3 style="font-size: 14px; color: var(--navy); margin: 16px 0 8px; font-family: 'Playfair Display', serif;">${title}</h3>
    ${treatments
      .map(
        (tx) => `
    <div class="treatment-card">
      <div class="treatment-name">
        ${escapeHtml(tx.treatmentName)}
        <span class="priority-badge priority-${tx.priority}">${tx.priority}</span>
      </div>
      <div style="font-size: 12px; color: var(--text-light); margin-top: 4px;">
        ${escapeHtml(tx.aiReasoning)}
      </div>
      <div class="treatment-meta">
        <span><strong>${tx.sessionsRequired} session${tx.sessionsRequired > 1 ? 's' : ''}</strong></span>
        <span><strong>$${tx.perSession.toLocaleString()}</strong>/session</span>
        <span>Results: ${escapeHtml(tx.timeToResults)}</span>
        <span>Lasts: ${escapeHtml(tx.longevity)}</span>
        <span>Downtime: ${escapeHtml(tx.downtime)}</span>
      </div>
    </div>`
      )
      .join('\n')}`;
}

function renderPackageSection(
  pkg: GeneratedPackage,
  financing: ReturnType<typeof calculateFinancingOptions>
): string {
  return `
    <div class="package-box">
      <div class="package-name">${escapeHtml(pkg.name)} — ${pkg.tier}</div>
      <div class="package-price">$${pkg.price.toLocaleString()}</div>
      ${pkg.discount > 0 ? `<div style="font-size: 12px; color: var(--gold); margin-top: 4px;">Save ${pkg.discount}% ($${pkg.savingsVsStandalone.toLocaleString()} off standalone pricing)</div>` : ''}

      <div class="package-details">
        <div style="margin-bottom: 8px;"><strong style="color: rgba(255,255,255,0.8);">${pkg.sessions} sessions</strong> — ${escapeHtml(pkg.bestFor)}</div>
        <ul>
          ${pkg.lineItems.map((li) => `<li>${escapeHtml(li.service)} x${li.qty} — $${li.total.toLocaleString()}</li>`).join('\n')}
        </ul>
        ${pkg.extras.length > 0 ? `<div style="margin-top: 12px; color: var(--gold);">Includes: ${pkg.extras.join(' • ')}</div>` : ''}
      </div>

      ${
        financing.length > 0
          ? `
      <div style="margin-top: 16px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.1);">
        <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-bottom: 8px;">Financing Options</div>
        <div class="financing-row">
          ${financing
            .map(
              (f) => `
          <div class="financing-option">
            <div class="financing-amount">$${f.monthlyPayment}</div>
            <div class="financing-term">/mo × ${f.termMonths}${f.apr > 0 ? ` (${f.apr}% APR)` : ' (0% interest)'}</div>
          </div>`
            )
            .join('\n')}
        </div>
      </div>`
          : ''
      }
    </div>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ── Protocol Packet PDF ──────────────────────────────────────────────────────

/**
 * Generate a provider-facing protocol packet PDF for a session.
 * Delegates to the protocol-packet module for content generation.
 *
 * Requires: intakeData, auraScanResult, mastermindPlan (throws if missing).
 */
export function generateProtocolPacketPdf(
  session: MastermindSession,
  actor: string,
): ProtocolPacketResult {
  return generateProtocolPacket(session, actor);
}

