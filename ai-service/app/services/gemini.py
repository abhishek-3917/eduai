import os
import json
import logging
import google.generativeai as genai
from app.config import settings

logger = logging.getLogger(__name__)

# Initialize the Gemini API if key is present and not default placeholder
api_key = settings.GEMINI_API_KEY
has_api = bool(api_key and "your_google_gemini_api_key" not in api_key)

if has_api:
    try:
        genai.configure(api_key=api_key)
        logger.info("Google Gemini SDK configured successfully.")
    except Exception as e:
        logger.error(f"Error configuring Gemini SDK: {e}")
        has_api = False
else:
    logger.warning("No valid GEMINI_API_KEY found. Running in Mock AI Fallback mode.")

def generate_response(prompt: str, system_instruction: str = None, json_mode: bool = False) -> str:
    """
    Generates text content using Google Gemini (gemini-1.5-flash).
    Falls back to mock data if Gemini API is unavailable.
    """
    if has_api:
        try:
            # We use gemini-3.5-flash for speed and structured outputs
            model_name = "gemini-3.5-flash"
            
            generation_config = {}
            if json_mode:
                generation_config["response_mime_type"] = "application/json"
                
            model = genai.GenerativeModel(
                model_name=model_name,
                system_instruction=system_instruction,
                generation_config=generation_config
            )
            
            response = model.generate_content(prompt)
            return response.text
        except Exception as e:
            logger.error(f"Gemini API call failed: {e}. Falling back to mock generator.")
            # Fall through to mock generator

    # Mock Generator logic
    return _generate_mock_fallback(prompt, json_mode)

