# Technical Requirements Document (TRD)

**Project Name**: Marcuscabin  
**Event**: ORCA CODER Hackathon (Track 02 — Healthcare & MedTech)  
**Architecture**: Next.js Frontend + Python FastAPI Backend + Web Speech API + Heuristic/LLM Engine

---

## 1. System Architecture

```
┌────────────────────────────────────────────────────────┐
│                   Next.js 14/15 App                    │
│  - / (Landing & Demo Login)                            │
│  - /dashboard (High-contrast Triage Dashboard)         │
│  - /cabin (Doctor's Cabin Consultation & Avatar)       │
│  - /export (Light-mode Print-Ready Clinical Summary)   │
└──────────────┬───────────────────────────▲─────────────┘
               │ HTTP / JSON API           │ Web Speech API /
               │                           │ Audio Event Bus
┌──────────────▼───────────────────────────┴─────────────┐
│                    FastAPI Backend                     │
│  - /api/reports          (List & Fetch Mock Reports)   │
│  - /api/analyze          (Triage & Combination Engine) │
│  - /api/chat             (Doctor Dialogue & Final Turn)│
│  - /api/export-summary   (Print Data Compilation)      │
└──────────────┬─────────────────────────────────────────┘
               │
   ┌───────────┴─────────────┐
   ▼                         ▼
reference_ranges.py    Clinical Heuristic /
& Mock JSON Store      LLM Reasoning Engine
```

---

## 2. API Contracts & Specifications

### 2.1 Biomarker Analysis Endpoint: `POST /api/analyze`

**Request Payload:**
```json
{
  "patient_id": "12345",
  "report_type": "Comprehensive Metabolic Panel",
  "date": "2026-10-25",
  "metrics": [
    {"name": "Fasting Glucose", "value": 142, "unit": "mg/dL"},
    {"name": "Creatinine", "value": 1.5, "unit": "mg/dL"},
    {"name": "eGFR", "value": 52, "unit": "mL/min/1.73m2"},
    {"name": "BUN", "value": 26, "unit": "mg/dL"},
    {"name": "Potassium", "value": 4.8, "unit": "mEq/L"}
  ]
}
```

**Response Payload:**
```json
{
  "patient_id": "12345",
  "triage_summary": {
    "total_metrics": 5,
    "critical_count": 1,
    "elevated_count": 2,
    "optimal_count": 2,
    "overall_urgency": "HIGH"
  },
  "flags": [
    {
      "name": "Fasting Glucose",
      "value": 142,
      "unit": "mg/dL",
      "status": "CRITICAL",
      "reference_min": 70,
      "reference_max": 99,
      "explanation": "Significantly above baseline threshold (99 mg/dL). Indicates persistent hyperglycemia."
    },
    {
      "name": "Creatinine",
      "value": 1.5,
      "unit": "mg/dL",
      "status": "ELEVATED",
      "reference_min": 0.7,
      "reference_max": 1.3,
      "explanation": "Elevated serum creatinine signals reduced glomerular filtration."
    }
  ],
  "combinations": [
    {
      "id": "diabetic_nephropathy_risk",
      "title": "Cardiorenal & Diabetic Nephropathy Risk",
      "severity": "CRITICAL",
      "biomarkers_involved": ["Fasting Glucose", "Creatinine"],
      "clinical_rationale": "Elevated fasting glucose (142 mg/dL) coupled with increased creatinine (1.5 mg/dL) indicates potential microvascular glomerular injury exacerbated by chronic hyperglycemia.",
      "patient_explanation": "Your blood sugar and kidney filtration markers are both elevated together. When high sugar levels persist in the bloodstream, they strain the delicate filters of your kidneys.",
      "action_items": [
        "Schedule follow-up HbA1c test and urine microalbumin check",
        "Hydrate adequately and limit processed sodium/sugars",
        "Consult your primary care physician for kidney function monitoring"
      ]
    }
  ],
  "speech_intro": "Hello, Marcus. I have reviewed your laboratory findings. Your overall metabolic panel shows elevated blood glucose and creatinine, which requires our careful attention."
}
```

