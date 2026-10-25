# Product Requirements Document (PRD)

**Project Name**: Marcuscabin  
**Event**: ORCA CODER Hackathon (Track 02 — Healthcare & MedTech)  
**Date**: October 2026  
**Status**: Approved Prototype

---

## 1. Problem Statement & Background

Clinical laboratory reports are essential to modern diagnostic medicine, yet their presentation remains deeply flawed for both patients and healthcare providers:
- **Biomarker Isolation**: Lab sheets present biomarkers in disconnected silos. An individual with slightly elevated glucose and borderline elevated creatinine might receive two minor flags, completely obscuring the severe clinical synergy of emerging *diabetic nephropathy*.
- **Patient Anxiety & Misinterpretation**: Patients who read cryptic lab PDFs frequently panic or consult unvetted internet forums, leading to misdiagnosis or heightened stress.
- **Provider Consultation Overload**: Primary care physicians spend significant clinic time explaining routine normal/abnormal metrics rather than having focused conversations on key lifestyle interventions.

**Marcuscabin** solves this by uniting automated reference triage, multi-marker combination reasoning, and an empathetic, lip-synced virtual AI doctor within a strict 3-question guided consultation protocol.

---

## 2. Target Audience & Stakeholders

1. **Hackathon Judges**: Evaluating technical feasibility, clinical relevance, UI/UX polish, voice/lip-sync integration, and edge-case resilience.
2. **Patients**: Requiring accessible, non-alarmist, plain-language explanations of their laboratory panels.
3. **Clinical Staff (Nurses & Physicians)**: Benefiting from rapid pre-consultation triage summaries that highlight risky multi-marker combinations.

---

## 3. Core User Flow & Journey

```
[1. Landing & Auth]
   │  - Overview of Marcuscabin
   │  - One-click Demo Login / Patient Switcher
   ▼
[2. Intelligent Triage Dashboard]
   │  - High-contrast Dark Mode UI
   │  - Automated Biomarker Flagging (Normal / Elevated / Critical)
   │  - Recharts Biomarker Progression Sparklines
   │  - Dynamic Combination Badges with Explainability Tooltips
   ▼
[3. Doctor's Cabin (Virtual Consultation)]
   │  - Lip-synced animated AI Doctor avatar
   │  - Verbal audio explanation of report findings (TTS)
   │  - Strict 3-question interaction counter (3 -> 2 -> 1 -> 0)
   │  - Real-time speech recognition (STT) or text input
   ▼
[4. Finalization & Automated Handoff]
   │  - On 3rd query completion, Doctor speaks: "Here is your final report."
   │  - Automatic router navigation to /export
   ▼
[5. Clinical Print & Export]
   │  - Light-theme, clinical print-optimized layout
   │  - Actionable medical summaries, dietary pointers, doctor recommendations
   │  - Browser window.print() formatting with clean CSS
```

---

## 4. Key Functional Requirements

### 4.1 Biomarker Triage & Baseline Reference Engine
- **Requirement 4.1.1**: The system must maintain hardcoded baseline clinical reference ranges across major diagnostic panels:
  - Comprehensive Metabolic Panel (Fasting Glucose, Creatinine, BUN, eGFR, Sodium, Potassium, Calcium).
  - Lipid Panel (Total Cholesterol, Triglycerides, HDL, LDL).
  - Liver Function Panel (ALT, AST, Total Bilirubin, Albumin).
  - Complete Blood Count (Hemoglobin, Hematocrit, Platelets, WBC).
- **Requirement 4.1.2**: Values falling above or below the baseline range must trigger visual flags:
  - `CRITICAL`: Immediate physiological concern (e.g., Potassium > 5.3 mEq/L or Glucose > 180 mg/dL).
  - `ELEVATED` / `LOW`: Moderate deviation requiring lifestyle or clinical monitoring.
  - `OPTIMAL` / `NORMAL`: Within physiological homeostasis.

### 4.2 Multi-Biomarker Combination Detection & Explainability
- **Requirement 4.2.1**: The engine must inspect pairs and triads of abnormal biomarkers to detect synergistic risk profiles:
  - High Fasting Glucose + High Creatinine → Diabetic Nephropathy / Microvascular Renal Risk.
  - High Total Cholesterol + High Triglycerides + Low HDL → Atherogenic Dyslipidemia.
  - High ALT + High AST → Acute/Progressive Hepatocellular Stress.
  - High Potassium + High Creatinine → Cardiorenal Arrhythmia Risk.
- **Requirement 4.2.2**: UI must render dynamic hover states and clickable modals explaining the medical rationale in plain, empowering language.

### 4.3 Doctor's Cabin (Voice AI & Avatar)
- **Requirement 4.3.1**: The virtual doctor must feature a visually engaging lip-synced avatar whose mouth movements synchronise with audio speech output.
- **Requirement 4.3.2**: Speech output must support Web Speech API as a high-reliability, zero-latency client-side engine with selectable doctor voices, accompanied by backend TTS compatibility.
- **Requirement 4.3.3**: The consultation must implement a strict state-managed question counter:
  - Initial state: `questionsRemaining = 3`.
  - Decrement upon each answered question.
  - On `questionsRemaining === 0`, trigger final turn response concluding with: *"Here is your final report."*
  - Automatically navigate to `/export` when speech finishes.

### 4.4 Light-Mode Clinical Export Page
- **Requirement 4.4.1**: Dedicated route `/export` with a crisp, hospital-grade white/slate theme.
- **Requirement 4.4.2**: Isolates flagged biomarkers, provides physician-ready diagnostic impressions, and includes patient lifestyle guidance.
- **Requirement 4.4.3**: Integrated print trigger (`window.print()`) that removes web navigation bars and formats directly for letter/A4 paper.

---

## 5. Non-Functional Requirements & Constraints

- **Time Constraint**: Hackathon 3-hour rapid build window. Synthetic pre-loaded JSON records bypass complex OCR/PDF parsing while demonstrating complete clinical pipelines.
- **Performance**: Sub-200ms biomarker triage computation; instant TTS playback initiation.
- **Accessibility**: High-contrast ratios compliant with WCAG AA; audio-visual dual representation.
- **Reliability & Fallbacks**: 100% operational in offline or unkeyed environments via deterministic clinical heuristic fallback engines.
