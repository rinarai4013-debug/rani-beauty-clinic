"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

export default function CopyButton({
  text,
  label,
}: {
  text: string;
  label?: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-2 rounded-lg border border-rani-border bg-white px-4 py-2 font-body text-sm font-medium text-rani-navy transition-all hover:border-rani-gold hover:text-rani-gold active:scale-95"
      title={label || "Copy to clipboard"}
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-600" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copied!" : label || "Copy"}
    </button>
  );
}
