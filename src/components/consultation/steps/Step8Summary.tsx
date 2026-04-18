'use client';

import { motion } from 'framer-motion';
import {
  User,
  Heart,
  Sparkles,
  Palette,
  Target,
  Image as ImageIcon,
  Edit3,
  MessageSquare,
  CreditCard,
} from 'lucide-react';
import type { ReactNode } from 'react';

interface StepProps {
  formData: Record<string, any>;
  onUpdate: (field: string, value: any) => void;
  errors: Record<string, string>;
}

function SummarySection({
  title,
  icon,
  stepNumber,
  onEdit,
  children,
  delay,
}: {
  title: string;
  icon: ReactNode;
  stepNumber: number;
  onEdit: () => void;
  children: ReactNode;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="p-4 rounded-2xl border border-[#0F1D2C]/10 bg-white"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-rani-gold-accessible">{icon}</span>
          <h3 className="font-body text-sm font-semibold text-[#0F1D2C]">
            {title}
          </h3>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-rani-gold-accessible hover:bg-[#C9A96E]/10 transition-colors duration-200 font-body text-xs font-medium"
        >
          <Edit3 className="w-3 h-3" />
          Edit
        </button>
      </div>
      {children}
    </motion.div>
  );
}

function Chip({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full bg-[#C9A96E]/10 text-[#0F1D2C] font-body text-xs font-medium border border-[#C9A96E]/20">
      {label}
    </span>
  );
}

function SummaryField({
  label,
  value,
}: {
  label: string;
  value: string | undefined;
}) {
  if (!value) return null;
  return (
    <div className="flex flex-col gap-0.5">
      <span className="font-body text-xs text-[#0F1D2C]/50">{label}</span>
      <span className="font-body text-sm text-[#0F1D2C]">{value}</span>
    </div>
  );
}

const SKIN_TYPE_LABELS: Record<string, string> = {
  normal: 'Normal',
  dry: 'Dry',
  oily: 'Oily',
  combination: 'Combination',
  sensitive: 'Sensitive',
};

const TIMELINE_LABELS: Record<string, string> = {
  event: 'Event-driven',
  gradual: 'Gradual improvement',
  maintenance: 'Ongoing maintenance',
  asap: 'As soon as possible',
};

const BUDGET_LABELS: Record<string, string> = {
  'getting-started': 'Getting Started',
  'building-routine': 'Building My Routine',
  'results-driven': 'Results-Driven',
  'all-in': 'All-In',
};

export default function Step8Summary({
  formData,
  onUpdate,
  errors,
}: StepProps) {
  const goToStep = (step: number) => onUpdate('goToStep', step);

  const concerns: string[] = formData.concerns || [];
  const treatmentInterests: string[] = formData.treatmentInterests || [];
  const photos: File[] = formData.photos || [];

  return (
    <div className="space-y-6">
      {/* Heading */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center"
      >
        <h2 className="font-heading text-2xl md:text-3xl text-[#0F1D2C] mb-2">
          Review Your Information
        </h2>
        <p className="font-body text-sm text-[#0F1D2C]/60">
          Everything looks good? Make any changes before submitting.
        </p>
      </motion.div>

      {/* Personal Info */}
      <SummarySection
        title="Personal Info"
        icon={<User className="w-4 h-4" />}
        stepNumber={2}
        onEdit={() => goToStep(2)}
        delay={0.1}
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <SummaryField
            label="Name"
            value={
              formData.firstName || formData.lastName
                ? `${formData.firstName || ''} ${formData.lastName || ''}`.trim()
                : undefined
            }
          />
          <SummaryField label="Email" value={formData.email} />
          <SummaryField label="Phone" value={formData.phone} />
        </div>
      </SummarySection>

      {/* Concerns */}
      <SummarySection
        title="Concerns"
        icon={<Heart className="w-4 h-4" />}
        stepNumber={3}
        onEdit={() => goToStep(3)}
        delay={0.15}
      >
        {concerns.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {concerns.map((c) => (
              <Chip
                key={c}
                label={c
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              />
            ))}
          </div>
        ) : (
          <p className="font-body text-xs text-[#0F1D2C]/40 italic">
            No concerns selected
          </p>
        )}
      </SummarySection>

      {/* Treatment Interests */}
      <SummarySection
        title="Treatment Interests"
        icon={<Sparkles className="w-4 h-4" />}
        stepNumber={4}
        onEdit={() => goToStep(4)}
        delay={0.2}
      >
        {treatmentInterests.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {treatmentInterests.map((t) => (
              <Chip
                key={t}
                label={t
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, (l) => l.toUpperCase())}
              />
            ))}
          </div>
        ) : (
          <p className="font-body text-xs text-[#0F1D2C]/40 italic">
            No treatments selected
          </p>
        )}
      </SummarySection>

      {/* Skin Profile */}
      <SummarySection
        title="Skin Profile"
        icon={<Palette className="w-4 h-4" />}
        stepNumber={5}
        onEdit={() => goToStep(5)}
        delay={0.25}
      >
        <div className="space-y-3">
          <SummaryField
            label="Skin Type"
            value={SKIN_TYPE_LABELS[formData.skinType] || formData.skinType}
          />
          {formData.previousTreatments && (
            <SummaryField
              label="Previous Treatments"
              value={formData.previousTreatments}
            />
          )}
          {formData.skincareRoutine && (
            <SummaryField
              label="Skincare Routine"
              value={formData.skincareRoutine}
            />
          )}
          {formData.allergies && (
            <SummaryField label="Allergies" value={formData.allergies} />
          )}
          {formData.currentMedications && (
            <SummaryField
              label="Current Medications"
              value={formData.currentMedications}
            />
          )}
          {formData.medicalConditions && (
            <SummaryField
              label="Medical Conditions"
              value={formData.medicalConditions}
            />
          )}
        </div>
      </SummarySection>

      {/* Goals */}
      <SummarySection
        title="Goals & Timeline"
        icon={<Target className="w-4 h-4" />}
        stepNumber={6}
        onEdit={() => goToStep(6)}
        delay={0.3}
      >
        <div className="space-y-3">
          {formData.goals && (
            <SummaryField label="Goals" value={formData.goals} />
          )}
          <div className="flex flex-wrap gap-3">
            {formData.timeline && (
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-xs text-[#0F1D2C]/50">
                  Timeline
                </span>
                <Chip
                  label={
                    TIMELINE_LABELS[formData.timeline] || formData.timeline
                  }
                />
              </div>
            )}
            {formData.budget && (
              <div className="flex flex-col gap-0.5">
                <span className="font-body text-xs text-[#0F1D2C]/50">
                  Investment Level
                </span>
                <Chip
                  label={BUDGET_LABELS[formData.budget] || formData.budget}
                />
              </div>
            )}
          </div>
          {formData.eventDate && (
            <SummaryField
              label="Event Date"
              value={new Date(formData.eventDate).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            />
          )}
        </div>
      </SummarySection>

      {/* Photos */}
      <SummarySection
        title="Photos"
        icon={<ImageIcon className="w-4 h-4" />}
        stepNumber={7}
        onEdit={() => goToStep(7)}
        delay={0.35}
      >
        <p className="font-body text-sm text-[#0F1D2C]">
          {photos.length > 0
            ? `${photos.length} photo${photos.length > 1 ? 's' : ''} uploaded`
            : 'No photos uploaded'}
        </p>
      </SummarySection>

      {/* SMS Consent */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.4 }}
      >
        <label className="flex items-start gap-3 p-4 rounded-2xl border border-[#0F1D2C]/10 bg-white cursor-pointer hover:border-[#C9A96E]/30 transition-colors duration-200">
          <input
            type="checkbox"
            checked={formData.smsConsent || false}
            onChange={(e) => onUpdate('smsConsent', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[#C9A96E]/40 text-rani-gold-accessible focus:ring-[#C9A96E]/30 accent-[#C9A96E]"
          />
          <div className="flex items-start gap-2">
            <MessageSquare className="w-4 h-4 text-rani-gold-accessible mt-0.5 shrink-0" />
            <span className="font-body text-sm text-[#0F1D2C]/70">
              I&apos;d like to receive updates and appointment reminders via text
            </span>
          </div>
        </label>
      </motion.div>

      {/* Deposit Info */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.45, duration: 0.4 }}
        className="flex items-start gap-3 p-4 rounded-2xl bg-[#C9A96E]/10 border border-[#C9A96E]/20"
      >
        <CreditCard className="w-5 h-5 text-rani-gold-accessible shrink-0 mt-0.5" />
        <div>
          <p className="font-body text-sm font-medium text-[#0F1D2C]">
            $150 Consultation Deposit
          </p>
          <p className="font-body text-xs text-[#0F1D2C]/60 mt-0.5">
            Applies directly to your first treatment
          </p>
        </div>
      </motion.div>

      {/* Submit Button */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.4 }}
        className="pt-2"
      >
        <button
          type="button"
          onClick={() => onUpdate('submit', true)}
          className="
            w-full py-4 px-6 rounded-2xl font-body text-base font-semibold tracking-wide
            bg-[#0F1D2C] text-white
            hover:bg-[#1A2A3C] hover:shadow-lg hover:shadow-[#C9A96E]/10
            active:scale-[0.99] transition-all duration-300
            border border-transparent hover:border-[#C9A96E]/30
          "
        >
          Submit &amp; Book
        </button>
        {errors.submit && (
          <p className="font-body text-xs text-red-500 text-center mt-2">
            {errors.submit}
          </p>
        )}
      </motion.div>
    </div>
  );
}
