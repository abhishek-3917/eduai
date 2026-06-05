import { Request, Response } from 'express';
import { query } from '../config/db';
import { getAISkillGapAnalysis } from '../services/aiService';

export const getAssessments = async (req: Request, res: Response) => {
  try {
    const assessmentsRes = await query(
      `SELECT a.*, COUNT(q.id) as question_count 
       FROM assessments a 
       LEFT JOIN questions q ON a.id = q.assessment_id 
       GROUP BY a.id 
       ORDER BY a.created_at DESC`
    );
    return res.status(200).json(assessmentsRes.rows);
  } catch (error) {
    console.error('Fetch assessments error:', error);
    return res.status(500).json({ message: 'Failed to retrieve assessments.' });
  }
};

export const getAssessmentById = async (req: Request, res: Response) => {
  const { id } = req.params;
  const isStudent = req.user?.role === 'student';

  try {
    const assessmentRes = await query('SELECT * FROM assessments WHERE id = $1', [id]);
    if (assessmentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assessment not found.' });
    }

    // Get questions
    const questionsRes = await query(
      'SELECT id, question_text, type, options FROM questions WHERE assessment_id = $1 ORDER BY id ASC',
      [id]
    );

    return res.status(200).json({
      assessment: assessmentRes.rows[0],
      questions: questionsRes.rows
    });
  } catch (error) {
    console.error('Fetch assessment details error:', error);
    return res.status(500).json({ message: 'Failed to retrieve assessment details.' });
  }
};

export const createAssessment = async (req: Request, res: Response) => {
  const { title, description, subject, courseId, questions } = req.body;
  const creatorId = req.user?.id;

  try {
    // 1. Insert Assessment
    const assessmentInsert = await query(
      `INSERT INTO assessments (title, description, subject, course_id, creator_id) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [title, description, subject, courseId || null, creatorId]
    );
    const newAssessment = assessmentInsert.rows[0];

    // 2. Insert Questions
    if (questions && Array.isArray(questions)) {
      for (const q of questions) {
        await query(
          `INSERT INTO questions (assessment_id, question_text, type, options, correct_answer) 
           VALUES ($1, $2, $3, $4, $5)`,
          [newAssessment.id, q.question_text, q.type || 'mcq', JSON.stringify(q.options), q.correct_answer]
        );
      }
    }

    return res.status(201).json({
      message: 'Assessment and questions created successfully.',
      assessment: newAssessment
    });
  } catch (error) {
    console.error('Create assessment error:', error);
    return res.status(500).json({ message: 'Failed to create assessment.' });
  }
};

export const submitAssessment = async (req: Request, res: Response) => {
  const { id } = req.params; // Assessment ID
  const { answers } = req.body; // Map: { question_id: user_answer_string }
  const userId = req.user?.id;

  try {
    // 1. Fetch assessment and all correct answers
    const assessmentRes = await query('SELECT * FROM assessments WHERE id = $1', [id]);
    if (assessmentRes.rows.length === 0) {
      return res.status(404).json({ message: 'Assessment not found.' });
    }
    const assessment = assessmentRes.rows[0];

    const questionsRes = await query(
      'SELECT id, question_text, correct_answer FROM questions WHERE assessment_id = $1',
      [id]
    );
    const questions = questionsRes.rows;

    if (questions.length === 0) {
      return res.status(400).json({ message: 'This assessment has no questions.' });
    }

    // 2. Grade the submission
    let correctCount = 0;
    const gradingResults: Record<number, { correct: boolean; answer: string; correctAnswer: string }> = {};

    for (const q of questions) {
      const userAnswer = answers[q.id];
      const correctAnswer = q.correct_answer;
      const isCorrect = userAnswer === correctAnswer;
      if (isCorrect) {
        correctCount += 1;
      }
      gradingResults[q.id] = {
        correct: isCorrect,
        answer: userAnswer || 'Unanswered',
        correctAnswer: correctAnswer
      };
    }

    const rawScore = (correctCount / questions.length) * 100;
    const finalScore = parseFloat(rawScore.toFixed(2));

    // 3. Prepare scores for AI Skill Gap analysis
    // In our simplified scheme, we pass subject-wide topic grading to AI
    const scoresPayload = {
      [assessment.subject]: finalScore,
      "overall_accuracy": finalScore
    };

    // 4. Fetch previous attempts by this user to compile history
    const pastAttemptsRes = await query(
      `SELECT score, created_at FROM quiz_attempts 
       WHERE user_id = $1 AND assessment_id = $2 
       ORDER BY created_at DESC LIMIT 5`,
      [userId, id]
    );

    // 5. Call AI Service for Skill Gap evaluation
    let aiEvaluation;
    try {
      aiEvaluation = await getAISkillGapAnalysis(
        assessment.subject,
        scoresPayload,
        pastAttemptsRes.rows
      );
    } catch (aiErr) {
      console.error('AI Skill Gap service error, using fallback:', aiErr);
      aiEvaluation = {
        strengths: ["Basic understanding of the core subject"],
        weaknesses: ["Implementation detail execution"],
        gap_analysis: "The user scored well but needs attention to detail.",
        recommended_steps: ["Review core lessons and study additional notes."]
      };
    }

    const feedbackText = JSON.stringify(aiEvaluation);

    // 6. Save attempt in DB
    const attemptInsert = await query(
      `INSERT INTO quiz_attempts (user_id, assessment_id, score, total_questions, answers, feedback) 
       VALUES ($1, $2, $3, $4, $5, $6) 
       RETURNING *`,
      [userId, id, finalScore, questions.length, JSON.stringify(answers), feedbackText]
    );

    // 7. Update student analytics
    // Upsert analytics entry for today
    const today = new Date().toISOString().split('T')[0];
    const checkAnalytics = await query(
      'SELECT id, study_time_minutes FROM analytics WHERE user_id = $1 AND date = $2',
      [userId, today]
    );

    if (checkAnalytics.rows.length > 0) {
      // Update completion rate and consistency
      await query(
        `UPDATE analytics 
         SET completion_rate = (completion_rate + $1) / 2, consistency_score = consistency_score + 5
         WHERE id = $2`,
        [finalScore, checkAnalytics.rows[0].id]
      );
    } else {
      // Insert new record
      await query(
        `INSERT INTO analytics (user_id, study_time_minutes, completion_rate, consistency_score, date) 
         VALUES ($1, 15, $2, 10, $3)`,
        [userId, finalScore, today]
      );
    }

    // 8. Create a system notification for the student
    await query(
      `INSERT INTO notifications (user_id, title, message) 
       VALUES ($1, $2, $3)`,
      [
        userId,
        `Assessment Scored: ${assessment.title}`,
        `You scored ${finalScore}% on your attempt! Review your AI feedback on the dashboard.`
      ]
    );

    return res.status(200).json({
      attempt: attemptInsert.rows[0],
      score: finalScore,
      total_questions: questions.length,
      correct_count: correctCount,
      grading: gradingResults,
      ai_feedback: aiEvaluation
    });

  } catch (error) {
    console.error('Submit assessment error:', error);
    return res.status(500).json({ message: 'Failed to process assessment submission.' });
  }
};
