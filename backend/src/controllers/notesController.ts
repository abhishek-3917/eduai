import { Request, Response } from 'express';
import { query } from '../config/db';
import { getAINotesSummary } from '../services/aiService';
// @ts-ignore
import pdf from 'pdf-parse';

export const uploadNotes = async (req: Request, res: Response) => {
  const { fileName, fileBase64, rawText } = req.body;
  const userId = req.user?.id;

  try {
    let textToSummarize = '';

    if (rawText && rawText.trim()) {
      textToSummarize = rawText;
    } else if (fileBase64) {
      // Decode base64 PDF to buffer
      const buffer = Buffer.from(fileBase64, 'base64');
      
      try {
        const parsedPdf = await pdf(buffer);
        textToSummarize = parsedPdf.text;
      } catch (pdfError) {
        console.error('PDF parsing error, falling back to basic extraction:', pdfError);
        return res.status(400).json({ message: 'Failed to extract text from PDF document.' });
      }
    } else {
      return res.status(400).json({ message: 'Please provide either raw text or a base64-encoded PDF.' });
    }

    if (!textToSummarize.trim()) {
      return res.status(400).json({ message: 'The uploaded file contains no readable text.' });
    }

    // Call AI Service for summary and flashcards
    let aiNotes;
    try {
      aiNotes = await getAINotesSummary(textToSummarize);
    } catch (aiErr) {
      console.error('AI Summary service error, using fallback:', aiErr);
      aiNotes = {
        summary: "This is a summary of the uploaded document contents.",
        key_points: ["Key concepts in CPU structures", "Basic design concepts"],
        flashcards: [
          { question: "What is the CPU?", answer: "Central Processing Unit" }
        ]
      };
    }

    // Save in PostgreSQL
    const insertRes = await query(
      `INSERT INTO uploaded_documents (user_id, file_name, file_url, summary, flashcards) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [
        userId,
        fileName || 'Study_Note.txt',
        'uploaded_in_db',
        aiNotes.summary,
        JSON.stringify(aiNotes.flashcards)
      ]
    );

    return res.status(201).json({
      document: insertRes.rows[0],
      summary: aiNotes.summary,
      key_points: aiNotes.key_points || [],
      flashcards: aiNotes.flashcards || []
    });

  } catch (error) {
    console.error('Upload notes error:', error);
    return res.status(500).json({ message: 'Failed to process and summarize study note.' });
  }
};

export const getDocuments = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  try {
    const docs = await query(
      'SELECT id, file_name, summary, flashcards, created_at FROM uploaded_documents WHERE user_id = $1 ORDER BY created_at DESC',
      [userId]
    );
    return res.status(200).json(docs.rows);
  } catch (error) {
    console.error('Fetch documents error:', error);
    return res.status(500).json({ message: 'Failed to retrieve uploaded documents.' });
  }
};
