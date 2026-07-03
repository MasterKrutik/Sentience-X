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
  questionsDate: string | null;   // ISO date of the last getDailyQuestions() call
  
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
  refreshDailyQuestionsIfStale: () => void;
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

// --- 30-Question rotating bank (10 shown per day, date-seeded for consistency) ---
// isNegative = true means a HIGH answer indicates poor wellness (inverted in affect calc)
const QUESTION_BANK: (Omit<Question, 'value'> & { isNegative: boolean })[] = [
  // Stress & Calm (positive framing)
  { id: 1,  isNegative: false, textEn: "How calm and relaxed did you feel during stressful moments today?",          textHi: "आज तनावपूर्ण क्षणों में आप कितने शांत और सहज महसूस किए?",                 textGu: "આજે તણાવની ક્ષણોમાં તમે કેટલા શાંત અનુભવ્યા?" },
  { id: 2,  isNegative: false, textEn: "How restful and restorative was your sleep last night?",                    textHi: "कल रात आपकी नींद कितनी आरामदायक और ताज़ादम करने वाली थी?",                 textGu: "ગઈ રાત્રે તમારી ઊઘ કેટલી તાજગી આપનારી હતી?" },
  { id: 3,  isNegative: false, textEn: "How motivated did you feel to complete your scheduled tasks today?",         textHi: "आज अपने निर्धारित कार्यों को पूरा करने के लिए आप कितना प्रेरित महसूस किए?",textGu: "આજે તમારા કાર્યો પૂર્ણ કરવા કેટલો ઉત્સાહ અનુભવ્યો?" },
  { id: 4,  isNegative: false, textEn: "Did you feel connected and supported in your interactions with others today?",textHi: "क्या आज दूसरों के साथ बातचीत में आपने जुड़ाव और समर्थन महसूस किया?",        textGu: "આજે અન્ય લોકો સાથે જોડાણ અને ટેકો અનુભવ્યો?" },
  { id: 5,  isNegative: false, textEn: "How energetic and physically active did you feel today?",                    textHi: "आज आप कितना ऊर्जावान और शारीरिक रूप से सक्रिय महसूस किए?",                 textGu: "આજે તમે કેટલા ઉર્જાવાન અને સક્રિય અનુભવ્યા?" },
  // Stress & Overwhelm (negative framing)
  { id: 6,  isNegative: true,  textEn: "To what extent did you feel overwhelmed by your commitments today?",         textHi: "आज आप अपनी प्रतिबद्धताओं से किस हद तक अभिभूत महसूस किए?",                 textGu: "આજે તમે જવાબદારીઓથી કેટલા ભારે અનુભવ્યા?" },
  { id: 7,  isNegative: true,  textEn: "How frequently did you experience difficulties focusing on tasks today?",      textHi: "आज कार्यों पर ध्यान केंद्रित करने में आपको कितनी बार कठिनाई हुई?",          textGu: "આજે ધ્યાન કેન્દ્રિત કરવામાં કેટલી વાર મુશ્કેલી અનુભવી?" },
  { id: 8,  isNegative: true,  textEn: "How often did you feel a sense of loneliness or isolation today?",             textHi: "आज आपने कितनी बार अकेलेपन या अलगाव की भावना महसूस की?",                   textGu: "આજે એકલતા કે અલગタのઊ ભાવ કેટલી વાર અનુભવ્યો?" },
  { id: 9,  isNegative: true,  textEn: "How would you rate your anxiety or apprehension about upcoming events today?",  textHi: "आज आने वाली घटनाओं के बारे में आपकी चिंता या आशंका का स्तर क्या था?",    textGu: "આજે ભવિષ્યની ઘટનાઓ અંગે ચિંતાનું સ્તર કેટલું હતું?" },
  { id: 10, isNegative: false, textEn: "Did you take time for self-reflection or mindfulness today?",                  textHi: "क्या आज आपने आत्म-चिंतन या ध्यान के लिए समय निकाला?",                      textGu: "આજે આત્મ-ચિંતન અથવા ધ્યાન માટે સમય કાઢ્યો?" },
  // Burnout & Recovery
  { id: 11, isNegative: true,  textEn: "How drained or exhausted did you feel by the end of your workday?",           textHi: "कार्यदिवस के अंत में आप कितने थके हुए या थका हुआ महसूस किए?",              textGu: "કામના અંતે તમે કેટલા થાકેલા અનુભવ્યા?" },
  { id: 12, isNegative: false, textEn: "How satisfied were you with your overall productivity today?",                 textHi: "आज अपनी समग्र उत्पादकता से आप कितने संतुष्ट थे?",                          textGu: "આજે તમારી ઉત્પાદકતાથી કેટલા સંતુષ્ટ રહ્યા?" },
  { id: 13, isNegative: false, textEn: "Did you manage to take meaningful breaks during your work or study today?",    textHi: "क्या आज आपने अपने काम या अध्ययन के दौरान सार्थक ब्रेक लिए?",              textGu: "આજે કામ/અભ્યાસ દરમ્યાન અર્થपूर्ण વિરામ લીધો?" },
  { id: 14, isNegative: true,  textEn: "How much did negative thoughts intrude on your focus today?",                  textHi: "आज नकारात्मक विचारों ने आपके ध्यान में कितना बाधा डाला?",                   textGu: "આજે નકારાત્મક વિચારોએ ધ્યાન ભ્રષ્ટ કેટલું કર્યું?" },
  { id: 15, isNegative: false, textEn: "How effectively did you manage your time and priorities today?",                textHi: "आज आपने अपना समय और प्राथमिकताएं कितनी प्रभावी ढंग से प्रबंधित कीं?",     textGu: "આજે સમય અને અગ્રતાઓ કેટલી અસરકારક રીતે સંચાલિત કરી?" },
  // Sleep & Physical
  { id: 16, isNegative: false, textEn: "How well-rested and ready did you feel when you woke up this morning?",       textHi: "आज सुबह उठने पर आप कितना ताज़ा और तैयार महसूस किए?",                       textGu: "આજે સવારે ઉઠ્યા ત્યારે ઊઘ પૂરી થઈ હોય એવું અનુભવ્યું?" },
  { id: 17, isNegative: false, textEn: "How much physical activity or movement did you get today?",                    textHi: "आज आपने कितनी शारीरिक गतिविधि या गति की?",                                   textGu: "આજે કેટલી શારીરિક પ્રવૃત્તિ કે ચળવળ રહ્યી?" },
  { id: 18, isNegative: true,  textEn: "How much did physical discomfort (headache, tension) affect your day?",        textHi: "शारीरिक असुविधा (सिरदर्द, तनाव) ने आज आपके दिन को कितना प्रभावित किया?",   textGu: "શારીરિક અગ્વડ (માથાનો દુ:ખાવો, ખિંચ) આજ ના દિવસ पर कितना असर डाला?" },
  { id: 19, isNegative: false, textEn: "How balanced and nutritious was your diet / eating today?",                   textHi: "आज आपका आहार/खान-पान कितना संतुलित और पोषक था?",                             textGu: "આજે ભોજન/ખોરાક કેટલો સંतુલિત અને પૌષ્ટિક હતો?" },
  { id: 20, isNegative: false, textEn: "How well did you stay hydrated throughout the day?",                           textHi: "आज आप पूरे दिन कितने अच्छे से हाइड्रेटेड रहे?",                               textGu: "આખો દિવસ કેટલું સારું હાઇડ્રેટ રહ્યા?" },
  // Social & Emotional
  { id: 21, isNegative: false, textEn: "How positive and uplifting were your social interactions today?",               textHi: "आज आपकी सामाजिक बातचीत कितनी सकारात्मक और उत्साहजनक थी?",                  textGu: "આજે સામાજિક સંબંધ-ઓ કેટલા સ itis ckard-ful હ?" },
  { id: 22, isNegative: true,  textEn: "How much did interpersonal conflict or tension drain your energy today?",       textHi: "आज पारस्परिक संघर्ष या तनाव ने आपकी ऊर्जा को कितना कम किया?",              textGu: "આંતર-વ્yak tic nik t ens ion  ??? ??? ??? ??? ??? ???" },
  { id: 23, isNegative: false, textEn: "How much did you feel appreciated or valued by others today?",                  textHi: "आज आपको दूसरों द्वारा कितना सराहा और मूल्यवान महसूस किया?",                  textGu: "આજે અન્ય લોકો дру ??? kq da ??? c al  ??? ??? ??? ??? ??? ??? ??? ??? ???" },
  { id: 24, isNegative: false, textEn: "How effectively did you express and manage your emotions today?",                textHi: "आज आपने अपनी भावनाओं को कितनी प्रभावी ढंग से व्यक्त और प्रबंधित किया?",    textGu: "આજે ભ????? ??? ??? ??? ??? ???" },
  { id: 25, isNegative: false, textEn: "How much did you engage in activities that brought you genuine joy today?",      textHi: "आज आपने कितना समय उन गतिविधियों में बिताया जिनसे आपको वास्तविक खुशी मिलती है?",textGu: "આજ e ??? ??? ??? ??? ??? ??? ??? ??? ???" },
  // Cognitive & Mindfulness
  { id: 26, isNegative: false, textEn: "How clear and sharp did your thinking feel today?",                            textHi: "आज आपकी सोच कितनी स्पष्ट और तेज़ महसूस हुई?",                              textGu: "??? ??? ??? ??? ???" },
  { id: 27, isNegative: true,  textEn: "How much did you experience mental fog or confusion today?",                    textHi: "आज आपने कितना मानसिक धुंध या भ्रम का अनुभव किया?",                         textGu: "??? ??? ??? ??? ??? ???" },
  { id: 28, isNegative: false, textEn: "How well were you able to problem-solve or think creatively today?",            textHi: "आज आप समस्याओं को सुलझाने या रचनात्मक ढंग से सोचने में कितने सक्षम थे?",   textGu: "??? ??? ??? ??? ???" },
  { id: 29, isNegative: false, textEn: "How present and mindful were you during routine activities today?",             textHi: "आज दैनिक गतिविधियों के दौरान आप कितने सचेत और जागरूक रहे?",                 textGu: "??? ??? ??? ??? ??? ???" },
  { id: 30, isNegative: false, textEn: "How hopeful and optimistic did you feel about your future today?",               textHi: "आज अपने भविष्य के बारे में आप कितने आशावादी और सकारात्मक महसूस किए?",       textGu: "??? ??? ??? ??? ??? ???" },
];

