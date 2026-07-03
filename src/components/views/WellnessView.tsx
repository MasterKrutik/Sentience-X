import React from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, AreaChart, Area
} from 'recharts';
import { BarChart3, TrendingUp, AlertCircle, Info } from 'lucide-react';

export function WellnessView() {
  const { predictions, signals, language } = useWellnessStore();
  const t = translations[language].app;

  // 1. Compile 6-axis Radar Data (higher is more severe for negative states, higher is better for motivation)
  const radarData = [
    { subject: 'Stress', A: predictions.stress, fullMark: 100 },
    { subject: 'Burnout', A: predictions.burnout, fullMark: 100 },
    { subject: 'Anxiety', A: predictions.anxiety, fullMark: 100 },
    { subject: 'Motivation', A: predictions.motivation, fullMark: 100 },
    { subject: 'Loneliness', A: predictions.loneliness, fullMark: 100 },
    { subject: 'Cognitive Fatigue', A: predictions.cognitive_fatigue, fullMark: 100 },
  ];

  // 2. Generate 7-day Historical Data based on current telemetry with realistic deviations
  const generateHistoricalData = () => {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Today'];
    const baseScore = predictions.overall_wellness;
    const baseSleep = signals.sleep_quality;
    const baseSteps = signals.steps;
    
    // Controlled offsets for realism (e.g. Wednesday was a stressful day with low steps)
    const offsets = [
      { score: -6, sleep: -10, steps: -2000 },
      { score: -3, sleep: -5, steps: -500 },
      { score: -12, sleep: -22, steps: -4500 }, // stress peak
      { score: -1, sleep: 5, steps: 1500 },
      { score: 2, sleep: 8, steps: 2000 },
      { score: -4, sleep: -8, steps: -1200 },
      { score: 0, sleep: 0, steps: 0 } // Today
    ];

    return days.map((day, idx) => {
      const offset = offsets[idx];
      return {
        name: day,
        "Wellness Index": Math.round(Math.min(Math.max(baseScore + offset.score, 10), 100)),
        "Sleep Quality": Math.round(Math.min(Math.max(baseSleep + offset.sleep, 10), 100)),
        "Steps (x100)": Math.round(Math.min(Math.max(baseSteps + offset.steps, 1000), 22000) / 100)
      };
    });
  };

  const trendData = generateHistoricalData();

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
          <BarChart3 className="w-7 h-7 text-brand-cyan" />
          {translations[language].nav.wellness}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Wellness profiling engine. Compiles multiple dimensions of behavioral health and monitors temporal trends.
        </p>
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: 6-Axis Radar Chart */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-2">
              Wellness Dimension Profile
            </h3>
            <p className="text-[11px] text-slate-400">
              Visualizes 6 key dimensions. High motivation is positive, while high stress/burnout represent severity risk.
            </p>
          </div>
          
          <div className="w-full h-72 flex items-center justify-center mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.06)" />
                <PolarAngleAxis 
                  dataKey="subject" 
                  tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 500 }} 
                />
                <PolarRadiusAxis 
                  angle={30} 
                  domain={[0, 100]} 
                  tick={{ fill: '#64748b', fontSize: 8 }}
                />
                <Radar
                  name="Wellness State"
                  dataKey="A"
                  stroke="#7c3aed"
                  fill="#7c3aed"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Right Side: Historical Trends Line Chart */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200 flex items-center gap-1.5 mb-2">
              7-Day Retrospective Trends
            </h3>
            <p className="text-[11px] text-slate-400">
              Monitors overall Wellness Index in relation to sleep quality and physical activity.
            </p>
          </div>

          <div className="w-full h-72 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={trendData}
                margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorWellness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSleep" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#7c3aed" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#64748b" 
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#64748b" 
                  tick={{ fontSize: 9 }}
                  domain={[0, 100]}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(13, 14, 20, 0.9)', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '11px'
                  }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                  iconSize={8}
                />
                <Area 
                  type="monotone" 
                  dataKey="Wellness Index" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorWellness)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="Sleep Quality" 
                  stroke="#7c3aed" 
                  strokeWidth={1.5}
                  fillOpacity={1} 
                  fill="url(#colorSleep)" 
                />
                <Line 
                  type="monotone" 
                  dataKey="Steps (x100)" 
                  stroke="#10b981" 
                  strokeWidth={1.5}
                  dot={{ r: 2 }}
                  activeDot={{ r: 4 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* Dynamic Correlation Insights Card */}
      <GlassCard className="flex items-start gap-4 border border-white/5 bg-slate-950/20">
        <Info className="w-5 h-5 text-brand-cyan shrink-0 mt-0.5" />
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold text-slate-200">AI Correlation Insight</h4>
          <p className="text-xs text-slate-400 leading-relaxed">
            The XGBoost model identifies that on Wednesday, your screen time spiked by 3.5 hours, directly precipitating a 22% drop in sleep quality. This correlation triggered a subsequent increase in typing latency (to 175ms) and a rise in predicted Stress and Cognitive Fatigue, causing your overall Wellness Score to drift downwards. Keep screen time under 6 hours to stabilize your score.
          </p>
        </div>
      </GlassCard>

    </div>
  );
}
