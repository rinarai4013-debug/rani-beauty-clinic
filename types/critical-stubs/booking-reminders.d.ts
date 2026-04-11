import type { Appointment } from "@/lib/booking/types";

export function buildReminderSchedule(appointment: Appointment): unknown;
export function processDueReminders(
  reminderConfigs: unknown[],
  appointments: Appointment[]
): unknown[];
export function generateRebookingNudges(
  completedAppointments: Appointment[],
  upcomingAppointments: Appointment[]
): unknown[];
