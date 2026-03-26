import { getPatientSession } from '@/lib/patient-auth/session';
import PortalNav from '@/components/portal/PortalNav';
import PortalLogin from '@/components/portal/PortalLogin';

export const metadata = {
  title: {
    default: 'Patient Portal | Rani Beauty Clinic',
    template: '%s | Rani Beauty Clinic Portal',
  },
  description: 'Access your treatment history, appointments, loyalty rewards, and more.',
  robots: { index: false, follow: false },
};

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getPatientSession();

  // Not authenticated - show login screen
  if (!session) {
    return (
      <div className="min-h-screen bg-rani-cream">
        <PortalLogin />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-rani-cream">
      <PortalNav patientName={session.name} />

      {/* Main content area */}
      <main className="lg:pl-64">
        {/* Mobile header spacing */}
        <div className="lg:hidden h-14" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-24 lg:pb-6">
          {children}
        </div>
      </main>
    </div>
  );
}
