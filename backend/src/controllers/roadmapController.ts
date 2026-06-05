import { Request, Response } from 'express';
import { query } from '../config/db';
import { getAIRoadmap } from '../services/aiService';

export const generateRoadmap = async (req: Request, res: Response) => {
  const { careerGoal, currentSkills } = req.body;
  const userId = req.user?.id;

  try {
    // 1. Ask AI Service to generate roadmap
    const roadmapData = await getAIRoadmap(careerGoal, currentSkills);

    // 2. Save in database
    // Upsert user learning path
    const checkPath = await query('SELECT id FROM learning_paths WHERE user_id = $1', [userId]);
    
    let pathRecord;
    if (checkPath.rows.length > 0) {
      const updateRes = await query(
        `UPDATE learning_paths 
         SET career_goal = $1, current_skills = $2, roadmap_data = $3, updated_at = NOW() 
         WHERE user_id = $4 RETURNING *`,
        [careerGoal, JSON.stringify(currentSkills), JSON.stringify(roadmapData.roadmap), userId]
      );
      pathRecord = updateRes.rows[0];
    } else {
      const insertRes = await query(
        `INSERT INTO learning_paths (user_id, career_goal, current_skills, roadmap_data) 
         VALUES ($1, $2, $3, $4) RETURNING *`,
        [userId, careerGoal, JSON.stringify(currentSkills), JSON.stringify(roadmapData.roadmap)]
      );
      pathRecord = insertRes.rows[0];
    }

    // 3. Send notification
    await query(
      `INSERT INTO notifications (user_id, title, message) 
       VALUES ($1, $2, $3)`,
      [
        userId,
        'Learning Roadmap Generated',
        `Your personalized study path for '${careerGoal}' is now available on your dashboard!`
      ]
    );

    return res.status(200).json(pathRecord);

  } catch (error) {
    console.error('Roadmap generation error:', error);
    return res.status(500).json({ message: 'Failed to generate learning roadmap.' });
  }
};

export const getRoadmap = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const roadmapRes = await query('SELECT * FROM learning_paths WHERE user_id = $1', [userId]);
    if (roadmapRes.rows.length === 0) {
      return res.status(404).json({ message: 'No learning roadmap found. Please generate one first.' });
    }
    return res.status(200).json(roadmapRes.rows[0]);
  } catch (error) {
    console.error('Fetch roadmap error:', error);
    return res.status(500).json({ message: 'Failed to retrieve learning roadmap.' });
  }
};
