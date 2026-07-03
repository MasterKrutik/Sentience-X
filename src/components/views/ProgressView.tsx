import React from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Legend, PieChart, Pie, Cell
} from 'recharts';
import { BarChart3, TrendingUp, Award, Clock, Activity, CheckCircle } from 'lucide-react';

export function ProgressView() {
  const { predictions, language } = useWellnessStore();
  const t = translations[language].app;
  const currentScore = Math.round(predictions.overall_wellness);

  // 1. Generate 30-day historical trend data for the area chart
  const generate30DayData = () => {
    const data = [];
    const baseScore = currentScore;
    
    for (let i = 30; i >= 1; i--) {
      // Create a nice sinusoidal drift with random deviations
      const dayOffset = Math.sin(i * 0.4) * 8 + (Math.sin(i * 0.1) * 4);
      const randomNoise = Math.floor(Math.random() * 4) - 2;
      const finalScore = Math.min(Math.max(baseScore - 5 + Math.round(dayOffset + randomNoise), 20), 100);
      
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString([], { month: 'short', day: 'numeric' });
      
      data.push({
        date: dateStr,
        "Wellness Index": finalScore
      });
    }
    return data;
  };

  const areaData = generate30DayData();

  // 2. Generate 4-week averages data for the grouped bar chart
  const barData = [
    { name: 'Week 1', Stress: 62, Burnout: 58, Anxiety: 55 },
    { name: 'Week 2', Stress: 55, Burnout: 50, Anxiety: 48 },
    { name: 'Week 3', Stress: 45, Burnout: 42, Anxiety: 40 },
    { name: 'Week 4 (Current)', Stress: Math.round(predictions.stress), Burnout: Math.round(predictions.burnout), Anxiety: Math.round(predictions.anxiety) }
  ];

  // 3. Category task completions data for the pie chart
  const pieData = [
    { name: 'Mental Exercises', value: 14, color: '#7c3aed' },   // brand-purple
    { name: 'Circadian Sleep Lock', value: 8, color: '#22d3ee' }, // brand-cyan
    { name: 'Active Walks/Steps', value: 11, color: '#10b981' },  // green
    { name: 'Social check-ins', value: 6, color: '#f59e0b' }      // yellow
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-brand-cyan" />
          Progress & Analytics
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Chronological progress engine. Monitors long-term wellness indicators and tracks checklist completion efficiency.
        </p>
      </div>

      {/* Stats Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        
        <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5" /> 30-Day Average
          </span>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-100">72.8</div>
            <span className="text-[9px] text-green-400">↑ 3.2% vs last month</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Award className="w-3.5 h-3.5" /> Weekly Peak Score
          </span>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-100">84</div>
            <span className="text-[9px] text-slate-400">Achieved on Friday</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5" /> Recovery Rate
          </span>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-100">68%</div>
            <span className="text-[9px] text-green-400">39/57 tasks completed</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl glass-panel border border-white/5 text-slate-100 flex flex-col justify-between h-28 hover:border-brand-purple/20 transition-all">
          <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5" /> Active Alert Count
          </span>
          <div>
            <div className="text-2xl font-bold tracking-tight text-slate-100">2</div>
            <span className="text-[9px] text-amber-400">Moderate stress drift</span>
          </div>
        </div>

      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Side: 30-Day Area Chart */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              30-Day Chronological Trend
            </h3>
            <p className="text-[10px] text-slate-400">
              Shows daily overall Wellness Index fluctuations. Higher is better.
            </p>
          </div>

          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={areaData}
                margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="colorAreaWellness" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.25}/>
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="date" 
                  stroke="#475569" 
                  tick={{ fontSize: 8 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#475569" 
                  tick={{ fontSize: 8 }}
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
                <Area 
                  type="monotone" 
                  dataKey="Wellness Index" 
                  stroke="#22d3ee" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorAreaWellness)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Right Side: Weekly Bar Chart */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between min-h-[350px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              4-Week Stress-Burnout-Anxiety Trends
            </h3>
            <p className="text-[10px] text-slate-400">
              Compares weekly averages of critical stress dimensions.
            </p>
          </div>

          <div className="w-full h-64 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={barData}
                margin={{ top: 10, right: 0, left: -25, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" />
                <XAxis 
                  dataKey="name" 
                  stroke="#475569" 
                  tick={{ fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#475569" 
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
                    fontSize: '10px'
                  }}
                  itemStyle={{ color: '#f3f4f6' }}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '9px', paddingTop: '10px' }}
                  iconSize={8}
                />
                <Bar dataKey="Stress" fill="#7c3aed" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Burnout" fill="#ef4444" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Anxiety" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

      </div>

      {/* Third Row: Pie Chart & Summary details */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        
        {/* Left Pie chart */}
        <GlassCard className="lg:col-span-2 flex flex-col justify-between h-[300px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Recovery Task Distribution
            </h3>
            <p className="text-[10px] text-slate-400">
              Total recovery tasks completed divided by core category divisions.
            </p>
          </div>

          <div className="w-full h-44 flex items-center justify-center relative mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(13, 14, 20, 0.9)', 
                    borderColor: 'rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    fontSize: '10px'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            
            {/* Center Summary count */}
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-xl font-bold tracking-tight text-slate-100">39</span>
              <span className="text-[8px] text-slate-500 uppercase tracking-widest">Tasks Done</span>
            </div>
          </div>

          {/* Color legend */}
          <div className="grid grid-cols-2 gap-2 text-[9px] text-slate-400 pt-2 border-t border-white/5">
            {pieData.map((d) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="truncate">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Right Summary recommendations table */}
        <GlassCard className="lg:col-span-3 flex flex-col justify-between h-[300px]">
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-200">
              Drift Event Log
            </h3>
            <p className="text-[10px] text-slate-400">
              Chronological records of cognitive and stress drift triggers flagged by the models.
            </p>
          </div>

          <div className="flex-1 mt-4 overflow-y-auto space-y-2 pr-1 text-xs">
            
            <div className="p-2.5 rounded-xl bg-red-950/10 border border-red-500/10 flex justify-between items-start">
              <div>
                <span className="font-semibold text-red-400 block">[Severity Drift] High Stress Warning</span>
                <span className="text-[10px] text-slate-400">Screen time spiked to 9.5 hours, sleep duration restricted to 5.4 hours.</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 shrink-0">June 28</span>
            </div>

            <div className="p-2.5 rounded-xl bg-amber-950/10 border border-amber-500/10 flex justify-between items-start">
              <div>
                <span className="font-semibold text-amber-400 block">[Cognitive Drift] Typing Latency Spike</span>
                <span className="text-[10px] text-slate-400">Keystroke delays increased by 24% to 154ms, errors increased to 8.</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 shrink-0">June 26</span>
            </div>

            <div className="p-2.5 rounded-xl bg-green-950/10 border border-green-500/10 flex justify-between items-start">
              <div>
                <span className="font-semibold text-green-400 block">[Model Alignment] Recovery Target Completed</span>
                <span className="text-[10px] text-slate-400">Completed 4-7-8 deep breathing and locked sleep bedroom screens. Wellness Index improved +8%.</span>
              </div>
              <span className="text-[9px] font-mono text-slate-500 shrink-0">June 25</span>
            </div>

          </div>
        </GlassCard>

      </div>

    </div>
  );
}
