/**
 * Protocol Packet Generator
 *
 * Builds provider-facing protocol packets from MastermindSession data.
 * Seven required sections (rendered as HTML for PDF export):
 *
 *   1. Patient summary + goals
 *   2. Contraindications + risk flags
 *   3. Recommended track + tier
 *   4. Dosage governance framework
 *   5. Monitoring checklist
 *   6. Required next steps / holds
 *   7. Legal/safety note: provider authorization required
 *
 * SAFETY: No PHI in error logs. Provider-internal use only.
 */

import type { MastermindSession } from '@/types/mastermind';

// ── Result type (mirrors PdfResult from pdf-generator) ──

export interface ProtocolPacketResult {
  html: string;
  filename: string;
  generatedAt: string;
}

// ── Main generator ──

export function generateProtocolPacket(
  session: MastermindSession,
  actor: string,
): ProtocolPacketResult {
  if (!session.intakeData || !session.auraScanResult || !session.mastermindPlan) {
    throw new Error(
      'generateProtocolPacket requires intakeData, auraScanResult, and mastermindPlan',
    );
  }

  const now = new Date();
  const generatedAt = now.toISOString();
  const dateDisplay = now.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const scan = session.auraScanResult;
  const plan = session.mastermindPlan;
  const review = session.providerReview;
  const intake = session.intakeData as Record<string, unknown>;

  const patientName = session.patientName || 'Patient';
  const patientEmail = session.patientEmail || '';

  // ── Section 1 data ──
  const goals = Array.isArray(intake.goals) ? (intake.goals as string[]) : [];
  const primaryConcerns = Array.isArray(intake.primaryConcerns)
    ? (intake.primaryConcerns as string[])
    : [];

  // ── Section 2 data ──
  const medicalFlags = (scan.medicalFlags ?? []).map((f) => ({
    flag: f.flag,
    severity: f.severity as string,
  }));

  const planContraindications = (plan.contraindications ?? []).map((c) =>
    c.reason,
  );

  const treatmentContraindications = [
    ...plan.recommendations.primary,
    ...plan.recommendations.complementary,
  ].flatMap((t) =>
    (t.contraindications ?? []).map((c) => ({ treatment: t.treatmentName, note: c })),
  );

  // ── Section 3 data ──
  const selectedTier = session.selectedPackageTier ?? 'Not selected';
  const primaryTreatments = plan.recommendations.primary;
  const highlightedPkg = plan.packages.find((p) => p.highlighted) ?? plan.packages[0] ?? null;

  // ── Section 4 data (non-minimal risk only) ──
  const governanceTreatments = primaryTreatments.filter((t) => t.riskLevel !== 'minimal');

  // ── Section 5 data ──
  const monitoringItems = primaryTreatments.map((t) => ({
    treatment: t.treatmentName,
    timeline: t.timeToResults,
    milestone: t.expectedImprovement,
  }));

  // ── Section 6 data ──
  const holds: string[] = [];
  if (review?.approvalStatus === 'pending') {
    holds.push('Provider final approval required before treatment initiation');
  }
  if (review?.approvalStatus === 'modified') {
    holds.push('Plan modifications requested — updated plan required before initiation');
  }
  if (review?.approvalStatus === 'rejected') {
    holds.push('Plan rejected by provider — clinical review required before proceeding');
  }
  const clinicalNotes = review?.clinicalNotes ?? [];

  const html = buildPacketHtml({
    patientName,
    patientEmail,
    dateDisplay,
    actor,
    auraScore: scan.auraScore.overall,
    auraGrade: scan.auraScore.grade,
    skinAge: scan.auraScore.skinAge,
    goals,
    primaryConcerns,
    medicalFlags,
    planContraindications,
    treatmentContraindications,
    selectedTier: String(selectedTier),
    primaryTreatments: primaryTreatments.map((t) => ({
      name: t.treatmentName,
      sessions: t.sessionsRequired,
      interval: t.intervalBetweenSessions,
      riskLevel: t.riskLevel,
      clinicalRationale: t.clinicalRationale,
      priority: t.priority,
    })),
    highlightedPackage: highlightedPkg
      ? { name: highlightedPkg.name, price: highlightedPkg.price, tier: highlightedPkg.tier }
      : null,
    governanceTreatments: governanceTreatments.map((t) => ({
      name: t.treatmentName,
      riskLevel: t.riskLevel,
      sessions: t.sessionsRequired,
      interval: t.intervalBetweenSessions,
      downtime: t.downtime,
      clinicalRationale: t.clinicalRationale,
    })),
    monitoringItems,
    holds,
    clinicalNotes,
    providerName: review?.providerName ?? actor,
    approvalStatus: review?.approvalStatus ?? null,
    aiProviderSummary: plan.aiSummary.providerFacing,
  });

  const safeName = patientName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase() || 'patient';
  const dateStr = now.toISOString().split('T')[0];

  return {
    html,
    filename: `rani-protocol-packet-${safeName}-${dateStr}.pdf`,
    generatedAt,
  };
}

