'use client';

import React, { useEffect, useState, useRef } from 'react';
import { Volume2, VolumeX, Sparkles, Activity } from 'lucide-react';

interface DoctorAvatarProps {
  isSpeaking: boolean;
  doctorName?: string;
  specialty?: string;
  emotion?: 'neutral' | 'concerned' | 'encouraging' | 'explaining';
  compact?: boolean;
}

export default function DoctorAvatar({
  isSpeaking,
  doctorName = 'Dr. Marcus Vance, AI-MD',
  specialty = 'Clinical Pathology & Intelligent Triage',
  emotion = 'explaining',
  compact = false,
}: DoctorAvatarProps) {
  // Lip-sync viseme index: 0=closed, 1=slight open, 2=wide open, 3=round/O, 4=smile/wide
  const [mouthShape, setMouthShape] = useState<number>(0);
  const [isBlinking, setIsBlinking] = useState<boolean>(false);
  const [audioBars, setAudioBars] = useState<number[]>([12, 18, 28, 22, 14, 30, 16, 24]);

  // Periodic mouth animation while speaking
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isSpeaking) {
      interval = setInterval(() => {
        // Randomly cycle through natural phoneme mouth shapes
        const shapes = [1, 2, 3, 2, 4, 1, 3, 0];
        const nextShape = shapes[Math.floor(Math.random() * shapes.length)];
        setMouthShape(nextShape);

        // Randomize audio visualizer bars
        setAudioBars([
          Math.floor(Math.random() * 26) + 8,
          Math.floor(Math.random() * 32) + 12,
          Math.floor(Math.random() * 38) + 14,
          Math.floor(Math.random() * 28) + 10,
          Math.floor(Math.random() * 36) + 12,
          Math.floor(Math.random() * 40) + 16,
          Math.floor(Math.random() * 26) + 8,
          Math.floor(Math.random() * 34) + 10,
        ]);
      }, 120);
    } else {
      setMouthShape(0);
      setAudioBars([6, 8, 10, 8, 6, 8, 6, 8]);
    }
    return () => clearInterval(interval);
  }, [isSpeaking]);

  // Natural spontaneous eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 4200);
    return () => clearInterval(blinkInterval);
  }, []);

  return (
    <div className="flex flex-col items-center">
      {/* Outer Holographic Container */}
      <div className="relative group">
        {/* Glowing Aura Ring */}
        <div
          className={`absolute -inset-3 rounded-full blur-xl transition-all duration-700 ${
            isSpeaking
              ? 'bg-gradient-to-r from-cyan-500 via-blue-500 to-teal-400 opacity-60 animate-pulse'
              : 'bg-cyan-500/20 opacity-30'
          }`}
        />

        {/* Outer Ring Border with Rotating Gradient */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full p-[3px] bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-500 shadow-2xl shadow-cyan-950/50">
          <div className="w-full h-full rounded-full bg-slate-950/90 overflow-hidden relative flex items-center justify-center border border-cyan-500/30">
            {/* Ambient Background Grid inside Avatar */}
            <div
              className="absolute inset-0 opacity-20 pointer-events-none"
              style={{
                backgroundImage:
                  'radial-gradient(circle, #06b6d4 1px, transparent 1px)',
                backgroundSize: '16px 16px',
              }}
            />

            {/* SVG Illustrated Avatar with Interactive Lip-Sync */}
            <svg
              viewBox="0 0 200 200"
              className="w-full h-full transition-transform duration-500"
            >
              <defs>
                <linearGradient id="doctorCoat" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#f8fafc" />
                  <stop offset="100%" stopColor="#cbd5e1" />
                </linearGradient>
                <linearGradient id="scrubs" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#0891b2" />
                  <stop offset="100%" stopColor="#0e7490" />
                </linearGradient>
                <linearGradient id="skin" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fdba74" />
                  <stop offset="100%" stopColor="#fb923c" />
                </linearGradient>
                <linearGradient id="hair" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>

              {/* Shoulders & White Medical Coat */}
              <path
                d="M 20 200 L 20 160 Q 60 140 100 140 Q 140 140 180 160 L 180 200 Z"
                fill="url(#doctorCoat)"
              />

              {/* Medical Scrubs Inner V */}
              <polygon points="80,140 120,140 100,175" fill="url(#scrubs)" />

              {/* Stethoscope */}
              <path
                d="M 65 140 C 65 170, 75 185, 95 185 C 105 185, 125 175, 135 140"
                fill="none"
                stroke="#64748b"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <circle cx="100" cy="185" r="7" fill="#06b6d4" stroke="#e2e8f0" strokeWidth="2" />

              {/* Neck */}
              <rect x="88" y="115" width="24" height="28" fill="url(#skin)" />

              {/* Head Base */}
              <ellipse cx="100" cy="85" rx="36" ry="44" fill="url(#skin)" />

              {/* Hair */}
              <path
                d="M 60 75 Q 100 35 140 75 Q 145 60 135 48 Q 100 35 65 48 Z"
                fill="url(#hair)"
              />
              {/* Hair sides */}
              <path d="M 64 68 Q 60 90 62 100 Q 66 90 68 80 Z" fill="url(#hair)" />
              <path d="M 136 68 Q 140 90 138 100 Q 134 90 132 80 Z" fill="url(#hair)" />

              {/* Eyebrows */}
              <path
                d="M 75 70 Q 85 68 93 72"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M 125 70 Q 115 68 107 72"
                stroke="#1e293b"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />

              {/* Eyes */}
              {isBlinking ? (
                // Blinking line
                <>
                  <line x1="77" y1="80" x2="91" y2="80" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="109" y1="80" x2="123" y2="80" stroke="#0f172a" strokeWidth="2.5" strokeLinecap="round" />
                </>
              ) : (
                // Open eyes with medical reflection
                <>
                  <ellipse cx="84" cy="80" rx="6" ry="4.5" fill="#ffffff" />
                  <circle cx="84" cy="80" r="3.2" fill="#0284c7" />
                  <circle cx="85" cy="79" r="1.2" fill="#ffffff" />

                  <ellipse cx="116" cy="80" rx="6" ry="4.5" fill="#ffffff" />
                  <circle cx="116" cy="80" r="3.2" fill="#0284c7" />
                  <circle cx="117" cy="79" r="1.2" fill="#ffffff" />
                </>
              )}

              {/* Subtle glasses frame */}
              <rect x="74" y="73" width="20" height="14" rx="4" fill="none" stroke="#06b6d4" strokeWidth="1.2" opacity="0.8" />
              <rect x="106" y="73" width="20" height="14" rx="4" fill="none" stroke="#06b6d4" strokeWidth="1.2" opacity="0.8" />
              <line x1="94" y1="79" x2="106" y2="79" stroke="#06b6d4" strokeWidth="1.2" opacity="0.8" />

              {/* Nose */}
              <path d="M 100 82 L 97 95 L 103 95" stroke="#ea580c" strokeWidth="1.5" fill="none" strokeLinecap="round" />

              {/* DYNAMIC LIP-SYNC MOUTH */}
              {mouthShape === 0 && (
                // Neutral closed mouth
                <path d="M 91 106 Q 100 108 109 106" stroke="#991b1b" strokeWidth="2.5" strokeLinecap="round" fill="none" />
              )}

              {mouthShape === 1 && (
                // Slight open
                <path
                  d="M 91 105 Q 100 102 109 105 Q 100 110 91 105"
                  fill="#7f1d1d"
                  stroke="#991b1b"
                  strokeWidth="1.5"
                />
              )}

              {mouthShape === 2 && (
                // Wide open talking
                <ellipse cx="100" cy="107" rx="8" ry="5.5" fill="#450a0a" stroke="#991b1b" strokeWidth="2" />
              )}

              {mouthShape === 3 && (
                // Round 'O' vowel
                <circle cx="100" cy="107" r="5" fill="#450a0a" stroke="#991b1b" strokeWidth="2" />
              )}

              {mouthShape === 4 && (
                // Wide smile / consonant
                <path
                  d="M 90 104 Q 100 113 110 104"
                  stroke="#991b1b"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  fill="none"
                />
              )}
            </svg>

            {/* Live Audio Indicator Badge */}
            <div className="absolute bottom-2 inset-x-0 flex items-center justify-center gap-1 z-10">
              <div
                className={`px-3 py-0.5 rounded-full text-[10px] font-semibold tracking-wider uppercase flex items-center gap-1.5 shadow-lg border ${
                  isSpeaking
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/50 backdrop-blur-md'
                    : 'bg-slate-900/80 text-slate-400 border-slate-700/50'
                }`}
              >
                {isSpeaking ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                    <span>Speaking</span>
                  </>
                ) : (
                  <>
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    <span>Listening</span>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Audio Visualizer Frequency Bars (shown if not compact) */}
      {!compact && (
        <>
          <div className="mt-4 flex items-center justify-center gap-1.5 h-8 px-4 py-1 rounded-full bg-slate-900/60 border border-slate-800">
            <Activity className={`w-3.5 h-3.5 ${isSpeaking ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
            <div className="flex items-center gap-1 h-6">
              {audioBars.map((height, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-100 ${
                    isSpeaking ? 'bg-gradient-to-t from-cyan-500 to-teal-300' : 'bg-slate-700'
                  }`}
                  style={{ height: `${height}px` }}
                />
              ))}
            </div>
            <span className="text-xs text-slate-400 font-mono pl-1">
              {isSpeaking ? 'Audio Synced' : 'Ready'}
            </span>
          </div>

          <div className="text-center mt-3">
            <h3 className="text-lg font-bold text-slate-100 flex items-center justify-center gap-1.5">
              {doctorName}
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </h3>
            <p className="text-xs text-cyan-400/90 font-medium">{specialty}</p>
          </div>
        </>
      )}
    </div>
  );
}
