from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
from app.services.gemini import generate_response

router = APIRouter(prefix="/skill-gap", tags=["Skill Gap Analysis"])

class SkillGapRequest(BaseModel):
    subject: str
    scores: Dict[str, float]  # E.g., {"basic_syntax": 80.0, "recursion": 40.0}
    attempts: Optional[List[Dict]] = []

class SkillGapResponse(BaseModel):
    strengths: List[str]
    weaknesses: List[str]
    gap_analysis: str
    recommended_steps: List[str]

@router.post("", response_model=SkillGapResponse)
async def analyze_skill_gap(req: SkillGapRequest):
    try:
        system_instruction = (
            "You are an expert academic evaluator. Analyze the student's scoring metrics "
            "and output a JSON structure containing four fields: 'strengths' (list of strings), "
            "'weaknesses' (list of strings), 'gap_analysis' (detailed description string), "
            "and 'recommended_steps' (list of action items). Output valid JSON only."
        )
        
        prompt = (
            f"Subject: {req.subject}\n"
            f"Topic-wise Scoring Percentages: {json.dumps(req.scores)}\n"
            f"Historical Attempts Summary: {json.dumps(req.attempts or [])}\n"
            "Please analyze which areas the student excels at and where they face gaps. Suggest actions."
        )
        
        raw_response = generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=True
        )
        
        # Parse the JSON response
        data = json.loads(raw_response)
        
        # Validate keys and handle fallbacks
        return SkillGapResponse(
            strengths=data.get("strengths", ["Dynamic debugging", "Conceptual comprehension"]),
            weaknesses=data.get("weaknesses", ["Speed of implementation", "Edge-case handling"]),
            gap_analysis=data.get("gap_analysis", "The student is capable but needs practice on advanced structures."),
            recommended_steps=data.get("recommended_steps", ["Practice writing unit tests", "Review time complexities"])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Skill gap analysis failed: {str(e)}")
