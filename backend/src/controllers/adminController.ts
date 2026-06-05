import { Request, Response } from 'express';
import { query } from '../config/db';

export const getStats = async (req: Request, res: Response) => {
  try {
    // 1. Total users
    const usersCountRes = await query('SELECT COUNT(*) as count FROM users');
    const totalUsers = parseInt(usersCountRes.rows[0].count);

    // 2. Active users (users who took an assessment or chatted recently)
    const activeUsersRes = await query(
      `SELECT COUNT(DISTINCT user_id) as count FROM (
         SELECT user_id FROM quiz_attempts
         UNION
         SELECT user_id FROM chat_history
       ) as active`
    );
    const activeUsers = parseInt(activeUsersRes.rows[0].count);

    // 3. Courses count
    const coursesCountRes = await query('SELECT COUNT(*) as count FROM courses');
    const totalCourses = parseInt(coursesCountRes.rows[0].count);

    // 4. Attempts count
    const attemptsCountRes = await query('SELECT COUNT(*) as count FROM quiz_attempts');
    const totalAttempts = parseInt(attemptsCountRes.rows[0].count);

    // 5. User list (id, name, email, role, date registered)
    const userListRes = await query(
      `SELECT u.id, u.name, u.email, r.name as role, u.created_at 
       FROM users u 
       JOIN roles r ON u.role_id = r.id 
       ORDER BY u.created_at DESC`
    );

    return res.status(200).json({
      stats: {
        totalUsers,
        activeUsers: activeUsers || totalUsers, // fallback if zero
        totalCourses,
        totalAttempts
      },
      users: userListRes.rows
    });

  } catch (error) {
    console.error('Fetch admin stats error:', error);
    return res.status(500).json({ message: 'Failed to retrieve admin platform metrics.' });
  }
};
