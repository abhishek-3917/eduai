from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
from app.services.gemini import generate_response

router = APIRouter(prefix="/roadmap", tags=["Learning Roadmap"])

class RoadmapRequest(BaseModel):
    career_goal: str
    current_skills: List[str]

class RoadmapPhase(BaseModel):
    phase: str
    topics: List[str]
    resources: List[str]

class RoadmapResponse(BaseModel):
    career_goal: str
    roadmap: List[RoadmapPhase]

@router.post("", response_model=RoadmapResponse)
async def generate_roadmap(req: RoadmapRequest):
    try:
        system_instruction = (
            "You are a Senior Technical Curriculum Director. Based on the career goal "
            "and current skills, design a structured learning path broken down into monthly phases. "
            "Output strictly in JSON format as an object containing: 'career_goal' (string) and "
            "'roadmap' which is a list of phases. Each phase object must have: 'phase' (string, e.g. 'Month 1: ...'), "
            "'topics' (list of strings), and 'resources' (list of strings with suggested tutorial names or websites)."
        )
        
        prompt = (
            f"Career Goal: {req.career_goal}\n"
            f"Current Skills: {', '.join(req.current_skills)}\n"
            "Build a customized 3-month roadmap. Skip topics the student already knows, or focus on advanced aspects."
        )
        
        raw_response = generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=True
        )
        
        data = json.loads(raw_response)
        
        # Format validation
        roadmap_list = []
        for phase in data.get("roadmap", []):
            roadmap_list.append(RoadmapPhase(
                phase=phase.get("phase", "Next Steps"),
                topics=phase.get("topics", []),
                resources=phase.get("resources", [])
            ))
            
        return RoadmapResponse(
            career_goal=data.get("career_goal", req.career_goal),
            roadmap=roadmap_list
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Roadmap generation failed: {str(e)}")
