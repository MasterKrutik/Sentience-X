"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useUi } from "@/lib/store";
import { useTranslations } from "next-intl";
import { Server, Cpu, Database, Play, RefreshCw, Terminal, CheckCircle, Flame, ShieldCheck } from "lucide-react";
import PipelineFlow from "@/components/pipeline/PipelineFlow";
import ObservabilityPanel from "@/components/pipeline/ObservabilityPanel";

export default function AdminPage() {
  const { sidebarOpen } = useUi();
  const t = useTranslations("admin");

  const [calibrating, setCalibrating] = useState(false);
  const [calibrated, setCalibrated] = useState(false);
  const [flushing, setFlushing] = useState(false);
  const [flushed, setFlushed] = useState(false);

  const handleRecalibrate = async () => {
    setCalibrating(true);
    setCalibrated(false);
    await new Promise((r) => setTimeout(r, 2000));
    setCalibrating(false);
    setCalibrated(true);
  };

  const handleFlush = async () => {
    setFlushing(true);
    setFlushed(false);
    await new Promise((r) => setTimeout(r, 1500));
    setFlushing(false);
    setFlushed(true);
  };

  const stats = [
    { label: "Active Pipelines", value: "8 / 8 Online", icon: Cpu, color: "text-emerald-400" },
    { label: "Total Twin Nodes", value: "32,840 nodes", icon: Database, color: "text-purple-400" },
    { label: "Timescale telemetry size", value: "482.4 GB", icon: Server, color: "text-cyan-400" },
    { label: "System Compliance", value: "DPDP / HIPAA", icon: ShieldCheck, color: "text-emerald-400" },
  ];

  return (
    <div className="min-h-screen bg-sx-void text-white flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? "240px" : "80px" }}
      >
        <Header />
        <main className="p-6 mt-16 space-y-6 max-w-7xl mx-auto w-full">
          
          {/* Header */}
          <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-display font-extrabold text-xl text-white">{t("title")}</h2>
              <p className="text-xs text-zinc-500 mt-1">
                System telemetry metrics, task queues, database tuning parameters, and model weight controls.
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRecalibrate}
                disabled={calibrating}
                className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all shadow-[0_0_15px_oklch(65% 0.22 300 / 0.3)]"
              >
                <RefreshCw size={14} className={calibrating ? "animate-spin" : ""} />
                {calibrating ? "Calibrating..." : calibrated ? "Recalibration Complete" : t("recalibrate")}
              </button>

              <button
                onClick={handleFlush}
                disabled={flushing}
                className="bg-white/5 border border-white/5 hover:border-white/10 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all"
              >
                <Terminal size={14} />
                {flushing ? "Flushing streams..." : flushed ? "Kafka Queue Flushed" : t("flushStreams")}
              </button>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div key={idx} className="glass rounded-2xl p-5 border border-white/5 flex items-center gap-4">
                  <div className={`p-3 bg-white/5 rounded-xl ${stat.color}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <span className="text-[10px] text-zinc-500 font-mono uppercase tracking-wider">{stat.label}</span>
                    <span className="text-sm font-bold text-white block mt-1 font-mono">{stat.value}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Ingestion Pipeline Status DAG */}
          <PipelineFlow />

          {/* System Performance Observability (Grafana) */}
          <ObservabilityPanel />

          {/* Database Analytics Tools */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Database schemas & sizes */}
            <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="text-display font-extrabold text-sm text-white">Database Schema Stats</h3>
              
              <div className="space-y-3">
                {[
                  { name: "Neo4j Graph Database", metrics: "12 Node Types · 28 Edge Relations · Indexes Active", usage: "32,840 nodes" },
                  { name: "TimescaleDB Time-Series Tables", metrics: "13 hypertable partitions · Row compression active", usage: "24.5M readings" },
                  { name: "Qdrant Vector Collections", metrics: "384-dim sentence-transformers cosine distance model", usage: "1,240 documents" },
                  { name: "PostgreSQL relational schemas", metrics: "User, Auth Session, Audit logs and static structures", usage: "2.4 MB total" },
                ].map((db, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-white block">{db.name}</span>
                      <span className="text-[10px] text-zinc-500 mt-1 block">{db.metrics}</span>
                    </div>
                    <span className="text-[10px] font-mono text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-lg">
                      {db.usage}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Celery Workers / Task scheduler */}
            <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
              <h3 className="text-display font-extrabold text-sm text-white">Live Execution Tasks</h3>

              <div className="space-y-3">
                {[
                  { task: "tasks.compute_shap_influence", status: "running", duration: "1.2s avg", worker: "celery@ml-worker-1" },
                  { task: "tasks.stream_voice_prosody", status: "standby", duration: "0.4s avg", worker: "celery@speech-worker-1" },
                  { task: "tasks.neo4j_subgraph_compaction", status: "standby", duration: "14.2s avg", worker: "celery@graph-worker-1" },
                  { task: "tasks.qdrant_vector_reindex", status: "standby", duration: "2.5s avg", worker: "celery@db-worker-1" },
                ].map((task, idx) => (
                  <div key={idx} className="p-3 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center text-xs">
                    <div>
                      <span className="font-semibold text-zinc-300 font-mono block">{task.task}</span>
                      <span className="text-[9px] text-zinc-500 mt-1 block font-mono">Assigned: {task.worker} · {task.duration}</span>
                    </div>
                    
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold font-mono uppercase ${
                      task.status === "running" ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-zinc-400"
                    }`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
