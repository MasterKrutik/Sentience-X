"use client";
import { useState } from "react";
import { useAuth, useI18n } from "@/lib/store";
import { useTranslations } from "next-intl";
import { Globe, Shield, Sparkles, Mail, Lock, Check, Loader2, ArrowRight } from "lucide-react";
import PasskeyButton from "./PasskeyButton";
import LanguageCommand from "./LanguageCommand";
import { motion, AnimatePresence } from "framer-motion";

export default function LoginCard() {
  const t = useTranslations("auth");
  const tc = useTranslations("common");
  const { user, setUser, setRole } = useAuth();
  const { locale } = useI18n();

  const [activeTab, setActiveTab] = useState<"passkey" | "email" | "oauth">("passkey");
  const [role, setLocalRole] = useState<"individual" | "therapist" | "admin">("individual");
  const [langOpen, setLangOpen] = useState(false);

  // Form states
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);

    // Simulate login server cycle
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setLoading(false);
    setSuccess(true);
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Seed User store
    setUser({
      id: `usr_${role}_${Date.now()}`,
      name: role === "individual" ? "Arjun Sharma" : role === "therapist" ? "Dr. Priya Patel" : "System Administrator",
      email: email,
      role: role,
      crisisScore: role === "individual" ? 34 : 0,
      locale: locale,
    });
    
    // Redirect to correct dashboard
    window.location.href = `/${locale}/dashboard`;
  };

  const handleBiometricSuccess = () => {
    setUser({
      id: `usr_${role}_${Date.now()}`,
      name: role === "individual" ? "Arjun Sharma" : role === "therapist" ? "Dr. Priya Patel" : "System Administrator",
      email: "biometrics@sentiencex.ai",
      role: role,
      crisisScore: role === "individual" ? 34 : 0,
      locale: locale,
    });
    window.location.href = `/${locale}/dashboard`;
  };

  const handleOauthSignIn = async (provider: string) => {
    setLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setLoading(false);
    handleBiometricSuccess();
  };

  const trustBadges = [
    { title: t("securityTrust.aes"), desc: t("aesDesc") },
    { title: t("securityTrust.tls"), desc: t("tlsDesc") },
    { title: t("securityTrust.dpdp"), desc: t("dpdpDesc") },
    { title: t("securityTrust.e2e"), desc: t("e2eDesc") },
    { title: t("securityTrust.hipaa"), desc: t("hipaaDesc") },
  ];

  return (
    <div className="w-full max-w-md flex flex-col gap-6 relative z-10">
      {/* Role Selector Toggle */}
      <div className="flex justify-center">
        <div className="flex bg-white/5 p-1 rounded-xl border border-white/5">
          {(["individual", "therapist", "admin"] as const).map((r) => (
            <button
              key={r}
              onClick={() => setLocalRole(r)}
              className={`px-4 py-1.5 rounded-lg text-xs font-mono capitalize transition-all duration-200 ${
                role === r
                  ? "bg-purple-600/30 border border-purple-500/30 text-white font-semibold"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {r === "individual" ? t("roleIndividual") : r === "therapist" ? t("roleTherapist") : t("roleAdmin")}
            </button>
          ))}
        </div>
      </div>

      {/* Main Glass Card */}
      <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl flex flex-col gap-6 relative overflow-hidden">
        {/* App Branding */}
        <div className="text-center flex flex-col gap-2">
          <h2 className="text-display font-black text-3xl tracking-tight bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
            SentienceX
          </h2>
          <p className="text-xs text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
            {tc("tagline")}
          </p>
        </div>

        {/* Tab Headers */}
        <div className="grid grid-cols-3 bg-white/5 p-1 rounded-xl border border-white/5">
          {[
            { id: "passkey", label: t("passkey") },
            { id: "email", label: t("emailPassword") },
            { id: "oauth", label: t("oauthSocial") },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-white/10 text-white"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="min-h-[220px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {activeTab === "passkey" && (
              <motion.div
                key="passkey"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PasskeyButton onSuccess={handleBiometricSuccess} />
                <div className="text-center text-[10px] text-zinc-500 mt-2 font-mono">
                  Keycloak · WebAuthn · Secure Enclave
                </div>
              </motion.div>
            )}

            {activeTab === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <form onSubmit={handleEmailSignIn} className="flex flex-col gap-4">
                  <div className="relative">
                    <Mail size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t("email")}
                      className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500/40 transition-colors"
                    />
                  </div>

                  <div className="relative">
                    <Lock size={16} className="absolute left-3.5 top-3.5 text-zinc-500" />
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t("password")}
                      className="w-full bg-white/5 border border-white/5 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-purple-500/40 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || success}
                    className="w-full bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl py-3 text-sm font-semibold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_oklch(65% 0.22 300 / 0.3)]"
                  >
                    {loading ? (
                      <Loader2 size={18} className="animate-spin" />
                    ) : success ? (
                      <Check size={18} className="text-emerald-400" />
                    ) : (
                      <>
                        {t("signIn")} <ArrowRight size={16} />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {activeTab === "oauth" && (
              <motion.div
                key="oauth"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col gap-3"
              >
                {["Google", "GitHub", "Microsoft"].map((prov) => (
                  <button
                    key={prov}
                    onClick={() => handleOauthSignIn(prov)}
                    disabled={loading}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 rounded-xl py-2.5 text-xs text-zinc-300 font-medium transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {t("continueWith", { provider: prov })}
                  </button>
                ))}
                <div className="text-center text-[10px] text-zinc-600 mt-4 font-mono">
                  {t("poweredBy")}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Language Selector link */}
      <div className="flex justify-center">
        <button
          onClick={() => setLangOpen(true)}
          className="flex items-center gap-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          <Globe size={14} />
          {t("selectLanguage")}
        </button>
      </div>

      {/* Security Trust bar */}
      <div className="flex items-center justify-between bg-white/5 border border-white/5 rounded-2xl px-4 py-3 relative">
        {trustBadges.map((badge, idx) => (
          <div key={idx} className="group relative flex justify-center">
            <span className="text-[10px] text-zinc-500 font-mono hover:text-zinc-300 cursor-pointer select-none">
              {badge.title}
            </span>
            {/* Tooltip */}
            <div className="absolute bottom-full mb-2 w-48 scale-0 group-hover:scale-100 transition-all duration-200 z-30 origin-bottom p-2 bg-black/90 border border-white/10 rounded-xl shadow-xl text-[10px] text-zinc-300 leading-normal pointer-events-none text-center">
              {badge.desc}
            </div>
          </div>
        ))}
      </div>

      <LanguageCommand open={langOpen} setOpen={setLangOpen} />
    </div>
  );
}
