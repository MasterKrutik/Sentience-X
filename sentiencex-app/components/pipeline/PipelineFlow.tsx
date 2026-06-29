"use client";
import React, { useState, useMemo } from "react";
import ReactFlow, { Background, Position, MarkerType } from "reactflow";
import "reactflow/dist/style.css";
import { usePipelineStatus, type PipelineNode } from "@/lib/api/hooks";
import { useTranslations } from "next-intl";
import { Terminal, X, Play, RefreshCw } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Custom node rendering for the pipeline status
function PipelineStepNode({ data }: { data: { label: string; status: string; latency: number; throughput: string; onClick: () => void } }) {
  const getStatusBg = (status: string) => {
    switch (status) {
      case "running": return "border-emerald-500/50 shadow-[0_0_15px_oklch(72% 0.18 150 / 0.15)]";
      case "degraded": return "border-amber-500/50 shadow-[0_0_15px_oklch(78% 0.20 75 / 0.15)] animate-pulse";
      default: return "border-red-500/50 shadow-[0_0_15px_oklch(68% 0.24 25 / 0.15)]";
    }
  };

  const getDotColor = (status: string) => {
    switch (status) {
      case "running": return "bg-emerald-500";
      case "degraded": return "bg-amber-500";
      default: return "bg-red-500";
    }
  };

  return (
    <div
      onClick={data.onClick}
      className={`px-4 py-3 rounded-2xl glass-strong border text-left cursor-pointer transition-all duration-200 hover:scale-105 select-none ${getStatusBg(data.status)}`}
      style={{ minWidth: "140px" }}
    >
      <div className="flex justify-between items-center gap-2 mb-1.5">
        <span className="text-[10px] font-semibold text-white truncate max-w-[85px]">{data.label}</span>
        <span className={`w-2 h-2 rounded-full ${getDotColor(data.status)}`} />
      </div>

      <div className="flex flex-col gap-0.5 text-[8px] font-mono text-zinc-400">
        <span>Latency: {data.latency}ms</span>
        <span className="truncate">{data.throughput}</span>
      </div>
    </div>
  );
}

const nodeTypes = {
  pipelineStep: PipelineStepNode,
};

export default function PipelineFlow() {
  const { data: pipelineNodes, isLoading } = usePipelineStatus();
  const t = useTranslations("pipeline");
  const [selectedNode, setSelectedNode] = useState<PipelineNode | null>(null);

  const initialNodes = useMemo(() => {
    if (!pipelineNodes) return [];
    
    // Set horizontal coordinate layout sequentially
    return pipelineNodes.map((n, idx) => ({
      id: n.id,
      type: "pipelineStep",
      position: { x: idx * 170 + 40, y: 80 },
      data: {
        label: n.label,
        status: n.status,
        latency: n.latencyMs,
        throughput: n.throughput,
        onClick: () => setSelectedNode(n),
      },
    }));
  }, [pipelineNodes]);

  const initialEdges = useMemo(() => {
    if (!pipelineNodes) return [];
    const edges = [];
    for (let i = 0; i < pipelineNodes.length - 1; i++) {
      const source = pipelineNodes[i];
      const target = pipelineNodes[i + 1];
      edges.push({
        id: `e-${source.id}-${target.id}`,
        source: source.id,
        target: target.id,
        animated: source.status === "running" && target.status === "running",
        style: {
          stroke: source.status === "running" ? "oklch(72% 0.19 200 / 0.6)" : "oklch(25% 0.025 270)",
          strokeWidth: 2,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: source.status === "running" ? "#06b6d4" : "#52525b",
        },
      });
    }
    return edges;
  }, [pipelineNodes]);

  if (isLoading || initialNodes.length === 0) {
    return (
      <div className="h-60 flex items-center justify-center glass rounded-2xl">
        <span className="text-xs text-zinc-500 font-mono">Connecting to Kafka & Feast streams...</span>
      </div>
    );
  }

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-4 relative">
      {/* Title */}
      <div>
        <h3 className="text-display font-extrabold text-lg text-white">
          {t("title")}
        </h3>
        <p className="text-xs text-zinc-500 mt-1">
          Real-time ingestion lag: 8ms · Feast features online: 48
        </p>
      </div>

      {/* React Flow DAG Container */}
      <div className="relative w-full h-[220px] rounded-2xl overflow-hidden border border-white/5 bg-[#08080c] select-none">
        <ReactFlow
          nodes={initialNodes}
          edges={initialEdges}
          nodeTypes={nodeTypes}
          fitView
          className="text-white"
        >
          <Background gap={16} size={1} color="rgba(255,255,255,0.05)" />
        </ReactFlow>

        <div className="absolute top-3 right-3 text-[9px] font-mono text-zinc-500 bg-black/60 px-2.5 py-1 rounded-full border border-white/5 pointer-events-none">
          Click any step to inspect Loki live logs
        </div>
      </div>

      {/* Log Console overlay (Opens below flow on click) */}
      <AnimatePresence>
        {selectedNode && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 15 }}
            className="border border-white/5 bg-[#050508] rounded-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center border-b border-white/5 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
                <Terminal size={14} className="text-purple-400" />
                <span>{selectedNode.label} Console logs</span>
                <span className="text-[9px] bg-purple-500/10 px-2 py-0.5 rounded text-purple-400 font-mono capitalize">
                  {selectedNode.status}
                </span>
              </div>
              <button 
                onClick={() => setSelectedNode(null)}
                className="text-zinc-500 hover:text-white transition-colors"
              >
                <X size={14} />
              </button>
            </div>

            {/* Simulated log printout */}
            <div className="bg-black/40 rounded-xl p-3 max-h-40 overflow-y-auto font-mono text-[9px] text-zinc-400 space-y-1 scrollbar-thin">
              {selectedNode.lastLog.map((log, idx) => (
                <div key={idx} className="flex gap-4">
                  <span className="text-zinc-600 select-none">[{idx + 1}]</span>
                  <span>{log}</span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
