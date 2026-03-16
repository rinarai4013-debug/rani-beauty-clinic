'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

export default function ConditionalPublicLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isDashboard = pathname?.startsWith('/dashboard');

  if (isDashboard) return null;
  return <>{children}</>;
}
