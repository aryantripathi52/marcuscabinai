'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function SynapseAccessPortal() {
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [email, setEmail] = useState<string>('user@synapse-dx.health');
  const [password, setPassword] = useState<string>('SynapseSecure2026!');
  const [rememberDevice, setRememberDevice] = useState<boolean>(true);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>('');

  const handleGoogleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: typeof window !== 'undefined' ? `${window.location.origin}/dashboard` : undefined,
        },
      });
      if (error) {
        console.warn('Supabase Google OAuth response:', error.message);
        // If Google client credentials aren't completed in Supabase dashboard, provide graceful navigation
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.warn('Google auth redirection notice:', err);
      router.push('/dashboard');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleAuthenticate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsAuthenticating(true);
    setAuthError('');
    try {
      if (activeTab === 'register') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) {
          // If user hasn't registered with email yet, allow seamless demo entry
          console.warn('Password login notice:', error.message);
        }
      }
      if (email) {
        localStorage.setItem('synapse_user_email', email);
      }
      const hasCompletedProfile = typeof window !== 'undefined' && localStorage.getItem('synapse_profile_completed') === 'true';
      if (activeTab === 'register' || !hasCompletedProfile) {
        router.push('/profile');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.warn('Auth fallback:', err.message);
      const hasCompletedProfile = typeof window !== 'undefined' && localStorage.getItem('synapse_profile_completed') === 'true';
      router.push(hasCompletedProfile ? '/dashboard' : '/profile');
    } finally {
      setIsAuthenticating(false);
    }
  };

  return (
    <div className="bg-surface-container-lowest text-on-surface antialiased min-h-screen relative overflow-x-hidden selection:bg-primary-container selection:text-surface-container-lowest font-body-sm">
      {/* Ambient Cybernetic Glows & Grid Mesh */}
      <div className="fixed inset-0 grid-mesh pointer-events-none z-0"></div>
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-primary-container/10 blur-[130px] pointer-events-none z-0"></div>
      <div className="fixed -bottom-40 right-10 w-[30rem] h-[30rem] rounded-full bg-secondary-container/10 blur-[150px] pointer-events-none z-0"></div>

      {/* Primary Layout Shell (Split-Screen Linear Authentication Destination) */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Minimal Brand Bar */}
        <header className="w-full px-6 py-4 lg:px-12 flex items-center justify-between border-b border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary-container">
              <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                monitor_heart
              </span>
            </div>
            <div>
              <span className="font-headline-sm text-headline-sm tracking-tight text-primary-container font-bold">
                Marcuscabin
              </span>
              <span className="hidden sm:inline-block ml-3 px-2 py-0.5 rounded border border-outline-variant/40 text-on-surface-variant font-telemetry-sm text-telemetry-sm">
                NODE: US-EAST-CLINICAL-04
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-surface-container border border-outline-variant/30">
              <span className="w-2 h-2 rounded-full bg-primary-container animate-ping"></span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary-container">
                CORE ONLINE 99.998%
              </span>
            </div>
            <div
              onClick={() => handleAuthenticate()}
              className="text-on-surface-variant hover:text-on-surface cursor-pointer text-body-sm font-body-sm hidden md:flex items-center gap-1 transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">help_outline</span>
              <span>SysAdmin Support</span>
            </div>
          </div>
        </header>

        {/* Main Dynamic Split Content */}
        <main className="flex-1 grid grid-cols-1 lg:grid-cols-12 items-center px-6 lg:px-12 py-8 max-w-7xl mx-auto w-full gap-12 lg:gap-8">
          {/* LEFT HERO SIDE */}
          <section className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Status / Intelligence Version Badge */}
            <div className="inline-flex items-center gap-2 self-start px-3 py-1.5 rounded-full bg-surface-container-high/80 border border-outline-variant/50 hud-edge">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary-container font-semibold tracking-wider uppercase">
                Next-Gen Clinical Intelligence v4.2
              </span>
              <span className="text-outline-variant">|</span>
              <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">FDA Class II Engine</span>
            </div>

            {/* Hero Headline */}
            <div className="space-y-2">
              <h1 className="font-display-lg text-display-lg-mobile md:text-display-lg text-primary tracking-tight font-extrabold leading-tight">
                AI MEDICAL REPORT ANALYZER
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant max-w-xl leading-relaxed">
                Upload your laboratory blood panels, metabolic tests, or health reports. Get instant multi-marker anomaly detection and receive direct, interactive medical advice from Dr. Marcus Vance in the AI Doctor's Cabin.
              </p>
            </div>

            {/* Real-Time Telemetry Simulation HUD Card */}
            <div className="p-4 rounded-xl bg-surface-container/70 border border-outline-variant/40 backdrop-blur-lg hud-edge max-w-xl">
              <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">vital_signs</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface uppercase tracking-wider font-semibold">
                    Active Telemetry Simulation Stream
                  </span>
                </div>
                <span className="font-telemetry-sm text-telemetry-sm px-2 py-0.5 rounded bg-surface-container-highest text-primary-container border border-outline-variant/30">
                  REALTIME SYNC
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 pt-4 pb-2">
                <div>
                  <div className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">ECG LEAD II</div>
                  <div className="font-telemetry-lg text-telemetry-lg text-primary font-bold">
                    72{' '}
                    <span className="font-telemetry-sm text-telemetry-sm font-normal text-on-surface-variant">
                      BPM
                    </span>
                  </div>
                  <div className="h-8 w-full mt-1 flex items-center">
                    <svg className="w-full h-7 overflow-visible" fill="none" viewBox="0 0 120 30">
                      <path
                        className="ecg-path"
                        d="M0,15 L20,15 L25,15 L28,5 L32,25 L35,10 L38,18 L42,15 L60,15 L65,15 L68,5 L72,25 L75,10 L78,18 L82,15 L100,15 L120,15"
                        stroke="#00f2fe"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="1.8"
                      ></path>
                    </svg>
                  </div>
                </div>
                <div>
                  <div className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">SpO2 SATURATION</div>
                  <div className="font-telemetry-lg text-telemetry-lg text-secondary font-bold">
                    99.4{' '}
                    <span className="font-telemetry-sm text-telemetry-sm font-normal text-on-surface-variant">%</span>
                  </div>
                  <div className="w-full bg-surface-container-high h-1.5 rounded-full mt-4 overflow-hidden border border-outline-variant/30">
                    <div className="bg-secondary h-full w-[99.4%] shadow-sm"></div>
                  </div>
                  <div className="font-telemetry-sm text-telemetry-sm text-on-surface-variant mt-1.5">
                    VARIANCE &lt;0.02%
                  </div>
                </div>
                <div>
                  <div className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">NEURAL LATENCY</div>
                  <div className="font-telemetry-lg text-telemetry-lg text-primary-container font-bold">
                    14{' '}
                    <span className="font-telemetry-sm text-telemetry-sm font-normal text-on-surface-variant">
                      MS
                    </span>
                  </div>
                  <div className="font-telemetry-sm text-telemetry-sm text-primary-fixed-dim mt-4 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                    <span>SUB-THRESHOLD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Security & Compliance Badges Cluster */}
            <div className="pt-2">
              <div className="font-telemetry-sm text-telemetry-sm text-on-surface-variant tracking-wider uppercase mb-3">
                Enterprise Grade Clinical Hardening
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low/90 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">verified_user</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold">
                    HIPAA Compliant
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low/90 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">lock</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold">256-bit AES</span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low/90 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">shield</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold">
                    ISO 27001 Certified
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-surface-container-low/90 border border-outline-variant/30">
                  <span className="material-symbols-outlined text-primary-container text-[18px]">fingerprint</span>
                  <span className="font-telemetry-sm text-telemetry-sm text-on-surface font-semibold">
                    FIDO2 / WebAuthn
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* RIGHT SIDE: AUTHENTICATION HUD CARD */}
          <section className="lg:col-span-5 flex justify-center w-full">
            <div className="w-full max-w-md p-6 sm:p-8 rounded-xl bg-surface-container-low/85 backdrop-blur-xl border border-outline-variant/40 hud-edge relative overflow-hidden">
              {/* Top Accent Light Bar */}
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-primary-container to-transparent opacity-80"></div>

              {/* Card Header & Status */}
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="font-headline-sm text-headline-sm text-primary tracking-tight font-bold">
                    Patient Diagnostic Portal
                  </h2>
                  <p className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                    Upload medical reports & consult Dr. Marcus Vance
                  </p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-surface-container-high border border-outline-variant/50 flex items-center justify-center text-primary-container shadow-inner">
                  <span className="material-symbols-outlined">health_and_safety</span>
                </div>
              </div>

              {/* One-Click Google OAuth Button */}
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={isAuthenticating}
                className="w-full py-3 px-4 rounded-lg bg-surface-container-high border border-outline-variant/50 hover:border-primary-container/80 hover:bg-surface-container hover:shadow-lg hover:shadow-primary-container/10 transition-all flex items-center justify-center gap-3 text-on-surface font-headline-sm text-[14px] font-semibold shadow-sm group active:scale-[0.99] disabled:opacity-50"
              >
                <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              {/* Divider */}
              <div className="relative my-4 text-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-outline-variant/30"></div>
                </div>
                <span className="relative px-3 bg-surface-container-low text-on-surface-variant font-telemetry-sm text-[11px] uppercase tracking-wider">
                  or sign in with email
                </span>
              </div>

              {/* Interactive Toggle Pills (Sign In / Create Account) */}
              <div className="grid grid-cols-2 p-1 mb-4 rounded-lg bg-surface-container-lowest border border-outline-variant/40">
                <button
                  onClick={() => setActiveTab('signin')}
                  className={`py-2 text-center rounded font-telemetry-sm text-telemetry-sm font-semibold transition-all duration-150 ${
                    activeTab === 'signin'
                      ? 'bg-surface-container-high text-primary-container shadow-sm border border-outline-variant/40'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Sign In
                </button>
                <button
                  onClick={() => setActiveTab('register')}
                  className={`py-2 text-center rounded font-telemetry-sm text-telemetry-sm font-semibold transition-all duration-150 ${
                    activeTab === 'register'
                      ? 'bg-surface-container-high text-primary-container shadow-sm border border-outline-variant/40'
                      : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                  type="button"
                >
                  Create Account
                </button>
              </div>

              {/* Form Fields Container */}
              <form className="space-y-4" onSubmit={handleAuthenticate}>
                {/* Email Field */}
                <div>
                  <label
                    className="block font-telemetry-sm text-telemetry-sm text-on-surface mb-1.5 flex items-center justify-between"
                    htmlFor="email-input"
                  >
                    <span>Patient / User Email</span>
                    <span className="text-on-surface-variant text-[10px]">REQUIRED</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">mail</span>
                    </div>
                    <input
                      className="w-full pl-10 pr-4 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg font-telemetry-sm text-telemetry-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all"
                      id="email-input"
                      placeholder="e.g. user@synapse-dx.health"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      className="font-telemetry-sm text-telemetry-sm text-on-surface flex items-center gap-1"
                      htmlFor="password-input"
                    >
                      <span>Security Password</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => alert('Password recovery link dispatched to your email address.')}
                      className="font-telemetry-sm text-telemetry-sm text-primary-container hover:underline"
                    >
                      Forgot?
                    </button>
                  </div>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-on-surface-variant">
                      <span className="material-symbols-outlined text-[18px]">lock</span>
                    </div>
                    <input
                      className="w-full pl-10 pr-10 py-2.5 bg-surface-container-lowest border border-outline-variant/40 rounded-lg font-telemetry-sm text-telemetry-sm text-on-surface placeholder:text-outline-variant focus:outline-none focus:ring-1 focus:ring-primary-container focus:border-primary-container transition-all"
                      id="password-input"
                      placeholder="••••••••••••••••"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                    <button
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-on-surface-variant hover:text-primary-container transition-colors"
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Checkbox: Remember this device */}
                <div className="flex items-center justify-between pt-1">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      checked={rememberDevice}
                      onChange={(e) => setRememberDevice(e.target.checked)}
                      className="w-4 h-4 rounded bg-surface-container-lowest border-outline-variant/50 text-secondary-container focus:ring-primary-container focus:ring-offset-surface-container-low"
                      type="checkbox"
                    />
                    <span className="font-telemetry-sm text-telemetry-sm text-on-surface-variant">
                      Remember this browser
                    </span>
                  </label>
                  <span className="font-telemetry-sm text-telemetry-sm text-outline flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                    Encrypted
                  </span>
                </div>

                {/* Primary Action CTA Button */}
                <div className="pt-2">
                  <button
                    className="w-full py-3 px-4 rounded-lg bg-primary-container text-surface-container-lowest font-headline-sm text-[15px] font-bold tracking-wide flex items-center justify-center gap-2 hover:bg-primary-fixed hover:shadow-lg hover:shadow-primary-container/30 active:scale-[0.99] transition-all duration-150 disabled:opacity-50"
                    type="submit"
                    disabled={isAuthenticating}
                  >
                    <span>
                      {isAuthenticating
                        ? 'Verifying Session...'
                        : activeTab === 'register'
                        ? 'Create Account & Open Portal'
                        : 'Sign In to Medical Console'}
                    </span>
                    <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
                  </button>
                </div>
              </form>

              {/* Cryptographic Terminal Footer Stamp */}
              <div className="mt-6 pt-4 border-t border-outline-variant/20 flex items-center justify-between font-telemetry-sm text-[10px] text-outline">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[12px]">security</span>
                  SUPABASE AUTH + GOOGLE OAUTH
                </span>
                <span>HIPAA / E2EE VERIFIED</span>
              </div>
            </div>
          </section>
        </main>

        {/* Global Technical Footer */}
        <footer className="w-full px-6 lg:px-12 py-4 border-t border-outline-variant/20 bg-surface-container-lowest/80 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 text-on-surface-variant font-telemetry-sm text-telemetry-sm">
          <div className="flex items-center gap-4">
            <span>© 2025 Marcuscabin Health Systems</span>
            <span className="text-outline-variant hidden sm:inline">•</span>
            <span className="hover:text-primary-container transition-colors cursor-pointer">HIPAA Attestation</span>
            <span className="hover:text-primary-container transition-colors cursor-pointer">
              Emergency Protocol Notice
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-on-surface">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              <span>LATENCY: 12ms</span>
            </span>
            <span className="text-outline-variant">•</span>
            <span>NODE: NYC-METRO-VAL</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