/**
 * Returns 10 questions for today, seeded by date (YYYY-MM-DD).
 * The same 10 questions appear all day; they change the next day.
 * IDs 6-9 in the QUESTION_BANK use isNegative=true so affect calc inverts them.
 */
function getDailyQuestions(): Question[] {
  const today = new Date().toISOString().slice(0, 10); // e.g. '2026-07-03'
  // Simple deterministic seed from date string
  let seed = today.split('-').reduce((acc, part) => acc + parseInt(part, 10), 0);
  const shuffled = [...QUESTION_BANK];
  // Fisher-Yates shuffle with seeded pseudo-random
  for (let i = shuffled.length - 1; i > 0; i--) {
    seed = (seed * 1664525 + 1013904223) & 0xffffffff;
    const j = Math.abs(seed) % (i + 1);
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, 10).map(q => ({ ...q, value: null }));
}


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
  const todayStr = new Date().toISOString().split('T')[0]; // e.g. '2026-07-03'

  // Initialize state from local storage or defaults
  const initialUser = getLocalStorageItem('sentiencex_user', null);
  const initialSignals = getLocalStorageItem('sentiencex_signals', DEFAULT_SIGNALS);

  // --- Fix 1: Question date-stamp + daily invalidation ---
  // Load the date the current question set was generated. If it differs from today,
  // regenerate questions and clear submitted flag so stale answers never replay.
  const savedQuestionsDate: string | null = getLocalStorageItem('sentiencex_questions_date', null);
  const savedQuestions = getLocalStorageItem('sentiencex_questions', null);
  const questionsAreStale = savedQuestionsDate !== todayStr;

  let resolvedInitialQuestions: Question[];
  let resolvedQuestionsDate: string;
  let resolvedQuestionsSubmitted: boolean;

  if (!questionsAreStale && savedQuestions && savedQuestions.length > 0 && savedQuestions[0]?.textEn) {
    // Same day — reuse saved questions (keeps answers the user already gave)
    resolvedInitialQuestions = savedQuestions;
    resolvedQuestionsDate = savedQuestionsDate!;
    resolvedQuestionsSubmitted = getLocalStorageItem('sentiencex_questions_submitted', false);
  } else {
    // New day (or first ever load) — generate a fresh dated set, reset submission
    resolvedInitialQuestions = getDailyQuestions();
    resolvedQuestionsDate = todayStr;
    resolvedQuestionsSubmitted = false;
    setLocalStorageItem('sentiencex_questions', resolvedInitialQuestions);
    setLocalStorageItem('sentiencex_questions_date', todayStr);
    setLocalStorageItem('sentiencex_questions_submitted', false);
  }

  const initialLanguage = getLocalStorageItem('sentiencex_lang', 'en');
  const initialConsentTelemetry = getLocalStorageItem('sentiencex_consent_telemetry', true);
  const initialConsentSharing = getLocalStorageItem('sentiencex_consent_sharing', false);
  const initialConsentVoice = getLocalStorageItem('sentiencex_consent_voice', false);
  const initialLastDeeperCheckIn = getLocalStorageItem('sentiencex_last_deeper_checkin', null);
  const initialTasks = getLocalStorageItem('sentiencex_tasks', DEFAULT_TASKS);
  const initialChat = getLocalStorageItem('sentiencex_chat', INITIAL_CHAT_MESSAGES);
  const initialSignalsSubmitted: boolean = getLocalStorageItem('sentiencex_signals_submitted', false);
  const initialGroundTruth = getLocalStorageItem('sentiencex_ground_truth', { phq9: null, gad7: null, lastSubmitted: null });
  const initialOnboarding = getLocalStorageItem('sentiencex_onboarding', false);
  const initialStreakCount = getLocalStorageItem('sentiencex_streak_count', 0);
  const initialLastSubDate = getLocalStorageItem('sentiencex_last_sub_date', null);

  // --- Fix 4: Cold-start prediction gate ---
  // Only show stored predictions if the user has actually submitted data at least once.
  // If both submission flags are false AND no backend-sourced predictions exist,
  // predictionSource stays null → dashboard renders the "Submit data" placeholder.
  const hasSubmittedBefore: boolean = initialSignalsSubmitted || resolvedQuestionsSubmitted;
  const initialPredictions = hasSubmittedBefore
    ? getLocalStorageItem('sentiencex_predictions', DEFAULT_PREDICTIONS)
    : DEFAULT_PREDICTIONS;
  const initialPredictionSource: 'xgboost_server' | 'local_approx' | null = hasSubmittedBefore
    ? getLocalStorageItem('sentiencex_pred_source', 'local_approx')
    : null;

  // Helper to run predictions using current signals and questions
  const runPredictionsHelper = async (currentSignals: WellnessSignals, currentQuestions: Question[]) => {
    set({ isPredicting: true });
    
    // Compute question_affect — invert negative-framed questions using isNegative field from bank
    const bankMap = new Map(QUESTION_BANK.map(q => [q.id, q.isNegative]));
    let sum = 0;
    let count = 0;
    currentQuestions.forEach(q => {
      if (q.value !== null) {
        const isNeg = bankMap.get(q.id) ?? false;
        sum += isNeg ? (6 - q.value) : q.value;
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
    questions: resolvedInitialQuestions,
    questionsSubmittedToday: resolvedQuestionsSubmitted,
    questionsDate: resolvedQuestionsDate,
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
                // Determine if the synced data is from today (same ISO date)
                const syncDate = latest.timestamp ? String(latest.timestamp).slice(0, 10) : null;
                const isTodaysData = syncDate === new Date().toISOString().split('T')[0];
                // Only restore synced questions if they are from today — never replay stale answers
                const syncedQuestions = isTodaysData && latest.questions && latest.questions.length > 0
                  ? latest.questions
                  : get().questions;
                const today = new Date().toISOString().split('T')[0];
                set({
                  signals: latest.signals || get().signals,
                  questions: syncedQuestions,
                  questionsDate: today,
                  predictions: latest.predictions || get().predictions,
                  predictionSource: 'xgboost_server',
                  groundTruth: latest.ground_truth || get().groundTruth,
                  signalsSubmittedToday: isTodaysData,
                  questionsSubmittedToday: isTodaysData
                });
                setLocalStorageItem('sentiencex_signals', latest.signals || get().signals);
                setLocalStorageItem('sentiencex_questions', syncedQuestions);
                setLocalStorageItem('sentiencex_questions_date', today);
                setLocalStorageItem('sentiencex_predictions', latest.predictions || get().predictions);
                setLocalStorageItem('sentiencex_pred_source', 'xgboost_server');
                setLocalStorageItem('sentiencex_ground_truth', latest.ground_truth || get().groundTruth);
                setLocalStorageItem('sentiencex_signals_submitted', isTodaysData);
                setLocalStorageItem('sentiencex_questions_submitted', isTodaysData);
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
      const today = new Date().toISOString().split('T')[0];
      set({ questionsSubmittedToday: true, questionsDate: today });
      setLocalStorageItem('sentiencex_questions_submitted', true);
      setLocalStorageItem('sentiencex_questions_date', today);
      get().incrementStreak();
      await runPredictionsHelper(get().signals, get().questions);
      await get().syncWithBackend();
    },

    // Explicitly refresh the question set if today's date differs from stored date.
    // Call this from any view that renders questions as a defensive guard.
    refreshDailyQuestionsIfStale: () => {
      const today = new Date().toISOString().split('T')[0];
      if (get().questionsDate !== today) {
        const freshQuestions = getDailyQuestions();
        set({
          questions: freshQuestions,
          questionsDate: today,
          questionsSubmittedToday: false
        });
        setLocalStorageItem('sentiencex_questions', freshQuestions);
        setLocalStorageItem('sentiencex_questions_date', today);
        setLocalStorageItem('sentiencex_questions_submitted', false);
      }
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
        questions: getDailyQuestions(),
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
      const dailyQs = getDailyQuestions();
      set({
        signals: DEFAULT_SIGNALS,
        signalsSubmittedToday: false,
        questions: dailyQs,
        questionsSubmittedToday: false
      });
      setLocalStorageItem('sentiencex_signals', DEFAULT_SIGNALS);
      setLocalStorageItem('sentiencex_questions', dailyQs);
      setLocalStorageItem('sentiencex_signals_submitted', false);
      setLocalStorageItem('sentiencex_questions_submitted', false);
    }
  };
});
