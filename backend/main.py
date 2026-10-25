"""
Marcuscabin - FastAPI Application Gateway.
ORCA CODER Hackathon (Track 02: Healthcare & MedTech)
"""

import os
import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

# Load environment variables from backend/.env
try:
    from dotenv import load_dotenv
    load_dotenv(backend_dir / ".env")
except ImportError:
    pass  # python-dotenv not installed; rely on system env vars

from typing import List, Dict, Any, Optional
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

try:
    from reference_ranges import REFERENCE_RANGES, COMBINATION_RULES
    from mock_data import MOCK_PATIENTS
    from services.analyzer import analyze_report_payload
    from services.llm_service import handle_doctor_chat
except ImportError:
    from backend.reference_ranges import REFERENCE_RANGES, COMBINATION_RULES
    from backend.mock_data import MOCK_PATIENTS
    from backend.services.analyzer import analyze_report_payload
    from backend.services.llm_service import handle_doctor_chat

app = FastAPI(
    title="Marcuscabin Medical Report Analyzer API",
    description="Intelligent anomaly detection, multi-marker combination reasoning, and virtual doctor consultation API.",
    version="1.0.0"
)

# Enable CORS for frontend Next.js client
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
        "http://127.0.0.1:3001",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic Schemas
class MetricItem(BaseModel):
    name: str
    value: float
    unit: Optional[str] = ""
    history: Optional[List[float]] = []

class AnalyzeRequest(BaseModel):
    patient_id: Optional[str] = "12345"
    name: Optional[str] = "Marcus Vance"
    report_type: Optional[str] = "Comprehensive Metabolic Panel"
    date: Optional[str] = "2026-10-25"
    metrics: List[MetricItem]

class ChatMessage(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    patient_name: Optional[str] = "Marcus Vance"
    user_message: str
    chat_history: Optional[List[ChatMessage]] = []
    report_context: Optional[Dict[str, Any]] = {}
    questions_remaining: Optional[int] = 3
    is_final_turn: Optional[bool] = False

# Routes
@app.get("/api/health")
def health_check():
    return {
        "status": "healthy",
        "service": "Marcuscabin API",
        "version": "1.0.0",
        "reference_ranges_loaded": len(REFERENCE_RANGES),
        "combination_rules_loaded": len(COMBINATION_RULES)
    }

from services.supabase_service import fetch_all_reports, fetch_patient_report

@app.get("/api/reports")
async def list_reports():
    """
    Returns list of all patient reports with summarized triage directly from Supabase.
    """
    supabase_data = await fetch_all_reports()
    if supabase_data:
        return supabase_data

    # Fallback if Supabase is offline
    summarized = []
    for p in MOCK_PATIENTS:
        analyzed = analyze_report_payload(p)
        summarized.append({
            "patient_id": p["patient_id"],
            "name": p["name"],
            "age": p["age"],
            "gender": p["gender"],
            "report_id": p["report_id"],
            "report_type": p["report_type"],
            "date": p["date"],
            "avatar_url": p.get("avatar_url", ""),
            "triage_summary": analyzed["triage_summary"],
            "combinations_count": len(analyzed["combinations"]),
            "top_combination": analyzed["combinations"][0]["title"] if analyzed["combinations"] else "None Detected"
        })
    return summarized

@app.get("/api/reports/{patient_id}")
async def get_report(patient_id: str):
    """
    Returns full patient report with complete biomarker analysis and combination flags from Supabase.
    """
    supabase_report = await fetch_patient_report(patient_id)
    if supabase_report:
        return supabase_report

    # Fallback if Supabase is offline
    patient = next((p for p in MOCK_PATIENTS if p["patient_id"] == patient_id), None)
    if not patient:
        if MOCK_PATIENTS:
            patient = MOCK_PATIENTS[0]
        else:
            raise HTTPException(status_code=404, detail=f"Patient report '{patient_id}' not found.")

    analyzed = analyze_report_payload(patient)
    return {
        **patient,
        **analyzed
    }

@app.post("/api/analyze")
def analyze_metrics(payload: AnalyzeRequest):
    """
    Accepts arbitrary or updated patient vitals/labs and returns real-time triage.
    """
    dict_payload = payload.model_dump()
    result = analyze_report_payload(dict_payload)
    return result

@app.post("/api/chat")
async def chat_with_doctor(payload: ChatRequest):
    """
    Doctor's Cabin dialogue endpoint. Enforces 3-question counter and provides spoken text.
    """
    history_dicts = [{"role": m.role, "content": m.content} for m in (payload.chat_history or [])]
    result = await handle_doctor_chat(
        patient_name=payload.patient_name or "Patient",
        user_message=payload.user_message,
        chat_history=history_dicts,
        report_context=payload.report_context or {},
        questions_remaining=payload.questions_remaining if payload.questions_remaining is not None else 3,
        is_final_turn=bool(payload.is_final_turn)
    )
    return result

@app.get("/api/reference-ranges")
def get_reference_ranges():
    """
    Returns the baseline clinical reference intervals.
    """
    return {
        "reference_ranges": REFERENCE_RANGES,
        "combination_rules": COMBINATION_RULES
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
