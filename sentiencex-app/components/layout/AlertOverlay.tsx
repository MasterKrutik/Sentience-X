"use client";
import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useAlerts } from "@/lib/store";
import { AlertTriangle, Phone, X } from "lucide-react";

export default function AlertOverlay() {
  const { activeCrisisAlert, dismissCrisisAlert } = useAlerts();
  const countdownRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (activeCrisisAlert) {
      countdownRef.current = setTimeout(() => {
        dismissCrisisAlert();
      }, 10000);
    }
    return () => {
      if (countdownRef.current) clearTimeout(countdownRef.current);
    };
  }, [activeCrisisAlert, dismissCrisisAlert]);

  return (
    <AnimatePresence>
      {activeCrisisAlert && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.85)", backdropFilter: "blur(12px)" }}
        >
          {/* Radial pulse waves */}
          {[1, 2, 3].map((i) => (
            <motion.div
              key={i}
              className="absolute rounded-full border-2"
              style={{ borderColor: "oklch(68% 0.24 25 / 0.4)" }}
              initial={{ width: 200, height: 200, opacity: 0.8 }}
              animate={{ width: 800, height: 800, opacity: 0 }}
              transition={{ duration: 3, delay: i * 0.8, repeat: Infinity, ease: "easeOut" }}
            />
          ))}

          {/* Alert card */}
          <motion.div
            initial={{ scale: 0.8, y: 40 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.8, y: 40 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="relative glass-strong rounded-3xl p-10 max-w-lg w-full mx-4 text-center"
            style={{ border: "1px solid oklch(68% 0.24 25 / 0.5)", boxShadow: "0 0 60px oklch(68% 0.24 25 / 0.4)" }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: "oklch(68% 0.24 25 / 0.15)", border: "2px solid oklch(68% 0.24 25 / 0.5)" }}
              >
                <AlertTriangle size={40} style={{ color: "oklch(68% 0.24 25)" }} />
              </motion.div>
            </div>

            {/* Title */}
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.75rem", color: "oklch(68% 0.24 25)", marginBottom: "0.75rem" }}>
              Crisis Alert
            </h2>

            {/* Message */}
            <p style={{ color: "oklch(92% 0.01 270)", marginBottom: "1.5rem", lineHeight: 1.6 }}>
              {activeCrisisAlert.message}
            </p>

            {/* Helpline */}
            <div
              className="flex items-center justify-center gap-3 rounded-2xl p-4 mb-6"
              style={{ background: "oklch(65% 0.22 300 / 0.1)", border: "1px solid oklch(65% 0.22 300 / 0.3)" }}
            >
              <Phone size={18} style={{ color: "oklch(65% 0.22 300)" }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", color: "oklch(65% 0.22 300)", fontWeight: 500 }}>
                iCall Helpline: 9152987821
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={dismissCrisisAlert}
                className="flex-1 rounded-xl py-3 font-semibold transition-all"
                style={{
                  background: "oklch(68% 0.24 25)",
                  color: "white",
                  fontFamily: "'DM Sans', sans-serif",
                  fontSize: "0.9rem",
                }}
              >
                Acknowledge
              </button>
              <button
                onClick={dismissCrisisAlert}
                className="w-12 rounded-xl flex items-center justify-center"
                style={{ background: "oklch(25% 0.025 270)", color: "oklch(58% 0.02 270)" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Auto-dismiss text */}
            <p style={{ marginTop: "1rem", fontSize: "0.75rem", color: "oklch(58% 0.02 270)" }}>
              Auto-dismisses in 10 seconds if not acknowledged
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
