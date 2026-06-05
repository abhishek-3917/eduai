import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Calendar, AlertCircle, Clock, Plus, Trash2, Send, CheckSquare } from 'lucide-react';

interface SessionItem {
  time: string;
  subject: string;
  goal: string;
}

interface DayPlan {
  day: string;
  sessions: SessionItem[];
}

interface StudyPlan {
  id: number;
  subjects: string[];
  available_hours: number;
  exam_dates: Record<string, string>;
  schedule_data: {
    weekly_schedule: DayPlan[];
    daily_goals: string[];
  } | string;
}

export default function Planner() {
  const [studyPlan, setStudyPlan] = useState<StudyPlan | null>(null);
  
  // Generation input states
  const [subjectsList, setSubjectsList] = useState<string[]>(['DSA', 'DBMS']);
  const [newSubject, setNewSubject] = useState('');
  const [availableHours, setAvailableHours] = useState(12);
  
  // Exam dates state
  const [examDates, setExamDates] = useState<Record<string, string>>({
    'DSA': new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  });

  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchStudyPlan();
  }, []);

  const fetchStudyPlan = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/planner');
      setStudyPlan(res.data);
    } catch (err: any) {
      if (err.response?.status !== 404) {
        setErrorMsg('Error loading study plan.');
      }
      setStudyPlan(null);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSubject = () => {
    if (!newSubject.trim()) return;
    if (subjectsList.includes(newSubject)) return;
    setSubjectsList([...subjectsList, newSubject]);
    setNewSubject('');
  };

  const handleRemoveSubject = (sub: string) => {
    setSubjectsList(subjectsList.filter((s) => s !== sub));
    const newDates = { ...examDates };
    delete newDates[sub];
    setExamDates(newDates);
  };

  const handleExamDateChange = (sub: string, dateStr: string) => {
    setExamDates({ ...examDates, [sub]: dateStr });
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subjectsList.length === 0) {
      setErrorMsg('Please select or write at least one subject to study.');
      return;
    }

    try {
      setGenerating(true);
      setErrorMsg('');
      const res = await api.post('/planner/generate', {
        subjects: subjectsList,
        availableHours,
        examDates
      });
      setStudyPlan(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to compile your study calendar.');
    } finally {
      setGenerating(false);
    }
  };

  const resetPlanner = () => {
    setStudyPlan(null);
  };

  if (loading && !generating) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Parse schedule data
  let schedule: DayPlan[] = [];
  let dailyGoals: string[] = [];
  if (studyPlan) {
    try {
      const parsedData = typeof studyPlan.schedule_data === 'string'
        ? JSON.parse(studyPlan.schedule_data)
        : studyPlan.schedule_data;
      schedule = parsedData.weekly_schedule || [];
      dailyGoals = parsedData.daily_goals || [];
    } catch (e) {
      console.error('Study plan parsing error:', e);
    }
  }

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl border-violet-500/10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Calendar className="w-8 h-8 text-violet-400" /> Study Planner & Timetable
        </h2>
        <p className="text-slate-400 mt-2">
          Compile custom hourly study schedules based on exam dates and available weekly study hours.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {studyPlan ? (
        // --- DISPLAY STUDY PLAN SCHEDULE ---
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div>
              <p className="text-xs text-violet-400 font-semibold uppercase">Weekly Allocated Hours</p>
              <h3 className="text-lg font-bold text-slate-100">{studyPlan.available_hours} Hours / Week</h3>
            </div>
            <button onClick={resetPlanner} className="btn-secondary text-xs py-2 px-4 hover:bg-slate-800">
              Create New Schedule
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Calendar grid */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Clock className="w-5 h-5 text-violet-400" /> Hourly Study Calendar
              </h3>
              
              <div className="space-y-4">
                {schedule.map((dayPlan, dIdx) => (
                  <div key={dIdx} className="glass-panel p-5 rounded-xl border border-slate-800/80">
                    <h4 className="font-bold text-sm text-violet-400 uppercase tracking-wider mb-4">
                      {dayPlan.day}
                    </h4>
                    
                    <div className="space-y-3">
                      {dayPlan.sessions?.map((session, sIdx) => (
                        <div key={sIdx} className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-900/60 rounded-lg border border-slate-800/60 gap-3">
                          <div className="flex items-center gap-3">
                            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-400 font-mono">
                              {session.time}
                            </span>
                            <span className="text-sm font-bold text-slate-200">
                              {session.subject}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            Goal: {session.goal}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Daily goals & revision suggestions */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-xl">
                <h3 className="font-bold text-lg text-white flex items-center gap-2 border-b border-slate-850 pb-4 mb-4">
                  <CheckSquare className="w-5 h-5 text-indigo-400" /> Daily Focus & Goals
                </h3>
                
                <ul className="space-y-3.5">
                  {dailyGoals.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-300">
                      <span className="w-1.5 h-1.5 bg-violet-500 rounded-full shrink-0 mt-2" />
                      <span>{goal}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- TIMETABLE BUILDER FORM ---
        <div className="max-w-xl mx-auto glass-panel p-8 rounded-2xl glass-panel-glow">
          <form onSubmit={handleGenerate} className="space-y-6">
            {/* Subjects Selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Syllabus Subjects to study
              </label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="e.g. Computer Networks"
                  className="flex-1 text-sm py-1.5"
                />
                <button
                  type="button"
                  onClick={handleAddSubject}
                  className="btn-primary py-2 px-3 text-xs flex items-center gap-1 shrink-0"
                >
                  <Plus className="w-4 h-4" /> Add
                </button>
              </div>

              {/* Tags list */}
              <div className="flex flex-wrap gap-2">
                {subjectsList.map((sub) => (
                  <span key={sub} className="inline-flex items-center gap-1 px-3 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-medium text-slate-300">
                    {sub}
                    <button type="button" onClick={() => handleRemoveSubject(sub)} className="text-slate-500 hover:text-red-400">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Weekly study time hours selection */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                Available Study Hours (per week): <span className="text-violet-400 font-bold">{availableHours} hrs</span>
              </label>
              <input
                type="range"
                min="5"
                max="40"
                value={availableHours}
                onChange={(e) => setAvailableHours(parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-violet-500"
              />
            </div>

            {/* Exam deadlines */}
            {subjectsList.length > 0 && (
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-2">
                  Target Exam Deadlines
                </label>
                <div className="grid grid-cols-1 gap-3">
                  {subjectsList.map((sub) => (
                    <div key={sub} className="flex items-center justify-between gap-4 p-2.5 bg-slate-900/40 rounded border border-slate-850">
                      <span className="text-xs font-bold text-slate-200">{sub}</span>
                      <input
                        type="date"
                        value={examDates[sub] || ''}
                        onChange={(e) => handleExamDateChange(sub, e.target.value)}
                        className="text-xs p-1 bg-slate-800 text-slate-100 rounded"
                        required
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={generating}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Compiling weekly study plan...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Generate Timetable Schedule
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