---

### 2.2 Consultation Chat Endpoint: `POST /api/chat`

**Request Payload:**
```json
{
  "patient_id": "12345",
  "user_message": "What should I eat to reduce stress on my kidneys and blood sugar?",
  "chat_history": [
    {"role": "assistant", "content": "Hello Marcus..."}
  ],
  "report_context": {
    "flags": ["Fasting Glucose: 142 mg/dL", "Creatinine: 1.5 mg/dL"],
    "combinations": ["Cardiorenal & Diabetic Nephropathy Risk"]
  },
  "questions_remaining": 1,
  "is_final_turn": false
}
```

**Response Payload:**
```json
{
  "reply": "Focus on a whole-food, kidney-friendly and low-glycemic meal plan...",
  "questions_remaining": 0,
  "is_final_turn": true,
  "concluding_phrase": "Here is your final report.",
  "visemes": [
    {"time": 0.0, "mouth": "closed"},
    {"time": 0.2, "mouth": "open_wide"},
    {"time": 0.5, "mouth": "smile"}
  ],
  "action": "TRIGGER_EXPORT_TRANSITION"
}
```

---

## 3. Frontend State Management & 3-Question Protocol

In `frontend/src/app/cabin/page.tsx`:
```typescript
const [questionsRemaining, setQuestionsRemaining] = useState<number>(3);
const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
const [isListening, setIsListening] = useState<boolean>(false);
const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);

// Handle question submission
const handleSendMessage = async (userText: string) => {
  if (isSpeaking || questionsRemaining <= 0 || !userText.trim()) return;

  const nextQuestionsRemaining = questionsRemaining - 1;
  const isFinal = nextQuestionsRemaining === 0;

  // Optimistic UI update
  setChatHistory((prev) => [...prev, { role: 'user', content: userText }]);
  setQuestionsRemaining(nextQuestionsRemaining);

  // API Call to /api/chat
  const res = await sendConsultationChat({
    user_message: userText,
    questions_remaining: nextQuestionsRemaining,
    is_final_turn: isFinal,
    report_context: reportData,
    chat_history: chatHistory,
  });

  // Append assistant message
  setChatHistory((prev) => [...prev, { role: 'assistant', content: res.reply }]);

  // Speak response with Web Speech API
  speakText(res.reply, {
    onStart: () => setIsSpeaking(true),
    onEnd: () => {
      setIsSpeaking(false);
      if (isFinal) {
        // Auto-redirect to /export
        setTimeout(() => {
          router.push('/export');
        }, 800);
      }
    }
  });
};
```

---

## 4. Audio Playback & Lip-Sync Viseme Mechanics

1. **Web Speech API**:
   - `window.speechSynthesis` provides zero-latency client-side speech generation.
   - Dynamically selects warm, articulate English voices (e.g., `Google US English`, `Samantha`, `Microsoft Jenny Online`).
   - Boundary events (`utterance.onboundary`) emit word and phoneme triggers to drive the animated avatar's mouth mesh/curves.
2. **Avatar Lip-Sync Animation**:
   - The `<DoctorAvatar />` component features a clean SVG medical portrait with dynamically tweened mouth shapes (`mouthClosed`, `mouthOpen`, `mouthRound`, `mouthWide`).
   - While `isSpeaking === true`, an audio waveform visualizer and phoneme cycle simulate realistic speech articulation.
   - When idle, the avatar exhibits lifelike micro-blinking and ambient breathing motions.

---

## 5. Security & Edge Case Handling

- **CORS Configuration**: FastAPI configured with `CORSMiddleware` permitting `http://localhost:3000` and Vercel domains.
- **Fail-Safe Offline Inference**: Built-in clinical heuristic engine guarantees full conversational flow even if external LLM API keys are unset.
- **Print Optimization**: Clean CSS `@media print` rules strip sticky headers, shadows, audio bars, and dark backgrounds, outputting high-contrast monochrome/light clinical reports.
