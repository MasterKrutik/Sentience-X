"use client";
import { useState, useRef } from "react";
import { useVoiceAnalysis } from "@/lib/api/hooks";
import { useTranslations } from "next-intl";
import { Play, Square, Mic, Volume2 } from "lucide-react";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip } from "recharts";

export default function VoiceRadar() {
  const { data, isLoading } = useVoiceAnalysis();
  const t = useTranslations("voice");
  const [isPlaying, setIsPlaying] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);

  if (isLoading || !data) {
    return (
      <div className="h-60 flex items-center justify-center glass rounded-2xl">
        <span className="text-xs text-zinc-500 font-mono">Loading Voice Prosody Matrix...</span>
      </div>
    );
  }

  const startSynth = () => {
    try {
      // Web Audio API Synthesis for voice playback mockup
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      audioCtxRef.current = ctx;

      // Create oscillator that generates hum
      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      // Slightly lower frequency to mimic pitch-shifted anonymous voice
      osc.frequency.setValueAtTime(140, ctx.currentTime); 
      
      // Pitch modulation to mimic voice cadence
      const interval = setInterval(() => {
        if (ctx.state === "closed") {
          clearInterval(interval);
          return;
        }
        const nextFreq = 120 + Math.random() * 60;
        osc.frequency.setValueAtTime(nextFreq, ctx.currentTime + 0.1);
      }, 200);

      gainNode.gain.setValueAtTime(0.08, ctx.currentTime);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);
      osc.start();
      oscRef.current = osc;
      setIsPlaying(true);

      // Auto-stop after 5s for safety/demo purposes
      setTimeout(() => {
        stopSynth();
      }, 5000);
    } catch (e) {
      console.error(e);
    }
  };

  const stopSynth = () => {
    if (audioCtxRef.current) {
      audioCtxRef.current.close();
    }
    setIsPlaying(false);
  };

  const handlePlayToggle = () => {
    if (isPlaying) {
      stopSynth();
    } else {
      startSynth();
    }
  };

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-6 h-full justify-between">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-display font-extrabold text-lg text-white">
            {t("title")}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Pipeline: wav2vec2 → ECAPA-TDNN → HuBERT → Fusion
          </p>
        </div>
        <span className="p-1 rounded bg-teal-500/10 border border-teal-500/20 text-teal-400">
          <Mic size={16} />
        </span>
      </div>

      {/* Main Grid Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left: Radar Chart */}
        <div className="h-56 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart cx="50%" cy="50%" outerRadius="75%" data={data.metrics}>
              <PolarGrid stroke="var(--sx-border)" />
              <PolarAngleAxis dataKey="name" tick={{ fill: "#9ca3af", fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "#4b5563" }} />
              <Radar
                name="Voice Signature"
                dataKey="value"
                stroke="oklch(72% 0.19 200)"
                fill="oklch(72% 0.19 200)"
                fillOpacity={0.25}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Right: Pitch-shifted player & mini 7-day voice trend */}
        <div className="flex flex-col gap-4">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-300">Voice Record (Anonymized)</span>
              <span className="text-[10px] font-mono text-zinc-500">{data.lastAnalyzed}</span>
            </div>
            
            <p className="text-[10px] text-zinc-500 leading-normal">
              {t("anonymized")}
            </p>

            <button
              onClick={handlePlayToggle}
              className={`w-full py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                isPlaying 
                  ? "bg-red-600 hover:bg-red-500 text-white" 
                  : "bg-teal-600 hover:bg-teal-500 text-white"
              }`}
            >
              {isPlaying ? (
                <>
                  <Square size={14} fill="white" /> Stop Demo Synthesis
                </>
              ) : (
                <>
                  <Play size={14} fill="white" /> {t("playRecording")}
                </>
              )}
            </button>
          </div>

          {/* 7-Day Mini Trend Chart */}
          <div className="h-24 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.trend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="day" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis domain={[0.4, 1.0]} tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "oklch(18% 0.02 270)",
                    borderColor: "oklch(25% 0.025 270)",
                    fontSize: "10px",
                    color: "#fff",
                  }}
                />
                <Line type="monotone" dataKey="score" stroke="oklch(72% 0.19 200)" strokeWidth={1.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
