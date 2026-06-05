import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BookOpen, AlertCircle, HelpCircle, CheckCircle2, XCircle } from 'lucide-react';

interface Question {
  id: number;
  question_text: string;
  type: string;
  options: string[];
}

interface Assessment {
  id: number;
  title: string;
  description: string;
  subject: string;
  question_count: number;
}

export default function Assessments() {
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Assessment | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  
  // Quiz progress states
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAssessments();
  }, []);

  const fetchAssessments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/assessments');
      setAssessments(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load assessments.');
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = async (quiz: Assessment) => {
    try {
      setLoading(true);
      setErrorMsg('');
      setResults(null);
      setAnswers({});
      const res = await api.get(`/assessments/${quiz.id}`);
      setActiveQuiz(quiz);
      setQuestions(res.data.questions);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to retrieve quiz questions.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAnswer = (qId: number, option: string) => {
    setAnswers({ ...answers, [qId]: option });
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz) return;
    
    // Check if all questions are answered
    if (Object.keys(answers).length < questions.length) {
      if (!window.confirm('You have unanswered questions. Are you sure you want to submit?')) {
        return;
      }
    }

    try {
      setSubmitting(true);
      const res = await api.post(`/assessments/${activeQuiz.id}/submit`, { answers });
      setResults(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Error submitting quiz responses.');
    } finally {
      setSubmitting(false);
    }
  };

  const closeQuiz = () => {
    setActiveQuiz(null);
    setQuestions([]);
    setAnswers({});
    setResults(null);
    fetchAssessments();
  };

  if (loading && assessments.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- RENDER COMPLETED RESULTS SCREEN ---
  if (results && activeQuiz) {
    const aiFeedback = results.ai_feedback || {};
    return (
      <div className="space-y-8 max-w-3xl mx-auto">
        <div className="glass-panel p-8 rounded-2xl glass-panel-glow text-center space-y-4">
          <div className="inline-flex p-3 rounded-full bg-violet-600/10 text-violet-400 border border-violet-500/20 mb-2">
            <CheckCircle2 className="w-12 h-12" />
          </div>
          <h2 className="text-3xl font-extrabold text-white">Quiz Evaluation Completed</h2>
          <p className="text-slate-400">Subject: <span className="text-violet-400 font-semibold">{activeQuiz.subject}</span></p>

          <div className="flex justify-center gap-10 mt-6 py-4 bg-slate-900/60 rounded-xl max-w-md mx-auto border border-slate-800">
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Your Score</span>
              <p className="text-3xl font-extrabold text-white mt-1">{results.score}%</p>
            </div>
            <div className="w-px bg-slate-800" />
            <div>
              <span className="text-xs text-slate-400 uppercase font-semibold">Accuracy</span>
              <p className="text-3xl font-extrabold text-white mt-1">
                {results.correct_count} / {results.total_questions}
              </p>
            </div>
          </div>
        </div>

        {/* AI Skill Gap Analysis */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="font-bold text-lg text-white border-b border-slate-800 pb-4">
            🤖 AI Skill Gap & Strengths Analysis
          </h3>
          
          <div className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Strengths</span>
              <div className="flex flex-wrap gap-2">
                {aiFeedback.strengths?.map((str: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1 rounded bg-green-500/10 border border-green-500/20 text-green-400 font-medium">
                    ✓ {str}
                  </span>
                ))}
              </div>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Weaknesses</span>
              <div className="flex flex-wrap gap-2">
                {aiFeedback.weaknesses?.map((weak: string, i: number) => (
                  <span key={i} className="text-xs px-3 py-1 rounded bg-red-500/10 border border-red-500/20 text-red-400 font-medium">
                    ⚠ {weak}
                  </span>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Gap Analysis</span>
              <p className="text-sm text-slate-300 leading-relaxed">{aiFeedback.gap_analysis}</p>
            </div>

            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Recommended Steps</span>
              <ul className="space-y-2">
                {aiFeedback.recommended_steps?.map((step: string, i: number) => (
                  <li key={i} className="text-sm text-slate-300 flex items-start gap-2">
                    <span className="text-violet-400 font-bold shrink-0">{i + 1}.</span>
                    <span>{step}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Detailed Question Review */}
        <div className="glass-panel p-6 rounded-2xl space-y-6">
          <h3 className="font-bold text-lg text-white border-b border-slate-800 pb-4">Detailed Question Review</h3>
          <div className="space-y-6">
            {questions.map((q, idx) => {
              const review = results.grading[q.id] || {};
              return (
                <div key={q.id} className="p-4 rounded-xl bg-slate-900/30 border border-slate-800/80 space-y-3">
                  <div className="flex justify-between items-start gap-3">
                    <h4 className="font-bold text-sm text-slate-200">
                      Q{idx + 1}: {q.question_text}
                    </h4>
                    {review.correct ? (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/10 text-green-400 border border-green-500/20 shrink-0">Correct</span>
                    ) : (
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-400 border border-red-500/20 shrink-0">Incorrect</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-2">
                    {q.options.map((opt, oIdx) => {
                      const isUserChoice = opt === review.answer;
                      const isCorrectChoice = opt === review.correctAnswer;
                      return (
                        <div 
                          key={oIdx} 
                          className={`p-2.5 rounded-lg text-xs border ${
                            isCorrectChoice 
                              ? 'bg-green-500/10 border-green-500/30 text-green-400 font-semibold' 
                              : isUserChoice 
                              ? 'bg-red-500/10 border-red-500/30 text-red-400' 
                              : 'bg-slate-800/50 border-slate-700/50 text-slate-400'
                          }`}
                        >
                          {opt}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex justify-center">
          <button onClick={closeQuiz} className="btn-primary px-8">
            Back to Assessment List
          </button>
        </div>
      </div>
    );
  }

  // --- RENDER ACTIVE QUIZ SCREEN ---
  if (activeQuiz && questions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="glass-panel p-6 rounded-2xl flex justify-between items-center border-violet-500/10">
          <div>
            <h2 className="text-xl font-bold text-white">{activeQuiz.title}</h2>
            <p className="text-slate-400 text-xs mt-1">Subject: {activeQuiz.subject} • 5 Questions</p>
          </div>
          <button onClick={closeQuiz} className="text-xs text-red-400 hover:text-red-300 font-semibold cursor-pointer">
            Quit Quiz
          </button>
        </div>

        <div className="space-y-6">
          {questions.map((q, index) => (
            <div key={q.id} className="glass-panel p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-base text-slate-100 flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-violet-600/15 text-violet-400 text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                  {index + 1}
                </span>
                {q.question_text}
              </h3>

              <div className="grid grid-cols-1 gap-2.5">
                {q.options.map((opt, oIdx) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <button
                      key={oIdx}
                      onClick={() => handleSelectAnswer(q.id, opt)}
                      className={`text-left p-3.5 rounded-lg text-sm transition-all duration-200 border cursor-pointer ${
                        isSelected 
                          ? 'bg-violet-600/10 border-violet-500 text-violet-400 font-semibold' 
                          : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:border-slate-650 hover:bg-slate-800'
                      }`}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={handleSubmitQuiz}
          disabled={submitting}
          className="btn-primary w-full py-4 text-base font-semibold shadow-lg shadow-violet-500/15"
        >
          {submitting ? 'Evaluating Assessment Response...' : 'Submit Answers'}
        </button>
      </div>
    );
  }

  // --- RENDER ASSESSMENTS LIST SCREEN ---
  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <BookOpen className="w-8 h-8 text-violet-400" /> Skill Assessment System
        </h2>
        <p className="text-slate-400 mt-2">
          Test your domain competence across DSA, DBMS, and other computer science modules to generate personalized skill gap reports.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {assessments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assessments.map((quiz) => (
            <div key={quiz.id} className="glass-panel p-6 rounded-2xl flex flex-col justify-between hover:scale-[1.01] transition-transform duration-250">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs px-2 py-0.5 rounded font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
                    {quiz.subject}
                  </span>
                  <span className="text-xs text-slate-400 font-semibold">{quiz.question_count || 3} MCQs</span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">{quiz.title}</h3>
                <p className="text-slate-400 text-xs leading-relaxed mb-6">{quiz.description}</p>
              </div>
              <button
                onClick={() => startQuiz(quiz)}
                className="btn-primary w-full text-center py-2.5 text-xs font-semibold cursor-pointer"
              >
                Take Skill Assessment
              </button>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 glass-panel rounded-2xl">
          <HelpCircle className="w-10 h-10 text-slate-500 mx-auto mb-3 animate-pulse" />
          <p className="text-slate-400 text-sm">No assessments currently assigned to your class.</p>
        </div>
      )}
    </div>
  );
}
