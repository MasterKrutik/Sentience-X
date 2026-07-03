"use client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useStore } from "@/lib/store";
import type { BiomarkerReading, TwinNode, TwinEdge } from "@/lib/store";

// ── Mock API functions (replace with real FastAPI endpoints) ──────────────────
const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 300 + Math.random() * 200));
  
  // Return mock data based on path
  throw new Error(`Mock: ${path}`); // Will be caught and handled with mock data
}

// ── Crisis Score ──────────────────────────────────────────────────────────────
export function useCrisisScore() {
  const crisisScore = useStore((s) => s.crisisScore);
  return useQuery({
    queryKey: ["crisisScore"],
    queryFn: async () => {
      return {
        score: crisisScore,
        level: crisisScore > 90 ? "crisis" : crisisScore > 75 ? "at-risk" : "healthy",
        trend: -8,
        updatedAt: "4 minutes ago",
        model: "XGBoost + Temporal Transformer",
        breakdown: {
          behavior: 0.68,
          subjective: 0.72,
          voice: 0.81,
          questionnaire: 0.65,
        },
      };
    },
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 5 * 60 * 1000, // 5 minutes
  });
}

// ── Biomarkers ────────────────────────────────────────────────────────────────
export function useBiomarkersQuery() {
  const biomarkers = useStore((s) => s.biomarkers);
  return useQuery({
    queryKey: ["biomarkers"],
    queryFn: async (): Promise<BiomarkerReading[]> => biomarkers,
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ── Mental Twin ───────────────────────────────────────────────────────────────
export function useTwinQuery() {
  const { nodes, edges } = useStore((s) => ({ nodes: s.nodes, edges: s.edges }));
  return useQuery({
    queryKey: ["twin"],
    queryFn: async (): Promise<{ nodes: TwinNode[]; edges: TwinEdge[] }> => ({ nodes, edges }),
    staleTime: 5 * 60 * 1000,
  });
}

// ── Recovery Plan ─────────────────────────────────────────────────────────────
export interface RecoveryAction {
  id: string;
  emoji: string;
  title: string;
  description: string;
  duration: string;
  category: string;
  completed: boolean;
  rlReward: number;
}

export function useRecoveryPlan() {
  return useQuery({
    queryKey: ["recoveryPlan"],
    queryFn: async (): Promise<{
      actions: RecoveryAction[];
      rewardPoints: number;
      coachMessage: string;
    }> => ({
      actions: [
        {
          id: "r1",
          emoji: "🧘",
          title: "10-min Guided Meditation",
          description: "A body-scan session calibrated to your current sleep deficit and stress pattern.",
          duration: "10 min",
          category: "Mindfulness",
          completed: false,
          rlReward: 0.82,
        },
        {
          id: "r2",
          emoji: "🎵",
          title: "Focus Playlist",
          description: "Curated 528Hz binaural beats matched to your cortisol rhythm today.",
          duration: "25 min",
          category: "Sensory",
          completed: true,
          rlReward: 0.65,
        },
        {
          id: "r3",
          emoji: "📞",
          title: "Call a Friend",
          description: "Suggested contact: Priya (last contact: 4 days ago). Social reconnection boosts your recovery by avg 0.23 points.",
          duration: "15 min",
          category: "Social",
          completed: false,
          rlReward: 0.91,
        },
      ],
      rewardPoints: 12,
      coachMessage: "Hey Arjun — I noticed you've been running on reduced sleep for 5 days. Your GPS radius has shrunk, and your typing cadence has slowed. This isn't a crisis — it's a signal. Today's plan is intentionally light: 10 minutes of stillness, your playlist, and one human connection. That's enough. I'm watching, and I'm with you.",
    }),
    staleTime: 6 * 60 * 60 * 1000,
  });
}

// ── Daily Questions ───────────────────────────────────────────────────────────
export interface DailyQuestion {
  id: string;
  text: string;
  category: "Social" | "Motivation" | "Cognitive" | "Burnout" | "Anxiety" | "Withdrawal";
  answer: number | null; // 1-5 Likert
}

export function useDailyQuestions() {
  return useQuery({
    queryKey: ["dailyQuestions"],
    queryFn: async (): Promise<DailyQuestion[]> => [
      { id: "q1", text: "How much energy do you have compared to your usual self today?", category: "Motivation", answer: 2 },
      { id: "q2", text: "Did you reach out to a friend or family member today?", category: "Social", answer: 1 },
      { id: "q3", text: "How difficult was it to concentrate on tasks today?", category: "Cognitive", answer: 4 },
      { id: "q4", text: "Do you feel a sense of dread or anxiety about tomorrow?", category: "Anxiety", answer: 3 },
      { id: "q5", text: "How many times did you choose to stay alone rather than engage socially?", category: "Withdrawal", answer: null },
      { id: "q6", text: "Are you finding enjoyment in activities you normally like?", category: "Motivation", answer: 2 },
      { id: "q7", text: "How overwhelmed do you feel by your responsibilities right now?", category: "Burnout", answer: 4 },
      { id: "q8", text: "Rate how present and clear-headed you feel in conversations.", category: "Cognitive", answer: null },
      { id: "q9", text: "Have you been avoiding messages or calls today?", category: "Social", answer: null },
      { id: "q10", text: "How does your body feel compared to your baseline energy level?", category: "Burnout", answer: null },
    ],
    staleTime: 24 * 60 * 60 * 1000,
  });
}

export function useSubmitAnswer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ questionId, answer }: { questionId: string; answer: number }) => {
      await new Promise((r) => setTimeout(r, 150));
      return { success: true };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["dailyQuestions"] });
    },
  });
}

