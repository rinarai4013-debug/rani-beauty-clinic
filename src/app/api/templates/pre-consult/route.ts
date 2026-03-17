import { NextRequest, NextResponse } from 'next/server';
import {
  getPreConsultTemplate,
  getAllPreConsultTemplates,
  type PreConsultVars,
} from '@/lib/templates/pre-consult';

/**
 * POST /api/templates/pre-consult
 *
 * Called by n8n WF3 (Appointment Created webhook) to get rendered
 * pre-consult SMS and email templates.
 *
 * Body:
 * {
 *   step: "booking-confirmation" | "24h-reminder" | "2h-reminder" | "all",
 *   firstName: string,
 *   serviceName: string,
 *   serviceCategory: string,  // Laser, Injectable, Facial, Wellness, Body, Consult
 *   providerName: string,
 *   appointmentDate: string,  // "March 20, 2026"
 *   appointmentTime: string,  // "2:30 PM"
 *   duration: number,         // minutes
 *   isNewClient?: boolean,
 *   depositPaid?: boolean,
 *   depositAmount?: number,
 *   consultType?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      step, firstName, serviceName, serviceCategory,
      providerName, appointmentDate, appointmentTime,
      duration, isNewClient, depositPaid, depositAmount, consultType,
    } = body;

    if (!firstName || !serviceName || !providerName) {
      return NextResponse.json(
        { error: 'Missing required fields: firstName, serviceName, providerName' },
        { status: 400 }
      );
    }

    const vars: PreConsultVars = {
      firstName,
      serviceName,
      serviceCategory: serviceCategory || 'Consult',
      providerName,
      appointmentDate: appointmentDate || 'your scheduled date',
      appointmentTime: appointmentTime || 'your scheduled time',
      duration: duration || 30,
      isNewClient: isNewClient || false,
      depositPaid: depositPaid || false,
      depositAmount,
      consultType,
    };

    if (step === 'all') {
      const templates = getAllPreConsultTemplates(vars);
      return NextResponse.json({ templates });
    }

    const template = getPreConsultTemplate(step || 'booking-confirmation', vars);
    if (!template) {
      return NextResponse.json(
        { error: `Unknown step: ${step}. Valid: booking-confirmation, 24h-reminder, 2h-reminder` },
        { status: 400 }
      );
    }

    return NextResponse.json(template);
  } catch (error) {
    console.error('Pre-consult template error:', error);
    return NextResponse.json({ error: 'Failed to generate template' }, { status: 500 });
  }
}
