"use client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MentalTwinGlobe from "@/components/three/MentalTwinGlobe";
import CrisisGauge from "@/components/charts/CrisisGauge";
import SparkLine from "@/components/charts/SparkLine";
import BiomarkerMatrix from "@/components/charts/BiomarkerMatrix";
import VoiceRadar from "@/components/charts/VoiceRadar";
import AgentChat from "@/components/agents/AgentChat";
import RecoveryCard from "@/components/agents/RecoveryCard";
import TwinGraph from "@/components/flow/TwinGraph";
import PipelineFlow from "@/components/pipeline/PipelineFlow";
import ObservabilityPanel from "@/components/pipeline/ObservabilityPanel";
import TechStackExplorer from "@/components/pipeline/TechStackExplorer";
import JournalAnalyzer from "@/components/agents/JournalAnalyzer";

import { useUi, useAuth } from "@/lib/store";
import { useTranslations } from "next-intl";
import { Activity, Volume2, ShieldAlert, Sparkles, Star, Smartphone, ActivitySquare, HeartHandshake, Eye } from "lucide-react";

export default function DashboardPage() {
  const { sidebarOpen } = useUi();
  const { user } = useAuth();
  const t = useTranslations("dashboard");

  return (
    <div className="min-h-screen bg-sx-void text-white flex">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content wrapper */}
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? "240px" : "80px" }}
      >
        {/* Header */}
        <Header />

        {/* Scrollable Layout Space */}
        <main className="p-6 mt-16 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* ROW 1: Hero Strip */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left 60%: Mental Twin Globe */}
            <div className="lg:col-span-3 h-[400px]">
              <MentalTwinGlobe height={400} interactive={true} />
            </div>

            {/* Right 40%: Crisis Score Card */}
            <div className="lg:col-span-2 h-[400px]">
              <CrisisGauge />
            </div>
          </div>

          {/* ROW 2: 4-Column Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                title: t("behaviorScore"),
                value: "71/100",
                change: "↑ +3",
                changeColor: "text-emerald-400",
                desc: "SHAP attribution impact: 18%",
                sparkline: [68, 69, 70, 70, 71, 71, 71],
                color: "oklch(72% 0.18 150)",
                icon: ActivitySquare,
              },
              {
                title: t("voiceEnergy"),
                value: "82%",
                change: "↓ -5%",
                changeColor: "text-rose-400",
                desc: t("ofBaseline"),
                sparkline: [87, 85, 84, 83, 82, 82, 82],
                color: "oklch(72% 0.19 200)",
                icon: Volume2,
              },
              {
                title: t("sleepConsistency"),
                value: "6.2 hrs",
                change: "↓ -0.8 hrs",
                changeColor: "text-rose-400",
                desc: t("hrsAvg", { avg: 7 }),
                sparkline: [7.0, 6.8, 6.6, 6.4, 6.3, 6.2, 6.2],
                color: "oklch(78% 0.20 75)",
                icon: Smartphone,
              },
              {
                title: t("socialActivity"),
                value: "4 interactions",
                change: "↑ +2",
                changeColor: "text-emerald-400",
                desc: t("interactionsToday"),
                sparkline: [2, 3, 2, 4, 3, 4, 4],
                color: "oklch(65% 0.22 300)",
                icon: HeartHandshake,
              },
            ].map((card, idx) => {
              const Icon = card.icon;
              return (
                <div 
                  key={idx} 
                  className="glass rounded-2xl p-5 border border-white/5 flex flex-col justify-between hover:border-white/10 transition-all duration-200"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{card.title}</span>
                    <span className={`p-1.5 rounded-lg bg-white/5 ${card.changeColor}`}>
                      <Icon size={14} />
                    </span>
                  </div>

                  <div className="my-3">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-bold text-white font-mono">{card.value}</span>
                      <span className={`text-[10px] font-bold font-mono ${card.changeColor}`}>{card.change}</span>
                    </div>
                    <p className="text-[9px] text-zinc-500 mt-0.5">{card.desc}</p>
                  </div>

                  <div className="h-10 flex items-center justify-between mt-1 border-t border-white/5 pt-2">
                    <span className="text-[9px] text-zinc-600 font-mono">7-day trend</span>
                    <SparkLine data={card.sparkline} color={card.color} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* ROW 3: Biomarker Matrix */}
          <BiomarkerMatrix />

          {/* ROW 4: Voice Analysis & Daily Questions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <VoiceRadar />
            <AgentChat />
          </div>

          {/* ROW 5: Recovery Engine & Mental Twin Graph */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecoveryCard />
            <div className="flex flex-col gap-4">
              <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
                <div>
                  <h3 className="text-display font-extrabold text-lg text-white">
                    Mental Twin Subgraph
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Graph database replica · Neo4j influences & correlations
                  </p>
                </div>
                <TwinGraph />
              </div>
            </div>
          </div>

          {/* ROW 6: Multi-Agent Ingestion Pipeline */}
          <PipelineFlow />

          {/* ROW 7: Observability & Tech Stack Explorer */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ObservabilityPanel />
            <TechStackExplorer />
          </div>

          {/* ROW 8: Journal Analyzer */}
          <JournalAnalyzer />

        </main>
      </div>
    </div>
  );
}
