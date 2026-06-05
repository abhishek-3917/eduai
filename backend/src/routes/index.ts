import { Router } from 'express';
import { register, login, getMe, resetPassword } from '../controllers/authController';
import { getCourses, createCourse, deleteCourse } from '../controllers/courseController';
import { getAssessments, getAssessmentById, createAssessment, submitAssessment } from '../controllers/assessmentController';
import { generateRoadmap, getRoadmap } from '../controllers/roadmapController';
import { chatTutor, getChatHistory } from '../controllers/tutorController';
import { evaluateCareer, getCareerRecommendations } from '../controllers/careerController';
import { generateStudyPlan, getStudyPlan } from '../controllers/plannerController';
import { uploadNotes, getDocuments } from '../controllers/notesController';
import { getStats } from '../controllers/adminController';
import { getAnalytics } from '../controllers/analyticsController';
import { getNotifications, markNotificationsAsRead } from '../controllers/notificationController';

import { authenticateJWT, authorizeRoles } from '../middleware/auth';
import { validateRequiredFields } from '../middleware/validation';

const router = Router();

// --- Authentication APIs ---
router.post('/auth/register', validateRequiredFields(['name', 'email', 'password']), register);
router.post('/auth/login', validateRequiredFields(['email', 'password']), login);
router.post('/auth/reset-password', validateRequiredFields(['email']), resetPassword);
router.get('/auth/me', authenticateJWT, getMe);

// --- Course APIs ---
router.get('/courses', authenticateJWT, getCourses);
router.post('/courses', authenticateJWT, authorizeRoles('teacher', 'admin'), validateRequiredFields(['title', 'description']), createCourse);
router.delete('/courses/:id', authenticateJWT, authorizeRoles('teacher', 'admin'), deleteCourse);

// --- Assessment & Quiz APIs ---
router.get('/assessments', authenticateJWT, getAssessments);
router.get('/assessments/:id', authenticateJWT, getAssessmentById);
router.post('/assessments', authenticateJWT, authorizeRoles('teacher', 'admin'), validateRequiredFields(['title', 'subject']), createAssessment);
router.post('/assessments/:id/submit', authenticateJWT, validateRequiredFields(['answers']), submitAssessment);

// --- Learning Roadmap APIs ---
router.post('/roadmap/generate', authenticateJWT, validateRequiredFields(['careerGoal', 'currentSkills']), generateRoadmap);
router.get('/roadmap', authenticateJWT, getRoadmap);

// --- AI Tutor APIs ---
router.post('/tutor/chat', authenticateJWT, validateRequiredFields(['message']), chatTutor);
router.get('/tutor/history', authenticateJWT, getChatHistory);

// --- Career Guidance APIs ---
router.post('/career/evaluate', authenticateJWT, validateRequiredFields(['skills', 'interests']), evaluateCareer);
router.get('/career', authenticateJWT, getCareerRecommendations);

// --- Study Planner APIs ---
router.post('/planner/generate', authenticateJWT, validateRequiredFields(['subjects', 'availableHours', 'examDates']), generateStudyPlan);
router.get('/planner', authenticateJWT, getStudyPlan);

// --- AI Notes APIs ---
router.post('/notes/upload', authenticateJWT, uploadNotes);
router.get('/notes', authenticateJWT, getDocuments);

// --- Student Analytics & Notifications APIs ---
router.get('/analytics', authenticateJWT, getAnalytics);
router.get('/notifications', authenticateJWT, getNotifications);
router.put('/notifications/read', authenticateJWT, markNotificationsAsRead);

// --- Admin APIs ---
router.get('/admin/stats', authenticateJWT, authorizeRoles('admin'), getStats);

export default router;
