"""
Marcuscabin - Biomarker Analysis and Multi-Marker Combination Engine.
"""

from typing import List, Dict, Any, Tuple
import sys
from pathlib import Path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

try:
    from reference_ranges import REFERENCE_RANGES, COMBINATION_RULES
except ImportError:
    from backend.reference_ranges import REFERENCE_RANGES, COMBINATION_RULES

def evaluate_metric(name: str, value: float, unit: str) -> Dict[str, Any]:
    """
    Evaluates an individual laboratory biomarker against standardized reference ranges.
    """
    ref = REFERENCE_RANGES.get(name)
    if not ref:
        return {
            "name": name,
            "value": value,
            "unit": unit,
            "status": "NORMAL",
            "reference_min": None,
            "reference_max": None,
            "category": "General",
            "delta": 0,
            "explanation": "Within estimated normal physiological baseline."
        }

    ref_min = ref["min"]
    ref_max = ref["max"]
    crit_low = ref.get("critical_low", ref_min * 0.7)
    crit_high = ref.get("critical_high", ref_max * 1.5)
    category = ref.get("category", "General")

    status = "OPTIMAL"
    delta = 0.0
    explanation = "Value falls comfortably within the healthy clinical reference interval."

    if value < crit_low:
        status = "CRITICAL"
        delta = round(((value - ref_min) / ref_min) * 100, 1)
        explanation = ref.get("low_explanation", f"Critically low value below {crit_low} {unit}.")
    elif value > crit_high:
        status = "CRITICAL"
        delta = round(((value - ref_max) / ref_max) * 100, 1)
        explanation = ref.get("high_explanation", f"Critically elevated value exceeding {crit_high} {unit}.")
    elif value < ref_min:
        status = "LOW"
        delta = round(((value - ref_min) / ref_min) * 100, 1)
        explanation = ref.get("low_explanation", f"Below lower baseline limit of {ref_min} {unit}.")
    elif value > ref_max:
        status = "ELEVATED"
        delta = round(((value - ref_max) / ref_max) * 100, 1)
        explanation = ref.get("high_explanation", f"Above upper baseline limit of {ref_max} {unit}.")

    return {
        "name": name,
        "value": value,
        "unit": unit or ref.get("unit", ""),
        "status": status,
        "reference_min": ref_min,
        "reference_max": ref_max,
        "critical_low": crit_low,
        "critical_high": crit_high,
        "category": category,
        "delta_percent": delta,
        "description": ref.get("description", ""),
        "explanation": explanation
    }


