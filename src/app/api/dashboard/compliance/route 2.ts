import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth/session';
import {
  calculateComplianceScore,
  calculateHIPAAScore,
  calculateOSHAScore,
  calculateLicensingScore,
  calculateDEAScore,
  calculateDeviceScore,
  calculateConsentScore,
  getAccessLogs,
  getDisclosures,
  getBreaches,
  getTrainingRecords,
  getBAAs,
  getSharpsLogs,
  getSDSSheets,
  getIncidents,
  getPPEInventory,
  getOSHAInspectionChecklist,
  getProviderLicenses,
  getDelegationAgreements,
  getSubstances,
  getReconciliations,
  getWasteLogs,
  getDevices,
  getMaintenanceHistory,
  getCalibrationHistory,
  getAdverseEvents,
  getSignedConsents,
  getConsentTemplates,
} from '@/lib/compliance';
import { queryAuditLog, exportAuditLog } from '@/lib/compliance/audit-trail';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');

    // Section-specific responses
    if (section === 'hipaa') {
      const hipaaScore = calculateHIPAAScore();
      return NextResponse.json({
        trainingRecords: getTrainingRecords(),
        baas: getBAAs(),
        breaches: getBreaches(),
        accessLogs: getAccessLogs(),
        score: hipaaScore.score,
      });
    }

    if (section === 'osha') {
      const oshaScore = calculateOSHAScore();
      return NextResponse.json({
        sharpsLogs: getSharpsLogs(),
        sdsSheets: getSDSSheets(),
        incidents: getIncidents(),
        ppeInventory: getPPEInventory(),
        score: oshaScore.score,
        checklist: getOSHAInspectionChecklist(),
      });
    }

    if (section === 'licenses') {
      const licensingScore = calculateLicensingScore();
      return NextResponse.json({
        licenses: getProviderLicenses(),
        delegations: getDelegationAgreements(),
        score: licensingScore.score,
      });
    }

    if (section === 'consents') {
      return NextResponse.json({
        templates: getConsentTemplates(),
        recentConsents: getSignedConsents(),
        score: calculateConsentScore().score,
      });
    }

    if (section === 'substances') {
      const deaScore = calculateDEAScore();
      return NextResponse.json({
        substances: getSubstances(),
        reconciliations: getReconciliations(),
        wasteLogs: getWasteLogs(),
        score: deaScore.score,
      });
    }

    if (section === 'devices') {
      const deviceScore = calculateDeviceScore();
      return NextResponse.json({
        devices: getDevices(),
        maintenanceRecords: getMaintenanceHistory(),
        calibrationLogs: getCalibrationHistory(),
        adverseEvents: getAdverseEvents(),
        score: deviceScore.score,
      });
    }

    if (section === 'incidents') {
      return NextResponse.json({
        incidents: getIncidents(),
      });
    }

    if (section === 'audit') {
      const category = searchParams.get('category') as any;
      const severity = searchParams.get('severity') as any;
      const search = searchParams.get('search') || undefined;
      const limit = parseInt(searchParams.get('limit') || '100');
      const offset = parseInt(searchParams.get('offset') || '0');

      const result = queryAuditLog({
        category,
        severity,
        search,
        limit,
        offset,
      });

      return NextResponse.json(result);
    }

    if (section === 'audit-export') {
      const result = exportAuditLog({});
      return NextResponse.json(result);
    }

    if (section === 'policies') {
      return NextResponse.json({ policies: [] });
    }

    // Default: return overall compliance score
    const complianceScore = calculateComplianceScore();
    return NextResponse.json(complianceScore);
  } catch (error) {
    console.error('Compliance API error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch compliance data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case 'log_phi_access': {
        const { logPHIAccess } = await import('@/lib/compliance/hipaa-audit');
        const entry = logPHIAccess(data);
        return NextResponse.json(entry);
      }

      case 'record_disclosure': {
        const { recordDisclosure } = await import('@/lib/compliance/hipaa-audit');
        const disclosure = recordDisclosure(data);
        return NextResponse.json(disclosure);
      }

      case 'report_breach': {
        const { reportBreach } = await import('@/lib/compliance/hipaa-audit');
        const breach = reportBreach(data);
        return NextResponse.json(breach);
      }

      case 'record_training': {
        const { recordTraining } = await import('@/lib/compliance/hipaa-audit');
        const training = recordTraining(data);
        return NextResponse.json(training);
      }

      case 'add_baa': {
        const { addBAA } = await import('@/lib/compliance/hipaa-audit');
        const baa = addBAA(data);
        return NextResponse.json(baa);
      }

      case 'create_incident': {
        const { createIncidentReport } = await import('@/lib/compliance/osha-tracker');
        const incident = createIncidentReport(data);
        return NextResponse.json(incident);
      }

      case 'add_sharps_log': {
        const { addSharpsLog } = await import('@/lib/compliance/osha-tracker');
        const log = addSharpsLog(data);
        return NextResponse.json(log);
      }

      case 'add_sds': {
        const { addSDSSheet } = await import('@/lib/compliance/osha-tracker');
        const sds = addSDSSheet(data);
        return NextResponse.json(sds);
      }

      case 'add_ppe': {
        const { addPPEItem } = await import('@/lib/compliance/osha-tracker');
        const ppe = addPPEItem(data);
        return NextResponse.json(ppe);
      }

      case 'add_license': {
        const { addProviderLicense } = await import('@/lib/compliance/state-regulations');
        const license = addProviderLicense(data);
        return NextResponse.json(license);
      }

      case 'add_delegation': {
        const { addDelegationAgreement } = await import('@/lib/compliance/state-regulations');
        const delegation = addDelegationAgreement(data);
        return NextResponse.json(delegation);
      }

      case 'add_substance': {
        const { addSubstance } = await import('@/lib/compliance/controlled-substances');
        const substance = addSubstance(data);
        return NextResponse.json(substance);
      }

      case 'reconcile_substance': {
        const { performReconciliation } = await import('@/lib/compliance/controlled-substances');
        const recon = performReconciliation(data);
        return NextResponse.json(recon);
      }

      case 'log_waste': {
        const { logWaste } = await import('@/lib/compliance/controlled-substances');
        const waste = logWaste(data);
        return NextResponse.json(waste);
      }

      case 'record_custody': {
        const { recordCustodyEvent } = await import('@/lib/compliance/controlled-substances');
        const custody = recordCustodyEvent(data);
        return NextResponse.json(custody);
      }

      case 'add_device': {
        const { addDevice } = await import('@/lib/compliance/device-compliance');
        const device = addDevice(data);
        return NextResponse.json(device);
      }

      case 'add_maintenance': {
        const { addMaintenanceRecord } = await import('@/lib/compliance/device-compliance');
        const maint = addMaintenanceRecord(data);
        return NextResponse.json(maint);
      }

      case 'add_calibration': {
        const { addCalibrationLog } = await import('@/lib/compliance/device-compliance');
        const cal = addCalibrationLog(data);
        return NextResponse.json(cal);
      }

      case 'report_adverse_event': {
        const { reportAdverseEvent } = await import('@/lib/compliance/device-compliance');
        const event = reportAdverseEvent(data);
        return NextResponse.json(event);
      }

      case 'sign_consent': {
        const { signConsent } = await import('@/lib/compliance/consent-manager');
        const consent = signConsent(data);
        return NextResponse.json(consent);
      }

      case 'revoke_consent': {
        const { revokeConsent } = await import('@/lib/compliance/consent-manager');
        const consent = revokeConsent(data.id, data.reason, data.revokedBy);
        return NextResponse.json(consent);
      }

      case 'validate_consent': {
        const { validateConsentForTreatment } = await import('@/lib/compliance/consent-manager');
        const result = validateConsentForTreatment(data.patientId, data.treatmentName);
        return NextResponse.json(result);
      }

      case 'validate_scope': {
        const { validateProcedureScope } = await import('@/lib/compliance/state-regulations');
        const result = validateProcedureScope(data.providerType, data.procedure);
        return NextResponse.json(result);
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Compliance POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to process compliance action' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, id, ...updates } = body;

    switch (action) {
      case 'update_breach': {
        const { updateBreach } = await import('@/lib/compliance/hipaa-audit');
        const result = updateBreach(id, updates);
        return result
          ? NextResponse.json(result)
          : NextResponse.json({ error: 'Breach not found' }, { status: 404 });
      }

      case 'update_incident': {
        const { updateIncident } = await import('@/lib/compliance/osha-tracker');
        const result = updateIncident(id, updates);
        return result
          ? NextResponse.json(result)
          : NextResponse.json({ error: 'Incident not found' }, { status: 404 });
      }

      case 'update_license': {
        const { updateProviderLicense } = await import('@/lib/compliance/state-regulations');
        const result = updateProviderLicense(id, updates);
        return result
          ? NextResponse.json(result)
          : NextResponse.json({ error: 'License not found' }, { status: 404 });
      }

      case 'update_device': {
        const { updateDevice } = await import('@/lib/compliance/device-compliance');
        const result = updateDevice(id, updates);
        return result
          ? NextResponse.json(result)
          : NextResponse.json({ error: 'Device not found' }, { status: 404 });
      }

      case 'update_substance': {
        const { updateSubstance } = await import('@/lib/compliance/controlled-substances');
        const result = updateSubstance(id, updates);
        return result
          ? NextResponse.json(result)
          : NextResponse.json({ error: 'Substance not found' }, { status: 404 });
      }

      case 'resolve_discrepancy': {
        const { resolveDiscrepancy } = await import('@/lib/compliance/controlled-substances');
        const result = resolveDiscrepancy(id, updates.resolutionNotes);
        return result
          ? NextResponse.json(result)
          : NextResponse.json({ error: 'Reconciliation not found' }, { status: 404 });
      }

      case 'update_adverse_event': {
        const { updateAdverseEvent } = await import('@/lib/compliance/device-compliance');
        const result = updateAdverseEvent(id, updates);
        return result
          ? NextResponse.json(result)
          : NextResponse.json({ error: 'Adverse event not found' }, { status: 404 });
      }

      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Compliance PATCH error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update compliance record' },
      { status: 500 }
    );
  }
}
