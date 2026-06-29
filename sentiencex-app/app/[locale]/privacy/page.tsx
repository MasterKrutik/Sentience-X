"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useUi, useAuth } from "@/lib/store";
import { useTranslations } from "next-intl";
import { Shield, Download, Trash, Key, Eye, HelpCircle, ToggleLeft, ToggleRight, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PrivacyPage() {
  const { sidebarOpen } = useUi();
  const { user } = useAuth();
  const t = useTranslations("privacy");

  // Consent states
  const [permissions, setPermissions] = useState([
    { id: "voice", label: "Voice Biomarkers", purpose: "Tone, prosody & pause-frequency assessment", impact: "High impact on crisis rating accuracy (-23% without it)", allowed: true },
    { id: "keyboard", label: "Keyboard Metrics", purpose: "Typing speed, response intervals & keystroke pressure rates", impact: "Medium impact on anxiety indicators (-12%)", allowed: true },
    { id: "gps", label: "GPS Telemetry", purpose: "Movement radius tracking and social homebound indicators", impact: "High impact on depressive withdrawal mapping (-18%)", allowed: true },
    { id: "appUse", label: "App Entropy & Usages", purpose: "Switching frequency & total screen sessions duration", impact: "Low impact on burnout predictions (-5%)", allowed: false },
  ]);

  const [federated, setFederated] = useState(true);
  const [epsilon, setEpsilon] = useState(0.1);
  const [downloading, setDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const togglePermission = (id: string) => {
    setPermissions(permissions.map(p => p.id === id ? { ...p, allowed: !p.allowed } : p));
  };

  const handleDownload = async () => {
    setDownloading(true);
    setDownloadSuccess(false);
    // Simulate Celery background task
    await new Promise((r) => setTimeout(r, 2000));
    setDownloading(false);
    setDownloadSuccess(true);
    setTimeout(() => setDownloadSuccess(false), 3000);
  };

  const handleDeleteTwin = async () => {
    setDeleting(true);
    await new Promise((r) => setTimeout(r, 1500));
    setDeleting(false);
    setDeleteConfirm(true);
  };

  // Mock PostgreSQL Audit logs
  const auditLogs = [
    { accessor: "PydanticAI Coach agent", action: "Querying mood state graph embeddings", time: "Just now", status: "Authorized" },
    { accessor: "FastAPI Sensor Gateway", action: "Ingesting voice prosody parameters", time: "15m ago", status: "Authorized" },
    { accessor: "Dr. Priya Patel (Therapist)", action: "Retrieving crisis rating timeline", time: "2h ago", status: "Authorized" },
    { accessor: "TimescaleDB Cron", action: "Pruning raw GPS telemetry nodes", time: "1d ago", status: "Authorized" },
  ];

  return (
    <div className="min-h-screen bg-sx-void text-white flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? "240px" : "80px" }}
      >
        <Header />
        <main className="p-6 mt-16 space-y-6 max-w-5xl mx-auto w-full">
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Left 2 Cols: Privacy Controls */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Consent manager */}
              <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
                <div>
                  <h3 className="text-display font-extrabold text-lg text-white">
                    {t("consentManager")}
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Differential Consent: Grant or revoke biomarker collection independently.
                  </p>
                </div>

                <div className="space-y-3">
                  {permissions.map((perm) => (
                    <div 
                      key={perm.id}
                      className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-start gap-4 hover:border-white/10 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-white">{perm.label}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">Purpose: {perm.purpose}</span>
                        </div>
                        <p className="text-[10px] text-zinc-400 mt-1">{perm.impact}</p>
                      </div>

                      <button
                        onClick={() => togglePermission(perm.id)}
                        className="text-purple-400 hover:text-purple-300 transition-colors flex-shrink-0"
                      >
                        {perm.allowed ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-zinc-600" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Federated & DP */}
              <div className="glass rounded-3xl p-6 border border-white/5 space-y-5">
                <div>
                  <h3 className="text-display font-extrabold text-lg text-white">
                    Privacy Budgeting
                  </h3>
                  <p className="text-xs text-zinc-500 mt-1">
                    Calibrate noise injections and federated constraints.
                  </p>
                </div>

                {/* Federated Toggle */}
                <div className="p-3.5 bg-white/5 border border-white/5 rounded-2xl flex justify-between items-center gap-4">
                  <div>
                    <span className="text-xs font-semibold text-white">{t("federatedLearning")}</span>
                    <p className="text-[10px] text-zinc-500 mt-0.5">{t("federatedDesc")}</p>
                  </div>
                  <button onClick={() => setFederated(!federated)} className="text-purple-400">
                    {federated ? <ToggleRight size={28} /> : <ToggleLeft size={28} className="text-zinc-600" />}
                  </button>
                </div>

                {/* Differential Privacy Slider */}
                <div className="p-4 bg-white/5 border border-white/5 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-xs font-semibold text-white">{t("differentialPrivacy")}</span>
                      <p className="text-[10px] text-zinc-500 mt-0.5">{t("dpDesc")}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-purple-400">ε = {epsilon}</span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.0"
                    step="0.1"
                    value={epsilon}
                    onChange={(e) => setEpsilon(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  />
                  <div className="flex justify-between text-[8px] font-mono text-zinc-500">
                    <span>Highest Privacy (0.1)</span>
                    <span>Highest Model Accuracy (1.0)</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Right 1 Col: Data Actions & Access Audit log */}
            <div className="space-y-6">
              
              {/* My Data download & deletion */}
              <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
                <h3 className="text-display font-extrabold text-sm text-white">Data Management</h3>

                {/* Download */}
                <button
                  onClick={handleDownload}
                  disabled={downloading}
                  className="w-full bg-white/5 border border-white/5 hover:border-white/15 text-white rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                >
                  {downloading ? (
                    "Processing task..."
                  ) : downloadSuccess ? (
                    <span className="text-emerald-400 flex items-center gap-1"><Check size={14} /> ZIP Export Ready</span>
                  ) : (
                    <>
                      <Download size={14} /> {t("downloadAll")}
                    </>
                  )}
                </button>

                {/* Delete */}
                <div className="border-t border-white/5 pt-4 space-y-3">
                  <button
                    onClick={handleDeleteTwin}
                    disabled={deleting || deleteConfirm}
                    className="w-full bg-red-950/20 border border-red-500/20 hover:bg-red-950/40 text-red-300 rounded-xl py-2.5 text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition-all"
                  >
                    <Trash size={14} />
                    {deleteConfirm ? "Twin Flagged for Deletion" : t("deleteTwin")}
                  </button>
                  <p className="text-[9px] text-zinc-500 text-center leading-normal">
                    {t("deleteDesc")}
                  </p>
                </div>
              </div>

              {/* Data Access Audit Log */}
              <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
                <h3 className="text-display font-extrabold text-sm text-white">{t("accessLog")}</h3>
                
                <div className="space-y-3">
                  {auditLogs.map((log, idx) => (
                    <div key={idx} className="border-b border-white/5 pb-2.5 last:border-b-0 last:pb-0">
                      <div className="flex justify-between items-start gap-2">
                        <span className="text-[10px] font-semibold text-white truncate max-w-[120px]">{log.accessor}</span>
                        <span className="text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-mono font-bold">
                          {log.status}
                        </span>
                      </div>
                      <p className="text-[9px] text-zinc-500 mt-1">{log.action}</p>
                      <p className="text-[8px] text-zinc-600 font-mono mt-0.5">{log.time}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