def _generate_mock_fallback(prompt: str, json_mode: bool) -> str:
    """
    Generates high-fidelity mock JSON or text responses based on prompt heuristics.
    """
    lower_prompt = prompt.lower()
    
    if json_mode:
        # 1. Skill Gap Analysis mock
        if "skill gap" in lower_prompt or "strengths" in lower_prompt:
            return json.dumps({
                "strengths": ["Strong understanding of fundamental syntax", "Solid database normalization logic", "Good grasp of basic HTTP structures"],
                "weaknesses": ["Struggles with recursion and tree-based DSA problems", "Lacks familiarity with Operating Systems page-replacement algorithms", "Could improve on TCP vs UDP configuration specifics"],
                "gap_analysis": "The student performs well in application-layer databases (DBMS) but needs focus on memory management concepts (OS) and core data structures (DSA).",
                "recommended_steps": [
                    "Complete a practical module on trees and graphs in DSA.",
                    "Review page replacement algorithms in Operating Systems.",
                    "Build a small TCP socket program to solidify networking basics."
                ]
            }, indent=2)
            
        # 2. Roadmap mock
        elif "roadmap" in lower_prompt or "month" in lower_prompt:
            goal = "Software Developer"
            if "data scientist" in lower_prompt:
                goal = "Data Scientist"
            elif "ai engineer" in lower_prompt:
                goal = "AI Engineer"
            
            return json.dumps({
                "career_goal": goal,
                "roadmap": [
                    {
                        "phase": "Month 1: Core Fundamentals & Programming Basics",
                        "topics": ["Variables, Loops, and Functions", "Object-Oriented Design Principles", "Basic SQL & Data Schemas"],
                        "resources": ["EduAI Course: Intro to OOP", "Official Documentation", "Visual Algo DSA Animations"]
                    },
                    {
                        "phase": "Month 2: Algorithms & System Basics",
                        "topics": ["Sorting & Searching Algorithms", "OS Basics: Processes & Threads", "PostgreSQL Joins & Indexes"],
                        "resources": ["GeeksforGeeks OS Guide", "EduAI Course: Database Management Systems"]
                    },
                    {
                        "phase": "Month 3: Advanced Concepts & Project Integration",
                        "topics": ["REST API Design & Web Sockets", "Cloud Deployment Basics (Docker)", "Final Full Stack Capstone Project"],
                        "resources": ["Docker Get Started Docs", "Full Stack Project Tutorials on GitHub"]
                    }
                ]
            }, indent=2)
            
        # 3. Quiz generator mock
        elif "quiz" in lower_prompt or "mcq" in lower_prompt:
            subject = "DSA"
            if "oop" in lower_prompt:
                subject = "OOP"
            elif "dbms" in lower_prompt:
                subject = "DBMS"
            elif "operating" in lower_prompt or "os" in lower_prompt:
                subject = "Operating Systems"
            
            return json.dumps([
                {
                    "question": f"Which of the following is a core concept of {subject}?",
                    "options": ["A) Encapsulation", "B) Linear search latency", "C) Data isolation & schemas", "D) Standard operations depending on focus"],
                    "correct_answer": "A) Encapsulation",
                    "explanation": "Depending on the subject domain, this represents a core architectural foundation."
                },
                {
                    "question": f"What is the time complexity of searching in a well-balanced binary search tree in the worst case?",
                    "options": ["A) O(1)", "B) O(n)", "C) O(log n)", "D) O(n log n)"],
                    "correct_answer": "C) O(log n)",
                    "explanation": "A balanced BST halves the search space at each step, yielding logarithmic search complexity."
                },
                {
                    "question": "What does ACID stand for in database transaction management?",
                    "options": ["A) Atomicity, Consistency, Isolation, Durability", "B) Array, Class, Index, Directory", "C) Access, Control, Identify, Debug", "D) All-round, Critical, Internal, Diagnostic"],
                    "correct_answer": "A) Atomicity, Consistency, Isolation, Durability",
                    "explanation": "ACID properties guarantee that database transactions are processed reliably."
                }
            ], indent=2)
            
        # 4. Summary & flashcards mock
        elif "summary" in lower_prompt or "flashcard" in lower_prompt:
            return json.dumps({
                "summary": "This document covers core computer science topics including database design (normalization, primary/foreign keys), networking protocols (TCP/IP handshake, DNS resolution), and CPU scheduling algorithms in Operating Systems.",
                "key_points": [
                    "Database normalization reduces data redundancy and improves integrity.",
                    "The TCP 3-way handshake establishes a reliable connection via SYN, SYN-ACK, and ACK packets.",
                    "Round Robin scheduling allocates equal time slices to each process."
                ],
                "flashcards": [
                    {"question": "What is Database Normalization?", "answer": "The process of organizing data in a database to reduce redundancy and dependencies."},
                    {"question": "Explain TCP 3-Way Handshake.", "answer": "A process of establishing connection using SYN -> SYN-ACK -> ACK packets."},
                    {"question": "What is Round Robin CPU Scheduling?", "answer": "A scheduling algorithm that assigns a fixed time quantum to each process in a cyclic order."}
                ]
            }, indent=2)
            
        # 5. Study plan mock
        elif "study" in lower_prompt or "timetable" in lower_prompt:
            return json.dumps({
                "weekly_schedule": [
                    {"day": "Monday", "sessions": [{"time": "09:00 - 11:00", "subject": "DSA", "goal": "Practice trees & recursion problems"}, {"time": "14:00 - 15:30", "subject": "DBMS", "goal": "Review normal forms (1NF, 2NF, 3NF)"}]},
                    {"day": "Tuesday", "sessions": [{"time": "10:00 - 12:00", "subject": "Operating Systems", "goal": "Study process scheduling"}, {"time": "15:00 - 16:30", "subject": "Aptitude", "goal": "Solve probability and permutation exercises"}]},
                    {"day": "Wednesday", "sessions": [{"time": "09:00 - 11:00", "subject": "Computer Networks", "goal": "Learn IP addressing and subnetting"}]},
                    {"day": "Thursday", "sessions": [{"time": "10:00 - 12:00", "subject": "OOP", "goal": "Practice Polymorphism & Interface patterns"}]},
                    {"day": "Friday", "sessions": [{"time": "09:00 - 11:00", "subject": "DSA", "goal": "Review sorting and searching"}, {"time": "14:00 - 16:00", "subject": "DBMS", "goal": "Solve SQL query practice questions"}]}
                ],
                "daily_goals": [
                    "Complete at least 2 coding problems daily.",
                    "Spend 30 minutes summarizing newly learned terms.",
                    "Review progress analytics before sleeping."
                ]
            }, indent=2)

        # Catch-all empty JSON
        return "{}"

    # Plain text tutoring / chat reply
    if "explain" in lower_prompt:
        return "Here is a detailed explanation: In computer science, we often structure systems in layers. For example, in databases, the storage engine, execution engine, and query planner collaborate to retrieve data efficiently. Similarly, in networks, the OSI model defines 7 distinct layers of abstractions to manage complex transmission protocols."
    
    return f"Hello! As your AI tutor, I am happy to help you. Regarding your query: I can assist you with concepts, debugging your code, or generating example implementations. Let me know what you would like to explore next!"
