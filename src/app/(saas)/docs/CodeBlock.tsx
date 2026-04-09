'use client';

export default function CodeBlock({ children, language = 'typescript' }: { children: string; language?: string }) {
  return (
    <pre className="rounded-lg bg-[#0F1D2C] p-4 overflow-x-auto text-sm leading-relaxed">
      <code className="text-gray-200 font-mono">{children}</code>
    </pre>
  );
}
