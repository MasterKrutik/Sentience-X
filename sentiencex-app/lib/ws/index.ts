"use client";
import { useEffect, useRef, useCallback } from "react";
import { useStore } from "@/lib/store";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws";
const RECONNECT_DELAY = 3000;
const MAX_RECONNECT_ATTEMPTS = 10;

type MessageHandler = (data: Record<string, unknown>) => void;

const handlers: Map<string, MessageHandler[]> = new Map();

let wsInstance: WebSocket | null = null;
let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
let reconnectAttempts = 0;

function connect() {
  if (typeof window === "undefined") return;

  const setWsStatus = useStore.getState().setWsStatus;
  const setLastMessage = useStore.getState().setLastMessage;
  const addAlert = useStore.getState().addAlert;
  const setCrisisScore = useStore.getState().setCrisisScore;
  const updateBiomarker = useStore.getState().updateBiomarker;

  try {
    setWsStatus("connecting");
    wsInstance = new WebSocket(WS_URL);

    wsInstance.onopen = () => {
      setWsStatus("connected");
      reconnectAttempts = 0;
      console.log("[WS] Connected to SentienceX stream");
    };

    wsInstance.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as Record<string, unknown>;
        setLastMessage(data);

        // Route messages
        const type = data.type as string;
        
        if (type === "biomarker_update") {
          const payload = data.payload as { signal: string; current: number; delta: number };
          updateBiomarker(payload.signal, { current: payload.current, delta: payload.delta });
        }

        if (type === "crisis_score") {
          const score = data.score as number;
          setCrisisScore(score);
          if (score > 90) {
            addAlert({
              id: `crisis_${Date.now()}`,
              type: "crisis",
              message: `Crisis threshold exceeded: Score ${score}/100`,
              timestamp: "Just now",
              acknowledged: false,
            });
          }
        }

        // Fire registered handlers
        const typeHandlers = handlers.get(type) || [];
        typeHandlers.forEach((h) => h(data));
        const allHandlers = handlers.get("*") || [];
        allHandlers.forEach((h) => h(data));
      } catch (err) {
        console.error("[WS] Parse error:", err);
      }
    };

    wsInstance.onclose = () => {
      setWsStatus("disconnected");
      wsInstance = null;
      scheduleReconnect();
    };

    wsInstance.onerror = () => {
      setWsStatus("disconnected");
    };
  } catch {
    setWsStatus("disconnected");
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;
  reconnectAttempts++;
  reconnectTimer = setTimeout(() => {
    connect();
  }, RECONNECT_DELAY * Math.min(reconnectAttempts, 5));
}

// Mock WebSocket simulation for demo (since no real backend)
function startMockStream() {
  const store = useStore.getState();
  
  // Simulate biomarker updates every 30s
  const bioInterval = setInterval(() => {
    const biomarkers = useStore.getState().biomarkers;
    const randomBiomarker = biomarkers[Math.floor(Math.random() * biomarkers.length)];
    const variation = (Math.random() - 0.5) * 0.05;
    useStore.getState().updateBiomarker(randomBiomarker.signal, {
      current: Number((randomBiomarker.current * (1 + variation)).toFixed(2)),
    });
  }, 30000);

  // Simulate system status
  store.setWsStatus("connected");

  return () => {
    clearInterval(bioInterval);
  };
}

export function useWebSocket() {
  const cleanupRef = useRef<(() => void) | null>(null);
  const wsStatus = useStore((s) => s.wsStatus);

  useEffect(() => {
    // Start mock stream for demo
    cleanupRef.current = startMockStream();

    return () => {
      if (cleanupRef.current) cleanupRef.current();
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (wsInstance) wsInstance.close();
    };
  }, []);

  const subscribe = useCallback((type: string, handler: MessageHandler) => {
    if (!handlers.has(type)) handlers.set(type, []);
    handlers.get(type)!.push(handler);
    return () => {
      const arr = handlers.get(type) || [];
      const idx = arr.indexOf(handler);
      if (idx !== -1) arr.splice(idx, 1);
    };
  }, []);

  const send = useCallback((data: Record<string, unknown>) => {
    if (wsInstance?.readyState === WebSocket.OPEN) {
      wsInstance.send(JSON.stringify(data));
    }
  }, []);

  return { wsStatus, subscribe, send };
}