def detect_combinations(metrics_map: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Evaluates multi-biomarker combinations across the reported values.
    """
    flagged_combinations = []

    for rule in COMBINATION_RULES:
        # Check standard conditions (AND)
        all_met = True
        matched_metrics = []

        for cond in rule.get("conditions", []):
            m_name = cond["metric"]
            op = cond["op"]
            threshold = cond["threshold"]

            val = metrics_map.get(m_name)
            if val is None:
                all_met = False
                break

            matched = False
            if op == ">=" and val >= threshold:
                matched = True
            elif op == "<=" and val <= threshold:
                matched = True
            elif op == ">" and val > threshold:
                matched = True
            elif op == "<" and val < threshold:
                matched = True

            if matched:
                matched_metrics.append({
                    "name": m_name,
                    "value": val,
                    "threshold": threshold,
                    "operator": op
                })
            else:
                all_met = False
                break

        # Check alternate or_conditions if conditions failed
        if not all_met and "or_conditions" in rule:
            all_or_met = True
            or_matched = []
            for cond in rule["or_conditions"]:
                m_name = cond["metric"]
                op = cond["op"]
                threshold = cond["threshold"]

                val = metrics_map.get(m_name)
                if val is None:
                    all_or_met = False
                    break

                matched = False
                if op == ">=" and val >= threshold:
                    matched = True
                elif op == "<=" and val <= threshold:
                    matched = True
                elif op == ">" and val > threshold:
                    matched = True
                elif op == "<" and val < threshold:
                    matched = True

                if matched:
                    or_matched.append({
                        "name": m_name,
                        "value": val,
                        "threshold": threshold,
                        "operator": op
                    })
                else:
                    all_or_met = False
                    break

            if all_or_met:
                all_met = True
                matched_metrics = or_matched

        if all_met:
            flagged_combinations.append({
                "id": rule["id"],
                "title": rule["title"],
                "severity": rule["severity"],
                "urgency_score": rule.get("urgency_score", 70),
                "biomarkers_involved": [m["name"] for m in matched_metrics],
                "matched_details": matched_metrics,
                "clinical_rationale": rule["clinical_rationale"],
                "patient_explanation": rule["patient_explanation"],
                "action_items": rule["action_items"],
                "suggested_questions": rule.get("suggested_questions", [])
            })

    return flagged_combinations


def analyze_report_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    """
    Main pipeline taking a patient report payload, evaluating biomarkers,
    detecting anomalous combinations, and formatting consultation metadata.
    """
    patient_id = payload.get("patient_id", "unknown")
    patient_name = payload.get("name", "Patient")
    report_type = payload.get("report_type", "Laboratory Report")
    date = payload.get("date", "2026-10-25")
    raw_metrics = payload.get("metrics", [])

    evaluated_flags = []
    metrics_map: Dict[str, float] = {}

    critical_count = 0
    elevated_count = 0
    optimal_count = 0

    for item in raw_metrics:
        name = item.get("name", "")
        val = float(item.get("value", 0))
        unit = item.get("unit", "")
        history = item.get("history", [])

        eval_res = evaluate_metric(name, val, unit)
        eval_res["history"] = history
        evaluated_flags.append(eval_res)

        metrics_map[name] = val

        st = eval_res["status"]
        if st == "CRITICAL":
            critical_count += 1
        elif st in ("ELEVATED", "LOW"):
            elevated_count += 1
        else:
            optimal_count += 1

    # Detect multi-marker combinations
    combinations = detect_combinations(metrics_map)

    # Determine overall urgency
    if critical_count > 0 or any(c["severity"] == "CRITICAL" for c in combinations):
        overall_urgency = "CRITICAL"
        urgency_score = 92
    elif elevated_count > 0 or any(c["severity"] == "HIGH" for c in combinations):
        overall_urgency = "HIGH"
        urgency_score = 75
    elif any(c["severity"] == "MODERATE" for c in combinations):
        overall_urgency = "MODERATE"
        urgency_score = 50
    else:
        overall_urgency = "NORMAL"
        urgency_score = 15

    # Generate speech intro for Virtual Doctor
    if combinations:
        top_combo = combinations[0]
        speech_intro = (
            f"Hello {patient_name.split()[0]}. I have thoroughly analyzed your {report_type}. "
            f"While several baseline metrics are stable, I have flagged a significant pattern: {top_combo['title']}. "
            f"{top_combo['patient_explanation']} "
            f"You have 3 questions to explore these results with me. What would you like to ask first?"
        )
    elif critical_count > 0 or elevated_count > 0:
        abnormal_names = [f["name"] for f in evaluated_flags if f["status"] != "OPTIMAL"]
        speech_intro = (
            f"Hello {patient_name.split()[0]}. Looking over your recent {report_type}, "
            f"I noticed some deviations in {', '.join(abnormal_names[:3])}. "
            f"I am here in the Doctor's Cabin to help you make sense of these findings. "
            f"Feel free to ask your first question."
        )
    else:
        speech_intro = (
            f"Good news, {patient_name.split()[0]}. All tested biomarkers on your {report_type} "
            f"fall comfortably within normal physiological ranges. "
            f"You may ask up to 3 questions about maintaining your health before your consultation completes."
        )

    return {
        "patient_id": patient_id,
        "patient_name": patient_name,
        "report_type": report_type,
        "date": date,
        "triage_summary": {
            "total_metrics": len(evaluated_flags),
            "critical_count": critical_count,
            "elevated_count": elevated_count,
            "optimal_count": optimal_count,
            "overall_urgency": overall_urgency,
            "urgency_score": urgency_score
        },
        "flags": evaluated_flags,
        "combinations": combinations,
        "speech_intro": speech_intro
    }
