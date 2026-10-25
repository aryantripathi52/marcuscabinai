'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import Link from 'next/link';
import { fetchReportById, sendConsultationChat, PatientReport, ChatMessage, Metric, Combination, TriageSummary } from '@/lib/api';
import { fetchReportById, sendConsultationChat, PatientReport, ChatMessage } from '@/lib/api';
import { speechService } from '@/lib/speech';
import DoctorAvatar from '@/components/DoctorAvatar';

function DoctorsCabinContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') || '';

  const [report, setReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [questionsRemaining, setQuestionsRemaining] = useState<number>(3);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadedFileName, setUploadedFileName] = useState<string>('');
  const [isAnalyzingNewReport, setIsAnalyzingNewReport] = useState<boolean>(false);

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isWaitingReply, setIsWaitingReply] = useState<boolean>(false);
  const [isRedirecting, setIsRedirecting] = useState<boolean>(false);
  const [sessionSeconds, setSessionSeconds] = useState<number>(258); // timer

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Live session timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `00:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleUploadAndAnalyzeReport = (customName?: string) => {
    setIsAnalyzingNewReport(true);
    speechService.stop();

    setTimeout(() => {
      setIsAnalyzingNewReport(false);
      setShowUploadModal(false);
      setQuestionsRemaining(3);

      const rawName = customName || uploadedFileName || 'Comprehensive Metabolic & Renal Panel';
      const cleanName = rawName.replace(/\.[^/.]+$/, '');

      let customProfile: any = null;
      try {
        const stored = localStorage.getItem('synapse_patient_profile');
        if (stored) customProfile = JSON.parse(stored);
      } catch (e) { }

      const patientName = customProfile?.full_name || customProfile?.name || 'Patient';
      const patientIdVal = patientId || customProfile?.id || customProfile?.patient_id || 'PAT-' + Math.floor(1000 + Math.random() * 9000);
      const lower = rawName.toLowerCase();

      let flags: Metric[] = [];
      let combinations: Combination[] = [];
      let triageSummary: TriageSummary;
      let announcement = '';

      if (lower.includes('lipid') || lower.includes('cholesterol') || lower.includes('cardio')) {
        flags = [
          { name: 'Total Cholesterol', value: 248, unit: 'mg/dL', status: 'CRITICAL', reference_min: 125, reference_max: 200, category: 'Lipid' },
          { name: 'Triglycerides', value: 232, unit: 'mg/dL', status: 'ELEVATED', reference_min: 0, reference_max: 150, category: 'Lipid' },
          { name: 'LDL-C (Bad)', value: 164, unit: 'mg/dL', status: 'CRITICAL', reference_min: 0, reference_max: 100, category: 'Lipid' },
          { name: 'HDL-C (Good)', value: 37, unit: 'mg/dL', status: 'LOW', reference_min: 40, reference_max: 60, category: 'Lipid' },
        ];
        combinations = [
          {
            id: 'comb-lipid',
            title: 'Atherogenic Dyslipidemia & Vascular Plaque Synergy',
            severity: 'CRITICAL',
            urgency_score: 94,
            biomarkers_involved: ['Total Cholesterol', 'Triglycerides', 'LDL-C (Bad)', 'HDL-C (Good)'],
            clinical_rationale: 'Co-occurrence of high LDL-C (164 mg/dL) with hypertriglyceridemia (232 mg/dL) and suppressed HDL indicates significant atheroma vulnerability.',
            patient_explanation: 'Your bad cholesterol and triglycerides are elevated together while good cholesterol is low, increasing cardiovascular stress.',
            action_items: [
              'Initiate moderate-to-high intensity statin discussion with primary physician',
              'Implement Mediterranean cardioprotective dietary protocol',
              'Repeat fasting lipid panel in 6 to 8 weeks',
            ],
            suggested_questions: [
              'What does my elevated LDL and triglyceride combination mean?',
              'What dietary adjustments can lower my cholesterol naturally?',
              'Should I ask for an advanced lipid particle or calcium test?',
            ],
          },
        ];
        triageSummary = {
          total_metrics: 4,
          critical_count: 2,
          elevated_count: 1,
          optimal_count: 0,
          overall_urgency: 'CRITICAL',
          urgency_score: 94,
        };
        announcement = `I have received and analyzed your new report: ${cleanName}. Cross-marker triage has flagged a critical pattern: Atherogenic Dyslipidemia with elevated LDL cholesterol (164 mg/dL) and high triglycerides (232 mg/dL). I am Dr. Marcus Vance. You have 3 consultation questions to ask me about this new report. What would you like to ask first?`;
      } else if (lower.includes('liver') || lower.includes('hepatic') || lower.includes('alt') || lower.includes('ast')) {
        flags = [
          { name: 'ALT (SGPT)', value: 74, unit: 'U/L', status: 'CRITICAL', reference_min: 7, reference_max: 56, category: 'Hepatic' },
          { name: 'AST (SGOT)', value: 59, unit: 'U/L', status: 'ELEVATED', reference_min: 10, reference_max: 40, category: 'Hepatic' },
          { name: 'Total Bilirubin', value: 1.5, unit: 'mg/dL', status: 'ELEVATED', reference_min: 0.2, reference_max: 1.2, category: 'Hepatic' },
          { name: 'Serum Albumin', value: 3.4, unit: 'g/dL', status: 'LOW', reference_min: 3.5, reference_max: 5.0, category: 'Hepatic' },
        ];
        combinations = [
          {
            id: 'comb-liver',
            title: 'Hepatocellular Transaminase Synergy Anomaly',
            severity: 'CRITICAL',
            urgency_score: 92,
            biomarkers_involved: ['ALT (SGPT)', 'AST (SGOT)', 'Total Bilirubin'],
            clinical_rationale: 'Concurrent elevation of ALT (74 U/L) and AST (59 U/L) reflects active hepatocellular metabolic inflammation.',
            patient_explanation: 'Your liver enzyme levels are above reference ranges, indicating the liver cells are under metabolic strain.',
            action_items: [
              'Review current prescription and OTC medications for hepatotoxicity',
              'Screen for viral hepatitis and hepatic steatosis via ultrasound',
              'Retest liver function profile in 4 weeks',
            ],
            suggested_questions: [
              'What could be causing my elevated liver enzymes?',
              'What foods or drinks should I strictly avoid right now?',
              'Do I need an abdominal ultrasound scan?',
            ],
          },
        ];
        triageSummary = {
          total_metrics: 4,
          critical_count: 1,
          elevated_count: 2,
          optimal_count: 0,
          overall_urgency: 'CRITICAL',
          urgency_score: 92,
        };
        announcement = `I have received and analyzed your new report: ${cleanName}. Biomarker triage has flagged elevated hepatic enzymes (ALT 74 U/L, AST 59 U/L). I am Dr. Marcus Vance. You have 3 consultation questions to ask me about this new report. What would you like to ask first?`;
      } else if (lower.includes('cbc') || lower.includes('blood count') || lower.includes('anemia') || lower.includes('hemoglobin')) {
        flags = [
          { name: 'Hemoglobin', value: 10.4, unit: 'g/dL', status: 'CRITICAL', reference_min: 13.5, reference_max: 17.5, category: 'Hematology' },
          { name: 'Hematocrit', value: 32.0, unit: '%', status: 'LOW', reference_min: 38.8, reference_max: 50.0, category: 'Hematology' },
          { name: 'MCV', value: 73, unit: 'fL', status: 'LOW', reference_min: 80, reference_max: 100, category: 'Hematology' },
          { name: 'Serum Ferritin', value: 14, unit: 'ng/mL', status: 'LOW', reference_min: 24, reference_max: 336, category: 'Hematology' },
        ];
        combinations = [
          {
            id: 'comb-cbc',
            title: 'Microcytic Hypochromic Anemia Synergy',
            severity: 'CRITICAL',
            urgency_score: 91,
            biomarkers_involved: ['Hemoglobin', 'Hematocrit', 'MCV', 'Serum Ferritin'],
            clinical_rationale: 'Combined deficit in Hemoglobin (10.4 g/dL), MCV (73 fL), and Ferritin confirms microcytic iron deficiency anemia.',
            patient_explanation: 'Your red blood cells have reduced oxygen-carrying capacity and iron stores are depleted.',
            action_items: [
              'Initiate clinical oral iron supplementation protocol',
              'Evaluate gastrointestinal and dietary sources of iron deficiency',
              'Repeat CBC and reticulocyte count in 6 weeks',
            ],
            suggested_questions: [
              'What is the quickest way to restore my hemoglobin levels?',
              'Could my fatigue be caused by these low blood counts?',
              'What diagnostic tests should my primary doctor run next?',
            ],
          },
        ];
        triageSummary = {
          total_metrics: 4,
          critical_count: 1,
          elevated_count: 0,
          optimal_count: 0,
          overall_urgency: 'CRITICAL',
          urgency_score: 91,
        };
        announcement = `I have received and analyzed your new report: ${cleanName}. Triage has flagged a Microcytic Anemia pattern with depleted hemoglobin (10.4 g/dL) and low MCV. I am Dr. Marcus Vance. You have 3 consultation questions to ask me about this new report. What would you like to ask first?`;
      } else {
        // General or Metabolic & Renal Panel (Default or custom file)
        flags = [
          { name: 'Fasting Blood Glucose', value: 142, unit: 'mg/dL', status: 'CRITICAL', reference_min: 70, reference_max: 99, category: 'Metabolic' },
          { name: 'Serum Creatinine', value: 1.5, unit: 'mg/dL', status: 'ELEVATED', reference_min: 0.7, reference_max: 1.3, category: 'Renal' },
          { name: 'HbA1c', value: 6.8, unit: '%', status: 'ELEVATED', reference_min: 4.0, reference_max: 5.6, category: 'Endocrine' },
          { name: 'eGFR', value: 58, unit: 'mL/min/1.73m²', status: 'LOW', reference_min: 60, reference_max: 120, category: 'Renal' },
        ];
        combinations = [
          {
            id: 'comb-metabolic',
            title: 'Cardiorenal Metabolic Synergy Anomaly',
            severity: 'CRITICAL',
            urgency_score: 96,
            biomarkers_involved: ['Fasting Blood Glucose', 'Serum Creatinine', 'HbA1c', 'eGFR'],
            clinical_rationale: 'Co-occurrence of hyperglycemia (142 mg/dL) and compromised glomerular filtration rate (58 mL/min) indicates early nephropathy.',
            patient_explanation: 'Your blood sugar is elevated alongside signs that your kidneys are working harder than usual to filter waste.',
            action_items: [
              'Order spot urine albumin-to-creatinine ratio (uACR)',
              'Evaluate SGLT2 inhibitor therapy for cardiorenal protection',
              'Repeat fasting metabolic panel in 4 weeks',
            ],
            suggested_questions: [
              'How does elevated glucose affect my kidney filtration rate?',
              'What dietary adjustments will protect both my kidneys and sugar?',
              'Should I ask my doctor for specific follow-up lab tests?',
            ],
          },
        ];
        triageSummary = {
          total_metrics: 4,
          critical_count: 1,
          elevated_count: 2,
          optimal_count: 0,
          overall_urgency: 'CRITICAL',
          urgency_score: 96,
        };
        announcement = `I have received and analyzed your new report: ${cleanName}. Cross-marker biomarker triage has flagged a critical pattern: Cardiorenal Metabolic Anomaly with elevated fasting blood glucose (142 mg/dL) and compromised renal filtration (creatinine 1.5 mg/dL). I am Dr. Marcus Vance. You have 3 consultation questions to ask me about this new report. What would you like to ask first?`;
      }

      const newAnalyzedReport: PatientReport = {
        patient_id: patientIdVal,
        report_id: 'RPT-' + Math.floor(1000 + Math.random() * 9000),
        report_type: cleanName,
        date: new Date().toISOString().split('T')[0],
        name: patientName,
        age: customProfile?.age || 48,
        gender: customProfile?.gender || 'Unspecified',
        blood_type: customProfile?.blood_type || 'O+',
        mrn: customProfile?.mrn || 'MRN-7819',
        speech_intro: announcement,
        flags,
        combinations,
        triage_summary: triageSummary,
      };

      setReport(newAnalyzedReport);
      try {
        localStorage.setItem('synapse_latest_report', JSON.stringify(newAnalyzedReport));
      } catch (e) { }

      setChatHistory([
        {
          role: 'assistant',
          content: announcement,
        },
      ]);

      if (soundEnabled) {
        speechService.speak(announcement, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
    }, 1200);
  };

  // Fresh consultation on each Cabin entry: Dr. Marcus always asks for a new medical report
  useEffect(() => {
    async function initConsultation() {
      setLoading(true);
      let customProfile: any = null;
      try {
        const stored = localStorage.getItem('synapse_patient_profile');
        if (stored) customProfile = JSON.parse(stored);
      } catch (e) { }

      // Reset to clean fresh consultation session
      setReport(null);
      setQuestionsRemaining(3);
      setLoading(false);

      const patientNameGreeting = customProfile?.full_name?.split(' ')[0] || customProfile?.name?.split(' ')[0] || 'Patient';
      const introText = `Welcome, ${patientNameGreeting}. I am Dr. Marcus Vance, your synthetic medical officer. Please upload your new medical lab report or scan using the "Upload Report" button above so I can triage your latest biomarkers and answer your consultation questions.`;

      setChatHistory([
        {
          role: 'assistant',
          content: introText,
        },
      ]);

      if (soundEnabled) {
        setTimeout(() => {
          speechService.speak(introText, {
            onStart: () => setIsSpeaking(true),
            onEnd: () => setIsSpeaking(false),
            onError: () => setIsSpeaking(false),
          });
        }, 500);
      }
    }

    initConsultation();

    return () => {
      speechService.stop();
      speechService.stopSpeechRecognition();
    };
  }, []);

  // Auto-scroll chat to bottom
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatHistory, isWaitingReply]);

  // Voice Speech-to-Text Toggle
  const toggleListening = () => {
    if (isSpeaking || questionsRemaining <= 0) return;

    if (isListening) {
      speechService.stopSpeechRecognition();
      setIsListening(false);
    } else {
      const started = speechService.startSpeechRecognition(
        (transcript) => {
          setInputMessage(transcript);
          setIsListening(false);
        },
        (status) => setIsListening(status)
      );
      if (!started) {
        alert('Speech recognition is not supported in this browser. Please type your query.');
      }
    }
  };

  // Handle Question Submission
  const handleSendMessage = async (customText?: string) => {
    const textToSend = (customText || inputMessage).trim();
    if (!textToSend || isSpeaking || questionsRemaining <= 0 || isWaitingReply) return;

    if (!report) {
      const promptUploadMsg =
        'Please upload your new medical lab report or scan first using the "Upload Report" button above so I can triage your specific biomarkers and provide an accurate diagnostic consultation.';
      setChatHistory((prev) => [
        ...prev,
        { role: 'user', content: textToSend },
        { role: 'assistant', content: promptUploadMsg },
      ]);
      if (soundEnabled) {
        speechService.speak(promptUploadMsg, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => setIsSpeaking(false),
          onError: () => setIsSpeaking(false),
        });
      }
      setInputMessage('');
      setShowUploadModal(true);
      return;
    }

    setInputMessage('');
    setIsListening(false);
    speechService.stopSpeechRecognition();

    const nextQuestionsRemaining = questionsRemaining - 1;
    const isFinal = nextQuestionsRemaining === 0;

    // Optimistic UI state
    setChatHistory((prev) => [...prev, { role: 'user', content: textToSend }]);
    setQuestionsRemaining(nextQuestionsRemaining);
    setIsWaitingReply(true);

    try {
      const res = await sendConsultationChat({
        patient_name: report?.name || 'Marcus Vance',
        user_message: textToSend,
        chat_history: chatHistory,
        report_context: {
          flags: report?.flags || [],
          combinations: report?.combinations || [],
        },
        questions_remaining: nextQuestionsRemaining,
        is_final_turn: isFinal,
      });

      setIsWaitingReply(false);
      setChatHistory((prev) => [...prev, { role: 'assistant', content: res.reply }]);

      // Speak response with Web Speech API
      if (soundEnabled) {
        speechService.speak(res.reply, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            if (isFinal || res.action === 'TRIGGER_EXPORT_TRANSITION') {
              setIsRedirecting(true);
              setTimeout(() => {
                router.push(`/export?patientId=${patientId}`);
              }, 1200);
            }
          },
          onError: () => {
            setIsSpeaking(false);
            if (isFinal) {
              setIsRedirecting(true);
              setTimeout(() => {
                router.push(`/export?patientId=${patientId}`);
              }, 1200);
            }
          },
        });
      } else {
        if (isFinal) {
          setIsRedirecting(true);
          setTimeout(() => {
            router.push(`/export?patientId=${patientId}`);
          }, 3200);
        }
      }
    } catch (err) {
      console.error('Error during consultation turn:', err);
      setIsWaitingReply(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center text-primary-container font-telemetry-sm">
        <div className="w-12 h-12 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center glow-cyan mb-4 animate-spin">
          <span className="material-symbols-outlined text-[24px]">vital_signs</span>
        </div>
        <p className="text-on-surface-variant">INITIALIZING MARCUSCABIN TELE-CABIN CONSOLE...</p>
      </div>
    );
  }

  const glucoseMetric = report?.flags?.find((m) => m.name.includes('Glucose')) || { value: 0, unit: 'mg/dL' };
  const hba1cMetric = report?.flags?.find((m) => m.name.includes('HbA1c')) || { value: 0, unit: '%' };

  // Calculate quota progress percentage
  const progressPercent = (questionsRemaining / 3) * 100;

  return (
    <div className="bg-surface text-on-surface antialiased min-h-screen flex flex-col font-body-sm selection:bg-primary-container selection:text-surface-container-lowest overflow-x-hidden">
      {/* ================= TOP NAV BAR ================= */}
      <header className="docked full-width top-0 z-40 bg-surface-container-low/80 backdrop-blur-md shadow-md shadow-surface-container-lowest/50 border-b border-outline-variant/30 sticky">
        <div className="flex justify-between items-center w-full px-6 py-3">
          {/* Brand Anchor */}
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="text-headline-sm font-headline-sm font-bold tracking-wider text-primary-container flex items-center gap-2 group"
            >
              <span
                className="material-symbols-outlined text-primary-container group-hover:scale-105 transition-transform"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                neurology
              </span>
              <span>MARCUSCABIN AI DIAGNOSTICS</span>
            </Link>
            <div className="h-4 w-px bg-outline-variant/40 hidden md:block"></div>
            <span className="text-telemetry-sm font-telemetry-sm text-on-surface-variant hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-surface-container-high/60 border border-outline-variant/30">
              <span className="w-1.5 h-1.5 rounded-full bg-primary-container animate-ping"></span>
              ENCRYPTED SURGICAL TELEMETRY STREAM
            </span>
          </div>

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            <Link
              className="text-on-surface-variant hover:text-on-surface font-telemetry-md text-telemetry-md pb-1 transition-colors"
              href={`/dashboard?patientId=${patientId}`}
            >
              Triage Feed
            </Link>
            <Link
              className="text-on-surface-variant hover:text-on-surface font-telemetry-md text-telemetry-md pb-1 transition-colors"
              href={`/dashboard?patientId=${patientId}#old-reports-section`}
            >
              Patient Queue
            </Link>
            <span className="text-on-surface-variant font-telemetry-md text-telemetry-md pb-1 cursor-default opacity-80">
              Neural Engine
            </span>
            <span className="text-primary-container font-telemetry-md text-telemetry-md border-b-2 border-primary-container pb-1 flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[16px]">spatial_audio</span>
              Tele-Cabin
            </span>
          </nav>

          {/* Trailing Cluster */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                speechService.stop();
                speechService.speak('Emergency synchronization complete. Telemetry buffers nominal.');
              }}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-outline-variant/40 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-high/40 transition-colors font-telemetry-sm text-telemetry-sm"
            >
              <span className="material-symbols-outlined text-secondary text-[16px]">sync</span>
              Emergency Sync
            </button>

            {/* Upload Medical Report Button */}
            <button
              onClick={() => setShowUploadModal(true)}
              className="px-3.5 py-1.5 rounded-lg bg-surface-container-high hover:bg-surface-container border border-primary-container/40 hover:border-primary-container text-primary-container font-headline-sm text-caption font-semibold flex items-center gap-1.5 transition-all glow-cyan active:scale-95 shadow-sm"
            >
              <span className="material-symbols-outlined text-[16px]">upload_file</span>
              <span>Upload Report</span>
            </button>

            {/* Print Final Report CTA */}
            <Link
              href={`/export?patientId=${patientId}`}
              className="px-3.5 py-1.5 rounded-lg bg-primary-container text-surface-container-lowest font-headline-sm text-caption font-bold shadow-[0_0_12px_rgba(0,242,254,0.35)] hover:bg-primary-fixed-dim transition-all flex items-center gap-1.5 active:scale-95"
            >
              <span className="material-symbols-outlined text-[16px]">print</span>
              <span>Print Final Report</span>
            </Link>

            <div className="flex items-center gap-1 pl-2 border-l border-outline-variant/30">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-2 rounded-lg transition-colors ${soundEnabled ? 'text-primary-container' : 'text-on-surface-variant'
                  }`}
                title={soundEnabled ? 'Voice Enabled' : 'Voice Muted'}
              >
                <span className="material-symbols-outlined text-[20px]">
                  {soundEnabled ? 'volume_up' : 'volume_off'}
                </span>
              </button>
              <Link
                href={`/dashboard?patientId=${patientId}`}
                className="p-1 text-on-surface-variant hover:text-primary-container rounded-lg transition-colors ml-1"
                title="Return to Dashboard"
              >
                <div className="w-7 h-7 rounded-full ring-1 ring-primary-container/40 overflow-hidden bg-surface-container-high flex items-center justify-center">
                  <span className="material-symbols-outlined text-[20px] text-primary-container">account_circle</span>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ================= SUB-HEADER / HUD TELEMETRY STATUS BAR ================= */}
      <section className="bg-surface-container-lowest/90 backdrop-blur-md border-b border-outline-variant/30 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Session Telemetry & Patient Vitals Ticker */}
          <div className="flex items-center flex-wrap gap-4 font-telemetry-sm text-telemetry-sm">
            <div className="flex items-center gap-2 bg-surface-container-low px-2.5 py-1 rounded border border-outline-variant/40">
              <span className="text-on-surface-variant">SESSION:</span>
              <span className="text-primary-container font-mono font-semibold tracking-wider">
                #SYN-{report?.patient_id || patientId || 'INIT'}-TC3
              </span>
            </div>
            <div className="h-3 w-px bg-outline-variant/40 hidden md:block"></div>

            {/* Real-time Physiological Waveform Mini Ticker */}
            <div className="flex items-center gap-5">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-error text-[16px] animate-pulse" style={{ fontVariationSettings: "'FILL' 1" }}>
                  favorite
                </span>
                <span className="text-on-surface-variant">HR</span>
                <span className="text-on-surface font-semibold font-mono">78</span>
                <span className="text-[10px] text-on-surface-variant">BPM</span>
              </div>

              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-secondary text-[16px]">air</span>
                <span className="text-on-surface-variant">SpO₂</span>
                <span className="text-primary font-semibold font-mono">98.4%</span>
              </div>

              <div className="flex items-center gap-2 hidden sm:flex">
                <span className="material-symbols-outlined text-secondary-fixed text-[16px]">speed</span>
                <span className="text-on-surface-variant">BP</span>
                <span className="text-on-surface font-semibold font-mono">124/82</span>
                <span className="text-[10px] text-on-surface-variant">mmHg</span>
              </div>

              <div className="hidden lg:flex items-center gap-2 pl-2 border-l border-outline-variant/30">
                <span className="text-[10px] text-on-surface-variant uppercase tracking-wider font-mono">ECG LEAD-II</span>
                <svg className="w-24 h-5 overflow-visible" viewBox="0 0 100 20">
                  <path
                    className="ecg-path"
                    d="M0,10 L15,10 L20,3 L25,17 L30,2 L35,16 L40,10 L60,10 L65,7 L70,10 L100,10"
                    fill="none"
                    stroke="#00f2fe"
                    strokeWidth="1.5"
                  ></path>
                </svg>
              </div>
            </div>
          </div>

          {/* Critical Constraint UI: Glowing Constraint Badge with Tooltip */}
          <div className="relative group cursor-pointer">
            <div className="flex items-center gap-2.5 px-3.5 py-1.5 rounded-lg bg-surface-container-high/90 border border-primary-container/40 shadow-[0_0_16px_rgba(0,242,254,0.25)] transition-all hover:border-primary-container">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container"></span>
              </span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary-container font-semibold tracking-wide">
                Questions Remaining: {questionsRemaining}
              </span>
              <span className="material-symbols-outlined text-secondary text-[16px] text-on-surface-variant group-hover:text-primary-container">
                info
              </span>
            </div>

            {/* Tooltip Explaining Trial Protocol Limit */}
            <div className="absolute right-0 top-full mt-2 w-72 p-3 bg-surface-container-lowest/95 backdrop-blur-xl border border-outline-variant/60 rounded-xl shadow-2xl shadow-surface-container-lowest text-on-surface text-caption opacity-0 group-hover:opacity-100 transition-all duration-200 pointer-events-none z-50">
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-primary-container text-[18px]">verified_user</span>
                <div>
                  <p className="font-headline-sm text-caption font-semibold text-primary">Trial Protocol Allocation</p>
                  <p className="mt-1 text-on-surface-variant leading-relaxed">
                    Autonomous consultation quota capped at 3 deep-synthesis queries per clinical session. Once consumed, state locks automatically for multimodal diagnostic reconciliation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ================= MAIN CONSULTATION THEATER ================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-stretch">
          {/* LEFT / CENTER COCKPIT: AVATAR HUD & VOICE TRANSMITTER (7 Cols) */}
          <section className="lg:col-span-7 flex flex-col justify-between rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl border border-white/[0.08] p-5 lg:p-6 shadow-2xl shadow-surface-container-lowest/90 relative overflow-hidden">
            {/* Tactical corner grid markings */}
            <div className="absolute top-2 left-2 text-[9px] font-mono text-outline-variant/60 select-none">
              HUD_SYS:CALIBRATED//99.8%
            </div>
            <div className="absolute top-2 right-2 text-[9px] font-mono text-outline-variant/60 select-none">
              FREQ:52.4kHz//LIVE
            </div>

            {/* Header info within Cabin Theater */}
            <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded bg-surface-container-high border border-outline-variant/40 flex items-center justify-center text-primary-container">
                  <span className="material-symbols-outlined text-[18px]">psychology</span>
                </div>
                <div>
                  <h1 className="text-headline-sm font-headline-sm text-on-surface flex items-center gap-2">
                    Dr. Marcus Vance, AI-MD
                    <span className="text-telemetry-sm font-telemetry-sm text-primary-container px-2 py-0.5 rounded bg-primary-container/10 border border-primary-container/30">
                      Synthetic Medical Officer
                    </span>
                  </h1>
                  <p className="text-caption font-caption text-on-surface-variant">
                    Autonomous Sub-Specialty: Cardiovascular &amp; Metabolic Endocrinology
                  </p>
                </div>
              </div>

              {/* Active Listening / Speaking Badge */}
              <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-surface-container-high/80 border border-primary-container/30">
                <span
                  className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-secondary animate-ping' : 'bg-primary-container animate-pulse'
                    }`}
                ></span>
                <span className="font-telemetry-sm text-[10px] tracking-wider text-primary-container uppercase font-semibold">
                  {isSpeaking ? 'Voice Active' : isListening ? 'Listening Voice' : 'Active Listening'}
                </span>
              </div>
            </div>

            {/* VISUAL CENTERPIECE: Holographic Doctor Avatar Frame (OUR ANIMATED DR. AVATAR) */}
            <div className="relative w-full aspect-video sm:h-72 rounded-lg bg-surface-container-low/70 border border-outline-variant/40 overflow-hidden flex items-center justify-center group shadow-inner">
              {/* Doctor Avatar with Lip-Sync Animation (compact mode centered inside holographic HUD) */}
              <div className="relative z-10 scale-90 sm:scale-100 flex items-center justify-center">
                <DoctorAvatar
                  isSpeaking={isSpeaking}
                  doctorName="Dr. Marcus Vance, AI-MD"
                  specialty="Cardiovascular & Metabolic Endocrinology"
                  compact={true}
                />
              </div>

              {/* Holographic Scanning Grid Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-surface-container-lowest via-transparent to-surface-container-lowest/30 pointer-events-none"></div>

              {/* Crosshair and HUD Reticles */}
              <div className="absolute inset-0 pointer-events-none flex flex-col justify-between p-4 z-20">
                <div className="flex justify-between items-start">
                  <span className="text-telemetry-sm font-mono text-primary-container/80 text-[10px] border-l-2 border-primary-container pl-1.5">
                    NEURAL_WEIGHT: OPTIMAL
                    <br />
                    LATENCY: 12ms
                  </span>
                  <span className="text-telemetry-sm font-mono text-on-surface-variant/80 text-[10px] text-right">
                    VOICE_SYNTH: v4.8
                    <br />
                    TENSOR_ENGINE: NOMINAL
                  </span>
                </div>
                <div className="flex justify-between items-end">
                  <div className="flex items-center gap-2 bg-surface-container-lowest/80 px-2 py-1 rounded border border-outline-variant/30 text-[10px] font-mono text-on-surface">
                    <span className="material-symbols-outlined text-secondary text-[12px]">security</span>
                    HIPAA &amp; FDA SAMD COMPLIANT AGENT
                  </div>
                  <div className="text-[10px] font-mono text-primary-container animate-pulse">
                    REC ● {formatTimer(sessionSeconds)}
                  </div>
                </div>
              </div>
            </div>

            {/* HIGH-TECH AUDIO VISUALIZER WAVEFORM UNDERNEATH */}
            <div className="mt-4 p-3 rounded-lg bg-surface-container-low/90 border border-outline-variant/30 flex flex-col gap-2">
              <div className="flex items-center justify-between text-telemetry-sm font-telemetry-sm text-on-surface-variant">
                <span className="flex items-center gap-1.5 text-secondary">
                  <span className="material-symbols-outlined text-[14px]">graphic_eq</span>
                  VOICE FREQUENCY SPECTRUM (300Hz - 3.4kHz)
                </span>
                <span className="text-[10px] font-mono text-primary-container">
                  {isSpeaking ? 'AUDIO PLAYBACK SYNCHRONIZED' : 'SYNCHRONIZED SPEECH BUFFER'}
                </span>
              </div>

              {/* Dynamic Audio Wave Bars */}
              <div className="h-10 flex items-center justify-center gap-1 sm:gap-1.5 px-4 overflow-hidden">
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.1s', height: isSpeaking ? '28px' : '8px' }}></div>
                <div className="w-1 bg-secondary rounded-full wave-bar" style={{ animationDelay: '0.25s', height: isSpeaking ? '32px' : '12px' }}></div>
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.4s', height: isSpeaking ? '24px' : '10px' }}></div>
                <div className="w-1 bg-primary rounded-full wave-bar" style={{ animationDelay: '0.15s', height: isSpeaking ? '36px' : '14px' }}></div>
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.6s', height: isSpeaking ? '30px' : '9px' }}></div>
                <div className="w-1 bg-secondary-fixed rounded-full wave-bar" style={{ animationDelay: '0.3s', height: isSpeaking ? '22px' : '8px' }}></div>
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.5s', height: isSpeaking ? '34px' : '15px' }}></div>
                <div className="w-1 bg-primary-fixed-dim rounded-full wave-bar" style={{ animationDelay: '0.2s', height: isSpeaking ? '38px' : '12px' }}></div>
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.35s', height: isSpeaking ? '26px' : '10px' }}></div>
                <div className="w-1 bg-secondary rounded-full wave-bar" style={{ animationDelay: '0.7s', height: isSpeaking ? '20px' : '8px' }}></div>
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.45s', height: isSpeaking ? '35px' : '14px' }}></div>
                <div className="w-1 bg-primary-fixed-dim rounded-full wave-bar" style={{ animationDelay: '0.1s', height: isSpeaking ? '29px' : '11px' }}></div>
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.55s', height: isSpeaking ? '18px' : '7px' }}></div>
                <div className="w-1 bg-secondary rounded-full wave-bar" style={{ animationDelay: '0.22s', height: isSpeaking ? '27px' : '10px' }}></div>
                <div className="w-1 bg-primary-container rounded-full wave-bar" style={{ animationDelay: '0.65s', height: isSpeaking ? '33px' : '13px' }}></div>
              </div>
            </div>

            {/* INTERACTIVE VOICE CONTROLS & PULSING MIC BUTTON */}
            <div className="mt-6 flex flex-col items-center justify-center gap-3">
              <div className="relative flex items-center justify-center">
                {/* Pulsing Concentric Neon Cyan Audio Rings */}
                <div className={`absolute w-20 h-20 rounded-full border-2 border-primary-container/40 ${isSpeaking || isListening ? 'ripple-ring-1' : ''}`}></div>
                <div className={`absolute w-20 h-20 rounded-full border border-primary-container/20 ${isSpeaking || isListening ? 'ripple-ring-2' : ''}`}></div>

                {/* Primary Pulsing Mic Action */}
                <button
                  onClick={toggleListening}
                  disabled={isSpeaking || questionsRemaining <= 0 || isWaitingReply}
                  className={`relative z-10 w-16 h-16 rounded-full flex items-center justify-center transition-all duration-200 active:scale-95 group focus:outline-none disabled:opacity-40 ${isListening
                    ? 'bg-error text-surface-container-lowest shadow-[0_0_24px_rgba(239,68,68,0.7)]'
                    : 'bg-primary-container text-surface-container-lowest shadow-[0_0_24px_rgba(0,242,254,0.6)] hover:bg-primary-fixed-dim'
                    }`}
                  title={isListening ? 'Click to Stop Listening' : 'Click to Speak (Speech-to-Text)'}
                >
                  <span
                    className="material-symbols-outlined text-[32px] text-on-secondary-fixed"
                    style={{ fontVariationSettings: "'FILL' 1" }}
                  >
                    {isListening ? 'mic_off' : 'mic'}
                  </span>
                </button>
              </div>

              <div className="text-center">
                <span className="text-telemetry-sm font-telemetry-sm text-primary-container font-semibold tracking-wider flex items-center gap-1.5 justify-center">
                  <span className={`w-1.5 h-1.5 rounded-full ${isListening ? 'bg-error animate-ping' : 'bg-primary-container animate-ping'}`}></span>
                  {isRedirecting
                    ? 'Final report compiled. Transitioning to Export...'
                    : isSpeaking
                      ? 'Doctor is speaking... Listening buffer locked'
                      : isListening
                        ? 'Recording voice... Click to submit inquiry'
                        : questionsRemaining > 0
                          ? `Ready. Press mic or type (${questionsRemaining} queries remaining)`
                          : 'Consultation quota reached.'}
                </span>
                <p className="text-caption font-caption text-on-surface-variant text-[11px] mt-0.5">
                  Direct clinical audio stream calibrated for rapid diagnostic reasoning
                </p>
              </div>
            </div>

            {/* ALTERNATIVE TEXT INPUT & SMART CLINICAL SUGGESTION CHIPS */}
            <div className="mt-4 pt-4 border-t border-outline-variant/30 flex flex-col gap-2.5">
              {/* Text Input Bar */}
              <div className="flex items-center gap-2 bg-[#050811] rounded-lg border border-white/10 px-3 py-1.5 focus-within:border-primary-container focus-within:shadow-[0_0_8px_rgba(0,242,254,0.2)] transition-all">
                <span className="material-symbols-outlined text-on-surface-variant text-[18px]">keyboard</span>
                <input
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  disabled={isSpeaking || questionsRemaining <= 0 || isWaitingReply}
                  placeholder={
                    questionsRemaining > 0
                      ? isSpeaking
                        ? 'Doctor is speaking, please stand by...'
                        : `Type clinical inquiry (${questionsRemaining} remaining)...`
                      : 'Session questions completed. Redirecting to final report...'
                  }
                  className="w-full bg-transparent border-0 p-0 text-body-sm font-body-sm text-on-surface placeholder:text-on-surface-variant/50 focus:ring-0 font-mono text-[13px] disabled:opacity-50"
                />
                <button
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim() || isSpeaking || questionsRemaining <= 0 || isWaitingReply}
                  className="px-2.5 py-1 rounded bg-surface-container-high hover:bg-surface-container-highest text-primary-container text-caption font-mono transition-colors flex items-center gap-1 disabled:opacity-40"
                >
                  <span>SEND</span>
                  <span className="material-symbols-outlined text-[14px]">arrow_upward</span>
                </button>
              </div>

              {/* Prompt Suggestions */}
              {questionsRemaining > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                  <span className="text-[11px] font-mono text-on-surface-variant whitespace-nowrap">Suggested:</span>
                  {!report ? (
                    <>
                      <button
                        onClick={() => setShowUploadModal(true)}
                        className="px-2.5 py-1 rounded-full bg-primary-container/20 hover:bg-primary-container/30 border border-primary-container/40 text-caption text-primary-container whitespace-nowrap transition-colors flex items-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[12px]">upload_file</span>
                        Upload new medical report
                      </button>
                      <button
                        onClick={() => handleSendMessage('What medical lab reports can Dr. Marcus analyze?')}
                        disabled={isSpeaking || isWaitingReply}
                        className="px-2.5 py-1 rounded-full bg-surface-container-high/60 hover:bg-surface-container-high border border-outline-variant/30 text-caption text-on-surface-variant hover:text-primary-container whitespace-nowrap transition-colors flex items-center gap-1 disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-[12px] text-secondary">help_outline</span>
                        What reports can you analyze?
                      </button>
                    </>
                  ) : (
                    (report.combinations?.[0]?.suggested_questions || [
                      `What does my ${report.flags?.[0]?.name || 'flagged'} level mean?`,
                      'What dietary changes will help my biomarkers?',
                      'Should I ask my doctor for specific follow-up lab tests?',
                    ]).map((q, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSendMessage(q)}
                        disabled={isSpeaking || isWaitingReply}
                        className="px-2.5 py-1 rounded-full bg-surface-container-high/60 hover:bg-surface-container-high border border-outline-variant/30 text-caption text-on-surface-variant hover:text-primary-container whitespace-nowrap transition-colors flex items-center gap-1 disabled:opacity-40"
                      >
                        <span className="material-symbols-outlined text-[12px] text-secondary">help_outline</span>
                        {q}
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </section>

          {/* RIGHT PANEL: TRANSCRIPT, LIVE CLINICAL NOTES & FLOW STATE (5 Cols) */}
          <section className="lg:col-span-5 flex flex-col justify-between rounded-xl bg-surface-container-lowest/90 backdrop-blur-xl border border-white/[0.08] p-5 lg:p-6 shadow-2xl shadow-surface-container-lowest/90">
            <div>
              {/* Panel Header */}
              <div className="flex items-center justify-between border-b border-outline-variant/20 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary-container text-[20px]">forum</span>
                  <h2 className="text-headline-sm font-headline-sm text-on-surface text-[18px]">
                    Consultation Transcript
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-surface-container text-on-surface-variant border border-outline-variant/30">
                    AUDIT LOG: ON
                  </span>
                </div>
              </div>

              {/* Awaiting Upload Banner */}
              {!report && (
                <div className="p-3.5 rounded-xl bg-primary-container/10 border border-primary-container/30 mb-4 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-primary-container/20 flex items-center justify-center text-primary-container shrink-0">
                      <span className="material-symbols-outlined text-[20px]">upload_file</span>
                    </div>
                    <div>
                      <h4 className="text-body-sm font-bold text-primary-container">Awaiting New Medical Report</h4>
                      <p className="text-[12px] text-on-surface-variant leading-tight">
                        Upload your latest lab scan or select a panel below to activate Dr. Marcus Vance.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setShowUploadModal(true)}
                    className="px-3 py-1.5 rounded-lg bg-primary-container text-surface-container-lowest font-headline-sm font-bold shadow-[0_0_12px_rgba(0,242,254,0.3)] hover:bg-primary-fixed-dim transition-all text-caption shrink-0"
                  >
                    Upload Now
                  </button>
                </div>
              )}

              {/* Scrolling Conversation History */}
              <div
                ref={chatContainerRef}
                className="space-y-4 max-h-[380px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-outline-variant/40"
              >
                {chatHistory.map((msg, idx) => {
                  const isDoctor = msg.role === 'assistant';
                  return (
                    <div
                      key={idx}
                      className={`flex flex-col gap-1.5 ${isDoctor ? 'items-start' : 'items-end'}`}
                    >
                      <div className="flex items-center justify-between w-full text-caption font-telemetry-sm">
                        {isDoctor ? (
                          <span className="text-primary-container font-semibold flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">smart_toy</span>
                            Dr. Marcus Vance (AI)
                          </span>
                        ) : (
                          <span className="text-secondary-fixed font-semibold flex items-center gap-1 ml-auto">
                            You ({report?.name || 'Patient'})
                            <span className="material-symbols-outlined text-[14px]">person</span>
                          </span>
                        )}
                        <span className="text-on-surface-variant/60">
                          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div
                        className={`p-3.5 rounded-lg text-body-sm text-on-surface leading-relaxed max-w-[95%] ${isDoctor
                          ? 'bg-surface-container-low/90 border-l-2 border-primary-container border-outline-variant/30 space-y-2'
                          : 'bg-surface-container-high/80 border border-primary-container/20 text-right'
                          }`}
                      >
                        <p className="whitespace-pre-line">{msg.content}</p>

                        {/* If doctor message contains final report or guideline */}
                        {isDoctor && idx === 0 && (
                          <div className="p-2.5 rounded bg-surface-container-lowest/80 border border-outline-variant/40 flex flex-col gap-1 font-telemetry-sm text-telemetry-sm mt-2">
                            <div className="flex items-center justify-between text-secondary">
                              <span className="font-semibold flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">menu_book</span>
                                ADA 2024 Practice Guidelines §11.4
                              </span>
                              <span className="text-[10px] text-on-surface-variant font-mono">
                                CONFIDENCE: 98.4%
                              </span>
                            </div>
                            <p className="text-caption text-on-surface-variant">
                              Correlated with cardiorenal glycemic modulation and microalbuminuria screening protocols.
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {isWaitingReply && (
                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1 text-primary-container font-telemetry-sm text-caption">
                      <span className="material-symbols-outlined text-[14px] animate-spin">sync</span>
                      Dr. Marcus Vance (Synthesizing Diagnostic Response...)
                    </div>
                    <div className="p-3 rounded-lg bg-surface-container-low/90 border border-outline-variant/30 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce"></span>
                      <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce delay-150"></span>
                      <span className="w-2 h-2 rounded-full bg-primary-container animate-bounce delay-300"></span>
                      <span className="text-caption font-mono text-on-surface-variant ml-2">
                        Cross-referencing biomarker synergy matrix...
                      </span>
                    </div>
                  </div>
                )}

                {/* Real-time Clinical Scratchpad */}
                <div className="p-3 rounded-lg bg-surface-container/60 border border-outline-variant/30 mt-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-caption font-telemetry-sm text-secondary flex items-center gap-1">
                      <span className="material-symbols-outlined text-[14px]">edit_note</span>
                      REAL-TIME CLINICAL SCRATCHPAD
                    </span>
                    <span className="text-[10px] font-mono text-on-surface-variant">AUTO-SYNTHESIZING</span>
                  </div>
                  <ul className="text-caption font-mono text-on-surface-variant space-y-1 list-disc list-inside">
                    <li>
                      Biomarker Alert: Fasting Glucose {glucoseMetric.value} {glucoseMetric.unit}
                    </li>
                    <li>
                      Synergy Vector:{' '}
                      {report?.combinations && report.combinations.length > 0
                        ? report.combinations[0].title
                        : 'Metabolic Nephron Stress'}
                    </li>
                    <li>Clinical Action: Urine Albumin-to-Creatinine Ratio (uACR) &amp; HbA1c</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* FLOW TRIGGER UI BANNER & COUNTDOWN STATE */}
            <div className="mt-6 pt-4 border-t border-outline-variant/30 space-y-3">
              {/* Countdown State Bar */}
              <div className="p-3 rounded-lg bg-surface-container-low/90 border border-primary-container/30 flex flex-col gap-2">
                <div className="flex items-center justify-between text-telemetry-sm font-telemetry-sm">
                  <span className="text-on-surface flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-primary-container text-[16px]">
                      hourglass_top
                    </span>
                    Autonomous Session Limit
                  </span>
                  <span className="text-primary-container font-mono font-bold">
                    {questionsRemaining} of 3 Available
                  </span>
                </div>
                {/* Progress Meter */}
                <div className="w-full bg-surface-container-highest h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-primary-container h-full rounded-full transition-all duration-500 shadow-[0_0_8px_rgba(0,242,254,0.7)]"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {/* Disabled State Overlay Preview */}
              <div className="p-2.5 rounded-lg bg-surface-container-high/40 border border-outline-variant/30 flex items-center gap-3">
                <span className="material-symbols-outlined text-on-surface-variant text-[20px]">
                  lock_clock
                </span>
                <div className="flex-1">
                  <p className="text-caption font-telemetry-sm text-on-surface">
                    {questionsRemaining === 0
                      ? '3 of 3 Consultations Consumed'
                      : '3 of 3 Consultations Governance Preview'}
                  </p>
                  <p className="text-[11px] text-on-surface-variant leading-tight">
                    Input automatically concludes on 3rd query to safeguard algorithmic liability.
                  </p>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-surface-container text-on-surface-variant border border-outline-variant/40">
                  {questionsRemaining === 0 ? 'LOCKED' : 'ACTIVE'}
                </span>
              </div>

              {/* Glowing Primary CTA: Proceed to Final Report Synthesis */}
              <Link
                href={`/export?patientId=${patientId}`}
                className="w-full py-3 px-4 rounded-lg bg-primary-container text-surface-container-lowest font-headline-sm font-bold text-body-sm shadow-[0_0_20px_rgba(0,242,254,0.45)] hover:bg-primary-fixed-dim hover:shadow-[0_0_28px_rgba(0,242,254,0.7)] transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[20px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                  assignment_turned_in
                </span>
                <span>Proceed to Final Report Synthesis</span>
                <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* ================= FOOTER TELEMETRY AUDIT ================= */}
      <footer className="bg-surface-container-lowest border-t border-outline-variant/20 px-6 py-2.5 text-on-surface-variant font-telemetry-sm text-[11px] mt-auto">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-on-surface">
              <span className="w-2 h-2 rounded-full bg-primary-container"></span>
              MARCUSCABIN CORE ENGINE v4.2.0-STABLE
            </span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">STATION: CABIN-ORBIT-03</span>
            <span className="hidden md:inline">|</span>
            <span className="hidden md:inline">BIO-HASH: e9f2-892b-430c-99a1</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-secondary">LATENCY: 12ms</span>
            <span>•</span>
            <span className="text-primary-container">LOSS: 0.00%</span>
          </div>
        </div>
      </footer>

      {/* In-Cabin Upload Medical Report Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">upload_file</span>
                Upload Medical Report to Dr. Marcus
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 font-telemetry-sm">
              <p className="text-on-surface-variant text-body-sm">
                Upload your blood panel, metabolic panel, or laboratory scan (PDF, PNG, JPG). Dr. Marcus Vance will ingest the biomarkers, flag abnormal ranges, and address your questions.
              </p>

              {/* Drag-and-drop zone */}
              <div
                onClick={() => {
                  const input = document.getElementById('cabin-file-input');
                  if (input) input.click();
                }}
                className="border-2 border-dashed border-outline-variant/60 hover:border-primary-container/80 rounded-xl p-6 text-center cursor-pointer bg-surface-container-lowest/50 hover:bg-surface-container/40 transition-all group"
              >
                <input
                  id="cabin-file-input"
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.dcm"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadedFileName(e.target.files[0].name);
                    }
                  }}
                />
                <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container mx-auto mb-2 group-hover:scale-110 transition-transform">
                  <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                </div>
                {uploadedFileName ? (
                  <div>
                    <span className="font-bold text-primary-container block">{uploadedFileName}</span>
                    <span className="text-xs text-outline">Click to select different file</span>
                  </div>
                ) : (
                  <div>
                    <span className="font-semibold text-on-surface block">Drag & drop report file or browse</span>
                    <span className="text-xs text-outline">PDF, PNG, JPG, DICOM supported</span>
                  </div>
                )}
              </div>

              {/* Preset Quick-Panels */}
              <div>
                <span className="text-xs text-outline block mb-2 font-mono uppercase">Or choose sample diagnostic panel:</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleUploadAndAnalyzeReport('Metabolic & Renal Profile')}
                    className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-container/60 hover:bg-surface-container-high/60 text-left transition-all"
                  >
                    <span className="font-bold text-xs text-on-surface block">Metabolic & Renal Panel</span>
                    <span className="text-[10px] text-error font-mono">Glucose 142 • Creatinine 1.5</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadAndAnalyzeReport('Cardio-Metabolic Lipid Panel')}
                    className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-container/60 hover:bg-surface-container-high/60 text-left transition-all"
                  >
                    <span className="font-bold text-xs text-on-surface block">Cardio-Metabolic Lipid Panel</span>
                    <span className="text-[10px] text-amber-400 font-mono">Cholesterol 248 • Triglycerides 232</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadAndAnalyzeReport('Complete Blood Count (CBC) Panel')}
                    className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-container/60 hover:bg-surface-container-high/60 text-left transition-all"
                  >
                    <span className="font-bold text-xs text-on-surface block">Complete Blood Count (CBC)</span>
                    <span className="text-[10px] text-error font-mono">Hemoglobin 10.4 • Ferritin 14</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleUploadAndAnalyzeReport('Comprehensive Liver Function Panel')}
                    className="p-2.5 rounded-lg bg-surface-container-lowest border border-outline-variant/30 hover:border-primary-container/60 hover:bg-surface-container-high/60 text-left transition-all"
                  >
                    <span className="font-bold text-xs text-on-surface block">Liver Function Panel</span>
                    <span className="text-[10px] text-amber-400 font-mono">ALT 74 • AST 59 • Bilirubin 1.5</span>
                  </button>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-3 border-t border-outline-variant/20">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isAnalyzingNewReport}
                  onClick={() => handleUploadAndAnalyzeReport()}
                  className="px-5 py-2 rounded bg-primary-container text-surface-container-lowest font-bold hover:bg-primary-fixed flex items-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-50"
                >
                  {isAnalyzingNewReport ? (
                    <>
                      <span className="w-4 h-4 border-2 border-surface-container-lowest border-t-transparent rounded-full animate-spin"></span>
                      <span>Ingesting & Flagging Markers...</span>
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">psychology</span>
                      <span>Analyze & Consult Dr. Marcus</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DoctorsCabinPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center text-primary-container font-telemetry-sm">
          <div className="w-12 h-12 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center glow-cyan mb-4 animate-spin">
            <span className="material-symbols-outlined text-[24px]">vital_signs</span>
          </div>
          <p className="text-on-surface-variant">LOADING MARCUSCABIN TELE-CABIN ENVIRONMENT...</p>
        </div>
      }
    >
      <DoctorsCabinContent />
    </Suspense>
  );
}
