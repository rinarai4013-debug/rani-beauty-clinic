'use client';

import { ReactNode } from 'react';

export default function SaasLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl font-bold text-[#0F1D2C]">RaniOS</span>
          <span className="text-xs bg-[#C9A96E] text-white px-2 py-0.5 rounded-full">Platform</span>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>Admin Dashboard</span>
        </div>
      </nav>
      <main className="p-6">{children}</main>
    </div>
  );
}
