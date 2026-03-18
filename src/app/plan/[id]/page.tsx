import type { Metadata } from 'next';
import TreatmentPlanClient from './TreatmentPlanClient';

export const metadata: Metadata = {
  title: 'Your Personalized Treatment Plan | Rani Beauty Clinic',
  description:
    'Your custom treatment roadmap crafted by the aesthetic experts at Rani Beauty Clinic in Renton, WA.',
  robots: { index: false, follow: false },
};

interface PageProps {
  params: { id: string };
}

export default function TreatmentPlanPage({ params }: PageProps) {
  return <TreatmentPlanClient planId={params.id} />;
}