// ── HTML builder ──

interface PacketHtmlData {
  patientName: string;
  patientEmail: string;
  dateDisplay: string;
  actor: string;
  auraScore: number;
  auraGrade: string;
  skinAge: number;
  goals: string[];
  primaryConcerns: string[];
  medicalFlags: { flag: string; severity: string }[];
  planContraindications: string[];
  treatmentContraindications: { treatment: string; note: string }[];
  selectedTier: string;
  primaryTreatments: {
    name: string;
    sessions: number;
    interval: string;
    riskLevel: string;
    clinicalRationale: string;
    priority: string;
  }[];
  highlightedPackage: { name: string; price: number; tier: string } | null;
  governanceTreatments: {
    name: string;
    riskLevel: string;
    sessions: number;
    interval: string;
    downtime: string;
    clinicalRationale: string;
  }[];
  monitoringItems: { treatment: string; timeline: string; milestone: string }[];
  holds: string[];
  clinicalNotes: string[];
  providerName: string;
  approvalStatus: string | null;
  aiProviderSummary: string;
}

function esc(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function riskColor(r: string): string {
  return r === 'moderate' ? '#EF4444' : r === 'low' ? '#F59E0B' : '#10B981';
}

function buildPacketHtml(d: PacketHtmlData): string {
  const approvalBadge = d.approvalStatus
    ? `<span class="badge badge-${
        d.approvalStatus === 'approved'
          ? 'approved'
          : d.approvalStatus === 'rejected'
            ? 'rejected'
            : 'pending'
      }">${esc(d.approvalStatus)}</span>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Protocol Packet — ${esc(d.patientName)}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=Montserrat:wght@300;400;500;600&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Montserrat', sans-serif; background: #F8F6F1; color: #1a2a3a; font-size: 12px; line-height: 1.6; }
  .page { max-width: 800px; margin: 0 auto; padding: 32px; }
  .header { background: #0F1D2C; color: #F8F6F1; padding: 28px 32px; border-radius: 8px 8px 0 0; }
  .header-brand { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
  .header-brand h1 { font-family: 'Playfair Display', serif; font-size: 22px; color: #C9A96E; }
  .header-meta { font-size: 10px; color: rgba(255,255,255,0.5); }
  .header-doc-title { font-size: 14px; font-weight: 600; color: rgba(255,255,255,0.9); letter-spacing: 2px; text-transform: uppercase; margin-top: 6px; }
  .header-patient { margin-top: 12px; padding-top: 12px; border-top: 1px solid rgba(255,255,255,0.1); display: flex; flex-wrap: wrap; gap: 24px; }
  .header-patient-field label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.4); display: block; }
  .header-patient-field span { font-size: 12px; color: rgba(255,255,255,0.85); font-weight: 500; }
  .section { background: white; border: 1px solid #e5e0d8; margin-top: 1px; padding: 20px 24px; }
  .section:last-of-type { border-radius: 0 0 8px 8px; }
  .section-header { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; padding-bottom: 10px; border-bottom: 1px solid #f0ebe2; }
  .section-num { width: 22px; height: 22px; background: #0F1D2C; color: #C9A96E; border-radius: 50%; font-size: 10px; font-weight: 700; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
  .section-title { font-family: 'Playfair Display', serif; font-size: 14px; font-weight: 600; color: #0F1D2C; }
  .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .data-field label { font-size: 9px; text-transform: uppercase; letter-spacing: 1px; color: #9a8f82; display: block; margin-bottom: 2px; }
  .data-field p { font-size: 11px; color: #1a2a3a; font-weight: 500; }
  .pill-list { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 6px; }
  .pill { background: #f0ebe2; border: 1px solid #e5e0d8; padding: 3px 10px; border-radius: 20px; font-size: 10px; color: #5a4a3a; }
  .badge { padding: 2px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
  .badge-approved { background: #d1fae5; color: #065f46; }
  .badge-pending { background: #fef3c7; color: #92400e; }
  .badge-rejected { background: #fee2e2; color: #991b1b; }
  table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
  th { background: #f0ebe2; padding: 6px 10px; text-align: left; font-size: 9px; text-transform: uppercase; letter-spacing: 0.8px; color: #7a6a5a; font-weight: 600; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0ebe2; vertical-align: top; }
  tr:last-child td { border-bottom: none; }
  .flag-item { display: flex; align-items: flex-start; gap: 8px; padding: 8px 10px; border-radius: 6px; margin-bottom: 6px; }
  .flag-critical { background: #fff1f2; border: 1px solid #fecdd3; }
  .flag-high { background: #fff7ed; border: 1px solid #fed7aa; }
  .flag-medium,.flag-unknown { background: #fefce8; border: 1px solid #fef08a; }
  .flag-low { background: #f0fdf4; border: 1px solid #bbf7d0; }
  .flag-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 4px; }
  .flag-text { font-size: 11px; }
  .checklist-item { display: flex; align-items: flex-start; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f5f0e8; }
  .checklist-item:last-child { border-bottom: none; }
  .check-box { width: 14px; height: 14px; border: 1.5px solid #C9A96E; border-radius: 3px; flex-shrink: 0; margin-top: 2px; }
  .hold-item { background: #fff7ed; border: 1px solid #fed7aa; border-left: 3px solid #f97316; padding: 8px 12px; border-radius: 4px; margin-bottom: 6px; font-size: 11px; color: #7c2d12; }
  .safety-note { background: #0F1D2C; color: rgba(255,255,255,0.7); padding: 16px 24px; border-radius: 0 0 8px 8px; font-size: 10px; line-height: 1.7; margin-top: 1px; }
  .safety-note strong { color: #C9A96E; display: block; margin-bottom: 4px; font-size: 11px; }
  .score-num { font-family: 'Playfair Display', serif; font-size: 24px; font-weight: 700; color: #C9A96E; line-height: 1; }
  @media print { body { background: white; } .page { padding: 20px; } }
</style>
</head>
<body>
<div class="page">

  <!-- Header -->
  <div class="header">
    <div class="header-brand">
      <h1>Rani Beauty Clinic</h1>
      <div class="header-meta">CONFIDENTIAL — Provider Use Only</div>
    </div>
    <div class="header-doc-title">Protocol Packet</div>
    <div class="header-patient">
      <div class="header-patient-field">
        <label>Patient</label>
        <span>${esc(d.patientName)}</span>
      </div>
      <div class="header-patient-field">
        <label>Generated</label>
        <span>${esc(d.dateDisplay)}</span>
      </div>
      <div class="header-patient-field">
        <label>Generated By</label>
        <span>${esc(d.actor)}</span>
      </div>
      <div class="header-patient-field">
        <label>Aura Score</label>
        <span>${esc(d.auraScore)}/100 (${esc(d.auraGrade)})</span>
      </div>
      ${d.approvalStatus ? `<div class="header-patient-field"><label>Review Status</label><span>${approvalBadge}</span></div>` : ''}
    </div>
  </div>

  <!-- 1. Patient Summary + Goals -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">1</div>
      <div class="section-title">Patient Summary &amp; Goals</div>
    </div>
    <div class="data-grid">
      <div class="data-field">
        <label>Patient Name</label>
        <p>${esc(d.patientName)}</p>
      </div>
      <div class="data-field">
        <label>Contact Email</label>
        <p>${esc(d.patientEmail) || '—'}</p>
      </div>
      <div class="data-field">
        <label>Skin Age</label>
        <p>${esc(d.skinAge)} years</p>
      </div>
      <div class="data-field">
        <label>Aura Score</label>
        <span class="score-num">${esc(d.auraScore)}</span><span style="font-size:11px;color:#9a8f82;">/100 — Grade ${esc(d.auraGrade)}</span>
      </div>
    </div>
    ${
      d.primaryConcerns.length > 0
        ? `<div style="margin-top:12px;"><div class="data-field"><label>Primary Concerns</label></div><div class="pill-list">${d.primaryConcerns.map((c) => `<span class="pill">${esc(c)}</span>`).join('')}</div></div>`
        : ''
    }
    ${
      d.goals.length > 0
        ? `<div style="margin-top:12px;"><div class="data-field"><label>Treatment Goals</label></div><div class="pill-list">${d.goals.map((g) => `<span class="pill">${esc(g)}</span>`).join('')}</div></div>`
        : ''
    }
    <div style="margin-top:12px;">
      <div class="data-field">
        <label>Provider Clinical Summary</label>
        <p style="margin-top:4px;font-size:11px;color:#3a4a5a;line-height:1.7;">${esc(d.aiProviderSummary)}</p>
      </div>
    </div>
  </div>

  <!-- 2. Contraindications + Risk Flags -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">2</div>
      <div class="section-title">Contraindications &amp; Risk Flags</div>
    </div>
    ${
      d.medicalFlags.length === 0 &&
      d.planContraindications.length === 0 &&
      d.treatmentContraindications.length === 0
        ? '<p style="font-size:11px;color:#6a8a6a;">No contraindications or risk flags identified.</p>'
        : ''
    }
    ${d.medicalFlags
      .map(
        (f) => `<div class="flag-item flag-${esc(f.severity)}">
      <div class="flag-dot" style="background:${riskColor(f.severity)};"></div>
      <div class="flag-text"><strong>${esc(f.flag)}</strong> <span style="font-size:9px;text-transform:uppercase;color:#9a8f82;">${esc(f.severity)}</span></div>
    </div>`,
      )
      .join('')}
    ${
      d.planContraindications.length > 0
        ? `<div style="margin-top:10px;"><div class="data-field"><label>Plan-Level Contraindications</label></div><ul style="margin-top:6px;padding-left:16px;font-size:11px;color:#5a3a2a;">${d.planContraindications.map((c) => `<li style="margin-bottom:4px;">${esc(c)}</li>`).join('')}</ul></div>`
        : ''
    }
    ${
      d.treatmentContraindications.length > 0
        ? `<div style="margin-top:10px;"><div class="data-field"><label>Treatment-Specific Contraindications</label></div><table><thead><tr><th>Treatment</th><th>Contraindication</th></tr></thead><tbody>${d.treatmentContraindications.map((tc) => `<tr><td><strong>${esc(tc.treatment)}</strong></td><td>${esc(tc.note)}</td></tr>`).join('')}</tbody></table></div>`
        : ''
    }
  </div>

  <!-- 3. Recommended Track + Tier -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">3</div>
      <div class="section-title">Recommended Track &amp; Tier</div>
    </div>
    <div class="data-grid" style="margin-bottom:12px;">
      <div class="data-field">
        <label>Selected Package Tier</label>
        <p style="font-weight:600;color:#C9A96E;">${esc(d.selectedTier)}</p>
      </div>
      ${
        d.highlightedPackage
          ? `<div class="data-field"><label>Recommended Package</label><p><strong>${esc(d.highlightedPackage.name)}</strong> — $${Number(d.highlightedPackage.price).toLocaleString()}</p></div>`
          : ''
      }
    </div>
    <table>
      <thead><tr><th>Treatment</th><th>Priority</th><th>Sessions</th><th>Interval</th><th>Risk Level</th></tr></thead>
      <tbody>
        ${d.primaryTreatments
          .map(
            (t) => `<tr>
          <td><strong>${esc(t.name)}</strong><div style="font-size:10px;color:#6a5a4a;margin-top:2px;">${esc(t.clinicalRationale)}</div></td>
          <td>${esc(t.priority)}</td>
          <td>${esc(t.sessions)}</td>
          <td>${esc(t.interval)}</td>
          <td><span style="color:${riskColor(t.riskLevel)};font-weight:600;font-size:10px;">${esc(t.riskLevel)}</span></td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <!-- 4. Dosage Governance Framework -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">4</div>
      <div class="section-title">Dosage Governance Framework</div>
    </div>
    ${
      d.governanceTreatments.length === 0
        ? '<p style="font-size:11px;color:#6a8a6a;">All primary treatments are minimal-risk — standard protocols apply. No elevated governance required.</p>'
        : `<table>
      <thead><tr><th>Treatment</th><th>Risk</th><th>Sessions</th><th>Interval</th><th>Downtime</th></tr></thead>
      <tbody>
        ${d.governanceTreatments
          .map(
            (t) => `<tr>
          <td><strong>${esc(t.name)}</strong><div style="font-size:10px;color:#6a5a4a;margin-top:2px;">${esc(t.clinicalRationale)}</div></td>
          <td><span style="color:${riskColor(t.riskLevel)};font-weight:600;">${esc(t.riskLevel)}</span></td>
          <td>${esc(t.sessions)}</td>
          <td>${esc(t.interval)}</td>
          <td>${esc(t.downtime)}</td>
        </tr>`,
          )
          .join('')}
      </tbody>
    </table>`
    }
  </div>

  <!-- 5. Monitoring Checklist -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">5</div>
      <div class="section-title">Monitoring Checklist</div>
    </div>
    ${d.monitoringItems
      .map(
        (item) => `<div class="checklist-item">
      <div class="check-box"></div>
      <div style="flex:1;">
        <strong style="font-size:11px;">${esc(item.treatment)}</strong>
        <span style="font-size:10px;color:#6a5a4a;display:block;">Expected: ${esc(item.milestone)} — Timeline: ${esc(item.timeline)}</span>
      </div>
    </div>`,
      )
      .join('')}
  </div>

  <!-- 6. Required Next Steps / Holds -->
  <div class="section">
    <div class="section-header">
      <div class="section-num">6</div>
      <div class="section-title">Required Next Steps &amp; Holds</div>
    </div>
    ${
      d.holds.length > 0
        ? d.holds.map((h) => `<div class="hold-item">⚠ ${esc(h)}</div>`).join('')
        : '<p style="font-size:11px;color:#6a8a6a;">No active holds — treatment initiation approved pending patient informed consent.</p>'
    }
    ${
      d.clinicalNotes.length > 0
        ? `<div style="margin-top:12px;"><div class="data-field"><label>Provider Clinical Notes</label></div>${d.clinicalNotes.map((n) => `<div style="background:#f8f6f1;border-left:3px solid #C9A96E;padding:8px 12px;margin-top:6px;font-size:11px;color:#3a2a1a;border-radius:0 4px 4px 0;">${esc(n)}</div>`).join('')}</div>`
        : ''
    }
  </div>

  <!-- 7. Legal/Safety Note -->
  <div class="safety-note">
    <strong>7 — PROVIDER AUTHORIZATION &amp; LEGAL NOTICE</strong>
    This protocol packet is for provider use only and must not be shared with patients or third parties.
    All recommended treatments require provider authorization and patient informed consent prior to initiation.
    This document does not constitute a treatment order. Any deviations from the documented protocol require
    provider review and updated documentation. This packet was generated on ${esc(d.dateDisplay)} by
    ${esc(d.actor)} for patient ${esc(d.patientName)} and is specific to this consultation session only.
    Rani Beauty Clinic — 401 Olympia Ave NE, Suite 101, Renton, WA 98056 — ranibeautyclinic.com
  </div>

</div>
</body>
</html>`;
}
