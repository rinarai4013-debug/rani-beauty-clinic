import { describe, expect, it } from 'vitest';
import { buildMetabolicFunnelReport } from '@/lib/analytics/metabolic-funnel-report';

describe('buildMetabolicFunnelReport', () => {
  it('aggregates started/held/completed by track from sessions and intake records', () => {
    const sessions = [
      {
        id: 'ms_1',
        phase: 'provider_review',
        clinicStatus: 'reviewed',
        bookedAppointmentId: null,
        clinicNotes: 'Metabolic handoff submitted by Rina: glp1 track, start tier, clinic fulfillment. Provider signoff required before launch.',
        intakeData: null,
        activityLog: [],
      },
      {
        id: 'ms_2',
        phase: 'completed',
        clinicStatus: 'booked',
        bookedAppointmentId: 'apt_123',
        clinicNotes: 'Metabolic handoff submitted by Rina: hormones track, elite tier, home fulfillment.',
        intakeData: null,
        activityLog: [],
      },
    ] as unknown as Parameters<typeof buildMetabolicFunnelReport>[0];

    const intakes = [
      {
        fields: {
          'Intake Summary (AI)': [
            'Service Interest: Peptide Program',
            'Recommended Track: peptides',
            'Recommendation Status: eligible',
          ].join('\n'),
          'Processing Status': 'New',
        },
      },
      {
        fields: {
          'Intake Summary (AI)': [
            'Service Interest: GLP-1 Program',
            'Recommended Track: glp1',
            'Recommendation Status: provider-review-required',
          ].join('\n'),
          'Processing Status': 'Responded',
        },
      },
    ] as Parameters<typeof buildMetabolicFunnelReport>[1];

    const report = buildMetabolicFunnelReport(sessions, intakes);

    expect(report.totals.started).toBe(3);
    expect(report.totals.held).toBe(2);
    expect(report.totals.completed).toBe(0);

    expect(report.byTrack.glp1.started).toBe(2);
    expect(report.byTrack.glp1.held).toBe(2);
    expect(report.byTrack.glp1.completed).toBe(0);

    expect(report.byTrack.hormones.started).toBe(0);
    expect(report.byTrack.hormones.completed).toBe(0);

    expect(report.byTrack.peptides.started).toBe(1);
    expect(report.byTrack.peptides.eligible).toBe(1);
  });

  it('ignores records with unknown track', () => {
    const sessions = [
      {
        id: 'ms_unknown',
        phase: 'plan_ready',
        clinicStatus: 'new',
        bookedAppointmentId: null,
        clinicNotes: 'General aesthetics consult',
        intakeData: { treatmentInterests: ['Botox', 'Hydrafacial'] },
        activityLog: [],
      },
    ] as unknown as Parameters<typeof buildMetabolicFunnelReport>[0];

    const report = buildMetabolicFunnelReport(sessions, []);
    expect(report.totals.started).toBe(0);
    expect(report.byTrack.unknown.started).toBe(0);
  });

  it('does not count responded+eligible intake as completed without booking signal', () => {
    const report = buildMetabolicFunnelReport(
      [],
      [
        {
          fields: {
            'Intake Summary (AI)': [
              'Service Interest: GLP-1 Program',
              'Recommended Track: glp1',
              'Recommendation Status: eligible',
            ].join('\n'),
            'Processing Status': 'Responded',
          },
        },
      ] as Parameters<typeof buildMetabolicFunnelReport>[1],
    );

    expect(report.totals.started).toBe(1);
    expect(report.totals.completed).toBe(0);
    expect(report.byTrack.glp1.eligible).toBe(1);
  });
});
