import { Request, Response } from 'express';
import { query } from '../config/db';
import { getAIStudyPlan } from '../services/aiService';

export const generateStudyPlan = async (req: Request, res: Response) => {
  const { subjects, availableHours, examDates } = req.body;
  const userId = req.user?.id;

  try {
    // 1. Call AI Service to build schedule
    const plan = await getAIStudyPlan(subjects, availableHours, examDates);

    // 2. Save in study_plans database
    await query('DELETE FROM study_plans WHERE user_id = $1', [userId]); // clear old plan
    
    const insertRes = await query(
      `INSERT INTO study_plans (user_id, subjects, available_hours, exam_dates, schedule_data) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [
        userId,
        JSON.stringify(subjects),
        availableHours,
        JSON.stringify(examDates),
        JSON.stringify(plan)
      ]
    );

    // Create notification
    await query(
      `INSERT INTO notifications (user_id, title, message) 
       VALUES ($1, $2, $3)`,
      [
        userId,
        'Study Timetable Ready',
        'Your weekly study calendar is compiled. Find it in the Study Planner page.'
      ]
    );

    return res.status(200).json(insertRes.rows[0]);

  } catch (error) {
    console.error('Study plan generation error:', error);
    return res.status(500).json({ message: 'Failed to generate study timetable.' });
  }
};

export const getStudyPlan = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const planRes = await query('SELECT * FROM study_plans WHERE user_id = $1', [userId]);
    if (planRes.rows.length === 0) {
      return res.status(404).json({ message: 'No study plan found. Please generate one first.' });
    }
    return res.status(200).json(planRes.rows[0]);
  } catch (error) {
    console.error('Fetch study plan error:', error);
    return res.status(500).json({ message: 'Failed to retrieve study timetable.' });
  }
};
