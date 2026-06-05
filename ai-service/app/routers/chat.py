from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from app.services.gemini import generate_response

router = APIRouter(prefix="/chat", tags=["AI Tutor"])

class ChatMessage(BaseModel):
    sender: str # 'user' or 'bot'
    message: str

class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []
    subject: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str

@router.post("", response_model=ChatResponse)
async def chat_tutor(req: ChatRequest):
    try:
        # Build System Instruction based on subject
        subject_str = f" specialized in {req.subject}" if req.subject else ""
        system_instruction = (
            f"You are a friendly, highly intelligent Computer Science AI Tutor{subject_str}.\n"
            "Your goal is to explain concepts clearly, provide clean code examples (if asked), "
            "help debug errors, and summarize complicated topics.\n"
            "Keep explanation levels understandable yet rich. Use proper markdown and formatting for code."
        )
        
        # Build prompt from conversation history
        prompt_parts = []
        for msg in req.history:
            role_name = "User" if msg.sender == "user" else "Tutor"
            prompt_parts.append(f"{role_name}: {msg.message}")
            
        prompt_parts.append(f"User: {req.message}")
        full_prompt = "\n".join(prompt_parts)
        
        reply = generate_response(
            prompt=full_prompt,
            system_instruction=system_instruction,
            json_mode=False
        )
        
        return ChatResponse(reply=reply)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI Tutor session failed: {str(e)}")
