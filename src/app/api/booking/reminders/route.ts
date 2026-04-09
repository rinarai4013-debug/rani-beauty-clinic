import { NextRequest, NextResponse } from 'next/server';
import { addDays, format, subDays } from 'date-fns';
import { buildReminderSchedule, processDueReminders, generateRebookingNudges } from '@/lib/booking/reminders';
import { loadAppointmentsForRange } from '@/lib/booking/data';
import { logEvent } from '@/lib/logging/structured-logger';
import { getSession } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get('type');
  const today = new Date();
  const startDate = format(subDays(today, 365), 'yyyy-MM-dd');
  const endDate = format(addDays(today, 90), 'yyyy-MM-dd');

  try {
    const appointments = await loadAppointmentsForRange(startDate, endDate);

    if (type === 'rebooking') {
      const completed = appointments.filter((a) => a.status === 'completed');
      const upcoming = appointments.filter((a) => a.status !== 'completed' && a.status !== 'cancelled');
      const nudges = generateRebookingNudges(completed, upcoming);
      return NextResponse.json({ nudges });
    }

    const reminderConfigs = appointments
      .filter((a) => a.status !== 'cancelled' && a.status !== 'no-show')
      .map((a) => buildReminderSchedule(a));

    const reminders = processDueReminders(reminderConfigs, appointments);
    return NextResponse.json({ reminders });
  } catch (error) {
    logEvent('api', 'error', 'Reminders fetch failed', { error: String(error) });
    return NextResponse.json({ error: 'Failed to fetch reminders' }, { status: 500 });
  }
}
