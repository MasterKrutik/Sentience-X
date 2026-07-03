"use client";
import { useState, useEffect } from "react";
import { useDailyQuestions, useSubmitAnswer, type DailyQuestion } from "@/lib/api/hooks";
import { useTranslations } from "next-intl";
import { HelpCircle, ChevronRight, ChevronLeft, Sparkles, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer } from "recharts";

export default function AgentChat() {
  const { data: questions, isLoading } = useDailyQuestions();
  const submitAnswerMutation = useSubmitAnswer();
  const t = useTranslations("questions");
  
  const [localQuestions, setLocalQuestions] = useState<DailyQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Seed local list on initial fetch
  useState(() => {
    if (questions) {
      setLocalQuestions(questions);
      // Find first unanswered
      const idx = questions.findIndex((q) => q.answer === null);
      if (idx !== -1) setCurrentIndex(idx);
    }
  });

  // Keep list updated if query completes
  useEffect(() => {
    if (questions && localQuestions.length === 0) {
      setLocalQuestions(questions);
      const idx = questions.findIndex((q) => q.answer === null);
      if (idx !== -1) setCurrentIndex(idx);
    }
  }, [questions, localQuestions]);

  if (isLoading || localQuestions.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center glass rounded-2xl">
        <span className="text-xs text-zinc-500 font-mono">Synthesizing Patient Questionnaire...</span>
      </div>
    );
  }

  const currentQuestion = localQuestions[currentIndex];
  const answeredCount = localQuestions.filter((q) => q.answer !== null).length;
  const totalCount = localQuestions.length;
  
  // Radial progress calculations
  const radius = 24;
  const strokeWidth = 4;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (answeredCount / totalCount) * circumference;

  const handleSelectAnswer = async (value: number) => {
    if (!currentQuestion) return;
    
    // Optimistic update
    const updated = localQuestions.map((q) => {
      if (q.id === currentQuestion.id) {
        return { ...q, answer: value };
      }
      return q;
    });
    setLocalQuestions(updated);

    // Call mutation
    submitAnswerMutation.mutate({ questionId: currentQuestion.id, answer: value });

    // Auto navigate to next unanswered question after small delay
    setTimeout(() => {
      const nextIdx = updated.findIndex((q, i) => i > currentIndex && q.answer === null);
      if (nextIdx !== -1) {
        setCurrentIndex(nextIdx);
      } else {
        // Look for any remaining unanswered
        const firstUnanswered = updated.findIndex((q) => q.answer === null);
        if (firstUnanswered !== -1) {
          setCurrentIndex(firstUnanswered);
        }
      }
    }, 400);
  };

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case "Social": return "border-cyan-500/20 text-cyan-400 bg-cyan-950/10";
      case "Motivation": return "border-purple-500/20 text-purple-400 bg-purple-950/10";
      case "Cognitive": return "border-pink-500/20 text-pink-400 bg-pink-950/10";
      case "Burnout": return "border-rose-500/20 text-rose-400 bg-rose-950/10";
      case "Anxiety": return "border-orange-500/20 text-orange-400 bg-orange-950/10";
      default: return "border-zinc-500/20 text-zinc-400 bg-zinc-950/10";
    }
  };

  // Mini yesterday performance chart data
  const miniChartData = [
    { name: "Soc", val: 3 },
    { name: "Mot", val: 4 },
    { name: "Cog", val: 2 },
    { name: "Burn", val: 5 },
    { name: "Anx", val: 3 },
  ];

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-6 h-full justify-between">
      {/* Header bar */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-display font-extrabold text-lg text-white">
            {t("title")}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            {t("aiGenerated")}
          </p>
        </div>
        
        {/* SVG radial ring progress */}
        <div className="relative flex-shrink-0">
          <svg className="w-14 h-14 rotate-[-90deg]">
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="transparent"
              stroke="var(--sx-border)"
              strokeWidth={strokeWidth}
            />
            <circle
              cx="28"
              cy="28"
              r={radius}
              fill="transparent"
              stroke="oklch(65% 0.22 300)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-300"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-[10px] text-data font-bold">
            <span>{answeredCount}</span>
            <span className="text-[7px] text-zinc-500 border-t border-white/10 w-4 text-center mt-0.5">{totalCount}</span>
          </div>
        </div>
      </div>

      {/* Main card viewport */}
      <div className="p-5 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-4 relative min-h-[160px] justify-center">
        <AnimatePresence mode="wait">
          {currentQuestion ? (
            <motion.div
              key={currentQuestion.id}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col gap-3"
            >
              {/* Category Badge */}
              <div className="flex">
                <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold font-mono uppercase border ${getCategoryColor(currentQuestion.category)}`}>
                  {currentQuestion.category}
                </span>
              </div>

              {/* Question Text */}
              <p className="text-xs text-white font-medium leading-relaxed">
                {currentQuestion.text}
              </p>

              {/* Likert 1-5 Selectors */}
              <div className="grid grid-cols-5 gap-2 mt-2">
                {[1, 2, 3, 4, 5].map((val) => {
                  const isSelected = currentQuestion.answer === val;
                  return (
                    <button
                      key={val}
                      onClick={() => handleSelectAnswer(val)}
                      className={`py-2 rounded-xl text-xs font-mono font-bold transition-all cursor-pointer border ${
                        isSelected
                          ? "bg-purple-600 border-purple-500 text-white shadow-[0_0_10px_oklch(65% 0.22 300 / 0.4)]"
                          : "bg-white/5 border-white/5 text-zinc-400 hover:border-white/15 hover:text-white"
                      }`}
                    >
                      {val}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between text-[8px] text-zinc-500 font-mono px-1">
                <span>Strongly Disagree</span>
                <span>Strongly Agree</span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center text-center gap-2"
            >
              <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <Check size={20} />
              </div>
              <p className="text-xs font-semibold text-white">Daily Questionnaire Complete</p>
              <p className="text-[10px] text-zinc-500">Your behavioral parameters are now recalibrated.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav toggles & mini chart */}
      <div className="flex justify-between items-center gap-4 border-t border-white/5 pt-4">
        {/* Navigation buttons */}
        <div className="flex gap-2">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="p-2 rounded-xl bg-white/5 border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <ChevronLeft size={14} />
          </button>
          <button
            onClick={() => setCurrentIndex((prev) => Math.min(totalCount - 1, prev + 1))}
            disabled={currentIndex === totalCount - 1}
            className="p-2 rounded-xl bg-white/5 border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-white/10 text-zinc-400 hover:text-white"
          >
            <ChevronRight size={14} />
          </button>
        </div>

        {/* Yesterday Mini Chart */}
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono text-zinc-500 whitespace-nowrap">{t("yesterdayScores")}</span>
          <div className="w-24 h-10">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={miniChartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                <Bar dataKey="val" fill="oklch(65% 0.22 300 / 0.5)" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
