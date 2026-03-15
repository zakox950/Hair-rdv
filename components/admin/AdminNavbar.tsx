'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/admin/reservations', label: 'Réservations' },
  { href: '/admin/coiffeurs',    label: 'Coiffeurs'    },
  { href: '/admin/planning',     label: 'Planning'     },
  { href: '/admin/analytics',    label: 'Analytiques'  },
  { href: '/admin/horaires',     label: 'Horaires'     },
  { href: '/admin/fermetures',   label: 'Fermetures'   },
  { href: '/admin/securite',     label: 'Sécurité'     },
];

export default function AdminNavbar() {
  const pathname = usePathname();
  const router   = useRouter();
  const [open, setOpen] = useState(false);

  async function handleLogout() {
    await fetch('/api/admin/logout', { method: 'POST' });
    router.push('/admin/login');
  }

  return (
    <div className="fixed top-5 inset-x-4 z-50 sm:top-6 sm:inset-x-8">
      <nav className="max-w-7xl mx-auto glass-sm px-5 py-3 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link href="/admin/reservations" className="text-sm font-medium text-white/80 hover:text-white transition-colors shrink-0">
          {process.env.NEXT_PUBLIC_SALON_NAME ?? 'Admin'}
        </Link>

        {/* Desktop links */}
        <div className="hidden lg:flex items-center gap-5 overflow-x-auto">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm whitespace-nowrap transition-colors ${
                pathname === href ? 'text-white' : 'text-white/45 hover:text-white/80'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={handleLogout}
            className="hidden sm:block text-xs text-white/40 hover:text-white/70 transition-colors"
          >
            Déconnexion
          </button>
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden p-1.5 text-white/50 hover:text-white transition-colors"
            aria-label="Menu"
          >
            {open ? (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <div className="lg:hidden mt-2 max-w-7xl mx-auto glass-sm p-4 space-y-1">
          {LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={`block text-sm py-2.5 px-3 rounded-xl transition-all ${
                pathname === href
                  ? 'bg-white/[0.08] text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/[0.05]'
              }`}
            >
              {label}
            </Link>
          ))}
          <div className="pt-2 border-t border-white/[0.06]">
            <button
              onClick={handleLogout}
              className="block w-full text-sm text-left text-white/40 py-2.5 px-3 hover:text-white/70 transition-colors"
            >
              Déconnexion
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
