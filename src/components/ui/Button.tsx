"use client";

import Link from "next/link";
import { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

type ButtonVariant = "primary" | "secondary" | "ghost";

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  href?: string;
  onClick?: () => void;
  className?: string;
  icon?: boolean;
  type?: "button" | "submit";
}

const variants = {
  primary:
    "bg-rani-navy text-white hover:bg-rani-navy-light shadow-sm hover:shadow-[0_0_20px_rgba(243,214,190,0.2)] transition-all duration-300",
  secondary:
    "bg-transparent border border-rani-gold text-rani-gold hover:bg-rani-gold hover:text-rani-navy transition-all duration-300",
  ghost:
    "bg-transparent text-rani-navy hover:text-rani-navy group transition-all duration-300",
};

export default function Button({
  children,
  variant = "primary",
  href,
  onClick,
  className = "",
  icon = false,
  type = "button",
}: ButtonProps) {
  const baseStyles =
    variant === "ghost"
      ? "inline-flex items-center gap-2 font-body font-semibold text-sm tracking-wide"
      : "inline-flex items-center justify-center gap-2 px-8 py-3.5 font-body font-semibold text-sm uppercase tracking-wider rounded-lg hover:scale-[1.02]";

  const content = (
    <>
      {children}
      {(icon || variant === "ghost") && (
        <ArrowRight
          size={16}
          className="transition-transform duration-300 group-hover:translate-x-1"
        />
      )}
      {variant === "ghost" && (
        <span className="absolute bottom-0 left-0 h-0.5 w-0 bg-rani-gold transition-all duration-300 group-hover:w-full" />
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className={`${baseStyles} ${variants[variant]} relative ${className}`}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} relative ${className}`}
    >
      {content}
    </button>
  );
}
