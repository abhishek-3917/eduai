import { Request, Response } from 'express';
import { query } from '../config/db';

export const getAnalytics = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    // 1. Fetch daily analytics entries for the user
    // Note: cast date to text to ensure consistent string formatting (YYYY-MM-DD)
    const analyticsRes = await query(
      `SELECT date::text as date, study_time_minutes, completion_rate, consistency_score 
       FROM analytics 
       WHERE user_id = $1 
       ORDER BY date ASC`,
      [userId]
    );

    const analyticsMap = new Map();
    analyticsRes.rows.forEach((row) => {
      analyticsMap.set(row.date, row);
    });

    // 2. Generate exactly the last 7 UTC days to match the database writes
    const stats = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayName = daysOfWeek[d.getUTCDay()];

      const existing = analyticsMap.get(dateStr);
      stats.push({
        date: dayName,
        fullDate: dateStr,
        study_time_minutes: existing ? parseInt(existing.study_time_minutes) : 0,
        completion_rate: existing ? parseFloat(existing.completion_rate) : 0,
        consistency_score: existing ? parseInt(existing.consistency_score) : 0,
      });
    }

    // 3. Compute overall average quiz score from actual quiz_attempts
    const avgScoreRes = await query(
      `SELECT AVG(score) as avg_score, COUNT(*) as count 
       FROM quiz_attempts 
       WHERE user_id = $1`,
      [userId]
    );
    const avgQuizScore = avgScoreRes.rows[0].avg_score 
      ? Math.round(parseFloat(avgScoreRes.rows[0].avg_score)) 
      : 0;
    const completedQuizzes = parseInt(avgScoreRes.rows[0].count || '0');

    // 4. Compute overall study time (all-time or last 7 days)
    // We will sum the last 7 days study time
    const totalStudyTimeMinutes = stats.reduce((acc, curr) => acc + curr.study_time_minutes, 0);

    // 5. Compute the actual active day streak
    // Retrieve all active dates (where they studied or did a quiz) sorted descending
    const activeDatesRes = await query(
      `SELECT DISTINCT date::text as date 
       FROM analytics 
       WHERE user_id = $1 AND (study_time_minutes > 0 OR completion_rate > 0) 
       ORDER BY date DESC`,
      [userId]
    );

    const activeDates = new Set(activeDatesRes.rows.map((row) => row.date));
    let streak = 0;
    
    const formatUTC = (dateObj: Date) => dateObj.toISOString().split('T')[0];
    
    let checkDate = new Date();
    const todayStr = formatUTC(checkDate);
    
    const yesterday = new Date();
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const yesterdayStr = formatUTC(yesterday);

    if (activeDates.has(todayStr)) {
      while (activeDates.has(formatUTC(checkDate))) {
        streak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      }
    } else if (activeDates.has(yesterdayStr)) {
      checkDate = yesterday;
      while (activeDates.has(formatUTC(checkDate))) {
        streak++;
        checkDate.setUTCDate(checkDate.getUTCDate() - 1);
      }
    }

    return res.status(200).json({
      stats,
      summary: {
        totalStudyMinutes: totalStudyTimeMinutes,
        avgCompletionRate: avgQuizScore,
        currentStreak: streak,
        completedQuizzes,
      }
    });

  } catch (error) {
    console.error('Fetch analytics error:', error);
    return res.status(500).json({ message: 'Failed to retrieve academic analytics.' });
  }
};
