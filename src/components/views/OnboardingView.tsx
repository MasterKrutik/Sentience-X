import React, { useState } from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { GlassCard } from '../ui/GlassCard';
import { Logo } from '../ui/Logo';
import { 
  Brain, ArrowRight, Activity, Moon, Smartphone, Footprints, Keyboard, 
  Sparkles, CheckCircle2, ShieldCheck, Heart, Info, RefreshCw
} from 'lucide-react';
import { 
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

export function OnboardingView() {
  const { 
    signals, updateSignal, questions, answerQuestion, submitQuestions, 
    predictions, setIsOnboarding, user 
  } = useWellnessStore();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [activeQuestionIdx, setActiveQuestionIdx] = useState(0);

  // Stage 1 -> 2
  const startCalibration = () => {
    setStep(2);
  };

  // Stage 2: Question wizard handlers
  const handleAnswerSelect = (qId: number, val: number) => {
    answerQuestion(qId, val);
    if (activeQuestionIdx < questions.length - 1) {
      setTimeout(() => {
        setActiveQuestionIdx(prev => prev + 1);
      }, 250);
    }
  };

  const handlePrevQuestion = () => {
    if (activeQuestionIdx > 0) {
      setActiveQuestionIdx(prev => prev - 1);
    }
  };

  const allQuestionsAnswered = questions.every(q => q.value !== null);

  const proceedToBaselines = async () => {
    if (!allQuestionsAnswered) return;
    // Calculate and trigger initial predictions
    await submitQuestions();
    setStep(3);
  };

  // Stage 3 -> 4
  const finalizeSynthesis = async () => {
    // Re-run predictions to incorporate any tweaks in signals
    await submitQuestions();
    setStep(4);
  };

  // Stage 4 -> App
  const enterApp = () => {
    setIsOnboarding(false);
    window.location.hash = 'dashboard';
  };

  // Calculations for twin plot preview in Stage 4
  const speedWeight = (120 - signals.typing_speed) / 95;
  const latencyWeight = signals.typing_latency / 300;
  const cognitiveLoadX = Math.round(Math.min(Math.max((speedWeight * 0.4 + latencyWeight * 0.6) * 100, 10), 90));

  const sleepWeight = signals.sleep_quality / 100;
  const socialWeight = signals.social_quality / 5;
  const motivationWeight = predictions.motivation / 100;
  const affectStabilityY = Math.round(Math.min(Math.max((sleepWeight * 0.3 + socialWeight * 0.3 + motivationWeight * 0.4) * 100, 10), 90));

  const scatterTrajectory = [
    { x: cognitiveLoadX, y: affectStabilityY, name: 'Initial Twin State' }
  ];

  return (
    <div className="min-h-screen bg-[#07080a] text-slate-100 flex flex-col justify-between py-8 px-4 relative overflow-hidden font-sans">
      
      {/* Background decoration */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-brand-purple/5 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Header */}
      <header className="max-w-4xl w-full mx-auto flex justify-between items-center z-10">
        <Logo iconSize="sm" />
        <div className="text-[10px] text-slate-500 font-mono tracking-wider uppercase bg-white/2 border border-white/5 px-2.5 py-1 rounded-full">
          Genesis Synthesis Stage {step}/4
        </div>
      </header>

      {/* Main wizard body */}
      <main className="max-w-xl w-full mx-auto my-auto py-12 z-10 relative">
        
        {/* STEP 1: Genesis & Awakening */}
        {step === 1 && (
          <div className="space-y-8 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
            <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
              {/* Pulsing layered glowing rings */}
              <div className="absolute inset-0 bg-gradient-to-tr from-brand-purple/20 to-brand-cyan/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute w-40 h-40 border border-brand-purple/30 rounded-full animate-spin-slow" />
              <div className="absolute w-36 h-36 border border-brand-cyan/20 border-dashed rounded-full animate-reverse-spin" />
              
              <div className="w-24 h-24 rounded-full bg-slate-900 border border-white/10 flex items-center justify-center shadow-2xl relative z-10">
                <Brain className="w-12 h-12 text-brand-cyan animate-pulse" />
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-white to-brand-cyan bg-clip-text text-transparent">
                Forming Your Mental Twin
              </h1>
              <p className="text-sm text-slate-400 max-w-md mx-auto leading-relaxed">
                Welcome, <span className="text-brand-cyan font-semibold">{user?.name || "Explorer"}</span>. SentienceX analyzes your daily typing telemetry, sleep patterns, and physical motion to form a secure, local emotional avatar.
              </p>
            </div>

            <GlassCard className="p-4 text-left border border-brand-purple/20 bg-brand-purple/2 flex gap-3.5">
              <Info className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
              <div className="text-xs text-slate-300 leading-relaxed">
                <strong>Data Privacy Sovereignty</strong>: All telemetry collection and behavioral feature extraction happens on-device. Raw inputs are immediately discarded, leaving only secure wellness score outputs.
              </div>
            </GlassCard>

            <button
              onClick={startCalibration}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-sm font-bold shadow-lg shadow-brand-purple/25 hover:shadow-brand-cyan/20 hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Begin Calibration <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 2: Survey Wizard */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">Initial Affect Calibration</h2>
              <p className="text-xs text-slate-400">
                Answer these 10 rapid queries to map your current baseline.
              </p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-brand-cyan h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((activeQuestionIdx + 1) / questions.length) * 100}%` }}
              />
            </div>

            {/* Question card */}
            <GlassCard className="p-6 space-y-6 border border-white/10 relative overflow-hidden">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">Question {activeQuestionIdx + 1} of 10</span>
                {questions[activeQuestionIdx].value !== null && (
                  <span className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Answered
                  </span>
                )}
              </div>

              <h3 className="text-base font-bold text-slate-200 leading-relaxed min-h-[50px]">
                {questions[activeQuestionIdx].textEn}
              </h3>

              <div className="space-y-4">
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((val) => (
                    <button
                      key={val}
                      onClick={() => handleAnswerSelect(questions[activeQuestionIdx].id, val)}
                      className={`flex-1 py-3.5 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        questions[activeQuestionIdx].value === val
                          ? 'bg-gradient-to-tr from-brand-purple to-brand-cyan border-white/20 text-white shadow-lg'
                          : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                
                <div className="flex justify-between text-[9px] text-slate-500 font-semibold uppercase tracking-wider px-1">
                  <span>
                    {[6,7,8,9].includes(questions[activeQuestionIdx].id) ? "Not at all" : "Poor / Low"}
                  </span>
                  <span>
                    {[6,7,8,9].includes(questions[activeQuestionIdx].id) ? "Severely" : "Optimal / High"}
                  </span>
                </div>
              </div>
            </GlassCard>

            <div className="flex justify-between items-center gap-4 pt-2">
              <button
                onClick={handlePrevQuestion}
                disabled={activeQuestionIdx === 0}
                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 disabled:opacity-40 cursor-pointer"
              >
                Back
              </button>
              
              <button
                onClick={proceedToBaselines}
                disabled={!allQuestionsAnswered}
                className="py-3 px-6 rounded-xl bg-slate-800 text-brand-cyan hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
              >
                Next Step <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Baselines Telemetry */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-slate-100">Telemetry Config Baselines</h2>
              <p className="text-xs text-slate-400">
                Calibrate your typical daily wellness baselines to refine the XGBoost models.
              </p>
            </div>

            <div className="space-y-4">
              {/* Slider 1: Sleep */}
              <GlassCard className="p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Moon className="w-4 h-4 text-brand-cyan" /> Typical Sleep Quality
                  </span>
                  <span className="text-xs font-mono text-brand-cyan font-bold">{signals.sleep_quality}%</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={signals.sleep_quality}
                  onChange={(e) => updateSignal('sleep_quality', parseInt(e.target.value))}
                  className="w-full accent-brand-cyan"
                />
              </GlassCard>

              {/* Slider 2: Typing Speed */}
              <GlassCard className="p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Keyboard className="w-4 h-4 text-brand-purple" /> Usual Typing Speed
                  </span>
                  <span className="text-xs font-mono text-brand-purple font-bold">{signals.typing_speed} WPM</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="110"
                  value={signals.typing_speed}
                  onChange={(e) => updateSignal('typing_speed', parseInt(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </GlassCard>

              {/* Slider 3: Steps */}
              <GlassCard className="p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Footprints className="w-4 h-4 text-emerald-400" /> Daily Steps Baseline
                  </span>
                  <span className="text-xs font-mono text-emerald-400 font-bold">{signals.steps.toLocaleString()} steps</span>
                </div>
                <input
                  type="range"
                  min="2000"
                  max="15000"
                  step="500"
                  value={signals.steps}
                  onChange={(e) => updateSignal('steps', parseInt(e.target.value))}
                  className="w-full accent-emerald-400"
                />
              </GlassCard>

              {/* Slider 4: Screen Time */}
              <GlassCard className="p-4 border border-white/5 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-yellow-400" /> Typical Screen Time
                  </span>
                  <span className="text-xs font-mono text-yellow-400 font-bold">{signals.screen_time} hours</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="14"
                  step="0.5"
                  value={signals.screen_time}
                  onChange={(e) => updateSignal('screen_time', parseFloat(e.target.value))}
                  className="w-full accent-yellow-400"
                />
              </GlassCard>
            </div>

            <button
              onClick={finalizeSynthesis}
              className="w-full mt-2 py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 cursor-pointer"
            >
              Synthesize Mental Twin <Sparkles className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* STEP 4: Synthesis Complete */}
        {step === 4 && (
          <div className="space-y-6 text-center animate-in scale-in duration-500">
            <div className="space-y-2">
              <div className="w-12 h-12 bg-green-500/10 border border-green-500/25 rounded-full flex items-center justify-center mx-auto mb-2 text-green-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-100">Twin Synthesis Complete!</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Your initial behavioral fingerprint matrix has been constructed. Welcome to your wellness telemetry console.
              </p>
            </div>

            {/* Twin Scatter Plot Preview */}
            <GlassCard className="p-4 h-52 flex flex-col justify-between border border-white/10 text-left">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Initial Mapping Matrix</span>
              <div className="h-36 mt-2 relative">
                <div className="absolute top-1 left-2 text-[7px] text-green-500 font-bold uppercase">Optimal</div>
                <div className="absolute bottom-1 right-2 text-[7px] text-red-500 font-bold uppercase">Exhaustion</div>
                
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 5, right: 5, bottom: -15, left: -25 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.03)" />
                    <XAxis type="number" dataKey="x" domain={[0, 100]} stroke="#475569" tick={{ fontSize: 8 }} />
                    <YAxis type="number" dataKey="y" domain={[0, 100]} stroke="#475569" tick={{ fontSize: 8 }} />
                    <ReferenceLine x={50} stroke="rgba(255,255,255,0.06)" />
                    <ReferenceLine y={50} stroke="rgba(255,255,255,0.06)" />
                    <Scatter 
                      name="Your Initial Twin" 
                      data={scatterTrajectory} 
                      fill="#22d3ee" 
                      shape={(props: any) => {
                        const { cx, cy } = props;
                        return (
                          <g>
                            <circle cx={cx} cy={cy} r={8} fill="none" stroke="#22d3ee" strokeWidth={1.5} className="animate-ping" style={{ transformOrigin: `${cx}px ${cy}px` }} />
                            <circle cx={cx} cy={cy} r={5} fill="#22d3ee" stroke="#ffffff" strokeWidth={1} />
                          </g>
                        );
                      }}
                    />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <button
              onClick={enterApp}
              className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-brand-purple to-brand-cyan text-white text-sm font-bold shadow-lg hover:scale-102 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              Enter SentienceX OS <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="max-w-4xl w-full mx-auto text-center text-[10px] text-slate-500 mt-8 z-10">
        SentienceX Wellness OS • HIPAA & DPDP Compliant Architecture
      </footer>

    </div>
  );
}
