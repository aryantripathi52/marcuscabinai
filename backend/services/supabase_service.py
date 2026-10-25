"""
Supabase Data Access Layer for Marcuscabin.
Interacts with live cloud Supabase database for patients, lab reports, biomarkers, and consultation audit logs.
"""

import os
from typing import List, Dict, Any, Optional
import httpx
from pathlib import Path
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json"
}

def is_supabase_configured() -> bool:
    return bool(SUPABASE_URL and SUPABASE_KEY and "your-project" not in SUPABASE_URL)

async def fetch_all_reports() -> Optional[List[Dict[str, Any]]]:
    """
    Fetches all patients and their latest lab reports directly from Supabase.
    """
    if not is_supabase_configured():
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # Query patients joined with their medical_reports
            res_patients = await client.get(
                f"{SUPABASE_URL}/rest/v1/patients?select=id,full_name,age,gender,status",
                headers=HEADERS
            )
            if res_patients.status_code != 200:
                print(f"[Supabase] Error fetching patients: {res_patients.status_code}")
                return None

            patients_list = res_patients.json()

            res_reports = await client.get(
                f"{SUPABASE_URL}/rest/v1/medical_reports?select=id,patient_id,panel_name,collection_date,overall_risk,total_biomarkers,flagged_biomarkers",
                headers=HEADERS
            )
            reports_map = {}
            if res_reports.status_code == 200:
                for r in res_reports.json():
                    reports_map[r["patient_id"]] = r

            res_combos = await client.get(
                f"{SUPABASE_URL}/rest/v1/biomarker_combinations?select=patient_id,name,severity",
                headers=HEADERS
            )
            combos_map = {}
            if res_combos.status_code == 200:
                for c in res_combos.json():
                    combos_map.setdefault(c["patient_id"], []).append(c)

            results = []
            for p in patients_list:
                pid = p["id"]
                rep = reports_map.get(pid, {})
                combos = combos_map.get(pid, [])
                top_combo = combos[0]["name"] if combos else "None Detected"

                results.append({
                    "patient_id": pid,
                    "name": p["full_name"],
                    "age": p["age"],
                    "gender": p["gender"],
                    "report_id": rep.get("id", f"REP-{pid}"),
                    "report_type": rep.get("panel_name", "Clinical Biomarker Array"),
                    "date": rep.get("collection_date", "2026-10-25").split("T")[0],
                    "avatar_url": f"https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
                    "triage_summary": {
                        "overall_urgency": rep.get("overall_risk", "MODERATE"),
                        "total_metrics": rep.get("total_biomarkers", 7),
                        "flagged_count": rep.get("flagged_biomarkers", 2)
                    },
                    "combinations_count": len(combos),
                    "top_combination": top_combo
                })

            return results
    except Exception as e:
        print(f"[Supabase] fetch_all_reports exception: {e}")
        return None

