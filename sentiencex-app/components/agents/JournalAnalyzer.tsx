"use client";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { BookOpen, Search, Sparkles, Send, Trash, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface JournalEntry {
  id: string;
  text: string;
  timestamp: string;
  sentimentScore: number; // 0 (low/sad) to 100 (high/happy)
  analysis: string;
}

export default function JournalAnalyzer() {
  const t = useTranslations("journal");
  const [entries, setEntries] = useState<JournalEntry[]>([
    {
      id: "j1",
      text: "Had a hard time sleeping last night. Kept thinking about the upcoming work review. Walked only 4k steps today and avoided three calls from friends. Just feeling zero energy to do anything productive.",
      timestamp: "Yesterday, 10:30 PM",
      sentimentScore: 24,
      analysis: "Emotional distress detected. Content reflects sleep-onset insomnia, severe withdrawal markers (avoiding contacts), and motivation decline. Synthesized into Mental Twin as active stress correlation (TRIGGERS Low Motivation).",
    },
    {
      id: "j2",
      text: "Woke up slightly better. Listened to the binaural beats focus playlist recommended by the Recovery Engine. Work review went okay. Met Priya for lunch. Social activity score is slightly up today.",
      timestamp: "2 days ago, 7:15 PM",
      sentimentScore: 68,
      analysis: "Elevated valence. Benefits observed from Recovery recommendation (Focus Playlist) and social interaction. Restructuring habit pattern.",
    }
  ]);

  const [text, setText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [sseAnalysis, setSseAnalysis] = useState("");

  const handleSave = async () => {
    if (!text.trim()) return;
    setAnalyzing(true);
    setSseAnalysis("");

    // Simulate SSE (Server-Sent Events) streaming from JournalAnalyzer agent
    const mockPhrases = [
      "Analyzing entry context... ",
      "Extracting cognitive distortion patterns... ",
      "Correlation: Screen-time fatigue detected. ",
      "Actionable recommendation: Shift focus playlist, trigger 10-minute meditation. ",
      "Twin database sync complete: Updating Neo4j subgraph relations."
    ];

    let currentString = "";
    for (let i = 0; i < mockPhrases.length; i++) {
      const phrase = mockPhrases[i];
      for (let j = 0; j < phrase.length; j++) {
        await new Promise((r) => setTimeout(r, 15));
        currentString += phrase[j];
        setSseAnalysis(currentString);
      }
    }

    setAnalyzing(false);
    
    const newEntry: JournalEntry = {
      id: `j_${Date.now()}`,
      text: text,
      timestamp: "Just now",
      sentimentScore: Math.floor(Math.random() * 40) + 20, // simulate realistic valence range
      analysis: currentString,
    };

    setEntries([newEntry, ...entries]);
    setText("");
    setSseAnalysis("");
  };

  const handleDelete = (id: string) => {
    setEntries(entries.filter(e => e.id !== id));
  };

  // Filter list with query
  const filteredEntries = entries.filter((e) =>
    e.text.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.analysis.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getSentimentBg = (score: number) => {
    if (score > 70) return "rgba(16, 185, 129, 0.05)"; // safe emerald
    if (score > 40) return "rgba(245, 158, 11, 0.05)"; // amber warning
    return "rgba(239, 68, 68, 0.05)"; // alert red
  };

  const getSentimentBorder = (score: number) => {
    if (score > 70) return "oklch(72% 0.18 150 / 0.2)";
    if (score > 40) return "oklch(78% 0.20 75 / 0.2)";
    return "oklch(68% 0.24 25 / 0.2)";
  };

  return (
    <div className="glass rounded-3xl p-6 border border-white/5 flex flex-col gap-6">
      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-display font-extrabold text-lg text-white">
            {t("title")}
          </h3>
          <p className="text-xs text-zinc-500 mt-1">
            Qdrant Vector Embeddings · Private Semantic Search
          </p>
        </div>

        {/* Semantic Search Bar */}
        <div className="relative w-full md:max-w-xs">
          <Search size={14} className="absolute left-3.5 top-3 text-zinc-500" />
          <input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/5 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500/40"
          />
        </div>
      </div>

      {/* Editor & Streams section */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Editor (3/5 cols) */}
        <div className="lg:col-span-3 flex flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t("startWriting")}
            rows={6}
            className="w-full bg-white/5 border border-white/5 rounded-2xl p-4 text-xs text-white placeholder-zinc-500 outline-none focus:border-purple-500/40 resize-none leading-relaxed"
          />
          <div className="flex justify-between items-center">
            <span className="text-[10px] text-zinc-600 font-mono">
              Autosaved locally · Secure Enclave encryption
            </span>
            <button
              onClick={handleSave}
              disabled={analyzing || !text.trim()}
              className="bg-purple-600 hover:bg-purple-500 disabled:bg-purple-800 text-white rounded-xl px-4 py-2 text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_oklch(65% 0.22 300 / 0.3)] transition-all"
            >
              {analyzing ? (
                <>
                  <Loader2 size={12} className="animate-spin" /> Stream analysis
                </>
              ) : (
                <>
                  <Sparkles size={12} /> {t("aiAnalysis")}
                </>
              )}
            </button>
          </div>

          {/* SSE Stream Display area */}
          <AnimatePresence>
            {sseAnalysis && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-purple-950/20 border border-purple-500/20 rounded-2xl text-[10px] leading-relaxed text-purple-300 font-mono"
              >
                <div className="flex items-center gap-1.5 mb-1 text-[9px] font-bold tracking-widest text-purple-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-ping" />
                  <span>ANALYZER STREAM ACTIVE</span>
                </div>
                {sseAnalysis}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Timeline Entries (2/5 cols) */}
        <div className="lg:col-span-2 flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
          {filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 border border-dashed border-white/5 rounded-2xl">
              <BookOpen size={24} className="text-zinc-700 mb-2" />
              <p className="text-[10px] text-zinc-600">No entries yet. Write your thoughts.</p>
            </div>
          ) : (
            filteredEntries.map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-2xl border transition-all duration-200"
                style={{
                  backgroundColor: getSentimentBg(entry.sentimentScore),
                  borderColor: getSentimentBorder(entry.sentimentScore),
                }}
              >
                <div className="flex justify-between items-center">
                  <span className="text-[9px] font-mono text-zinc-500">{entry.timestamp}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] font-bold font-mono text-zinc-400">
                      Valence: {entry.sentimentScore}
                    </span>
                    <button
                      onClick={() => handleDelete(entry.id)}
                      className="p-1 hover:bg-white/5 rounded text-zinc-600 hover:text-red-400"
                    >
                      <Trash size={12} />
                    </button>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-300 mt-2 leading-relaxed">
                  {entry.text}
                </p>
                {entry.analysis && (
                  <div className="mt-2 pt-2 border-t border-white/5 text-[9px] text-zinc-500 leading-normal font-mono">
                    <span className="text-purple-400 block mb-0.5 font-semibold font-sans uppercase tracking-wider text-[8px]">AI Assessment</span>
                    {entry.analysis}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
