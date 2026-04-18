'use client';

import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle, Info, Calendar, Mail, Phone } from 'lucide-react';
import type { MastermindSession } from '@/types/mastermind';

interface PatientOverviewProps {
  session: MastermindSession;
}

export default function PatientOverview({ session }: PatientOverviewProps) {
  const intake = session.intakeData;
  const scan = session.auraScanResult;
  const flags = scan?.medicalFlags || [];

  // Calculate age from DOB
  const age = intake?.dob
    ? Math.floor(
        (Date.now() - new Date(intake.dob as string).getTime()) / (365.25 * 24 * 60 * 60 * 1000)
      )
    : null;

  return (
    <div className="space-y-5">
      {/* Patient Name & Basics */}
      <div>
        <h2 className="font-[family-name:var(--font-heading)] text-lg text-[#0F1D2C]">
          {session.patientName || 'Unknown Patient'}
        </h2>
        <div className="flex flex-wrap items-center gap-3 mt-2">
          {age && (
            <span className="font-body text-xs text-[#0F1D2C]/60">
              Age: {age}
            </span>
          )}
          {scan && (
            <span className="px-2 py-0.5 rounded-full bg-[#C9A96E]/10 font-body text-xs font-medium text-rani-gold-accessible">
              Fitzpatrick {scan.skinAnalysis.fitzpatrickType}
            </span>
          )}
        </div>
      </div>

      {/* Contact */}
      <div className="space-y-2">
        {session.patientEmail && (
          <div className="flex items-center gap-2">
            <Mail className="w-3.5 h-3.5 text-[#0F1D2C]/30" />
            <span className="font-body text-xs text-[#0F1D2C]/60">{session.patientEmail}</span>
          </div>
        )}
        {intake?.phone && (
          <div className="flex items-center gap-2">
            <Phone className="w-3.5 h-3.5 text-[#0F1D2C]/30" />
            <span className="font-body text-xs text-[#0F1D2C]/60">{intake.phone as string}</span>
          </div>
        )}
      </div>

      {/* Medical Flags */}
      {flags.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Medical Flags
          </h3>
          {flags.map((flag, i) => {
            const Icon = flag.severity === 'critical' ? AlertTriangle : flag.severity === 'warning' ? AlertTriangle : Info;
            const colors = flag.severity === 'critical'
              ? 'border-red-200 bg-red-50 text-red-700'
              : flag.severity === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-700'
                : 'border-blue-200 bg-blue-50 text-blue-700';

            return (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-start gap-2 p-2.5 rounded-lg border ${colors}`}
              >
                <Icon className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-body text-xs font-medium">{flag.flag}</p>
                  <p className="font-body text-xs opacity-70 mt-0.5">{flag.action}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Concerns */}
      {intake?.skinConcerns && (
        <div className="space-y-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Skin Concerns
          </h3>
          <div className="flex flex-wrap gap-1.5">
            {(intake.skinConcerns as string[]).map((concern) => (
              <span
                key={concern}
                className="px-2.5 py-1 rounded-full bg-[#F8F6F1] border border-[#E8E4DF] font-body text-xs text-[#0F1D2C]/60"
              >
                {concern.replace(/-/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Goals */}
      {intake?.goals && (
        <div className="space-y-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Goals
          </h3>
          <p className="font-body text-xs text-[#0F1D2C]/60 leading-relaxed">
            &ldquo;{intake.goals as string}&rdquo;
          </p>
        </div>
      )}

      {/* Timeline & Budget */}
      <div className="grid grid-cols-2 gap-2">
        {intake?.timeline && (
          <div className="p-2.5 rounded-lg bg-[#F8F6F1]">
            <p className="font-body text-xs text-[#0F1D2C]/40">Timeline</p>
            <p className="font-body text-xs font-medium text-[#0F1D2C] capitalize">
              {intake.timeline as string}
            </p>
          </div>
        )}
        {intake?.budget && (
          <div className="p-2.5 rounded-lg bg-[#F8F6F1]">
            <p className="font-body text-xs text-[#0F1D2C]/40">Budget</p>
            <p className="font-body text-xs font-medium text-[#0F1D2C] capitalize">
              {intake.budget as string}
            </p>
          </div>
        )}
      </div>

      {/* Treatment Readiness */}
      {scan?.treatmentReadiness && (
        <div className="space-y-2">
          <h3 className="font-body text-xs font-semibold text-[#0F1D2C]/70 uppercase tracking-wide">
            Treatment Readiness
          </h3>
          <div className="flex items-center gap-2">
            {scan.treatmentReadiness.readyForTreatment ? (
              <>
                <CheckCircle className="w-4 h-4 text-[#059669]" />
                <span className="font-body text-xs text-[#059669] font-medium">Ready for treatment</span>
              </>
            ) : (
              <>
                <AlertTriangle className="w-4 h-4 text-[#D97706]" />
                <span className="font-body text-xs text-[#D97706] font-medium">Prep required</span>
              </>
            )}
          </div>
          {scan.treatmentReadiness.requiredPrep.length > 0 && (
            <ul className="space-y-1 pl-4">
              {scan.treatmentReadiness.requiredPrep.map((prep, i) => (
                <li key={i} className="font-body text-xs text-[#0F1D2C]/50 list-disc">
                  {prep}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
