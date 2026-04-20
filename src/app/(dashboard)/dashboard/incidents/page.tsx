import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission } from '@/lib/auth/roles';
import IncidentsClient from './IncidentsClient';

const canViewIncidents = new Set(['ceo', 'provider', 'operations']);

export default async function IncidentsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/dashboard/login');
  }

  if (!hasPermission(session.role, 'view_executive')) {
    redirect('/dashboard/login');
  }

  if (!canViewIncidents.has(session.role)) {
    return (
      <main className="rounded-xl border border-rani-border bg-white p-6">
        <h1 className="font-heading text-2xl font-bold text-rani-navy">incident reporting</h1>
        <p className="mt-2 font-body text-sm text-rani-muted">
          you do not have permission to view incident reports.
        </p>
      </main>
    );
  }

  const canEditMedicalDirectorFields = session.role === 'ceo' || session.role === 'provider';

  return <IncidentsClient canEditMedicalDirectorFields={canEditMedicalDirectorFields} />;
}
