import React, { useState } from 'react';
import { useWellnessStore } from '../../store/useWellnessStore';
import { translations, Language } from '../../utils/i18n';
import { GlassCard } from '../ui/GlassCard';
import { 
  Settings, User, Shield, Key, Moon, Sun, 
  Languages, Download, Trash2, CheckCircle2, 
  Info, AlertTriangle, Scale
} from 'lucide-react';

export function SettingsView() {
  const { 
    user,
    language, 
    setLanguage, 
    consentTelemetry, 
    consentSharing, 
    consentVoice,
    updateConsent, 
    exportData, 
    deleteAccountData,
    resetTelemetryToDefault
  } = useWellnessStore();

  const t = translations[language].app;
  const [successMsg, setSuccessMsg] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExport = () => {
    try {
      const dataStr = exportData();
      const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
      
      const exportFileDefaultName = `sentiencex_telemetry_export_${new Date().toISOString().slice(0,10)}.json`;
      
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportFileDefaultName);
      linkElement.click();
      
      setSuccessMsg('Data exported successfully as JSON file.');
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async () => {
    await deleteAccountData();
    // Redirect to root hash to reload landing page
    window.location.hash = '';
    window.location.reload();
  };

  const handleResetTelemetry = () => {
    resetTelemetryToDefault();
    setSuccessMsg('Telemetry logs and survey responses reset to baseline defaults.');
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-100 flex items-center gap-2">
          <Settings className="w-7 h-7 text-brand-cyan" />
          {translations[language].nav.settings}
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Settings dashboard. Configure language, visual themes, and telemetry data privacy controls.
        </p>
      </div>

      {/* Success Notification */}
      {successMsg && (
        <div className="p-4 rounded-xl border border-green-500/30 bg-green-950/20 text-green-300 text-xs flex items-center gap-3 animate-in slide-in-from-top-4">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-green-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: General Profile & Customization */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* User Profile Card */}
          <GlassCard>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-brand-cyan" /> User Profile
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-[10px] text-slate-500 block">User Name</span>
                <span className="text-sm font-bold text-slate-200" id="profile-settings-name">
                  {user ? (user.name?.trim() || "Guest User") : "Guest User"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Registered Email</span>
                <span className="text-sm font-bold text-slate-200" id="profile-settings-email">
                  {user?.email?.trim() || "Guest User"}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Active Auth Token</span>
                <span className="text-xs font-mono text-slate-400 truncate block max-w-full">
                  {user?.token ? `${user.token.slice(0, 15)}...jwt_validated` : "None (Guest Mode)"}
                </span>
              </div>
            </div>
          </GlassCard>

          {/* Theme & Localization Settings */}
          <GlassCard>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Languages className="w-4 h-4 text-brand-cyan" /> Appearance & Language
            </h3>
            
            <div className="space-y-4">
              {/* Language Selection */}
              <div className="space-y-2">
                <label className="text-xs text-slate-400">Choose Language</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['en', 'hi', 'gu'] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setLanguage(lang)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                        language === lang
                          ? 'bg-gradient-to-tr from-brand-purple to-brand-cyan border-white/20 text-white'
                          : 'bg-white/2 border-white/5 text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {lang === 'en' ? 'EN' : lang === 'hi' ? 'हिंदी' : 'ગુજરાતી'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </GlassCard>

        </div>

        {/* Right Side: Privacy Control Center & DPDP compliance */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Privacy Controls */}
          <GlassCard>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand-cyan" />
              {t.privacySettings}
            </h3>
            
            <div className="space-y-4">
              
              {/* Telemetry Consent Toggle */}
              <button
                onClick={() => updateConsent(!consentTelemetry, consentSharing, consentVoice)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all text-left cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={consentTelemetry}
                  onChange={() => {}} // handled by click
                  className="mt-0.5 accent-brand-purple cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{t.consentMarketing}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Allows the client-side ML engine to analyze WPM, sleep, and steps in order to predict wellness risk indices.</span>
                </div>
              </button>

              {/* Research Consent Toggle */}
              <button
                onClick={() => updateConsent(consentTelemetry, !consentSharing, consentVoice)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all text-left cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={consentSharing}
                  onChange={() => {}} // handled by click
                  className="mt-0.5 accent-brand-purple cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">{t.consentSharing}</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Allows sharing of anonymized behavioral signals (strictly scrubbing user names/emails) with researchers to improve models.</span>
                </div>
              </button>

              {/* Vocal Biometrics Consent Toggle */}
              <button
                onClick={() => updateConsent(consentTelemetry, consentSharing, !consentVoice)}
                className="w-full flex items-start gap-3 p-3 rounded-xl border border-white/5 bg-white/2 hover:bg-white/5 transition-all text-left cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={consentVoice}
                  onChange={() => {}} // handled by click
                  className="mt-0.5 accent-brand-purple cursor-pointer"
                />
                <div>
                  <span className="text-xs font-semibold text-slate-200 block">Vocal Biometrics Consent</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">Allows transient microphone access in the voice analysis tab to process vocal metrics. Raw audio is never stored or transmitted.</span>
                </div>
              </button>

              {/* Data Operations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-white/5">
                
                <button
                  onClick={handleExport}
                  className="py-2.5 px-4 rounded-xl border border-white/10 hover:border-brand-purple/20 bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-200"
                >
                  <Download className="w-4 h-4 text-brand-cyan" />
                  {t.exportData}
                </button>

                <button
                  onClick={handleResetTelemetry}
                  className="py-2.5 px-4 rounded-xl border border-white/10 hover:border-brand-purple/20 bg-white/5 hover:bg-white/10 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer text-slate-200"
                >
                  <Trash2 className="w-4 h-4 text-amber-400" />
                  Reset Telemetry
                </button>

              </div>
              
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full py-2.5 px-4 rounded-xl border border-red-500/20 hover:border-red-500/30 bg-red-950/10 hover:bg-red-950/20 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-400" />
                {t.deleteAccount}
              </button>

            </div>
          </GlassCard>

          {/* DPDP Compliance Card */}
          <GlassCard className="border border-brand-purple/20 bg-gradient-to-br from-brand-purple/5 to-transparent flex items-start gap-4">
            <Scale className="w-6 h-6 text-brand-cyan shrink-0 mt-0.5" />
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                DPDP Act, 2023 India Compliance Shield
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {t.dpdpNotice}
              </p>
              <div className="flex gap-4 text-[10px] font-semibold text-slate-300 pt-1">
                <span>✓ Right to Access</span>
                <span>✓ Right to Correction</span>
                <span>✓ Right to Erasure</span>
                <span>✓ Purpose Limitation</span>
              </div>
            </div>
          </GlassCard>

          {/* Clinical & Medical Disclaimer Card */}
          <GlassCard className="border border-red-500/20 bg-red-950/5 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-400 shrink-0 mt-0.5 animate-pulse" />
            <div className="space-y-1.5">
              <h4 className="text-xs font-bold text-red-400 uppercase tracking-wider">
                Clinical Diagnostic Disclaimer
              </h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                SentienceX is a self-guided mental wellness optimization platform, not a clinical diagnostic tool. The wellness indices (stress, anxiety, burnout) and behavioral telemetry drifts are processed using statistical machine learning models (XGBoost) and self-reported affect questionnaires. These insights are intended solely for educational, personal tracking, and reflection purposes. They must not be treated as professional medical diagnosis or clinical advice. If you are experiencing distress, severe anxiety, or thoughts of self-harm, please seek immediate help from qualified clinical professionals or call a crisis hotline.
              </p>
            </div>
          </GlassCard>

        </div>

      </div>

      {/* Delete Confirmation Modal Overlay */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <GlassCard className="max-w-md w-full border border-red-500/40 bg-slate-950 p-6 space-y-6">
            <div className="flex items-start gap-4 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-sm text-slate-100">Confirm Telemetry Deletion?</h3>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                  This action is irreversible. All of your daily signal logs, key latency evaluations, question affect logs, and trained predictions will be permanently wiped from the client-side secure store.
                </p>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button 
                onClick={handleDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                Confirm Erase Data
              </button>
            </div>
          </GlassCard>
        </div>
      )}

    </div>
  );
}
