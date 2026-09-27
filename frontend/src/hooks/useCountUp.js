import { useState, useEffect } from 'react';

/**
 * useCountUp Hook
 * Animates a numeric value from 0 to target over durationMs using requestAnimationFrame.
 * Strictly checks for valid numbers and avoids infinite loops or NaN.
 */
export const useCountUp = (targetValue, durationMs = 500, decimals = 0) => {
  const target = Number(targetValue) || 0;
  const [value, setValue] = useState(target);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Respect reduced motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(target);
      return;
    }

    if (target === 0) {
      setValue(0);
      return;
    }

    let startTime = null;
    let animationFrameId;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / durationMs, 1);

      // Ease-out cubic calculation
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = easeProgress * target;

      setValue(decimals > 0 ? parseFloat(current.toFixed(decimals)) : Math.round(current));

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step);
      } else {
        setValue(target);
      }
    };

    animationFrameId = requestAnimationFrame(step);

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
    };
  }, [target, durationMs, decimals]);

  return value;
};
