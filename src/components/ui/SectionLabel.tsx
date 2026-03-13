interface SectionLabelProps {
  label: string;
  className?: string;
  dark?: boolean;
}

export default function SectionLabel({
  label,
  className = "",
  dark = false,
}: SectionLabelProps) {
  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      <span
        className={`font-body text-xs font-semibold uppercase tracking-[0.15em] text-rani-gold`}
      >
        {label}
      </span>
      <div className="h-0.5 w-[60px] bg-rani-gold" />
    </div>
  );
}
