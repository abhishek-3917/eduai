import { Request, Response } from 'express';
import { query } from '../config/db';
import { getAICareerAdvice } from '../services/aiService';

export const evaluateCareer = async (req: Request, res: Response) => {
  const { skills, interests } = req.body;
  const userId = req.user?.id;

  try {
    // 1. Fetch suggestions from AI Microservice
    const recommendations = await getAICareerAdvice(skills, interests);

    if (recommendations && recommendations.length > 0) {
      // 2. Save top recommendation in database
      const topMatch = recommendations[0];
      
      await query(
        `INSERT INTO career_recommendations 
         (user_id, recommended_career, similarity_score, required_skills, salary_insights, details) 
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          topMatch.career,
          topMatch.similarity_score,
          JSON.stringify(topMatch.required_skills),
          JSON.stringify(topMatch.salary_insights),
          topMatch.details
        ]
      );

      // Create notification
      await query(
        `INSERT INTO notifications (user_id, title, message) 
         VALUES ($1, $2, $3)`,
        [
          userId,
          'Career Recommendations Available',
          `Based on your skills, you matched with '${topMatch.career}'! View complete analysis in the Career tab.`
        ]
      );
    }

    return res.status(200).json(recommendations);

  } catch (error) {
    console.error('Career advice error:', error);
    return res.status(500).json({ message: 'Failed to process career recommendations.' });
  }
};

export const getCareerRecommendations = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const recs = await query(
      `SELECT * FROM career_recommendations 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );
    return res.status(200).json(recs.rows);
  } catch (error) {
    console.error('Fetch career recommendations error:', error);
    return res.status(500).json({ message: 'Failed to retrieve career recommendations.' });
  }
};