// ── Voice Analysis ────────────────────────────────────────────────────────────
export function useVoiceAnalysis() {
  return useQuery({
    queryKey: ["voiceAnalysis"],
    queryFn: async () => ({
      metrics: [
        { name: "Pause Freq", value: 72, max: 100 },
        { name: "Pitch Variance", value: 58, max: 100 },
        { name: "Speech Rate", value: 81, max: 100 },
        { name: "Energy", value: 64, max: 100 },
        { name: "Emotion", value: 47, max: 100 },
        { name: "Silence Ratio", value: 38, max: 100 },
      ],
      trend: [
        { day: "Mon", score: 0.78 },
        { day: "Tue", score: 0.74 },
        { day: "Wed", score: 0.71 },
        { day: "Thu", score: 0.68 },
        { day: "Fri", score: 0.65 },
        { day: "Sat", score: 0.62 },
        { day: "Sun", score: 0.60 },
      ],
      modelChain: ["wav2vec2", "ECAPA-TDNN", "HuBERT", "OpenSMILE", "Fusion"],
      lastAnalyzed: "2 hours ago",
      recordingAvailable: true,
    }),
    staleTime: 2 * 60 * 60 * 1000,
  });
}

// ── Pipeline Status ───────────────────────────────────────────────────────────
export interface PipelineNode {
  id: string;
  label: string;
  status: "running" | "degraded" | "down";
  latencyMs: number;
  throughput: string;
  lastLog: string[];
}

