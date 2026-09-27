import React, { useState, useEffect } from 'react';
import { HospixLogoAnimated } from './HospixLogoAnimated';

export const HospixSplashScreen = ({ onComplete }) => {
  const [stage, setStage] = useState('active'); // 'active' -> 'fading' -> 'done'

  useEffect(() => {
    // Check for reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      onComplete?.();
      setStage('done');
      return;
    }

    // Sequence: 800ms presentation -> 300ms fade transition into application
    const fadeTimer = setTimeout(() => {
      setStage('fading');
    }, 900);

    const doneTimer = setTimeout(() => {
      setStage('done');
      onComplete?.();
    }, 1250);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  if (stage === 'done') return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-[#F7F4E9] transition-opacity duration-300 ease-out ${
        stage === 'fading' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="Loading HOSPIX Platform"
      role="status"
    >
      <HospixLogoAnimated mode="intro" />
    </div>
  );
};
