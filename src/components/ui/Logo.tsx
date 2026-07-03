import React from 'react';

interface LogoProps {
  className?: string;
  iconSize?: 'sm' | 'md' | 'lg';
  showText?: boolean;
}

export function Logo({ className = '', iconSize = 'md', showText = true }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12'
  };

  const textClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-2xl'
  };

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <div className={`relative shrink-0 ${sizeClasses[iconSize]} rounded-xl bg-slate-950/60 border border-white/10 flex items-center justify-center shadow-inner overflow-hidden group`}>
        {/* Ambient glow */}
        <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/10 to-brand-cyan/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Zen Lotus X Monogram */}
        <svg className="w-3/5 h-3/5 relative z-10 drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoPurple" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#c084fc" />
              <stop offset="100%" stopColor="#818cf8" />
            </linearGradient>
            <linearGradient id="logoCyan" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="100%" stopColor="#0ea5e9" />
            </linearGradient>
            <linearGradient id="logoGold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
          </defs>
          
          {/* Base supporting leaf */}
          <path
            d="M4 17C8 20.5 16 20.5 20 17"
            stroke="url(#logoCyan)"
            strokeWidth="2.5"
            strokeLinecap="round"
            className="group-hover:stroke-[3px] transition-all duration-300"
          />
          
          {/* Petal 1 (Purple): Top-Left to Bottom-Right */}
          <path
            d="M6 6C9 7.5 15 10.5 18 16C15 14.5 9 11.5 6 6Z"
            fill="url(#logoPurple)"
            className="group-hover:scale-105 origin-center transition-transform duration-300"
          />
          
          {/* Petal 2 (Cyan): Top-Right to Bottom-Left */}
          <path
            d="M18 6C15 7.5 9 10.5 6 16C9 14.5 15 11.5 18 6Z"
            fill="url(#logoCyan)"
            className="group-hover:scale-105 origin-center transition-transform duration-300"
          />

          {/* Top Petal (Gold) - Represents Growth */}
          <path
            d="M12 11C12 8.5 10.5 5 12 3C13.5 5 12 8.5 12 11Z"
            fill="url(#logoGold)"
            className="group-hover:translate-y-[-1px] transition-transform duration-300"
          />
          
          {/* Glowing central node */}
          <circle 
            cx="12" 
            cy="11" 
            r="1.8" 
            fill="#ffffff" 
            className="animate-pulse"
          />
        </svg>
      </div>

      {showText && (
        <span className={`font-extrabold tracking-wider text-slate-100 uppercase ${textClasses[iconSize]}`}>
          Sentience<span className="text-brand-cyan text-[1.25em] inline-block align-baseline ml-0.5">X</span>
        </span>
      )}
    </div>
  );
}
