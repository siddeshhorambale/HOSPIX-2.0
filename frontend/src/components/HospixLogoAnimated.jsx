import React from 'react';
import hospixLogo from '../assets/HOSPIX.png';

/**
 * HospixLogoAnimated
 * 
 * Modes:
 * - 'intro': Luxury brand intro sequence with the official circular HOSPIX logo for the splash screen.
 * - 'interactive': Navbar/Header interactive mode with subtle 1.02 hover lift and gold accent transition.
 * - 'compact': Minimalist icon + badge.
 */
export const HospixLogoAnimated = ({
  mode = 'interactive',
  size = 'default',
  onClick,
  showBadge = true,
  className = ''
}) => {
  if (mode === 'intro') {
    return (
      <div className={`flex flex-col items-center justify-center select-none ${className}`}>
        {/* Emblem Layer with Initial Scale/Fade */}
        <div className="relative mb-5 hospix-logo-emblem">
          <img
            src={hospixLogo}
            alt="HOSPIX"
            className="w-24 h-24 sm:w-28 sm:h-28 aspect-square object-contain select-none drop-shadow-md"
          />
        </div>

        {/* Wordmark Reveal */}
        <div className="hospix-logo-text flex items-center space-x-2.5">
          <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#082D46] font-heading">
            HOSPIX
          </span>
          {showBadge && (
            <span className="text-[11px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#082D46] text-[#F4D98A] border border-[#052338]">
              B2B
            </span>
          )}
        </div>

        {/* Brand Tagline with subtle fade */}
        <p className="hospix-logo-subtext text-xs tracking-wider uppercase font-semibold text-[#596B76] mt-2 font-heading">
          Hospitality Resource Exchange
        </p>

        {/* Elegant Gold Accent Loading Line */}
        <div className="w-48 h-[2px] bg-[#E7E5DC] rounded-full overflow-hidden mt-6 relative">
          <div className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-[#082D46] via-[#F4D98A] to-[#082D46] hospix-intro-line" />
        </div>
      </div>
    );
  }

  // Interactive Navbar / In-App Brand Mark
  const isCompact = size === 'compact';

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center space-x-3 cursor-pointer select-none group transition-transform duration-200 ease-out hover:scale-[1.02] active:scale-[0.98] ${className}`}
    >
      <div
        className={`${
          isCompact ? 'w-8 h-8' : 'w-10 h-10 sm:w-11 sm:h-11'
        } aspect-square shrink-0 select-none flex items-center justify-center transition-transform duration-200 group-hover:scale-105`}
      >
        <img
          src={hospixLogo}
          alt="HOSPIX"
          className="w-full h-full object-contain aspect-square select-none"
        />
      </div>

      <div className="flex items-center space-x-2">
        <span
          className={`${
            isCompact ? 'text-lg' : 'text-xl'
          } font-extrabold tracking-tight text-[#082D46] group-hover:text-[#052338] font-heading transition-colors duration-200`}
        >
          HOSPIX
        </span>
        {showBadge && (
          <span className="text-[10px] px-1.5 py-0.5 font-bold uppercase rounded-md bg-[#E8F2F6] text-[#082D46] border border-[#D0E4ED] group-hover:border-[#082D46]/20 transition-colors duration-200">
            B2B
          </span>
        )}
      </div>
    </div>
  );
};
