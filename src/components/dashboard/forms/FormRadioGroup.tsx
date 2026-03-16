'use client';

interface FormRadioGroupProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string; emoji?: string }[];
  columns?: 2 | 3 | 4;
}

export default function FormRadioGroup({ value, onChange, options, columns = 3 }: FormRadioGroupProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-4',
  }[columns];

  return (
    <div className={`grid ${gridCols} gap-2`}>
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 py-2 rounded-lg border text-sm font-body font-medium text-center transition-all ${
            value === opt.value
              ? 'border-rani-gold bg-rani-gold/10 text-rani-navy'
              : 'border-rani-border text-rani-muted hover:border-rani-gold/30 hover:text-rani-text'
          }`}
        >
          {opt.emoji && <span className="mr-1.5">{opt.emoji}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  );
}
