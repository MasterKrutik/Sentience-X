import { create } from 'zustand';
import { getWellnessPredictions, WellnessSignals, fetchAndCacheMetadata } from '../utils/predictions';
import { Language } from '../utils/i18n';
import { API_BASE_URL } from '../utils/config';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isCrisis?: boolean;
}

export interface Question {
  id: number;
  textEn: string;
  textHi: string;
  textGu: string;
  value: number | null; // 1-5
}

export interface Task {
  id: number;
  text: string;
  completed: boolean;
}

export interface UserSession {
  email: string;
  token: string;
  name?: string;
  picture?: string;
}

export interface WellnessState {
  // Auth
  user: UserSession | null;
  
  language: Language;
  
  // Signals
  signals: WellnessSignals;
  signalsSubmittedToday: boolean;
  
  // Questions
  questions: Question[];
  questionsSubmittedToday: boolean;
  
  // Clinical Ground Truth (PHQ-9 & GAD-7)
  groundTruth: {
    phq9: number | null;
    gad7: number | null;
    lastSubmitted: string | null;
  };
  isOnboarding: boolean;
  
  // Engagement
  streakCount: number;
  lastSubmissionDate: string | null;

  // Predictions
  predictions: {
    stress: number;
    burnout: number;
    anxiety: number;
    motivation: number;
    loneliness: number;
    cognitive_fatigue: number;
    overall_wellness: number;
  };
  predictionSource: 'xgboost_server' | 'local_approx' | null;
  isPredicting: boolean;

  // Recovery Tasks
  tasks: Task[];
  
  // Chat
  chatMessages: ChatMessage[];
  
  // Privacy & Consent (DPDP)
  consentTelemetry: boolean;
  consentSharing: boolean;
  consentVoice: boolean;

  // Periodic Assessment
  lastDeeperCheckInTime: string | null;

  isChatbotOpen: boolean;
  setChatbotOpen: (val: boolean) => void;

  // Actions
  login: (email: string, name?: string, picture?: string) => void;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  syncWithBackend: () => Promise<void>;
  setLanguage: (lang: Language) => void;
  updateSignal: (key: keyof WellnessSignals, value: number) => void;
  submitSignals: () => Promise<void>;
  answerQuestion: (id: number, value: number) => void;
  submitQuestions: () => Promise<void>;
  submitGroundTruth: (phq9: number, gad7: number) => Promise<void>;
  setIsOnboarding: (val: boolean) => void;
  incrementStreak: () => void;
  toggleTask: (id: number) => void;
  addChatMessage: (text: string, sender: 'user' | 'assistant', isCrisis?: boolean) => void;
  updateConsent: (telemetry: boolean, sharing: boolean, voice?: boolean) => void;
  submitClinicalLog: (phq9Answers: number[], phq9Score: number, gad7Answers: number[], gad7Score: number) => Promise<void>;
  skipDeeperCheckIn: () => void;
  exportData: () => string;
  deleteAccountData: () => Promise<void>;
  resetTelemetryToDefault: () => void;
}

const DEFAULT_SIGNALS: WellnessSignals = {
  typing_speed: 65,
  typing_accuracy: 92,
  typing_latency: 120,
  typing_errors: 3,
  sleep_duration: 7.2,
  sleep_quality: 70,
  steps: 8000,
  screen_time: 5.5,
  social_minutes: 90,
  social_quality: 3
};

