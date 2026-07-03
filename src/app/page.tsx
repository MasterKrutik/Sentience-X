'use client';

import React, { useState, useEffect } from 'react';
import { useWellnessStore } from '../store/useWellnessStore';
import { AppShell } from '../components/AppShell';

// Import Views
import { LandingView } from '../components/views/LandingView';
import { DashboardView } from '../components/views/DashboardView';
import { QuestionsView } from '../components/views/QuestionsView';
import { SignalsView } from '../components/views/SignalsView';
import { WellnessView } from '../components/views/WellnessView';
import { TwinView } from '../components/views/TwinView';
import { InterventionsView } from '../components/views/InterventionsView';
import { SettingsView } from '../components/views/SettingsView';
import { VoiceView } from '../components/views/VoiceView';
import { ProgressView } from '../components/views/ProgressView';
import { ReportsView } from '../components/views/ReportsView';
import { OnboardingView } from '../components/views/OnboardingView';

export default function Home() {
  const { user, checkSession, isOnboarding } = useWellnessStore();
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch between server-render and localStorage states
  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#08090c] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-purple/30 border-t-brand-cyan rounded-full animate-spin" />
      </div>
    );
  }

  // If user is not authenticated, render the landing page / auth portal
  if (!user) {
    return <LandingView />;
  }

  // If new registration, render the Digital Twin onboarding genesis flow
  if (isOnboarding) {
    return <OnboardingView />;
  }

  // Render App Shell with subpage tabs switcher
  return (
    <AppShell>
      {(activeTab) => {
        switch (activeTab) {
          case 'dashboard':
            return <DashboardView />;
          case 'questions':
            return <QuestionsView />;
          case 'signals':
            return <SignalsView />;
          case 'voice':
            return <VoiceView />;
          case 'wellness':
            return <WellnessView />;
          case 'twin':
            return <TwinView />;
          case 'interventions':
            return <InterventionsView />;
          case 'progress':
            return <ProgressView />;
          case 'reports':
            return <ReportsView />;
          case 'settings':
            return <SettingsView />;
          default:
            return <DashboardView />;
        }
      }}
    </AppShell>
  );
}
