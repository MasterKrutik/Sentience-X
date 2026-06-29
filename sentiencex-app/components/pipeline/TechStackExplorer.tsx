"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, Link as LinkIcon, Activity, CheckCircle, AlertTriangle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface TechItem {
  name: string;
  category: string;
  version: string;
  status: "connected" | "degraded" | "standby";
  desc: string;
  docs: string;
}

const techItems: TechItem[] = [
  // FRONTEND
  { name: "Next.js 15", category: "Frontend", version: "v15.0.0-canary", status: "connected", desc: "React Server Components, Streaming SSR, App Router framework.", docs: "https://nextjs.org" },
  { name: "React 19", category: "Frontend", version: "v19.0.0", status: "connected", desc: "Concurrent features, use() hook, Server Actions runtime.", docs: "https://react.dev" },
  { name: "TypeScript 5.5", category: "Frontend", version: "v5.5.3", status: "connected", desc: "Strict type checks, satisfies operator, const params constraints.", docs: "https://typescriptlang.org" },
  { name: "TailwindCSS 4", category: "Frontend", version: "v4.0.0-alpha", status: "connected", desc: "CSS-first config, @theme engine, OKLCH fluid color spacing.", docs: "https://tailwindcss.com" },
  { name: "Shadcn UI", category: "Frontend", version: "v0.8.0", status: "connected", desc: "Accessible Radix UI primitives with Tailwind design designTokens.", docs: "https://ui.shadcn.com" },
  { name: "Framer Motion 11", category: "Frontend", version: "v11.3.0", status: "connected", desc: "Layout animations, spring physical engines, cursor interaction tracking.", docs: "https://framer.com/motion" },
  { name: "Three.js r168", category: "Frontend", version: "r168", status: "connected", desc: "WebGL/WebGPU graphics context for 3D Mental Twin neural network.", docs: "https://threejs.org" },
  { name: "React Flow 12", category: "Frontend", version: "v12.0.4", status: "connected", desc: "Interactive Node graph interface mapping Mood and Trigger structures.", docs: "https://reactflow.dev" },
  { name: "TanStack Query v5", category: "Frontend", version: "v5.51.1", status: "connected", desc: "Suspense query runtime, optimistic mutations, server sync policies.", docs: "https://tanstack.com" },
  { name: "Zustand v5", category: "Frontend", version: "v5.0.0-rc", status: "connected", desc: "Client state persistence, immer integration, transaction middleware.", docs: "https://zustand-demo.pmnd.rs" },

  // BACKEND
  { name: "FastAPI", category: "Backend", version: "v0.111.0", status: "connected", desc: "Async Python web framework, Pydantic data modeling and validation.", docs: "https://fastapi.tiangolo.com" },
  { name: "Celery", category: "Backend", version: "v5.4.0", status: "connected", desc: "Distributed task worker backend for biomarker time-series scoring.", docs: "https://docs.celeryq.dev" },
  { name: "Kong Gateway", category: "Backend", version: "v3.7.0", status: "connected", desc: "API entry gateway handles rate limiting, TLS terminations, auth routing.", docs: "https://konghq.com" },

  // DATABASES
  { name: "PostgreSQL", category: "Databases", version: "v16.3", status: "connected", desc: "Relational store for user records, permission states, journal timelines.", docs: "https://postgresql.org" },
  { name: "TimescaleDB", category: "Databases", version: "v2.15.0", status: "connected", desc: "Time-series extension to scale sensor biomarker telemetry points.", docs: "https://timescale.com" },
  { name: "Redis", category: "Databases", version: "v7.2.5", status: "connected", desc: "Memory cache store, session cache, Kafka socket event buffer.", docs: "https://redis.io" },
  { name: "Neo4j", category: "Databases", version: "v5.20.0", status: "connected", desc: "Graph database engine storing Mental twin MoodState nodes and edges.", docs: "https://neo4j.com" },
  { name: "Qdrant", category: "Databases", version: "v1.9.5", status: "connected", desc: "Vector store for semantic text journal chunk mappings.", docs: "https://qdrant.tech" },
  { name: "MinIO / S3", category: "Databases", version: "v2024-06", status: "connected", desc: "Object store holding audio wav files, export reports, model weights.", docs: "https://min.io" },

  // AI LAYER
  { name: "PyTorch Lightning", category: "AI Layer", version: "v2.3.0", status: "connected", desc: "Machine learning training wrapper and execution loop engine.", docs: "https://pytorch.org" },
  { name: "Llama 3.3 / Gemma 2", category: "AI Layer", version: "Llama-3.3-8B", status: "connected", desc: "Large Language Models serving journal summaries and therapist tasks.", docs: "https://huggingface.co" },
  { name: "OpenSMILE + wav2vec2", category: "AI Layer", version: "v2.3.0", status: "connected", desc: "Voice feature synthesis, extracting speech pitch and energy rates.", docs: "https://github.com/audeering/opensmile" },
  { name: "Stable Baselines3", category: "AI Layer", version: "v2.3.2", status: "connected", desc: "Reinforcement learning policy bandit determining Recovery actions.", docs: "https://stable-baselines3.readthedocs.io" },
  { name: "SHAP / LIME", category: "AI Layer", version: "v0.45.1", status: "connected", desc: "Feature attribution framework mapping biomarker values to score outcomes.", docs: "https://github.com/shap/shap" },

  // INFRASTRUCTURE
  { name: "Kafka", category: "Infrastructure", version: "v3.7.0", status: "connected", desc: "Ingestion queue pipeline storing high frequency mobile events.", docs: "https://kafka.apache.org" },
  { name: "Feast", category: "Infrastructure", version: "v0.37.0", status: "connected", desc: "Feature store serving training pipelines and inference targets.", docs: "https://feast.dev" },
  { name: "Prometheus + Grafana", category: "Infrastructure", version: "v2.52", status: "connected", desc: "Cluster metric reporting, latency checks, and container logs.", docs: "https://prometheus.io" },
];

