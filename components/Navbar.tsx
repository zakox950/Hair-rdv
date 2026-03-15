'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { useScrollDirection } from '@/hooks/useScrollDirection';

const NAV_LINKS = [
  { href: '/',          label: 'Accueil' },
  { href: '/#services', label: 'Services' },
  { href: '/#about',    label: 'À propos' },
  { href: '/contact',   label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname        = usePathname();
  const scrollDirection = useScrollDirection(10);
  const isCompact       = scrollDirection === 'down';

  return (
    <div className="fixed top-5 inset-x-4 z-50 sm:top-6 sm:inset-x-8">
      <nav
        className="max-w-5xl mx-auto glass-sm flex items-center justify-between"
        style={{
          padding: isCompact ? '5px 16px' : '8px 20px',
          transition: 'padding 0.3s ease',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          className="font-medium text-white/80 hover:text-white transition-colors tracking-wide shrink-0"
          style={{
            fontSize: isCompact ? '13px' : '14px',
            transition: 'font-size 0.3s ease',
          }}
        >
          {process.env.NEXT_PUBLIC_SALON_NAME ?? 'Salon'}
        </Link>

        {/* Desktop links */}
        <div
          className="hidden sm:flex items-center gap-7"
          style={{
            opacity: isCompact ? 0 : 1,
            pointerEvents: isCompact ? 'none' : 'auto',
            transition: 'opacity 0.25s ease',
          }}
        >
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`text-sm transition-colors ${
                pathname === href
                  ? 'text-white'
                  : 'text-white/45 hover:text-white/80'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>

        {/* CTA (desktop) + hamburger (mobile) */}
        <div className="flex items-center gap-3">
          <Link
            href="/rdv"
            className="hidden sm:block text-sm bg-amber-400 hover:bg-amber-300 text-black font-medium px-4 py-1.5 rounded-xl transition-colors"
            style={{
              opacity: isCompact ? 0 : 1,
              pointerEvents: isCompact ? 'none' : 'auto',
              transition: 'opacity 0.25s ease',
            }}
          >
            Réserver
          </Link>

          <button
            onClick={() => setOpen(!open)}
            aria-label="Menu"
            className="sm:hidden p-1.5 text-white/50 hover:text-white transition-colors"
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

      {/* Mobile dropdown */}
      {open && (
        <div className="sm:hidden mt-2 max-w-5xl mx-auto glass-sm p-4 space-y-1">
          {NAV_LINKS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className="block text-sm text-white/60 hover:text-white py-2.5 px-3 rounded-xl hover:bg-white/[0.05] transition-all"
            >
              {label}
            </Link>
          ))}
          <div className="pt-3 border-t border-white/[0.06] mt-2">
            <Link
              href="/rdv"
              onClick={() => setOpen(false)}
              className="block text-sm bg-amber-400 hover:bg-amber-300 text-black font-medium px-4 py-2.5 rounded-xl text-center transition-colors"
            >
              Prendre rendez-vous
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
