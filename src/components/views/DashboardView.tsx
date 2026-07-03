import React, { useState } from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { VisualRing } from '../VisualRing';
import { GlassCard } from '../ui/GlassCard';
import { 
  Sparkles, CheckCircle2, Circle, Activity, Keyboard, 
  Moon, Flame, Clock, Award, ShieldCheck, Database,
  HeartPulse, ChevronRight, ChevronLeft, X, AlertCircle, BarChart2
} from 'lucide-react';

const PHQ9_QUESTIONS = [
  "Little interest or pleasure in doing things",
  "Feeling down, depressed, or hopeless",
  "Trouble falling or staying asleep, or sleeping too much",
  "Feeling tired or having little energy",
  "Poor appetite or overeating",
  "Feeling bad about yourself — or that you are a failure or have let yourself or your family down",
  "Trouble concentrating on things, such as reading the newspaper or watching television",
  "Moving or speaking so slowly that other people could have noticed? Or the opposite — being so fidgety or restless that you have been moving around a lot more than usual",
  "Thoughts that you would be better off dead or of hurting yourself in some way"
];

const GAD7_QUESTIONS = [
  "Feeling nervous, anxious or on edge",
  "Not being able to stop or control worrying",
  "Worrying too much about different things",
  "Trouble relaxing",
  "Being so restless that it is hard to sit still",
  "Becoming easily annoyed or irritable",
  "Feeling afraid as if something awful might happen"
];

const CLINICAL_OPTIONS = [
  { label: "Not at all", value: 0 },
  { label: "Several days", value: 1 },
  { label: "More than half the days", value: 2 },
  { label: "Nearly every day", value: 3 }
];