export function usePipelineStatus() {
  return useQuery({
    queryKey: ["pipeline"],
    queryFn: async (): Promise<PipelineNode[]> => [
      { id: "sensors", label: "Sensors", status: "running", latencyMs: 12, throughput: "842 events/s", lastLog: ["[INFO] Accelerometer: 60Hz sampling active", "[INFO] Microphone: passive monitoring", "[INFO] GPS: low-power mode", "[INFO] Screen: lock state monitoring"] },
      { id: "kafka", label: "Kafka Stream", status: "running", latencyMs: 8, throughput: "1.2M msgs/min", lastLog: ["[INFO] Consumer lag: 0ms", "[INFO] Partitions: 12 active", "[INFO] Replication factor: 3"] },
      { id: "feast", label: "Feature Store (Feast)", status: "running", latencyMs: 45, throughput: "1.8k feat/s", lastLog: ["[INFO] Feature groups: behavior, voice, twin", "[INFO] Online store: Redis", "[INFO] Offline store: BigQuery"] },
      { id: "mlEnsemble", label: "ML Ensemble", status: "running", latencyMs: 180, throughput: "320 inf/s", lastLog: ["[INFO] XGBoost: p50=12ms", "[INFO] LSTM: p50=45ms", "[INFO] Temporal Transformer: p50=82ms", "[INFO] CatBoost: p50=18ms"] },
      { id: "fusion", label: "Fusion Layer", status: "running", latencyMs: 34, throughput: "280 fus/s", lastLog: ["[INFO] Cross-Attention: active", "[INFO] Late Fusion: active", "[INFO] GNN: 8-layer graph conv"] },
      { id: "twinEngine", label: "Twin Engine", status: "running", latencyMs: 92, throughput: "120 upd/s", lastLog: ["[INFO] Neo4j sync: OK", "[INFO] Graph delta: 3 nodes updated", "[INFO] Embedding refresh: complete"] },
      { id: "recovery", label: "Recovery Engine", status: "degraded", latencyMs: 340, throughput: "45 rec/s", lastLog: ["[WARN] RLlib policy server: high latency", "[INFO] Contextual bandit: fallback mode", "[INFO] Recovery cache: serving stale"] },
      { id: "notification", label: "Notification", status: "running", latencyMs: 22, throughput: "200 notif/s", lastLog: ["[INFO] Firebase FCM: healthy", "[INFO] APNs: healthy", "[INFO] Twilio SMS: active"] },
    ],
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
}

// ── Observability Metrics ─────────────────────────────────────────────────────
export function useObservability() {
  return useQuery({
    queryKey: ["observability"],
    queryFn: async () => ({
      apiLatency: [
        { time: "10:00", p50: 45, p95: 120, p99: 340 },
        { time: "10:05", p50: 48, p95: 128, p99: 360 },
        { time: "10:10", p50: 42, p95: 115, p99: 310 },
        { time: "10:15", p50: 55, p95: 145, p99: 420 },
        { time: "10:20", p50: 50, p95: 132, p99: 380 },
        { time: "10:25", p50: 44, p95: 118, p99: 330 },
        { time: "10:30", p50: 46, p95: 122, p99: 345 },
      ],
      mlInference: [
        { model: "XGBoost", ms: 12 },
        { model: "LSTM", ms: 45 },
        { model: "Transformer", ms: 82 },
        { model: "CatBoost", ms: 18 },
        { model: "GNN", ms: 120 },
      ],
      kafkaLag: [
        { time: "10:00", lag: 0 },
        { time: "10:05", lag: 2 },
        { time: "10:10", lag: 0 },
        { time: "10:15", lag: 8 },
        { time: "10:20", lag: 3 },
        { time: "10:25", lag: 1 },
        { time: "10:30", lag: 0 },
      ],
      stats: {
        uptime: "99.97%",
        rps: "2,847",
        errorRate: "0.03%",
        memory: "68%",
      },
    }),
    staleTime: 5 * 1000,
    refetchInterval: 5 * 1000,
  });
}

// ── Therapist Patients ────────────────────────────────────────────────────────
export interface Patient {
  id: string;
  name: string;
  crisisScore: number;
  lastSeen: string;
  trend: number;
  avatar?: string;
}

export function usePatients() {
  return useQuery({
    queryKey: ["patients"],
    queryFn: async (): Promise<Patient[]> => [
      { id: "p1", name: "Rohan Mehta", crisisScore: 92, lastSeen: "15m ago", trend: 8 },
      { id: "p2", name: "Priya Sharma", crisisScore: 78, lastSeen: "1h ago", trend: -3 },
      { id: "p3", name: "Ananya Singh", crisisScore: 81, lastSeen: "2h ago", trend: 5 },
      { id: "p4", name: "Vikram Nair", crisisScore: 45, lastSeen: "3h ago", trend: -12 },
      { id: "p5", name: "Kavya Patel", crisisScore: 62, lastSeen: "5h ago", trend: 2 },
      { id: "p6", name: "Aryan Gupta", crisisScore: 34, lastSeen: "6h ago", trend: -8 },
      { id: "p7", name: "Ishaan Das", crisisScore: 88, lastSeen: "30m ago", trend: 14 },
    ],
    staleTime: 5 * 60 * 1000,
  });
}

// ── Admin Stats ───────────────────────────────────────────────────────────────
export function useAdminStats() {
  return useQuery({
    queryKey: ["adminStats"],
    queryFn: async () => ({
      totalUsers: 48392,
      activeToday: 12847,
      avgCrisisScore: 41.2,
      alertsSent: 234,
      recoveryCompletions: 3921,
    }),
    staleTime: 60 * 1000,
  });
}
