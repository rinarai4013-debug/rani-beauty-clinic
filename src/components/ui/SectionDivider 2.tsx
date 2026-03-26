interface SectionDividerProps {
  className?: string;
}

export default function SectionDivider({ className = "" }: SectionDividerProps) {
  return (
    <div className={`mx-auto h-0.5 w-[60px] bg-rani-gold ${className}`} />
  );
}
