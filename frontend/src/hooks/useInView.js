import { useState, useEffect, useRef } from 'react';

/**
 * useInView Hook
 * Triggers once when the element enters the viewport.
 * Disables automatically when prefers-reduced-motion is true.
 */
export const useInView = (userOptions = {}) => {
  const options = { threshold: 0.1, rootMargin: '0px', ...userOptions };
  const ref = useRef(null);
  const [inView, setInView] = useState(true);

  useEffect(() => {
    // If reduced motion is requested, immediately mark as visible
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setInView(true);
      return;
    }

    const currentRef = ref.current;
    if (!currentRef) return;

    if (!('IntersectionObserver' in window)) {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(entry.target);
      }
    }, options);

    observer.observe(currentRef);

    return () => {
      if (currentRef) observer.unobserve(currentRef);
    };
  }, [options.threshold, options.rootMargin]);

  return [ref, inView];
};
