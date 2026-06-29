"use client";
import { useCrisisScore } from "@/lib/api/hooks";
import { motion } from "framer-motion";
import { ArrowDown, Info, ShieldAlert } from "lucide-react";

export default function CrisisGauge() {
  const { data, isLoading } = useCrisisScore();

  if (isLoading || !data) {
    return (
      <div className="h-full flex items-center justify-center glass rounded-2xl p-6">
        <span className="text-xs text-zinc-500 font-mono">Synthesizing Crisis Index...</span>
      </div>
    );
  }

  const score = data.score;
  const radius = 60;
  const strokeWidth = 10;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getStatusColor = (val: number) => {
    if (val > 90) return "oklch(68% 0.24 25)";  // Alert (red)
    if (val > 75) return "oklch(78% 0.20 75)";  // Amber
    return "oklch(72% 0.18 150)"; // Safe (green)
  };

  const getStatusText = (val: number) => {
    if (val > 90) return "CRISIS LIMIT";
    if (val > 75) return "AT RISK";
    return "HEALTHY";
  };

  return (
    <div className="glass rounded-2xl p-6 flex flex-col justify-between h-full border border-white/5 relative overflow-hidden">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xs text-zinc-400 font-mono uppercase tracking-wider">
            Crisis Index
          </h3>
          <p className="text-[10px] text-zinc-500 mt-1">
            Passive assessment · 13 biomarkers
          </p>
        </div>
        {score > 75 && (
          <span className="p-1 rounded bg-red-500/10 border border-red-500/20 text-red-400">
            <ShieldAlert size={16} className="animate-pulse" />
          </span>
        )}
      </div>

      {/* Main Gauge Graphic */}
      <div className="flex items-center justify-center my-4 relative">
        <svg className="w-36 h-36 rotate-[-90deg]">
          {/* Base track */}
          <circle
            cx="72"
            cy="72"
            r={radius}
            fill="transparent"
            stroke="var(--sx-border)"
            strokeWidth={strokeWidth}
          />
          {/* Filled track */}
          <motion.circle
            cx="72"
            cy="72"
            r={radius}
            fill="transparent"
            stroke={getStatusColor(score)}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            strokeLinecap="round"
          />
        </svg>
        {/* Inside score metrics */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl text-data font-bold text-white tracking-tight">{score}</span>
          <span className="text-[9px] font-mono text-zinc-500 mt-0.5">/ 100</span>
          <span 
            className="text-[9px] font-bold tracking-widest mt-1 uppercase"
            style={{ color: getStatusColor(score) }}
          >
            {getStatusText(score)}
          </span>
        </div>
      </div>

      {/* Breakdown mini metrics */}
      <div className="space-y-2 mt-2">
        <div className="flex justify-between items-center text-[10px]">
          <span className="text-zinc-500">Trend</span>
          <span className="text-emerald-400 flex items-center gap-0.5 font-semibold font-mono">
            <ArrowDown size={12} /> {Math.abs(data.trend)} (24h)
          </span>
        </div>

        <div className="flex items-center justify-between text-[9px] text-zinc-500 font-mono pt-2 border-t border-white/5">
          <span>Active Pipeline</span>
          <span className="text-zinc-400 truncate max-w-[120px] text-right">
            {data.model}
          </span>
        </div>
      </div>
    </div>
  );
}
