"use client";

import { ReactNode } from "react";
import { motion } from "framer-motion";
import { staggerItem } from "@/components/animations/StaggerChildren";

interface CardProps {
  children: ReactNode;
  className?: string;
  goldTop?: boolean;
  hover?: boolean;
  asMotion?: boolean;
}

export default function Card({
  children,
  className = "",
  goldTop = false,
  hover = true,
  asMotion = true,
}: CardProps) {
  const baseStyles = `relative bg-white rounded-xl border border-rani-border p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ${
    hover
      ? "transition-all duration-300 hover:shadow-[0_10px_40px_rgba(15,29,44,0.08)] hover:-translate-y-1 hover:border-b-rani-gold"
      : ""
  } ${goldTop ? "border-t-2 border-t-rani-gold" : ""} ${className}`;

  if (asMotion) {
    return (
      <motion.div variants={staggerItem} className={baseStyles}>
        {children}
      </motion.div>
    );
  }

  return <div className={baseStyles}>{children}</div>;
}
