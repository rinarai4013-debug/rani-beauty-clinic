'use client';

import { type ChartField, type FieldOption } from '@/lib/charting/templates';
import { type ValidationError } from '@/lib/charting/engine';

interface ChartFormRendererProps {
  fields: ChartField[];
  section: string;
  data: Record<string, unknown>;
  errors: ValidationError[];
  onChange: (_fieldId: string, _value: unknown) => void;
  readOnly?: boolean;
}

function getFieldError(fieldId: string, errors: ValidationError[]): ValidationError | undefined {
  return errors.find((e) => e.fieldId === fieldId);
}

function isConditionalVisible(field: ChartField, data: Record<string, unknown>): boolean {
  if (!field.conditionalOn) return true;
  const parentValue = data[field.conditionalOn.field];
  const expectedValues = Array.isArray(field.conditionalOn.value)
    ? field.conditionalOn.value
    : [field.conditionalOn.value];

  if (Array.isArray(parentValue)) {
    return parentValue.some((v) => expectedValues.includes(String(v)));
  }
  return expectedValues.includes(String(parentValue));
}

export default function ChartFormRenderer({
  fields,
  section,
  data,
  errors,
  onChange,
  readOnly = false,
}: ChartFormRendererProps) {
  const sectionFields = fields.filter((f) => f.section === section);
  if (sectionFields.length === 0) return null;

  return (
    <div className="space-y-4">
      {sectionFields.map((field) => {
        if (!isConditionalVisible(field, data)) return null;

        const error = getFieldError(field.id, errors);
        const value = data[field.id];

        return (
          <div key={field.id} className="group">
            <label
              htmlFor={field.id}
              className="mb-1 block text-sm font-medium text-gray-700"
            >
              {field.label}
              {field.required && <span className="ml-1 text-red-500">*</span>}
              {field.unit && (
                <span className="ml-1 text-xs text-gray-400">({field.unit})</span>
              )}
            </label>

            {field.type === 'text' && (
              <input
                id={field.id}
                type="text"
                value={(value as string) || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                disabled={readOnly}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 ${
                  error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            )}

            {field.type === 'textarea' && (
              <textarea
                id={field.id}
                value={(value as string) || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                placeholder={field.placeholder}
                disabled={readOnly}
                rows={3}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 ${
                  error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            )}

            {field.type === 'number' && (
              <input
                id={field.id}
                type="number"
                value={value !== undefined && value !== null ? String(value) : ''}
                onChange={(e) => onChange(field.id, e.target.value ? Number(e.target.value) : undefined)}
                min={field.min}
                max={field.max}
                disabled={readOnly}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 ${
                  error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            )}

            {field.type === 'date' && (
              <input
                id={field.id}
                type="date"
                value={(value as string) || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                disabled={readOnly}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 ${
                  error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            )}

            {field.type === 'time' && (
              <input
                id={field.id}
                type="time"
                value={(value as string) || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                disabled={readOnly}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 ${
                  error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
              />
            )}

            {field.type === 'select' && (
              <select
                id={field.id}
                value={(value as string) || ''}
                onChange={(e) => onChange(field.id, e.target.value)}
                disabled={readOnly}
                className={`w-full rounded-lg border px-3 py-2 text-sm transition focus:outline-none focus:ring-2 focus:ring-[#C9A96E]/50 ${
                  error
                    ? 'border-red-300 bg-red-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                } ${readOnly ? 'bg-gray-50 text-gray-500' : ''}`}
              >
                <option value="">Select...</option>
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}

            {field.type === 'multiselect' && (
              <div className="flex flex-wrap gap-2">
                {field.options?.map((opt) => {
                  const selected = Array.isArray(value) && (value as string[]).includes(opt.value);
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        const current = (Array.isArray(value) ? value : []) as string[];
                        const next = selected
                          ? current.filter((v) => v !== opt.value)
                          : [...current, opt.value];
                        onChange(field.id, next);
                      }}
                      className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                        selected
                          ? 'border-[#C9A96E] bg-[#C9A96E]/10 text-[#C9A96E]'
                          : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                      } ${readOnly ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            )}

            {field.type === 'radio' && (
              <div className="flex flex-wrap gap-4">
                {field.options?.map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-2 cursor-pointer ${readOnly ? 'opacity-50' : ''}`}
                  >
                    <input
                      type="radio"
                      name={field.id}
                      value={opt.value}
                      checked={(value as string) === opt.value}
                      onChange={(e) => onChange(field.id, e.target.value)}
                      disabled={readOnly}
                      className="h-4 w-4 text-[#C9A96E] focus:ring-[#C9A96E]"
                    />
                    <span className="text-sm text-gray-700">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {field.type === 'checkbox' && (
              <label className={`flex items-center gap-2 cursor-pointer ${readOnly ? 'opacity-50' : ''}`}>
                <input
                  type="checkbox"
                  checked={(value as boolean) || false}
                  onChange={(e) => onChange(field.id, e.target.checked)}
                  disabled={readOnly}
                  className="h-4 w-4 rounded text-[#C9A96E] focus:ring-[#C9A96E]"
                />
                <span className="text-sm text-gray-700">Confirmed</span>
              </label>
            )}

            {field.type === 'signature' && (
              <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
                {value ? (
                  <div>
                    <p className="text-sm font-medium text-emerald-600">
                      Signed: {String(value)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date().toLocaleString()}
                    </p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      placeholder="Type your full name to sign"
                      onChange={(e) => onChange(field.id, e.target.value)}
                      disabled={readOnly}
                      className="w-full max-w-sm mx-auto rounded border border-gray-300 px-3 py-2 text-sm text-center italic"
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Electronic signature - typing your name constitutes a legal signature
                    </p>
                  </div>
                )}
              </div>
            )}

            {error && (
              <p className={`mt-1 text-xs ${error.severity === 'error' ? 'text-red-500' : 'text-amber-500'}`}>
                {error.message}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
