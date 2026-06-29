"use client";
import { useState } from "react";
import { useBiomarkersQuery } from "@/lib/api/hooks";
import { useTranslations } from "next-intl";
import SparkLine from "./SparkLine";
import { ChevronDown, ChevronUp, AlertCircle, CheckCircle, HelpCircle, Flame } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";

export default function BiomarkerMatrix() {
  const { data: biomarkers, isLoading } = useBiomarkersQuery();
  const t = useTranslations("biomarkers");
  const [expandedRow, setExpandedRow] = useState<string | null>(null);

  if (isLoading || !biomarkers) {
    return (
      <div className="h-60 flex items-center justify-center glass rounded-2xl">
        <span className="text-xs text-zinc-500 font-mono">Querying TimescaleDB Time-Series...</span>
      </div>
    );
  }

  const toggleRow = (signal: string) => {
    setExpandedRow(expandedRow === signal ? null : signal);
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "healthy": return "status-healthy";
      case "watch": return "status-watch";
      case "alert": return "status-alert";
      case "critical": return "status-critical";
      default: return "bg-zinc-800 text-zinc-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy": return <CheckCircle size={12} className="text-emerald-400" />;
      case "watch": return <HelpCircle size={12} className="text-amber-400" />;
      case "alert": return <AlertCircle size={12} className="text-orange-400" />;
      case "critical": return <Flame size={12} className="text-red-400 animate-pulse" />;
      default: return null;
    }
  };

  const getSparklineColor = (status: string) => {
    switch (status) {
      case "healthy": return "oklch(72% 0.18 150)";
      case "watch": return "oklch(78% 0.20 75)";
      case "alert": return "oklch(68% 0.24 25)";
      case "critical": return "oklch(55% 0.28 25)";
      default: return "oklch(58% 0.02 270)";
    }
  };

  // Helper to map technical signal keys to translated labels
  const getSignalLabel = (sig: string) => {
    switch (sig) {
      case "typingSpeed": return t("typingSpeed");
      case "phoneUnlocks": return t("phoneUnlocks");
      case "screenTime": return t("screenTime");
      case "appEntropy": return t("appEntropy");
      case "sleepDuration": return t("sleepDuration");
      case "sleepConsistency": return t("sleepConsistency");
      case "walkingSteps": return t("walkingSteps");
      case "gpsRadius": return t("gpsRadius");
      case "callDuration": return t("callDuration");
      case "speechBiomarkers": return t("speechBiomarkers");
      case "responseDelay": return t("responseDelay");
      case "notificationDismissal": return t("notificationDismissal");
      case "socialDecline": return t("socialDecline");
      default: return sig;
    }
  };

  // Generate historical data array for Recharts time-series chart
  const getHistoricalData = (trend: number[], baseline: number) => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return trend.map((val, idx) => ({
      name: days[idx] || `D${idx}`,
      current: val,
      baseline: baseline,
    }));
  };

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
      <div>
        <h3 className="text-display font-extrabold text-lg text-white">
          {t("title")}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Differential Privacy ε=0.1 · Auto-synced from Edge ML Engine
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/5 text-zinc-500 font-mono">
              <th className="py-3 px-4 font-normal">{t("signal")}</th>
              <th className="py-3 px-4 font-normal text-right">{t("current")}</th>
              <th className="py-3 px-4 font-normal text-right">{t("baseline")}</th>
              <th className="py-3 px-4 font-normal text-right">{t("delta")}</th>
              <th className="py-3 px-4 font-normal text-center">{t("trend7d")}</th>
              <th className="py-3 px-4 font-normal text-right">{t("shapImpact")}</th>
              <th className="py-3 px-4 font-normal text-center">{t("status")}</th>
            </tr>
          </thead>
          <tbody>
            {biomarkers.map((row) => {
              const isExpanded = expandedRow === row.signal;
              const deltaPrefix = row.delta > 0 ? "+" : "";

              return (
                <>
                  {/* Base Row */}
                  <tr
                    key={row.signal}
                    onClick={() => toggleRow(row.signal)}
                    className="border-b border-white/5 hover:bg-white/5 transition-all duration-200 cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-semibold text-white flex items-center gap-2">
                      {isExpanded ? <ChevronUp size={14} className="text-zinc-500" /> : <ChevronDown size={14} className="text-zinc-500" />}
                      {getSignalLabel(row.signal)}
                    </td>
                    <td className="py-3.5 px-4 text-right text-data">
                      {row.current}
                      <span className="text-[10px] text-zinc-500 ml-1">{row.unit}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right text-zinc-500 text-data">
                      {row.baseline}
                      <span className="text-[10px] text-zinc-600 ml-1">{row.unit}</span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-mono text-data ${row.delta < 0 ? "text-emerald-400" : "text-rose-400"}`}>
                      {deltaPrefix}
                      {row.delta}
                    </td>
                    <td className="py-3.5 px-4 flex justify-center">
                      <SparkLine data={row.trend} color={getSparklineColor(row.status)} />
                    </td>
                    <td className="py-3.5 px-4 text-right text-purple-400 font-mono">
                      {(row.shapImpact * 100).toFixed(0)}%
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono capitalize ${getStatusStyle(row.status)}`}>
                        {getStatusIcon(row.status)}
                        {row.status}
                      </span>
                    </td>
                  </tr>

                  {/* Expanded chart row */}
                  {isExpanded && (
                    <tr key={`${row.signal}-expanded`} className="bg-white/5">
                      <td colSpan={7} className="p-6">
                        <div className="h-64 w-full flex flex-col gap-4">
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-zinc-400 font-medium">TimescaleDB Time-Series View (7-Day Baseline Comparison)</span>
                            <span className="text-zinc-500 font-mono">Model input impact: SHAP={row.shapImpact}</span>
                          </div>
                          
                          <div className="flex-1 w-full min-h-[200px]">
                            <ResponsiveContainer width="100%" height="100%">
                              <AreaChart
                                data={getHistoricalData(row.trend, row.baseline)}
                                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                              >
                                <defs>
                                  <linearGradient id="colorCurrent" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                  </linearGradient>
                                  <linearGradient id="colorBaseline" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#52525b" stopOpacity={0.1} />
                                    <stop offset="95%" stopColor="#52525b" stopOpacity={0} />
                                  </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="name" tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fill: "#71717a", fontSize: 10 }} axisLine={false} tickLine={false} />
                                <Tooltip
                                  contentStyle={{
                                    backgroundColor: "oklch(18% 0.02 270)",
                                    borderColor: "oklch(25% 0.025 270)",
                                    borderRadius: "12px",
                                    fontSize: "11px",
                                    color: "#fff",
                                  }}
                                />
                                <Area type="monotone" dataKey="current" stroke="#a855f7" strokeWidth={2} fillOpacity={1} fill="url(#colorCurrent)" name="Current Reading" />
                                <Area type="monotone" dataKey="baseline" stroke="#71717a" strokeWidth={1} strokeDasharray="4 4" fillOpacity={1} fill="url(#colorBaseline)" name="Personal Baseline" />
                              </AreaChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
