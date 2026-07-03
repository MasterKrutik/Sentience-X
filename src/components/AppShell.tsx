import React, { useState, useEffect } from 'react';
import { useWellnessStore } from '../store/useWellnessStore';
import { translations } from '../utils/i18n';
import { Chatbot } from './Chatbot';
import { Logo } from './ui/Logo';
import { 
  Home, ClipboardList, Activity, Mic, ShieldAlert, Brain, 
  Settings, LogOut, Moon, Sun, Languages, Bell, Search, 
  Menu, ChevronLeft, ChevronRight, BarChart3, FileSpreadsheet, Flame
} from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { crisisResources } from '../config/crisisResources';

const INDIAN_LANGUAGES = [
  { code: 'en', name: 'English (EN)' },
  { code: 'hi', name: 'Hindi (हिंदी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'te', name: 'Telugu (తెలుగు)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'ur', name: 'Urdu (اُردو)' },
  { code: 'kn', name: 'Kannada (ಕನ್ನಡ)' },
  { code: 'or', name: 'Odia (ଓଡ଼િଆ)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬী)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'as', name: 'Assamese (অসমীয়া)' },
  { code: 'mai', name: 'Maithili (मैथिली)' },
  { code: 'sat', name: 'Santali (संताली)' },
  { code: 'ks', name: 'Kashmiri (کٲشुर)' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
  { code: 'kok', name: 'Konkani (कोंकणी)' },
  { code: 'sd', name: 'Sindhi (سنڌી)' },
  { code: 'doi', name: 'Dogri (डোগরি)' },
  { code: 'mni', name: 'Manipuri (মৈতৈলোন)' },
  { code: 'brx', name: 'Bodo (बर\')' },
  { code: 'ras', name: 'Rajasthani (राजस्थानी)' },
  { code: 'bhp', name: 'Bhojpuri (भोजपुरी)' },
  { code: 'har', name: 'Haryanvi (हरियाणवी)' },
  { code: 'tcy', name: 'Tulu (ತುಳು)' },
  { code: 'cgh', name: 'Chhattisgarhi (छत्तीसगढ़ी)' },
  { code: 'sa', name: 'Sanskrit (संस्कृतम्)' }
];

const searchIndex = [
  { label: 'Dashboard Overview', route: 'dashboard', keywords: ['home', 'overview', 'main', 'summary', 'status'] },
  { label: 'Questions & Assessments', route: 'questions', keywords: ['check-in', 'survey', 'phq9', 'gad7', 'clinical', 'assessment', 'questions'] },
  { label: 'Biometric Signals', route: 'signals', keywords: ['typing', 'sleep', 'steps', 'screen time', 'social', 'device', 'biometrics', 'telemetry'] },
  { label: 'Voice Analysis', route: 'voice', keywords: ['acoustic', 'biosignals', 'audio', 'mic', 'recording', 'speech', 'voice'] },
  { label: 'Wellness Metrics', route: 'wellness', keywords: ['risk fusion', 'stress', 'burnout', 'anxiety', 'motivation', 'loneliness', 'cognitive fatigue', 'scores', 'predictions'] },
  { label: 'Behavioral Twin Matrix', route: 'twin', keywords: ['digital twin', 'cognitive fingerprint', 'drift', 'matrix', 'fingerprint'] },
  { label: 'Crisis Interventions & Support', route: 'interventions', keywords: ['help', 'helpline', 'crisis', 'support', 'emergency', 'escape hatch', 'plan'] },
  { label: 'Progress Tracker & Charts', route: 'progress', keywords: ['history', 'analytics', 'charts', 'trends', 'tracking', 'drift log'] },
  { label: 'Reports & Export', route: 'reports', keywords: ['pdf', 'export', 'download', 'csv', 'clinical report', 'data portability'] },
  { label: 'Settings & Telemetry Privacy', route: 'settings', keywords: ['account', 'privacy', 'telemetry', 'consent', 'dpdp', 'delete data', 'language'] },
  { label: 'Stress Metric', route: 'wellness', keywords: ['stress', 'tension', 'pressure', 'worry'] },
  { label: 'Burnout Metric', route: 'wellness', keywords: ['burnout', 'exhaustion', 'fatigue', 'tired'] },
  { label: 'Anxiety Metric', route: 'wellness', keywords: ['anxiety', 'panic', 'apprehension', 'nervousness'] },
  { label: 'Motivation Metric', route: 'wellness', keywords: ['motivation', 'drive', 'energy', 'focus'] },
  { label: 'Loneliness Metric', route: 'wellness', keywords: ['loneliness', 'isolation', 'social quality', 'social minutes'] },
  { label: 'Cognitive Fatigue Metric', route: 'wellness', keywords: ['cognitive fatigue', 'brain fog', 'concentration', 'errors'] },
];

interface AppShellProps {
  children: (activeTab: string) => React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout, language, setLanguage, streakCount, tasks, toggleTask, setChatbotOpen } = useWellnessStore();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showNotifications, setShowNotifications] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [showCrisisModal, setShowCrisisModal] = useState(false);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const searchResults = React.useMemo(() => {
    const query = debouncedQuery.trim().toLowerCase();
    if (!query) return [];
    
    // 1. Navigation items
    const navItems = searchIndex
      .filter(item =>
        item.label.toLowerCase().includes(query) ||
        item.keywords.some(kw => kw.toLowerCase().includes(query))
      )
      .map(item => ({
        type: 'navigation' as const,
        label: item.label,
        route: item.route,
        taskId: undefined,
        subtitle: `Navigate to ${item.label}`
      }));

    // 2. Tasks
    const taskItems = tasks
      .filter(task => task.text.toLowerCase().includes(query))
      .map(task => ({
        type: 'task' as const,
        label: task.text,
        route: 'dashboard',
        taskId: task.id,
        subtitle: `Task Checklist: ${task.completed ? 'Completed' : 'Pending'}`
      }));

    // 3. AI Counselor option
    const aiOption = {
      type: 'ai' as const,
      label: `Ask AI Counselor: "${debouncedQuery}"`,
      route: '',
      taskId: undefined,
      subtitle: 'Ask the virtual counselor about this'
    };

    return [...navItems, ...taskItems, aiOption];
  }, [debouncedQuery, tasks]);
  
  const navTranslations = translations[language].nav;
  const appTranslations = translations[language].app;

  // Sync tab state with URL hash
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.slice(1);
      const validTabs = ['dashboard', 'questions', 'signals', 'voice', 'wellness', 'twin', 'interventions', 'progress', 'reports', 'settings'];
      if (hash && validTabs.includes(hash)) {
        setActiveTab(hash);
      } else {
        window.location.hash = 'dashboard';
        setActiveTab('dashboard');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    // Initialize
    handleHashChange();

    // Trigger theme update: Lock to dark mode
    const root = window.document.documentElement;
    root.classList.add('dark');
    root.classList.remove('light');

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigateTo = (tab: string) => {
    window.location.hash = tab;
  };

  const menuItems = [
    { id: 'dashboard', label: navTranslations.dashboard, icon: Home },
    { id: 'questions', label: navTranslations.questions, icon: ClipboardList },
    { id: 'signals', label: navTranslations.signals, icon: Activity },
    { id: 'voice', label: navTranslations.voice, icon: Mic },
    { id: 'wellness', label: navTranslations.wellness, icon: BarChart3 },
    { id: 'twin', label: navTranslations.twin, icon: Brain },
    { id: 'interventions', label: navTranslations.interventions, icon: ShieldAlert },
    { id: 'progress', label: navTranslations.progress, icon: BarChart3 },
    { id: 'reports', label: navTranslations.reports, icon: FileSpreadsheet },
    { id: 'settings', label: navTranslations.settings, icon: Settings },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-[var(--background)] text-[var(--foreground)] transition-colors duration-300">
      
      {/* Top Navbar */}
      <header className="h-16 border-b border-slate-200 dark:border-white/5 glass-panel sticky top-0 z-40 px-4 flex items-center justify-between">
        
        {/* Left Side Logo */}
        <Logo iconSize="sm" />

        {/* Search / Ask AI input */}
        <div className="hidden md:flex items-center gap-2 max-w-sm w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3" />
          <input
            type="text"
            placeholder="Ask AI / Search Dashboard..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                const query = searchQuery.trim();
                if (!query) return;
                
                const firstResult = searchResults[0];
                if (firstResult) {
                  if (firstResult.type === 'navigation') {
                    navigateTo(firstResult.route);
                  } else if (firstResult.type === 'task') {
                    toggleTask(firstResult.taskId!);
                    navigateTo('dashboard');
                  } else if (firstResult.type === 'ai') {
                    setChatbotOpen(true);
                    window.dispatchEvent(new CustomEvent('ask-ai', { detail: query }));
                  }
                } else {
                  setChatbotOpen(true);
                  window.dispatchEvent(new CustomEvent('ask-ai', { detail: query }));
                }
                setSearchQuery('');
              }
            }}
            className="w-full glass-input pl-10 pr-4 py-1.5 text-xs focus:ring-1 focus:ring-brand-cyan focus:border-brand-cyan"
          />
          {searchQuery.trim() !== '' && (
            <>
              {/* Overlay for clicking outside */}
              <div 
                className="fixed inset-0 z-40 cursor-default" 
                onClick={() => setSearchQuery('')} 
              />
              <div className="absolute top-10 left-0 w-full glass-panel border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 p-1.5 max-h-64 overflow-y-auto scrollbar-thin bg-slate-900/90 dark:bg-black/90 backdrop-blur-xl">
                {searchResults.length > 0 ? (
                  <div className="space-y-0.5">
                    {searchResults.map((result, idx) => (
                      <button
                        key={`${result.label}-${idx}`}
                        onClick={() => {
                          if (result.type === 'navigation') {
                            navigateTo(result.route);
                          } else if (result.type === 'task') {
                            toggleTask(result.taskId!);
                            navigateTo('dashboard');
                          } else if (result.type === 'ai') {
                            setChatbotOpen(true);
                            window.dispatchEvent(new CustomEvent('ask-ai', { detail: debouncedQuery }));
                          }
                          setSearchQuery('');
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg text-xs hover:bg-brand-purple/20 hover:text-slate-100 transition-colors flex flex-col justify-center text-slate-300 group cursor-pointer"
                      >
                        <span className="font-semibold text-slate-200 group-hover:text-slate-100">{result.label}</span>
                        <span className="text-[10px] text-slate-500 group-hover:text-slate-400">{result.subtitle}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="px-3 py-4 text-xs text-center text-slate-400 select-none">
                    No results found
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          
          {/* Streak Indicator */}
          {user && (
            <div 
              className="flex items-center gap-1.5 px-3 py-1 bg-orange-500/10 dark:bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-500 font-bold text-xs"
              title="Daily Telemetry Submission Streak"
            >
              <Flame className="w-3.5 h-3.5 fill-orange-500 animate-pulse" />
              <span>{streakCount} Day{streakCount !== 1 ? 's' : ''}</span>
            </div>
          )}
          
          {/* Notification bell */}
          <div className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
            </button>
            
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 glass-panel rounded-2xl p-4 shadow-xl z-50 border border-slate-200 dark:border-white/10">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-sm">Notifications</h4>
                  <button className="text-[10px] text-brand-cyan hover:underline">Mark all read</button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                  <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 text-xs">
                    <span className="font-semibold text-brand-cyan block">Mental Twin Updated</span>
                    Your behavioral drift indicators have refreshed based on today's typing test.
                  </div>
                  <div className="p-2 rounded-lg bg-slate-200/50 dark:bg-white/5 border border-slate-300/30 dark:border-white/5 text-xs">
                    <span className="font-semibold text-amber-400 block">Restorative Sleep Recovery</span>
                    Your sleep duration drops correlated with stress peaks. Try setting recovery alarms.
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Language selector */}
          <div className="relative flex items-center gap-1">
            <button 
              onClick={() => setShowLangDropdown(!showLangDropdown)}
              className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-white/5 text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
            >
              <Languages className="w-4 h-4" />
              <span className="uppercase font-semibold">{language}</span>
            </button>
            
            {showLangDropdown && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowLangDropdown(false)} />
                <div className="absolute right-0 top-10 w-48 glass-panel border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden shadow-2xl z-50 max-h-64 overflow-y-auto scrollbar-thin">
                  {INDIAN_LANGUAGES.map((lang) => (
                    <button 
                      key={lang.code}
                      onClick={() => {
                        setLanguage(lang.code as any);
                        setShowLangDropdown(false);
                      }} 
                      className={`w-full text-left px-4 py-2.5 text-xs hover:bg-brand-purple/20 transition-colors flex justify-between items-center ${
                        language === lang.code 
                          ? 'text-brand-cyan font-bold bg-slate-200/50 dark:bg-white/5' 
                          : 'text-slate-700 dark:text-slate-200'
                      }`}
                    >
                      <span>{lang.name}</span>
                      {language === lang.code && <span className="text-brand-cyan text-[10px]">✓</span>}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Persistent Crisis Escape Hatch */}
          <button
            onClick={() => setShowCrisisModal(true)}
            className="px-3 py-1.5 rounded-xl border border-red-500/40 bg-red-950/20 hover:bg-red-900/40 text-red-400 text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_10px_rgba(239,68,68,0.15)] animate-pulse"
          >
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>I need help right now</span>
          </button>

          {/* User profile dropdown */}
          <div className="flex items-center gap-2 border-l border-white/10 pl-4">
            {user?.picture ? (
              <img 
                src={user.picture} 
                alt="Profile" 
                className="w-8 h-8 rounded-full border border-brand-cyan/40 object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-brand-cyan/20 border border-brand-cyan/50 flex items-center justify-center font-bold text-brand-cyan text-xs uppercase">
                {user?.email?.trim() ? user.email.trim()[0] : 'G'}
              </div>
            )}
            <span className="hidden lg:inline text-xs text-slate-300 max-w-[120px] truncate" id="profile-display-name">
              {user ? (user.name?.trim() || user.email?.trim() || "Guest User") : "Guest User"}
            </span>
          </div>

        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar */}
        <aside 
          className={`border-r border-white/5 bg-[#090a0e]/95 backdrop-blur-xl flex flex-col justify-between transition-all duration-300 ${
            isCollapsed ? 'w-16' : 'w-64'
          }`}
        >
          {/* Nav Items */}
          <div className="flex-1 py-4 space-y-1">
            <div className="px-3 mb-2 flex justify-end">
              <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="p-1 rounded-lg hover:bg-white/5 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
              >
                {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
              </button>
            </div>

            <nav className="space-y-1 px-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigateTo(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 cursor-pointer ${
                      isActive 
                        ? 'bg-gradient-to-r from-brand-purple/20 to-brand-cyan/10 border border-brand-purple/40 text-slate-100 shadow-[0_0_15px_rgba(124,58,237,0.15)] font-semibold' 
                        : 'text-slate-400 hover:bg-white/5 hover:text-slate-200'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-brand-cyan' : 'text-slate-400'}`} />
                    {!isCollapsed && (
                      <span className="flex-1 text-left">{item.label}</span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Sidebar Footer (User / LogOut) */}
          <div className="p-3 border-t border-white/5 bg-black/20">
            <button
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-400 hover:bg-red-950/20 hover:text-red-300 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4 text-red-400" />
              {!isCollapsed && <span>{navTranslations.logout}</span>}
            </button>
          </div>

        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[var(--background)] relative">
          
          {/* Top subtle glow */}
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-brand-purple/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />
          <div className="absolute top-1/3 right-1/4 w-96 h-96 bg-brand-cyan/5 rounded-full blur-3xl pointer-events-none -translate-y-1/2" />

          <div className="max-w-6xl mx-auto w-full relative z-10">
            {children(activeTab)}
          </div>
        </main>
      </div>

      {/* Floating Chatbot */}
      <Chatbot />

      {/* Crisis Escape Hatch Modal Overlay */}
      {showCrisisModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <GlassCard className="max-w-lg w-full border border-red-500/50 bg-slate-950 p-6 space-y-6 relative overflow-hidden shadow-2xl">
            {/* Background glowing indicator */}
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />
            
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 mt-0.5 animate-bounce">
                <ShieldAlert className="w-7 h-7 animate-pulse" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-red-200">CRITICAL CRISIS SUPPORT: YOU ARE NOT ALONE</h3>
                <p className="text-xs text-slate-300 leading-relaxed text-left">
                  If you are experiencing severe distress, thoughts of self-harm, overwhelming anxiety, or are in a mental health emergency, please reach out immediately. The following free, confidential national wellness helplines in India are staffed by trained professionals ready to support you 24/7:
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-left">
              {crisisResources.map((resource, index) => {
                const isLastAndOdd = index === crisisResources.length - 1 && crisisResources.length % 2 !== 0;
                return (
                  <div 
                    key={resource.name}
                    className={`p-4 rounded-xl bg-black/40 border border-red-500/20 flex flex-col justify-between space-y-2 ${
                      isLastAndOdd ? 'sm:col-span-2' : ''
                    }`}
                  >
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">
                        {resource.name}
                      </span>
                      <span className="text-base font-extrabold text-slate-100 block mt-1">
                        {resource.number}
                      </span>
                    </div>
                    <span className="text-[9px] text-red-400 font-medium">
                      {resource.source} · {resource.hours}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-white/5 space-y-3 text-left">
              <p className="text-[10px] text-slate-500 leading-normal italic">
                SentienceX is a self-guided mental wellness optimization platform. It is NOT a clinical, medical, or diagnostic service. Wellness scores, predictions, and recovery exercises are generated for educational and reflective purposes only.
              </p>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowCrisisModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close Window
                </button>
                <button
                  onClick={() => {
                    setShowCrisisModal(false);
                    navigateTo('interventions');
                  }}
                  className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition-colors cursor-pointer shadow-[0_0_15px_rgba(239,68,68,0.2)]"
                >
                  View Wellness Plan
                </button>
              </div>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
