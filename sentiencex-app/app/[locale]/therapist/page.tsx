"use client";
import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import { usePatients, type Patient } from "@/lib/api/hooks";
import { useUi } from "@/lib/store";
import { useTranslations } from "next-intl";
import { Search, ChevronRight, User, AlertCircle, Phone, Calendar, FileText, Send, Plus, MapPin } from "lucide-react";
import CrisisGauge from "@/components/charts/CrisisGauge";
import BiomarkerMatrix from "@/components/charts/BiomarkerMatrix";
import VoiceRadar from "@/components/charts/VoiceRadar";
import TwinGraph from "@/components/flow/TwinGraph";

export default function TherapistPage() {
  const { sidebarOpen } = useUi();
  const { data: patients, isLoading } = usePatients();
  const t = useTranslations("therapist");

  const [selectedPatientId, setSelectedPatientId] = useState<string>("p1");
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "activity" | "name">("score");

  // Sticky notes
  const [notes, setNotes] = useState([
    { id: 1, text: "Patient shows critical sleep duration drops. Plan to adjust meditation guidelines during our next call.", date: "Today, 10:15 AM" },
    { id: 2, text: "Speech energy rate remains depressed. Monitor for call duration drops next 48h.", date: "Yesterday, 2:40 PM" }
  ]);
  const [newNote, setNewNote] = useState("");

  // Chat message states
  const [chatMessages, setChatMessages] = useState([
    { sender: "therapist", text: "Hi Rohan, I looked at your biomarker matrix today. I noticed your steps are lower. Are you feeling up for a light walk?", time: "10:30 AM" },
    { sender: "patient", text: "Hey Dr. Priya, yes, just had a very busy week. I will try to go outside today.", time: "10:45 AM" }
  ]);
  const [chatInput, setChatInput] = useState("");

  if (isLoading || !patients) {
    return (
      <div className="min-h-screen bg-sx-void text-white flex items-center justify-center">
        <span className="text-xs text-zinc-500 font-mono">Loading Patient registries...</span>
      </div>
    );
  }

  const handleAddNote = () => {
    if (!newNote.trim()) return;
    setNotes([{ id: Date.now(), text: newNote, date: "Just now" }, ...notes]);
    setNewNote("");
  };

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;
    setChatMessages([...chatMessages, { sender: "therapist", text: chatInput, time: "Just now" }]);
    setChatInput("");
  };

  // Sort and filter patients
  const sortedPatients = [...patients]
    .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sortBy === "score") return b.crisisScore - a.crisisScore;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return 0; // Default
    });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];

  const getScoreBorder = (val: number) => {
    if (val > 90) return "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]";
    if (val > 75) return "border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.2)]";
    return "border-transparent";
  };

  const getScoreBg = (val: number) => {
    if (val > 90) return "bg-red-500/10 text-red-400 border-red-500/20";
    if (val > 75) return "bg-amber-500/10 text-amber-400 border-amber-500/20";
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  };

  return (
    <div className="min-h-screen bg-sx-void text-white flex">
      <Sidebar />
      <div 
        className="flex-1 flex flex-col min-w-0 transition-all duration-300"
        style={{ paddingLeft: sidebarOpen ? "240px" : "80px" }}
      >
        <Header />
        
        {/* Main double column viewport */}
        <main className="p-6 mt-16 flex flex-col lg:flex-row gap-6 h-[calc(100vh-64px)] overflow-hidden">
          
          {/* Left panel: Patient List (320px) */}
          <div className="w-full lg:w-80 flex flex-col gap-4 flex-shrink-0 h-full overflow-hidden pb-4">
            <div className="glass rounded-3xl p-4 border border-white/5 flex flex-col gap-3">
              <h3 className="text-display font-extrabold text-sm text-white">
                {t("patientList")}
              </h3>
              
              {/* Search bar */}
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Search patient database..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/5 rounded-xl pl-8 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                />
              </div>

              {/* Sort pills */}
              <div className="flex gap-2">
                {(["score", "name"] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setSortBy(mode)}
                    className={`px-3 py-1 rounded-lg text-[10px] font-mono capitalize transition-all ${
                      sortBy === mode
                        ? "bg-purple-600/30 border border-purple-500/30 text-white font-semibold"
                        : "text-zinc-500 hover:text-zinc-300"
                    }`}
                  >
                    {mode === "score" ? "Crisis Score" : "Alphabetical"}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable list */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 scrollbar-thin">
              {sortedPatients.map((pat) => (
                <div
                  key={pat.id}
                  onClick={() => setSelectedPatientId(pat.id)}
                  className={`p-3 rounded-2xl border cursor-pointer transition-all duration-200 flex items-center justify-between gap-3 ${
                    selectedPatientId === pat.id
                      ? "bg-white/10 border-white/10"
                      : "bg-white/5 border-white/5 hover:bg-white/10"
                  } ${getScoreBorder(pat.crisisScore)}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center font-bold text-white text-xs">
                      {pat.name.charAt(0)}
                    </div>
                    <div className="text-left">
                      <span className="text-xs font-semibold text-white block">{pat.name}</span>
                      <span className="text-[9px] text-zinc-500 block font-mono">Last sync: {pat.lastSeen}</span>
                    </div>
                  </div>

                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold font-mono border ${getScoreBg(pat.crisisScore)}`}>
                    {pat.crisisScore}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right panel: Active Patient details */}
          <div className="flex-1 overflow-y-auto h-full space-y-6 pb-6 pr-2 scrollbar-thin">
            
            {/* Patient overview header */}
            <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col md:flex-row justify-between gap-4 items-start md:items-center">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-purple-600 flex items-center justify-center font-bold text-white text-lg">
                  {selectedPatient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-display font-extrabold text-lg text-white">{selectedPatient.name}</h2>
                  <p className="text-xs text-zinc-500 mt-1 font-mono">ID: {selectedPatient.id} · Role: Patient Override Mode</p>
                </div>
              </div>

              {/* Quick actions bar */}
              <div className="flex items-center gap-3">
                <button className="bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all">
                  <FileText size={14} /> {t("exportReport")}
                </button>
                <button className="bg-white/5 hover:bg-white/10 border border-white/5 px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-all">
                  <Calendar size={14} /> Schedule Cal.com
                </button>
              </div>
            </div>

            {/* Visual metrics split */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Patient data overview column */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Crisis and Twin */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="h-[360px]">
                    <CrisisGauge />
                  </div>
                  <div className="h-[360px] bg-white/5 p-4 rounded-2xl border border-white/5">
                    <span className="text-xs font-semibold text-zinc-400 font-mono block mb-3">Neo4j Twin Subgraph</span>
                    <TwinGraph />
                  </div>
                </div>

                {/* Biomarker and Voice */}
                <BiomarkerMatrix />
                <div className="h-[460px]">
                  <VoiceRadar />
                </div>
              </div>

              {/* Therapist Annotation and Encrypted chat column */}
              <div className="space-y-6">
                
                {/* Annotation Board */}
                <div className="glass rounded-3xl p-6 border border-white/5 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-display font-extrabold text-sm text-white">{t("addAnnotation")}</h3>
                    <span className="text-[9px] text-zinc-500 font-mono">Private Notes</span>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add assessment remark..."
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                    <button
                      onClick={handleAddNote}
                      className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl p-2 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Plus size={14} />
                    </button>
                  </div>

                  <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                    {notes.map((note) => (
                      <div key={note.id} className="p-3 bg-white/5 border border-white/5 rounded-2xl text-xs space-y-1">
                        <p className="text-zinc-300 font-medium leading-relaxed">{note.text}</p>
                        <span className="text-[9px] text-zinc-500 font-mono block text-right">{note.date}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Secure Chat Module */}
                <div className="glass rounded-3xl p-6 border border-white/5 space-y-4 flex flex-col h-[320px] justify-between">
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <h3 className="text-display font-extrabold text-sm text-white">E2E Chat Channel</h3>
                    <span className="text-[8px] bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded font-mono font-bold">
                      Twilio Shielded
                    </span>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto space-y-2 pr-1 my-2 scrollbar-thin flex flex-col justify-end">
                    {chatMessages.map((msg, idx) => (
                      <div 
                        key={idx} 
                        className={`max-w-[80%] p-2.5 rounded-2xl text-xs ${
                          msg.sender === "therapist" 
                            ? "bg-purple-600 text-white self-end rounded-tr-none" 
                            : "bg-white/5 text-zinc-300 self-start rounded-tl-none"
                        }`}
                      >
                        <p className="leading-relaxed">{msg.text}</p>
                        <span className="text-[8px] text-zinc-400 mt-1 block text-right font-mono">{msg.time}</span>
                      </div>
                    ))}
                  </div>

                  {/* Input form */}
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder={t("secureMessage")}
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      className="flex-1 bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none"
                    />
                    <button
                      onClick={handleSendMessage}
                      className="bg-purple-600 hover:bg-purple-500 text-white rounded-xl p-2.5 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Send size={14} />
                    </button>
                  </div>
                </div>

                {/* Crisis District Heatmap Stub */}
                <div className="glass rounded-3xl p-6 border border-white/5 space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="text-display font-extrabold text-sm text-white">{t("crisisMap")}</h3>
                    <span className="text-[9px] text-zinc-500 font-mono">ε=0.1 Privacy</span>
                  </div>

                  <div className="h-28 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center justify-center text-center p-3 relative overflow-hidden">
                    <MapPin size={20} className="text-zinc-600 mb-1" />
                    <p className="text-[10px] font-semibold text-white">Anonymized Regional Heatmap</p>
                    <p className="text-[8px] text-zinc-500 mt-0.5">NCRB suicide rate overlay active · Cohorts ≥ 20</p>
                  </div>
                </div>

              </div>

            </div>

          </div>

        </main>
      </div>
    </div>
  );
}
