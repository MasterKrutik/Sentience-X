import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { useShallow } from "zustand/react/shallow";

// ─── Auth Slice ───────────────────────────────────────────────────────────────
export type UserRole = "individual" | "therapist" | "admin";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: UserRole;
  crisisScore: number;
  locale: string;
}

interface AuthSlice {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authMethod: "passkey" | "email" | "oauth" | null;
  setUser: (user: AuthUser) => void;
  setRole: (role: UserRole) => void;
  logout: () => void;
  setLoading: (loading: boolean) => void;
}

// ─── I18n Slice ───────────────────────────────────────────────────────────────
interface I18nSlice {
  locale: string;
  dir: "ltr" | "rtl";
  setLocale: (locale: string) => void;
}

const RTL_LOCALES = ["ur", "ks", "sd"];

// ─── Biomarker Slice ──────────────────────────────────────────────────────────
export interface BiomarkerReading {
  signal: string;
  current: number;
  baseline: number;
  delta: number;
  unit: string;
  trend: number[]; // 7-day sparkline
  shapImpact: number;
  status: "healthy" | "watch" | "alert" | "critical";
  lastUpdated: string;
}

interface BiomarkerSlice {
  biomarkers: BiomarkerReading[];
  lastSync: string | null;
  isStreaming: boolean;
  setBiomarkers: (biomarkers: BiomarkerReading[]) => void;
  updateBiomarker: (signal: string, reading: Partial<BiomarkerReading>) => void;
  setStreaming: (streaming: boolean) => void;
}

// ─── Twin Slice ───────────────────────────────────────────────────────────────
export interface TwinNode {
  id: string;
  type: "MoodState" | "Habit" | "Trigger" | "Relationship";
  label: string;
  influenceScore: number;
  lastUpdated: string;
  position: { x: number; y: number };
}

export interface TwinEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight: number; // 0.0 - 1.0
  type: "INFLUENCES" | "CORRELATES_WITH" | "TRIGGERS";
}

interface TwinSlice {
  nodes: TwinNode[];
  edges: TwinEdge[];
  selectedNodeId: string | null;
  lastUpdated: string | null;
  setTwin: (nodes: TwinNode[], edges: TwinEdge[]) => void;
  selectNode: (id: string | null) => void;
}

// ─── Alert Slice ──────────────────────────────────────────────────────────────
export interface AlertItem {
  id: string;
  type: "crisis" | "warning" | "info";
  message: string;
  timestamp: string;
  acknowledged: boolean;
}

interface AlertSlice {
  alerts: AlertItem[];
  activeCrisisAlert: AlertItem | null;
  unreadCount: number;
  addAlert: (alert: AlertItem) => void;
  acknowledgeAlert: (id: string) => void;
  dismissCrisisAlert: () => void;
  setActiveCrisis: (alert: AlertItem | null) => void;
}

// ─── WS Slice ─────────────────────────────────────────────────────────────────
interface WsSlice {
  wsStatus: "connected" | "connecting" | "disconnected";
  lastMessage: Record<string, unknown> | null;
  setWsStatus: (status: "connected" | "connecting" | "disconnected") => void;
  setLastMessage: (msg: Record<string, unknown>) => void;
}

// ─── UI Slice ─────────────────────────────────────────────────────────────────
interface UiSlice {
  sidebarOpen: boolean;
  commandOpen: boolean;
  activeNavItem: string;
  crisisScore: number;
  setSidebarOpen: (open: boolean) => void;
  setCommandOpen: (open: boolean) => void;
  setActiveNavItem: (item: string) => void;
  setCrisisScore: (score: number) => void;
}

// ─── Combined Store ───────────────────────────────────────────────────────────
type StoreState = AuthSlice & I18nSlice & BiomarkerSlice & TwinSlice & AlertSlice & WsSlice & UiSlice;

