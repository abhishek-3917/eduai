import { Request, Response } from 'express';
import { query } from '../config/db';
import { getAIChatReply } from '../services/aiService';

export const chatTutor = async (req: Request, res: Response) => {
  const { message, subject } = req.body;
  const userId = req.user?.id;

  try {
    // 1. Fetch last 10 chat messages to maintain context
    const historyRes = await query(
      `SELECT sender, message FROM chat_history 
       WHERE user_id = $1 AND (subject = $2 OR (subject IS NULL AND $2 IS NULL)) 
       ORDER BY created_at ASC LIMIT 10`,
      [userId, subject || null]
    );

    const history = historyRes.rows.map((row) => ({
      sender: row.sender,
      message: row.message
    }));

    // 2. Save user message to database
    await query(
      `INSERT INTO chat_history (user_id, sender, message, subject) 
       VALUES ($1, 'user', $2, $3)`,
      [userId, message, subject || null]
    );

    // 3. Call AI service
    let reply;
    try {
      reply = await getAIChatReply(message, history, subject);
    } catch (aiErr) {
      console.error('AI Tutor microservice error, using fallback:', aiErr);
      reply = "I apologize, my backend connection is temporarily overloaded. Please try again. Let me know what computer science topic we can explore next.";
    }

    // 4. Save bot message to database
    await query(
      `INSERT INTO chat_history (user_id, sender, message, subject) 
       VALUES ($1, 'bot', $2, $3)`,
      [userId, reply, subject || null]
    );

    // 5. Add a small increment to study analytics time
    const today = new Date().toISOString().split('T')[0];
    await query(
      `INSERT INTO analytics (user_id, study_time_minutes, date) 
       VALUES ($1, 2, $2)
       ON CONFLICT (user_id, date) 
       DO UPDATE SET study_time_minutes = analytics.study_time_minutes + 2`,
      [userId, today]
    );

    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Tutor chat error:', error);
    return res.status(500).json({ message: 'Failed to process chat with AI Tutor.' });
  }
};

export const getChatHistory = async (req: Request, res: Response) => {
  const userId = req.user?.id;
  const { subject } = req.query;

  try {
    const historyRes = await query(
      `SELECT id, sender, message, subject, created_at FROM chat_history 
       WHERE user_id = $1 AND ($2::varchar IS NULL OR subject = $2)
       ORDER BY created_at ASC`,
      [userId, subject ? String(subject) : null]
    );
    return res.status(200).json(historyRes.rows);
  } catch (error) {
    console.error('Fetch chat history error:', error);
    return res.status(500).json({ message: 'Failed to retrieve chat history.' });
  }
};
