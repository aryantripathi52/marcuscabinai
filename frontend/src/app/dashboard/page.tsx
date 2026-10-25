'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { fetchReportById, fetchAllReports, PatientReport, Combination } from '@/lib/api';
import ExplainModal from '@/components/ExplainModal';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') || '';

  const [report, setReport] = useState<PatientReport | null>(null);
  const [allReports, setAllReports] = useState<PatientReport[]>([]);
  const [selectedCombination, setSelectedCombination] = useState<Combination | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [showEditProfile, setShowEditProfile] = useState<boolean>(false);
  const [showUploadModal, setShowUploadModal] = useState<boolean>(false);
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [isProcessingReport, setIsProcessingReport] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(false);

  // Editable patient profile fields
  const [patientName, setPatientName] = useState<string>('Arthur Pendelton');
  const [patientAge, setPatientAge] = useState<number>(54);
  const [patientGender, setPatientGender] = useState<string>('Male');
  const [bloodGroup, setBloodGroup] = useState<string>('O-Positive (O+)');

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      let customProfile: any = null;
      try {
        const stored = localStorage.getItem('synapse_patient_profile');
        if (stored) customProfile = JSON.parse(stored);
      } catch (e) {}

      // Use profile ID from localStorage or URL param — never a hardcoded fallback
      const targetId = patientId || customProfile?.id || customProfile?.patient_id || null;

      const allList = await fetchAllReports();
      const currReport = targetId ? await fetchReportById(targetId) : null;
      let activeReport = currReport || (allList.length > 0 ? allList[0] : null);
      if (!activeReport) {
        try {
          const cached = localStorage.getItem('synapse_latest_report');
          if (cached) activeReport = JSON.parse(cached);
        } catch (e) {}
      }

      setReport(activeReport);
      setAllReports(allList.length > 0 ? allList : (activeReport ? [activeReport] : []));

      if (customProfile) {
        setPatientName(customProfile.full_name || customProfile.name || 'New Patient');
        setPatientAge(customProfile.age || 0);
        setPatientGender(customProfile.gender || 'Not specified');
        setBloodGroup(customProfile.blood_type || 'Unknown');
      } else if (activeReport) {
        setPatientName(activeReport.name || 'New Patient');
        setPatientAge(activeReport.age || 0);
        setPatientGender(activeReport.gender || 'Not specified');
        setBloodGroup(activeReport.blood_type || 'Unknown');
      }
      setLoading(false);
    }
    loadData();
  }, [patientId]);

  const handleLogout = () => {
    router.push('/');
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setShowEditProfile(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center text-primary-container font-telemetry-sm">
        <div className="w-12 h-12 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center glow-cyan mb-4 animate-spin">
          <span className="material-symbols-outlined text-[24px]">vital_signs</span>
        </div>
        <p className="text-on-surface-variant">SYNCHRONIZING TELE-ICU CLINICAL TELEMETRY STREAM...</p>
      </div>
    );
  }

  const { triage_summary, flags = [], combinations = [] } = report || { triage_summary: null, flags: [], combinations: [] };

  // Extract key vitals (safe defaults for new users)
  const glucoseMetric = flags.find((m) => m.name.includes('Glucose')) || { name: 'Fasting Glucose', value: 0, unit: 'mg/dL' };
  const hba1cMetric = flags.find((m) => m.name.includes('HbA1c')) || { name: 'HbA1c', value: 0, unit: '%' };
  const creatinineMetric = flags.find((m) => m.name.includes('Creatinine')) || { name: 'Creatinine', value: 0, unit: 'mg/dL' };

  return (
    <div className="bg-surface-container-lowest text-on-surface antialiased font-body-sm text-body-sm min-h-screen flex flex-col telemetry-grid selection:bg-primary-container selection:text-surface-container-lowest overflow-x-hidden">
      {/* Dynamic Explainability Modal */}
      <ExplainModal
        combination={selectedCombination}
        onClose={() => setSelectedCombination(null)}
        patientId={patientId}
      />

      {/* Edit Profile Modal Dialog */}
      {showEditProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 max-w-md w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">edit_note</span>
                Edit Patient Profile
              </h3>
              <button
                onClick={() => setShowEditProfile(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <form onSubmit={handleSaveProfile} className="space-y-4 font-telemetry-sm">
              <div>
                <label className="block text-on-surface-variant mb-1">Full Name</label>
                <input
                  type="text"
                  value={patientName}
                  onChange={(e) => setPatientName(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-on-surface-variant mb-1">Age</label>
                  <input
                    type="number"
                    value={patientAge}
                    onChange={(e) => setPatientAge(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="block text-on-surface-variant mb-1">Gender</label>
                  <input
                    type="text"
                    value={patientGender}
                    onChange={(e) => setPatientGender(e.target.value)}
                    className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-on-surface focus:outline-none focus:border-primary-container"
                  />
                </div>
              </div>
              <div>
                <label className="block text-on-surface-variant mb-1">Blood Group</label>
                <input
                  type="text"
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant/40 rounded text-on-surface focus:outline-none focus:border-primary-container"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditProfile(false)}
                  className="px-4 py-2 rounded bg-surface-container text-on-surface-variant hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded bg-primary-container text-surface-container-lowest font-bold hover:bg-primary-fixed"
                >
                  Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Medical Report Modal Dialog */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-surface-container-low border border-outline-variant/40 rounded-xl p-6 max-w-lg w-full shadow-2xl relative">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-4">
              <h3 className="font-headline-sm text-headline-sm text-primary flex items-center gap-2">
                <span className="material-symbols-outlined text-primary-container">upload_file</span>
                Upload Medical Report
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-on-surface-variant hover:text-on-surface"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {!uploadSuccess ? (
              <div className="space-y-4 font-telemetry-sm">
                <p className="text-on-surface-variant text-body-sm">
                  Upload your laboratory test results, diagnostic blood panels, or physician summaries (PDF, PNG, JPG). Our clinical AI will extract biomarkers, identify cross-marker combinations, and prepare your consultation with Dr. Marcus Vance.
                </p>

                {/* Drag-and-drop zone */}
                <div
                  onClick={() => {
                    const input = document.getElementById('report-file-input');
                    if (input) input.click();
                  }}
                  className="border-2 border-dashed border-outline-variant/60 hover:border-primary-container/80 rounded-xl p-8 text-center cursor-pointer bg-surface-container-lowest/50 hover:bg-surface-container/40 transition-all group"
                >
                  <input
                    id="report-file-input"
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.dcm"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setUploadFileName(e.target.files[0].name);
                      }
                    }}
                  />
                  <div className="w-12 h-12 rounded-full bg-primary-container/15 flex items-center justify-center text-primary-container mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <span className="material-symbols-outlined text-[28px]">cloud_upload</span>
                  </div>
                  {uploadFileName ? (
                    <div>
                      <span className="font-bold text-primary-container block">{uploadFileName}</span>
                      <span className="text-xs text-outline">Click to change file</span>
                    </div>
                  ) : (
                    <div>
                      <span className="font-semibold text-on-surface block">Drag & drop lab report here or browse</span>
                      <span className="text-xs text-outline">Supports PDF, PNG, JPG, DICOM (up to 25MB)</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={isProcessingReport}
                    onClick={() => {
                      setIsProcessingReport(true);
                      setTimeout(() => {
                        setIsProcessingReport(false);
                        setUploadSuccess(true);
                      }, 1400);
                    }}
                    className="px-5 py-2 rounded bg-primary-container text-surface-container-lowest font-bold hover:bg-primary-fixed flex items-center gap-2 shadow-lg shadow-primary-container/20 disabled:opacity-50"
                  >
                    {isProcessingReport ? (
                      <>
                        <span className="w-4 h-4 border-2 border-surface-container-lowest border-t-transparent rounded-full animate-spin"></span>
                        <span>Extracting Biomarkers...</span>
                      </>
                    ) : (
                      <>
                        <span className="material-symbols-outlined text-[18px]">neurology</span>
                        <span>Analyze & Consult AI Doctor</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4 text-center py-4 font-telemetry-sm">
                <div className="w-14 h-14 rounded-full bg-primary-container/20 border border-primary-container/50 text-primary-container flex items-center justify-center mx-auto mb-2 glow-cyan">
                  <span className="material-symbols-outlined text-[32px]">check_circle</span>
                </div>
                <h4 className="font-headline-sm text-lg font-bold text-on-surface">Report Analyzed Successfully!</h4>
                <p className="text-on-surface-variant text-body-sm max-w-sm mx-auto">
                  Biomarkers parsed and synchronized with your medical chart. Multi-marker cross analysis completed.
                </p>

                <div className="p-3 rounded-lg bg-surface-container border border-outline-variant/30 text-left text-xs space-y-1 my-4">
                  <div className="flex justify-between">
                    <span className="text-outline">Extracted Markers:</span>
                    <span className="font-bold text-on-surface">7 Biomarkers</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Risk Combinations:</span>
                    <span className="font-bold text-error">2 Flagged Patterns</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-outline">Assigned Doctor:</span>
                    <span className="font-bold text-primary-container">Dr. Marcus Vance, M.D.</span>
                  </div>
                </div>

                <div className="flex justify-center gap-3 pt-2">
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="px-4 py-2 rounded bg-surface-container text-on-surface-variant hover:text-on-surface font-semibold"
                  >
                    Close
                  </button>
                  <Link
                    href={`/cabin?patientId=${patientId}`}
                    className="px-5 py-2 rounded bg-primary-container text-surface-container-lowest font-bold hover:bg-primary-fixed flex items-center gap-2 shadow-lg shadow-primary-container/20"
                  >
                    <span className="material-symbols-outlined text-[18px]">meeting_room</span>
                    <span>Enter Doctor's Cabin</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TOP / HEADER NAVIGATION BAR (Doctor Cabin | Dashboard | Marcus | Reports + Edit Profile) */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-40 bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/30 shadow-lg shadow-surface-container-lowest/70 px-4 lg:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Left Navigation Items (Doctor Cabin, Dashboard, Marcus, Reports) */}
          <div className="flex items-center gap-3 md:gap-6 flex-wrap">
            {/* Cabin / Brand Badge */}
            <Link href="/" className="flex items-center gap-2.5 pr-4 border-r border-outline-variant/30 group">
              <div className="w-9 h-9 rounded bg-primary-container/15 flex items-center justify-center border border-primary-container/40 glow-cyan group-hover:scale-105 transition-transform">
                <span
                  className="material-symbols-outlined text-primary-container text-[20px]"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  meeting_room
                </span>
              </div>
              <div>
                <div className="font-headline-sm text-sm font-bold text-primary-container tracking-tight leading-tight">
                  Doctor Cabin
                </div>
                <div className="font-telemetry-sm text-[10px] text-outline leading-tight">
                  Marcuscabin v4.2
                </div>
              </div>
            </Link>

            {/* Wireframe Sketched Tabs: Dashboard, Marcus, Reports */}
            <nav className="flex items-center gap-1.5 sm:gap-2">
              {/* 1. Dashboard (Active) */}
              <Link
                className="px-3.5 py-1.5 rounded-md bg-surface-container-high text-primary-container border-b-2 border-primary-container font-telemetry-md text-sm font-semibold flex items-center gap-2 shadow-sm"
                href={`/dashboard?patientId=${patientId}`}
              >
                <span className="material-symbols-outlined text-[18px]">dashboard</span>
                <span>Dashboard</span>
              </Link>

              {/* 2. Marcus (Doctor / Clinician consultation tab) */}
              <Link
                className="px-3.5 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 font-telemetry-md text-sm transition-colors flex items-center gap-1.5"
                href={`/cabin?patientId=${patientId}`}
              >
                <span className="material-symbols-outlined text-[18px]">stethoscope</span>
                <span>Dr. Marcus</span>
                <span className="w-1.5 h-1.5 rounded-full bg-primary-container pulse-indicator"></span>
              </Link>

              {/* 3. Reports */}
              <a
                className="px-3.5 py-1.5 rounded-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container/60 font-telemetry-md text-sm transition-colors flex items-center gap-1.5"
                href="#old-reports-section"
              >
                <span className="material-symbols-outlined text-[18px]">description</span>
                <span>Reports</span>
                <span className="px-1.5 py-0.2 rounded-full bg-error-container/40 text-error text-[10px] font-bold border border-error/30 font-telemetry-sm">
                  {combinations.length > 0 ? combinations.length : 3}
                </span>
              </a>
            </nav>
          </div>

          {/* Right Header Area: 'Edit Profile' Button & Doctor Identity */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 font-telemetry-sm text-telemetry-sm text-outline border-r border-outline-variant/30 pr-3">
              <span className="text-secondary font-mono">LIVE HUD</span>
              <span className="w-2 h-2 rounded-full bg-primary-container pulse-indicator"></span>
            </div>

            {/* 'Upload Report' Button */}
            <button
              onClick={() => {
                setShowUploadModal(true);
                setUploadSuccess(false);
                setIsProcessingReport(false);
              }}
              className="px-3.5 py-2 rounded-lg bg-primary-container text-surface-container-lowest hover:bg-primary-fixed font-headline-sm text-caption sm:text-body-sm font-bold flex items-center gap-2 transition-all shadow-md shadow-primary-container/20 active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px]">upload_file</span>
              <span>Upload Report</span>
            </button>

            {/* 'Edit Profile' Button */}
            <button
              onClick={() => setShowEditProfile(true)}
              className="px-3.5 py-2 rounded-lg bg-surface-container hover:bg-surface-container-high border border-primary-container/40 hover:border-primary-container text-primary font-headline-sm text-caption sm:text-body-sm font-semibold flex items-center gap-2 transition-all glow-cyan active:scale-[0.98]"
            >
              <span className="material-symbols-outlined text-[18px] text-primary-container">edit_note</span>
              <span>Edit Profile</span>
            </button>

            {/* Doctor Avatar Thumbnail */}
            <div className="w-9 h-9 rounded-full overflow-hidden hairline-border ring-2 ring-primary-container/30 shrink-0">
              <img
                className="w-full h-full object-cover"
                alt="Headshot of Doctor"
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"
              />
            </div>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* MAIN BODY CANVAS                                                          */}
      {/* ========================================================================= */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* ======================================================================= */}
        {/* SECTION: "Details of Patient" Card Area                                */}
        {/* ======================================================================= */}
        <section
          aria-labelledby="patient-details-heading"
          className="rounded-xl bg-surface-container-low/90 backdrop-blur-xl hairline-border border-outline-variant/40 p-5 sm:p-7 relative overflow-hidden shadow-2xl"
        >
          {/* Glow accent top strip */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary-container via-secondary to-transparent"></div>

          {/* Section Title & Quick Metadata Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/20 gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container text-[24px]">assignment_ind</span>
              <h2
                className="text-headline-lg font-headline-lg font-bold text-on-surface tracking-tight"
                id="patient-details-heading"
              >
                Details of Patient
              </h2>
              <span className="px-2.5 py-0.5 rounded text-telemetry-sm font-telemetry-sm bg-error-container/25 text-error border border-error/40 flex items-center gap-1.5 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-error pulse-indicator"></span>
                {report ? ((triage_summary?.critical_count ?? 0) + (triage_summary?.elevated_count ?? 0)) : 0} Anomaly Vectors Flagged
              </span>
            </div>
            <div className="flex items-center gap-2 font-telemetry-sm text-telemetry-sm text-outline">
              <span>Record ID:</span>
              <span className="text-secondary font-mono font-bold">#PX-{report?.patient_id ?? 'NEW'}-ALPHA</span>
              <span>•</span>
              <span className="text-primary-container">Tele-ICU Unit 4</span>
            </div>
          </div>

          {/* Patient Information Grid + P.P Circle Avatar */}
          <div className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* LEFT: Patient Demographics & Key Biomarkers (8 Cols) */}
            <div className="lg:col-span-8 space-y-4">
              {/* Key Demographics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 rounded-lg bg-surface-container-lowest/80 hairline-border">
                  <span className="font-telemetry-sm text-[10px] text-outline uppercase block">Full Name</span>
                  <span className="text-base font-bold text-on-surface">{patientName}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-lowest/80 hairline-border">
                  <span className="font-telemetry-sm text-[10px] text-outline uppercase block">Age / Gender</span>
                  <span className="text-base font-bold text-on-surface font-telemetry-md">
                    {patientAge} Yrs • {patientGender}
                  </span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-lowest/80 hairline-border">
                  <span className="font-telemetry-sm text-[10px] text-outline uppercase block">Blood Group</span>
                  <span className="text-base font-bold text-primary-container font-telemetry-md">{bloodGroup}</span>
                </div>
                <div className="p-3 rounded-lg bg-surface-container-lowest/80 hairline-border">
                  <span className="font-telemetry-sm text-[10px] text-outline uppercase block">Admission</span>
                  <span className="text-base font-bold text-on-surface font-telemetry-md">{report?.date ?? 'No report yet'}</span>
                </div>
              </div>

              {/* Secondary Clinical Context & Doctor in Charge */}
              <div className="p-4 rounded-lg bg-surface-container/60 hairline-border grid grid-cols-1 sm:grid-cols-3 gap-4 text-body-sm">
                <div>
                  <span className="font-telemetry-sm text-[11px] text-outline block">Attending Physician</span>
                  <span className="text-on-surface font-semibold flex items-center gap-1.5 mt-0.5">
                    <span className="material-symbols-outlined text-primary-container text-[16px]">verified</span>
                    {report?.ordering_physician || 'Dr. Marcus Vance, MD'}
                  </span>
                </div>
                <div>
                  <span className="font-telemetry-sm text-[11px] text-outline block">Clinical Triage Level</span>
                  <span
                    className={`font-semibold flex items-center gap-1.5 mt-0.5 ${
                      triage_summary?.overall_urgency === 'CRITICAL' ? 'text-error' : 'text-secondary'
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full pulse-indicator ${
                        triage_summary?.overall_urgency === 'CRITICAL' ? 'bg-error' : 'bg-secondary'
                      }`}
                    ></span>
                    {triage_summary ? (triage_summary.overall_urgency === 'CRITICAL' ? 'Level 1 - Acute Anomaly' : 'Level 2 - Urgent Monitoring') : 'No Report Yet'}
                  </span>
                </div>
                <div>
                  <span className="font-telemetry-sm text-[11px] text-outline block">Latest Sensor Stream</span>
                  <span className="text-secondary font-mono mt-0.5 block">Active (28ms latency)</span>
                </div>
              </div>

              {/* Primary Vitals Telemetry Row (Blood Pressure, Heart Rate, Fasting Glucose / HbA1c, SpO2) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                <div className="p-3 rounded-lg bg-surface-container-high/60 hairline-border">
                  <div className="flex items-center justify-between text-outline text-[11px] font-telemetry-sm">
                    <span>BLOOD PRESS.</span>
                    <span className="text-secondary">Nominal</span>
                  </div>
                  <div className="font-telemetry-lg text-lg font-bold text-on-surface mt-1">
                    124/82 <span className="text-[10px] text-outline">mmHg</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-high/60 hairline-border">
                  <div className="flex items-center justify-between text-outline text-[11px] font-telemetry-sm">
                    <span>HEART RATE</span>
                    <span className="text-secondary">Sinus</span>
                  </div>
                  <div className="font-telemetry-lg text-lg font-bold text-on-surface mt-1">
                    78 <span className="text-[10px] text-outline">bpm</span>
                  </div>
                </div>

                <div
                  onClick={() => combinations.length > 0 && setSelectedCombination(combinations[0])}
                  className="p-3 rounded-lg bg-error-container/20 border border-error/40 glow-red cursor-pointer hover:bg-error-container/30 transition-all"
                  title="Click to view AI reasoning"
                >
                  <div className="flex items-center justify-between text-error text-[11px] font-telemetry-sm font-bold">
                    <span>{glucoseMetric.name}</span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error pulse-indicator"></span>
                      FLAGGED
                    </span>
                  </div>
                  <div className="font-telemetry-lg text-lg font-bold text-error mt-1">
                    {glucoseMetric.value} <span className="text-[10px] text-error/80">{glucoseMetric.unit}</span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-surface-container-high/60 hairline-border">
                  <div className="flex items-center justify-between text-outline text-[11px] font-telemetry-sm">
                    <span>SPO2</span>
                    <span className="text-primary-container">Optimal</span>
                  </div>
                  <div className="font-telemetry-lg text-lg font-bold text-on-surface mt-1">
                    98.4% <span className="text-[10px] text-outline">Pleth OK</span>
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT: Patient Profile Circle (Explicitly labeled "P.P" in wireframe circle) */}
            <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-xl bg-surface-container-lowest/90 hairline-border text-center relative group">
              {/* Outer circular glowing frame representing P.P (Patient Profile) */}
              <div className="relative w-36 h-36 sm:w-40 sm:h-40 rounded-full flex items-center justify-center p-1.5 bg-gradient-to-tr from-primary-container via-secondary to-primary-container/20 shadow-xl glow-cyan mb-3">
                <div className="w-full h-full rounded-full bg-surface-container overflow-hidden relative hairline-border flex items-center justify-center">
                  <img
                    className="w-full h-full object-cover"
                    alt={`Patient portrait representing ${patientName}`}
                    src={report?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300'}
                  />
                  {/* Large Wireframe 'P.P' Emblem Badge */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full bg-surface-container-lowest/90 text-primary-container font-telemetry-sm text-[11px] font-extrabold border border-primary-container/40">
                    P.P.
                  </span>
                </div>
              </div>

              {/* Patient Identity Caption */}
              <div className="font-headline-sm text-base font-bold text-on-surface">{patientName}</div>
              <div className="font-telemetry-sm text-telemetry-sm text-secondary font-mono">
                Patient Profile • P.P-{report?.patient_id ?? 'NEW'}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className="px-2.5 py-1 rounded bg-surface-container text-on-surface-variant font-telemetry-sm text-[11px] hairline-border">
                  Bio-Synced
                </span>
                <span className="px-2.5 py-1 rounded bg-primary-container/20 text-primary-container font-telemetry-sm text-[11px] border border-primary-container/30">
                  DICOM Connected
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ======================================================================= */}
        {/* SECTION: "Old reports" / Past Reports & Logout Button                   */}
        {/* ======================================================================= */}
        <section
          aria-labelledby="old-reports-heading"
          className="rounded-xl bg-surface-container-low/90 backdrop-blur-xl hairline-border border-outline-variant/40 p-5 sm:p-7 shadow-2xl"
          id="old-reports-section"
        >
          {/* Section Header with 'Old reports' Title AND Wireframe 'Logout' Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-outline-variant/20 gap-3">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-primary-container text-[24px]">
                history_toggle_off
              </span>
              <div>
                <h3
                  className="text-headline-sm font-headline-sm font-bold text-on-surface tracking-tight"
                  id="old-reports-heading"
                >
                  Old Reports &amp; Diagnostic History
                </h3>
                <p className="font-telemetry-sm text-telemetry-sm text-outline mt-0.5">
                  Historical clinical logs, lab panels, and multi-modal records
                </p>
              </div>
            </div>

            {/* LOGOUT CONTROL */}
            <div className="flex items-center gap-3">
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-error-container/20 hover:bg-error-container/35 border border-error/40 text-error font-telemetry-md font-bold flex items-center gap-2 transition-all glow-red active:scale-[0.98]"
              >
                <span className="material-symbols-outlined text-[18px]">logout</span>
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Past Reports Table */}
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left font-body-sm text-body-sm">
              <thead>
                <tr className="border-b border-outline-variant/30 text-outline font-telemetry-sm text-telemetry-sm uppercase tracking-wider">
                  <th className="py-3 px-3">Report ID</th>
                  <th className="py-3 px-3">Panel / Test Title</th>
                  <th className="py-3 px-3">Date &amp; Time</th>
                  <th className="py-3 px-3">Physician</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3">Anomaly Vector</th>
                  <th className="py-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/15 font-telemetry-sm text-telemetry-sm">
                {/* Row 1: Active Metabolic Panel (Critical) */}
                <tr className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-secondary font-semibold">#{report?.report_id ?? '---'}</td>
                  <td className="py-3.5 px-3 font-semibold text-on-surface">{report?.report_type ?? 'No Report Yet'}</td>
                  <td className="py-3.5 px-3 text-on-surface-variant font-mono">{report?.date ?? '---'} {report ? '06:15 UTC' : ''}</td>
                  <td className="py-3.5 px-3 text-on-surface">Dr. Marcus Vance, MD</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-error-container/25 text-error border border-error/30 font-bold inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-error pulse-indicator"></span>
                      CRITICAL
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-error">
                    {combinations.length > 0
                      ? `${combinations[0].title} (${glucoseMetric.name} ${glucoseMetric.value} ${glucoseMetric.unit})`
                      : 'Fasting Glucose 142 mg/dL'}
                  </td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/cabin?patientId=${patientId}`}
                        className="px-2.5 py-1 rounded bg-primary-container text-surface-container-lowest font-headline-sm font-bold hover:bg-primary-fixed-dim transition-all"
                      >
                        Consult
                      </Link>
                      <Link
                        href={`/export?patientId=${patientId}`}
                        className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                        title="Download DICOM / Print"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </Link>
                    </div>
                  </td>
                </tr>

                {/* Row 2: Cardiology (Elevated) */}
                <tr className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-secondary font-semibold">#DX-8794</td>
                  <td className="py-3.5 px-3 font-semibold text-on-surface">Cardiovascular Telemetry &amp; Lipids</td>
                  <td className="py-3.5 px-3 text-on-surface-variant font-mono">2026-02-12 14:40 UTC</td>
                  <td className="py-3.5 px-3 text-on-surface">Dr. Sarah Chen, MD</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-semibold inline-flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                      ELEVATED
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-amber-400">hs-CRP 3.4 mg/L (ApoB +14%)</td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/cabin?patientId=67890`}
                        className="px-2.5 py-1 rounded bg-primary-container text-surface-container-lowest font-headline-sm font-bold hover:bg-primary-fixed-dim transition-all"
                      >
                        Consult
                      </Link>
                      <Link
                        href={`/export?patientId=67890`}
                        className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                        title="Download DICOM"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </Link>
                    </div>
                  </td>
                </tr>

                {/* Row 3: CBC (Stable) */}
                <tr className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-secondary font-semibold">#DX-8640</td>
                  <td className="py-3.5 px-3 font-semibold text-on-surface">Complete Blood Count &amp; Inflammatory Markers</td>
                  <td className="py-3.5 px-3 text-on-surface-variant font-mono">2026-02-10 09:22 UTC</td>
                  <td className="py-3.5 px-3 text-on-surface">Dr. Elena Rostova, MD</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-primary-container/15 text-primary-container border border-primary-container/30 font-semibold">
                      STABLE
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-on-surface-variant">Lineage Equilibrium (0.2% Var)</td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/dashboard?patientId=24680`}
                        className="px-2.5 py-1 rounded bg-surface-container text-primary-container hover:bg-primary-container hover:text-surface-container-lowest transition-all font-semibold"
                      >
                        View
                      </Link>
                      <Link
                        href={`/export?patientId=24680`}
                        className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                        title="Download DICOM"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </Link>
                    </div>
                  </td>
                </tr>

                {/* Row 4: Serum Electrolytes & Renal Filtration (Archive) */}
                <tr className="hover:bg-surface-container-high/40 transition-colors">
                  <td className="py-3.5 px-3 font-mono text-secondary font-semibold">#DX-8419</td>
                  <td className="py-3.5 px-3 font-semibold text-on-surface">Serum Electrolytes &amp; Renal Filtration</td>
                  <td className="py-3.5 px-3 text-on-surface-variant font-mono">2026-01-28 11:05 UTC</td>
                  <td className="py-3.5 px-3 text-on-surface">Dr. Marcus Vance, MD</td>
                  <td className="py-3.5 px-3">
                    <span className="px-2 py-0.5 rounded bg-surface-container text-outline border border-outline-variant/30 font-semibold">
                      ARCHIVED
                    </span>
                  </td>
                  <td className="py-3.5 px-3 text-on-surface-variant">Creatinine 1.28 mg/dL (Prior)</td>
                  <td className="py-3.5 px-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <Link
                        href={`/dashboard?patientId=13579`}
                        className="px-2.5 py-1 rounded bg-surface-container text-primary-container hover:bg-primary-container hover:text-surface-container-lowest transition-all font-semibold"
                      >
                        View
                      </Link>
                      <Link
                        href={`/export?patientId=13579`}
                        className="p-1.5 rounded hover:bg-surface-container text-outline hover:text-on-surface"
                        title="Download DICOM"
                      >
                        <span className="material-symbols-outlined text-[16px]">download</span>
                      </Link>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Quick Sub-pagination & Status */}
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 pt-3 border-t border-outline-variant/20 font-telemetry-sm text-telemetry-sm text-outline gap-2">
            <div>Showing 4 historical telemetry panels • Encrypted FHIR v4 compliant</div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface hairline-border">
                Previous
              </button>
              <span className="text-primary-container px-2">Page 1 of 3</span>
              <button className="px-2 py-1 rounded bg-surface-container hover:bg-surface-container-high text-on-surface hairline-border">
                Next
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* ========================================================================= */}
      {/* FOOTER STATUS STRIP                                                      */}
      {/* ========================================================================= */}
      <footer className="mt-auto px-6 py-3 border-t border-outline-variant/30 bg-surface-container-lowest/90 text-outline flex flex-col sm:flex-row items-center justify-between text-telemetry-sm font-telemetry-sm gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="w-2 h-2 rounded-full bg-primary-container pulse-indicator"></span>
            Neural Diagnostic Engine v4.2 Online
          </span>
          <span>•</span>
          <span>Doctor Cabin System Connected</span>
          <span>•</span>
          <span>256-bit AES GCM</span>
        </div>
        <div>Marcuscabin Clinical Operating Environment • All Rights Reserved.</div>
      </footer>
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center text-primary-container font-telemetry-sm">
          <div className="w-12 h-12 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center glow-cyan mb-4 animate-spin">
            <span className="material-symbols-outlined text-[24px]">vital_signs</span>
          </div>
          <p className="text-on-surface-variant">LOADING DASHBOARD TELEMETRY...</p>
        </div>
      }
    >
      <DashboardContent />
    </Suspense>
  );
}
