import { Request, Response } from 'express';
import { query } from '../config/db';

export const getNotifications = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const notificationsRes = await query(
      `SELECT id, title, message, is_read, created_at 
       FROM notifications 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 30`,
      [userId]
    );

    return res.status(200).json(notificationsRes.rows);
  } catch (error) {
    console.error('Fetch notifications error:', error);
    return res.status(500).json({ message: 'Failed to retrieve system notifications.' });
  }
};

export const markNotificationsAsRead = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    await query(
      `UPDATE notifications 
       SET is_read = TRUE 
       WHERE user_id = $1 AND is_read = FALSE`,
      [userId]
    );

    return res.status(200).json({ message: 'Notifications marked as read.' });
  } catch (error) {
    console.error('Mark notifications read error:', error);
    return res.status(500).json({ message: 'Failed to update notification status.' });
  }
};