async def fetch_patient_report(patient_id: str) -> Optional[Dict[str, Any]]:
    """
    Fetches full clinical telemetry for a patient including all biomarkers and combinations from Supabase.
    """
    if not is_supabase_configured():
        return None

    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            # 1. Fetch patient
            res_patient = await client.get(
                f"{SUPABASE_URL}/rest/v1/patients?id=eq.{patient_id}&select=*",
                headers=HEADERS
            )
            if res_patient.status_code != 200 or not res_patient.json():
                return None
            patient_data = res_patient.json()[0]

            # 2. Fetch medical report
            res_report = await client.get(
                f"{SUPABASE_URL}/rest/v1/medical_reports?patient_id=eq.{patient_id}&select=*&order=collection_date.desc&limit=1",
                headers=HEADERS
            )
            report_data = res_report.json()[0] if (res_report.status_code == 200 and res_report.json()) else {}
            report_id = report_data.get("id")

            # 3. Fetch biomarkers
            biomarkers = []
            if report_id:
                res_bio = await client.get(
                    f"{SUPABASE_URL}/rest/v1/biomarkers?report_id=eq.{report_id}&select=*&order=name.asc",
                    headers=HEADERS
                )
                if res_bio.status_code == 200:
                    biomarkers = res_bio.json()

            # 4. Fetch biomarker combinations
            combinations = []
            if report_id:
                res_combos = await client.get(
                    f"{SUPABASE_URL}/rest/v1/biomarker_combinations?report_id=eq.{report_id}&select=*",
                    headers=HEADERS
                )
                if res_combos.status_code == 200:
                    for c in res_combos.json():
                        combinations.append({
                            "id": c.get("rule_id", ""),
                            "title": c.get("name", ""),
                            "severity": c.get("severity", "HIGH"),
                            "involved_metrics": c.get("flagged_metrics", []),
                            "clinical_rationale": c.get("clinical_rationale", ""),
                            "patient_explanation": c.get("clinical_rationale", ""),
                            "actions": c.get("recommendations", [])
                        })

            # Format flags to match frontend expectations
            flags = []
            critical_count = 0
            elevated_count = 0
            optimal_count = 0

            for b in biomarkers:
                st = b.get("status", "NORMAL")
                if st == "CRITICAL":
                    critical_count += 1
                elif st in ("ELEVATED", "HIGH", "LOW"):
                    elevated_count += 1
                else:
                    optimal_count += 1

                flags.append({
                    "name": b.get("name"),
                    "value": float(b.get("value", 0)),
                    "unit": b.get("unit", ""),
                    "status": "OPTIMAL" if st == "NORMAL" else st,
                    "ref_min": float(b["ref_min"]) if b.get("ref_min") is not None else None,
                    "ref_max": float(b["ref_max"]) if b.get("ref_max") is not None else None,
                    "min": float(b["ref_min"]) if b.get("ref_min") is not None else None,
                    "max": float(b["ref_max"]) if b.get("ref_max") is not None else None,
                    "category": b.get("category", "General"),
                    "delta": float(b.get("delta_percentage", 0.0)),
                    "history": b.get("history") or [float(b.get("value", 0))] * 5
                })

            top_combo_name = combinations[0]["title"] if combinations else "None Detected"
            first_name = patient_data["full_name"].split()[0]
            if combinations:
                speech_intro = (
                    f"Hello {first_name}. I have reviewed your clinical telemetry directly from your medical record. "
                    f"While some parameters remain stable, our diagnostic AI has flagged a key pattern: {top_combo_name}. "
                    f"You have 3 questions to consult with me on these findings. What is on your mind?"
                )
            else:
                speech_intro = (
                    f"Hello {first_name}. Your latest biomarker array from your medical chart has been processed. "
                    f"You have 3 consultation questions available before your final report is generated."
                )

            return {
                "patient_id": patient_data["id"],
                "name": patient_data["full_name"],
                "age": patient_data["age"],
                "gender": patient_data["gender"],
                "blood_type": patient_data.get("blood_type", "O+"),
                "mrn": patient_data.get("mrn", f"MRN-{patient_data['id']}-DX"),
                "report_id": report_id or f"REP-{patient_data['id']}",
                "report_type": report_data.get("panel_name", "Comprehensive Molecular & Metabolic Array"),
                "date": report_data.get("collection_date", "2026-10-25").split("T")[0],
                "ordering_physician": report_data.get("verified_by", "Dr. Marcus Vance, M.D."),
                "facility": report_data.get("facility", "Synapse Clinical Lab #04"),
                "clinical_notes": report_data.get("summary_notes", ""),
                "metrics": flags,
                "flags": flags,
                "combinations": combinations,
                "triage_summary": {
                    "total_metrics": len(flags),
                    "critical_count": critical_count,
                    "elevated_count": elevated_count,
                    "optimal_count": optimal_count,
                    "overall_urgency": report_data.get("overall_risk", "MODERATE"),
                    "urgency_score": 85 if critical_count > 0 else (65 if elevated_count > 0 else 20)
                },
                "speech_intro": speech_intro
            }
    except Exception as e:
        print(f"[Supabase] fetch_patient_report exception: {e}")
        return None
