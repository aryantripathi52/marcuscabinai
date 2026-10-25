"""
Seeds live Supabase instance with complete clinical records for all patients.
Run this once to migrate all synthetic test patients directly into your cloud Supabase database.
"""

import os
import sys
import json
import httpx
from pathlib import Path
from dotenv import load_dotenv

# Load env from backend/.env
backend_root = Path(__file__).resolve().parent.parent
load_dotenv(backend_root / ".env")

if str(backend_root) not in sys.path:
    sys.path.insert(0, str(backend_root))

SUPABASE_URL = os.getenv("SUPABASE_URL", "").rstrip("/")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "") or os.getenv("SUPABASE_ANON_KEY", "")

if not SUPABASE_URL or not SUPABASE_KEY:
    print("[Seed] Error: SUPABASE_URL or key missing from .env")
    exit(1)

HEADERS = {
    "apikey": SUPABASE_KEY,
    "Authorization": f"Bearer {SUPABASE_KEY}",
    "Content-Type": "application/json",
    "Prefer": "return=representation"
}

from mock_data import MOCK_PATIENTS
from reference_ranges import REFERENCE_RANGES, COMBINATION_RULES
from services.analyzer import analyze_report_payload

def seed():
    print(f"[Seed] Connecting to Supabase: {SUPABASE_URL}")
    with httpx.Client(timeout=30.0) as client:
        res = client.get(f"{SUPABASE_URL}/rest/v1/patients?select=id", headers=HEADERS)
        if res.status_code != 200:
            print(f"[Seed] Failed to query patients: {res.status_code} - {res.text}")
            return
        
        existing = res.json()
        print(f"[Seed] Found {len(existing)} existing patients in Supabase.")

        for p in MOCK_PATIENTS:
            patient_id = p["patient_id"]
            analyzed = analyze_report_payload(p)
            triage = analyzed["triage_summary"]

            # 1. Upsert Patient
            patient_payload = {
                "id": patient_id,
                "mrn": f"MRN-{patient_id}-DX",
                "full_name": p["name"],
                "age": p["age"],
                "gender": p["gender"],
                "blood_type": "O+" if "Marcus" in p["name"] else "A+",
                "phone": "+1 (555) 382-9042",
                "email": f"{patient_id}@synapse-dx.internal",
                "emergency_contact": {"relationship": "Spouse", "contact": "+1 (555) 019-2831"},
                "clinical_history": [p.get("clinical_notes", "Routine checkup")],
                "status": "ACTIVE"
            }
            res_patient = client.post(
                f"{SUPABASE_URL}/rest/v1/patients",
                headers={**HEADERS, "Prefer": "resolution=merge-duplicates,return=representation"},
                json=patient_payload
            )
            print(f"  [+] Patient {patient_id} ({p['name']}): HTTP {res_patient.status_code}")

            # 2. Upsert Medical Report
            report_payload = {
                "patient_id": patient_id,
                "panel_name": p["report_type"],
                "collection_date": f"{p['date']}T08:00:00Z",
                "verified_by": p.get("ordering_physician", "Dr. Marcus Vance, M.D."),
                "facility": p.get("facility", "Synapse Clinical Lab #04"),
                "status": "COMPLETED",
                "overall_risk": triage.get("overall_urgency", "MODERATE"),
                "total_biomarkers": triage.get("total_metrics", len(analyzed["flags"])),
                "flagged_biomarkers": triage.get("critical_count", 0) + triage.get("elevated_count", 0),
                "summary_notes": p.get("clinical_notes", "")
            }
            
            res_rep_check = client.get(
                f"{SUPABASE_URL}/rest/v1/medical_reports?patient_id=eq.{patient_id}&select=id",
                headers=HEADERS
            )
            rep_data = res_rep_check.json() if res_rep_check.status_code == 200 else []
            
            if rep_data:
                report_id = rep_data[0]["id"]
                client.patch(
                    f"{SUPABASE_URL}/rest/v1/medical_reports?id=eq.{report_id}",
                    headers=HEADERS,
                    json=report_payload
                )
            else:
                res_report = client.post(
                    f"{SUPABASE_URL}/rest/v1/medical_reports",
                    headers=HEADERS,
                    json=report_payload
                )
                if res_report.status_code in [200, 201]:
                    report_id = res_report.json()[0]["id"]
                else:
                    print(f"  [-] Failed to create report: {res_report.text}")
                    continue

            # 3. Clear & Insert Biomarkers
            client.delete(f"{SUPABASE_URL}/rest/v1/biomarkers?report_id=eq.{report_id}", headers=HEADERS)
            biomarkers_batch = []
            for m in analyzed["flags"]:
                biomarkers_batch.append({
                    "report_id": report_id,
                    "patient_id": patient_id,
                    "name": m["name"],
                    "category": m.get("category", "General"),
                    "value": float(m["value"]),
                    "unit": m.get("unit", ""),
                    "ref_min": float(m["ref_min"]) if m.get("ref_min") is not None else None,
                    "ref_max": float(m["ref_max"]) if m.get("ref_max") is not None else None,
                    "status": m.get("status", "NORMAL"),
                    "is_flagged": m.get("status") in ("CRITICAL", "ELEVATED", "LOW"),
                    "delta_percentage": float(m.get("delta", 0.0)),
                    "history": m.get("history", [])
                })

            if biomarkers_batch:
                res_bio = client.post(
                    f"{SUPABASE_URL}/rest/v1/biomarkers",
                    headers=HEADERS,
                    json=biomarkers_batch
                )
                print(f"    --> Biomarkers ({len(biomarkers_batch)} items): HTTP {res_bio.status_code}")

            # 4. Clear & Insert Combinations
            client.delete(f"{SUPABASE_URL}/rest/v1/biomarker_combinations?report_id=eq.{report_id}", headers=HEADERS)
            combos_batch = []
            for c in analyzed["combinations"]:
                combos_batch.append({
                    "report_id": report_id,
                    "patient_id": patient_id,
                    "rule_id": c.get("id", "rule_combo"),
                    "name": c.get("title", "Clinical Anomaly"),
                    "severity": c.get("severity", "HIGH"),
                    "flagged_metrics": c.get("involved_metrics", []),
                    "clinical_rationale": c.get("clinical_rationale", ""),
                    "recommendations": c.get("actions", [])
                })

            if combos_batch:
                res_combo = client.post(
                    f"{SUPABASE_URL}/rest/v1/biomarker_combinations",
                    headers=HEADERS,
                    json=combos_batch
                )
                print(f"    --> Combinations ({len(combos_batch)} detected): HTTP {res_combo.status_code}")

    print("\n[Seed] SUCCESS! All patient records are now stored live in Supabase.")

if __name__ == "__main__":
    seed()
