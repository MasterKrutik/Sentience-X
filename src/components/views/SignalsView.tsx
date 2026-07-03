import React, { useState, useEffect, useRef } from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { 
  Activity, Keyboard, Info, CheckCircle2, RefreshCw, 
  Smartphone, Moon, Flame, Users, ChevronRight, BarChart
} from 'lucide-react';

const TYPING_PARAGRAPHS = [
  "The human mind seeks balance amidst the noise of a digital landscape. By tracking behavioral features, we can understand cognitive states, restore mental wellness, and cultivate peace.",
  "Deep breathing exercises regulate autonomic nervous systems. Focus on the slow expansion of the lungs, and allow your mental clutter to settle. Stability is built in quiet intervals.",
  "Technology serves as a tool, not a sovereign. Setting structural boundaries on screen notifications creates cognitive capacity, lowers daily anxiety levels, and restores sleep cycles."
];

export function SignalsView() {
  const { 
    signals, 
    updateSignal, 
    submitSignals, 
    language, 
    signalsSubmittedToday,
    predictions
  } = useWellnessStore();

  const t = translations[language].app;
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Typing Test States
  const [paragraph, setParagraph] = useState(TYPING_PARAGRAPHS[0]);
  const [typedText, setTypedText] = useState('');
  const [isTestStarted, setIsTestStarted] = useState(false);
  const [isTestComplete, setIsTestComplete] = useState(false);
  const [liveWpm, setLiveWpm] = useState(0);
  const [liveAccuracy, setLiveAccuracy] = useState(100);
  const [liveLatency, setLiveLatency] = useState(0); // in ms
  const [liveErrors, setLiveErrors] = useState(0);

  const startTimeRef = useRef<number | null>(null);
  const lastKeyTimeRef = useRef<number | null>(null);
  const latencySumRef = useRef<number>(0);
  const latencyCountRef = useRef<number>(0);
  const textInputRef = useRef<HTMLTextAreaElement>(null);

  // Manual Input States (initialized from store)
  const [sleepDur, setSleepDur] = useState(signals.sleep_duration);
  const [sleepQual, setSleepQual] = useState(signals.sleep_quality);
  const [stepsCount, setStepsCount] = useState(signals.steps);
  const [screenHrs, setScreenHrs] = useState(signals.screen_time);
  const [socialMins, setSocialMins] = useState(signals.social_minutes);
  const [socialQual, setSocialQual] = useState(signals.social_quality);

  const resetTest = () => {
    const randomIdx = Math.floor(Math.random() * TYPING_PARAGRAPHS.length);
    setParagraph(TYPING_PARAGRAPHS[randomIdx]);
    setTypedText('');
    setIsTestStarted(false);
    setIsTestComplete(false);
    setLiveWpm(0);
    setLiveAccuracy(100);
    setLiveLatency(0);
    setLiveErrors(0);
    startTimeRef.current = null;
    lastKeyTimeRef.current = null;
    latencySumRef.current = 0;
    latencyCountRef.current = 0;
    if (textInputRef.current) textInputRef.current.value = '';
  };

  const handleTypingChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    
    // Safety check if typing past target
    if (value.length > paragraph.length) return;
    setTypedText(value);

    const now = performance.now();

    // 1. Initialize timers on first key
    if (!isTestStarted && value.length === 1) {
      setIsTestStarted(true);
      startTimeRef.current = now;
      lastKeyTimeRef.current = now;
      return;
    }

    if (startTimeRef.current === null || lastKeyTimeRef.current === null) return;

    // 2. Measure Key-to-Key Latency
    const currentLatency = now - lastKeyTimeRef.current;
    lastKeyTimeRef.current = now;
    
    // Filter out long pauses (e.g. > 1.5 seconds) to avoid distorting telemetry
    if (currentLatency < 1500) {
      latencySumRef.current += currentLatency;
      latencyCountRef.current += 1;
      const avgLatency = Math.round(latencySumRef.current / latencyCountRef.current);
      setLiveLatency(avgLatency);
    }

    // 3. Compute live Errors & Accuracy
    let errors = 0;
    for (let i = 0; i < value.length; i++) {
      if (value[i] !== paragraph[i]) {
        errors++;
      }
    }
    setLiveErrors(errors);
    const accuracy = Math.round(((value.length - errors) / (value.length || 1)) * 100);
    setLiveAccuracy(accuracy);

    // 4. Compute live WPM
    const elapsedMinutes = (now - startTimeRef.current) / 60000;
    const wordCount = value.length / 5;
    const wpm = Math.round(wordCount / (elapsedMinutes || 0.001));
    setLiveWpm(Math.min(wpm, 150)); // Clamp max WPM for sanity

    // 5. Test Completion
    if (value.length === paragraph.length) {
      setIsTestComplete(true);
      setIsTestStarted(false);
      
      // Update store state with typing telemetry
      updateSignal('typing_speed', wpm);
      updateSignal('typing_accuracy', accuracy);
      updateSignal('typing_latency', Math.round(latencySumRef.current / (latencyCountRef.current || 1)));
      updateSignal('typing_errors', errors);
    }
  };

  // Submit Manual Form
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Update store state with current inputs
    updateSignal('sleep_duration', sleepDur);
    updateSignal('sleep_quality', sleepQual);
    updateSignal('steps', stepsCount);
    updateSignal('screen_time', screenHrs);
    updateSignal('social_minutes', socialMins);
    updateSignal('social_quality', socialQual);

    setTimeout(async () => {
      await submitSignals();
      setIsSubmitting(false);
      setSuccess(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
      setTimeout(() => setSuccess(false), 4000);
    }, 1200);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
          <Activity className="w-7 h-7 text-brand-cyan" />
          {translations[language].nav.signals}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Behavioral signals engine. Complete the cognitive typing test and log daily activities to feeds the mental metrics twin.
        </p>
      </div>

      {/* Success Banner */}
      {success && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/20 text-green-300 text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
          <div>
            <span className="font-semibold block">Behavioral Signals Refreshed</span>
            Telemetry vectors successfully compiled. The XGBoost models recalculated your Overall Wellness Index to <span className="font-bold text-slate-100">{Math.round(predictions.overall_wellness)}/100</span>.
          </div>
        </div>
      )}

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: Interactive Typing Test */}
        <div className="lg:col-span-3 space-y-6">
          
          <GlassCard className="relative overflow-hidden">
            <div className="absolute top-3 right-3 p-1 rounded bg-white/5 border border-white/10 text-slate-400">
              <Keyboard className="w-4 h-4 text-brand-cyan" />
            </div>
            
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-2">
              {t.typingTest}
            </h3>
            
            <p className="text-xs text-slate-400 mb-4">
              {t.startTyping}
            </p>

            {/* Paragraph block */}
            <div className="p-4 rounded-xl bg-black/40 border border-white/5 font-mono text-sm leading-relaxed mb-4 select-none relative">
              {/* Highlight typed characters */}
              <span className="text-brand-cyan">
                {paragraph.slice(0, typedText.length)}
              </span>
              <span className="bg-brand-purple/40 text-slate-100">
                {typedText.length < paragraph.length ? paragraph[typedText.length] : ''}
              </span>
              <span className="text-slate-500">
                {paragraph.slice(typedText.length + 1)}
              </span>
            </div>

            {/* User Input Area */}
            <textarea
              ref={textInputRef}
              rows={3}
              value={typedText}
              onChange={handleTypingChange}
              disabled={isTestComplete}
              className="w-full glass-input p-3 font-mono text-sm focus:ring-1 focus:ring-brand-purple leading-relaxed resize-none"
              placeholder="Start typing here..."
            />

            {/* Live Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/5 text-center">
              
              <div className="p-2 rounded-lg bg-white/2 border border-white/5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">WPM Speed</span>
                <span className="text-lg font-bold tabular-nums text-slate-200">
                  {isTestComplete ? signals.typing_speed : liveWpm}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white/2 border border-white/5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Accuracy</span>
                <span className="text-lg font-bold tabular-nums text-slate-200">
                  {isTestComplete ? signals.typing_accuracy : liveAccuracy}%
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white/2 border border-white/5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Latency (ms)</span>
                <span className="text-lg font-bold tabular-nums text-slate-200">
                  {isTestComplete ? signals.typing_latency : liveLatency}
                </span>
              </div>

              <div className="p-2 rounded-lg bg-white/2 border border-white/5">
                <span className="text-[9px] text-slate-400 uppercase tracking-wider block">Errors</span>
                <span className={`text-lg font-bold tabular-nums ${liveErrors > 0 ? 'text-red-400' : 'text-slate-200'}`}>
                  {isTestComplete ? signals.typing_errors : liveErrors}
                </span>
              </div>

            </div>

            {/* Completion indicator / Reset button */}
            {isTestComplete && (
              <div className="mt-4 p-3 rounded-xl bg-green-500/10 border border-green-500/20 text-xs flex justify-between items-center text-green-300">
                <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-green-400" /> Test completed. Telemetry uploaded.</span>
                <button 
                  onClick={resetTest}
                  className="flex items-center gap-1 hover:underline text-[10px] uppercase font-bold text-slate-300 cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Retake Test
                </button>
              </div>
            )}
          </GlassCard>

          <GlassCard className="flex items-start gap-3 bg-slate-950/20 border-white/5">
            <Info className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
            <div className="text-xs text-slate-400 space-y-1">
              <span className="font-semibold text-slate-300 block">How Typing Latency reflects Cognitive Fatigue:</span>
              <p>Key-to-key latency measures typing rhythm. High variability or sudden micro-delays between characters directly capture micro-attentional slips, sleep deprivation, and central stress levels. These are evaluated by the XGBoost engine.</p>
            </div>
          </GlassCard>

        </div>

        {/* Right Side: Manual Telemetry Entry */}
        <div className="lg:col-span-2">
          <GlassCard>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-brand-cyan" />
              Log Daily Activities
            </h3>
            
            <form onSubmit={handleFormSubmit} className="space-y-4">
              
              {/* Sleep Duration Slider */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Sleep Duration</span>
                  <span className="font-semibold text-slate-200">{sleepDur} hrs</span>
                </label>
                <input
                  type="range"
                  min="4"
                  max="11"
                  step="0.1"
                  value={sleepDur}
                  onChange={(e) => setSleepDur(parseFloat(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>

              {/* Sleep Quality Slider */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Sleep Quality</span>
                  <span className="font-semibold text-slate-200">{sleepQual}%</span>
                </label>
                <input
                  type="range"
                  min="30"
                  max="100"
                  value={sleepQual}
                  onChange={(e) => setSleepQual(parseInt(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>

              {/* Steps Input */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Daily Physical Steps</span>
                  <span className="font-semibold text-slate-200">{stepsCount.toLocaleString()} steps</span>
                </label>
                <input
                  type="range"
                  min="1000"
                  max="22000"
                  step="100"
                  value={stepsCount}
                  onChange={(e) => setStepsCount(parseInt(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>

              {/* Screen Time Slider */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Screen Usage</span>
                  <span className="font-semibold text-slate-200">{screenHrs} hrs</span>
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="14"
                  step="0.1"
                  value={screenHrs}
                  onChange={(e) => setScreenHrs(parseFloat(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>

              {/* Social Minutes Slider */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 flex justify-between">
                  <span>Social Contact Duration</span>
                  <span className="font-semibold text-slate-200">{socialMins} mins</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="360"
                  step="5"
                  value={socialMins}
                  onChange={(e) => setSocialMins(parseInt(e.target.value))}
                  className="w-full accent-brand-purple"
                />
              </div>

              {/* Social Quality Select */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400 block">
                  Social Interaction Quality
                </label>
                <select
                  value={socialQual}
                  onChange={(e) => setSocialQual(parseInt(e.target.value))}
                  className="w-full glass-input px-3 py-2 text-xs"
                >
                  <option value="1" className="bg-slate-900">1 - Very Isolated / Negative</option>
                  <option value="2" className="bg-slate-900">2 - Low quality / Exhausting</option>
                  <option value="3" className="bg-slate-900">3 - Neutral / Casual</option>
                  <option value="4" className="bg-slate-900">4 - Good / Supportive</option>
                  <option value="5" className="bg-slate-900">5 - High quality / Uplifting</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || signalsSubmittedToday}
                className={`w-full mt-6 py-2.5 px-4 glass-btn text-xs font-semibold flex items-center justify-center gap-2 ${
                  signalsSubmittedToday ? 'opacity-60 bg-green-500/20 text-green-300 border-green-500/20 hover:scale-100 hover:shadow-none' : ''
                }`}
              >
                {isSubmitting ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : signalsSubmittedToday ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" /> Signals Saved Today
                  </>
                ) : (
                  <>
                    Save Telemetry Signals <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </button>

            </form>
          </GlassCard>
        </div>

      </div>
    </div>
  );
}
