"""
Marcuscabin - Virtual AI Doctor Dialogue Service.
Enforces the 3-Question Guided Consultation Protocol and generates clinical explainability.
Features intelligent clinical fallback engine + OpenAI gpt-4o-mini + Google Gemini support.
Set OPENAI_API_KEY or GOOGLE_GEMINI_API_KEY in backend/.env to enable real LLM responses.
"""

import os
import json
from pathlib import Path
from typing import List, Dict, Any, Optional

# Load .env from backend directory
try:
    from dotenv import load_dotenv
    load_dotenv(Path(__file__).resolve().parent.parent / ".env")
except ImportError:
    pass  # python-dotenv not installed; rely on system env vars

FINAL_CONCLUDING_PHRASE = "Here is your final report."
MAX_QUESTIONS = int(os.getenv("MAX_CONSULTATION_QUESTIONS", "3"))
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash")

def get_fallback_doctor_response(
    user_query: str,
    patient_name: str,
    questions_remaining: int,
    is_final_turn: bool,
    combinations: List[Dict[str, Any]],
    flagged_metrics: List[Dict[str, Any]]
) -> str:
    """
    Intelligent clinical reasoning fallback engine for the Doctor's Cabin.
    Ensures robust, immediate, realistic doctor responses even without external API keys.
    """
    query_lower = user_query.lower()
    has_nephro = any("nephropathy" in c.get("id", "") or "cardiorenal" in c.get("id", "") for c in combinations)
    has_lipid = any("dyslipidemia" in c.get("id", "") for c in combinations)
    has_liver = any("hepatocellular" in c.get("id", "") for c in combinations)
    has_hyperkalemia = any("hyperkalemia" in c.get("id", "") for c in combinations)

    response_text = ""

    # Check for diet / nutrition queries
    if any(w in query_lower for w in ["eat", "diet", "food", "nutrition", "sugar", "salt"]):
        if has_nephro:
            response_text = (
                "Regarding your diet, protecting both your blood sugar and kidneys is top priority. "
                "I strongly advise adopting a kidney-friendly Mediterranean diet: emphasize low-glycemic vegetables "
                "like cauliflower and cucumbers, moderate your intake of red meat and high-sodium processed foods, "
                "and avoid added sugars or artificial sweeteners that spike glucose."
            )
        elif has_lipid:
            response_text = (
                "For your elevated lipid panel, focus on cutting saturated and trans fats found in fried foods and pastries. "
                "Increase soluble fiber with oats, chia seeds, and legumes, and switch your cooking oils to extra virgin olive or avocado oil. "
                "These dietary adjustments directly lower both triglycerides and circulating LDL particles."
            )
        elif has_liver:
            response_text = (
                "To reduce inflammation in your liver, avoid ultra-processed foods, high-fructose corn syrup, and alcohol completely. "
                "Antioxidant-rich foods such as leafy greens, green tea, and berries support cellular regeneration and liver glycogen regulation."
            )
        else:
            response_text = (
                "Focus on a whole-food diet rich in dietary fiber, clean proteins, and abundant hydration. "
                "Limiting refined carbohydrates and sodium is the best preventative strategy for metabolic balance."
            )

    # Check for medication / doctor follow-up queries
    elif any(w in query_lower for w in ["medication", "pill", "drug", "statin", "prescribe", "insulin"]):
        if has_nephro:
            response_text = (
                "While I cannot prescribe directly in this virtual triage room, medications like SGLT2 inhibitors or ACE inhibitors "
                "are frequently evaluated by physicians because they provide dual benefits: lowering blood glucose and reducing pressure "
                "inside the kidney filtration units. Be sure to discuss these options with your primary physician."
            )
        elif has_lipid:
            response_text = (
                "Given your elevated lipid numbers, your physician will likely calculate your 10-year cardiovascular risk score to determine "
                "if statin therapy is indicated. Statins effectively slow arterial plaque deposition and stabilize the blood vessel lining."
            )
        else:
            response_text = (
                "Any prescription medication must be calibrated by your primary care physician after checking your follow-up labs. "
                "Never stop or modify existing medications without direct clinical supervision."
            )

    # Check for urgency / emergency / danger queries
    elif any(w in query_lower for w in ["danger", "urgent", "emergency", "serious", "die", "worry", "scared"]):
        if has_hyperkalemia:
            response_text = (
                "Because your potassium level is elevated alongside renal strain, this does warrant immediate medical attention. "
                "High potassium can affect your heart's electrical rhythm, so having a stat 12-lead ECG at an urgent care or clinic today is strongly advised."
            )
        elif has_nephro or has_lipid:
            response_text = (
                "While these combined anomalies are significant and require structured medical action, they are manageable when caught early. "
                "The key is not to panic, but rather to follow up proactively with your doctor within the next 7 to 10 days to adjust your care plan."
            )
        else:
            response_text = (
                "Your numbers show areas needing improvement, but nothing indicates an acute life-threatening emergency today. "
                "Proactive lifestyle and clinic follow-up will prevent progression."
            )

    # General / mechanism queries
    elif any(w in query_lower for w in ["why", "how", "what is", "explain", "kidney", "glucose", "liver", "heart"]):
        if has_nephro:
            response_text = (
                "When blood glucose stays elevated, excess sugar molecules bind to proteins in the blood, causing microvascular stiffening. "
                "Your kidneys' glomeruli have to filter under higher pressure, which over time allows creatinine to build up in the bloodstream."
            )
        elif has_lipid:
            response_text = (
                "Your lipid combination indicates that the liver is outputting more triglyceride-rich particles than normal, while your protective HDL "
                "is depleted. This imbalance allows atherogenic plaque to adhere to arterial walls."
            )
        elif has_liver:
            response_text = (
                "Enzymes like ALT and AST normally live inside liver cells. When liver cells experience metabolic stress or fat accumulation, "
                "their membranes become permeable and leak these enzymes into your bloodstream."
            )
        else:
            response_text = (
                "Your lab panels measure how well your metabolic organs—your liver, kidneys, and vascular system—are clearing byproducts and maintaining balance. "
                "Monitoring them regularly helps us catch early trends before symptoms appear."
            )

    # Default fallback
    else:
        response_text = (
            f"Thank you for that question, {patient_name.split()[0]}. Based on your laboratory panel, our primary clinical objective "
            f"is addressing the anomalous biomarkers highlighted in your triage summary. Balancing nutrition, hydration, and regular clinic follow-up "
            f"will provide the greatest clinical benefit."
        )

    # Append question reminder or concluding statement
    if is_final_turn or questions_remaining <= 0:
        response_text += f" We have concluded our consultation session. {FINAL_CONCLUDING_PHRASE}"
    else:
        remaining_str = "1 question remaining" if questions_remaining == 1 else f"{questions_remaining} questions remaining"
        response_text += f" You have {remaining_str}. What would you like to know next?"

    return response_text


