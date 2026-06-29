"use client";
import { useState, useEffect } from "react";
import { useRecoveryPlan, type RecoveryAction } from "@/lib/api/hooks";
import { useTranslations } from "next-intl";
import { Check, ShieldAlert, Sparkles, MessageSquare, ArrowUpRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function RecoveryCard() {
  const { data, isLoading } = useRecoveryPlan();
  const t = useTranslations("recovery");
  const [actions, setActions] = useState<RecoveryAction[]>([]);
  const [points, setPoints] = useState(12);

  // Seed local state once data loads
  useState(() => {
    if (data) {
      setActions(data.actions);
      setPoints(data.rewardPoints);
    }
  });

  // Handle updates when query loads
  useEffect(() => {
    if (data) {
      setActions(data.actions);
      setPoints(data.rewardPoints);
    }
  }, [data]);

  const handleToggle = (id: string) => {
    setActions(
      actions.map((act) => {
        if (act.id === id) {
          const nextState = !act.completed;
          // Dynamically adjust points based on completion reward
          setPoints((prev) => (nextState ? prev + 4 : Math.max(0, prev - 4)));
          return { ...act, completed: nextState };
        }
        return act;
      })
    );
  };

  if (isLoading || !data) {
    return (
      <div className="h-60 flex items-center justify-center glass rounded-2xl">
        <span className="text-xs text-zinc-500 font-mono">Running RLlib Contextual Bandit...</span>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-5 h-full justify-between">
      {/* Title */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-display font-extrabold text-lg text-white">
            {t("title")}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {t("poweredBy")}
          </p>
        </div>
        <div className="bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full px-3 py-1 flex items-center gap-1 text-[10px] font-bold font-mono">
          <Sparkles size={12} />
          {t("rewardPoints", { points })}
        </div>
      </div>

      {/* Action cards */}
      <div className="flex flex-col gap-3">
        {actions.map((act) => (
          <div
            key={act.id}
            onClick={() => handleToggle(act.id)}
            className={`p-3.5 rounded-2xl border transition-all duration-200 cursor-pointer flex gap-3.5 items-start ${
              act.completed
                ? "bg-white/5 border-white/5 opacity-60"
                : "bg-white/5 border-white/5 hover:border-white/15"
            }`}
          >
            {/* Complete Checkbox */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleToggle(act.id);
              }}
              className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors border ${
                act.completed
                  ? "bg-emerald-500 border-emerald-400 text-white"
                  : "border-zinc-700 hover:border-zinc-500 text-transparent"
              }`}
            >
              <Check size={12} strokeWidth={3} />
            </button>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm">{act.emoji}</span>
                <span className={`text-xs font-semibold ${act.completed ? "line-through text-zinc-500" : "text-white"}`}>
                  {act.title}
                </span>
                <span className="text-[9px] bg-white/5 px-2 py-0.5 rounded text-zinc-400 font-mono">
                  {act.duration}
                </span>
              </div>
              <p className={`text-[10px] mt-1 leading-relaxed ${act.completed ? "text-zinc-500" : "text-zinc-400"}`}>
                {act.description}
              </p>
            </div>

            <div className="text-[9px] font-mono text-zinc-500 flex items-center gap-0.5">
              <span>{Math.round(act.rlReward * 100)}% reward</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI Coach Message */}
      <div className="p-4 bg-white/5 border border-white/5 rounded-2xl flex flex-col gap-2 relative">
        <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
          <MessageSquare size={14} className="text-purple-400" />
          <span>{t("coachMessage")} · PydanticAI Coach</span>
        </div>
        <p className="text-[10px] text-zinc-400 leading-normal italic">
          "{data.coachMessage}"
        </p>
      </div>
    </div>
  );
}
