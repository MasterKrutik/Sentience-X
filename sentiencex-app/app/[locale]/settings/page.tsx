"use client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { useUi } from "@/lib/store";

export default function SettingsPage() {
  const { sidebarOpen } = useUi();

  return (
    <div className="min-h-screen bg-sx-void text-white flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? "240px" : "80px" }}
      >
        <Header />
        <main className="p-6 mt-16 max-w-7xl mx-auto w-full">
          <div className="glass rounded-3xl p-8 border border-white/5 space-y-4">
            <h2 className="text-display font-extrabold text-xl text-white">System Settings</h2>
            <p className="text-xs text-zinc-500">
              Manage secure authentication devices, Keycloak SSO accounts, notification rules, and webhook relays.
            </p>
          </div>
        </main>
      </div>
    </div>
  );
}
