"use client";
import { useObservability } from "@/lib/api/hooks";
import { useTranslations } from "next-intl";
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Activity, Server, Clock, Cpu } from "lucide-react";

export default function ObservabilityPanel() {
  const { data, isLoading } = useObservability();
  const t = useTranslations("observability");

  if (isLoading || !data) {
    return (
      <div className="h-60 flex items-center justify-center glass rounded-2xl">
        <span className="text-xs text-zinc-500 font-mono">Querying Prometheus & Jaeger Metrics...</span>
      </div>
    );
  }

  const statCards = [
    { title: t("uptime"), value: data.stats.uptime, icon: Server, color: "text-emerald-400" },
    { title: t("rps"), value: data.stats.rps, icon: Activity, color: "text-purple-400" },
    { title: t("errorRate"), value: data.stats.errorRate, icon: Clock, color: "text-red-400" },
    { title: t("memory"), value: data.stats.memory, icon: Cpu, color: "text-cyan-400" },
  ];

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
      {/* Header */}
      <div>
        <h3 className="text-display font-extrabold text-lg text-white">
          {t("title")}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          OpenTelemetry Prometheus metrics · Live WebSocket updates (5s)
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4 flex items-center gap-3">
              <div className={`p-2 bg-white/5 rounded-xl ${stat.color}`}>
                <Icon size={16} />
              </div>
              <div>
                <p className="text-[10px] text-zinc-500 font-mono uppercase">{stat.title}</p>
                <p className="text-sm font-bold text-white font-mono mt-0.5">{stat.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid of charts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chart 1: Latency */}
        <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] text-zinc-400 font-semibold font-mono uppercase">{t("apiLatency")} (ms)</span>
          <div className="h-36 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.apiLatency} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1c1917", borderColor: "#2e2a24", fontSize: 10 }} />
                <Line type="monotone" dataKey="p50" stroke="#a855f7" strokeWidth={1.5} dot={false} name="p50" />
                <Line type="monotone" dataKey="p95" stroke="#06b6d4" strokeWidth={1.5} dot={false} name="p95" />
                <Line type="monotone" dataKey="p99" stroke="#ef4444" strokeWidth={1.5} dot={false} name="p99" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Model Inference */}
        <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] text-zinc-400 font-semibold font-mono uppercase">{t("mlInference")} (ms)</span>
          <div className="h-36 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.mlInference} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="model" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1c1917", borderColor: "#2e2a24", fontSize: 10 }} />
                <Bar dataKey="ms" fill="oklch(72% 0.19 200 / 0.7)" radius={[4, 4, 0, 0]} name="Inference Speed" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Kafka Lag */}
        <div className="flex flex-col gap-2 bg-white/5 p-4 rounded-2xl border border-white/5">
          <span className="text-[10px] text-zinc-400 font-semibold font-mono uppercase">{t("kafkaLag")} (msgs)</span>
          <div className="h-36 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.kafkaLag} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorLag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="time" tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#71717a", fontSize: 9 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: "#1c1917", borderColor: "#2e2a24", fontSize: 10 }} />
                <Area type="monotone" dataKey="lag" stroke="#ef4444" fillOpacity={1} fill="url(#colorLag)" name="Consumer Lag" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
