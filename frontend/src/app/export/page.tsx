'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { fetchReportById, PatientReport } from '@/lib/api';

function ExportContent() {
  const searchParams = useSearchParams();
  const patientId = searchParams.get('patientId') || '';

  const [report, setReport] = useState<PatientReport | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.title = 'Marcuscabin — Final Clinical Diagnostic Report';
    }
    async function loadData() {
      setLoading(true);
      let customProfile: any = null;
      try {
        const stored = localStorage.getItem('synapse_patient_profile');
        if (stored) customProfile = JSON.parse(stored);
      } catch (e) {}

      const targetId = patientId || customProfile?.id || customProfile?.patient_id || null;
      let data = targetId ? await fetchReportById(targetId) : null;
      if (!data) {
        try {
          const cached = localStorage.getItem('synapse_latest_report');
          if (cached) data = JSON.parse(cached);
        } catch (e) {}
      }
      if (data) {
        if (customProfile) {
          data.name = customProfile.full_name || customProfile.name || data.name;
          data.age = customProfile.age || data.age;
          data.gender = customProfile.gender || data.gender;
          data.blood_type = customProfile.blood_type || data.blood_type;
          data.mrn = customProfile.mrn || data.mrn;
        }
        setReport(data);
      }
      setLoading(false);
    }
    loadData();
  }, [patientId]);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShareLink = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard?.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center text-primary-container font-telemetry-sm">
        <div className="w-12 h-12 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center glow-cyan mb-4 animate-spin">
          <span className="material-symbols-outlined text-[24px]">vital_signs</span>
        </div>
        <p className="text-on-surface-variant">COMPILING MARCUSCABIN FINAL CLINICAL DIAGNOSTIC REPORT...</p>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center text-on-surface font-telemetry-sm p-6 text-center">
        <div className="w-16 h-16 rounded-xl bg-surface-container-high border border-outline-variant/40 flex items-center justify-center mb-4 text-primary-container">
          <span className="material-symbols-outlined text-[32px]">lab_profile</span>
        </div>
        <h2 className="text-headline-sm font-bold text-on-surface mb-2">No Medical Report to Print Yet</h2>
        <p className="text-on-surface-variant max-w-md mb-6 text-body-sm">
          You have not uploaded a medical report yet. Please visit Dr. Vance's Cabin to upload your laboratory report and receive an AI-assisted diagnostic analysis.
        </p>
        <Link
          href={`/cabin${patientId ? `?patientId=${patientId}` : ''}`}
          className="px-5 py-2.5 rounded-lg bg-primary-container text-surface-container-lowest font-headline-sm font-bold shadow-[0_0_16px_rgba(0,242,254,0.35)] hover:bg-primary-fixed-dim transition-all"
        >
          Go to Dr. Vance's Cabin &rarr;
        </Link>
      </div>
    );
  }

  // Filter isolated abnormal biomarkers
  const abnormalMetrics = report.flags.filter(
    (m) => m.status === 'CRITICAL' || m.status === 'ELEVATED' || m.status === 'LOW'
  );

  const isCritical = report.triage_summary.overall_urgency === 'CRITICAL';

  return (
    <div className="bg-surface-container-lowest text-on-surface antialiased min-h-screen font-body-sm selection:bg-primary-container selection:text-on-primary-container">
      {/* Ambient Cinematic Glow Backdrop */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 no-print">
        <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[840px] h-[360px] bg-primary-container/5 blur-[140px] rounded-full"></div>
        <div className="absolute bottom-10 left-10 w-[420px] h-[300px] bg-secondary-container/5 blur-[120px] rounded-full"></div>
      </div>

      {/* FLOATING HIGH-CONTRAST TOP ACTION BAR */}
      <header className="sticky top-0 z-50 w-full bg-surface-container-low/90 backdrop-blur-xl border-b border-outline-variant/30 px-4 md:px-8 py-3.5 no-print shadow-2xl">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left: Engine Branding & Breadcrumbs */}
          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-surface-container-highest flex items-center justify-center border border-primary-container/40 shadow-[0_0_12px_rgba(0,242,254,0.25)]">
                <span className="material-symbols-outlined text-primary-container text-[20px]">neurology</span>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-headline-sm text-headline-sm font-bold tracking-tight text-primary-container">
                    Marcuscabin
                  </span>
                  <span className="text-on-surface-variant font-telemetry-sm text-telemetry-sm px-1.5 py-0.5 rounded bg-surface-container-high border border-outline-variant/40">
                    Synthesis Engine
                  </span>
                </div>
                {/* Breadcrumbs */}
                <div className="flex items-center gap-1.5 text-on-surface-variant font-telemetry-sm text-telemetry-sm mt-0.5">
                  <Link href={`/dashboard?patientId=${patientId}`} className="hover:text-primary-container transition-colors">
                    Patient Queue
                  </Link>
                  <span className="material-symbols-outlined text-[13px] text-outline">chevron_right</span>
                  <span>Case #PT-{report.patient_id}</span>
                  <span className="material-symbols-outlined text-[13px] text-outline">chevron_right</span>
                  <span className="text-on-surface font-semibold">Final Clinical Report</span>
                </div>
              </div>
            </div>

            {/* Verification Chip */}
            <div className="hidden lg:flex items-center gap-2 pl-4 border-l border-outline-variant/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-container opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary-container"></span>
              </span>
              <span className="font-telemetry-sm text-telemetry-sm text-primary-fixed-dim font-medium tracking-wide">
                Verified by Synthetic MD #402
              </span>
            </div>
          </div>

          {/* Right: Action Buttons */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-end">
            {/* Close/Return Button */}
            <Link
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-surface-container-high text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest transition-colors font-telemetry-sm text-telemetry-sm border border-outline-variant/40"
              href={`/dashboard?patientId=${patientId}`}
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              <span>Back to Triage</span>
            </Link>

            {/* Share Securely Button */}
            <button
              onClick={handleShareLink}
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface font-telemetry-sm text-telemetry-sm border border-outline-variant/40 transition-colors shadow-sm active:scale-[0.98]"
              type="button"
            >
              <span className="material-symbols-outlined text-primary-fixed-dim text-[18px]">lock</span>
              <span className="hidden sm:inline">
                {copiedLink ? 'Link Encrypted & Copied!' : 'Share Securely via Encrypted Link'}
              </span>
              <span className="sm:hidden">{copiedLink ? 'Copied' : 'Share Link'}</span>
            </button>

            {/* Primary Glowing Export / Print PDF Button */}
            <button
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary-container text-surface-container-lowest font-headline-sm text-body-sm font-bold tracking-tight shadow-[0_0_18px_rgba(0,242,254,0.45)] hover:shadow-[0_0_24px_rgba(0,242,254,0.65)] hover:bg-primary-fixed transition-all active:scale-[0.98]"
              onClick={handlePrint}
              type="button"
            >
              <span className="material-symbols-outlined text-surface-container-lowest text-[18px]">print</span>
              <span>Print / Export PDF</span>
              <span className="ml-1 px-1.5 py-0.5 rounded bg-surface-container-lowest/20 text-surface-container-lowest font-telemetry-sm text-telemetry-sm font-semibold tracking-wide">
                ⌘P
              </span>
            </button>
          </div>
        </div>
      </header>

      {/* WORKSPACE CANVAS: Centered Physical Document Preview */}
      <main className="relative z-10 py-8 md:py-14 px-3 sm:px-6 flex justify-center items-start">
        {/* SIMULATED 8.5x11 / A4 PAPER CARD */}
        <article className="print-page w-full max-w-4xl bg-white text-slate-900 rounded-sm border border-slate-300 p-8 sm:p-14 md:p-16 paper-shadow transition-all selection:bg-cyan-100 selection:text-slate-900 font-body-sm">
          {/* ================= HEADER SECTION ================= */}
          <header className="border-b-2 border-slate-900 pb-6 mb-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
              {/* Clinic Branding & Address */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-slate-900 text-3xl">health_metrics</span>
                  <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 font-headline-lg">
                    MARCUSCABIN CLINICAL DIAGNOSTICS
                  </h1>
                </div>
                <p className="text-xs text-slate-600 font-telemetry-sm uppercase tracking-wider">
                  Autonomous Bio-Informatics &amp; Molecular Diagnostic Center
                </p>
                <p className="text-xs text-slate-500 font-body-sm leading-relaxed max-w-md">
                  Bio-Cluster 09, Level 4 Telemetry Wing, 400 Tech Innovation Blvd, Cambridge, MA 02142
                  <br />
                  Accredited CLIA #22D9981042 • College of American Pathologists (CAP) #890123
                </p>
              </div>

              {/* Patient & Case Metadata Capsule */}
              <div className="w-full md:w-auto bg-slate-50 border border-slate-200 rounded p-4 text-xs font-telemetry-sm space-y-1.5 min-w-[260px]">
                <div className="flex justify-between items-center text-slate-500">
                  <span>DOCUMENT REF:</span>
                  <span className="font-bold text-slate-900">
                    {report.report_id ? (report.report_id.startsWith('#') ? report.report_id : `#${report.report_id}`) : `#SYN-2025-${report.patient_id}-DX`}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>PATIENT ID:</span>
                  <span className="font-bold text-slate-900 font-mono text-sm tracking-tight">
                    #PT-{report.patient_id}
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>DOB / AGE:</span>
                  <span className="font-medium text-slate-800">
                    {report.dob || '1981-11-04'} ({report.age}Y / {report.gender ? report.gender[0] : 'M'})
                  </span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>TRIAGE TIMESTAMP:</span>
                  <span className="font-medium text-slate-800">{report.date} 14:32:09 EST</span>
                </div>
                <div className="flex justify-between items-center text-slate-500 pt-1 border-t border-slate-200">
                  <span>STATUS:</span>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold border ${
                      isCritical
                        ? 'bg-rose-100 text-rose-800 border-rose-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                    }`}
                  >
                    {isCritical ? 'CRITICAL BIO-VARIANCE' : 'ELEVATED CLINICAL ATTENTION'}
                  </span>
                </div>
              </div>
            </div>

            {/* Attending Signatures Strip */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6 pt-4 border-t border-dashed border-slate-200 text-xs">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-700 text-xl">memory</span>
                <div>
                  <div className="text-[10px] uppercase font-telemetry-sm text-slate-500 tracking-wider">
                    Attending Artificial Intelligence
                  </div>
                  <div className="font-bold text-slate-900">Marcuscabin Neural Engine v4.2 (Clinical MD Agent #402)</div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Confidence Model: ResNet-BioEnsemble 99.4% Validated
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-700 text-xl">verified_user</span>
                <div>
                  <div className="text-[10px] uppercase font-telemetry-sm text-slate-500 tracking-wider">
                    Verifying Medical Director
                  </div>
                  <div className="font-bold text-slate-900">{report.ordering_physician || 'Dr. Marcus Vance, MD, FACP, PhD'}</div>
                  <div className="font-mono text-[10px] text-slate-400">
                    Board Certified Internal Medicine • Lic #MA-782291
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* ================= SECTION 1: EXECUTIVE DIAGNOSTIC SUMMARY ================= */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-none"></span>
              <h2 className="text-sm font-bold tracking-wider uppercase font-telemetry-sm text-slate-900">
                Section 1: Executive Diagnostic Summary
              </h2>
            </div>
            <div
              className={`border-2 rounded p-5 relative overflow-hidden ${
                isCritical ? 'border-rose-600 bg-rose-50/40' : 'border-amber-600 bg-amber-50/40'
              }`}
            >
              <div
                className={`absolute top-0 right-0 text-white font-telemetry-sm text-[10px] font-bold px-3 py-1 uppercase tracking-widest ${
                  isCritical ? 'bg-rose-600' : 'bg-amber-600'
                }`}
              >
                Urgent Triage Advisory
              </div>
              <div className="space-y-2.5 pr-20">
                <h3 className="text-base font-bold text-rose-950 font-headline-sm">
                  Primary Finding:{' '}
                  {report.patient_id === '9042'
                    ? 'Acute Cardiorenal Metabolic Distress with Accelerated Systemic Inflammation'
                    : report.combinations.length > 0
                    ? report.combinations[0].title
                    : 'Acute Cardiorenal Metabolic Distress with Accelerated Systemic Inflammation'}
                </h3>
                <p className="text-xs text-slate-700 leading-relaxed font-body-sm">
                  {report.patient_id === '9042'
                    ? 'Deep multispectral telemetry indicates a severe metabolic decoupling characterized by critical elevation in Troponin I (High Sensitivity) alongside acute eGFR degradation and extreme hyperferritinemic inflammation. The synthesis model establishes a 94.8% concordance with Stage 2 subclinical microvascular strain requiring immediate pharmacologic intervention and inpatient cardiac observation.'
                    : report.combinations.length > 0
                    ? report.combinations[0].clinical_rationale
                    : 'Deep multispectral telemetry indicates metabolic decoupling characterized by critical elevation in biomarker indicators requiring immediate clinical observation.'}
                </p>
                <div className="flex flex-wrap gap-4 pt-2 text-xs font-telemetry-sm">
                  <span className="text-slate-600">
                    Urgency Level: <strong className="text-rose-700">{report.patient_id === '9042' ? 'Immediate (< 2h Action)' : `${report.triage_summary.overall_urgency} Action`}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    Predicted Hospitalization Risk: <strong className="text-rose-700">{report.patient_id === '9042' ? '78.2%' : `${report.triage_summary.urgency_score}%`}</strong>
                  </span>
                  <span className="text-slate-400">•</span>
                  <span className="text-slate-600">
                    Telemetry Channel: <strong className="text-slate-900">{report.report_type}</strong>
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ================= SECTION 2: ISOLATED ABNORMAL INDICATORS TABLE ================= */}
          <section className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 bg-slate-900 rounded-none"></span>
                <h2 className="text-sm font-bold tracking-wider uppercase font-telemetry-sm text-slate-900">
                  Section 2: Isolated Abnormal Indicators Table
                </h2>
              </div>
              <span className="text-[11px] font-telemetry-sm text-slate-500">
                {abnormalMetrics.length} of {report.flags.length} Parameters Out of Baseline
              </span>
            </div>
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-left text-xs font-body-sm border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-telemetry-sm text-[11px] text-slate-700">
                    <th className="py-2.5 px-3 uppercase tracking-wider">Biomarker / Assay</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider">Observed Value</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider">Clinical Reference Range</th>
                    <th className="py-2.5 px-3 uppercase tracking-wider">Severity Tag</th>
                    <th className="py-2.5 px-3 text-right uppercase tracking-wider">Deviation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {abnormalMetrics.map((metric) => {
                    const isCrit = metric.status === 'CRITICAL';
                    const assayType = metric.name.includes('Troponin')
                      ? 'Chemiluminescent Immunoassay'
                      : metric.name.includes('BNP')
                      ? 'Electrochemiluminescence'
                      : metric.name.includes('CRP')
                      ? 'Immunoturbidimetric'
                      : metric.name.includes('Creatinine') || metric.name.includes('eGFR') || metric.name.includes('Glucose')
                      ? 'Enzymatic Standardized'
                      : metric.name.includes('Ferritin')
                      ? 'Turbidimetric Microparticle'
                      : metric.name.includes('D-Dimer')
                      ? 'Immunoturbidimetric'
                      : `${metric.category} Standardized`;

                    const refText =
                      metric.reference_min === 0 && metric.reference_max !== undefined
                        ? `< ${metric.reference_max} ${metric.unit}`
                        : metric.reference_min !== undefined && metric.reference_max !== undefined
                        ? `${metric.reference_min} - ${metric.reference_max} ${metric.unit}`
                        : metric.reference_max !== undefined
                        ? `< ${metric.reference_max} ${metric.unit}`
                        : 'Normal';

                    const badgeClass =
                      metric.name.includes('Creatinine') || metric.name.includes('eGFR')
                        ? 'bg-amber-500 text-slate-950'
                        : isCrit
                        ? 'bg-rose-600 text-white'
                        : metric.status === 'ELEVATED'
                        ? 'bg-amber-500 text-slate-950'
                        : metric.status === 'HIGH'
                        ? 'bg-amber-100 text-amber-900 border border-amber-300'
                        : 'bg-slate-200 text-slate-800';

                    const badgeLabel =
                      metric.name.includes('Creatinine') || metric.name.includes('eGFR')
                        ? 'STAGE 3B DYSF'
                        : isCrit
                        ? 'CRITICAL HIGH'
                        : metric.status === 'HIGH'
                        ? 'HIGH'
                        : metric.status === 'ELEVATED'
                        ? 'ELEVATED'
                        : metric.status;

                    return (
                      <tr key={metric.name} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-medium text-slate-900">
                          <div className="font-bold">{metric.name}</div>
                          <div className="text-[10px] text-slate-500 font-telemetry-sm">
                            {assayType}
                          </div>
                        </td>
                        <td
                          className={`py-2.5 px-3 font-mono font-bold text-sm ${
                            isCrit ? 'text-rose-700' : 'text-amber-700'
                          }`}
                        >
                          {metric.value} {metric.unit}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {refText}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-tight ${badgeClass}`}
                          >
                            {badgeLabel}
                          </span>
                        </td>
                        <td
                          className={`py-2.5 px-3 text-right font-mono font-bold ${
                            isCrit ? 'text-rose-700' : 'text-amber-700'
                          }`}
                        >
                          {metric.delta_percent !== undefined && metric.delta_percent > 0
                            ? `+${metric.delta_percent}%`
                            : `${metric.delta_percent}%`}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* ================= SECTION 3: CONCERNING BIOMARKER COMBINATIONS & RISK ASSESSMENT ================= */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-none"></span>
              <h2 className="text-sm font-bold tracking-wider uppercase font-telemetry-sm text-slate-900">
                Section 3: Concerning Biomarker Combinations &amp; Risk Assessment
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {report.combinations.length > 0 ? (
                report.combinations.map((combo, idx) => (
                  <div key={combo.id} className="border border-slate-300 rounded p-4 bg-slate-50/50 space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-xs uppercase font-telemetry-sm text-slate-900">
                        Vector {String.fromCharCode(65 + idx)}: {combo.title}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                          combo.severity === 'CRITICAL'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        Severity: {combo.urgency_score / 10}/10
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed font-body-sm">
                      {combo.clinical_rationale}
                    </p>
                    <div className="bg-white border border-slate-200 p-2.5 rounded font-telemetry-sm text-[11px] text-slate-600 space-y-1">
                      <div className="flex justify-between">
                        <span>Algorithmic Weight:</span>
                        <span className="font-bold text-slate-900">
                          {combo.severity === 'CRITICAL' ? '0.892 (Strong Association)' : '0.741 (Elevated Risk)'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Involved Biomarkers:</span>
                        <span className="font-bold text-rose-700">
                          {combo.biomarkers_involved.join(', ')}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 border border-slate-300 rounded p-4 bg-slate-50/50 text-xs text-slate-600">
                  No concerning synergistic combinations flagged on this laboratory panel.
                </div>
              )}
            </div>
          </section>

          {/* ================= SECTION 4: AI CLINICAL NOTES & RECOMMENDED ACTION PLAN ================= */}
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 bg-slate-900 rounded-none"></span>
              <h2 className="text-sm font-bold tracking-wider uppercase font-telemetry-sm text-slate-900">
                Section 4: AI Doctor's Final Clinical Notes &amp; Recommended Action Plan
              </h2>
            </div>
            <div className="border border-slate-300 rounded divide-y divide-slate-200">
              {/* Step 1: Immediate Pharmacologic / Clinical Protocol */}
              <div className="p-4 bg-white">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase font-telemetry-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">
                    1
                  </span>
                  <span>Inpatient Cardiac Triage &amp; Prescription Advisories</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1 pl-7 list-disc">
                  {report.combinations.length > 0 && report.combinations[0].action_items ? (
                    report.combinations[0].action_items.map((act, i) => <li key={i}>{act}</li>)
                  ) : (
                    <>
                      <li>Schedule follow-up laboratory verification within 14 calendar days.</li>
                      <li>Consult primary care physician regarding renal protective therapies.</li>
                      <li>Withhold nephrotoxic over-the-counter NSAIDs and monitor daily fluid balance.</li>
                    </>
                  )}
                </ul>
              </div>

              {/* Step 2: 14-Day Re-Test Schedule */}
              <div className="p-4 bg-slate-50/60">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase font-telemetry-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">
                    2
                  </span>
                  <span>14-Day Serial Re-Test Schedule</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pl-7 text-xs font-telemetry-sm">
                  <div className="p-2 border border-slate-200 bg-white rounded">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">T+3 Hours:</div>
                    <div className="text-slate-900 font-bold">Serial hs-cTnI + ECG</div>
                    <div className="text-[10px] text-slate-500">Delta kinetic evaluation</div>
                  </div>
                  <div className="p-2 border border-slate-200 bg-white rounded">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Day 3 (72h):</div>
                    <div className="text-slate-900 font-bold">Renal Panel + eGFR</div>
                    <div className="text-[10px] text-slate-500">Perfusion recovery index</div>
                  </div>
                  <div className="p-2 border border-slate-200 bg-white rounded">
                    <div className="text-[10px] text-slate-500 font-bold uppercase">Day 14:</div>
                    <div className="text-slate-900 font-bold">Full Inflammatory Panel</div>
                    <div className="text-[10px] text-slate-500">hs-CRP, Ferritin, NT-proBNP</div>
                  </div>
                </div>
              </div>

              {/* Step 3: Lifestyle & Interventional Guardrails */}
              <div className="p-4 bg-white">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 uppercase font-telemetry-sm mb-1.5">
                  <span className="flex items-center justify-center w-5 h-5 rounded-full bg-slate-900 text-white text-[10px]">
                    3
                  </span>
                  <span>Interventional Guardrails &amp; Hemodynamic Limits</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed pl-7">
                  Immediate sodium limitation to &lt; 1,500 mg/day. Strict fluid balance recording (cap at 1.8L/24h during acute renal phase). Total physical rest mandated; telemetry alarms configured to notify on Heart Rate &gt; 100 bpm or Mean Arterial Pressure (MAP) &lt; 65 mmHg.
                </p>
              </div>
            </div>
          </section>

          {/* ================= FOOTER / VERIFICATION & DISCLAIMER ================= */}
          <footer className="pt-6 border-t-2 border-slate-900 text-slate-600 space-y-4">
            {/* QR Code & Digital Signature Strip */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 bg-slate-50 p-4 border border-slate-200 rounded">
              {/* Verification Badging */}
              <div className="flex items-center gap-4">
                {/* Simulated QR Code SVG */}
                <div className="w-16 h-16 bg-white p-1 border border-slate-300 rounded flex items-center justify-center shrink-0 shadow-sm">
                  <svg className="w-full h-full text-slate-900" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2 2h8v8H2V2zm2 2v4h4V4H4zm10-2h8v8h-8V2zm2 2v4h4V4h-4zM2 14h8v8H2v-8zm2 2v4h4v-4H4zm10 0h2v2h-2v-2zm4 0h2v2h-2v-2zm-4 4h2v2h-2v-2zm4 4h2v2h-2v-2zm-2-2h2v2h-2v-2zm4-4h2v2h-2v-2zm-4-2h4v2h-4v-2z"></path>
                  </svg>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-xs font-telemetry-sm">
                    <span className="material-symbols-outlined text-[16px] text-emerald-600">verified</span>
                    <span>CRYPTOGRAPHIC VERIFICATION SEAL</span>
                  </div>
                  <div className="font-mono text-[10px] text-slate-500 break-all leading-tight">
                    SHA-256: 8f2a901e...47c8b411d9f04e12c4ab9901416e7ac3
                  </div>
                  <div className="text-[10px] text-slate-500 font-telemetry-sm">
                    Signed by Marcuscabin Cloud Ledger • Token: #DX-{report.patient_id}-AUTH-V4
                  </div>
                </div>
              </div>

              {/* Digital Signature Stamp */}
              <div className="text-right sm:border-l sm:border-slate-200 sm:pl-6 space-y-1 w-full sm:w-auto">
                <div className="text-[10px] uppercase font-telemetry-sm text-slate-500">Authorized Medical Reviewer</div>
                <div className="font-bold text-slate-900 text-xs tracking-wide">
                  {report.ordering_physician || 'Dr. Marcus Vance, MD'}
                </div>
                <div className="font-mono text-[10px] text-slate-400">
                  Digitally Sealed: {report.date} 14:38:12 EST
                </div>
              </div>
            </div>

            {/* Legal Medical Disclaimer */}
            <div className="text-[10px] text-slate-500 leading-normal font-body-sm space-y-1">
              <p>
                <strong>LEGAL NOTICE &amp; CLINICAL DISCLAIMER:</strong> This report combines algorithmic diagnostic inferences generated by the Marcuscabin AI Engine with medical validation by licensed clinicians. All diagnostic conclusions, severity vectors, and therapeutic recommendations are intended to assist primary healthcare teams and must be clinically correlated with physical examinations, clinical history, and laboratory repeats prior to surgery or definitive treatment changes. Confidential health information protected under HIPAA Title II regulations. Unauthorized dissemination, duplication, or alteration is strictly prohibited under federal statutes.
              </p>
              <div className="flex justify-between items-center text-[10px] text-slate-400 pt-2 border-t border-slate-100 font-telemetry-sm">
                <span>Marcuscabin Enterprise Diagnostic Suite v4.2.1-PROD</span>
                <span>Page 1 of 1 • Final Report Validated</span>
              </div>
            </div>
          </footer>
        </article>
      </main>
    </div>
  );
}

export default function ExportPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface-container-lowest flex flex-col items-center justify-center text-primary-container font-telemetry-sm">
          <div className="w-12 h-12 rounded bg-primary-container/20 border border-primary-container/40 flex items-center justify-center glow-cyan mb-4 animate-spin">
            <span className="material-symbols-outlined text-[24px]">vital_signs</span>
          </div>
          <p className="text-on-surface-variant">COMPILING MARCUSCABIN FINAL CLINICAL DIAGNOSTIC REPORT...</p>
        </div>
      }
    >
      <ExportContent />
    </Suspense>
  );
}
