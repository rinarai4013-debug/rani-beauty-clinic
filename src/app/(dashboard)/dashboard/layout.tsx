import DashboardShell from '@/components/dashboard/layout/DashboardShell';
import { getSession } from '@/lib/auth/session';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  // No session: render children without the shell (login page or client-side redirect)
  if (!session) {
    return <>{children}</>;
  }

  return (
    <DashboardShell role={session.role} displayName={session.displayName}>
      {children}
    </DashboardShell>
  );
}
