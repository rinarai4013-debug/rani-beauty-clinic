import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'GLP-1 Weight Loss Injections | Semaglutide & Tirzepatide',
  description: 'Medical weight loss with GLP-1 injections at Rani Beauty Clinic. FDA-approved semaglutide and tirzepatide programs with physician oversight in Bothell, WA.',
  openGraph: {
    title: 'GLP-1 Weight Loss Injections | Rani Beauty Clinic',
    description: 'Medical weight loss with GLP-1 injections. FDA-approved semaglutide and tirzepatide programs with physician oversight.',
    url: 'https://www.ranibeautyclinic.com/glp1',
  },
  alternates: {
    canonical: 'https://www.ranibeautyclinic.com/glp1',
  },
};

export default function GLP1Layout({ children }: { children: React.ReactNode }) {
  return children;
}
