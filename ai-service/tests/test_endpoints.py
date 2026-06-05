import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "online"

def test_chat():
    payload = {
        "message": "Explain recursion",
        "history": [],
        "subject": "DSA"
    }
    response = client.post("/chat", json=payload)
    assert response.status_code == 200
    assert "reply" in response.json()

def test_skill_gap():
    payload = {
        "subject": "DBMS",
        "scores": {"normalization": 90.0, "indexing": 30.0},
        "attempts": []
    }
    response = client.post("/skill-gap", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "strengths" in data
    assert "weaknesses" in data
    assert "gap_analysis" in data
    assert "recommended_steps" in data

def test_roadmap():
    payload = {
        "career_goal": "Full Stack Developer",
        "current_skills": ["HTML", "CSS"]
    }
    response = client.post("/roadmap", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["career_goal"] == "Full Stack Developer"
    assert isinstance(data["roadmap"], list)

def test_quiz_generator():
    payload = {
        "subject": "DSA",
        "difficulty": "Medium"
    }
    response = client.post("/quiz-generator", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "question" in data[0]
    assert "options" in data[0]
    assert "correct_answer" in data[0]

def test_career_advice():
    payload = {
        "skills": ["Python", "SQL", "Pandas"],
        "interests": ["Machine Learning", "Statistics"]
    }
    response = client.post("/career-advice", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) > 0
    assert "career" in data[0]
    assert "similarity_score" in data[0]
    assert "details" in data[0]

def test_notes_summary():
    payload = {
        "text": "Database Normalization is the process of organizing attributes in a database."
    }
    response = client.post("/notes-summary", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "key_points" in data
    assert "flashcards" in data

def test_study_plan():
    payload = {
        "subjects": ["DSA", "OS"],
        "available_hours": 15,
        "exam_dates": {"DSA": "2026-06-20"}
    }
    response = client.post("/study-plan", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "weekly_schedule" in data
    assert "daily_goals" in data
