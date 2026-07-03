import React, { useState } from 'react';
import Script from 'next/script';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { Logo } from '../ui/Logo';
import { Sparkles, Brain, ShieldAlert, Activity, Check, Key, Mail, Lock, Settings, Languages, User } from 'lucide-react';
import { API_BASE_URL } from '../../utils/config';

const authSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters" }),
  name: z.string().optional()
});

type AuthFormValues = z.infer<typeof authSchema>;

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
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬી)' },
  { code: 'ml', name: 'Malayalam (മലയാളം)' },
  { code: 'as', name: 'Assamese (অসমীয়া)' },
  { code: 'mai', name: 'Maithili (मैथिली)' },
  { code: 'sat', name: 'Santali (संताली)' },
  { code: 'ks', name: 'Kashmiri (کٲشुर)' },
  { code: 'ne', name: 'Nepali (नेपाली)' },
  { code: 'kok', name: 'Konkani (कोंकणी)' },
  { code: 'sd', name: 'Sindhi (سنڌી)' },
  { code: 'doi', name: 'Dogri (डोगरी)' },
  { code: 'mni', name: 'Manipuri (मৈতৈলোন)' },
  { code: 'brx', name: 'Bodo (बर\')' },
  { code: 'ras', name: 'Rajasthani (राजस्थानी)' },
  { code: 'bhp', name: 'Bhojpuri (भोजपुरी)' },
  { code: 'har', name: 'Haryanvi (हरियाणवी)' },
  { code: 'tcy', name: 'Tulu (ತುಳು)' },
  { code: 'cgh', name: 'Chhattisgarhi (छत्तीसगढ़ी)' },
  { code: 'sa', name: 'Sanskrit (संस्कृतम्)' }
];

