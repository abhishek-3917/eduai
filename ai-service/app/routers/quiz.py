from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
from app.services.gemini import generate_response

router = APIRouter(prefix="/quiz-generator", tags=["Quiz Generator"])

class QuizRequest(BaseModel):
    subject: str
    difficulty: str # 'Easy', 'Medium', 'Hard'

class QuestionItem(BaseModel):
    question: str
    options: List[str]
    correct_answer: str
    explanation: str

@router.post("", response_model=List[QuestionItem])
async def generate_quiz(req: QuizRequest):
    try:
        system_instruction = (
            "You are a Computer Science Professor. Generate a quiz consisting of exactly 5 multiple choice questions. "
            "Output strictly in JSON format as a list of question objects. "
            "Each question object must have: 'question' (string), 'options' (list of exactly 4 strings starting with A), B), C), D)), "
            "'correct_answer' (string matching the exact correct option text), and 'explanation' (string clarifying why it is correct)."
        )
        
        prompt = (
            f"Subject: {req.subject}\n"
            f"Difficulty Level: {req.difficulty}\n"
            "Create a challenging, high-quality quiz testing deep understanding of the subject."
        )
        
        raw_response = generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=True
        )
        
        data = json.loads(raw_response)
        
        # Format validation
        questions = []
        if isinstance(data, list):
            for item in data:
                questions.append(QuestionItem(
                    question=item.get("question", "Sample Question"),
                    options=item.get("options", ["A) Option A", "B) Option B", "C) Option C", "D) Option D"]),
                    correct_answer=item.get("correct_answer", "A) Option A"),
                    explanation=item.get("explanation", "Reasoning details.")
                ))
        else:
            # Fallback if list structure was not returned
            raise ValueError("AI response did not return a list format.")
            
        return questions
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")
