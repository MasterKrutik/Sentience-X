"use client";
import { useState, useMemo } from "react";
import { useI18n } from "@/lib/store";
import { Globe, Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LanguageCommandProps {
  open: boolean;
  setOpen: (open: boolean) => void;
}

export const languages = [
  { code: "hi", name: "Hindi", native: "हिन्दी", flag: "🇮🇳" },
  { code: "bn", name: "Bengali", native: "বাংলা", flag: "🇮🇳" },
  { code: "te", name: "Telugu", native: "తెలుగు", flag: "🇮🇳" },
  { code: "mr", name: "Marathi", native: "मराठी", flag: "🇮🇳" },
  { code: "ta", name: "Tamil", native: "தமிழ்", flag: "🇮🇳" },
  { code: "gu", name: "Gujarati", native: "ગુજરાતી", flag: "🇮🇳" },
  { code: "ur", name: "Urdu", native: "اردو", flag: "🇮🇳" },
  { code: "kn", name: "Kannada", native: "ಕನ್ನಡ", flag: "🇮🇳" },
  { code: "or", name: "Odia", native: "ଓଡ଼ିଆ", flag: "🇮🇳" },
  { code: "ml", name: "Malayalam", native: "മലയാളം", flag: "🇮🇳" },
  { code: "pa", name: "Punjabi", native: "ਪੰਜਾਬੀ", flag: "🇮🇳" },
  { code: "as", name: "Assamese", native: "অসমীয়া", flag: "🇮🇳" },
  { code: "mai", name: "Maithili", native: "मैथिली", flag: "🇮🇳" },
  { code: "sat", name: "Santali", native: "ᱥᱟᱱᱛᱟᱲᱤ", flag: "🇮🇳" },
  { code: "ks", name: "Kashmiri", native: "کٲشُر", flag: "🇮🇳" },
  { code: "kok", name: "Konkani", native: "कोंकणी", flag: "🇮🇳" },
  { code: "sd", name: "Sindhi", native: "سنڌي", flag: "🇮🇳" },
  { code: "dgo", name: "Dogri", native: "डोगरी", flag: "🇮🇳" },
  { code: "mni", name: "Manipuri", native: "মৈতৈলোন্", flag: "🇮🇳" },
  { code: "brx", name: "Bodo", native: "बर'", flag: "🇮🇳" },
  { code: "sa", name: "Sanskrit", native: "संस्कृतम्", flag: "🇮🇳" },
  { code: "en", name: "English", native: "English", flag: "🇬🇧" },
  { code: "en-US", name: "English US", native: "English (US)", flag: "🇺🇸" },
  { code: "fr", name: "French", native: "Français", flag: "🇫🇷" },
  { code: "de", name: "German", native: "Deutsch", flag: "🇩🇪" },
  { code: "es", name: "Spanish", native: "Español", flag: "🇪🇸" },
  { code: "pt", name: "Portuguese", native: "Português", flag: "🇵🇹" },
  { code: "ja", name: "Japanese", native: "日本語", flag: "🇯🇵" },
];

export default function LanguageCommand({ open, setOpen }: LanguageCommandProps) {
  const { locale, setLocale } = useI18n();
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    return languages.filter(
      (l) =>
        l.name.toLowerCase().includes(search.toLowerCase()) ||
        l.native.toLowerCase().includes(search.toLowerCase()) ||
        l.code.toLowerCase().includes(search.toLowerCase())
    );
  }, [search]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ scale: 0.95, y: 10, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.95, y: 10, opacity: 0 }}
            transition={{ type: "spring", duration: 0.4 }}
            className="relative w-full max-w-lg glass rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[500px]"
            style={{ borderColor: "var(--sx-border)", backgroundColor: "var(--sx-deep)" }}
          >
            {/* Search Input bar */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10">
              <Globe size={18} className="text-purple-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search 28 languages..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-transparent border-0 outline-none w-full text-sm text-white placeholder-zinc-500"
                autoFocus
              />
              {search && (
                <button onClick={() => setSearch("")} className="text-zinc-500 hover:text-white">
                  <X size={16} />
                </button>
              )}
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {filtered.length === 0 ? (
                <p className="text-xs text-zinc-500 text-center py-6">No languages match your search</p>
              ) : (
                filtered.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => {
                      setLocale(lang.code);
                      setOpen(false);
                    }}
                    className={`flex items-center justify-between w-full px-3 py-2.5 rounded-xl text-sm transition-all ${
                      locale === lang.code
                        ? "bg-purple-600/20 text-white border border-purple-500/30"
                        : "hover:bg-white/5 text-zinc-400 hover:text-white border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{lang.flag}</span>
                      <div className="text-left">
                        <span className="font-medium">{lang.native}</span>
                        <span className="text-[10px] text-zinc-500 ml-2 font-mono">{lang.name}</span>
                      </div>
                    </div>
                    {locale === lang.code && (
                      <span className="text-xs text-purple-400 font-bold font-mono">ACTIVE</span>
                    )}
                  </button>
                ))
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
