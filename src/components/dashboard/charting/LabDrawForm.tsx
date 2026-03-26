'use client';

import { TestTubes } from 'lucide-react';
import { LAB_DRAW_TEMPLATE } from '@/lib/charting/templates';
import { type ValidationError } from '@/lib/charting/engine';
import ChartFormRenderer from './ChartFormRenderer';

interface LabDrawFormProps {
  data: Record<string, unknown>;
  errors: ValidationError[];
  onChange: (fieldId: string, value: unknown) => void;
  readOnly?: boolean;
}

export default function LabDrawForm({ data, errors, onChange, readOnly }: LabDrawFormProps) {
  const template = LAB_DRAW_TEMPLATE;

  return (
    <div className="space-y-6">
      {template.sections.map((section) => (
        <div key={section} className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
            <TestTubes className="h-4 w-4 text-[#C9A96E]" />
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
