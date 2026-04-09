'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_SECTIONS = [
  {
    title: 'Getting Started',
    links: [
      { href: '/docs', label: 'Overview' },
      { href: '/docs/quickstart', label: 'Quickstart' },
      { href: '/docs/authentication', label: 'Authentication' },
    ],
  },
  {
    title: 'API Reference',
    links: [
      { href: '/docs/clients', label: 'Clients' },
      { href: '/docs/appointments', label: 'Appointments' },
      { href: '/docs/revenue', label: 'Revenue' },
      { href: '/docs/ai', label: 'AI Endpoints' },
    ],
  },
  {
    title: 'Guides',
    links: [
      { href: '/docs/webhooks', label: 'Webhooks' },
      { href: '/docs/errors', label: 'Error Handling' },
      { href: '/docs/rate-limits', label: 'Rate Limits' },
      { href: '/docs/changelog', label: 'Changelog' },
    ],
  },
];


export default function DocsLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F8F6F1]">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b border-[#C9A96E]/20 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Link href="/docs" className="text-xl font-bold text-[#0F1D2C]" style={{ fontFamily: 'Playfair Display, serif' }}>
              RaniOS
            </Link>
            <span className="rounded-full bg-[#C9A96E]/10 px-3 py-1 text-xs font-medium text-[#C9A96E]">
              Developer Docs
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/docs/quickstart"
              className="text-sm font-medium text-[#0F1D2C]/70 hover:text-[#0F1D2C] transition"
            >
              Quickstart
            </Link>
            <a
              href="https://github.com/ranios/sdk-ts"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium text-[#0F1D2C]/70 hover:text-[#0F1D2C] transition"
            >
              GitHub
            </a>
            <Link
              href="/marketing"
              className="rounded-lg bg-[#0F1D2C] px-4 py-2 text-sm font-medium text-white hover:bg-[#0F1D2C]/90 transition"
            >
              Dashboard
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl flex">
        {/* Sidebar */}
        <aside className="sticky top-16 hidden h-[calc(100vh-4rem)] w-64 shrink-0 overflow-y-auto border-r border-[#C9A96E]/10 bg-white p-6 lg:block">
          <nav className="space-y-8">
            {NAV_SECTIONS.map((section) => (
              <div key={section.title}>
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-[#0F1D2C]/50">
                  {section.title}
                </h3>
                <ul className="space-y-1">
                  {section.links.map((link) => {
                    const isActive = pathname === link.href;
                    return (
                      <li key={link.href}>
                        <Link
                          href={link.href}
                          className={`block rounded-md px-3 py-2 text-sm transition ${
                            isActive
                              ? 'bg-[#C9A96E]/10 font-medium text-[#C9A96E]'
                              : 'text-[#0F1D2C]/70 hover:bg-[#C9A96E]/5 hover:text-[#0F1D2C]'
                          }`}
                        >
                          {link.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 px-8 py-10 lg:px-12">
          <div className="mx-auto max-w-3xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
