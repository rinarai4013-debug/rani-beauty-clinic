'use client';

import { useState } from 'react';
import type { IntakeForm, IntakeSection, IntakeField, ConsentRecord } from '@/lib/booking/types';
import type { ConsentFormTemplate, FormProgress } from '@/lib/booking/intake';

interface IntakeFormRendererProps {
  form: IntakeForm;
  progress: FormProgress;
  requiredConsents: ConsentFormTemplate[];
  onUpdateField: (_sectionId: string, _fieldId: string, _value: unknown) => void;
  onSignConsent: (_consentType: string, _signatureData?: string) => void;
  onSubmit: () => void;
}

export default function IntakeFormRenderer({
  form,
  progress,
  requiredConsents,
  onUpdateField,
  onSignConsent,
  onSubmit,
}: IntakeFormRendererProps) {
  const [activeSection, setActiveSection] = useState(0);
  const [showConsents, setShowConsents] = useState(false);

  const currentSection = form.sections[activeSection];

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm text-[#6B7280] mb-2">
          <span>{progress.percentComplete}% complete</span>
          <span>{progress.completedRequired}/{progress.requiredFields} required fields</span>
        </div>
        <div className="h-2 bg-[#F8F6F1] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#C9A96E] rounded-full transition-all duration-500"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Section tabs */}
      <div className="flex gap-2 overflow-x-auto pb-4 mb-6 -mx-4 px-4">
        {form.sections.map((section, i) => (
          <button
            key={section.id}
            onClick={() => { setActiveSection(i); setShowConsents(false); }}
            className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeSection === i && !showConsents
                ? 'bg-[#0F1D2C] text-white'
                : section.isComplete
                  ? 'bg-[#C9A96E]/10 text-[#C9A96E]'
                  : 'bg-[#F8F6F1] text-[#6B7280] hover:bg-[#E8E4DF]'
            }`}
          >
            {section.isComplete && <span className="mr-1">&#10003;</span>}
            {section.title}
          </button>
        ))}
        <button
          onClick={() => setShowConsents(true)}
          className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            showConsents
              ? 'bg-[#0F1D2C] text-white'
              : 'bg-[#F8F6F1] text-[#6B7280] hover:bg-[#E8E4DF]'
          }`}
        >
          Consents ({form.consentsSigned.length}/{requiredConsents.length})
        </button>
      </div>

      {/* Form fields */}
      {!showConsents && currentSection && (
        <div className="space-y-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
              {currentSection.title}
            </h2>
            <p className="text-sm text-[#6B7280] mt-1">{currentSection.description}</p>
          </div>

          {currentSection.fields.map(field => (
            <FieldRenderer
              key={field.id}
              field={field}
              sectionId={currentSection.id}
              allFields={currentSection.fields}
              onUpdate={onUpdateField}
            />
          ))}

          {/* Navigation */}
          <div className="flex justify-between pt-6">
            <button
              onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
              disabled={activeSection === 0}
              className="px-6 py-3 rounded-xl border-2 border-[#E8E4DF] text-[#6B7280] font-medium disabled:opacity-30 hover:border-[#0F1D2C] hover:text-[#0F1D2C] transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => {
                if (activeSection < form.sections.length - 1) {
                  setActiveSection(activeSection + 1);
                } else {
                  setShowConsents(true);
                }
              }}
              className="px-6 py-3 rounded-xl bg-[#0F1D2C] text-white font-medium hover:bg-[#1a2d40] transition-colors"
            >
              {activeSection < form.sections.length - 1 ? 'Next' : 'Review Consents'}
            </button>
          </div>
        </div>
      )}

      {/* Consents */}
      {showConsents && (
        <div className="space-y-6">
          <h2 className="text-xl font-semibold text-[#0F1D2C] font-[family-name:var(--font-heading)]">
            Consent Forms
          </h2>

          {requiredConsents.map(consent => {
            const isSigned = form.consentsSigned.some(c => c.type === consent.type);
            return (
              <div key={consent.type} className={`p-6 rounded-xl border-2 ${
                isSigned ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-[#E8E4DF]'
              }`}>
                <div className="flex justify-between items-start mb-3">
                  <h3 className="font-medium text-[#0F1D2C]">{consent.title}</h3>
                  {isSigned && (
                    <span className="text-sm text-[#C9A96E] font-medium flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                      Signed
                    </span>
                  )}
                </div>
                <p className="text-sm text-[#6B7280] whitespace-pre-line line-clamp-4 mb-4">
                  {consent.content}
                </p>
                {!isSigned && (
                  <button
                    onClick={() => onSignConsent(consent.type)}
                    className="px-4 py-2 rounded-lg bg-[#0F1D2C] text-white text-sm font-medium hover:bg-[#1a2d40] transition-colors"
                  >
                    I Agree & Sign
                  </button>
                )}
              </div>
            );
          })}

          {/* Submit */}
          <button
            onClick={onSubmit}
            disabled={!progress.isReady}
            className={`w-full py-4 rounded-xl text-lg font-bold transition-all ${
              progress.isReady
                ? 'bg-[#C9A96E] text-white hover:bg-[#b89558] shadow-lg'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {progress.isReady ? 'Submit Intake Form' : `Complete all required fields (${progress.missingConsents.length} consents remaining)`}
          </button>
        </div>
      )}
    </div>
  );
}

// ── FIELD RENDERER ──

function FieldRenderer({
  field,
  sectionId,
  allFields,
  onUpdate,
}: {
  field: IntakeField;
  sectionId: string;
  allFields: IntakeField[];
  onUpdate: (_sectionId: string, _fieldId: string, _value: unknown) => void;
}) {
  // Check conditional visibility
  if (field.conditionalOn) {
    const parentField = allFields.find(f => f.id === field.conditionalOn!.fieldId);
    if (parentField && parentField.value !== field.conditionalOn.value) {
      return null;
    }
  }

  const baseInputClass = 'w-full px-4 py-3 rounded-xl border-2 border-[#E8E4DF] bg-white text-[#0F1D2C] focus:border-[#C9A96E] focus:outline-none transition-colors';

  switch (field.type) {
    case 'text':
    case 'email':
    case 'phone':
      return (
        <div>
          <label className="block text-sm font-medium text-[#0F1D2C] mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type={field.type === 'phone' ? 'tel' : field.type}
            value={(field.value as string) ?? ''}
            onChange={e => onUpdate(sectionId, field.id, e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
          {field.helpText && <p className="text-xs text-[#6B7280] mt-1">{field.helpText}</p>}
        </div>
      );

    case 'textarea':
      return (
        <div>
          <label className="block text-sm font-medium text-[#0F1D2C] mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <textarea
            value={(field.value as string) ?? ''}
            onChange={e => onUpdate(sectionId, field.id, e.target.value)}
            placeholder={field.placeholder}
            rows={3}
            className={baseInputClass}
          />
        </div>
      );

    case 'select':
      return (
        <div>
          <label className="block text-sm font-medium text-[#0F1D2C] mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <select
            value={(field.value as string) ?? ''}
            onChange={e => onUpdate(sectionId, field.id, e.target.value)}
            className={baseInputClass}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      );

    case 'checkbox':
      return (
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={(field.value as boolean) ?? false}
            onChange={e => onUpdate(sectionId, field.id, e.target.checked)}
            className="w-5 h-5 mt-0.5 rounded border-[#E8E4DF] text-[#C9A96E] focus:ring-[#C9A96E]"
          />
          <span className="text-sm text-[#0F1D2C]">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </span>
        </label>
      );

    case 'multiselect':
      return (
        <div>
          <label className="block text-sm font-medium text-[#0F1D2C] mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {field.options?.map(opt => {
              const selected = ((field.value as string[]) ?? []).includes(opt.value);
              return (
                <label key={opt.value} className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selected ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-[#E8E4DF] hover:border-[#C9A96E]/50'
                }`}>
                  <input
                    type="checkbox"
                    checked={selected}
                    onChange={() => {
                      const current = (field.value as string[]) ?? [];
                      const updated = selected
                        ? current.filter(v => v !== opt.value)
                        : [...current, opt.value];
                      onUpdate(sectionId, field.id, updated);
                    }}
                    className="sr-only"
                  />
                  <span className="text-sm">{opt.label}</span>
                </label>
              );
            })}
          </div>
        </div>
      );

    case 'radio':
      return (
        <div>
          <label className="block text-sm font-medium text-[#0F1D2C] mb-2">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <div className="space-y-2">
            {field.options?.map(opt => (
              <label key={opt.value} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                field.value === opt.value ? 'border-[#C9A96E] bg-[#C9A96E]/5' : 'border-[#E8E4DF] hover:border-[#C9A96E]/50'
              }`}>
                <input
                  type="radio"
                  name={field.id}
                  value={opt.value}
                  checked={field.value === opt.value}
                  onChange={() => onUpdate(sectionId, field.id, opt.value)}
                  className="text-[#C9A96E] focus:ring-[#C9A96E]"
                />
                <span className="text-sm">{opt.label}</span>
              </label>
            ))}
          </div>
        </div>
      );

    case 'date':
      return (
        <div>
          <label className="block text-sm font-medium text-[#0F1D2C] mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="date"
            value={(field.value as string) ?? ''}
            onChange={e => onUpdate(sectionId, field.id, e.target.value)}
            className={baseInputClass}
          />
        </div>
      );

    case 'number':
      return (
        <div>
          <label className="block text-sm font-medium text-[#0F1D2C] mb-1.5">
            {field.label} {field.required && <span className="text-red-500">*</span>}
          </label>
          <input
            type="number"
            value={(field.value as number) ?? ''}
            onChange={e => onUpdate(sectionId, field.id, parseInt(e.target.value) || '')}
            className={baseInputClass}
            min={field.validation?.min}
            max={field.validation?.max}
          />
          {field.helpText && <p className="text-xs text-[#6B7280] mt-1">{field.helpText}</p>}
        </div>
      );

    default:
      return null;
  }
}
