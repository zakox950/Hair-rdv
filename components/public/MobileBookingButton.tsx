'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useScrollDirection } from '@/hooks/useScrollDirection';

export function MobileBookingButton() {
  const pathname = usePathname();
  const scrollDirection = useScrollDirection(10);

  if (pathname.startsWith('/admin')) return null;

  const isCompact = scrollDirection === 'down';

  return (
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))',
        left: '50%',
        // Only transform — no layout change, pure GPU compositing
        transform: `translateX(-50%) scale(${isCompact ? 0.82 : 1})`,
        transformOrigin: 'center bottom',
        zIndex: 50,
        opacity: isCompact ? 0.82 : 1,
        willChange: 'transform, opacity',
        transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.2s ease',
      }}
    >
      <Link
        href="/rdv"
        style={{
          display: 'block',
          padding: '16px 48px',
          fontSize: '16px',
          boxShadow: isCompact
            ? '0 0 8px 1px rgba(245, 158, 11, 0.15)'
            : '0 0 24px 6px rgba(245, 158, 11, 0.3)',
          transition: 'box-shadow 0.2s ease',
        }}
        className="btn-amber"
      >
        Réserver
      </Link>
    </div>
  );
}
