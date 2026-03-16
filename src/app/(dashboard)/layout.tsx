import { Toaster } from 'react-hot-toast';
import SoundProvider from '@/components/dashboard/sound/SoundProvider';

export const metadata = {
  title: {
    template: '%s | Rani Dashboard',
    default: 'Command Center | Rani Beauty Clinic',
  },
  robots: { index: false, follow: false },
};

export default function DashboardRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SoundProvider>
      {children}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#0F1D2C',
            color: '#FAF8F5',
            borderRadius: '12px',
            fontSize: '14px',
            fontFamily: 'var(--font-body)',
          },
          success: {
            iconTheme: { primary: '#F3D6BE', secondary: '#0F1D2C' },
          },
        }}
      />
    </SoundProvider>
  );
}
