import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Medical Weight Loss | Semaglutide & Tirzepatide | Rani Beauty Clinic',
  description:
    'Physician-supervised medical weight loss starting at $349/month. Semaglutide & tirzepatide shipped to your door. Serving Renton, Kent, Auburn & South King County. Free consultation.',
  alternates: {
    canonical: 'https://www.ranibeautyclinic.com/weight-loss',
  },
  openGraph: {
    title: 'Medical Weight Loss Starting at $349/Month | Rani Beauty Clinic',
    description:
      'Physician-supervised GLP-1 weight loss. Semaglutide & tirzepatide shipped to your door. No clinic visits required. Free consultation.',
    type: 'website',
    url: 'https://www.ranibeautyclinic.com/weight-loss',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'Rani Beauty Clinic - Medical Weight Loss' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medical Weight Loss Starting at $349/Month | Rani Beauty Clinic',
    description:
      'Physician-supervised GLP-1 medications shipped to your door. Semaglutide & tirzepatide from $349/month.',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function WeightLossLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
