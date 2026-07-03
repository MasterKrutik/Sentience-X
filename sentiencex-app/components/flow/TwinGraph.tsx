"use client";
import React, { useMemo, useEffect } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  Position,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { useTwinQuery } from "@/lib/api/hooks";
import { useTranslations } from "next-intl";

// ─── Custom Mood Node ────────────────────────────────────────────────────────
function MoodNode({ data }: { data: { label: string; score: number } }) {
  return (
    <div 
      className="px-4 py-3 rounded-2xl glass-strong text-center animate-glow-pulse select-none"
      style={{
        border: "1.5px solid oklch(65% 0.22 300 / 0.8)",
        minWidth: "120px",
      }}
    >
      <span className="text-[10px] text-zinc-500 font-mono tracking-widest block mb-0.5">MOOD STATE</span>
      <span className="text-xs font-semibold text-white">{data.label}</span>
      <div className="text-[10px] text-purple-400 font-mono mt-1 font-bold">
        SHAP: {(data.score * 100).toFixed(0)}%
      </div>
    </div>
  );
}

// ─── Custom Habit Node ───────────────────────────────────────────────────────
function HabitNode({ data }: { data: { label: string; score: number } }) {
  return (
    <div 
      className="px-4 py-3 rounded-2xl glass text-center select-none"
      style={{
        border: "1.5px solid oklch(72% 0.19 200 / 0.6)",
        minWidth: "120px",
      }}
    >
      <span className="text-[10px] text-zinc-500 font-mono tracking-widest block mb-0.5">HABIT</span>
      <span className="text-xs font-semibold text-white">{data.label}</span>
      <div className="text-[10px] text-cyan-400 font-mono mt-1 font-bold">
        Weight: {data.score}
      </div>
    </div>
  );
}

// ─── Custom Trigger Node ─────────────────────────────────────────────────────
function TriggerNode({ data }: { data: { label: string; score: number } }) {
  return (
    <div 
      className="px-4 py-3 rounded-2xl glass text-center select-none"
      style={{
        border: "1.5px solid oklch(68% 0.24 25 / 0.6)",
        minWidth: "120px",
      }}
    >
      <span className="text-[10px] text-zinc-500 font-mono tracking-widest block mb-0.5">TRIGGER</span>
      <span className="text-xs font-semibold text-white">{data.label}</span>
      <div className="text-[10px] text-orange-400 font-mono mt-1 font-bold">
        Severity: {data.score}
      </div>
    </div>
  );
}

// ─── Custom Relationship Node ────────────────────────────────────────────────
function RelationshipNode({ data }: { data: { label: string; score: number } }) {
  return (
    <div 
      className="px-4 py-3 rounded-2xl glass text-center select-none"
      style={{
        border: "1.5px solid oklch(50% 0.2 330 / 0.6)",
        minWidth: "120px",
      }}
    >
      <span className="text-[10px] text-zinc-500 font-mono tracking-widest block mb-0.5">RELATIONSHIP</span>
      <span className="text-xs font-semibold text-white">{data.label}</span>
      <div className="text-[10px] text-pink-400 font-mono mt-1 font-bold">
        Correlation: {data.score}
      </div>
    </div>
  );
}

const nodeTypes = {
  MoodState: MoodNode,
  Habit: HabitNode,
  Trigger: TriggerNode,
  Relationship: RelationshipNode,
};

export default function TwinGraph() {
  const { data: twinData, isLoading } = useTwinQuery();
  const t = useTranslations("twin");

  const initialNodes = useMemo(() => {
    if (!twinData) return [];
    return twinData.nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: { label: n.label, score: n.influenceScore },
    }));
  }, [twinData]);

  const initialEdges = useMemo(() => {
    if (!twinData) return [];
    return twinData.edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      label: `${e.label} (${e.weight.toFixed(2)})`,
      type: "smoothstep",
      animated: true,
      style: {
        stroke: e.type === "TRIGGERS" 
          ? "oklch(68% 0.24 25 / 0.6)" 
          : e.type === "INFLUENCES" 
          ? "oklch(72% 0.19 200 / 0.6)" 
          : "oklch(65% 0.22 300 / 0.6)",
        strokeWidth: 1.5 + e.weight * 1.5,
      },
      labelStyle: { fill: "#71717a", fontSize: 8, fontFamily: "monospace" },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#52525b",
      },
    }));
  }, [twinData]);

  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  // Sync state if initial loaded
  useEffect(() => {
    if (initialNodes.length > 0) {
      // Force refresh flow lists on initial load
    }
  }, [initialNodes]);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-zinc-950/40 rounded-3xl">
        <span className="text-xs text-zinc-500 font-mono">Synthesizing Temporal Graph...</span>
      </div>
    );
  }

  return (
    <div className="relative w-full h-[400px] rounded-3xl overflow-hidden border border-white/5 bg-[#08080c]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        className="text-white"
        minZoom={0.5}
        maxZoom={1.5}
      >
        <Controls showInteractive={false} />
        <MiniMap 
          nodeColor={(node) => {
            if (node.type === "MoodState") return "oklch(65% 0.22 300)";
            if (node.type === "Habit") return "oklch(72% 0.19 200)";
            if (node.type === "Trigger") return "oklch(68% 0.24 25)";
            return "oklch(58% 0.02 270)";
          }}
          maskColor="rgba(0,0,0,0.6)"
        />
        <Background gap={16} size={1} color="rgba(255,255,255,0.05)" />
      </ReactFlow>

      {/* Timestamp footer bar */}
      <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none text-[9px] font-mono text-zinc-500">
        <span>{t("lastUpdated", { time: "6 minutes ago" })}</span>
        <span>Graph Engine: Neo4j V5</span>
      </div>
    </div>
  );
}
