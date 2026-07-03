"use client";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import MentalTwinGlobe from "@/components/three/MentalTwinGlobe";
import TwinGraph from "@/components/flow/TwinGraph";
import { useUi } from "@/lib/store";

export default function TwinPage() {
  const { sidebarOpen } = useUi();

  return (
    <div className="min-h-screen bg-sx-void text-white flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? "240px" : "80px" }}
      >
        <Header />
        <main className="p-6 mt-16 space-y-6 max-w-7xl mx-auto w-full">
          <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
            <div>
              <h2 className="text-display font-extrabold text-xl text-white">Mental Twin Engine</h2>
              <p className="text-xs text-zinc-500 mt-1">
                Visualizing the passive graph-based replica of your psychological state in real time.
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-zinc-400 font-mono">3D Neural Network Projection</span>
                <MentalTwinGlobe height={400} interactive={true} />
              </div>
              <div className="flex flex-col gap-3">
                <span className="text-xs font-semibold text-zinc-400 font-mono">Graph Relational Network</span>
                <TwinGraph />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
