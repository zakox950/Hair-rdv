'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export function MobileBookingButton() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection(10);

  // Only show on public pages
  if (pathname.startsWith('/admin')) return null;

  const isCompact = scrollDirection === 'down';

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 50,
        transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <Link
        href="/rdv"
        style={{
          display: 'block',
          padding: isCompact ? '10px 28px' : '16px 48px',
          fontSize: isCompact ? '13px' : '16px',
          opacity: isCompact ? 0.82 : 1,
          transition: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
          boxShadow: isCompact
            ? '0 0 8px 1px rgba(245, 158, 11, 0.15)'
            : '0 0 24px 6px rgba(245, 158, 11, 0.3)',
        }}
        className="btn-amber"
      >
        Réserver
      </Link>
    </div>
  );
}
