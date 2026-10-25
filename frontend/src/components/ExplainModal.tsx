'use client';

import React from 'react';
import { X, AlertTriangle, ShieldAlert, Sparkles, ArrowRight, CheckCircle2, MessageSquare } from 'lucide-react';
import { Combination } from '@/lib/api';
import Link from 'next/link';

interface ExplainModalProps {
  combination: Combination | null;
  onClose: () => void;
  patientId: string;
}

export default function ExplainModal({
  combination,
  onClose,
  patientId,
}: ExplainModalProps) {
  if (!combination) return null;

  const isCritical = combination.severity === 'CRITICAL';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isCritical
              ? 'bg-red-950/40 border-red-800/40'
              : 'bg-amber-950/40 border-amber-800/40'
          }`}
        >
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isCritical ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'
              }`}
            >
              {isCritical ? <ShieldAlert className="w-6 h-6" /> : <AlertTriangle className="w-6 h-6" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span
                  className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    isCritical
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                      : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  }`}
                >
                  {combination.severity} RISK COMBINATION
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Urgency Index: {combination.urgency_score}/100
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-0.5">{combination.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Biomarkers involved */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Interacting Biomarkers
            </h4>
            <div className="flex flex-wrap gap-2">
              {combination.biomarkers_involved.map((m, i) => (
                <span
                  key={i}
                  className="px-3 py-1 rounded-lg bg-slate-800 border border-slate-700 text-sm font-medium text-cyan-300 flex items-center gap-1.5"
                >
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  {m}
                </span>
              ))}
            </div>
          </div>

          {/* Patient Explanation */}
          <div className="p-4 rounded-xl bg-cyan-950/30 border border-cyan-800/40">
            <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-1.5 mb-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Patient-Friendly Summary
            </h4>
            <p className="text-slate-200 text-sm leading-relaxed">
              {combination.patient_explanation}
            </p>
          </div>

          {/* Clinical Pathophysiology Rationale */}
          <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Medical Rationale & Pathophysiology
            </h4>
            <p className="text-slate-300 text-sm leading-relaxed">
              {combination.clinical_rationale}
            </p>
          </div>

          {/* Action Items */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Recommended Clinical Steps
            </h4>
            <ul className="space-y-2">
              {combination.action_items.map((item, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-sm text-slate-300 bg-slate-800/40 p-2.5 rounded-lg border border-slate-800"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Suggested Consultation Questions */}
          {combination.suggested_questions && combination.suggested_questions.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-indigo-400" />
                Suggested Questions for Doctor's Cabin
              </h4>
              <div className="space-y-1.5">
                {combination.suggested_questions.map((q, idx) => (
                  <div
                    key={idx}
                    className="text-xs text-indigo-200 bg-indigo-950/30 border border-indigo-800/30 p-2 rounded-lg"
                  >
                    "{q}"
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="px-6 py-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-400 hover:text-white transition-colors"
          >
            Close Window
          </button>
          <Link
            href={`/cabin?patientId=${patientId}`}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-cyan-950 transition-all hover:scale-[1.02]"
          >
            <span>Consult AI Doctor Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
