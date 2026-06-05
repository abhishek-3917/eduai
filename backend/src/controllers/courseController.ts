import { Request, Response } from 'express';
import { query } from '../config/db';

export const getCourses = async (req: Request, res: Response) => {
  try {
    const courseRes = await query(
      `SELECT c.*, u.name as instructor_name 
       FROM courses c 
       LEFT JOIN users u ON c.instructor_id = u.id 
       ORDER BY c.created_at DESC`
    );
    return res.status(200).json(courseRes.rows);
  } catch (error) {
    console.error('Fetch courses error:', error);
    return res.status(500).json({ message: 'Failed to retrieve courses.' });
  }
};

export const createCourse = async (req: Request, res: Response) => {
  const { title, description } = req.body;
  const instructorId = req.user?.id;

  try {
    const insertRes = await query(
      `INSERT INTO courses (title, description, instructor_id) 
       VALUES ($1, $2, $3) 
       RETURNING *`,
      [title, description, instructorId]
    );
    return res.status(201).json(insertRes.rows[0]);
  } catch (error) {
    console.error('Create course error:', error);
    return res.status(500).json({ message: 'Failed to create course.' });
  }
};

export const deleteCourse = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const deleteRes = await query('DELETE FROM courses WHERE id = $1 RETURNING id', [id]);
    if (deleteRes.rows.length === 0) {
      return res.status(404).json({ message: 'Course not found.' });
    }
    return res.status(200).json({ message: 'Course deleted successfully.', id });
  } catch (error) {
    console.error('Delete course error:', error);
    return res.status(500).json({ message: 'Failed to delete course.' });
  }
};
