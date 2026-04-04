'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import type { PatientPlanData } from '@/app/api/mastermind/share/[token]/route';

// ── Types for the page ──

type PlanData = PatientPlanData;

// Helper: severity color
function severityColor(severity: string): string {
  switch (severity) {
    case 'mild': return '#059669';
    case 'moderate': return '#D97706';
    case 'severe': return '#DC2626';
    default: return '#6B7280';
  }
}

// Helper: priority styles
function priorityBadge(priority: string): { bg: string; text: string; label: string } {
  switch (priority) {
    case 'essential': return { bg: '#FEF3C7', text: '#92400E', label: 'Essential' };
    case 'recommended': return { bg: '#DBEAFE', text: '#1E40AF', label: 'Recommended' };
    case 'optional': return { bg: '#F3F4F6', text: '#374151', label: 'Optional' };
    default: return { bg: '#F3F4F6', text: '#374151', label: priority };
  }
}

// Helper: format currency
function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

// ── Main Component ──

export default function PrintPlanPage() {
  const params = useParams();
  const token = params?.token as string;
  const [data, setData] = useState<PlanData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`/api/mastermind/share/${token}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success === false) {
          setError(res.error || 'Unable to load your treatment plan.');
        } else {
          setData(res.data || res);
        }
      })
      .catch(() => setError('Unable to load your treatment plan.'))
      .finally(() => setLoading(false));
  }, [token]);

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FAF8F5', fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, color: '#C9A96E', fontWeight: 700, letterSpacing: 2 }}>Rani</div>
          <div style={{ fontSize: 13, color: '#718096', marginTop: 8, letterSpacing: 3, textTransform: 'uppercase' }}>Preparing your plan...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#FAF8F5', fontFamily: 'Georgia, serif' }}>
        <div style={{ textAlign: 'center', maxWidth: 400, padding: 40 }}>
          <div style={{ fontSize: 28, color: '#0F1D2C', fontWeight: 700, marginBottom: 16 }}>Unable to Load Plan</div>
          <div style={{ fontSize: 14, color: '#718096' }}>{error || 'This link may have expired.'}</div>
          <a href={`/my-plan/${token}`} style={{ display: 'inline-block', marginTop: 24, color: '#C9A96E', textDecoration: 'underline', fontSize: 14 }}>
            Return to your plan
          </a>
        </div>
      </div>
    );
  }

  const allTreatments = [
    ...(data.treatments?.primary || []),
    ...(data.treatments?.complementary || []),
    ...(data.treatments?.maintenance || []),
  ];

  const consultDate = data.consultationDate
    ? new Date(data.consultationDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
    : new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  // Compute cost of delay from packages (since costOfDelay is stripped from patient data, estimate from package prices)
  const transformPkg = data.packages?.find((p) => p.tier === 'Transform');
  const currentCost = transformPkg?.price || data.packages?.[1]?.price || data.packages?.[0]?.price || 0;

  return (
    <>
      {/* ── Global + Print Styles ── */}
      <style dangerouslySetInnerHTML={{ __html: printStyles }} />

      {/* ── Floating Action Bar (hidden on print) ── */}
      <div className="no-print" style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
        background: 'rgba(15,29,44,0.95)', backdropFilter: 'blur(12px)',
        padding: '12px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <a href={`/my-plan/${token}`} style={{ color: '#C9A96E', textDecoration: 'none', fontSize: 14, fontFamily: 'system-ui, sans-serif' }}>
          &larr; Back to Your Plan
        </a>
        <button
          onClick={() => window.print()}
          style={{
            background: '#C9A96E', color: '#0F1D2C', border: 'none', borderRadius: 8,
            padding: '10px 28px', fontSize: 14, fontWeight: 600, cursor: 'pointer',
            fontFamily: 'system-ui, sans-serif', letterSpacing: 0.5,
          }}
        >
          Print This Plan
        </button>
      </div>

      <div className="print-document">

        {/* ════════════════════════════════════════════════════════════
            PAGE 1: COVER
        ════════════════════════════════════════════════════════════ */}
        <div className="print-page cover-page">
          <div className="cover-bg-pattern" />
          <div className="cover-content">
            <div className="cover-logo">
              <span className="cover-logo-rani">Rani</span>
              <span className="cover-logo-sub">Beauty Clinic</span>
            </div>

            <div className="cover-separator" />

            <div className="cover-title">PERSONALIZED TREATMENT PLAN</div>

            <div className="cover-prepared">
              Prepared exclusively for
            </div>
            <div className="cover-patient-name">{data.patientName}</div>
            <div className="cover-date">{consultDate}</div>

            <div className="cover-score-badge">
              <div className="cover-score-number">{data.auraScore?.overall ?? '--'}</div>
              <div className="cover-score-grade">{data.auraScore?.grade ?? '--'}</div>
              <div className="cover-score-label">Aura Score</div>
            </div>

            <div className="cover-footer">
              <div className="cover-footer-line" />
              <div className="cover-powered">Powered by AI Mastermind</div>
              <div className="cover-clinic-info">Rani Beauty Clinic &middot; 401 Olympia Ave NE #101, Renton, WA 98056</div>
            </div>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════
            PAGE 2: SKIN ANALYSIS
        ════════════════════════════════════════════════════════════ */}
        <div className="print-page">
          <PageHeader title="Your Skin Analysis" pageNum={2} />

          {/* Aura Score Breakdown */}
          {data.deviceAnalysis && (
            <div className="section-block">
              <h3 className="section-subtitle">Aura Score Breakdown</h3>
              <div className="score-bars">
                {data.deviceAnalysis.categories.map((cat, i) => (
                  <div key={i} className="score-bar-row">
                    <div className="score-bar-label">{cat.label}</div>
                    <div className="score-bar-track">
                      <div
                        className="score-bar-fill"
                        style={{ width: `${Math.min((cat.absoluteScore / 5) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="score-bar-value">{cat.absoluteScore}/5</div>
                    <div className="score-bar-severity" style={{ color: severityColor(cat.severity) }}>
                      {cat.severity}
                    </div>
                  </div>
                ))}
              </div>
              <div className="composite-score">
                Composite Skin Score: <strong>{data.deviceAnalysis.compositeSkinScore}</strong>
              </div>
            </div>
          )}

          {/* Skin Age vs Actual Age */}
          <div className="section-block">
            <h3 className="section-subtitle">Skin Age Analysis</h3>
            <div className="age-comparison">
              <div className="age-card">
                <div className="age-card-value">{data.auraScore?.chronologicalAge ?? '--'}</div>
                <div className="age-card-label">Your Age</div>
              </div>
              <div className="age-card-vs">vs</div>
              <div className="age-card">
                <div className="age-card-value" style={{ color: (data.auraScore?.skinAgeDelta ?? 0) <= 0 ? '#059669' : '#DC2626' }}>
                  {data.auraScore?.skinAge ?? '--'}
                </div>
                <div className="age-card-label">Your Skin Age</div>
              </div>
              <div className="age-delta">
                {(data.auraScore?.skinAgeDelta ?? 0) < 0
                  ? `Your skin looks ${Math.abs(data.auraScore?.skinAgeDelta ?? 0)} years younger`
                  : (data.auraScore?.skinAgeDelta ?? 0) > 0
                    ? `Your skin shows ${data.auraScore?.skinAgeDelta ?? 0} years of additional aging`
                    : 'Your skin age matches your chronological age'}
              </div>
            </div>
          </div>

          {/* Top Concerns */}
          {data.concerns && data.concerns.length > 0 && (
            <div className="section-block">
              <h3 className="section-subtitle">Top Concerns</h3>
              <div className="concerns-list">
                {data.concerns.slice(0, 5).map((c, i) => (
                  <div key={i} className="concern-row">
                    <span className="concern-dot" style={{ background: severityColor(c.severity) }} />
                    <div className="concern-info">
                      <div className="concern-name">{c.concern}</div>
                      <div className="concern-desc">{c.description}</div>
                    </div>
                    <div className="concern-severity" style={{ color: severityColor(c.severity) }}>
                      {c.severity}
                    </div>
                    <div className="concern-trending">
                      {c.trending === 'improving' ? '\u2191' : c.trending === 'worsening' ? '\u2193' : '\u2194'} {c.trending}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Summary */}
          {data.summary?.patientFacing && (
            <div className="ai-summary-box">
              <div className="ai-summary-icon">\u2728</div>
              <div>
                <div className="ai-summary-title">Your AI Analysis</div>
                <div className="ai-summary-text">{data.summary.patientFacing}</div>
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            PAGE 3: TREATMENT JOURNEY (Primary + Complementary)
        ════════════════════════════════════════════════════════════ */}
        <div className="print-page">
          <PageHeader title="Your Treatment Journey" pageNum={3} />

          {/* Key Highlights */}
          {data.summary?.keyHighlights && data.summary.keyHighlights.length > 0 && (
            <div className="highlights-bar">
              {data.summary.keyHighlights.map((h, i) => (
                <div key={i} className="highlight-item">
                  <span className="highlight-check">\u2713</span> {h}
                </div>
              ))}
            </div>
          )}

          {/* Treatment Sequencing Timeline */}
          {data.sequencing && data.sequencing.length > 0 && (
            <div className="section-block">
              <h3 className="section-subtitle">Treatment Timeline</h3>
              <div className="timeline">
                {data.sequencing.map((phase, i) => (
                  <div key={i} className="timeline-phase">
                    <div className="timeline-phase-header">
                      <div className="timeline-phase-badge">Phase {phase.phase}</div>
                      <div className="timeline-phase-name">{phase.phaseName}</div>
                      <div className="timeline-phase-duration">{phase.duration}</div>
                    </div>
                    <div className="timeline-phase-milestone">{phase.expectedMilestone}</div>
                    <div className="timeline-treatments">
                      {phase.treatments.map((t, j) => (
                        <span key={j} className="timeline-treatment-pill">
                          {t.treatmentName} (Week {t.week})
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Primary Treatments */}
          {data.treatments?.primary && data.treatments.primary.length > 0 && (
            <div className="section-block">
              <h3 className="section-subtitle">Primary Treatments</h3>
              {data.treatments.primary.map((tx, i) => (
                <TreatmentCard key={i} tx={tx} />
              ))}
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            PAGE 4: TREATMENTS CONTINUED
        ════════════════════════════════════════════════════════════ */}
        {((data.treatments?.complementary && data.treatments.complementary.length > 0) ||
          (data.treatments?.maintenance && data.treatments.maintenance.length > 0)) && (
          <div className="print-page">
            <PageHeader title="Your Treatment Journey (Continued)" pageNum={4} />

            {data.treatments?.complementary && data.treatments.complementary.length > 0 && (
              <div className="section-block">
                <h3 className="section-subtitle">Complementary Treatments</h3>
                {data.treatments.complementary.map((tx, i) => (
                  <TreatmentCard key={i} tx={tx} />
                ))}
              </div>
            )}

            {data.treatments?.maintenance && data.treatments.maintenance.length > 0 && (
              <div className="section-block">
                <h3 className="section-subtitle">Maintenance Treatments</h3>
                {data.treatments.maintenance.map((tx, i) => (
                  <TreatmentCard key={i} tx={tx} />
                ))}
              </div>
            )}

            {/* Addressed Concerns Summary */}
            {data.summary?.addressedConcerns && data.summary.addressedConcerns.length > 0 && (
              <div className="section-block">
                <h3 className="section-subtitle">Concerns Addressed</h3>
                <div className="addressed-concerns">
                  {data.summary.addressedConcerns.map((ac, i) => (
                    <div key={i} className="addressed-concern-row">
                      <div className="addressed-concern-name">{ac.concern}</div>
                      <div className="addressed-concern-solution">{ac.solution}</div>
                      <div className="addressed-concern-timeline">{ac.timeline}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PAGE 5: SIMULATION RESULTS
        ════════════════════════════════════════════════════════════ */}
        <div className="print-page">
          <PageHeader title="Your Projected Results" pageNum={5} />

          {data.simulation ? (
            <>
              {/* With vs Without Comparison */}
              <div className="section-block">
                <div className="sim-comparison">
                  <div className="sim-path sim-path-with">
                    <div className="sim-path-header sim-path-header-with">With Treatment</div>
                    <div className="sim-path-narrative">{data.simulation.withTreatment.narrative}</div>
                    <div className="sim-frames">
                      {data.simulation.withTreatment.frames.slice(0, 3).map((f, i) => (
                        <div key={i} className="sim-frame">
                          <div className="sim-frame-time">{f.timepoint}</div>
                          <div className="sim-frame-score">{f.auraScoreProjection}</div>
                          <div className="sim-frame-label">Aura Score</div>
                          <div className="sim-frame-age">Skin Age: {f.skinAgeProjection}</div>
                          <div className="sim-frame-desc">{f.description}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="sim-path sim-path-without">
                    <div className="sim-path-header sim-path-header-without">Without Treatment</div>
                    <div className="sim-path-narrative">{data.simulation.withoutTreatment.narrative}</div>
                    <div className="sim-frames">
                      {data.simulation.withoutTreatment.frames.slice(0, 3).map((f, i) => (
                        <div key={i} className="sim-frame">
                          <div className="sim-frame-time">{f.timepoint}</div>
                          <div className="sim-frame-score">{f.auraScoreProjection}</div>
                          <div className="sim-frame-label">Aura Score</div>
                          <div className="sim-frame-age">Skin Age: {f.skinAgeProjection}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Key Differentiators */}
              {data.simulation.comparison.keyDifferentiators.length > 0 && (
                <div className="section-block">
                  <h3 className="section-subtitle">Key Differentiators</h3>
                  <div className="differentiators">
                    {data.simulation.comparison.keyDifferentiators.map((d, i) => (
                      <div key={i} className="differentiator-item">
                        <span className="differentiator-bullet">\u25C6</span> {d}
                      </div>
                    ))}
                  </div>
                  <div className="sim-delta-summary">
                    <div className="sim-delta-item">
                      <div className="sim-delta-value">+{data.simulation.comparison.auraScoreDelta}</div>
                      <div className="sim-delta-label">Aura Score Improvement</div>
                    </div>
                    <div className="sim-delta-item">
                      <div className="sim-delta-value">-{Math.abs(data.simulation.comparison.skinAgeDelta)} yrs</div>
                      <div className="sim-delta-label">Skin Age Reversal</div>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : data.predictiveMetrics ? (
            <>
              {/* Predictive metrics fallback when no simulation */}
              <div className="section-block">
                <h3 className="section-subtitle">With Your Treatment Plan</h3>
                <div className="prediction-timeline">
                  {[
                    { label: '3 Months', data: data.predictiveMetrics.withTreatment.threeMonths },
                    { label: '6 Months', data: data.predictiveMetrics.withTreatment.sixMonths },
                    { label: '1 Year', data: data.predictiveMetrics.withTreatment.oneYear },
                  ].map((item, i) => (
                    <div key={i} className="prediction-card prediction-card-good">
                      <div className="prediction-card-label">{item.label}</div>
                      <div className="prediction-card-score">{item.data.auraScore}</div>
                      <div className="prediction-card-sublabel">Aura Score</div>
                      <div className="prediction-card-age">Skin Age: {item.data.skinAge}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="section-block">
                <h3 className="section-subtitle">Without Intervention</h3>
                <div className="prediction-timeline">
                  {[
                    { label: '1 Year', data: data.predictiveMetrics.withoutIntervention.oneYear },
                    { label: '3 Years', data: data.predictiveMetrics.withoutIntervention.threeYears },
                    { label: '5 Years', data: data.predictiveMetrics.withoutIntervention.fiveYears },
                  ].map((item, i) => (
                    <div key={i} className="prediction-card prediction-card-warn">
                      <div className="prediction-card-label">{item.label}</div>
                      <div className="prediction-card-score">{item.data.auraScore}</div>
                      <div className="prediction-card-sublabel">Aura Score</div>
                      <div className="prediction-card-age">Skin Age: {item.data.skinAge}</div>
                      {item.data.topConcerns?.length > 0 && (
                        <div className="prediction-card-concerns">
                          {item.data.topConcerns.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : (
            <div className="section-block">
              <div className="empty-state">
                Simulation data will be available after your provider completes the analysis.
              </div>
            </div>
          )}
        </div>

        {/* ════════════════════════════════════════════════════════════
            PAGE 6: YOUR PACKAGES
        ════════════════════════════════════════════════════════════ */}
        {data.packages && data.packages.length > 0 && (
          <div className="print-page">
            <PageHeader title="Your Treatment Packages" pageNum={6} />

            <div className="packages-grid">
              {data.packages.map((pkg, i) => (
                <div key={i} className={`package-card ${pkg.highlighted ? 'package-card-highlighted' : ''}`}>
                  {pkg.highlighted && <div className="package-recommended-badge">RECOMMENDED</div>}
                  <div className="package-tier">{pkg.tier}</div>
                  <div className="package-name">{pkg.name}</div>
                  <div className="package-subtitle">{pkg.subtitle}</div>

                  <div className="package-pricing">
                    {pkg.discount > 0 && (
                      <div className="package-original">${fmt(pkg.originalPrice)}</div>
                    )}
                    <div className="package-price">${fmt(pkg.price)}</div>
                    {pkg.discount > 0 && (
                      <div className="package-savings">Save {pkg.discount}% (${fmt(pkg.savingsVsStandalone)})</div>
                    )}
                  </div>

                  <div className="package-sessions">{pkg.sessions} sessions</div>

                  <div className="package-items">
                    {pkg.lineItems.map((li, j) => (
                      <div key={j} className="package-item">
                        <span className="package-item-check">\u2713</span>
                        {li.service} x{li.qty}
                      </div>
                    ))}
                  </div>

                  {pkg.extras.length > 0 && (
                    <div className="package-extras">
                      {pkg.extras.map((ex, j) => (
                        <div key={j} className="package-extra-item">\u2605 {ex}</div>
                      ))}
                    </div>
                  )}

                  <div className="package-financing">
                    As low as <strong>${fmt(pkg.monthlyPayment24)}/month</strong> for 24 months
                  </div>

                  <div className="package-best-for">{pkg.bestFor}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PAGE 7: AFTERCARE PREVIEW
        ════════════════════════════════════════════════════════════ */}
        {data.aftercare && data.aftercare.length > 0 && (
          <div className="print-page">
            <PageHeader title="Aftercare Guide" pageNum={7} />

            <div className="aftercare-intro">
              Your personalized aftercare instructions for each treatment in your plan. Following these guidelines will optimize your results.
            </div>

            {data.aftercare.map((ac, i) => (
              <div key={i} className="aftercare-block">
                <div className="aftercare-treatment-name">{ac.treatmentName}</div>

                <div className="aftercare-section">
                  <div className="aftercare-section-title">\u23F0 First 24 Hours</div>
                  <ul className="aftercare-list">
                    {ac.immediateAftercare.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>

                <div className="aftercare-section">
                  <div className="aftercare-section-title">\u{1F4C5} Week 1 Guidance</div>
                  <ul className="aftercare-list">
                    {ac.weekOneGuidance.map((item, j) => (
                      <li key={j}>{item}</li>
                    ))}
                  </ul>
                </div>

                {ac.productsRecommended.length > 0 && (
                  <div className="aftercare-section">
                    <div className="aftercare-section-title">\u{1F9F4} Recommended Products</div>
                    <div className="aftercare-products">
                      {ac.productsRecommended.map((p, j) => (
                        <div key={j} className="aftercare-product">
                          <span className="aftercare-product-name">{p.product}</span>
                          <span className="aftercare-product-reason">{p.reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════
            PAGE 8: NEXT STEPS
        ════════════════════════════════════════════════════════════ */}
        <div className="print-page next-steps-page">
          <PageHeader title="Your Transformation Begins Here" pageNum={8} />

          <div className="next-steps-grid">
            <div className="next-step-card">
              <div className="next-step-number">01</div>
              <div className="next-step-title">Schedule Your First Treatment</div>
              <div className="next-step-desc">
                Your customized plan is ready. Book your first appointment to begin your transformation journey. We recommend starting within 2 weeks.
              </div>
            </div>
            <div className="next-step-card">
              <div className="next-step-number">02</div>
              <div className="next-step-title">Begin Your Skincare Routine</div>
              <div className="next-step-desc">
                Start the recommended products at least 1 week before your first treatment for optimal skin preparation and enhanced results.
              </div>
            </div>
            <div className="next-step-card">
              <div className="next-step-number">03</div>
              <div className="next-step-title">Follow Aftercare Instructions</div>
              <div className="next-step-desc">
                Proper aftercare is essential for maximizing your results. Review the aftercare guide on the previous pages before each treatment.
              </div>
            </div>
          </div>

          {/* QR Code Placeholder */}
          <div className="qr-section">
            <div className="qr-box">
              <div className="qr-placeholder">
                <div className="qr-inner">
                  <div className="qr-pattern" />
                  <div className="qr-text-overlay">SCAN</div>
                </div>
              </div>
              <div className="qr-label">Scan to view your plan online</div>
            </div>
          </div>

          {/* Contact Info */}
          <div className="contact-section">
            <div className="contact-brand">
              <span className="contact-brand-rani">Rani</span> Beauty Clinic
            </div>
            <div className="contact-details">
              <div className="contact-item">\u{1F4DE} (425) 999-7264</div>
              <div className="contact-item">\u2709 info@ranibeautyclinic.com</div>
              <div className="contact-item">\u{1F4CD} 401 Olympia Ave NE, Suite 101, Renton, WA 98056</div>
              <div className="contact-item">\u{1F310} ranibeautyclinic.com</div>
            </div>
          </div>

          {/* Validity */}
          <div className="plan-validity">
            This personalized treatment plan is valid for 30 days from the date of consultation.
            <br />
            Individual results may vary. All treatments are performed under physician supervision.
          </div>

          {/* Decorative Footer */}
          <div className="final-footer">
            <div className="final-footer-line" />
            <div className="final-footer-text">
              Excellence in aesthetic medicine, personalized for you.
            </div>
          </div>
        </div>

      </div>
    </>
  );
}

// ── Sub-Components ──

function PageHeader({ title, pageNum }: { title: string; pageNum: number }) {
  return (
    <div className="page-header">
      <div className="page-header-left">
        <span className="page-header-logo">Rani</span>
        <span className="page-header-clinic">Beauty Clinic</span>
      </div>
      <div className="page-header-title">{title}</div>
      <div className="page-header-right">Page {pageNum}</div>
    </div>
  );
}

function TreatmentCard({ tx }: { tx: PlanData['treatments']['primary'][0] }) {
  const badge = priorityBadge(tx.priority);
  return (
    <div className="treatment-card">
      <div className="treatment-card-header">
        <div className="treatment-card-name">{tx.treatmentName}</div>
        <span className="treatment-priority-badge" style={{ background: badge.bg, color: badge.text }}>
          {badge.label}
        </span>
      </div>
      <div className="treatment-card-reasoning">{tx.aiReasoning}</div>
      <div className="treatment-card-meta">
        <div className="treatment-meta-item">
          <span className="treatment-meta-label">Sessions</span>
          <span className="treatment-meta-value">{tx.sessionsRequired}</span>
        </div>
        <div className="treatment-meta-item">
          <span className="treatment-meta-label">Interval</span>
          <span className="treatment-meta-value">{tx.intervalBetweenSessions}</span>
        </div>
        <div className="treatment-meta-item">
          <span className="treatment-meta-label">Results In</span>
          <span className="treatment-meta-value">{tx.timeToResults}</span>
        </div>
        <div className="treatment-meta-item">
          <span className="treatment-meta-label">Lasts</span>
          <span className="treatment-meta-value">{tx.longevity}</span>
        </div>
        <div className="treatment-meta-item">
          <span className="treatment-meta-label">Downtime</span>
          <span className="treatment-meta-value">{tx.downtime}</span>
        </div>
      </div>
      {tx.expectedImprovement && (
        <div className="treatment-card-improvement">
          Expected improvement: {tx.expectedImprovement}
        </div>
      )}
      {tx.synergiesWith && tx.synergiesWith.length > 0 && (
        <div className="treatment-card-synergies">
          Works well with: {tx.synergiesWith.join(', ')}
        </div>
      )}
    </div>
  );
}

// ── Print Styles ──

const printStyles = `
  /* ── Reset & Base ── */
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --navy: #0F1D2C;
    --gold: #C9A96E;
    --gold-light: #D4BA87;
    --gold-dark: #B8944F;
    --cream: #FAF8F5;
    --cream-dark: #F0EBE3;
    --text: #2D3748;
    --text-light: #718096;
    --text-lighter: #A0AEC0;
    --green: #059669;
    --amber: #D97706;
    --red: #DC2626;
    --border: #E8E2D9;
  }

  body {
    font-family: system-ui, -apple-system, 'Segoe UI', sans-serif;
    color: var(--text);
    line-height: 1.6;
    background: var(--cream);
    -webkit-font-smoothing: antialiased;
  }

  /* ── Print Document Container ── */
  .print-document {
    max-width: 850px;
    margin: 0 auto;
    padding-top: 60px;
  }

  /* ── Print Page Section ── */
  .print-page {
    background: white;
    margin: 24px auto;
    padding: 48px 56px;
    min-height: auto;
    border-radius: 4px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08), 0 8px 30px rgba(0,0,0,0.04);
    position: relative;
  }

  /* ══════════════════════════════════
     COVER PAGE
  ══════════════════════════════════ */
  .cover-page {
    min-height: 960px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    position: relative;
    overflow: hidden;
    background: white;
  }

  .cover-bg-pattern {
    position: absolute;
    inset: 0;
    opacity: 0.03;
    background-image:
      radial-gradient(circle at 20% 80%, var(--gold) 1px, transparent 1px),
      radial-gradient(circle at 80% 20%, var(--gold) 1px, transparent 1px),
      radial-gradient(circle at 50% 50%, var(--gold) 0.5px, transparent 0.5px);
    background-size: 60px 60px, 80px 80px, 40px 40px;
    pointer-events: none;
  }

  .cover-content {
    position: relative;
    z-index: 1;
    width: 100%;
    padding: 60px 48px;
  }

  .cover-logo {
    margin-bottom: 8px;
  }

  .cover-logo-rani {
    font-family: Georgia, 'Playfair Display', serif;
    font-size: 64px;
    font-weight: 700;
    color: var(--gold);
    display: block;
    letter-spacing: 4px;
  }

  .cover-logo-sub {
    font-family: system-ui, sans-serif;
    font-size: 16px;
    color: var(--text-light);
    letter-spacing: 8px;
    text-transform: uppercase;
    display: block;
    margin-top: -4px;
  }

  .cover-separator {
    width: 120px;
    height: 1px;
    background: var(--gold);
    margin: 48px auto;
  }

  .cover-title {
    font-family: system-ui, sans-serif;
    font-size: 13px;
    font-weight: 600;
    color: var(--navy);
    letter-spacing: 6px;
    text-transform: uppercase;
    margin-bottom: 48px;
  }

  .cover-prepared {
    font-family: Georgia, serif;
    font-size: 15px;
    color: var(--text-light);
    font-style: italic;
    margin-bottom: 12px;
  }

  .cover-patient-name {
    font-family: Georgia, 'Playfair Display', serif;
    font-size: 36px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 8px;
    letter-spacing: 1px;
  }

  .cover-date {
    font-size: 14px;
    color: var(--text-light);
    margin-bottom: 56px;
  }

  .cover-score-badge {
    width: 140px;
    height: 140px;
    border-radius: 50%;
    border: 3px solid var(--gold);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    margin: 0 auto 56px;
    background: white;
  }

  .cover-score-number {
    font-family: Georgia, serif;
    font-size: 44px;
    font-weight: 700;
    color: var(--navy);
    line-height: 1;
  }

  .cover-score-grade {
    font-size: 14px;
    font-weight: 700;
    color: var(--gold);
    letter-spacing: 2px;
    margin-top: 2px;
  }

  .cover-score-label {
    font-size: 9px;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 3px;
    margin-top: 4px;
  }

  .cover-footer {
    margin-top: auto;
  }

  .cover-footer-line {
    width: 60px;
    height: 1px;
    background: var(--border);
    margin: 0 auto 20px;
  }

  .cover-powered {
    font-size: 11px;
    color: var(--text-lighter);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .cover-clinic-info {
    font-size: 11px;
    color: var(--text-lighter);
  }

  /* ══════════════════════════════════
     PAGE HEADER
  ══════════════════════════════════ */
  .page-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 2px solid var(--gold);
    margin-bottom: 28px;
  }

  .page-header-left {
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .page-header-logo {
    font-family: Georgia, serif;
    font-size: 22px;
    font-weight: 700;
    color: var(--gold);
  }

  .page-header-clinic {
    font-size: 11px;
    color: var(--text-light);
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .page-header-title {
    font-family: Georgia, 'Playfair Display', serif;
    font-size: 20px;
    font-weight: 700;
    color: var(--navy);
  }

  .page-header-right {
    font-size: 11px;
    color: var(--text-lighter);
  }

  /* ══════════════════════════════════
     SECTION BLOCKS
  ══════════════════════════════════ */
  .section-block {
    margin-bottom: 28px;
  }

  .section-subtitle {
    font-family: Georgia, 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  /* ══════════════════════════════════
     SCORE BARS (Aura Device Analysis)
  ══════════════════════════════════ */
  .score-bars { display: flex; flex-direction: column; gap: 10px; }

  .score-bar-row {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .score-bar-label {
    width: 100px;
    font-size: 13px;
    font-weight: 500;
    color: var(--text);
    text-align: right;
  }

  .score-bar-track {
    flex: 1;
    height: 10px;
    background: var(--cream-dark);
    border-radius: 5px;
    overflow: hidden;
  }

  .score-bar-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold-dark), var(--gold));
    border-radius: 5px;
    transition: width 0.5s ease;
  }

  .score-bar-value {
    width: 36px;
    font-size: 12px;
    font-weight: 600;
    color: var(--navy);
    text-align: center;
  }

  .score-bar-severity {
    width: 70px;
    font-size: 11px;
    font-weight: 500;
    text-transform: capitalize;
  }

  .composite-score {
    margin-top: 12px;
    font-size: 13px;
    color: var(--text-light);
    text-align: right;
  }

  .composite-score strong {
    color: var(--navy);
    font-size: 15px;
  }

  /* ══════════════════════════════════
     AGE COMPARISON
  ══════════════════════════════════ */
  .age-comparison {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 24px;
    padding: 20px;
    flex-wrap: wrap;
  }

  .age-card {
    text-align: center;
    padding: 16px 28px;
    background: var(--cream);
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .age-card-value {
    font-family: Georgia, serif;
    font-size: 40px;
    font-weight: 700;
    color: var(--navy);
    line-height: 1;
  }

  .age-card-label {
    font-size: 12px;
    color: var(--text-light);
    margin-top: 6px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }

  .age-card-vs {
    font-family: Georgia, serif;
    font-size: 18px;
    color: var(--text-lighter);
    font-style: italic;
  }

  .age-delta {
    width: 100%;
    text-align: center;
    font-size: 14px;
    color: var(--text-light);
    font-style: italic;
    margin-top: 4px;
  }

  /* ══════════════════════════════════
     CONCERNS
  ══════════════════════════════════ */
  .concerns-list { display: flex; flex-direction: column; gap: 10px; }

  .concern-row {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 14px;
    background: var(--cream);
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .concern-dot {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex-shrink: 0;
  }

  .concern-info { flex: 1; }

  .concern-name {
    font-size: 14px;
    font-weight: 600;
    color: var(--navy);
  }

  .concern-desc {
    font-size: 12px;
    color: var(--text-light);
    margin-top: 2px;
  }

  .concern-severity {
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .concern-trending {
    font-size: 11px;
    color: var(--text-lighter);
    width: 80px;
    text-align: right;
  }

  /* ══════════════════════════════════
     AI SUMMARY
  ══════════════════════════════════ */
  .ai-summary-box {
    display: flex;
    gap: 16px;
    padding: 20px 24px;
    background: var(--cream);
    border-left: 4px solid var(--gold);
    border-radius: 0 8px 8px 0;
    margin-top: 20px;
  }

  .ai-summary-icon { font-size: 24px; flex-shrink: 0; }

  .ai-summary-title {
    font-family: Georgia, serif;
    font-size: 14px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 6px;
  }

  .ai-summary-text {
    font-size: 13px;
    color: var(--text-light);
    line-height: 1.7;
  }

  /* ══════════════════════════════════
     HIGHLIGHTS BAR
  ══════════════════════════════════ */
  .highlights-bar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 24px;
    padding: 16px;
    background: var(--cream);
    border-radius: 8px;
    border: 1px solid var(--border);
  }

  .highlight-item {
    font-size: 12px;
    color: var(--text);
    padding: 4px 12px;
    background: white;
    border-radius: 20px;
    border: 1px solid var(--border);
  }

  .highlight-check {
    color: var(--green);
    font-weight: 700;
    margin-right: 4px;
  }

  /* ══════════════════════════════════
     TIMELINE
  ══════════════════════════════════ */
  .timeline { display: flex; flex-direction: column; gap: 16px; }

  .timeline-phase {
    padding: 16px;
    border: 1px solid var(--border);
    border-radius: 8px;
    background: white;
    position: relative;
    border-left: 3px solid var(--gold);
  }

  .timeline-phase-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 8px;
  }

  .timeline-phase-badge {
    font-size: 10px;
    font-weight: 700;
    color: white;
    background: var(--navy);
    padding: 2px 10px;
    border-radius: 4px;
    letter-spacing: 1px;
    text-transform: uppercase;
  }

  .timeline-phase-name {
    font-family: Georgia, serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--navy);
  }

  .timeline-phase-duration {
    font-size: 12px;
    color: var(--text-light);
    margin-left: auto;
  }

  .timeline-phase-milestone {
    font-size: 13px;
    color: var(--text-light);
    font-style: italic;
    margin-bottom: 10px;
    padding-left: 2px;
  }

  .timeline-treatments {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .timeline-treatment-pill {
    font-size: 11px;
    padding: 3px 10px;
    background: var(--cream);
    border: 1px solid var(--border);
    border-radius: 4px;
    color: var(--text);
  }

  /* ══════════════════════════════════
     TREATMENT CARDS
  ══════════════════════════════════ */
  .treatment-card {
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 12px;
    background: white;
    page-break-inside: avoid;
  }

  .treatment-card-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 6px;
  }

  .treatment-card-name {
    font-family: Georgia, 'Playfair Display', serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--navy);
  }

  .treatment-priority-badge {
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    padding: 3px 10px;
    border-radius: 4px;
  }

  .treatment-card-reasoning {
    font-size: 13px;
    color: var(--text-light);
    font-style: italic;
    margin-bottom: 12px;
    line-height: 1.6;
  }

  .treatment-card-meta {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
  }

  .treatment-meta-item {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 6px 12px;
    background: var(--cream);
    border-radius: 6px;
    min-width: 80px;
  }

  .treatment-meta-label {
    font-size: 10px;
    color: var(--text-lighter);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .treatment-meta-value {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy);
  }

  .treatment-card-improvement {
    font-size: 12px;
    color: var(--green);
    margin-top: 10px;
    font-weight: 500;
  }

  .treatment-card-synergies {
    font-size: 11px;
    color: var(--text-lighter);
    margin-top: 4px;
  }

  /* ══════════════════════════════════
     ADDRESSED CONCERNS
  ══════════════════════════════════ */
  .addressed-concerns { display: flex; flex-direction: column; gap: 8px; }

  .addressed-concern-row {
    display: grid;
    grid-template-columns: 1fr 2fr 1fr;
    gap: 16px;
    padding: 10px 14px;
    background: var(--cream);
    border-radius: 6px;
    align-items: center;
  }

  .addressed-concern-name {
    font-size: 13px;
    font-weight: 600;
    color: var(--navy);
  }

  .addressed-concern-solution {
    font-size: 12px;
    color: var(--text);
  }

  .addressed-concern-timeline {
    font-size: 12px;
    color: var(--text-light);
    text-align: right;
  }

  /* ══════════════════════════════════
     SIMULATION / PROJECTIONS
  ══════════════════════════════════ */
  .sim-comparison {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
  }

  .sim-path {
    padding: 20px;
    border-radius: 12px;
    border: 1px solid var(--border);
  }

  .sim-path-with { background: #F0FAF0; border-color: #BBF0D0; }
  .sim-path-without { background: #FFF8F0; border-color: #FFE0B2; }

  .sim-path-header {
    font-family: Georgia, serif;
    font-size: 15px;
    font-weight: 700;
    margin-bottom: 10px;
    padding-bottom: 8px;
    border-bottom: 2px solid;
  }

  .sim-path-header-with { color: var(--green); border-color: var(--green); }
  .sim-path-header-without { color: var(--amber); border-color: var(--amber); }

  .sim-path-narrative {
    font-size: 12px;
    color: var(--text-light);
    margin-bottom: 14px;
    line-height: 1.6;
  }

  .sim-frames {
    display: flex;
    gap: 10px;
  }

  .sim-frame {
    flex: 1;
    text-align: center;
    padding: 10px;
    background: rgba(255,255,255,0.7);
    border-radius: 8px;
  }

  .sim-frame-time {
    font-size: 10px;
    font-weight: 700;
    color: var(--navy);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .sim-frame-score {
    font-family: Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--navy);
    line-height: 1;
  }

  .sim-frame-label {
    font-size: 9px;
    color: var(--text-lighter);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 4px;
  }

  .sim-frame-age {
    font-size: 11px;
    color: var(--text-light);
  }

  .sim-frame-desc {
    font-size: 10px;
    color: var(--text-lighter);
    margin-top: 6px;
    line-height: 1.4;
  }

  .differentiators { margin-bottom: 20px; }

  .differentiator-item {
    font-size: 13px;
    color: var(--text);
    padding: 6px 0;
    border-bottom: 1px solid var(--cream-dark);
  }

  .differentiator-bullet {
    color: var(--gold);
    margin-right: 8px;
  }

  .sim-delta-summary {
    display: flex;
    gap: 24px;
    justify-content: center;
    margin-top: 16px;
  }

  .sim-delta-item { text-align: center; }

  .sim-delta-value {
    font-family: Georgia, serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--green);
  }

  .sim-delta-label {
    font-size: 11px;
    color: var(--text-light);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* Prediction Cards (fallback) */
  .prediction-timeline {
    display: flex;
    gap: 14px;
    margin-bottom: 8px;
  }

  .prediction-card {
    flex: 1;
    text-align: center;
    padding: 18px 14px;
    border-radius: 10px;
    border: 1px solid var(--border);
  }

  .prediction-card-good { background: #F0FAF0; border-color: #BBF0D0; }
  .prediction-card-warn { background: #FFF8F0; border-color: #FFE0B2; }

  .prediction-card-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--text-light);
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 8px;
  }

  .prediction-card-score {
    font-family: Georgia, serif;
    font-size: 32px;
    font-weight: 700;
    color: var(--navy);
    line-height: 1;
  }

  .prediction-card-sublabel {
    font-size: 9px;
    color: var(--text-lighter);
    text-transform: uppercase;
    letter-spacing: 1px;
    margin-bottom: 6px;
  }

  .prediction-card-age {
    font-size: 12px;
    color: var(--text-light);
  }

  .prediction-card-concerns {
    font-size: 10px;
    color: var(--amber);
    margin-top: 6px;
  }

  .empty-state {
    text-align: center;
    padding: 48px 24px;
    color: var(--text-lighter);
    font-size: 14px;
    font-style: italic;
  }

  /* ══════════════════════════════════
     PACKAGES
  ══════════════════════════════════ */
  .packages-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
  }

  .package-card {
    padding: 22px 18px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: white;
    position: relative;
    page-break-inside: avoid;
  }

  .package-card-highlighted {
    border-color: var(--gold);
    border-width: 2px;
    box-shadow: 0 4px 16px rgba(201, 169, 110, 0.15);
  }

  .package-recommended-badge {
    position: absolute;
    top: -10px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 9px;
    font-weight: 700;
    color: white;
    background: var(--gold);
    padding: 3px 14px;
    border-radius: 10px;
    letter-spacing: 2px;
    text-transform: uppercase;
  }

  .package-tier {
    font-size: 10px;
    font-weight: 700;
    color: var(--gold);
    letter-spacing: 3px;
    text-transform: uppercase;
    margin-bottom: 4px;
  }

  .package-name {
    font-family: Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 2px;
  }

  .package-subtitle {
    font-size: 11px;
    color: var(--text-light);
    margin-bottom: 16px;
  }

  .package-pricing { margin-bottom: 12px; }

  .package-original {
    font-size: 14px;
    color: var(--text-lighter);
    text-decoration: line-through;
  }

  .package-price {
    font-family: Georgia, serif;
    font-size: 30px;
    font-weight: 700;
    color: var(--gold);
    line-height: 1.1;
  }

  .package-savings {
    font-size: 11px;
    color: var(--green);
    font-weight: 600;
    margin-top: 2px;
  }

  .package-sessions {
    font-size: 12px;
    color: var(--text-light);
    font-weight: 500;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid var(--border);
  }

  .package-items { margin-bottom: 12px; }

  .package-item {
    font-size: 12px;
    color: var(--text);
    padding: 3px 0;
    display: flex;
    align-items: baseline;
    gap: 6px;
  }

  .package-item-check {
    color: var(--green);
    font-weight: 700;
    font-size: 11px;
  }

  .package-extras {
    padding: 10px 0;
    border-top: 1px dashed var(--border);
    margin-bottom: 10px;
  }

  .package-extra-item {
    font-size: 11px;
    color: var(--gold-dark);
    padding: 2px 0;
  }

  .package-financing {
    font-size: 12px;
    color: var(--text-light);
    margin-bottom: 10px;
    padding: 8px;
    background: var(--cream);
    border-radius: 6px;
    text-align: center;
  }

  .package-financing strong {
    color: var(--navy);
  }

  .package-best-for {
    font-size: 11px;
    color: var(--text-lighter);
    font-style: italic;
    text-align: center;
  }

  /* ══════════════════════════════════
     AFTERCARE
  ══════════════════════════════════ */
  .aftercare-intro {
    font-size: 13px;
    color: var(--text-light);
    margin-bottom: 24px;
    font-style: italic;
    line-height: 1.6;
  }

  .aftercare-block {
    padding: 16px 18px;
    border: 1px solid var(--border);
    border-radius: 8px;
    margin-bottom: 16px;
    page-break-inside: avoid;
    background: white;
  }

  .aftercare-treatment-name {
    font-family: Georgia, serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 14px;
    padding-bottom: 8px;
    border-bottom: 1px solid var(--border);
  }

  .aftercare-section { margin-bottom: 12px; }

  .aftercare-section-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--text);
    margin-bottom: 6px;
  }

  .aftercare-list {
    list-style: none;
    padding: 0;
  }

  .aftercare-list li {
    font-size: 12px;
    color: var(--text-light);
    padding: 3px 0 3px 16px;
    position: relative;
  }

  .aftercare-list li::before {
    content: '\\2022';
    position: absolute;
    left: 0;
    color: var(--gold);
    font-weight: 700;
  }

  .aftercare-products {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .aftercare-product {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 6px 10px;
    background: var(--cream);
    border-radius: 4px;
  }

  .aftercare-product-name {
    font-weight: 600;
    color: var(--navy);
  }

  .aftercare-product-reason {
    color: var(--text-light);
    font-style: italic;
  }

  /* ══════════════════════════════════
     NEXT STEPS
  ══════════════════════════════════ */
  .next-steps-page {
    display: flex;
    flex-direction: column;
  }

  .next-steps-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 18px;
    margin-bottom: 36px;
  }

  .next-step-card {
    padding: 24px 18px;
    border: 1px solid var(--border);
    border-radius: 12px;
    background: var(--cream);
    text-align: center;
    page-break-inside: avoid;
  }

  .next-step-number {
    font-family: Georgia, serif;
    font-size: 36px;
    font-weight: 700;
    color: var(--gold);
    line-height: 1;
    margin-bottom: 12px;
  }

  .next-step-title {
    font-family: Georgia, serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--navy);
    margin-bottom: 8px;
  }

  .next-step-desc {
    font-size: 12px;
    color: var(--text-light);
    line-height: 1.6;
  }

  /* QR Section */
  .qr-section {
    display: flex;
    justify-content: center;
    margin-bottom: 32px;
  }

  .qr-box { text-align: center; }

  .qr-placeholder {
    width: 100px;
    height: 100px;
    margin: 0 auto 10px;
    border: 2px solid var(--navy);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
  }

  .qr-inner { position: relative; width: 70px; height: 70px; }

  .qr-pattern {
    width: 100%;
    height: 100%;
    background-image:
      linear-gradient(45deg, var(--navy) 25%, transparent 25%),
      linear-gradient(-45deg, var(--navy) 25%, transparent 25%),
      linear-gradient(45deg, transparent 75%, var(--navy) 75%),
      linear-gradient(-45deg, transparent 75%, var(--navy) 75%);
    background-size: 14px 14px;
    background-position: 0 0, 0 7px, 7px -7px, -7px 0;
    opacity: 0.15;
    border-radius: 4px;
  }

  .qr-text-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 700;
    color: var(--navy);
    letter-spacing: 2px;
  }

  .qr-label {
    font-size: 11px;
    color: var(--text-lighter);
  }

  /* Contact Section */
  .contact-section {
    text-align: center;
    margin-bottom: 28px;
    padding: 24px;
    background: var(--cream);
    border-radius: 12px;
  }

  .contact-brand {
    font-family: Georgia, serif;
    font-size: 22px;
    color: var(--navy);
    margin-bottom: 14px;
  }

  .contact-brand-rani {
    color: var(--gold);
    font-weight: 700;
  }

  .contact-details {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: 8px 20px;
  }

  .contact-item {
    font-size: 13px;
    color: var(--text-light);
  }

  .plan-validity {
    text-align: center;
    font-size: 11px;
    color: var(--text-lighter);
    line-height: 1.7;
    margin-bottom: 24px;
  }

  .final-footer { text-align: center; }

  .final-footer-line {
    width: 80px;
    height: 1px;
    background: var(--gold);
    margin: 0 auto 14px;
  }

  .final-footer-text {
    font-family: Georgia, serif;
    font-size: 13px;
    color: var(--text-light);
    font-style: italic;
  }

  /* ══════════════════════════════════
     NO-PRINT ELEMENTS
  ══════════════════════════════════ */
  .no-print { display: block; }

  /* ══════════════════════════════════
     PRINT STYLES
  ══════════════════════════════════ */
  @page {
    size: letter;
    margin: 0.6in 0.65in;
  }

  @media print {
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      background: white !important;
      font-size: 11px;
    }

    .no-print { display: none !important; }

    .print-document {
      max-width: none;
      padding: 0;
      margin: 0;
    }

    .print-page {
      box-shadow: none;
      margin: 0;
      border-radius: 0;
      padding: 0;
      page-break-before: always;
      page-break-inside: avoid;
    }

    .print-page:first-child {
      page-break-before: auto;
    }

    /* Cover adjustments for print */
    .cover-page {
      min-height: 100vh;
      padding: 0;
    }

    .cover-bg-pattern {
      opacity: 0.02;
    }

    /* Ensure cards don't break */
    .treatment-card,
    .aftercare-block,
    .package-card,
    .next-step-card,
    .concern-row,
    .timeline-phase {
      page-break-inside: avoid;
    }

    /* Ensure backgrounds print */
    .score-bar-fill,
    .cover-score-badge,
    .timeline-phase-badge,
    .treatment-priority-badge,
    .package-recommended-badge,
    .sim-path-with,
    .sim-path-without,
    .prediction-card-good,
    .prediction-card-warn,
    .ai-summary-box,
    .highlights-bar,
    .age-card,
    .concern-row,
    .treatment-meta-item,
    .next-step-card,
    .contact-section,
    .aftercare-product,
    .package-financing {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }

    /* Tighter spacing for print */
    .section-block { margin-bottom: 18px; }
    .page-header { margin-bottom: 18px; }
    .packages-grid { gap: 10px; }
    .next-steps-grid { gap: 12px; }

    /* Score bars thinner for print */
    .score-bar-track { height: 8px; }

    /* Smaller fonts for print density */
    .cover-logo-rani { font-size: 56px; }
    .cover-patient-name { font-size: 30px; }
    .page-header-title { font-size: 18px; }
    .package-price { font-size: 26px; }
  }
`;
