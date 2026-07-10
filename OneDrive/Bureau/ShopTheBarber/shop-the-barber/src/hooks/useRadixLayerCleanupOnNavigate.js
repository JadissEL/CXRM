import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Radix Select/Dialog/Sheet can leave body pointer-events locked after close or
 * mid-navigation — this restores interactivity on every route change.
 */
export function useRadixLayerCleanupOnNavigate() {
  const location = useLocation();

  useEffect(() => {
    document.body.style.pointerEvents = '';
    document.body.style.overflow = '';
    document.body.removeAttribute('data-scroll-locked');

    const staleOverlays = document.querySelectorAll('[data-radix-dialog-overlay], [data-radix-select-viewport]');
    staleOverlays.forEach((node) => {
      if (node.getAttribute('data-state') === 'closed') {
        node.parentElement?.remove();
      }
    });

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
  }, [location.pathname, location.search]);
}
