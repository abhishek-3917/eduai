from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict
import json
from app.services.gemini import generate_response

router = APIRouter(prefix="/study-plan", tags=["Study Planner"])

class StudyPlanRequest(BaseModel):
    subjects: List[str]
    available_hours: int
    exam_dates: Dict[str, str]  # E.g. {"DSA": "2026-06-15", "OS": "2026-06-20"}

class SessionItem(BaseModel):
    time: str
    subject: str
    goal: str

class DayPlan(BaseModel):
    day: str
    sessions: List[SessionItem]

class StudyPlanResponse(BaseModel):
    weekly_schedule: List[DayPlan]
    daily_goals: List[str]

@router.post("", response_model=StudyPlanResponse)
async def generate_study_plan(req: StudyPlanRequest):
    try:
        system_instruction = (
            "You are an expert academic advisor. Design a weekly study schedule. "
            "Output strictly in JSON format matching the schema: a dictionary containing 'weekly_schedule' "
            "(a list of day objects, each with 'day' and 'sessions' which is a list of objects with 'time', 'subject', 'goal') "
            "and 'daily_goals' (a list of general study tips or daily achievements). "
            "Limit plans to active weekdays (Monday through Friday)."
        )
        
        prompt = (
            f"Subjects to study: {', '.join(req.subjects)}\n"
            f"Weekly Available Study Hours: {req.available_hours} hours\n"
            f"Exam Dates: {json.dumps(req.exam_dates)}\n"
            "Distribute the hours logically, dedicating more time to subjects with closer exam dates."
        )
        
        raw_response = generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=True
        )
        
        data = json.loads(raw_response)
        
        weekly_schedule = []
        for day_data in data.get("weekly_schedule", []):
            sessions = []
            for s in day_data.get("sessions", []):
                sessions.append(SessionItem(
                    time=s.get("time", "09:00 - 10:00"),
                    subject=s.get("subject", req.subjects[0] if req.subjects else "Study"),
                    goal=s.get("goal", "Review notes")
                ))
            weekly_schedule.append(DayPlan(
                day=day_data.get("day", "Monday"),
                sessions=sessions
            ))
            
        return StudyPlanResponse(
            weekly_schedule=weekly_schedule,
            daily_goals=data.get("daily_goals", ["Revise everyday", "Stay hydrated"])
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Study plan generation failed: {str(e)}")
