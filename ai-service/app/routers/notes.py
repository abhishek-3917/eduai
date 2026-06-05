from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List
import json
from app.services.gemini import generate_response

router = APIRouter(prefix="/notes-summary", tags=["AI Notes & Flashcards"])

class NotesRequest(BaseModel):
    text: str

class Flashcard(BaseModel):
    question: str
    answer: str

class NotesResponse(BaseModel):
    summary: str
    key_points: List[str]
    flashcards: List[Flashcard]

@router.post("", response_model=NotesResponse)
async def summarize_notes(req: NotesRequest):
    try:
        # Check empty text
        if not req.text.strip():
            return NotesResponse(
                summary="No text was provided in the document.",
                key_points=[],
                flashcards=[]
            )

        system_instruction = (
            "You are a study assistant. Analyze the provided textbook/lecture text. "
            "Generate a JSON object containing three fields: 'summary' (a concise paragraphs summarizing the text), "
            "'key_points' (a list of 3-5 key takeaways), and 'flashcards' (a list of question-and-answer objects). "
            "Ensure the output conforms exactly to this JSON schema."
        )
        
        # Limit text length to prevent LLM overflow in standard testing
        truncated_text = req.text[:8000]
        
        prompt = (
            f"Please summarize and generate flashcards for the following text:\n\n"
            f"{truncated_text}"
        )
        
        raw_response = generate_response(
            prompt=prompt,
            system_instruction=system_instruction,
            json_mode=True
        )
        
        data = json.loads(raw_response)
        
        flashcards_list = []
        for fc in data.get("flashcards", []):
            flashcards_list.append(Flashcard(
                question=fc.get("question", "Define concept"),
                answer=fc.get("answer", "Definition details")
            ))
            
        return NotesResponse(
            summary=data.get("summary", "Summary of uploaded content."),
            key_points=data.get("key_points", ["Key point 1", "Key point 2"]),
            flashcards=flashcards_list
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Notes summarization failed: {str(e)}")