const DEFAULT_QUESTIONS: Question[] = [
  { id: 1, textEn: "How calm and relaxed did you feel during stressful moments today?", textHi: "आज तनावपूर्ण क्षणों के दौरान आप कितने शांत और सहज महसूस कर रहे थे?", textGu: "આજે તણાવની ક્ષણો દરમિયાન તમે કેટલા શાંત અને હળવા અનુભવતા હતા?", value: null },
  { id: 2, textEn: "How restful and restorative was your sleep last night?", textHi: "कल रात आपकी नींद कितनी आरामदायक और ताज़ा करने वाली थी?", textGu: "ગઈકાલે રાત્રે તમારી ઊંઘ કેટલી આરામદાયક અને તાજગી આપનારી હતી?", value: null },
  { id: 3, textEn: "How motivated did you feel to complete your scheduled tasks today?", textHi: "आज अपने निर्धारित कार्यों को पूरा करने के लिए आप कितना प्रेरित महसूस कर रहे थे?", textGu: "આજે તમારા નિર્ધારિત કાર્યો પૂર્ણ કરવા માટે તમે કેટલા પ્રેરિત અનુભવતા હતા?", value: null },
  { id: 4, textEn: "Did you feel connected and supported in your interactions with others today?", textHi: "क्या आज दूसरों के साथ बातचीत में आपने जुड़ाव और समर्थन महसूस किया?", textGu: "શું आप आज अन्यो साथेनी वातचीतमं जोडान अने टेको अनुभव्यो?", value: null },
  { id: 5, textEn: "How energetic and physically fit did you feel today?", textHi: "आज आप कितना ऊर्जावान और शारीरिक रूप से फिट महसूस कर रहे थे?", textGu: "આજે તમે કેટલા ઉર્જાવાન અને શારીરિક રીતે ફિટ અનુભવતા હતા?", value: null },
  { id: 6, textEn: "To what extent did you feel overwhelmed by your professional or daily commitments today?", textHi: "आज आप अपनी पेशेवर या दैनिक प्रतिबद्धताओं से किस हद तक अभिभूत महसूस कर रहे थे?", textGu: "આજે તમે તમારી વ્યાવસાયિક કે દૈનિક જવાબદારીઓથી કેટલા અંશે ભરાઈ ગયેલા અનુભવતા હતા?", value: null },
  { id: 7, textEn: "How frequently did you experience difficulties focusing on tasks today?", textHi: "आज आपको कार्यों पर ध्यान केंद्रित करने में कितनी बार कठिनाइयों का सामना करना पड़ा?", textGu: "આજે તમને કાર્યો પર ધ્યાન કેન્દ્રિત કરવામાં કેટલી વાર મુશ્કેલીઓનો સામનો કરવો પડ્યો?", value: null },
  { id: 8, textEn: "How often did you feel a sense of loneliness or isolation today?", textHi: "आज आपने कितनी बार अकेलेपन या अलगाव की भावना महसूस की?", textGu: "આજે તમે કેટલી વાર એકલતા અથવા અલગताની લાગણી અનુભવી?", value: null },
  { id: 9, textEn: "How would you rate your level of anxiety or apprehension about upcoming events today?", textHi: "आज आने वाली घटनाओं के बारे में आपकी चिंता या आशंका का स्तर क्या था?", textGu: "આજે આગામી ઘટનાઓ વિશે તમારી ચિંતા અથવા આશંકાનું સ્તર શું હતું?", value: null },
  { id: 10, textEn: "Did you take time for self-reflection or mindfulness today?", textHi: "क्या आपने आज आत्म-चिंतन या ध्यान के लिए समय निकाला?", textGu: "શું તમે આજે આત્મ-ચિંતન અથવા ધ્યાન માટે સમય કાઢ્યો?", value: null }
];

const DEFAULT_TASKS: Task[] = [
  { id: 1, text: "Perform 4-7-8 Breathing Exercise (5 minutes)", completed: false },
  { id: 2, text: "Take a 20-minute screen break and walk outdoors", completed: false },
  { id: 3, text: "Write 3 things you are grateful for in the Gratitude Journal", completed: false },
  { id: 4, text: "Hydrate: Drink at least 3 liters of water today", completed: false },
  { id: 5, text: "Limit screen time to under 6 hours total", completed: false }
];

const INITIAL_CHAT_MESSAGES: ChatMessage[] = [
  {
    id: "init",
    sender: "assistant",
    text: "Hello! I am your SentienceX AI Wellness Assistant. I analyze your typing speed, sleep patterns, steps, screen time, and emotional affect responses to predict your stress, anxiety, burnout, and overall wellness. How can I help you today?",
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
];

const DEFAULT_PREDICTIONS = {
  stress: 35.0,
  burnout: 30.0,
  anxiety: 40.0,
  motivation: 65.0,
  loneliness: 35.0,
  cognitive_fatigue: 30.0,
  overall_wellness: 70.0
};

// Helper to check localStorage
const getLocalStorageItem = (key: string, defaultValue: any) => {
  if (typeof window === 'undefined') return defaultValue;
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
};

const setLocalStorageItem = (key: string, value: any) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error(e);
    }
  }
};

