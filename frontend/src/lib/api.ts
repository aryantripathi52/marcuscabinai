/**
 * Marcuscabin - Frontend API Client & Supabase Integration.
 * Connects directly to FastAPI backend and Supabase for real clinical reports.
 */

import { supabase } from './supabase';

export interface Metric {
  name: string;
  value: number;
  unit: string;
  status: 'OPTIMAL' | 'NORMAL' | 'ELEVATED' | 'HIGH' | 'LOW' | 'CRITICAL' | string;
  reference_min?: number;
  reference_max?: number;
  critical_low?: number;
  critical_high?: number;
  category?: string;
  delta_percent?: number;
  description?: string;
  explanation?: string;
  history?: number[];
}

export interface Combination {
  id: string;
  title: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE';
  urgency_score: number;
  biomarkers_involved: string[];
  matched_details?: any[];
  clinical_rationale: string;
  patient_explanation: string;
  action_items: string[];
  suggested_questions?: string[];
}

export interface TriageSummary {
  total_metrics: number;
  critical_count: number;
  elevated_count: number;
  optimal_count: number;
  overall_urgency: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'NORMAL';
  urgency_score: number;
}

export interface PatientReport {
  patient_id: string;
  name: string;
  age: number;
  gender: string;
  dob?: string;
  mrn?: string;
  blood_type?: string;
  avatar_url?: string;
  report_id: string;
  report_type: string;
  date: string;
  ordering_physician?: string;
  facility?: string;
  clinical_notes?: string;
  triage_summary: TriageSummary;
  flags: Metric[];
  combinations: Combination[];
  speech_intro?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatResponse {
  reply: string;
  questions_remaining: number;
  is_final_turn: boolean;
  concluding_phrase?: string;
  action?: 'TRIGGER_EXPORT_TRANSITION' | 'CONTINUE_CONSULTATION';
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

// Live Database Mode: all patient data is fetched live from Supabase & FastAPI
export async function fetchAllReports(): Promise<PatientReport[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reports`, { next: { revalidate: 0 } });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error('[API] Error fetching reports from backend:', err);
  }
  return [];
}

export async function fetchReportById(patientId: string): Promise<PatientReport | null> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/reports/${patientId}`, { next: { revalidate: 0 } });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.error(`[API] Error fetching report ${patientId}:`, err);
  }
  return null;
}

export async function sendConsultationChat(payload: {
  patient_name: string;
  user_message: string;
  chat_history: ChatMessage[];
  report_context: any;
  questions_remaining: number;
  is_final_turn: boolean;
}): Promise<ChatResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.error('[API] Error sending chat to doctor:', err);
  }

  // Fallback response if network disconnects
  const isFinal = payload.is_final_turn || payload.questions_remaining <= 0;
  let reply = `Thank you for your question, ${payload.patient_name.split(' ')[0]}. Focus on addressing the flagged biomarker combinations through balanced nutrition and proactive clinic follow-up.`;
  if (isFinal) {
    reply += ' We have concluded our consultation session. Here is your final report.';
  } else {
    reply += ` You have ${payload.questions_remaining} question${payload.questions_remaining === 1 ? '' : 's'} remaining. What would you like to ask next?`;
  }

  return {
    reply,
    questions_remaining: Math.max(0, payload.questions_remaining),
    is_final_turn: isFinal,
    concluding_phrase: isFinal ? 'Here is your final report.' : undefined,
    action: isFinal ? 'TRIGGER_EXPORT_TRANSITION' : 'CONTINUE_CONSULTATION',
  };
}
