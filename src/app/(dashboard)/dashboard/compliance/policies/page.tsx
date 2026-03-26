'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';
import PolicyLibrary from '@/components/dashboard/compliance/PolicyLibrary';
import type { Policy } from '@/types/compliance';

const DEFAULT_POLICIES: Policy[] = [
  {
    id: 'pol_1', title: 'HIPAA Privacy Policy', category: 'hipaa', version: '3.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-12-15', nextReviewDate: '2026-12-15',
    approvedBy: 'Dr. Rina', content: 'Comprehensive HIPAA privacy policy covering PHI handling, patient rights, and minimum necessary standard.',
    status: 'active', documentUrl: undefined,
    acknowledgments: [
      { staffId: 's1', staffName: 'Rina', acknowledgedDate: '2025-12-20', version: '3.0' },
      { staffId: 's2', staffName: 'Mom', acknowledgedDate: '2025-12-20', version: '3.0' },
    ],
    changeLog: [
      { date: '2025-12-15', version: '3.0', changes: 'Annual review and update', changedBy: 'Dr. Rina' },
      { date: '2024-12-10', version: '2.0', changes: 'Updated breach notification procedures', changedBy: 'Dr. Rina' },
    ],
  },
  {
    id: 'pol_2', title: 'HIPAA Security Policy', category: 'hipaa', version: '2.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-12-15', nextReviewDate: '2026-12-15',
    approvedBy: 'Dr. Rina', content: 'Technical, physical, and administrative safeguards for ePHI.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_3', title: 'Bloodborne Pathogen Exposure Control Plan', category: 'osha', version: '2.0',
    effectiveDate: '2025-06-01', lastReviewDate: '2025-06-01', nextReviewDate: '2026-06-01',
    approvedBy: 'Dr. Rina', content: 'OSHA-compliant exposure control plan for bloodborne pathogens.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_4', title: 'Hazard Communication Program', category: 'osha', version: '1.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-01-01', nextReviewDate: '2026-01-01',
    approvedBy: 'Dr. Rina', content: 'GHS-compliant hazard communication including SDS accessibility.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_5', title: 'Controlled Substance Management Policy', category: 'clinical', version: '2.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-12-01', nextReviewDate: '2026-06-01',
    approvedBy: 'Dr. Rina', content: 'DEA-compliant policy for ordering, storing, dispensing, reconciling, and disposing of controlled substances.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_6', title: 'Informed Consent Policy', category: 'clinical', version: '2.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-06-15', nextReviewDate: '2026-06-15',
    approvedBy: 'Dr. Rina', content: 'Requirements for obtaining and documenting informed consent before all treatments.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_7', title: 'Medical Device Safety Policy', category: 'clinical', version: '1.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-01-01', nextReviewDate: '2026-01-01',
    approvedBy: 'Dr. Rina', content: 'FDA device tracking, maintenance, calibration, and adverse event reporting.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_8', title: 'Emergency Action Plan', category: 'emergency', version: '2.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-06-01', nextReviewDate: '2026-06-01',
    approvedBy: 'Dr. Rina', content: 'Emergency procedures for medical emergencies, fire, and natural disasters.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_9', title: 'Infection Control Policy', category: 'infection_control', version: '2.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-06-01', nextReviewDate: '2026-06-01',
    approvedBy: 'Dr. Rina', content: 'Standard precautions, hand hygiene, sterilization, and surface disinfection protocols.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_10', title: 'Staff Delegation and Supervision Policy', category: 'clinical', version: '1.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-01-01', nextReviewDate: '2026-01-01',
    approvedBy: 'Dr. Rina', content: 'WA state scope of practice, delegation agreements, and supervision requirements per provider type.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_11', title: 'Records Retention Policy', category: 'administrative', version: '1.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-01-01', nextReviewDate: '2026-01-01',
    approvedBy: 'Dr. Rina', content: 'Document and medical record retention schedules per WA state and federal requirements.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
  {
    id: 'pol_12', title: 'Patient Rights and Responsibilities', category: 'administrative', version: '1.0',
    effectiveDate: '2025-01-01', lastReviewDate: '2025-01-01', nextReviewDate: '2026-01-01',
    approvedBy: 'Dr. Rina', content: 'Patient rights including access to records, privacy, and complaint procedures.',
    status: 'active', acknowledgments: [], changeLog: [],
  },
];

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>(DEFAULT_POLICIES);

  useEffect(() => {
    fetch('/api/dashboard/compliance?section=policies')
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.policies && data.policies.length > 0) setPolicies(data.policies);
      })
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/dashboard/compliance" className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-rani-cream transition-colors">
          <ChevronLeft className="w-4 h-4 text-rani-muted" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F1D2C] font-['Playfair_Display']">Policy Library</h1>
          <p className="text-gray-500 mt-0.5 text-sm">Clinic policies with version history and acknowledgment tracking</p>
        </div>
      </div>
      <PolicyLibrary policies={policies} />
    </div>
  );
}