export const useWellnessStore = create<WellnessState>((set, get) => {
  // Initialize state from local storage or defaults
  const initialUser = getLocalStorageItem('sentiencex_user', null);
  const initialSignals = getLocalStorageItem('sentiencex_signals', DEFAULT_SIGNALS);
  const initialQuestions = getLocalStorageItem('sentiencex_questions', DEFAULT_QUESTIONS);
  const initialLanguage = getLocalStorageItem('sentiencex_lang', 'en');
  const initialConsentTelemetry = getLocalStorageItem('sentiencex_consent_telemetry', true);
  const initialConsentSharing = getLocalStorageItem('sentiencex_consent_sharing', false);
  const initialConsentVoice = getLocalStorageItem('sentiencex_consent_voice', false);
  const initialLastDeeperCheckIn = getLocalStorageItem('sentiencex_last_deeper_checkin', null);
  const initialPredictions = getLocalStorageItem('sentiencex_predictions', DEFAULT_PREDICTIONS);
  const initialPredictionSource = getLocalStorageItem('sentiencex_pred_source', 'local_approx');
  const initialTasks = getLocalStorageItem('sentiencex_tasks', DEFAULT_TASKS);
  const initialChat = getLocalStorageItem('sentiencex_chat', INITIAL_CHAT_MESSAGES);
  const initialSignalsSubmitted = getLocalStorageItem('sentiencex_signals_submitted', false);
  const initialQuestionsSubmitted = getLocalStorageItem('sentiencex_questions_submitted', false);
  const initialGroundTruth = getLocalStorageItem('sentiencex_ground_truth', { phq9: null, gad7: null, lastSubmitted: null });
  const initialOnboarding = getLocalStorageItem('sentiencex_onboarding', false);
  const initialStreakCount = getLocalStorageItem('sentiencex_streak_count', 0);
  const initialLastSubDate = getLocalStorageItem('sentiencex_last_sub_date', null);

  // Helper to run predictions using current signals and questions
  const runPredictionsHelper = async (currentSignals: WellnessSignals, currentQuestions: Question[]) => {
    set({ isPredicting: true });
    
    let sum = 0;
    let count = 0;
    currentQuestions.forEach(q => {
      if (q.value !== null) {
        if ([6, 7, 8, 9].includes(q.id)) {
          sum += (6 - q.value); // Invert negative questions
        } else {
          sum += q.value;
        }
        count++;
      }
    });
    
    const avgAffect = count > 0 ? sum / count : 3.0;
    
    const result = await getWellnessPredictions(currentSignals, avgAffect);
    
    set({
      predictions: result.predictions,
      predictionSource: result.source,
      isPredicting: false
    });

    setLocalStorageItem('sentiencex_predictions', result.predictions);
    setLocalStorageItem('sentiencex_pred_source', result.source);
    
    const overall = result.predictions.overall_wellness;
    let newTasks = [...DEFAULT_TASKS];
    if (overall < 50) {
      newTasks = [
        { id: 1, text: "Connect with NIMHANS support line or iCall helpline", completed: false },
        { id: 2, text: "Review Therapist Directory & schedule a consultation", completed: false },
        { id: 3, text: "Notify your designated emergency contact / family member", completed: false },
        { id: 4, text: "Guided Grounding CBT Exercise (10 minutes)", completed: false },
        { id: 5, text: "Ensure 8+ hours of offline sleep environment", completed: false }
      ];
    } else if (overall < 70) {
      newTasks = [
        { id: 1, text: "Guided meditation for stress reduction (10 mins)", completed: false },
        { id: 2, text: "CBT thought log record entry", completed: false },
        { id: 3, text: "Disconnect screen 1 hour before bedtime", completed: false },
        { id: 4, text: "Hydrate: Drink at least 3 liters of water", completed: false },
        { id: 5, text: "20-minute physical stretch or low-intensity walk", completed: false }
      ];
    } else if (overall < 80) {
      newTasks = [
        { id: 1, text: "Outdoor stroll or breathing walk (15 mins)", completed: false },
        { id: 2, text: "10-minute deep diaphragmatic breathing session", completed: false },
        { id: 3, text: "Listen to ambient / calming music playlist", completed: false },
        { id: 4, text: "Call or text a supportive friend / family member", completed: false },
        { id: 5, text: "Record sleep duration and quality metrics", completed: false }
      ];
    }
    
    set({ tasks: newTasks });
    setLocalStorageItem('sentiencex_tasks', newTasks);
  };

  return {
    user: initialUser,
    language: initialLanguage,
    signals: initialSignals,
    signalsSubmittedToday: initialSignalsSubmitted,
    questions: initialQuestions,
    questionsSubmittedToday: initialQuestionsSubmitted,
    groundTruth: initialGroundTruth,
    isOnboarding: initialOnboarding,
    streakCount: initialStreakCount,
    lastSubmissionDate: initialLastSubDate,
    predictions: initialPredictions,
    predictionSource: initialPredictionSource,
    isPredicting: false,
    tasks: initialTasks,
    chatMessages: initialChat,
    consentTelemetry: initialConsentTelemetry,
    consentSharing: initialConsentSharing,
    consentVoice: initialConsentVoice,
    lastDeeperCheckInTime: initialLastDeeperCheckIn,
    isChatbotOpen: false,
    setChatbotOpen: (val) => set({ isChatbotOpen: val }),

    login: (email, name, picture) => {
      const session = { email, token: 'cookie_session_active', name, picture };
      set({ user: session });
      setLocalStorageItem('sentiencex_user', session);
    },

    logout: async () => {
      set({ user: null });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('sentiencex_user');
      }
      try {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.error("Backend logout call failed:", err);
      }
    },

    checkSession: async () => {
      // Sync metadata at load time
      await fetchAndCacheMetadata();
      try {
        const res = await fetch(`${API_BASE_URL}/auth/session`, {
          credentials: 'include'
        });
        if (res.ok) {
          const data = await res.json();
          if (data.status === 'success' && data.user) {
            const session = { 
              email: data.user.email, 
              token: 'cookie_session_active', 
              name: data.user.name, 
              picture: data.user.picture 
            };
            set({ user: session });
            setLocalStorageItem('sentiencex_user', session);
            
            // Check streak continuity
            const lastDateStr = get().lastSubmissionDate;
            if (lastDateStr) {
              const todayStr = new Date().toISOString().split('T')[0];
              const lastDate = new Date(lastDateStr);
              const todayDate = new Date(todayStr);
              const diffTime = Math.abs(todayDate.getTime() - lastDate.getTime());
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (diffDays > 1) {
                set({ streakCount: 0 });
                setLocalStorageItem('sentiencex_streak_count', 0);
              }
            }

            // Sync/fetch DB telemetry on load
            const exportRes = await fetch(`${API_BASE_URL}/data/export`, {
              credentials: 'include'
            });
            if (exportRes.ok) {
              const exportData = await exportRes.json();
              if (exportData.status === 'success' && exportData.history && exportData.history.length > 0) {
                const latest = exportData.history[0];
                set({
                  signals: latest.signals || get().signals,
                  questions: latest.questions || get().questions,
                  predictions: latest.predictions || get().predictions,
                  groundTruth: latest.ground_truth || get().groundTruth,
                  signalsSubmittedToday: true,
                  questionsSubmittedToday: true
                });
                setLocalStorageItem('sentiencex_signals', latest.signals || get().signals);
                setLocalStorageItem('sentiencex_questions', latest.questions || get().questions);
                setLocalStorageItem('sentiencex_predictions', latest.predictions || get().predictions);
                setLocalStorageItem('sentiencex_ground_truth', latest.ground_truth || get().groundTruth);
                setLocalStorageItem('sentiencex_signals_submitted', true);
                setLocalStorageItem('sentiencex_questions_submitted', true);
              }
            }
            return;
          }
        }
      } catch (e) {
        console.error("Session check failed, using local caching:", e);
      }
      
      // Guest mode or not authenticated
      set({ user: null });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('sentiencex_user');
      }
    },

    syncWithBackend: async () => {
      if (!get().user) return;
      try {
        await fetch(`${API_BASE_URL}/data/sync`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            signals: get().signals,
            questions: get().questions,
            predictions: get().predictions,
            ground_truth: get().groundTruth
          }),
          credentials: 'include'
        });
      } catch (err) {
        console.error("Failed to sync telemetry with backend:", err);
      }
    },

    setLanguage: (language) => {
      set({ language });
      setLocalStorageItem('sentiencex_lang', language);
    },

    updateSignal: (key, value) => {
      const updatedSignals = { ...get().signals, [key]: value };
      set({ signals: updatedSignals });
      setLocalStorageItem('sentiencex_signals', updatedSignals);
    },

    submitSignals: async () => {
      set({ signalsSubmittedToday: true });
      setLocalStorageItem('sentiencex_signals_submitted', true);
      get().incrementStreak();
      await runPredictionsHelper(get().signals, get().questions);
      await get().syncWithBackend();
    },

    answerQuestion: (id, value) => {
      const updatedQuestions = get().questions.map(q => 
        q.id === id ? { ...q, value } : q
      );
      set({ questions: updatedQuestions });
      setLocalStorageItem('sentiencex_questions', updatedQuestions);
    },

    submitQuestions: async () => {
      set({ questionsSubmittedToday: true });
      setLocalStorageItem('sentiencex_questions_submitted', true);
      get().incrementStreak();
      await runPredictionsHelper(get().signals, get().questions);
      await get().syncWithBackend();
    },

    submitGroundTruth: async (phq9: number, gad7: number) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedGroundTruth = {
        phq9,
        gad7,
        lastSubmitted: todayStr
      };
      set({ groundTruth: updatedGroundTruth });
      setLocalStorageItem('sentiencex_ground_truth', updatedGroundTruth);
      await get().syncWithBackend();
    },

    setIsOnboarding: (val: boolean) => {
      set({ isOnboarding: val });
      setLocalStorageItem('sentiencex_onboarding', val);
    },

    incrementStreak: () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastDate = get().lastSubmissionDate;
      let currentStreak = get().streakCount;

      if (lastDate === todayStr) {
        return; // Already submitted today
      }

      if (lastDate) {
        const last = new Date(lastDate);
        const today = new Date(todayStr);
        const diffTime = Math.abs(today.getTime() - last.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
          currentStreak += 1;
        } else {
          currentStreak = 1;
        }
      } else {
        currentStreak = 1;
      }

      set({ streakCount: currentStreak, lastSubmissionDate: todayStr });
      setLocalStorageItem('sentiencex_streak_count', currentStreak);
      setLocalStorageItem('sentiencex_last_sub_date', todayStr);
    },

    toggleTask: (id) => {
      const updatedTasks = get().tasks.map(t => 
        t.id === id ? { ...t, completed: !t.completed } : t
      );
      set({ tasks: updatedTasks });
      setLocalStorageItem('sentiencex_tasks', updatedTasks);
    },

    addChatMessage: (text, sender, isCrisis) => {
      const newMsg: ChatMessage = {
        id: Math.random().toString(36).substring(7),
        sender,
        text,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isCrisis
      };
      const updatedChat = [...get().chatMessages, newMsg];
      set({ chatMessages: updatedChat });
      setLocalStorageItem('sentiencex_chat', updatedChat);
    },

    updateConsent: (consentTelemetry, consentSharing, consentVoice) => {
      const voice = consentVoice !== undefined ? consentVoice : get().consentVoice;
      set({ consentTelemetry, consentSharing, consentVoice: voice });
      setLocalStorageItem('sentiencex_consent_telemetry', consentTelemetry);
      setLocalStorageItem('sentiencex_consent_sharing', consentSharing);
      setLocalStorageItem('sentiencex_consent_voice', voice);
    },

    submitClinicalLog: async (phq9Answers: number[], phq9Score: number, gad7Answers: number[], gad7Score: number) => {
      const todayStr = new Date().toISOString().split('T')[0];
      const updatedGroundTruth = {
        phq9: phq9Score,
        gad7: gad7Score,
        lastSubmitted: todayStr
      };
      set({ 
        lastDeeperCheckInTime: todayStr,
        groundTruth: updatedGroundTruth
      });
      setLocalStorageItem('sentiencex_last_deeper_checkin', todayStr);
      setLocalStorageItem('sentiencex_ground_truth', updatedGroundTruth);

      if (get().user) {
        try {
          await fetch(`${API_BASE_URL}/data/clinical_log`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              phq9_answers: phq9Answers,
              phq9_score: phq9Score,
              gad7_answers: gad7Answers,
              gad7_score: gad7Score,
              predictions: get().predictions
            }),
            credentials: 'include'
          });
        } catch (err) {
          console.error("Failed to submit clinical log to backend:", err);
        }
      }
    },

    skipDeeperCheckIn: () => {
      const todayStr = new Date().toISOString().split('T')[0];
      set({ lastDeeperCheckInTime: todayStr });
      setLocalStorageItem('sentiencex_last_deeper_checkin', todayStr);
    },

    exportData: () => {
      const dataToExport = {
        user: get().user?.email || "anonymous",
        timestamp: new Date().toISOString(),
        signals: get().signals,
        predictions: get().predictions,
        questions: get().questions.map(q => ({ id: q.id, score: q.value })),
        ground_truth: get().groundTruth,
        consents: {
          telemetry: get().consentTelemetry,
          sharing: get().consentSharing,
          voice: get().consentVoice
        },
        lastDeeperCheckInTime: get().lastDeeperCheckInTime
      };
      return JSON.stringify(dataToExport, null, 2);
    },

    deleteAccountData: async () => {
      set({
        user: null,
        signals: DEFAULT_SIGNALS,
        signalsSubmittedToday: false,
        questions: DEFAULT_QUESTIONS,
        questionsSubmittedToday: false,
        groundTruth: { phq9: null, gad7: null, lastSubmitted: null },
        predictions: DEFAULT_PREDICTIONS,
        predictionSource: 'local_approx',
        tasks: DEFAULT_TASKS,
        chatMessages: INITIAL_CHAT_MESSAGES,
        consentTelemetry: true,
        consentSharing: false,
        consentVoice: false,
        lastDeeperCheckInTime: null
      });
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem('sentiencex_user');
        window.localStorage.removeItem('sentiencex_signals');
        window.localStorage.removeItem('sentiencex_signals_submitted');
        window.localStorage.removeItem('sentiencex_questions');
        window.localStorage.removeItem('sentiencex_questions_submitted');
        window.localStorage.removeItem('sentiencex_ground_truth');
        window.localStorage.removeItem('sentiencex_predictions');
        window.localStorage.removeItem('sentiencex_pred_source');
        window.localStorage.removeItem('sentiencex_tasks');
        window.localStorage.removeItem('sentiencex_chat');
        window.localStorage.removeItem('sentiencex_consent_telemetry');
        window.localStorage.removeItem('sentiencex_consent_sharing');
        window.localStorage.removeItem('sentiencex_consent_voice');
        window.localStorage.removeItem('sentiencex_last_deeper_checkin');
      }
      try {
        await fetch(`${API_BASE_URL}/data/delete`, {
          method: 'POST',
          credentials: 'include'
        });
      } catch (err) {
        console.error("Backend delete call failed:", err);
      }
    },

    resetTelemetryToDefault: () => {
      set({
        signals: DEFAULT_SIGNALS,
        signalsSubmittedToday: false,
        questions: DEFAULT_QUESTIONS,
        questionsSubmittedToday: false
      });
      setLocalStorageItem('sentiencex_signals', DEFAULT_SIGNALS);
      setLocalStorageItem('sentiencex_questions', DEFAULT_QUESTIONS);
      setLocalStorageItem('sentiencex_signals_submitted', false);
      setLocalStorageItem('sentiencex_questions_submitted', false);
    }
  };
});
