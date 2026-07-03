import React, { useEffect, useState } from 'react';

interface VisualRingProps {
  score: number;
  size?: number;
  strokeWidth?: number;
}

export function VisualRing({ score, size = 180, strokeWidth = 14 }: VisualRingProps) {
  const [animatedScore, setAnimatedScore] = useState(0);
  
  useEffect(() => {
    // Animate score from 0 to target score
    const duration = 1000;
    const startTime = performance.now();
    
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (easeOutQuad)
      const ease = progress * (2 - progress);
      setAnimatedScore(Math.round(ease * score));
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    requestAnimationFrame(animate);
  }, [score]);

  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (animatedScore / 100) * circumference;

  // Determine color based on score
  // Excellent: 80+, Mild Decline: 70-80, Moderate Risk: 50-70, High Risk: <50
  let strokeColor = "url(#wellness-grad-green)";
  let glowColor = "rgba(34, 197, 94, 0.4)";
  let statusText = "Excellent";
  
  if (score < 50) {
    strokeColor = "url(#wellness-grad-red)";
    glowColor = "rgba(239, 68, 68, 0.4)";
    statusText = "High Risk";
  } else if (score < 70) {
    strokeColor = "url(#wellness-grad-orange)";
    glowColor = "rgba(245, 158, 11, 0.4)";
    statusText = "Moderate Risk";
  } else if (score < 80) {
    strokeColor = "url(#wellness-grad-yellow)";
    glowColor = "rgba(234, 179, 8, 0.4)";
    statusText = "Mild Decline";
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div 
        style={{ width: size, height: size }} 
        className="relative flex items-center justify-center"
      >
        {/* Glow behind the ring */}
        <div 
          className="absolute rounded-full transition-all duration-1000 blur-2xl opacity-20 animate-pulse-glow"
          style={{
            width: size - 40,
            height: size - 40,
            backgroundColor: glowColor
          }}
        />

        <svg 
          width={size} 
          height={size} 
          className="transform -rotate-90 drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
        >
          <defs>
            <linearGradient id="wellness-grad-green" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#06B6D4" />
            </linearGradient>
            <linearGradient id="wellness-grad-yellow" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <linearGradient id="wellness-grad-orange" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#EF4444" />
              <stop offset="100%" stopColor="#F59E0B" />
            </linearGradient>
            <linearGradient id="wellness-grad-red" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#B91C1C" />
              <stop offset="100%" stopColor="#EF4444" />
            </linearGradient>
            <linearGradient id="bg-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.02)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.04)" />
            </linearGradient>
          </defs>
          
          {/* Base Background Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="url(#bg-grad)"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          
          {/* Animated Progress Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-300 ease-out"
          />
        </svg>

        {/* Center Score Text */}
        <div className="absolute flex flex-col items-center justify-center text-center">
          <span className="text-5xl font-extrabold tracking-tighter text-slate-50 tabular-nums">
            {animatedScore}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-slate-400 font-medium mt-1">
            {statusText}
          </span>
        </div>
      </div>
    </div>
  );
}
