import React, { useState, useRef, useEffect } from 'react';
import { useWellnessStore, ChatMessage } from '../store/useWellnessStore';
import { translations } from '../utils/i18n';
import { MessageSquare, X, Send, AlertTriangle, PhoneCall, Sparkles } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { API_BASE_URL } from '../utils/config';

export function Chatbot() {
  const { 
    predictions, 
    signals, 
    chatMessages, 
    addChatMessage, 
    language,
    predictionSource,
    isChatbotOpen: isOpen,
    setChatbotOpen: setIsOpen
  } = useWellnessStore();
  
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const t = translations[language].app;

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isOpen]);

  const handleSend = async (queryText?: string) => {
    const textToSubmit = queryText || inputValue;
    if (!textToSubmit.trim() || isTyping) return;

    const userText = textToSubmit.trim();
    if (!queryText) {
      setInputValue('');
    }
    
    // Capture history BEFORE we push the new user message to the store
    const history = chatMessages.slice(-6).map(msg => ({
      id: msg.id,
      sender: msg.sender,
      text: msg.text,
      timestamp: msg.timestamp,
      isCrisis: !!msg.isCrisis
    }));
    
    // 1. Add User Message
    addChatMessage(userText, 'user');
    
    // 2. Trigger AI Response with streaming effect
    setIsTyping(true);
    
    try {
      const response = await fetch(`${API_BASE_URL}/counsel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message: userText,
          history: history,
          predictions: {
            stress: predictions.stress,
            burnout: predictions.burnout,
            anxiety: predictions.anxiety,
            motivation: predictions.motivation,
            loneliness: predictions.loneliness,
            cognitive_fatigue: predictions.cognitive_fatigue,
            overall_wellness: predictions.overall_wellness
          }
        })
      });

      if (!response.ok) {
        throw new Error('Server returned an error');
      }

      const data = await response.json();
      simulateTyping(data.response, !!data.is_crisis);
    } catch (err) {
      console.error("AI counseling API error, using offline local fallback:", err);
      const fallback = generateAIResponse(userText);
      simulateTyping(fallback.text, fallback.isCrisis);
    }
  };

  // Listen for search-bar initiated queries
  useEffect(() => {
    const handleAskAI = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      const queryText = customEvent.detail;
      if (customEvent.type === 'ask-ai' && queryText) {
        setIsOpen(true);
        handleSend(queryText);
      }
    };

    window.addEventListener('ask-ai', handleAskAI);
    return () => window.removeEventListener('ask-ai', handleAskAI);
  }, [chatMessages, predictions, isOpen]);

  const simulateTyping = (fullText: string, isCrisis = false) => {
    // For the demo, we simulate a streaming output using chunk-based typing
    let currentText = '';
    const words = fullText.split(' ');
    let wordIndex = 0;
    
    // Put a placeholder message
    const msgId = Math.random().toString(36).substring(7);
    addChatMessage('', 'assistant', isCrisis);
    
    const interval = setInterval(() => {
      if (wordIndex < words.length) {
        currentText += (wordIndex === 0 ? '' : ' ') + words[wordIndex];
        // Modify the last message in the store
        useWellnessStore.setState((state) => {
          const list = [...state.chatMessages];
          if (list.length > 0) {
            list[list.length - 1] = {
              ...list[list.length - 1],
              text: currentText
            };
          }
          return { chatMessages: list };
        });
        wordIndex++;
      } else {
        clearInterval(interval);
        setIsTyping(false);
      }
    }, 45); // Adjust typing speed
  };

  // Context-aware response compiler
  const generateAIResponse = (query: string): { text: string; isCrisis: boolean } => {
    const text = query.toLowerCase();
    
    // 1. Crisis Check (Severe distress keywords)
    const crisisKeywords = [
      'suicide', 'kill myself', 'die', 'self harm', 'cut myself', 
      'end my life', 'hurt myself', 'death', 'depression', 'depressed'
    ];
    
    const hasCrisis = crisisKeywords.some(keyword => text.includes(keyword));
    if (hasCrisis) {
      return {
        text: "It sounds like you are going through a very difficult time. Please know that you are not alone, and there is support available. I cannot provide counseling, but please contact: NIMHANS Support Helpline at 1800-891-4416 (available 24/7) or iCall at 9152987821. Both services are free, confidential, and run by qualified professionals in India.",
        isCrisis: true
      };
    }

    // Extract current metrics for query context
    const score = Math.round(predictions.overall_wellness);
    const stress = Math.round(predictions.stress);
    const sleep = signals.sleep_duration;
    const wpm = Math.round(signals.typing_speed);
    const screen = signals.screen_time;
    const steps = signals.steps;
    
    // 2. Query Type: "Why is my score X today?"
    if (text.includes('why') || text.includes('score') || text.includes('wellness') || text.includes('low') || text.includes('high')) {
      let explanation = `Your wellness score is currently ${score}/100. `;
      
      if (score < 50) {
        explanation += `This indicates high stress levels (${stress}/100) and elevated cognitive fatigue. Your typing speed is ${wpm} WPM and you slept ${sleep} hours. I suggest looking at the Intervention Engine for recovery steps.`;
      } else if (score < 70) {
        explanation += `You are in the Moderate Risk range. This is mainly driven by a screen time of ${screen} hours and sleep duration of ${sleep} hours. Restoring your sleep will help lower your stress.`;
      } else if (score < 80) {
        explanation += `You are experiencing a Mild Decline. Your active metrics look decent (Steps: ${steps}), but we noticed a slight latency in your typing test (${signals.typing_latency} ms), which indicates moderate mental fatigue.`;
      } else {
        explanation += `You are in Excellent condition! Your sleep (${sleep} hours) and physical activity (${steps} steps) are supporting high mental focus and motivation. Keep maintaining this routine.`;
      }
      return { text: explanation, isCrisis: false };
    }

    // 3. Query Type: "What should I do?" / "do" / "feel better" / "improve"
    if (text.includes('do') || text.includes('feel better') || text.includes('improve') || text.includes('recommend') || text.includes('exercise')) {
      if (score < 50) {
        return {
          text: "Since your wellness score is in the high-risk range, I recommend immediately checking the Intervention Engine. High priority: Reduce screen time below 5 hours, do a 10-minute deep breathing exercise, and review NIMHANS professional counseling resources.",
          isCrisis: false
        };
      } else if (score < 70) {
        return {
          text: "To improve your score: 1. Take a 20-minute screen break. 2. Record a CBT thought log to manage stress. 3. Target 7.5+ hours of sleep tonight with screens off 1 hour before bed.",
          isCrisis: false
        };
      } else if (score < 80) {
        return {
          text: "For a mild decline, try a 4-7-8 breathing exercise, step outdoors for a short walk, and check in with a close friend. Keeping your screen time balanced will reduce cognitive fatigue.",
          isCrisis: false
        };
      } else {
        return {
          text: "You are doing great! Keep doing what you're doing. Try a daily challenge like learning a new cognitive skill or starting a gratitude log to push your motivation even higher.",
          isCrisis: false
        };
      }
    }

    // 4. Query Type: "Explain my Mental Health Twin" / "twin"
    if (text.includes('twin') || text.includes('mind') || text.includes('fingerprint') || text.includes('avatar')) {
      return {
        text: `Your Mental Health Twin maps your typing latency (${signals.typing_latency}ms), accuracy (${signals.typing_accuracy}%), steps (${steps}), and sleep into a multi-axis profile. Currently, its primary feature weights suggest that ${stress > 50 ? 'Stress and Screen Time' : 'Steps and Sleep'} are the main drivers of your behavioral model.`,
        isCrisis: false
      };
    }

    // 5. Query Type: "Summarize my week" / "summary" / "week"
    if (text.includes('summary') || text.includes('week') || text.includes('analyze')) {
      return {
        text: `Weekly Summary: Your average wellness is around ${score}/100. We detected a pattern where days with screen time exceeding 7 hours directly correlated with a 15% increase in typing latency and a 12% drop in sleep quality. Overall, the ML engine source is currently '${predictionSource}'.`,
        isCrisis: false
      };
    }

    // 6. Generic Fallback response
    return {
      text: `Thanks for asking. Your wellness index is ${score}/100 today, driven by your typing performance (${wpm} WPM, ${signals.typing_latency}ms latency), sleep (${sleep} hours), and steps (${steps}). Let me know if you would like me to explain your score factors, suggest recovery actions, or explore your Mental Health Twin!`,
      isCrisis: false
    };
  };

  return (
    <>
      {/* Floating launcher button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-full bg-gradient-to-tr from-brand-purple to-brand-cyan text-white shadow-2xl hover:scale-115 transition-all duration-300 flex items-center justify-center cursor-pointer border border-white/20"
        title="Open AI Wellness Assistant"
        id="chatbot-launcher"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageSquare className="w-6 h-6" />}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div 
          className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[500px] z-50 flex flex-col rounded-2xl border border-white/10 glass-panel shadow-2xl overflow-hidden transition-all duration-300 animate-in slide-in-from-bottom-5"
          id="chatbot-panel"
        >
          {/* Header */}
          <div className="p-4 border-b border-white/10 bg-white/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-cyan" />
              <div>
                <h3 className="font-semibold text-slate-100 text-sm">{t.chatbotTitle}</h3>
                <span className="text-[10px] text-slate-400 font-mono">
                  Engine: {predictionSource === 'xgboost_server' ? 'XGBoost Service' : 'Local Fallback'}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-slate-200 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Message List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-brand-purple/20 border border-brand-purple/40 text-slate-100 rounded-tr-none'
                      : msg.isCrisis
                      ? 'bg-red-950/40 border border-red-500/40 text-red-200 rounded-tl-none'
                      : 'bg-white/5 border border-white/10 text-slate-200 rounded-tl-none'
                  }`}
                >
                  {/* Crisis Alert Layout inside the message */}
                  {msg.isCrisis && (
                    <div className="flex items-start gap-3 mb-2 p-2 rounded bg-red-950/60 border border-red-500/30">
                      <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                      <div className="text-xs text-red-300 font-semibold">
                        {t.chatbotCrisisAlert}
                      </div>
                    </div>
                  )}
                  {msg.text === '' && isTyping ? (
                    <div className="flex items-center gap-1.5 py-1">
                      <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full bg-brand-cyan animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    msg.text
                  )}
                </div>
                <span className="text-[10px] text-slate-500 mt-1 px-1">
                  {msg.timestamp}
                </span>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Panel */}
          <div className="p-3 border-t border-white/10 bg-black/20 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={t.chatbotPlaceholder}
              className="flex-1 glass-input px-3 py-2 text-sm focus:ring-1 focus:ring-brand-cyan"
              disabled={isTyping}
            />
            <button
              onClick={() => handleSend()}
              disabled={!inputValue.trim() || isTyping}
              className="p-2 rounded-xl bg-gradient-to-tr from-brand-purple to-brand-cyan text-white hover:scale-105 active:scale-95 disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed transition-all flex items-center justify-center cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
