"use client";
import { useState } from "react";
import { useAuth, useUi, useAlerts } from "@/lib/store";
import { useTranslations } from "next-intl";
import { Bell, Search, Activity, User, Shield, HelpCircle, LogOut } from "lucide-react";
import { useWebSocket } from "@/lib/ws";

export default function Header() {
  const t = useTranslations("common");
  const navT = useTranslations("nav");
  const { user, logout, setRole } = useAuth();
  const { wsStatus } = useWebSocket();
  const { alerts, acknowledgeAlert } = useAlerts();
  const { activeNavItem } = useUi();
  
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const getPageTitle = () => {
    switch (activeNavItem) {
      case "overview": return navT("overview");
      case "twin": return navT("mentalTwin");
      case "biomarkers": return navT("biomarkers");
      case "voice": return navT("voiceAnalysis");
      case "questions": return navT("dailyQuestions");
      case "recovery": return navT("recoveryEngine");
      case "journal": return navT("journal");
      case "alerts": return navT("alerts");
      case "privacy": return navT("privacyVault");
      case "settings": return navT("settings");
      case "therapist": return navT("therapistView");
      case "admin": return navT("adminPanel");
      default: return navT("overview");
    }
  };

  const toggleRole = () => {
    if (!user) return;
    const roles: Array<typeof user.role> = ["individual", "therapist", "admin"];
    const nextIdx = (roles.indexOf(user.role) + 1) % roles.length;
    setRole(roles[nextIdx]);
  };

  const getStatusColor = (status: string) => {
    return status === "connected" ? "bg-emerald-500 glow-safe" : "bg-amber-500 animate-pulse";
  };

  return (
    <header 
      className="fixed top-0 right-0 left-0 z-20 h-16 flex items-center justify-between px-6 border-b"
      style={{ 
        borderColor: "var(--sx-border)", 
        backgroundColor: "rgba(8, 8, 12, 0.7)", 
        backdropFilter: "blur(12px)",
        paddingLeft: "calc(var(--sidebar-width) + 1.5rem)" 
      }}
    >
      {/* Title / Breadcrumbs */}
      <div>
        <h1 className="text-display font-extrabold text-xl tracking-tight text-white capitalize">
          {getPageTitle()}
        </h1>
      </div>

      {/* Live System Status & User Utilities */}
      <div className="flex items-center gap-4">
        {/* Status Indicators */}
        <div className="flex items-center gap-3 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${getStatusColor(wsStatus)}`} />
            <span className="text-[10px] text-mono text-zinc-400">API</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 glow-safe" />
            <span className="text-[10px] text-mono text-zinc-400">ML</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 glow-safe" />
            <span className="text-[10px] text-mono text-zinc-400">Twin</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 glow-safe" />
            <span className="text-[10px] text-mono text-zinc-400">Stream</span>
          </div>
        </div>

        {/* Search trigger */}
        <button 
          onClick={() => setSearchOpen(true)}
          className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/10"
        >
          <Search size={18} />
        </button>

        {/* Notifications trigger */}
        <div className="relative">
          <button 
            onClick={() => setNotifOpen(!notifOpen)}
            className="p-2 rounded-lg hover:bg-white/5 text-zinc-400 hover:text-white transition-all border border-transparent hover:border-white/10 relative"
          >
            <Bell size={18} />
            {alerts.some(a => !a.acknowledged) && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 glow-alert" />
            )}
          </button>

          {/* Notifications Dropdown */}
          {notifOpen && (
            <div className="absolute right-0 mt-2 w-80 glass rounded-2xl p-4 shadow-xl border border-white/10 flex flex-col gap-2">
              <h3 className="text-sm font-semibold border-b border-white/5 pb-2">Active Notifications</h3>
              <div className="max-h-60 overflow-y-auto space-y-2">
                {alerts.length === 0 ? (
                  <p className="text-xs text-zinc-500 text-center py-4">No active alerts</p>
                ) : (
                  alerts.map((alert) => (
                    <div 
                      key={alert.id} 
                      className={`p-2.5 rounded-lg border text-xs transition-all ${
                        alert.acknowledged 
                          ? "bg-white/5 border-white/5 text-zinc-400" 
                          : "bg-red-500/10 border-red-500/20 text-red-200"
                      }`}
                    >
                      <p className="font-medium">{alert.message}</p>
                      <div className="flex justify-between items-center mt-1.5">
                        <span className="text-[10px] text-zinc-500">{alert.timestamp}</span>
                        {!alert.acknowledged && (
                          <button 
                            onClick={() => acknowledgeAlert(alert.id)}
                            className="text-[10px] bg-red-500/20 hover:bg-red-500/40 text-red-300 px-2 py-0.5 rounded-md"
                          >
                            Ack
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown */}
        <div className="relative">
          <button 
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2 p-1.5 rounded-xl hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-500 to-indigo-600 flex items-center justify-center font-bold text-white text-sm">
              {user?.name.charAt(0)}
            </div>
          </button>

          {/* User Menu dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 glass rounded-2xl p-2 shadow-xl border border-white/10 flex flex-col gap-1">
              <div className="p-3 border-b border-white/5">
                <p className="text-xs text-zinc-400">Signed in as</p>
                <p className="text-sm font-semibold truncate text-white">{user?.name}</p>
              </div>
              
              <button 
                onClick={toggleRole}
                className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-left"
              >
                <Activity size={15} className="text-purple-400" />
                Change Role ({user?.role})
              </button>

              <button 
                className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-left"
              >
                <User size={15} />
                Profile Settings
              </button>

              <button 
                className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-left"
              >
                <Shield size={15} />
                Therapist Link
              </button>

              <button 
                onClick={logout}
                className="flex items-center gap-2.5 px-3 py-2 text-xs rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all text-left"
              >
                <LogOut size={15} />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