export const useStore = create<StoreState>()(
  devtools(
    persist(
      immer((set) => ({
        // Auth slice
        user: {
          id: "usr_arjun_2024",
          name: "Arjun Sharma",
          email: "arjun@sentiencex.ai",
          avatar: undefined,
          role: "individual",
          crisisScore: 34,
          locale: "en",
        },
        isAuthenticated: true,
        isLoading: false,
        authMethod: null,
        setUser: (user) => set((state) => { state.user = user; state.isAuthenticated = true; }),
        setRole: (role) => set((state) => { if (state.user) state.user.role = role; }),
        logout: () => set((state) => { state.user = null; state.isAuthenticated = false; }),
        setLoading: (loading) => set((state) => { state.isLoading = loading; }),

        // I18n slice
        locale: "en",
        dir: "ltr",
        setLocale: (locale) => set((state) => {
          state.locale = locale;
          state.dir = RTL_LOCALES.includes(locale) ? "rtl" : "ltr";
          if (state.user) state.user.locale = locale;
        }),

        // Biomarker slice
        biomarkers: [
          { signal: "typingSpeed", current: 42, baseline: 48, delta: -6, unit: "wpm", trend: [48,47,45,46,44,43,42], shapImpact: 0.18, status: "watch", lastUpdated: "2m ago" },
          { signal: "phoneUnlocks", current: 23, baseline: 18, delta: 5, unit: "/day", trend: [18,20,19,21,22,23,23], shapImpact: 0.12, status: "watch", lastUpdated: "4m ago" },
          { signal: "screenTime", current: 6.2, baseline: 4.5, delta: 1.7, unit: "hrs", trend: [4.5,4.8,5.1,5.5,5.8,6.0,6.2], shapImpact: 0.22, status: "alert", lastUpdated: "4m ago" },
          { signal: "appEntropy", current: 0.72, baseline: 0.65, delta: 0.07, unit: "", trend: [0.65,0.66,0.68,0.70,0.71,0.72,0.72], shapImpact: 0.08, status: "healthy", lastUpdated: "4m ago" },
          { signal: "sleepDuration", current: 6.2, baseline: 7.5, delta: -1.3, unit: "hrs", trend: [7.5,7.2,6.8,6.5,6.4,6.2,6.2], shapImpact: 0.31, status: "alert", lastUpdated: "8h ago" },
          { signal: "sleepConsistency", current: 0.68, baseline: 0.85, delta: -0.17, unit: "", trend: [0.85,0.82,0.78,0.74,0.71,0.68,0.68], shapImpact: 0.24, status: "alert", lastUpdated: "8h ago" },
          { signal: "walkingSteps", current: 4200, baseline: 7000, delta: -2800, unit: "steps", trend: [7000,6500,5800,5200,4800,4400,4200], shapImpact: 0.14, status: "watch", lastUpdated: "1h ago" },
          { signal: "gpsRadius", current: 1.2, baseline: 3.8, delta: -2.6, unit: "km", trend: [3.8,3.5,3.0,2.5,2.0,1.5,1.2], shapImpact: 0.19, status: "alert", lastUpdated: "1h ago" },
          { signal: "callDuration", current: 4, baseline: 15, delta: -11, unit: "min/day", trend: [15,13,11,9,7,5,4], shapImpact: 0.16, status: "alert", lastUpdated: "30m ago" },
          { signal: "speechBiomarkers", current: 0.54, baseline: 0.80, delta: -0.26, unit: "score", trend: [0.80,0.78,0.72,0.65,0.60,0.56,0.54], shapImpact: 0.28, status: "alert", lastUpdated: "2h ago" },
          { signal: "responseDelay", current: 4.2, baseline: 1.8, delta: 2.4, unit: "hrs avg", trend: [1.8,2.1,2.5,3.0,3.5,3.9,4.2], shapImpact: 0.11, status: "watch", lastUpdated: "30m ago" },
          { signal: "notificationDismissal", current: 0.82, baseline: 0.45, delta: 0.37, unit: "rate", trend: [0.45,0.50,0.58,0.65,0.72,0.78,0.82], shapImpact: 0.09, status: "watch", lastUpdated: "10m ago" },
          { signal: "socialDecline", current: 0.41, baseline: 0.10, delta: 0.31, unit: "index", trend: [0.10,0.15,0.20,0.27,0.33,0.38,0.41], shapImpact: 0.33, status: "alert", lastUpdated: "1h ago" },
        ],
        lastSync: new Date().toISOString(),
        isStreaming: true,
        setBiomarkers: (biomarkers) => set((state) => { state.biomarkers = biomarkers; state.lastSync = new Date().toISOString(); }),
        updateBiomarker: (signal, reading) => set((state) => {
          const idx = state.biomarkers.findIndex((b) => b.signal === signal);
          if (idx !== -1) Object.assign(state.biomarkers[idx], reading);
        }),
        setStreaming: (streaming) => set((state) => { state.isStreaming = streaming; }),

        // Twin slice
        nodes: [
          { id: "mood_1", type: "MoodState", label: "Low Motivation", influenceScore: 0.82, lastUpdated: "6m ago", position: { x: 300, y: 200 } },
          { id: "habit_1", type: "Habit", label: "Late Sleep", influenceScore: 0.74, lastUpdated: "8h ago", position: { x: 150, y: 350 } },
          { id: "habit_2", type: "Habit", label: "Reduced Exercise", influenceScore: 0.61, lastUpdated: "1h ago", position: { x: 450, y: 350 } },
          { id: "habit_3", type: "Habit", label: "Social Withdrawal", influenceScore: 0.79, lastUpdated: "30m ago", position: { x: 300, y: 450 } },
          { id: "trigger_1", type: "Trigger", label: "Work Deadline Stress", influenceScore: 0.88, lastUpdated: "2h ago", position: { x: 100, y: 200 } },
          { id: "trigger_2", type: "Trigger", label: "Disrupted Routine", influenceScore: 0.65, lastUpdated: "1d ago", position: { x: 500, y: 200 } },
          { id: "rel_1", type: "Relationship", label: "Family Support", influenceScore: 0.55, lastUpdated: "3d ago", position: { x: 200, y: 100 } },
          { id: "rel_2", type: "Relationship", label: "Peer Isolation", influenceScore: 0.70, lastUpdated: "1d ago", position: { x: 400, y: 100 } },
        ],
        edges: [
          { id: "e1", source: "trigger_1", target: "mood_1", label: "TRIGGERS", weight: 0.88, type: "TRIGGERS" },
          { id: "e2", source: "habit_1", target: "mood_1", label: "INFLUENCES", weight: 0.74, type: "INFLUENCES" },
          { id: "e3", source: "habit_2", target: "mood_1", label: "INFLUENCES", weight: 0.61, type: "INFLUENCES" },
          { id: "e4", source: "habit_3", target: "mood_1", label: "CORRELATES_WITH", weight: 0.79, type: "CORRELATES_WITH" },
          { id: "e5", source: "trigger_2", target: "habit_1", label: "TRIGGERS", weight: 0.65, type: "TRIGGERS" },
          { id: "e6", source: "rel_2", target: "habit_3", label: "INFLUENCES", weight: 0.70, type: "INFLUENCES" },
          { id: "e7", source: "rel_1", target: "mood_1", label: "CORRELATES_WITH", weight: 0.55, type: "CORRELATES_WITH" },
        ],
        selectedNodeId: null,
        lastUpdated: "6 minutes ago",
        setTwin: (nodes, edges) => set((state) => { state.nodes = nodes; state.edges = edges; }),
        selectNode: (id) => set((state) => { state.selectedNodeId = id; }),

        // Alert slice
        alerts: [
          { id: "a1", type: "warning", message: "Sleep score dropped below baseline for 5 consecutive days", timestamp: "2h ago", acknowledged: false },
          { id: "a2", type: "info", message: "Voice analysis complete: Slight fatigue markers detected", timestamp: "4h ago", acknowledged: true },
          { id: "a3", type: "info", message: "Recovery plan updated: New meditation recommendation", timestamp: "6h ago", acknowledged: true },
        ],
        activeCrisisAlert: null,
        unreadCount: 1,
        addAlert: (alert) => set((state) => { state.alerts.unshift(alert); state.unreadCount++; }),
        acknowledgeAlert: (id) => set((state) => {
          const a = state.alerts.find((a) => a.id === id);
          if (a) { a.acknowledged = true; state.unreadCount = Math.max(0, state.unreadCount - 1); }
        }),
        dismissCrisisAlert: () => set((state) => { state.activeCrisisAlert = null; }),
        setActiveCrisis: (alert) => set((state) => { state.activeCrisisAlert = alert; }),

        // WS slice
        wsStatus: "connected",
        lastMessage: null,
        setWsStatus: (status) => set((state) => { state.wsStatus = status; }),
        setLastMessage: (msg) => set((state) => { state.lastMessage = msg; }),

        // UI slice
        sidebarOpen: true,
        commandOpen: false,
        activeNavItem: "overview",
        crisisScore: 34,
        setSidebarOpen: (open) => set((state) => { state.sidebarOpen = open; }),
        setCommandOpen: (open) => set((state) => { state.commandOpen = open; }),
        setActiveNavItem: (item) => set((state) => { state.activeNavItem = item; }),
        setCrisisScore: (score) => set((state) => { state.crisisScore = score; if (state.user) state.user.crisisScore = score; }),
      })),
      {
        name: "sentiencex-store",
        partialize: (state) => ({
          locale: state.locale,
          dir: state.dir,
          user: state.user,
          isAuthenticated: state.isAuthenticated,
        }),
      }
    ),
    { name: "SentienceX" }
  )
);

