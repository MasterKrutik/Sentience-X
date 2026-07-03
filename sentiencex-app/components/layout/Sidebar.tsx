"use client";
import { usePathname, useRouter } from "next/navigation";
import { useAuth, useI18n, useUi } from "@/lib/store";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { 
  Home, Brain, BarChart3, Mic, HelpCircle, Activity, 
  BookOpen, Bell, Shield, Settings, Users, ShieldAlert,
  ChevronLeft, ChevronRight, LogOut, Globe
} from "lucide-react";
import { useState } from "react";
import LanguageCommand from "@/components/auth/LanguageCommand";

export default function Sidebar() {
  const t = useTranslations("nav");
  const tc = useTranslations("common");
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const { locale, dir } = useI18n();
  const { sidebarOpen, setSidebarOpen, activeNavItem, setActiveNavItem } = useUi();
  const [langOpen, setLangOpen] = useState(false);

  // Parse path to see active tab
  const getCleanPath = () => {
    const parts = pathname.split("/");
    return parts[2] || "overview";
  };

  const currentTab = getCleanPath();

  const navItems = [
    { id: "overview", label: t("overview"), icon: Home, path: `/${locale}/dashboard` },
    { id: "twin", label: t("mentalTwin"), icon: Brain, path: `/${locale}/twin` },
    { id: "biomarkers", label: t("biomarkers"), icon: BarChart3, path: `/${locale}/biomarkers` },
    { id: "voice", label: t("voiceAnalysis"), icon: Mic, path: `/${locale}/voice` },
    { id: "questions", label: t("dailyQuestions"), icon: HelpCircle, path: `/${locale}/questions` },
    { id: "recovery", label: t("recoveryEngine"), icon: Activity, path: `/${locale}/recovery` },
    { id: "journal", label: t("journal"), icon: BookOpen, path: `/${locale}/journal` },
    { id: "alerts", label: t("alerts"), icon: Bell, path: `/${locale}/alerts`, badge: true },
    { id: "privacy", label: t("privacyVault"), icon: Shield, path: `/${locale}/privacy` },
    { id: "settings", label: t("settings"), icon: Settings, path: `/${locale}/settings` },
  ];

  if (user?.role === "therapist") {
    navItems.push({ id: "therapist", label: t("therapistView"), icon: Users, path: `/${locale}/therapist` });
  }
  if (user?.role === "admin") {
    navItems.push({ id: "admin", label: t("adminPanel"), icon: ShieldAlert, path: `/${locale}/admin` });
  }

  // Render score circle
  const score = user?.crisisScore || 34;
  const radius = 18;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  const getScoreColor = (val: number) => {
    if (val > 90) return "oklch(68% 0.24 25)";
    if (val > 75) return "oklch(78% 0.20 75)";
    return "oklch(72% 0.18 150)";
  };

  return (
    <motion.aside
      initial={{ width: sidebarOpen ? 240 : 80 }}
      animate={{ width: sidebarOpen ? 240 : 80 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="fixed top-0 bottom-0 left-0 z-30 flex flex-col glass border-r"
      style={{ borderColor: "var(--sx-border)", backgroundColor: "var(--sx-deep)" }}
    >
      {/* Brand logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b" style={{ borderColor: "var(--sx-border)" }}>
        <a href={`/${locale}/dashboard`} className="flex items-center gap-3 select-none">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center glow-neural" style={{ background: "linear-gradient(135deg, var(--sx-neural), var(--sx-synapse))" }}>
            <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem", color: "white" }}>S</span>
          </div>
          {sidebarOpen && (
            <span className="text-display font-extrabold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-teal-400 bg-clip-text text-transparent">
              SentienceX
            </span>
          )}
        </a>
        {sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(false)}
            className="p-1.5 rounded-lg hover:bg-white/5 text-[oklch(58% 0.02 270)] transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
        )}
        {!sidebarOpen && (
          <button 
            onClick={() => setSidebarOpen(true)}
            className="absolute left-[70px] top-4 p-1.5 rounded-lg hover:bg-white/5 text-[oklch(58% 0.02 270)] transition-colors border glass"
          >
            <ChevronRight size={16} />
          </button>
        )}
      </div>

      {/* Nav links */}
      <div className="flex-1 py-4 overflow-y-auto px-3 space-y-1">
        {navItems.map((item) => {
          const isActive = currentTab === item.id || (currentTab === "dashboard" && item.id === "overview");
          const Icon = item.icon;

          return (
            <a
              key={item.id}
              href={item.path}
              onClick={() => setActiveNavItem(item.id)}
              className={`relative flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${
                isActive 
                  ? "text-white font-medium" 
                  : "text-[oklch(58% 0.02 270)] hover:text-white hover:bg-white/5"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavIndicator"
                  className="absolute inset-0 rounded-xl"
                  style={{ background: "oklch(65% 0.22 300 / 0.15)", border: "1px solid oklch(65% 0.22 300 / 0.3)" }}
                  transition={{ type: "spring", stiffness: 380, damping: 30 }}
                />
              )}
              <Icon size={20} className={isActive ? "text-purple-400" : "group-hover:text-purple-300"} />
              {sidebarOpen && <span className="text-sm font-body">{item.label}</span>}
              {sidebarOpen && item.badge && (
                <span className="ml-auto w-2 h-2 rounded-full bg-red-500 glow-alert" />
              )}
            </a>
          );
        })}
      </div>

      {/* Bottom Profile / Language */}
      <div className="p-4 border-t space-y-3" style={{ borderColor: "var(--sx-border)" }}>
        {/* Language button */}
        <button
          onClick={() => setLangOpen(true)}
          className="flex items-center gap-3 w-full px-2 py-1.5 rounded-lg hover:bg-white/5 text-[oklch(58% 0.02 270)] hover:text-white transition-colors"
        >
          <Globe size={18} />
          {sidebarOpen && (
            <div className="text-left">
              <p className="text-xs font-mono capitalize">{locale === "en" ? "English (EN)" : locale === "hi" ? "हिन्दी (HI)" : `${locale.toUpperCase()}`}</p>
            </div>
          )}
        </button>

        {/* User Card */}
        {user && (
          <div className="flex items-center gap-3 p-2 rounded-xl bg-white/5">
            <div className="relative flex-shrink-0">
              <svg className="w-10 h-10 rotate-[-90deg]">
                <circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="transparent"
                  stroke="var(--sx-border)"
                  strokeWidth={strokeWidth}
                />
                <motion.circle
                  cx="20"
                  cy="20"
                  r={radius}
                  fill="transparent"
                  stroke={getScoreColor(score)}
                  strokeWidth={strokeWidth}
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-[10px] text-data font-bold">
                {score}
              </div>
            </div>

            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate text-white">{user.name}</p>
                <p className="text-[10px] text-[oklch(58% 0.02 270)] truncate capitalize">{user.role}</p>
              </div>
            )}

            {sidebarOpen && (
              <button 
                onClick={logout}
                className="p-1 rounded hover:bg-white/10 text-red-400 hover:text-red-300"
              >
                <LogOut size={16} />
              </button>
            )}
          </div>
        )}

        {sidebarOpen && (
          <div className="text-center">
            <p className="text-[10px] text-mono text-[oklch(58% 0.02 270)]">
              {tc("version")} 2.0 · {tc("model")}: Llama 3.3
            </p>
          </div>
        )}
      </div>

      <LanguageCommand open={langOpen} setOpen={setLangOpen} />
    </motion.aside>
  );
}