export function LandingView() {
  const { login, language, setLanguage, setIsOnboarding } = useWellnessStore();
  const [isRegister, setIsRegister] = useState(false);
  const [isSubmittingForm, setIsSubmittingForm] = useState(false);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showLangDropdown, setShowLangDropdown] = useState(false);
  const [googleClientId, setGoogleClientId] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('sentiencex_google_client_id') || process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '';
    }
    return '';
  });
  const [tempClientId, setTempClientId] = useState(googleClientId);
  
  const authTranslations = translations[language].auth;
  const appTranslations = translations[language].app;

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<AuthFormValues>({
    resolver: zodResolver(authSchema)
  });

  const onSubmit = async (data: AuthFormValues) => {
    setIsSubmittingForm(true);
    
    try {
      const endpoint = isRegister ? `${API_BASE_URL}/auth/signup` : `${API_BASE_URL}/auth/login`;
      const payload = isRegister 
        ? { email: data.email, password: data.password, name: data.name || data.email.split('@')[0] } 
        : { email: data.email, password: data.password };

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        credentials: 'include'
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || 'Authentication failed');
      }

      const resData = await response.json();
      if (isRegister) {
        setIsOnboarding(true);
      }
      login(
        resData.user?.email || data.email,
        resData.user?.name || data.name || data.email.split('@')[0],
        resData.user?.picture
      );
      setIsSubmittingForm(false);
      window.location.hash = 'dashboard';
    } catch (err: any) {
      setIsSubmittingForm(false);
      alert(err.message || 'Failed to authenticate. Ensure the FastAPI backend is running on port 8000.');
    }
  };

  const handleGoogleLogin = () => {
    if (!googleClientId) {
      setTempClientId('');
      setShowConfigModal(true);
      return;
    }
    
    try {
      if (!(window as any).google) {
        alert("Google Identity Services script is loading. Please try again in a few seconds.");
        return;
      }
      
      const client = (window as any).google.accounts.oauth2.initTokenClient({
        client_id: googleClientId,
        scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
        callback: (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error("Google Auth error:", tokenResponse.error);
            alert(`Google Authentication error: ${tokenResponse.error}`);
            return;
          }
          if (tokenResponse.access_token) {
            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
            })
            .then(res => res.json())
            .then(async userInfo => {
              const backendRes = await fetch(`${API_BASE_URL}/auth/google`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  email: userInfo.email,
                  name: userInfo.name,
                  picture: userInfo.picture,
                  token: tokenResponse.access_token
                }),
                credentials: 'include'
              });
              if (backendRes.ok) {
                const resData = await backendRes.json();
                if (resData.is_new) {
                  setIsOnboarding(true);
                }
                login(
                  resData.user?.email || userInfo.email,
                  resData.user?.name || userInfo.name,
                  resData.user?.picture || userInfo.picture
                );
                window.location.hash = 'dashboard';
              } else {
                throw new Error("Backend authentication failed");
              }
            })
            .catch(err => {
              console.error("Failed Google backend link:", err);
              alert("Google login succeeded but the backend server rejected the session. Make sure port 8000 is active.");
            });
          }
        },
      });
      client.requestAccessToken();
    } catch (e) {
      console.error("Failed to initialize Google Token Client:", e);
      alert("Error initializing Google Sign-In. Check that your Client ID is valid.");
    }
  };

  const handleSaveClientId = () => {
    if (!tempClientId.trim()) {
      alert("Please enter a valid Google Client ID or use Simulation Mode.");
      return;
    }
    const cleanId = tempClientId.trim();
    setGoogleClientId(cleanId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('sentiencex_google_client_id', cleanId);
    }
    setShowConfigModal(false);
    
    // Auto-trigger Google Login after saving
    setTimeout(() => {
      try {
        const client = (window as any).google.accounts.oauth2.initTokenClient({
          client_id: cleanId,
          scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
          callback: (tokenResponse: any) => {
            if (tokenResponse.access_token) {
              fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
              })
              .then(res => res.json())
              .then(async userInfo => {
                const backendRes = await fetch(`${API_BASE_URL}/auth/google`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: userInfo.email,
                    name: userInfo.name,
                    picture: userInfo.picture,
                    token: tokenResponse.access_token
                  }),
                  credentials: 'include'
                });
                if (backendRes.ok) {
                  const resData = await backendRes.json();
                  if (resData.is_new) {
                    setIsOnboarding(true);
                  }
                  login(
                    resData.user?.email || userInfo.email,
                    resData.user?.name || userInfo.name,
                    resData.user?.picture || userInfo.picture
                  );
                  window.location.hash = 'dashboard';
                }
              })
              .catch(err => console.error(err));
            }
          }
        });
        client.requestAccessToken();
      } catch (e) {
        console.error(e);
      }
    }, 100);
  };

  const handleSimulateGoogleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/simulate`, {
        method: 'POST',
        credentials: 'include'
      });
      if (response.ok) {
        const resData = await response.json();
        login(resData.user.email, resData.user.name, resData.user.picture);
        setShowConfigModal(false);
        window.location.hash = 'dashboard';
      } else {
        alert("Failed to run simulated login on backend.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to contact the backend server on port 8000.");
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 relative overflow-hidden bg-[var(--background)] text-[var(--foreground)] py-12">
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" />
      
      {/* Background ambient radial colors */}
      <div className="absolute top-1/4 left-1/4 w-[450px] h-[450px] bg-brand-purple/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2 animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      {/* Top Floating Language Switcher */}
      <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
        <div className="relative flex items-center gap-1">
          <button 
            onClick={() => setShowLangDropdown(!showLangDropdown)}
            className="p-2 rounded-xl bg-slate-900/60 dark:bg-slate-900/60 border border-white/10 text-slate-400 hover:text-slate-200 transition-colors flex items-center gap-1.5 text-xs cursor-pointer"
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
      </div>

      {/* Container grid */}
      <div className="max-w-5xl w-full grid grid-cols-1 lg:grid-cols-12 gap-12 items-center relative z-10">
        
        {/* Left Side: Product Intro */}
        <div className="lg:col-span-7 space-y-6 text-left">
          
          <Logo iconSize="lg" />

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight leading-none text-slate-50">
            The Intelligence That <span className="text-gradient">Feels</span> What Others Cannot.
          </h1>
          
          <p className="text-sm text-slate-400 max-w-lg leading-relaxed">
            A premium, AI-first Mental Wellness Operating System. SentienceX passively monitors behavioral telemetry, maps your digital Mental Twin, and delivers explainable recovery recovery interventions compliant with the DPDP Act, 2023.
          </p>

          {/* Features Highlights */}
          <div className="space-y-4 pt-4 max-w-md">
            
            <div className="flex gap-3">
              <div className="p-2 h-9 rounded-xl bg-white/5 border border-white/10 text-brand-cyan shrink-0 flex items-center justify-center">
                <Brain className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Mental Health Twin</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Continuous 2D coordinates drift mapping based on key latency and survey responses.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 h-9 rounded-xl bg-white/5 border border-white/10 text-brand-cyan shrink-0 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Intelligent Interventions</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Rule-based recommendations explaining exactly why they were suggested based on your telemetry.</p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="p-2 h-9 rounded-xl bg-white/5 border border-white/10 text-brand-cyan shrink-0 flex items-center justify-center">
                <Activity className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-slate-200">Local Telemetry Processing</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">Compliant with DPDP Act, 2023. You own your behavioral data, with full rights to access, export, or erase.</p>
              </div>
            </div>

          </div>

        </div>

        {/* Right Side: Auth Form */}
        <div className="lg:col-span-5 w-full">
          <GlassCard className="w-full border-white/10 bg-slate-950/40">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-lg font-bold text-slate-100 tracking-tight">
                  {isRegister ? authTranslations.register : authTranslations.login}
                </h2>
                <p className="text-[10px] text-slate-400 mt-1">
                  Secure biometric telemetry handshake. Plaintext credentials are never sent to the network.
                </p>
              </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
              
              {/* Name (Signup only) */}
              {isRegister && (
                <div className="space-y-1.5 relative">
                  <label className="text-xs text-slate-400 font-medium">Full Name</label>
                  <div className="relative flex items-center">
                    <User className="w-4 h-4 text-slate-500 absolute left-3" />
                    <input
                      type="text"
                      placeholder="Siddharth Sharma"
                      {...register('name')}
                      className="w-full glass-input pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-brand-cyan"
                    />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5 relative">
                <label className="text-xs text-slate-400 font-medium">Email Address</label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3" />
                  <input
                    type="email"
                    placeholder="you@domain.com"
                    {...register('email')}
                    className="w-full glass-input pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-brand-cyan"
                  />
                </div>
                {errors.email && (
                  <span className="text-[10px] text-red-400 font-medium">{errors.email.message}</span>
                )}
              </div>

              {/* Password */}
              <div className="space-y-1.5 relative">
                <label className="text-xs text-slate-400 font-medium">Password</label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    {...register('password')}
                    className="w-full glass-input pl-9 pr-3 py-2 text-xs focus:ring-1 focus:ring-brand-cyan"
                  />
                </div>
                {errors.password && (
                  <span className="text-[10px] text-red-400 font-medium">{errors.password.message}</span>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmittingForm}
                className="w-full py-2.5 glass-btn text-xs font-semibold flex items-center justify-center cursor-pointer"
              >
                {isSubmittingForm ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  isRegister ? authTranslations.register : authTranslations.login
                )}
              </button>

            </form>

            <div className="relative flex py-3 items-center mt-3">
              <div className="flex-grow border-t border-white/5"></div>
              <span className="flex-shrink mx-3 text-[9px] text-slate-500 uppercase tracking-widest font-bold">Or</span>
              <div className="flex-grow border-t border-white/5"></div>
            </div>

            {/* OAuth Buttons */}
            <div className="grid grid-cols-2 gap-3 mt-1">
              <button 
                onClick={handleGoogleLogin}
                className="py-2 px-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-[10px] font-medium text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <svg className="w-3 h-3 shrink-0" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.5z"/>
                  <path fill="#FBBC05" d="M5.24 14.28c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 6.93C.5 8.7 0 10.66 0 12.72s.5 4.02 1.39 5.79l3.85-2.99z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.34 0-5.86-2.21-6.76-4.51L.79 16.82C2.77 20.71 6.75 23 12 23z"/>
                </svg>
                Google
              </button>

              <button 
                onClick={() => alert("Apple Auth mock triggered. Use Google Login or email to sign in.")}
                className="py-2 px-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-[10px] font-medium text-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.21.67-2.93 1.49-.62.69-1.16 1.84-1.01 2.96 1.12.09 2.27-.57 2.95-1.39z"/>
                </svg>
                Apple
              </button>
            </div>

            {/* Toggle Sign In / Sign Up */}
            <div className="text-center mt-6">
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-[10px] text-slate-400 hover:text-slate-200 transition-colors hover:underline cursor-pointer"
              >
                {isRegister ? authTranslations.haveAccount : authTranslations.noAccount}{" "}
                <span className="text-brand-cyan font-bold">
                  {isRegister ? authTranslations.login : authTranslations.register}
                </span>
              </button>
            </div>

          </GlassCard>
        </div>

      </div>

      {/* Legally binding Medical Disclaimer compliance banner */}
      <div className="max-w-5xl w-full mt-12 relative z-10">
        <GlassCard className="border border-red-500/20 bg-red-950/5 p-5 flex flex-col md:flex-row items-start gap-4 text-left">
          <div className="p-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 shrink-0 mt-0.5">
            <ShieldAlert className="w-5 h-5 text-red-400" />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest block">Important Regulatory & Clinical Disclaimer</span>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              <strong>SentienceX is a self-guided mental wellness optimization platform.</strong> The clinical-adjacent wellness indicators (such as stress, anxiety, and burnout indices) and behavioral drift measurements are computed using statistical machine learning models (XGBoost) trained on simulated activity profiles and self-reported response metrics. 
              <span className="block mt-1">
                <strong>SentienceX is NOT a medical, clinical, or diagnostic tool,</strong> and does not claim diagnostic authority. The wellness insights, telemetry metrics, and recovery suggestions are for personal tracking and educational purposes only, and must NOT be used as a substitute for professional mental health diagnosis, treatment, or clinical intervention. If you are experiencing distress, thoughts of self-harm, or severe anxiety, please consult a qualified mental health professional or immediately contact national crisis services.
              </span>
            </p>
          </div>
        </GlassCard>
      </div>

      {/* Google Sign-In Configuration Modal */}
      {showConfigModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
          <GlassCard className="max-w-md w-full border-white/10 bg-slate-950/90 relative p-6 space-y-4 shadow-2xl">
            <div className="flex justify-between items-center pb-2 border-b border-white/5">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#EA4335" d="M12 5.04c1.66 0 3.2.57 4.38 1.69l3.27-3.27C17.67 1.54 14.98 1 12 1 7.35 1 3.37 3.67 1.39 7.56l3.85 2.99c.9-2.7 3.42-4.51 6.76-4.51z"/>
                  <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.36H12v4.47h6.44c-.28 1.47-1.11 2.71-2.36 3.55l3.66 2.84c2.14-1.97 3.39-4.87 3.39-8.5z"/>
                  <path fill="#FBBC05" d="M5.24 14.28c-.23-.69-.36-1.42-.36-2.18s.13-1.49.36-2.18L1.39 6.93C.5 8.7 0 10.66 0 12.72s.5 4.02 1.39 5.79l3.85-2.99z"/>
                  <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.01.68-2.31 1.09-3.9 1.09-3.34 0-5.86-2.21-6.76-4.51L.79 16.82C2.77 20.71 6.75 23 12 23z"/>
                </svg>
                Google Sign-In Configuration
              </h3>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed">
              To use Google Authentication, please provide your Google OAuth 2.0 Client ID. 
              Alternatively, you can test with <strong>Simulation Mode</strong> to log in instantly.
            </p>
            
            <div className="space-y-1.5">
              <label className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Google OAuth Client ID</label>
              <input
                type="text"
                value={tempClientId}
                onChange={(e) => setTempClientId(e.target.value)}
                placeholder="123456789-abc123def456.apps.googleusercontent.com"
                className="w-full glass-input px-3 py-2 text-xs focus:ring-1 focus:ring-brand-cyan"
              />
            </div>
            
            <div className="space-y-2 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={handleSaveClientId}
                  className="flex-1 py-2 glass-btn text-xs font-semibold text-slate-100 flex items-center justify-center cursor-pointer"
                >
                  Save & Connect
                </button>
                <button
                  onClick={handleSimulateGoogleLogin}
                  className="flex-1 py-2 px-3 rounded-xl border border-brand-purple/40 bg-brand-purple/10 hover:bg-brand-purple/20 text-brand-cyan text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 text-brand-cyan animate-pulse" />
                  Simulation Mode
                </button>
              </div>
              
              <button
                onClick={() => setShowConfigModal(false)}
                className="w-full py-2 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 text-[10px] font-medium text-slate-400 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
