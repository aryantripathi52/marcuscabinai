-- ====================================================================
-- MARCUSCABIN — SUPABASE DATABASE SCHEMA
-- Relational Schema with Foreign Keys, Indexes, and Constraints
-- Run this in your Supabase SQL Editor: https://supabase.com/dashboard/project/_/sql
-- ====================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. PATIENTS TABLE
CREATE TABLE IF NOT EXISTS public.patients (
    id VARCHAR(64) PRIMARY KEY,                         -- e.g. '9042', '12345'
    mrn VARCHAR(64) UNIQUE NOT NULL,                    -- Medical Record Number: 'MRN-9042-DX'
    full_name VARCHAR(255) NOT NULL,                    -- Patient Name
    age INT NOT NULL CHECK (age >= 0),
    gender VARCHAR(20) NOT NULL,
    blood_type VARCHAR(10) DEFAULT 'A+',
    phone VARCHAR(50),
    email VARCHAR(255),
    emergency_contact JSONB,                            -- { "name": "Jane", "relationship": "Spouse", "phone": "..." }
    clinical_history JSONB,                             -- [ "Hypertension", "Type 2 Diabetes" ]
    status VARCHAR(50) DEFAULT 'ACTIVE',                -- 'ACTIVE', 'IN_CONSULTATION', 'DISCHARGED'
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    updated_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 3. MEDICAL REPORTS (Lab panels / telemetry tests)
CREATE TABLE IF NOT EXISTS public.medical_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(64) NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    panel_name VARCHAR(255) NOT NULL,                   -- e.g. 'Comprehensive Molecular & Metabolic Array'
    collection_date TIMESTAMPTZ NOT NULL,
    verified_by VARCHAR(255) DEFAULT 'Dr. Marcus Vance, M.D.',
    facility VARCHAR(255) DEFAULT 'Synapse Clinical Diagnostic Lab #04',
    status VARCHAR(50) DEFAULT 'COMPLETED',             -- 'PENDING', 'PROCESSING', 'COMPLETED'
    overall_risk VARCHAR(50) DEFAULT 'MODERATE',        -- 'LOW', 'MODERATE', 'HIGH', 'CRITICAL'
    total_biomarkers INT DEFAULT 0,
    flagged_biomarkers INT DEFAULT 0,
    summary_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 4. BIOMARKERS TABLE (Individual lab test results with reference limits)
CREATE TABLE IF NOT EXISTS public.biomarkers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,                         -- e.g. 'Glucose', 'Creatinine', 'hs-CRP'
    category VARCHAR(100) NOT NULL,                     -- 'Cardiovascular', 'Metabolic', 'Renal', etc.
    value NUMERIC(10, 3) NOT NULL,                      -- Measured value
    unit VARCHAR(50) NOT NULL,                          -- 'mg/dL', 'ng/mL', 'pg/mL', etc.
    ref_min NUMERIC(10, 3),                             -- Reference baseline lower limit
    ref_max NUMERIC(10, 3),                             -- Reference baseline upper limit
    status VARCHAR(50) NOT NULL,                        -- 'NORMAL', 'LOW', 'HIGH', 'CRITICAL'
    is_flagged BOOLEAN DEFAULT FALSE,
    delta_percentage NUMERIC(6, 2),                     -- % variation from baseline
    history JSONB,                                      -- Lab trend history for sparkline graphs
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 5. BIOMARKER COMBINATIONS (Detected anomalous multi-marker clinical risks)
CREATE TABLE IF NOT EXISTS public.biomarker_combinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    patient_id VARCHAR(64) NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    rule_id VARCHAR(100) NOT NULL,                      -- 'diabetic_nephropathy', 'atherogenic_dyslipidemia'
    name VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL,                      -- 'CRITICAL', 'HIGH', 'MODERATE', 'LOW'
    flagged_metrics TEXT[] NOT NULL,                    -- Array of biomarker names involved
    clinical_rationale TEXT NOT NULL,                   -- AI/clinical reasoning text
    recommendations TEXT[],                             -- Immediate diagnostic or lifestyle actions
    detected_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 6. CONSULTATIONS TABLE (Doctor's Cabin 3-Question Protocol)
CREATE TABLE IF NOT EXISTS public.consultations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(64) NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    doctor_name VARCHAR(255) DEFAULT 'Dr. Marcus Vance, M.D.',
    doctor_title VARCHAR(255) DEFAULT 'Chief of Clinical Intelligence',
    max_questions INT DEFAULT 3,
    questions_remaining INT DEFAULT 3 CHECK (questions_remaining >= 0),
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW()),
    completed_at TIMESTAMPTZ
);

-- 7. CONSULTATION MESSAGES (Dialogue history between patient and AI doctor)
CREATE TABLE IF NOT EXISTS public.consultation_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_id UUID NOT NULL REFERENCES public.consultations(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'doctor', 'system')),
    turn_number INT NOT NULL,                           -- 1, 2, 3
    content TEXT NOT NULL,                              -- Message utterance
    created_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- 8. EXPORTED FINAL REPORTS (Discharge summary and cryptographic audit trail)
CREATE TABLE IF NOT EXISTS public.export_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id VARCHAR(64) NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    report_id UUID NOT NULL REFERENCES public.medical_reports(id) ON DELETE CASCADE,
    consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
    digital_seal_hash VARCHAR(128) NOT NULL,            -- SHA256 cryptographic report lock
    consultation_summary TEXT NOT NULL,
    physician_signature VARCHAR(255) DEFAULT 'Marcus Vance, M.D. [ID: 884-DX]',
    exported_at TIMESTAMPTZ DEFAULT TIMEZONE('utc', NOW())
);

-- ====================================================================
-- PERFORMANCE INDEXES (Optimized queries for foreign keys and lookups)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_medical_reports_patient ON public.medical_reports(patient_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_report ON public.biomarkers(report_id);
CREATE INDEX IF NOT EXISTS idx_biomarkers_patient ON public.biomarkers(patient_id);
CREATE INDEX IF NOT EXISTS idx_biomarker_combinations_report ON public.biomarker_combinations(report_id);
CREATE INDEX IF NOT EXISTS idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX IF NOT EXISTS idx_consultation_messages_consultation ON public.consultation_messages(consultation_id);
CREATE INDEX IF NOT EXISTS idx_export_reports_patient ON public.export_reports(patient_id);

-- ====================================================================
-- SEED DATA (Demo Patient PT-9042 — Marcus Vance)
-- ====================================================================
INSERT INTO public.patients (id, mrn, full_name, age, gender, blood_type, phone, email, emergency_contact, clinical_history)
VALUES (
    '9042',
    'MRN-9042-DX',
    'Marcus Vance',
    48,
    'Male',
    'O+',
    '+1 (555) 382-9042',
    'marcus.vance@synapse-dx.internal',
    '{"name": "Eleanor Vance", "relationship": "Spouse", "phone": "+1 (555) 382-9043"}'::jsonb,
    '["Type 2 Diabetes Mellitus", "Stage 1 Essential Hypertension", "Mild Hyperlipidemia"]'::jsonb
) ON CONFLICT (id) DO NOTHING;
