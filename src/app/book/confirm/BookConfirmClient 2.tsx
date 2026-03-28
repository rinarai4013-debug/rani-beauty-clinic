'use client';

import { useSearchParams } from 'next/navigation';
import ConfirmationCard from '@/components/booking/ConfirmationCard';
import AddToCalendar from '@/components/booking/AddToCalendar';
import type { Appointment } from '@/lib/booking/types';

export default function BookConfirmClient() {
  const searchParams = useSearchParams();
  const appointmentId = searchParams.get('appointmentId');

  // In production, fetch appointment from API
  // For now, show a placeholder
  const appointment: Appointment = {
    id: appointmentId ?? 'demo',
    clientId: 'demo-client',
    clientName: 'Guest',
    clientEmail: 'guest@example.com',
    clientPhone: '',
    serviceId: 'hydrafacial-signature',
    serviceName: 'Signature HydraFacial',
    providerId: 'raj',
    providerName: 'Raj',
    roomId: 'aura',
    date: new Date().toISOString().split('T')[0],
    startTime: '10:00',
    endTime: '11:00',
    duration: 60,
    status: 'confirmed',
    isNewClient: true,
    isMember: false,
    estimatedRevenue: 225,
    depositPaid: 0,
    notes: '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isEmergencySlot: false,
    source: 'online',
  };

  return (
    <div className="space-y-8">
      <ConfirmationCard appointment={appointment} />
      <AddToCalendar appointment={appointment} />

      <div className="text-center space-y-4">
        <a
          href="/book/intake"
          className="inline-block w-full py-3 rounded-xl bg-[#0F1D2C] text-white font-medium hover:bg-[#1a2d40] transition-colors text-center"
        >
          Complete Intake Form (Recommended)
        </a>
        <a
          href="/"
          className="inline-block text-sm text-[#6B7280] hover:text-[#0F1D2C]"
        >
          Return to Homepage
        </a>
      </div>
    </div>
  );
}
