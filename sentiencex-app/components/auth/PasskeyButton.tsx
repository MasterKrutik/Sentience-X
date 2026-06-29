"use client";
import { useState } from "react";
import { Fingerprint } from "lucide-react";
import { motion } from "framer-motion";

interface PasskeyButtonProps {
  onSuccess: () => void;
}

export default function PasskeyButton({ onSuccess }: PasskeyButtonProps) {
  const [status, setStatus] = useState<"idle" | "scanning" | "success" | "error">("idle");

  const startScan = async () => {
    if (status === "scanning" || status === "success") return;
    setStatus("scanning");

    // Simulate WebAuthn credentials verification
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    // Simulate enclave verification success
    setStatus("success");
    setTimeout(() => {
      onSuccess();
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-6">
      {/* Scanner Wrapper */}
      <button
        onClick={startScan}
        disabled={status === "scanning" || status === "success"}
        className="relative w-32 h-32 rounded-full glass border border-white/10 flex items-center justify-center cursor-pointer transition-all duration-300 hover:scale-105 active:scale-95 group focus:outline-none"
        style={{
          boxShadow: status === "scanning" 
            ? "0 0 30px oklch(72% 0.19 200 / 0.5)" 
            : status === "success"
            ? "0 0 30px oklch(72% 0.18 150 / 0.5)"
            : "0 0 15px rgba(255,255,255,0.02)"
        }}
      >
        {/* Animated scan line */}
        {status === "scanning" && (
          <motion.div
            initial={{ top: "0%" }}
            animate={{ top: "100%" }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            className="absolute left-0 right-0 h-1 bg-cyan-400 opacity-60 pointer-events-none shadow-[0_0_10px_oklch(72% 0.19 200)]"
          />
        )}

        {/* Pulse rings */}
        {(status === "scanning" || status === "success") && (
          <span 
            className={`absolute inset-[-4px] rounded-full border ${
              status === "success" 
                ? "border-emerald-500/40 animate-pulse-ring" 
                : "border-cyan-500/40 animate-pulse-ring"
            }`} 
          />
        )}

        <Fingerprint 
          size={56} 
          className={`transition-colors duration-300 ${
            status === "scanning" 
              ? "text-cyan-400" 
              : status === "success"
              ? "text-emerald-400"
              : "text-zinc-400 group-hover:text-purple-400"
          }`}
        />
      </button>

      {/* Dynamic Status Text */}
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide uppercase font-mono">
          {status === "idle" && "Biometric Sign-in Ready"}
          {status === "scanning" && "Scanning Face / Fingerprint..."}
          {status === "success" && "Access Granted"}
        </p>
        <p className="text-[10px] text-zinc-500 mt-1 font-mono">
          {status === "idle" && "Click scanner to authenticate via Passkey"}
          {status === "scanning" && "Verifying secure enclave signature..."}
          {status === "success" && "Redirecting to Dashboard..."}
        </p>
      </div>
    </div>
  );
}
