from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers import chat, skill_gap, roadmap, quiz, career, notes, planner
from app.config import settings

app = FastAPI(
    title="EduAI API Service",
    description="Python FastAPI Microservice managing ML recommendations & Gemini LLM modules",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(chat.router)
app.include_router(skill_gap.router)
app.include_router(roadmap.router)
app.include_router(quiz.router)
app.include_router(career.router)
app.include_router(notes.router)
app.include_router(planner.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "service": "EduAI AI Microservice",
        "environment": settings.ENV
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
