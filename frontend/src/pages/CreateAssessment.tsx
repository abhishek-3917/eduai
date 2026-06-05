import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import { FileText, Plus, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';

interface QuestionInput {
  question_text: string;
  options: string[];
  correct_answer: string;
}

export default function CreateAssessment() {
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState('DSA');
  const [questions, setQuestions] = useState<QuestionInput[]>([
    {
      question_text: '',
      options: ['A) ', 'B) ', 'C) ', 'D) '],
      correct_answer: ''
    }
  ]);

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        options: ['A) ', 'B) ', 'C) ', 'D) '],
        correct_answer: ''
      }
    ]);
  };

  const handleRemoveQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  const handleQuestionTextChange = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].question_text = val;
    setQuestions(updated);
  };

  const handleOptionChange = (qIdx: number, oIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].options[oIdx] = val;
    setQuestions(updated);
  };

  const handleCorrectAnswerSelect = (qIdx: number, val: string) => {
    const updated = [...questions];
    updated[qIdx].correct_answer = val;
    setQuestions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subject) return;

    // Validation checks
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      if (!q.question_text.trim()) {
        setErrorMsg(`Question ${i + 1} has empty text.`);
        return;
      }
      if (!q.correct_answer) {
        setErrorMsg(`Please select or write the correct answer for Question ${i + 1}.`);
        return;
      }
    }

    try {
      setLoading(true);
      setErrorMsg('');
      await api.post('/assessments', {
        title,
        description,
        subject,
        questions
      });
      setSuccess(true);
      setTimeout(() => {
        navigate('/dashboard');
      }, 2000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create assessment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-10">
      <div className="glass-panel p-6 rounded-2xl border-violet-500/10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <FileText className="w-8 h-8 text-violet-400" /> Create Assessment Quiz
        </h2>
        <p className="text-slate-400 mt-2">
          Design evaluations to assess students. Evaluations generate automatic grades and feed skill gap recommendations.
        </p>
      </div>

      {success && (
        <div className="p-4 bg-green-500/15 border border-green-500/25 text-green-400 text-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>Assessment created successfully! Redirecting...</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/25 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Basic fields */}
        <div className="glass-panel p-6 rounded-xl space-y-6">
          <h3 className="font-bold text-base text-white border-b border-slate-850 pb-3">Quiz Details</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                Assessment Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems: CPU Scheduling"
                className="w-full text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-2">
                Evaluation Subject
              </label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full"
              >
                <option value="DSA">Data Structures & Algorithms</option>
                <option value="DBMS">Database Management (SQL/DBMS)</option>
                <option value="OOP">Object-Oriented Programming</option>
                <option value="Operating Systems">Operating Systems (OS)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-2">
              Description / Target Audience
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide context about what this quiz evaluates..."
              className="w-full h-24 text-sm"
            />
          </div>
        </div>

        {/* Questions inputs list */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg text-white">Questions list ({questions.length})</h3>
            <button
              type="button"
              onClick={handleAddQuestion}
              className="btn-secondary py-1.5 px-3 text-xs flex items-center gap-1.5 hover:bg-slate-800"
            >
              <Plus className="w-4.5 h-4.5" /> Add Question
            </button>
          </div>

          {questions.map((q, idx) => (
            <div key={idx} className="glass-panel p-6 rounded-xl space-y-4 relative">
              <button
                type="button"
                onClick={() => handleRemoveQuestion(idx)}
                disabled={questions.length === 1}
                className="absolute top-6 right-6 text-slate-500 hover:text-red-400 disabled:opacity-40 disabled:hover:text-slate-500"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <h4 className="font-bold text-sm text-violet-400 uppercase tracking-wider">
                Question {idx + 1}
              </h4>

              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Question Text
                </label>
                <input
                  type="text"
                  required
                  value={q.question_text}
                  onChange={(e) => handleQuestionTextChange(idx, e.target.value)}
                  placeholder="e.g. Which scheduler controls the degree of multiprogramming?"
                  className="w-full text-sm"
                />
              </div>

              {/* Options */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {q.options.map((opt, oIdx) => (
                  <div key={oIdx}>
                    <label className="block text-[9px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
                      Option {String.fromCharCode(65 + oIdx)}
                    </label>
                    <input
                      type="text"
                      required
                      value={opt}
                      onChange={(e) => handleOptionChange(idx, oIdx, e.target.value)}
                      className="w-full text-xs py-1.5"
                    />
                  </div>
                ))}
              </div>

              {/* Correct answer specification */}
              <div>
                <label className="block text-[10px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                  Designate Correct Answer
                </label>
                <select
                  value={q.correct_answer}
                  onChange={(e) => handleCorrectAnswerSelect(idx, e.target.value)}
                  className="w-full text-xs"
                  required
                >
                  <option value="">-- Choose option --</option>
                  {q.options.map((opt, oIdx) => (
                    <option key={oIdx} value={opt}>
                      Option {String.fromCharCode(65 + oIdx)}: {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="btn-primary w-full py-4 text-base font-semibold shadow-lg shadow-violet-500/15"
        >
          {loading ? 'Creating Assessment System...' : 'Create Assessment & Questions'}
        </button>
      </form>
    </div>
  );
}
