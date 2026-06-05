from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
from app.ml.engine import match_career
from app.services.gemini import generate_response

router = APIRouter(prefix="/career-advice", tags=["Career Guidance"])

class CareerRequest(BaseModel):
    skills: List[str]
    interests: List[str]

class CareerAdviceItem(BaseModel):
    career: str
    description: str
    similarity_score: float
    salary_insights: Dict[str, str]
    growth_rate: str
    required_skills: List[str]
    missing_skills: List[str]
    details: str

@router.post("", response_model=List[CareerAdviceItem])
async def career_advice(req: CareerRequest):
    try:
        # 1. Compute cosine similarity matches using ML module
        matches = match_career(req.skills, req.interests)
        
        # 2. Enhance the top match (or all) with Gemini explanations
        results = []
        for i, match in enumerate(matches):
            # To save API cost/time, we only request deep Gemini advice for the top 2 matches
            if i < 2:
                system_instruction = (
                    "You are a career counselor specializing in tech industries. Explain why the user "
                    "is a good match for this role based on their skills and interests, and provide "
                    "3 actionable steps to transition or excel in this career."
                )
                prompt = (
                    f"Recommended Role: {match['career']}\n"
                    f"User Skills: {', '.join(req.skills)}\n"
                    f"User Interests: {', '.join(req.interests)}\n"
                    f"Missing Skills to learn: {', '.join(match['missing_skills'])}\n"
                    "Provide a paragraph of encouragement, explanation, and next steps."
                )
                details = generate_response(prompt, system_instruction, json_mode=False)
            else:
                details = f"Review the required skills ({', '.join(match['required_skills'])}) to begin preparing for this track."
                
            results.append(CareerAdviceItem(
                career=match["career"],
                description=match["description"],
                similarity_score=match["similarity_score"],
                salary_insights=match["salary_insights"],
                growth_rate=match["growth_rate"],
                required_skills=match["required_skills"],
                missing_skills=match["missing_skills"],
                details=details
            ))
            
        return results
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Career evaluation failed: {str(e)}")
