import React, { useState, useEffect } from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { 
  ClipboardList, CheckCircle2, Info, ChevronRight, HelpCircle, 
  HeartPulse, ShieldCheck, AlertCircle, RefreshCw, BarChart2 
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

export function QuestionsView() {
  const { 
    questions, answerQuestion, submitQuestions, language, 
    questionsSubmittedToday, predictions, groundTruth, submitGroundTruth,
    refreshDailyQuestionsIfStale
  } = useWellnessStore();

  // Defensive daily refresh: if the user left the tab open overnight,
  // calling this ensures the next navigation to this view gets a fresh set.
  useEffect(() => {
    refreshDailyQuestionsIfStale();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'clinical'>('daily');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Clinical questionnaire states
  const [phqAnswers, setPhqAnswers] = useState<Record<number, number>>({});
  const [gadAnswers, setGadAnswers] = useState<Record<number, number>>({});
  const [clinicalSuccess, setClinicalSuccess] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  const t = translations[language].app;

  // 1. Daily Affect questionnaire stats
  const answeredCount = questions.filter(q => q.value !== null).length;
  const completionPercentage = Math.round((answeredCount / questions.length) * 100);
  const allAnswered = answeredCount === questions.length;

  // 2. Clinical GAD-7 / PHQ-9 stats
  const totalPhqQuestions = PHQ9_QUESTIONS.length;
  const totalGadQuestions = GAD7_QUESTIONS.length;
  const answeredPhqCount = Object.keys(phqAnswers).length;
  const answeredGadCount = Object.keys(gadAnswers).length;
  const totalClinicalQuestions = totalPhqQuestions + totalGadQuestions;
  const totalClinicalAnswered = answeredPhqCount + answeredGadCount;
  const clinicalCompletionPercentage = Math.round((totalClinicalAnswered / totalClinicalQuestions) * 100);
  const allClinicalAnswered = totalClinicalAnswered === totalClinicalQuestions;

  // Calculations for scores
  const phqScore = Object.values(phqAnswers).reduce((sum, val) => sum + val, 0);
  const gadScore = Object.values(gadAnswers).reduce((sum, val) => sum + val, 0);

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

  const handleDailySubmit = async () => {
    if (!allAnswered || isSubmitting) return;
    setIsSubmitting(true);
    
    setTimeout(async () => {
      await submitQuestions();
      setIsSubmitting(false);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 4000);
    }, 1200);
  };

  const handleClinicalSubmit = async () => {
    if (!allClinicalAnswered || isSubmitting) return;
    setIsSubmitting(true);
    
    setTimeout(async () => {
      await submitGroundTruth(phqScore, gadScore);
      setIsSubmitting(false);
      setClinicalSuccess(true);
      setShowComparison(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setClinicalSuccess(false), 5000);
    }, 1500);
  };

  // Likert label — framing is always 1=least/5=most from the user's perspective.
  // Score inversion for negatively-framed questions is handled server-side in the
  // affect computation, NOT here. Using a single neutral scale keeps the UI simple.
  const getLikertLabel = (_id: number, val: number) => {
    switch(val) {
      case 1: return "Not at all / Never";
      case 2: return "Slightly / Rarely";
      case 3: return "Moderately";
      case 4: return "Mostly / Often";
      case 5: return "Completely / Always";
      default: return "";
    }
  };

  // Difference checks for correlation validation
  const normalizedGad = (gadScore / 21) * 100;
  const modelAnxiety = predictions.anxiety;
  const anxietyDiff = Math.abs(normalizedGad - modelAnxiety);
  const isDivergingAnxiety = anxietyDiff > 25;

  const normalizedPhq = (phqScore / 27) * 100;
  const modelBurnout = predictions.burnout;
  const depressionDiff = Math.abs(normalizedPhq - modelBurnout);
  const isDivergingDepression = depressionDiff > 25;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <ClipboardList className="w-7 h-7 text-brand-cyan" />
            {translations[language].nav.questions}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active affect logging. Provide feedback to align and validate the ML Mental Health Twin.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-white/5 self-stretch md:self-auto">
          <button
            onClick={() => setActiveSubTab('daily')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
              activeSubTab === 'daily'
                ? 'bg-slate-800 text-brand-cyan shadow-sm border border-white/5'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            Daily Survey
          </button>
          <button
            onClick={() => setActiveSubTab('clinical')}
            className={`flex-1 md:flex-initial px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer whitespace-nowrap flex items-center justify-center gap-1.5 ${
              activeSubTab === 'clinical'
                ? 'bg-slate-800 text-brand-cyan shadow-sm border border-white/5'
                : 'text-slate-400 hover:text-slate-200 border border-transparent'
            }`}
          >
            <HeartPulse className="w-3.5 h-3.5" /> Clinical Ground-Truth
          </button>
        </div>
      </div>

      {/* Success Notification Banners */}
      {success && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/20 text-green-300 text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
          <div>
            <span className="font-semibold block">Questionnaire Submitted Successfully</span>
            Your daily response vector has been processed by the XGBoost models. Overall Wellness Index updated to <span className="font-bold text-slate-100">{Math.round(predictions.overall_wellness)}/100</span>.
          </div>
        </div>
      )}

      {clinicalSuccess && (
        <div className="p-4 rounded-xl border border-blue-500/30 bg-blue-950/20 text-blue-300 text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <ShieldCheck className="w-5 h-5 shrink-0 text-blue-400" />
          <div>
            <span className="font-semibold block">Clinical Assessment Recorded</span>
            Validated scores (PHQ-9: {phqScore}, GAD-7: {gadScore}) logged. This telemetry will calibrate the ML predictions.
          </div>
        </div>
      )}

      {/* Dynamic Sub-tab Render */}
      {activeSubTab === 'daily' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Daily Progress Sidebar */}
          <div className="col-span-1 space-y-6">
            <GlassCard className="sticky top-24">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4">
                Survey Progress
              </h3>
              
              <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="rgba(255, 255, 255, 0.02)"
                    strokeWidth="8"
                    fill="transparent"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="52"
                    stroke="url(#progress-gradient)"
                    strokeWidth="8"
                    strokeDasharray={2 * Math.PI * 52}
                    strokeDashoffset={2 * Math.PI * 52 * (1 - completionPercentage / 100)}
                    strokeLinecap="round"
                    fill="transparent"
                    className="transition-all duration-500 ease-out"
                  />
                  <defs>
                    <linearGradient id="progress-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#7C3AED" />
                      <stop offset="100%" stopColor="#22D3EE" />
                    </linearGradient>
                  </defs>
                </svg>
                
                <div className="absolute flex flex-col items-center">
                  <span className="text-2xl font-bold tracking-tight">{completionPercentage}%</span>
                  <span className="text-[9px] text-slate-400 font-mono mt-0.5">{answeredCount}/10 completed</span>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-white/5 space-y-3">
                <div className="flex gap-2 text-[10px] text-slate-400">
                  <Info className="w-3.5 h-3.5 shrink-0 text-brand-cyan mt-0.5" />
                  <span>Answers are processed by our on-device local math fallback or secure FastAPI servers.</span>
                </div>
              </div>
              
              <button
                onClick={handleDailySubmit}
                disabled={!allAnswered || isSubmitting || questionsSubmittedToday}
                className={`w-full mt-6 py-2.5 px-4 glass-btn text-xs font-semibold flex items-center justify-center gap-2 ${
                  questionsSubmittedToday ? 'opacity-60 bg-green-500/20 text-green-300 border-green-500/20 hover:scale-100 hover:shadow-none' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : questionsSubmittedToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Submitted Today
                  </>
                ) : (
                  <>
                    Submit Survey <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </GlassCard>
          </div>

          {/* Daily Questions List */}
          <div className="lg:col-span-3 space-y-4">
            {questions.map((q, index) => {
              const questionText = language === 'hi' ? q.textHi : language === 'gu' ? q.textGu : q.textEn;
              return (
                <GlassCard 
                  key={q.id} 
                  className={`transition-all duration-300 ${
                    q.value !== null ? 'border-brand-purple/20 bg-brand-purple/2 animate-pulse-subtle' : 'border-white/5'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-xs font-bold text-slate-300 mt-0.5 shrink-0">
                      {index + 1}
                    </span>
                    
                    <div className="flex-1 space-y-4">
                      <h3 className="text-sm font-semibold text-slate-100 leading-relaxed">
                        {questionText}
                      </h3>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-center gap-2">
                          {[1, 2, 3, 4, 5].map((val) => (
                            <button
                              key={val}
                              onClick={() => answerQuestion(q.id, val)}
                              className={`flex-1 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                                q.value === val
                                  ? 'bg-gradient-to-tr from-brand-purple to-brand-cyan border-white/20 text-white shadow-lg shadow-brand-cyan/10 scale-102'
                                  : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-200'
                              }`}
                            >
                              {val}
                            </button>
                          ))}
                        </div>
                        
                        <div className="flex justify-between text-[10px] text-slate-500 font-medium px-1">
                          <span>{getLikertLabel(q.id, 1)}</span>
                          {q.value !== null && (
                            <span className="text-brand-cyan font-semibold">
                              Selected: {getLikertLabel(q.id, q.value)}
                            </span>
                          )}
                          <span>{getLikertLabel(q.id, 5)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          
          {/* Clinical Sidebar / Analytics Panel */}
          <div className="col-span-1 space-y-6">
            <GlassCard className="sticky top-24 space-y-6">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Clinical Progress
                </h3>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div 
                    className="bg-brand-cyan h-2 rounded-full transition-all duration-300"
                    style={{ width: `${clinicalCompletionPercentage}%` }}
                  />
                </div>
                <div className="flex justify-between mt-1 text-[10px] text-slate-400 font-mono">
                  <span>Progress</span>
                  <span>{totalClinicalAnswered}/{totalClinicalQuestions} logged</span>
                </div>
              </div>

              {groundTruth.lastSubmitted && (
                <div className="p-3 rounded-lg bg-white/5 border border-white/10 text-left space-y-1">
                  <span className="text-[10px] text-slate-500 block uppercase font-mono">Last Validation</span>
                  <span className="text-[11px] text-slate-300 font-semibold block">{groundTruth.lastSubmitted}</span>
                  <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-white/5">
                    <div>
                      <span className="text-[9px] text-slate-500 block">PHQ-9</span>
                      <span className="text-xs font-bold text-brand-cyan">{groundTruth.phq9}/27</span>
                    </div>
                    <div>
                      <span className="text-[9px] text-slate-500 block">GAD-7</span>
                      <span className="text-xs font-bold text-brand-cyan">{groundTruth.gad7}/21</span>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-white/5 space-y-3">
                <div className="flex gap-2 text-[10px] text-slate-400">
                  <Info className="w-3.5 h-3.5 shrink-0 text-brand-cyan mt-0.5" />
                  <span>The Patient Health Questionnaire (PHQ-9) and Generalized Anxiety Disorder Assessment (GAD-7) are clinically validated instruments used worldwide.</span>
                </div>
              </div>

              <button
                onClick={handleClinicalSubmit}
                disabled={!allClinicalAnswered || isSubmitting}
                className="w-full py-2.5 px-4 glass-btn text-xs font-semibold flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Submit Validation <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </GlassCard>
          </div>

          {/* Clinical Questions List */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Ground Truth Correlation Comparison Scorecard */}
            {showComparison && (
              <GlassCard className="border border-blue-500/30 bg-blue-950/10 space-y-4 animate-in slide-in-from-top-6 duration-500">
                <div className="flex items-center gap-2 text-blue-300">
                  <BarChart2 className="w-5 h-5 text-brand-cyan" />
                  <h3 className="text-sm font-bold uppercase tracking-wider">XGBoost ML vs. Ground Truth Calibration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Anxiety comparison */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Anxiety Correlation Check</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-300">Model predicted: <span className="font-semibold text-slate-100">{Math.round(modelAnxiety)}%</span></span>
                      <span className="text-xs text-slate-300">GAD-7 validated: <span className="font-semibold text-slate-100">{Math.round(normalizedGad)}%</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] mt-1">
                      {isDivergingAnxiety ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-orange-300 font-medium">Significant divergence (Diff: {Math.round(anxietyDiff)}%). Model calibration required.</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-300 font-medium">Within validation tolerance (Diff: {Math.round(anxietyDiff)}%). Model aligned.</span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Depression/Burnout comparison */}
                  <div className="p-3 rounded-xl bg-black/40 border border-white/5 space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Depression & Burnout Correlation</span>
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-slate-300">Model predicted: <span className="font-semibold text-slate-100">{Math.round(modelBurnout)}%</span></span>
                      <span className="text-xs text-slate-300">PHQ-9 validated: <span className="font-semibold text-slate-100">{Math.round(normalizedPhq)}%</span></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] mt-1">
                      {isDivergingDepression ? (
                        <>
                          <AlertCircle className="w-3.5 h-3.5 text-orange-400" />
                          <span className="text-orange-300 font-medium">Significant divergence (Diff: {Math.round(depressionDiff)}%). Model calibration required.</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5 text-green-400" />
                          <span className="text-green-300 font-medium">Within validation tolerance (Diff: {Math.round(depressionDiff)}%). Model aligned.</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="text-[10px] text-slate-400 flex items-start gap-1.5 bg-white/2 p-2.5 rounded-lg">
                  <RefreshCw className="w-3.5 h-3.5 text-brand-cyan shrink-0 mt-0.5" />
                  <span>
                    <strong>Telemetry Calibration Alert</strong>: Since models are currently trained on synthetic data, pilot validation telemetry helps calculate model drift. Divergence informs local weights adjustment during next retraining session.
                  </span>
                </div>
              </GlassCard>
            )}

            {/* GAD-7 Group */}
            <div className="space-y-4">
              <div className="border-b border-white/10 pb-2">
                <h2 className="text-base font-bold text-slate-200">GAD-7 (Generalized Anxiety Assessment)</h2>
                <span className="text-[10px] text-slate-500">Over the last 2 weeks, how often have you been bothered by the following problems?</span>
              </div>
              
              {GAD7_QUESTIONS.map((q, idx) => (
                <GlassCard key={`gad-${idx}`} className={`transition-all duration-300 ${gadAnswers[idx] !== undefined ? 'bg-brand-cyan/2 border-brand-cyan/20' : 'border-white/5'}`}>
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-200 leading-relaxed block">{idx + 1}. {q}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CLINICAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setGadAnswers(prev => ({ ...prev, [idx]: opt.value }))}
                          className={`py-2 px-3 rounded-lg text-xs transition-all border cursor-pointer ${
                            gadAnswers[idx] === opt.value
                              ? 'bg-slate-800 border-brand-cyan text-brand-cyan font-bold'
                              : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                          }`}
                        >
                          {opt.label} (+{opt.value})
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>

            {/* PHQ-9 Group */}
            <div className="space-y-4 pt-4">
              <div className="border-b border-white/10 pb-2">
                <h2 className="text-base font-bold text-slate-200">PHQ-9 (Patient Health Questionnaire)</h2>
                <span className="text-[10px] text-slate-500">Over the last 2 weeks, how often have you been bothered by the following problems?</span>
              </div>
              
              {PHQ9_QUESTIONS.map((q, idx) => (
                <GlassCard key={`phq-${idx}`} className={`transition-all duration-300 ${phqAnswers[idx] !== undefined ? 'bg-brand-purple/2 border-brand-purple/20' : 'border-white/5'}`}>
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-slate-200 leading-relaxed block">{idx + 1}. {q}</span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {CLINICAL_OPTIONS.map((opt) => (
                        <button
                          key={opt.value}
                          onClick={() => setPhqAnswers(prev => ({ ...prev, [idx]: opt.value }))}
                          className={`py-2 px-3 rounded-lg text-xs transition-all border cursor-pointer ${
                            phqAnswers[idx] === opt.value
                              ? 'bg-slate-800 border-brand-purple text-brand-purple font-bold'
                              : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5 hover:text-slate-300'
                          }`}
                        >
                          {opt.label} (+{opt.value})
                        </button>
                      ))}
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
