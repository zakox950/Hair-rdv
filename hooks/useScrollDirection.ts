import { useEffect, useRef, useState } from 'react';

type ScrollDirection = 'up' | 'down' | 'idle';

export function useScrollDirection(threshold = 8): ScrollDirection {
  const [direction, setDirection] = useState<ScrollDirection>('idle');
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const handleScroll = () => {
      if (!ticking.current) {
        requestAnimationFrame(() => {
          const currentScrollY =
            window.scrollY || document.documentElement.scrollTop;
          const diff = currentScrollY - lastScrollY.current;
          if (Math.abs(diff) > threshold) {
            setDirection(diff > 0 ? 'down' : 'up');
            lastScrollY.current = currentScrollY;
          }
          ticking.current = false;
        });
        ticking.current = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  return direction;
}
