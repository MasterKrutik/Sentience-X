"use client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import RecoveryCard from "@/components/agents/RecoveryCard";
import { useUi } from "@/lib/store";

export default function RecoveryPage() {
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
          <div className="h-[500px]">
            <RecoveryCard />
          </div>
        </main>
      </div>
    </div>
  );
}