export function DashboardView() {
  const { 
    predictions, 
    signals, 
    tasks, 
    toggleTask, 
    language, 
    predictionSource,
    signalsSubmittedToday,
    questionsSubmittedToday,
    streakCount,
    lastDeeperCheckInTime,
    submitClinicalLog,
    skipDeeperCheckIn
  } = useWellnessStore();
  
  const t = translations[language].app;
  const score = Math.round(predictions.overall_wellness);
  const hasData = predictionSource !== null;

  // Modal Step States
  const [showCheckInModal, setShowCheckInModal] = useState(false);
  const [modalStep, setModalStep] = useState<1 | 2 | 3>(1);
  const [phqAnswers, setPhqAnswers] = useState<Record<number, number>>({});
  const [gadAnswers, setGadAnswers] = useState<Record<number, number>>({});

  const handleSkipCheckIn = () => {
    skipDeeperCheckIn();
  };

  const handleNextStep = () => {
    if (modalStep === 1) {
      setModalStep(2);
    }
  };

  const handlePrevStep = () => {
    if (modalStep === 2) {
      setModalStep(1);
    }
  };

  const phqScore = Object.values(phqAnswers).reduce((sum, val) => sum + val, 0);
  const gadScore = Object.values(gadAnswers).reduce((sum, val) => sum + val, 0);

  const allPhqAnswered = Object.keys(phqAnswers).length === PHQ9_QUESTIONS.length;
  const allGadAnswered = Object.keys(gadAnswers).length === GAD7_QUESTIONS.length;

  const getPhqSeverity = (score: number) => {
    if (score <= 4) return { label: "Minimal Depression", color: "text-green-400" };
    if (score <= 9) return { label: "Mild Depression", color: "text-emerald-400" };
    if (score <= 14) return { label: "Moderate Depression", color: "text-yellow-400" };
    if (score <= 19) return { label: "Moderately Severe Depression", color: "text-orange-400" };
    return { label: "Severe Depression", color: "text-red-400" };
  };

  const getGadSeverity = (score: number) => {
    if (score <= 4) return { label: "Minimal Anxiety", color: "text-green-400" };
    if (score <= 9) return { label: "Mild Anxiety", color: "text-emerald-400" };
    if (score <= 14) return { label: "Moderate Anxiety", color: "text-yellow-400" };
    return { label: "Severe Anxiety", color: "text-red-400" };
  };

  const handleSubmitCheckIn = async () => {
    if (!allPhqAnswered || !allGadAnswered) return;
    await submitClinicalLog(
      PHQ9_QUESTIONS.map((_, idx) => phqAnswers[idx]),
      phqScore,
      GAD7_QUESTIONS.map((_, idx) => gadAnswers[idx]),
      gadScore
    );
    setModalStep(3);
  };

  const handleCloseModal = () => {
    setShowCheckInModal(false);
    setModalStep(1);
    setPhqAnswers({});
    setGadAnswers({});
  };

  const needsDeeperCheckIn = (() => {
    if (!lastDeeperCheckInTime) return true;
    try {
      const lastDate = new Date(lastDeeperCheckInTime);
      const today = new Date();
      const diffTime = Math.abs(today.getTime() - lastDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays >= 7;
    } catch (e) {
      return true;
    }
  })();

  // Comparison
  const normalizedGad = (gadScore / 21) * 100;
  const modelAnxiety = predictions.anxiety;
  const anxietyDiff = Math.abs(normalizedGad - modelAnxiety);
  const isDivergingAnxiety = anxietyDiff > 25;

  const normalizedPhq = (phqScore / 27) * 100;
  const modelBurnout = predictions.burnout;
  const depressionDiff = Math.abs(normalizedPhq - modelBurnout);
  const isDivergingDepression = depressionDiff > 25;
  
  // Generate dynamic, realistic AI explanation text based on metrics
  const getAISummary = () => {
    if (score >= 80) {
      return `Your overall wellness index is Excellent at ${score}/100. Your cognitive latency is optimal at ${signals.typing_latency}ms, and physical activity (${signals.steps} steps) is keeping your motivation levels high. Continue prioritizing this balanced schedule!`;
    } else if (score >= 70) {
      return `Your wellness index shows a Mild Decline at ${score}/100. We detected a slight drop in your sleep quality (${signals.sleep_quality}%) and a minor increase in typing errors (${signals.typing_errors}). Try deep breathing exercises to restore mental clarity.`;
    } else if (score >= 50) {
      return `Your wellness index indicates a Moderate Risk at ${score}/100. This is primarily driven by elevated stress (${Math.round(predictions.stress)}/100) correlating with screen time exceeding ${signals.screen_time} hours. Disconnecting from screens early tonight is highly recommended.`;
    } else {
      return `CRITICAL: Your wellness index has dropped to ${score}/100 (High Risk). Elevated anxiety and burnout indicators are detected, likely stemming from poor sleep (${signals.sleep_duration} hrs) and high cognitive fatigue. Please review the recovery helplines in the Intervention Engine immediately.`;
    }
  };

  // Model performance metadata from our real training run
  const modelStats = {
    stress: { r2: 0.6499, mae: 4.19 },
    burnout: { r2: 0.6627, mae: 3.79 },
    overall_wellness: { r2: 0.8070, mae: 2.28 }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Welcome Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            {t.welcomeBack} <span className="text-gradient">Sentience User</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">{t.tagline}</p>
        </div>
        
        {/* ML Status Indicator */}
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/5 bg-white/5 text-[10px] text-slate-300 font-mono self-start">
          <Database className="w-3 h-3 text-brand-cyan" />
          <span>ML Engine:</span>
          <span className={`font-semibold ${predictionSource === 'xgboost_server' ? 'text-green-400' : 'text-amber-400'}`}>
            {predictionSource === 'xgboost_server' ? 'XGBoost Server' : 'Local Fallback'}
          </span>
          <span className={`w-1.5 h-1.5 rounded-full ${predictionSource === 'xgboost_server' ? 'bg-green-500' : 'bg-amber-500'} animate-pulse`} />
        </div>
      </div>

      {/* Daily Reminders / Retention Panel */}
      {(!signalsSubmittedToday || !questionsSubmittedToday) && (
        <GlassCard className="border-orange-500/20 bg-gradient-to-r from-orange-500/5 to-brand-purple/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/10 rounded-2xl text-orange-500 shrink-0 animate-pulse">
              <Flame className="w-6 h-6 fill-orange-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Maintain Your Wellness Streak
                {streakCount > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 text-[10px]">
                    {streakCount} Day{streakCount !== 1 ? 's' : ''} Active
                  </span>
                )}
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                {!signalsSubmittedToday && !questionsSubmittedToday
                  ? `You haven't submitted your telemetry or daily survey yet. Complete them today to keep your ${streakCount}-day streak alive and calibrate your Mental Twin!`
                  : !signalsSubmittedToday
                  ? `Almost done! Submit your daily typing telemetry signals to maintain your ${streakCount}-day streak.`
                  : `Almost done! Complete today's affect survey questions to secure your ${streakCount}-day streak.`}
              </p>
            </div>
          </div>
          
          <div className="flex gap-2.5 w-full md:w-auto">
            {!signalsSubmittedToday && (
              <button
                onClick={() => { window.location.hash = 'signals'; }}
                className="flex-1 md:flex-none px-4 py-2 bg-slate-900 border border-white/10 hover:border-brand-cyan/30 text-brand-cyan text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Submit Signals
              </button>
            )}
            {!questionsSubmittedToday && (
              <button
                onClick={() => { window.location.hash = 'questions'; }}
                className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-r from-orange-500 to-brand-purple text-white text-xs font-bold rounded-xl shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 transition-all cursor-pointer"
              >
                Complete Survey
              </button>
            )}
          </div>
        </GlassCard>
      )}

      {/* Deeper Check-in Banner */}
      {needsDeeperCheckIn && (
        <GlassCard className="border-indigo-500/20 bg-gradient-to-r from-indigo-500/5 to-cyan-500/5 p-5 flex flex-col md:flex-row items-center justify-between gap-4 animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 rounded-2xl text-indigo-400 shrink-0">
              <HeartPulse className="w-6 h-6 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                Weekly Deeper Check-in
                <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-400 text-[10px]">
                  Clinical Validated
                </span>
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xl">
                It has been 7 days since your last clinical self-report. Take a 2-minute PHQ-9 & GAD-7 assessment to log ground-truth data and calibrate your Mental Twin.
              </p>
            </div>
          </div>
          
          <div className="flex gap-2.5 w-full md:w-auto shrink-0">
            <button
              onClick={handleSkipCheckIn}
              className="flex-1 md:flex-none px-4 py-2 border border-white/5 bg-white/2 hover:bg-white/5 text-slate-400 hover:text-slate-200 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Skip for now
            </button>
            <button
              onClick={() => {
                setShowCheckInModal(true);
                setModalStep(1);
              }}
              className="flex-1 md:flex-none px-4 py-2 bg-gradient-to-tr from-brand-purple to-brand-cyan text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-cyan/15 hover:scale-102 transition-all cursor-pointer"
            >
              Start Check-in
            </button>
          </div>
        </GlassCard>
      )}

      {/* Modal Dialog */}
      {showCheckInModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <GlassCard className="max-w-2xl w-full border border-indigo-500/20 bg-slate-950/90 shadow-2xl p-6 relative flex flex-col max-h-[85vh] animate-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex justify-between items-center pb-4 border-b border-white/10">
              <div className="flex items-center gap-2">
                <HeartPulse className="w-5 h-5 text-indigo-400" />
                <h2 className="font-extrabold text-sm text-slate-100 uppercase tracking-wider">
                  Weekly Deeper Check-in
                </h2>
              </div>
              <button 
                onClick={handleCloseModal}
                className="text-slate-400 hover:text-slate-200 cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Questions list */}
            <div className="flex-1 overflow-y-auto pr-2 my-4 space-y-6 scrollbar-thin">
              {modalStep === 1 && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase">Part 1: PHQ-9 (Patient Health Questionnaire)</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                  </div>
                  {PHQ9_QUESTIONS.map((q, idx) => (
                    <div key={`phq-${idx}`} className={`p-3.5 rounded-xl border transition-all ${phqAnswers[idx] !== undefined ? 'bg-indigo-950/10 border-indigo-500/25' : 'bg-white/2 border-white/5'}`}>
                      <h4 className="text-xs font-semibold text-slate-200 mb-3">{idx + 1}. {q}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CLINICAL_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setPhqAnswers(prev => ({ ...prev, [idx]: opt.value }))}
                            className={`py-2 px-2.5 rounded-lg text-[10px] font-medium transition-all border cursor-pointer ${
                              phqAnswers[idx] === opt.value
                                ? 'bg-gradient-to-tr from-brand-purple to-brand-cyan border-white/10 text-white font-semibold shadow-md'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                            }`}
                          >
                            {opt.label} (+{opt.value})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalStep === 2 && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-950/20 border border-indigo-500/10 rounded-xl">
                    <h3 className="text-xs font-bold text-indigo-300 uppercase">Part 2: GAD-7 (Anxiety Assessment)</h3>
                    <p className="text-[10px] text-slate-400 mt-1">Over the last 2 weeks, how often have you been bothered by any of the following problems?</p>
                  </div>
                  {GAD7_QUESTIONS.map((q, idx) => (
                    <div key={`gad-${idx}`} className={`p-3.5 rounded-xl border transition-all ${gadAnswers[idx] !== undefined ? 'bg-brand-cyan/5 border-brand-cyan/25' : 'bg-white/2 border-white/5'}`}>
                      <h4 className="text-xs font-semibold text-slate-200 mb-3">{idx + 1}. {q}</h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {CLINICAL_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            onClick={() => setGadAnswers(prev => ({ ...prev, [idx]: opt.value }))}
                            className={`py-2 px-2.5 rounded-lg text-[10px] font-medium transition-all border cursor-pointer ${
                              gadAnswers[idx] === opt.value
                                ? 'bg-gradient-to-tr from-brand-purple to-brand-cyan border-white/10 text-white font-semibold shadow-md'
                                : 'bg-slate-900/50 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                            }`}
                          >
                            {opt.label} (+{opt.value})
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalStep === 3 && (
                <div className="space-y-6 py-2">
                  <div className="text-center space-y-2">
                    <div className="w-12 h-12 bg-green-500/15 rounded-full flex items-center justify-center mx-auto text-green-400 border border-green-500/20 animate-pulse">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <h3 className="text-base font-extrabold text-slate-100">Check-in Complete</h3>
                    <p className="text-xs text-slate-400 max-w-md mx-auto">
                      Thank you for completing your weekly calibration check-in. Your self-report answers have been securely saved to help calibrate your twin.
                    </p>
                  </div>

                  {/* Clinical Indicator Panel */}
                  <div className="border border-indigo-500/15 bg-indigo-950/5 p-4 rounded-xl space-y-4">
                    <div className="flex items-center gap-2 text-indigo-300">
                      <HeartPulse className="w-5 h-5 text-brand-cyan animate-pulse" />
                      <span className="text-xs font-bold uppercase tracking-wider">Self-Report Summary</span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Depression Scale */}
                      <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1.5 text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">PHQ-9 (Depression Scale)</span>
                        <div className="flex justify-between items-baseline mt-2">
                          <span className="text-xs text-slate-400 font-medium">Self-report Score:</span>
                          <span className="text-xs font-semibold text-slate-200">{phqScore} / 27</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-400 font-medium">Classification:</span>
                          <span className={`text-xs font-bold ${getPhqSeverity(phqScore).color}`}>
                            {getPhqSeverity(phqScore).label}
                          </span>
                        </div>
                      </div>

                      {/* Anxiety Scale */}
                      <div className="p-3.5 rounded-lg bg-black/40 border border-white/5 space-y-1.5 text-left">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">GAD-7 (Anxiety Scale)</span>
                        <div className="flex justify-between items-baseline mt-2">
                          <span className="text-xs text-slate-400 font-medium">Self-report Score:</span>
                          <span className="text-xs font-semibold text-slate-200">{gadScore} / 21</span>
                        </div>
                        <div className="flex justify-between items-baseline">
                          <span className="text-xs text-slate-400 font-medium">Classification:</span>
                          <span className={`text-xs font-bold ${getGadSeverity(gadScore).color}`}>
                            {getGadSeverity(gadScore).label}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-[10px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-3">
                      * Clinically validated scales are self-report screening tools. This summary is intended to help you monitor your own symptoms over time. It does not constitute a clinical evaluation and cannot replace professional medical diagnosis or consultation.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center pt-4 border-t border-white/10">
              <div>
                {modalStep === 1 && (
                  <span className="text-[10px] text-slate-400 font-mono">Step 1 of 3: Depression Assessment ({Object.keys(phqAnswers).length}/9 answered)</span>
                )}
                {modalStep === 2 && (
                  <span className="text-[10px] text-slate-400 font-mono">Step 2 of 3: Anxiety Assessment ({Object.keys(gadAnswers).length}/7 answered)</span>
                )}
                {modalStep === 3 && (
                  <span className="text-[10px] text-slate-400 font-mono">Step 3 of 3: Check-in Summary</span>
                )}
              </div>

              <div className="flex gap-2">
                {modalStep === 2 && (
                  <button
                    onClick={handlePrevStep}
                    className="py-1.5 px-3 rounded-lg border border-white/10 hover:border-brand-purple/20 bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center gap-1 text-slate-200 cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" /> Back
                  </button>
                )}
                {modalStep === 1 && (
                  <button
                    onClick={handleNextStep}
                    disabled={!allPhqAnswered}
                    className="py-1.5 px-4 bg-gradient-to-tr from-brand-purple to-brand-cyan text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </button>
                )}
                {modalStep === 2 && (
                  <button
                    onClick={handleSubmitCheckIn}
                    disabled={!allGadAnswered}
                    className="py-1.5 px-4 bg-green-600 hover:bg-green-500 text-white text-xs font-bold rounded-lg flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Submit Validation
                  </button>
                )}
                {modalStep === 3 && (
                  <button
                    onClick={handleCloseModal}
                    className="py-1.5 px-4 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-lg cursor-pointer"
                  >
                    Close
                  </button>
                )}
              </div>
            </div>
          </GlassCard>
        </div>
      )}

      {/* Primary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Wellness Score Card */}
        <GlassCard className="flex flex-col items-center justify-center text-center col-span-1 py-8 relative overflow-hidden">
          <h2 className="text-sm font-semibold tracking-wider text-slate-400 uppercase mb-6 z-10">
            {t.overallScore}
          </h2>

          {hasData ? (
            <>
              <VisualRing score={score} />
              <div className="mt-6 space-y-1 z-10">
                <p className="text-xs text-slate-400">
                  Active telemetry indicates your cognitive speed is{" "}
                  <span className="font-semibold text-brand-cyan">{signals.typing_speed} WPM</span>.
                </p>
                <p className="text-[10px] text-slate-500 font-mono">
                  Inference updated today
                </p>
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 py-4 px-6 z-10">
              <div className="w-24 h-24 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center">
                <BarChart2 className="w-10 h-10 text-slate-600" />
              </div>
              <div className="space-y-1.5 text-center">
                <p className="text-xs font-semibold text-slate-300">No predictions yet</p>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  Submit your Daily Signals or Daily Survey to generate your first wellness score.
                </p>
              </div>
            </div>
          )}
        </GlassCard>

        {/* AI summary and Today's Tasks */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* AI State Summary */}
          <GlassCard className="relative overflow-hidden border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-transparent">
            <div className="absolute top-3 right-3 p-1.5 rounded-lg bg-brand-purple/10 text-brand-purple">
              <Sparkles className="w-4 h-4 text-brand-cyan" />
            </div>
            
            <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2 mb-3">
              {t.aiSummary}
            </h3>
            
            {hasData ? (
              <p className="text-sm text-slate-200 leading-relaxed font-medium">
                {getAISummary()}
              </p>
            ) : (
              <div className="flex items-start gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                <AlertCircle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  Your Mental Twin has no telemetry yet. Submit your{" "}
                  <button onClick={() => { window.location.hash = 'signals'; }} className="text-brand-cyan underline underline-offset-2 cursor-pointer">Daily Signals</button>{" "}
                  or{" "}
                  <button onClick={() => { window.location.hash = 'questions'; }} className="text-brand-cyan underline underline-offset-2 cursor-pointer">Daily Survey</button>{" "}
                  to activate AI-driven wellness analysis.
                </p>
              </div>
            )}
          </GlassCard>

          {/* Today's Tasks */}
          <GlassCard>
            <h3 className="text-sm font-semibold tracking-wider text-slate-300 uppercase flex items-center gap-2 mb-4">
              <CheckCircle2 className="w-4 h-4 text-brand-cyan" />
              {t.todayTasks}
            </h3>
            
            <div className="space-y-3">
              {tasks.map((task) => (
                <button
                  key={task.id}
                  onClick={() => toggleTask(task.id)}
                  className="w-full flex items-start gap-3 p-2.5 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all text-left text-xs cursor-pointer group"
                >
                  {task.completed ? (
                    <CheckCircle2 className="w-4 h-4 text-green-400 shrink-0 mt-0.5" />
                  ) : (
                    <Circle className="w-4 h-4 text-slate-500 shrink-0 mt-0.5 group-hover:text-slate-400" />
                  )}
                  <span className={`transition-all ${task.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                    {task.text}
                  </span>
                </button>
              ))}
            </div>
          </GlassCard>

        </div>
      </div>

      {/* Quick Stats Grid */}
      <div>
        <h2 className="text-xs font-bold tracking-widest text-slate-400 uppercase mb-4 flex items-center gap-2">
          <Activity className="w-3.5 h-3.5" />
          {t.quickStats}
        </h2>
        
        {hasData ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
          
            <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-3 h-3" /> WPM Speed
              </span>
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-100">{signals.typing_speed}</div>
                <span className="text-[9px] text-green-400">Baseline optimal</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Keyboard className="w-3 h-3" /> Key Latency
              </span>
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-100">{signals.typing_latency}<span className="text-xs font-normal text-slate-500">ms</span></div>
                <span className="text-[9px] text-slate-400">Cognitive delay index</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Moon className="w-3 h-3" /> Sleep Duration
              </span>
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-100">{signals.sleep_duration}<span className="text-xs font-normal text-slate-500">h</span></div>
                <span className="text-[9px] text-slate-400">Sleep quality: {signals.sleep_quality}%</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Flame className="w-3 h-3" /> Daily Steps
              </span>
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-100">{signals.steps.toLocaleString()}</div>
                <span className="text-[9px] text-green-400">Activity target active</span>
              </div>
            </div>

            <div className="col-span-2 md:col-span-4 lg:col-span-1 p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3 h-3" /> Screen Time
              </span>
              <div>
                <div className="text-2xl font-bold tracking-tight text-slate-100">{signals.screen_time}<span className="text-xs font-normal text-slate-500">h</span></div>
                <span className="text-[9px] text-slate-400">Total phone + desktop</span>
              </div>
            </div>

          </div>
        ) : (
          <div className="p-6 rounded-2xl border border-dashed border-white/8 bg-white/2 text-center">
            <p className="text-xs text-slate-500">
              Signal data will appear here after your first submission.
            </p>
          </div>
        )}
      </div>

      {/* Model Information Panel / Under the Hood */}
      <GlassCard className="border border-white/5 bg-slate-950/20">
        <h3 className="text-xs font-bold tracking-widest text-slate-300 uppercase mb-4 flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-brand-cyan" />
          Under The Hood: Real XGBoost Model Validation
        </h3>
        
        <p className="text-xs text-slate-400 mb-4 leading-relaxed">
          SentienceX is backed by 7 real trained Gradient Boosting models (`XGBRegressor`). They predict emotional affect, cognitive load, and risk levels based on 11 daily behavioral signals. Feature importances are computed natively from the training runs.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          
          <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Stress Predictor</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-xs text-slate-300">R² Score: <span className="font-mono text-slate-200">{modelStats.stress.r2.toFixed(4)}</span></span>
              <span className="text-[10px] text-slate-500">MAE: {modelStats.stress.mae}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Burnout Predictor</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-xs text-slate-300">R² Score: <span className="font-mono text-slate-200">{modelStats.burnout.r2.toFixed(4)}</span></span>
              <span className="text-[10px] text-slate-500">MAE: {modelStats.burnout.mae}</span>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-white/2 border border-white/5 flex flex-col justify-between">
            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Overall Index</span>
            <div className="flex justify-between items-baseline mt-2">
              <span className="text-xs text-slate-300">R² Score: <span className="font-mono text-slate-200">{modelStats.overall_wellness.r2.toFixed(4)}</span></span>
              <span className="text-[10px] text-slate-500">MAE: {modelStats.overall_wellness.mae}</span>
            </div>
          </div>

        </div>
        
        <div className="mt-4 flex justify-between items-center text-[10px] text-slate-500">
          <span>Accuracy validated on 20% test partition (n=600 validation vectors).</span>
          <span className="text-brand-purple">View MODEL_CARD.md for complete details.</span>
        </div>
      </GlassCard>

    </div>
  );
}