// Selector hooks
export const useAuth = () => {
  const user = useStore((s) => s.user);
  const isAuthenticated = useStore((s) => s.isAuthenticated);
  const logout = useStore((s) => s.logout);
  const setRole = useStore((s) => s.setRole);
  const setUser = useStore((s) => s.setUser);
  return { user, isAuthenticated, logout, setRole, setUser };
};

export const useI18n = () => {
  const locale = useStore((s) => s.locale);
  const dir = useStore((s) => s.dir);
  const setLocale = useStore((s) => s.setLocale);
  return { locale, dir, setLocale };
};

export const useBiomarkers = () => {
  const biomarkers = useStore((s) => s.biomarkers);
  const lastSync = useStore((s) => s.lastSync);
  const isStreaming = useStore((s) => s.isStreaming);
  return { biomarkers, lastSync, isStreaming };
};

export const useTwin = () => {
  const nodes = useStore((s) => s.nodes);
  const edges = useStore((s) => s.edges);
  const selectedNodeId = useStore((s) => s.selectedNodeId);
  const lastUpdated = useStore((s) => s.lastUpdated);
  const selectNode = useStore((s) => s.selectNode);
  return { nodes, edges, selectedNodeId, lastUpdated, selectNode };
};

export const useAlerts = () => {
  const alerts = useStore((s) => s.alerts);
  const activeCrisisAlert = useStore((s) => s.activeCrisisAlert);
  const unreadCount = useStore((s) => s.unreadCount);
  const addAlert = useStore((s) => s.addAlert);
  const acknowledgeAlert = useStore((s) => s.acknowledgeAlert);
  const dismissCrisisAlert = useStore((s) => s.dismissCrisisAlert);
  return { alerts, activeCrisisAlert, unreadCount, addAlert, acknowledgeAlert, dismissCrisisAlert };
};

export const useUi = () => {
  const sidebarOpen = useStore((s) => s.sidebarOpen);
  const commandOpen = useStore((s) => s.commandOpen);
  const activeNavItem = useStore((s) => s.activeNavItem);
  const crisisScore = useStore((s) => s.crisisScore);
  const setSidebarOpen = useStore((s) => s.setSidebarOpen);
  const setCommandOpen = useStore((s) => s.setCommandOpen);
  const setActiveNavItem = useStore((s) => s.setActiveNavItem);
  const setCrisisScore = useStore((s) => s.setCrisisScore);
  return { sidebarOpen, commandOpen, activeNavItem, crisisScore, setSidebarOpen, setCommandOpen, setActiveNavItem, setCrisisScore };
};

export const useWs = () => {
  const wsStatus = useStore((s) => s.wsStatus);
  const lastMessage = useStore((s) => s.lastMessage);
  return { wsStatus, lastMessage };
};
