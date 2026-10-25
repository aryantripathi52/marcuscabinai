# Marcuscabin - Healthcare & MedTech Prototype

> **ORCA CODER Hackathon — Track 02 (Healthcare & MedTech)**  
> Intelligent Medical Report Analyzer with Dynamic Anomaly Combination Detection & Lip-Synced AI Doctor Consultation.

---

## 🏥 Overview

**Marcuscabin** is an intelligent medical report analyzer designed to bridge the comprehension gap between clinical lab outputs and patient understanding. Rather than presenting isolated, intimidating numeric lab values, Marcuscabin:
1. **Instantly Triages Biomarkers** against standardized baseline clinical reference ranges in a high-contrast dark-mode dashboard.
2. **Detects Concerning Multi-Marker Combinations** using clinical heuristic matrices and Large Language Models (e.g., recognizing that *High Glucose + High Creatinine* signals urgent cardiorenal/diabetic nephropathy risk, not just independent mild elevations).
3. **Hosts a Virtual "Doctor's Cabin" Consultation**: An interactive virtual consultation room with a lip-synced animated AI Doctor avatar who verbally reviews the findings, answers up to 3 targeted patient questions, and transitions into a printable medical summary.
4. **Delivers One-Click Print-Ready Handoff**: A clean, light-mode, print-optimized clinical report (`/export`) ready for primary care visits or personal health records.

---

## 🚀 Key Features

- **Intelligent Triage Dashboard (`/dashboard`)**:
  - High-contrast dark mode with instant visual alerts (Critical Red, Elevated/Low Yellow, Optimal Emerald).
  - Multi-biomarker sparklines depicting historical lab progression.
  - Quick patient switcher (Marcus Vance, Sarah Jenkins, David Chen, Elena Gomez).
  - Triage Urgency Index calculating composite patient risk scores.

- **Dynamic Explainability Tooltips**:
  - Interactive hover and modal states revealing the AI's clinical reasoning behind flagged anomalous combinations.
  - Deep-dive breakdown of physiological interactions (e.g. Hepatorenal, Atherogenic Dyslipidemia, Electrolyte Crises).

- **Doctor's Cabin (Interactive AI Virtual Consultation) (`/cabin`)**:
  - **Animated AI Doctor Avatar** with dynamic lip-syncing and speech-reactive wave animations.
  - **Speech Synthesis (TTS)**: Instant browser Web Speech API fallback + backend audio synthesis.
  - **Speech Recognition (STT)**: User voice input toggle with browser SpeechRecognition.
  - **Strict State-Managed 3-Question Counter**: Enforces `const [questionsRemaining, setQuestionsRemaining] = useState(3)`.
  - **Automated Clinical Handoff**: On the final query, the doctor concludes: *"Here is your final report."* and automatically transitions the patient to the export page.

- **One-Click Clinical Export (`/export`)**:
  - Light-theme, print-optimized clinical summary.
  - Summary of flagged anomalies, combination risk assessments, and Doctor's Cabin consultation notes.
  - Standard `window.print()` integration with clean CSS `@media print` layout.

---

## 🛠 Tech Stack

- **Frontend**: Next.js (React 18/19), Tailwind CSS, Lucide React, Recharts (for sparklines & metrics), Canvas/SVG for Avatar Lip-Sync.
- **Backend**: Python 3.12, FastAPI, Pydantic, Uvicorn, HTTPX.
- **AI & Explainability**: Standard LLM API integration (OpenAI / Gemini) with built-in realistic clinical heuristic inference fallback for offline/zero-config operation.
- **Speech**: Web Speech API (zero-latency, client-side, zero-cost) & ElevenLabs/REST TTS integration.
- **Data & Auth**: Supabase schema ready + local session mock storage for instantaneous hackathon demonstration.

---

## ⚡ Getting Started (Local Development)

### Prerequisites
- Node.js v18+
- Python 3.9+ (or `uv` package runner)
- Modern web browser (Chrome, Edge, Firefox, or Safari)

