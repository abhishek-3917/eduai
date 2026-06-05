import axios from 'axios';
import * as dotenv from 'dotenv';

dotenv.config();

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

const aiClient = axios.create({
  baseURL: AI_SERVICE_URL,
  timeout: 60000, // 60s timeout for AI generation
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getAIChatReply = async (message: string, history: any[], subject?: string) => {
  const response = await aiClient.post('/chat', { message, history, subject });
  return response.data.reply;
};

export const getAISkillGapAnalysis = async (subject: string, scores: Record<string, number>, attempts: any[]) => {
  const response = await aiClient.post('/skill-gap', { subject, scores, attempts });
  return response.data;
};

export const getAIRoadmap = async (careerGoal: string, currentSkills: string[]) => {
  const response = await aiClient.post('/roadmap', { career_goal: careerGoal, current_skills: currentSkills });
  return response.data;
};

export const getAIQuizQuestions = async (subject: string, difficulty: string) => {
  const response = await aiClient.post('/quiz-generator', { subject, difficulty });
  return response.data;
};

export const getAICareerAdvice = async (skills: string[], interests: string[]) => {
  const response = await aiClient.post('/career-advice', { skills, interests });
  return response.data;
};

export const getAINotesSummary = async (text: string) => {
  const response = await aiClient.post('/notes-summary', { text });
  return response.data;
};

export const getAIStudyPlan = async (subjects: string[], availableHours: number, examDates: Record<string, string>) => {
  const response = await aiClient.post('/study-plan', {
    subjects,
    available_hours: availableHours,
    exam_dates: examDates,
  });
  return response.data;
};
