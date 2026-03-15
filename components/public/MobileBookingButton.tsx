'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useRef } from 'react';

export function MobileBookingButton() {
  const pathname = usePathname();
  const containerRef = useRef<HTMLDivElement>(null);
  const isAdmin = pathname.startsWith('/admin');

  useEffect(() => {
    if (isAdmin) return;
    const el = containerRef.current;
    if (!el) return;

    let lastScrollY = window.scrollY || document.documentElement.scrollTop;
    let ticking = false;

    const update = () => {
      const currentScrollY = window.scrollY || document.documentElement.scrollTop;
      const diff = currentScrollY - lastScrollY;

      if (Math.abs(diff) > 8) {
        if (diff > 0) {
          // scrolling down — compact
          el.style.transform = 'translateX(-50%) scale(0.82)';
          el.style.opacity = '0.82';
        } else {
          // scrolling up — full size
          el.style.transform = 'translateX(-50%) scale(1)';
          el.style.opacity = '1';
        }
        lastScrollY = currentScrollY;
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(update);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isAdmin]);

  if (isAdmin) return null;

  return (
    <div
      ref={containerRef}
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: 'max(20px, calc(env(safe-area-inset-bottom) + 12px))',
        left: '50%',
        transform: 'translateX(-50%) scale(1)',
        transformOrigin: 'center bottom',
        zIndex: 50,
        opacity: 1,
        willChange: 'transform, opacity',
        // CSS transition handles the smooth animation — React never re-renders
        transition: 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease',
      }}
    >
      <Link
        href="/rdv"
        style={{
          display: 'block',
          padding: '16px 48px',
          fontSize: '16px',
          boxShadow: '0 0 24px 6px rgba(245, 158, 11, 0.3)',
        }}
        className="btn-amber"
      >
        Réserver
      </Link>
    </div>
  );
}
