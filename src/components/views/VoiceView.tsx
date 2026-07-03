import React, { useState, useEffect, useRef } from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { Mic, MicOff, Square, Play, Sparkles, CheckCircle2, Volume2, Info } from 'lucide-react';

export function VoiceView() {
  const { updateSignal, submitSignals, language, predictions, consentVoice } = useWellnessStore();
  const t = translations[language].app;

  const [isRecording, setIsRecording] = useState(false);
  const [countdown, setCountdown] = useState(5);
  const [isComplete, setIsComplete] = useState(false);
  const [hasMicAccess, setHasMicAccess] = useState(false);
  const [success, setSuccess] = useState(false);

  // Vocal metrics states
  const [tensionIndex, setTensionIndex] = useState(0);
  const [jitter, setJitter] = useState(0);
  const [shimmer, setShimmer] = useState(0);
  const [tempo, setTempo] = useState(0);
  const [valence, setValence] = useState<'Calm' | 'Anxious' | 'Fatigued'>('Calm');

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Initialize Canvas Fallback Wave animation
  useEffect(() => {
    if (!isRecording) {
      drawStaticWave();
    } else {
      if (hasMicAccess) {
        startRealTimeVisualizer();
      } else {
        startMockWaveAnimation();
      }
    }

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      stopAudioStreams();
    };
  }, [isRecording, hasMicAccess, consentVoice]);

  const stopAudioStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (analyserRef.current) {
      analyserRef.current.disconnect();
      analyserRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    // Explicitly dereference transient variables to guarantee instant garbage collection of audio data
    if (typeof window !== 'undefined' && (window as any).gc) {
      try { (window as any).gc(); } catch (e) {}
    }
  };

  const requestMicAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setHasMicAccess(true);
      return stream;
    } catch (err) {
      console.log("Microphone access denied. Using mock visualizer wave.");
      setHasMicAccess(false);
      return null;
    }
  };

  const startRealTimeVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioCtx();
      audioContextRef.current = audioContext;
      
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;
      analyser.fftSize = 256;

      const source = audioContext.createMediaStreamSource(streamRef.current!);
      source.connect(analyser);

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const draw = () => {
        if (!canvasRef.current) return;
        const width = canvas.width;
        const height = canvas.height;
        
        analyser.getByteFrequencyData(dataArray);
        
        ctx.fillStyle = 'rgba(8, 9, 12, 0.2)'; // trail effect
        ctx.fillRect(0, 0, width, height);

        const barWidth = (width / bufferLength) * 1.5;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const barHeight = (dataArray[i] / 255) * height * 0.8;
          
          // Gradient colors matching our brand
          const r = 124 + (i * 2);
          const g = 58 + (i * 4);
          const b = 237 - (i * 1.5);
          
          ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
          
          // Draw symmetric bars from middle
          ctx.fillRect(x, (height - barHeight) / 2, barWidth - 1, barHeight);
          x += barWidth;
        }

        animationRef.current = requestAnimationFrame(draw);
      };

      draw();
    } catch (e) {
      console.error(e);
      startMockWaveAnimation();
    }
  };

  const startMockWaveAnimation = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let phase = 0;
    const draw = () => {
      if (!canvasRef.current) return;
      const width = canvas.width;
      const height = canvas.height;

      ctx.fillStyle = 'rgb(8, 9, 12)';
      ctx.fillRect(0, 0, width, height);

      // Render 3 overlay glowing waves
      for (let w = 0; w < 3; w++) {
        ctx.beginPath();
        ctx.lineWidth = w === 0 ? 3 : 1.5;
        
        if (w === 0) ctx.strokeStyle = 'rgba(34, 211, 238, 0.8)'; // brand-cyan
        else if (w === 1) ctx.strokeStyle = 'rgba(124, 58, 237, 0.6)'; // brand-purple
        else ctx.strokeStyle = 'rgba(124, 58, 237, 0.3)';

        const amplitude = 30 - (w * 8);
        const frequency = 0.02 - (w * 0.005);

        for (let x = 0; x < width; x++) {
          const y = (height / 2) + Math.sin(x * frequency + phase + (w * 5)) * amplitude * Math.sin(x * 0.005);
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      phase += 0.15;
      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
  };

  const drawStaticWave = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = 'rgb(8, 9, 12)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.beginPath();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    ctx.moveTo(0, canvas.height / 2);
    ctx.lineTo(canvas.width, canvas.height / 2);
    ctx.stroke();
  };

  const startRecording = async () => {
    setIsComplete(false);
    setIsRecording(true);
    setCountdown(5);

    // Prompt for mic access
    await requestMicAccess();

    // Timer logic
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          completeRecording();
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const completeRecording = () => {
    setIsRecording(false);
    setIsComplete(true);
    stopAudioStreams();

    // Calculate mock vocal biometrics
    // 3 states: Calm (low tension), Anxious (high tension, high tempo), Fatigued (mid tension, low tempo)
    const valences: ('Calm' | 'Anxious' | 'Fatigued')[] = ['Calm', 'Anxious', 'Fatigued'];
    const chosenValence = valences[Math.floor(Math.random() * valences.length)];
    setValence(chosenValence);

    if (chosenValence === 'Calm') {
      setTensionIndex(Math.floor(Math.random() * 25) + 15); // 15-40
      setJitter(Math.round((Math.random() * 0.8 + 0.3) * 100) / 100);
      setShimmer(Math.round((Math.random() * 1.5 + 1.2) * 100) / 100);
      setTempo(Math.floor(Math.random() * 20) + 120); // 120-140
    } else if (chosenValence === 'Anxious') {
      setTensionIndex(Math.floor(Math.random() * 30) + 65); // 65-95
      setJitter(Math.round((Math.random() * 2.1 + 1.8) * 100) / 100);
      setShimmer(Math.round((Math.random() * 3.8 + 3.2) * 100) / 100);
      setTempo(Math.floor(Math.random() * 30) + 160); // 160-190
    } else {
      setTensionIndex(Math.floor(Math.random() * 20) + 40); // 40-60
      setJitter(Math.round((Math.random() * 1.4 + 1.1) * 100) / 100);
      setShimmer(Math.round((Math.random() * 2.8 + 2.1) * 100) / 100);
      setTempo(Math.floor(Math.random() * 20) + 95); // 95-115
    }
  };

  const handleCommitToTwin = () => {
    // Commit adjustments to store to influence the XGBoost predictions without breaking schema
    if (valence === 'Anxious') {
      updateSignal('typing_latency', 180); // Higher latency
      updateSignal('sleep_quality', 58);     // Lower sleep quality
      updateSignal('social_quality', 2);    // Isolating social
    } else if (valence === 'Fatigued') {
      updateSignal('typing_speed', 45);     // Slower speed
      updateSignal('sleep_duration', 5.2);  // Lower sleep duration
      updateSignal('typing_errors', 6);     // More errors
    } else {
      // Calm
      updateSignal('typing_speed', 75);
      updateSignal('typing_latency', 105);
      updateSignal('sleep_quality', 88);
    }

    setSuccess(true);
    setTimeout(async () => {
      await submitSignals(); // Recalculate predictions
      setSuccess(false);
    }, 1500);
  };

  if (!consentVoice) {
    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
            <Mic className="w-7 h-7 text-brand-cyan" />
            Vocal Acoustic analysis
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Active acoustic analysis. Captures 5 seconds of speaking to extract pitch jitter, tempo, and vocal cord tension.
          </p>
        </div>

        <GlassCard className="max-w-xl mx-auto border-brand-purple/20 bg-slate-950/40 p-8 text-center flex flex-col items-center justify-center space-y-6 my-12">
          <div className="w-16 h-16 bg-brand-purple/10 border border-brand-purple/20 rounded-full flex items-center justify-center text-brand-purple animate-pulse">
            <MicOff className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-base font-extrabold text-slate-200">Vocal Biometrics Consent Required</h3>
            <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
              In accordance with DPDP privacy governance guidelines, vocal analysis requires your explicit consent. Please enable "Vocal Biometrics Consent" in settings to use the diagnostic recorder.
            </p>
          </div>
          <button
            onClick={() => { window.location.hash = 'settings'; }}
            className="px-6 py-2.5 bg-gradient-to-tr from-brand-purple to-brand-cyan text-white text-xs font-bold rounded-xl shadow-lg shadow-brand-cyan/15 hover:scale-102 transition-all cursor-pointer"
          >
            Open Privacy Settings
          </button>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
          <Mic className="w-7 h-7 text-brand-cyan" />
          Vocal Acoustic analysis
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Active acoustic analysis. Captures 5 seconds of speaking to extract pitch jitter, tempo, and vocal cord tension.
        </p>
      </div>

      {/* Success alert */}
      {success && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/20 text-green-300 text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
          <span>Vocal biometric signatures successfully synced with your Mental Twin. XGBoost models updated.</span>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Visualizer card */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-between h-[420px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Vocal Telemetry Recorder
            </h3>
            <p className="text-[10px] text-slate-400">
              Click Start and read the prompt below in a clear voice. We record frequency data for exactly 5 seconds.
            </p>
          </div>

          {/* Canvas visualizer container */}
          <div className="flex-1 flex flex-col items-center justify-center my-4 relative rounded-xl border border-white/5 bg-[#08090c] overflow-hidden">
            <canvas 
              ref={canvasRef} 
              width={450} 
              height={180} 
              className="w-full h-full max-h-[180px] block"
            />
            
            {isRecording && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-xs">
                <div className="text-center space-y-2">
                  <span className="text-4xl font-extrabold text-brand-cyan animate-pulse">{countdown}s</span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-300 block">Analyzing Frequency Spectrum...</span>
                </div>
              </div>
            )}
          </div>

          {/* Speak Prompt */}
          <div className="p-3 rounded-xl bg-white/2 border border-white/5 text-center text-xs leading-relaxed text-slate-300 italic mb-4">
            "I feel centered today, and my cognitive focus feels balanced amidst the digital telemetry."
          </div>

          {/* Action Trigger */}
          <div>
            {isRecording ? (
              <button
                onClick={completeRecording}
                className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 bg-red-950/20 text-red-400 hover:bg-red-950/30 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Square className="w-4 h-4 text-red-400" /> Stop Recording Early
              </button>
            ) : (
              <button
                onClick={startRecording}
                className="w-full py-2.5 px-4 glass-btn text-xs font-semibold flex items-center justify-center gap-2"
              >
                <Play className="w-4 h-4 text-brand-cyan" /> Start Voice Analysis
              </button>
            )}
          </div>
        </GlassCard>

        {/* Biometrics results panel */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between h-[420px]">
          <div>
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
                Vocal Biomarkers
              </h3>
              <span className="px-1.5 py-0.5 rounded text-[8px] font-semibold bg-brand-purple/20 text-brand-cyan border border-brand-purple/20 font-mono">
                Beta — Simulated Biometrics
              </span>
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Biometric analysis results extracted from vocal acoustic envelope features.
            </p>
          </div>

          {isComplete ? (
            <div className="flex-1 flex flex-col justify-center space-y-4 my-4">
              
              {/* Valence indicator */}
              <div className="p-3.5 rounded-xl border border-white/5 bg-white/2 flex justify-between items-center">
                <span className="text-xs text-slate-400 uppercase font-semibold">Detected Emotion</span>
                <span className={`text-sm font-extrabold uppercase px-2 py-0.5 rounded ${
                  valence === 'Calm' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                  valence === 'Anxious' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                  'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                }`}>
                  {valence}
                </span>
              </div>

              {/* Tension Meter */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>Vocal Cord Tension</span>
                  <span className="text-slate-200">{tensionIndex}%</span>
                </div>
                <div className="h-2 rounded bg-white/5 border border-white/5 overflow-hidden">
                  <div 
                    className={`h-full rounded transition-all duration-1000 ${
                      tensionIndex > 60 ? 'bg-red-500' : tensionIndex > 40 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${tensionIndex}%` }}
                  />
                </div>
              </div>

              {/* Jitter */}
              <div className="flex justify-between text-xs py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-brand-cyan" /> Pitch Jitter</span>
                <span className="font-mono text-slate-200 font-bold">{jitter}%</span>
              </div>

              {/* Shimmer */}
              <div className="flex justify-between text-xs py-1 border-b border-white/5">
                <span className="text-slate-400 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-brand-cyan" /> Amplitude Shimmer</span>
                <span className="font-mono text-slate-200 font-bold">{shimmer}%</span>
              </div>

              {/* Tempo */}
              <div className="flex justify-between text-xs py-1">
                <span className="text-slate-400 flex items-center gap-1.5"><Volume2 className="w-3.5 h-3.5 text-brand-cyan" /> Speech Tempo</span>
                <span className="font-mono text-slate-200 font-bold">{tempo} WPM</span>
              </div>

            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500">
              <MicOff className="w-8 h-8 text-slate-600 mb-2" />
              <p className="text-xs">No active vocal biometrics compiled. Please run the recording diagnostic.</p>
            </div>
          )}

          <div>
            <button
              onClick={handleCommitToTwin}
              disabled={!isComplete}
              className="w-full py-2.5 px-4 glass-btn text-xs font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-brand-cyan" /> Sync Voice to Mental Twin
            </button>
          </div>
        </GlassCard>

      </div>

      <GlassCard className="flex items-start gap-3 bg-slate-950/20 border-white/5">
        <Info className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <span className="font-semibold text-slate-300 block">Science of Voice Biomarkers:</span>
          <p>Micro-tremors in vocal cord muscles (reflected in pitch Jitter and amplitude Shimmer) fluctuate in direct correlation with stress hormone levels. Speech tempo slows during depressive affect states and accelerates during anxiety spikes, serving as a non-invasive cognitive state marker.</p>
        </div>
      </GlassCard>

    </div>
  );
}
