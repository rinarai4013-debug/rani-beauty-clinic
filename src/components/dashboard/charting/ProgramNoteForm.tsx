'use client';

import { Activity } from 'lucide-react';
import { PROGRAM_NOTE_TEMPLATE } from '@/lib/charting/templates';
import { type ValidationError } from '@/lib/charting/engine';
import ChartFormRenderer from './ChartFormRenderer';

interface ProgramNoteFormProps {
  data: Record<string, unknown>;
  errors: ValidationError[];
  onChange: (fieldId: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function ProgramNoteForm({ data, errors, onChange, readOnly }: ProgramNoteFormProps) {
  const template = PROGRAM_NOTE_TEMPLATE;

  // Only show GLP-1 symptoms if program type is GLP-1
  const programType = (data.program_type as string) || '';
  const isGlp1 = programType.startsWith('glp1');
  const isHrt = programType.startsWith('hrt');

  const filteredSections = template.sections.filter((section) => {
    if (section === 'Symptom Check - GLP-1' && !isGlp1) return false;
    if (section === 'Symptom Check - HRT' && !isHrt) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {filteredSections.map((section) => (
        <div key={section} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <Activity className="h-4 w-4 text-[#C9A96E]" />
            <h3 className="text-sm font-bold uppercase tracking-wide text-[#0F1D2C]">
              {section}
            </h3>
          </div>
          <ChartFormRenderer
            fields={template.fields}
            section={section}
            data={data}
            errors={errors}
            onChange={onChange}
            readOnly={readOnly}
          />
        </div>
      ))}
    </div>
  );
}