async def handle_doctor_chat(
    patient_name: str,
    user_message: str,
    chat_history: List[Dict[str, str]],
    report_context: Dict[str, Any],
    questions_remaining: int,
    is_final_turn: bool
) -> Dict[str, Any]:
    """
    Handles user chat turn with the virtual doctor, strictly enforcing the 3-question counter.
    """
    flags = report_context.get("flags", [])
    combinations = report_context.get("combinations", [])

    # Build a shared system prompt for both LLM providers
    def build_system_prompt() -> str:
        prompt = (
            f"You are Dr. Marcus, an empathetic, highly articulate virtual AI doctor in the Marcuscabin clinical system. "
            f"You are consulting patient {patient_name}. "
            f"Flagged anomalies: {json.dumps([f.get('name') for f in flags if f.get('status') != 'OPTIMAL'])}. "
            f"Flagged Combinations: {json.dumps([c.get('title') for c in combinations])}. "
            f"The consultation is strictly governed. The patient has {questions_remaining} questions left. "
            f"Respond concisely (under 80 words). Speak directly, warmly, and clinically. "
        )
        if is_final_turn or questions_remaining <= 0:
            prompt += (
                f"CRITICAL REQUIREMENT: This is the final turn of the consultation. "
                f"You MUST end your exact response with the exact words: '{FINAL_CONCLUDING_PHRASE}'."
            )
        return prompt

    openai_key = os.getenv("OPENAI_API_KEY", "").strip()
    gemini_key = (os.getenv("GEMINI_API_KEY", "") or os.getenv("GOOGLE_GEMINI_API_KEY", "")).strip()
    reply = ""

    # --- Provider 1: OpenAI (gpt-4o-mini) ---
    if openai_key and not reply:
        try:
            import httpx
            system_prompt = build_system_prompt()
            messages = [{"role": "system", "content": system_prompt}]
            for m in chat_history[-4:]:
                messages.append({"role": m.get("role", "user"), "content": m.get("content", "")})
            messages.append({"role": "user", "content": user_message})

            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    "https://api.openai.com/v1/chat/completions",
                    headers={"Authorization": f"Bearer {openai_key}", "Content-Type": "application/json"},
                    json={
                        "model": OPENAI_MODEL,
                        "messages": messages,
                        "temperature": float(os.getenv("OPENAI_TEMPERATURE", "0.4")),
                        "max_tokens": int(os.getenv("OPENAI_MAX_TOKENS", "150"))
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    reply = data["choices"][0]["message"]["content"].strip()
                    if (is_final_turn or questions_remaining <= 0) and FINAL_CONCLUDING_PHRASE not in reply:
                        reply += f" {FINAL_CONCLUDING_PHRASE}"
        except Exception as e:
            print(f"[LLM] OpenAI error: {e}")
            reply = ""

    # --- Provider 2: Google Gemini ---
    if gemini_key and not reply:
        try:
            import httpx
            system_prompt = build_system_prompt()
            # Combine history into a single user turn for Gemini
            history_text = "\n".join(
                [f"{'Patient' if m.get('role') == 'user' else 'Doctor'}: {m.get('content', '')}"
                 for m in chat_history[-4:]]
            )
            full_user_message = (
                f"[System Instructions]\n{system_prompt}\n\n"
                f"[Conversation History]\n{history_text}\n\n"
                f"[Patient's Current Question]\n{user_message}"
            )

            async with httpx.AsyncClient(timeout=12.0) as client:
                res = await client.post(
                    f"https://generativelanguage.googleapis.com/v1beta/models/{GEMINI_MODEL}:generateContent?key={gemini_key}",
                    headers={"Content-Type": "application/json"},
                    json={
                        "contents": [{"role": "user", "parts": [{"text": full_user_message}]}],
                        "generationConfig": {"maxOutputTokens": 200, "temperature": 0.4}
                    }
                )
                if res.status_code == 200:
                    data = res.json()
                    reply = data["candidates"][0]["content"]["parts"][0]["text"].strip()
                    if (is_final_turn or questions_remaining <= 0) and FINAL_CONCLUDING_PHRASE not in reply:
                        reply += f" {FINAL_CONCLUDING_PHRASE}"
        except Exception as e:
            print(f"[LLM] Gemini error: {e}")
            reply = ""

    # --- Provider 3: Built-in Clinical Reasoning Fallback ---
    if not reply:
        reply = get_fallback_doctor_response(
            user_query=user_message,
            patient_name=patient_name,
            questions_remaining=questions_remaining,
            is_final_turn=is_final_turn,
            combinations=combinations,
            flagged_metrics=flags
        )

    action = "TRIGGER_EXPORT_TRANSITION" if (is_final_turn or questions_remaining <= 0) else "CONTINUE_CONSULTATION"

    return {
        "reply": reply,
        "questions_remaining": max(0, questions_remaining),
        "is_final_turn": is_final_turn or questions_remaining <= 0,
        "concluding_phrase": FINAL_CONCLUDING_PHRASE if (is_final_turn or questions_remaining <= 0) else None,
        "action": action
    }
