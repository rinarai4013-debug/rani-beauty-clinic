"use client";

import { useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

interface AnnouncementBarProps {
  text: string;
  href?: string;
  linkText?: string;
}

export default function AnnouncementBar({
  text,
  href,
  linkText = "Learn More",
}: AnnouncementBarProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  return (
    <div className="relative bg-rani-gold px-4 py-2.5 text-center font-body text-sm font-medium text-rani-navy">
      <div className="mx-auto flex max-w-7xl items-center justify-center gap-2">
        <span>{text}</span>
        {href && (
          <Link
            href={href}
            className="inline-flex items-center gap-1 font-bold underline underline-offset-2 transition-colors hover:text-rani-navy/70"
          >
            {linkText} &rarr;
          </Link>
        )}
      </div>
      <button
        onClick={() => setVisible(false)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 transition-colors hover:bg-rani-navy/10"
        aria-label="Dismiss announcement"
      >
        <X size={14} />
      </button>
    </div>
  );
}