### Quick Start

#### 1. Backend Setup
```bash
cd backend
# Using uv (recommended for ultra-fast setup):
uv venv
# On Windows:
.venv\Scripts\activate
# On Linux/macOS:
source .venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
*The backend API will run at `http://localhost:8000` with interactive Swagger docs at `http://localhost:8000/docs`.*

#### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```
*The Next.js frontend will run at `http://localhost:3000`.*

---

## 📁 Repository Structure

```
Marcuscabin/
├── README.md                  # Project overview and run guide
├── PRD.md                     # Product Requirements Document
├── TRD.md                     # Technical Requirements Document
├── ANALYSIS.md                # Clinical & technical in-depth analysis
├── backend/
│   ├── requirements.txt       # Python dependencies (FastAPI, uvicorn, etc.)
│   ├── main.py                # FastAPI routes & API handlers
│   ├── reference_ranges.py    # Clinical biomarker ranges & combination rules
│   ├── mock_data.py           # Preloaded synthetic patient reports
│   └── services/
│       ├── analyzer.py        # Anomaly detection & combination reasoning
│       └── llm_service.py     # AI dialogue, prompt formatting & fallback engine
└── frontend/
    ├── package.json           # Next.js & UI dependencies
    ├── tailwind.config.js     # Custom clinical color palette & animation configs
    ├── src/
    │   ├── app/
    │   │   ├── page.tsx       # Landing page with demo bypass authentication
    │   │   ├── dashboard/     # High-contrast triage dashboard & sparklines
    │   │   ├── cabin/         # Doctor's Cabin with lip-synced AI avatar & 3-Q counter
    │   │   └── export/        # Print-optimized medical summary & PDF export
    │   ├── components/
    │   │   ├── DoctorAvatar.tsx # Lip-synced avatar with speech reactive state
    │   │   ├── Sparkline.tsx    # Lab trend sparklines
    │   │   ├── AnomalyBadge.tsx # High/Low/Critical biomarker badges
    │   │   └── ExplainModal.tsx # Dynamic explainability modal for combinations
    │   └── lib/
    │       ├── api.ts         # Backend API client with mock fallbacks
    │       └── speech.ts      # Web Speech API wrapper for TTS/STT
```

---

## 🧬 Clinical Biomarker Combinations Detected

| Combination | Biomarkers Flagged | Clinical Risk / Rationale | Triage Level |
|---|---|---|---|
| **Diabetic Nephropathy Risk** | Fasting Glucose > 125 mg/dL & Creatinine > 1.3 mg/dL | Concurrently elevated glycemic index and impaired renal clearance suggest diabetic kidney microvascular damage. | **Critical (Red)** |
| **Atherogenic Dyslipidemia** | Total Cholesterol > 200 mg/dL, Triglycerides > 150 mg/dL, LDL > 130 mg/dL | High circulating atherogenic lipids multiply coronary artery disease & ischemic stroke hazards. | **High (Yellow)** |
| **Hepatocellular Stress** | ALT > 55 U/L & AST > 48 U/L | Dual transaminase leakage indicating active liver parenchyma irritation or metabolic steatohepatitis. | **High (Yellow)** |
| **Cardiorenal Arrhythmia Alert** | Potassium > 5.2 mEq/L & Creatinine > 1.3 mg/dL | Diminished potassium clearance can trigger fatal ventricular arrhythmias. Immediate cardiology referral indicated. | **Critical (Red)** |
| **Metabolic Syndrome** | Glucose > 100 mg/dL, Triglycerides > 150 mg/dL, HDL < 40 mg/dL | Triad of insulin resistance, dyslipidemia, and vascular endothelial inflammation. | **Moderate (Yellow)** |

---

## 📄 License & Attribution
Developed for the **ORCA CODER Hackathon (Track 02: Healthcare & MedTech)**.  
Prototype for clinical decision support demonstration.
