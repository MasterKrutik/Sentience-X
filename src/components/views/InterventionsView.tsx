import React from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { crisisResources } from '../../config/crisisResources';
import { 
  ShieldAlert, PhoneCall, Heart, Info, BookOpen, 
  MapPin, CheckCircle2, AlertTriangle, ArrowRight, Compass
} from 'lucide-react';

interface InterventionItem {
  title: string;
  desc: string;
  category: 'mental' | 'physical' | 'social' | 'professional';
}

export function InterventionsView() {
  const { predictions, signals, language } = useWellnessStore();
  const t = translations[language].app;
  const score = Math.round(predictions.overall_wellness);

  // 1. Determine Tier based on score
  let currentTier: 'excellent' | 'mild' | 'moderate' | 'high' = 'excellent';
  let tierColor = 'text-green-400';
  let tierBg = 'border-green-500/20 bg-green-950/5';
  let tierTitle = 'Tier I: Excellent Wellness';
  let tierDescription = 'Maintain your optimal cognitive and emotional performance with daily growth challenges.';

  if (score < 50) {
    currentTier = 'high';
    tierColor = 'text-red-400';
    tierBg = 'border-red-500/30 bg-red-950/10 shadow-[0_0_20px_rgba(239,68,68,0.1)]';
    tierTitle = 'Tier IV: High Severity Risk';
    tierDescription = 'Critical behavioral drifts detected. Immediate focus should be on clinical support pathways and safety.';
  } else if (score < 70) {
    currentTier = 'moderate';
    tierColor = 'text-amber-400';
    tierBg = 'border-amber-500/20 bg-amber-950/5';
    tierTitle = 'Tier III: Moderate Risk';
    tierDescription = 'Noticeable behavioral deviations. Structured self-recovery and cognitive tools are advised.';
  } else if (score < 80) {
    currentTier = 'mild';
    tierColor = 'text-yellow-400';
    tierBg = 'border-yellow-500/20 bg-yellow-950/5';
    tierTitle = 'Tier II: Mild Decline';
    tierDescription = 'Minor cognitive overload. Focus on active resets, sleep alignment, and social contact.';
  }

  // 2. Tiers recommendations mapping
  const recommendationsMap: Record<typeof currentTier, InterventionItem[]> = {
    excellent: [
      { title: "Cognitive Skill Challenge", desc: "Initiate learning a complex new subject or puzzle to stimulate neuroplasticity.", category: "professional" },
      { title: "Structured Gratitude Log", desc: "Write down 3 highly specific interactions that brought fulfillment today.", category: "mental" },
      { title: "Sleep Schedule Locking", desc: "Lock your bedtime within a 15-minute window to stabilize circadian rhythm.", category: "physical" },
      { title: "Daily Physical Expansion", desc: "Perform a high-intensity cardio or resistance workout for endorphin release.", category: "physical" },
      { title: "Mindfulness Space", desc: "Practice 15 minutes of silent vipassana meditation to ground awareness.", category: "mental" }
    ],
    mild: [
      { title: "Breathing Walk", desc: "Take a 15-minute stroll outside focusing on matching footsteps with inhalations.", category: "physical" },
      { title: "4-7-8 Breathing Reset", desc: "Inhale for 4 seconds, hold for 7, exhale for 8. Repeat 4 times to downregulate.", category: "mental" },
      { title: "Bilateral Sound Therapy", desc: "Listen to 8D audio or calming classical music to reduce hemispheric cognitive load.", category: "mental" },
      { title: "Social Recovery Text", desc: "Reach out to a trusted contact. Express a genuine check-in message.", category: "social" },
      { title: "Hydration Intake Lock", desc: "Set reminders to drink 3 liters of water to optimize fluid balance.", category: "physical" }
    ],
    moderate: [
      { title: "CBT Thought Record", desc: "Identify automatic negative thoughts and challenge them with objective evidence.", category: "mental" },
      { title: "Guided Body Scan", desc: "Perform a 10-minute guided muscle relaxation sequence to dissolve somatic stress.", category: "physical" },
      { title: "Structured Journaling", desc: "Dumb-dump your thoughts on paper for 10 minutes, then shred or save it.", category: "mental" },
      { title: "Offline Sleep Chamber", desc: "Store all screens outside the bedroom and shut down electronics 1 hour before sleep.", category: "physical" },
      { title: "Self-Reflection Space", desc: "Dedicate 10 minutes to writing a self-compassionate review of your challenges.", category: "mental" }
    ],
    high: [
      { title: "Peer Support Session", desc: "Schedule a conversation with a trained empathetic volunteer in a safe community space.", category: "social" },
      { title: "CBT Grounding Exercises", desc: "Employ the 5-4-3-2-1 sensory awareness technique to manage acute anxiety spikes.", category: "mental" },
      { title: "Designated Emergency Outreach", desc: "Contact a family member, close companion, or therapist to alert them of your stress.", category: "social" },
      { title: "Professional Counselor Review", desc: "Access the local clinical directory to schedule a diagnostic consult.", category: "professional" },
      { title: "NIMHANS Crisis Intake", desc: "Call the free government mental health helpline (1800-891-4416) for support.", category: "professional" }
    ]
  };

  const activeRecommendations = recommendationsMap[currentTier];

  // 3. Compose a dynamic one-line explanation why a specific card is recommended
  const getWhyExplanation = (item: InterventionItem) => {
    // Return explanations tied directly to the user's telemetry indicators
    if (signals.screen_time > 7 && (item.category === 'mental' || item.title.includes('Sleep') || item.title.includes('Offline'))) {
      return `Recommended because screen exposure (${signals.screen_time}h) is elevating your predicted cognitive fatigue.`;
    }
    if (signals.sleep_duration < 6.5 && (item.title.includes('Sleep') || item.title.includes('Breathing') || item.title.includes('Body Scan'))) {
      return `Triggered by sleep duration dropping to ${signals.sleep_duration}h, restricting neural recovery.`;
    }
    if (signals.typing_latency > 130 && (item.title.includes('Breathing') || item.title.includes('CBT') || item.title.includes('Sound'))) {
      return `Recommended because key latency (${signals.typing_latency}ms) indicates moderate executive attention strain.`;
    }
    if (signals.typing_errors > 4 && (item.title.includes('Skill') || item.title.includes('Journal') || item.title.includes('Grounding'))) {
      return `Triggered because today's typing error count (${signals.typing_errors}) suggests elevated cognitive fatigue.`;
    }
    if (signals.steps < 6000 && (item.category === 'physical' || item.title.includes('Walk') || item.title.includes('Cardio'))) {
      return `Recommended because your physical steps (${signals.steps.toLocaleString()}) are below the active metabolic baseline.`;
    }
    if (signals.social_quality < 3 && (item.category === 'social' || item.title.includes('Social') || item.title.includes('Peer'))) {
      return `Suggested because social interaction quality registered at ${signals.social_quality}/5, showing isolation risk.`;
    }
    
    // Default baseline rules
    return `Recommended by the XGBoost engine based on your current Overall Wellness score of ${score}/100.`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
          <ShieldAlert className="w-7 h-7 text-brand-cyan" />
          {t.interventionsHeader}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Intelligent Intervention Engine. Evaluates your current score tier and prescribes actionable recovery procedures.
        </p>
      </div>

      {/* Emergency Crisis Resources Box - Prominently Displayed */}
      <GlassCard className={`border p-6 relative overflow-hidden ${
        score < 50 
          ? 'border-red-500/40 bg-gradient-to-br from-red-950/20 to-transparent animate-pulse-glow shadow-[0_0_20px_rgba(239,68,68,0.15)]' 
          : 'border-red-500/20 bg-slate-950/20'
      }`}>
        <div className="flex flex-col md:flex-row gap-5 items-start">
          <div className={`p-3 rounded-2xl border shrink-0 ${
            score < 50 
              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
              : 'bg-white/5 border-white/10 text-slate-400'
          }`}>
            <PhoneCall className={`w-6 h-6 ${score < 50 ? 'animate-bounce' : ''}`} />
          </div>
          
          <div className="space-y-2 w-full">
            <h2 className={`text-base font-bold flex items-center gap-2 ${
              score < 50 ? 'text-red-200' : 'text-slate-200'
            }`}>
              {score < 50 
                ? 'CRITICAL ASSISTANCE RESOURCES: YOU ARE NOT ALONE' 
                : 'CRISIS SUPPORT & EMERGENCY DIRECTORY'}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {score < 50 
                ? 'Your Mental Twin indicates severe distress levels. If you are experiencing thoughts of self-harm, severe anxiety, or overwhelm, please reach out to these confidential, free mental health helplines in India immediately:'
                : 'If you or someone you know is experiencing acute distress, self-harm thoughts, or severe emotional overload, professional support is available. Reach out to these free, confidential crisis services in India:'}
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-2">
              {crisisResources.map((resource) => (
                <div key={resource.name} className="p-3 rounded-xl bg-black/40 border border-red-500/20 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                      {resource.name}
                    </span>
                    <span className="text-sm font-extrabold text-slate-100 block mt-1">
                      {resource.number}
                    </span>
                  </div>
                  <span className="text-[9px] text-red-400 font-medium mt-2">
                    {resource.source} · {resource.hours}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Tier Overview Header Card */}
      <GlassCard className={`border ${tierBg}`}>
        <div className="flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <span className={`text-xs font-bold uppercase tracking-widest ${tierColor}`}>
              Active Classification
            </span>
            <h2 className="text-lg font-bold text-slate-100 mt-1">{tierTitle}</h2>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">{tierDescription}</p>
          </div>
          
          <div className="px-4 py-2 rounded-2xl bg-black/40 border border-white/5 text-center self-start">
            <span className="text-[9px] text-slate-400 uppercase block">Active Score</span>
            <span className={`text-2xl font-extrabold tracking-tight ${tierColor}`}>{score}<span className="text-xs font-normal text-slate-500">/100</span></span>
          </div>
        </div>
      </GlassCard>

      {/* Recommendations Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold tracking-widest text-slate-400 uppercase flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5" />
          Recommended Recovery Interventions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeRecommendations.map((item, idx) => {
            return (
              <GlassCard 
                key={idx}
                className="flex flex-col justify-between border-white/5 hover:border-brand-purple/20 transition-all p-5 hover:translate-y-[-2px] group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-brand-purple/10 text-brand-cyan border border-brand-purple/20">
                      {item.category}
                    </span>
                    <Compass className="w-4 h-4 text-slate-500 group-hover:text-brand-cyan transition-colors" />
                  </div>
                  
                  <h4 className="text-sm font-bold text-slate-200 mt-3 group-hover:text-slate-100 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
                
                {/* Explainable Why block */}
                <div className="mt-4 pt-3 border-t border-white/5 flex items-start gap-2 text-[10px] text-brand-cyan bg-brand-cyan/2 p-2 rounded-lg border border-brand-cyan/5">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span className="italic leading-normal">{getWhyExplanation(item)}</span>
                </div>
              </GlassCard>
            );
          })}
        </div>
      </div>

    </div>
  );
}
