'use client';

interface FormToggleProps {
  checked: boolean;
  onChange: (_checked: boolean) => void;
  label: string;
  description?: string;
}

export default function FormToggle({ checked, onChange, label, description }: FormToggleProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center justify-between w-full p-3 rounded-lg border border-rani-border hover:border-rani-gold/30 transition-colors"
    >
      <div className="text-left">
        <span className="text-sm font-body font-medium text-rani-navy">{label}</span>
        {description && <p className="text-xs font-body text-rani-muted mt-0.5">{description}</p>}
      </div>
      <div className={`w-10 h-6 rounded-full transition-colors ${checked ? 'bg-rani-gold' : 'bg-rani-border'}`}>
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform mt-1 ${checked ? 'translate-x-5' : 'translate-x-1'}`} />
      </div>
    </button>
  );
}
