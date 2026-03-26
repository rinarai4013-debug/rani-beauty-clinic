import { CheckCircle, Shield, Clock, Heart } from "lucide-react";
import { ReactNode } from "react";

const iconMap: Record<string, ReactNode> = {
  check: <CheckCircle size={14} />,
  shield: <Shield size={14} />,
  clock: <Clock size={14} />,
  heart: <Heart size={14} />,
};

interface BadgeProps {
  children: ReactNode;
  icon?: "check" | "shield" | "clock" | "heart";
  variant?: "light" | "dark";
  className?: string;
}

export default function Badge({
  children,
  icon = "check",
  variant = "light",
  className = "",
}: BadgeProps) {
  const styles =
    variant === "light"
      ? "bg-rani-cream border-rani-gold text-rani-navy"
      : "bg-rani-navy/20 border-rani-gold/30 text-white";

  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full border px-4 py-1.5 font-body text-xs font-semibold ${styles} ${className}`}
    >
      <span className="text-rani-gold">{iconMap[icon]}</span>
      {children}
    </span>
  );
}