export default function TechStackExplorer() {
  const t = useTranslations("techStack");
  const [expandedCat, setExpandedCat] = useState<string | null>("Frontend");
  const [selectedTech, setSelectedTech] = useState<TechItem | null>(null);

  const categories = Array.from(new Set(techItems.map((item) => item.category)));

  const toggleCat = (cat: string) => {
    setExpandedCat(expandedCat === cat ? null : cat);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "connected": return "bg-emerald-500 text-emerald-400 border-emerald-500/20";
      case "degraded": return "bg-amber-500 text-amber-400 border-amber-500/20";
      default: return "bg-zinc-600 text-zinc-400 border-zinc-500/20";
    }
  };

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-5 h-full justify-between">
      {/* Title */}
      <div>
        <h3 className="text-display font-extrabold text-lg text-white">
          {t("title")}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Full stack system architecture status · 27 deployable dependencies
        </p>
      </div>

      {/* Accordion Categories */}
      <div className="flex-1 overflow-y-auto max-h-[360px] space-y-2 pr-1 scrollbar-thin">
        {categories.map((cat) => {
          const isExpanded = expandedCat === cat;
          const items = techItems.filter((i) => i.category === cat);

          return (
            <div key={cat} className="border border-white/5 rounded-2xl overflow-hidden bg-white/5">
              <button
                onClick={() => toggleCat(cat)}
                className="w-full px-4 py-3 flex justify-between items-center text-xs font-semibold text-zinc-300 hover:text-white transition-colors"
              >
                <span>{cat} ({items.length})</span>
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              <AnimatePresence initial={false}>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: "auto" }}
                    exit={{ height: 0 }}
                    className="overflow-hidden border-t border-white/5"
                  >
                    <div className="p-3 space-y-1.5 bg-black/20">
                      {items.map((item) => (
                        <div
                          key={item.name}
                          onClick={() => setSelectedTech(item)}
                          className="flex justify-between items-center px-3 py-2 rounded-xl text-xs hover:bg-white/5 cursor-pointer transition-all border border-transparent hover:border-white/5"
                        >
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-white">{item.name}</span>
                            <span className="text-[9px] text-zinc-500 font-mono">{item.version}</span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded-full text-[8px] font-bold font-mono uppercase border ${getStatusColor(item.status)}`}>
                              {item.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      {/* Tech Info Sheet (Opens when item is clicked) */}
      <AnimatePresence>
        {selectedTech && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="border border-white/10 bg-zinc-900/80 backdrop-blur-md rounded-2xl p-4 flex flex-col gap-3 relative mt-2"
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="text-xs font-bold text-white flex items-center gap-2">
                  {selectedTech.name}
                  <span className="text-[9px] text-zinc-500 font-mono">{selectedTech.version}</span>
                </h4>
                <p className="text-[9px] text-zinc-500 font-mono mt-0.5 capitalize">Layer: {selectedTech.category}</p>
              </div>
              <button
                onClick={() => setSelectedTech(null)}
                className="text-[9px] text-zinc-500 hover:text-white font-semibold font-mono"
              >
                Close
              </button>
            </div>

            <p className="text-[10px] text-zinc-400 leading-relaxed">{selectedTech.desc}</p>

            <div className="flex items-center justify-between border-t border-white/5 pt-2.5 mt-1">
              <span className="text-[9px] text-emerald-400 flex items-center gap-1 font-mono">
                <CheckCircle size={10} /> Active health ping: 2ms
              </span>

              <a
                href={selectedTech.docs}
                target="_blank"
                rel="noreferrer"
                className="text-[9px] text-purple-400 hover:text-purple-300 flex items-center gap-1 font-mono transition-colors"
              >
                Docs <LinkIcon size={10} />
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
