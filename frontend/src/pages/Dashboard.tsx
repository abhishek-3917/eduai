import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppSelector } from '../store';
import api from '../utils/api';
import { 
  Trophy, Flame, Clock, Compass, 
  Calendar, BookOpen, UserPlus, Users, 
  Activity, ShieldAlert, ChevronRight, Bell 
} from 'lucide-react';

interface StudentStats {
  study_time_minutes: number;
  consistency_score: number;
  completed_quizzes: number;
}

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export default function Dashboard() {
  const { user } = useAppSelector((state) => state.auth);
  const navigate = useNavigate();
  
  // States
  const [studentStats, setStudentStats] = useState<StudentStats>({ study_time_minutes: 0, consistency_score: 0, completed_quizzes: 0 });
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [activeRoadmap, setActiveRoadmap] = useState<any>(null);
  const [avgScore, setAvgScore] = useState<number>(0);
  
  // Teacher States
  const [courses, setCourses] = useState<any[]>([]);
  
  // Admin States
  const [adminStats, setAdminStats] = useState<any>(null);
  const [usersList, setUsersList] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        if (user.role === 'student') {
          // Fetch student stats from live analytics endpoint
          const statsRes = await api.get('/analytics');
          const { summary } = statsRes.data || {};
          
          setStudentStats({
            study_time_minutes: summary ? summary.totalStudyMinutes : 0,
            consistency_score: summary ? summary.currentStreak : 0,
            completed_quizzes: summary ? summary.completedQuizzes : 0
          });
          setAvgScore(summary ? summary.avgCompletionRate : 0);

          // Fetch real notifications
          const notificationsRes = await api.get('/notifications');
          let fetchedNotifications = notificationsRes.data || [];
          if (fetchedNotifications.length === 0) {
            fetchedNotifications = [
              {
                id: 1,
                title: 'Welcome to EduAI! 🚀',
                message: 'Start your learning journey by generating your custom study schedule or asking the AI Tutor a question!',
                is_read: false,
                created_at: new Date().toISOString()
              }
            ];
          }
          setNotifications(fetchedNotifications);

          // Proactively mark notifications as read if any are unread
          if (notificationsRes.data && notificationsRes.data.some((n: any) => !n.is_read)) {
            api.put('/notifications/read').catch(err => console.error('Error marking notifications read:', err));
          }

          // Fetch active roadmap
          try {
            const roadmapRes = await api.get('/roadmap');
            setActiveRoadmap(roadmapRes.data);
          } catch (roadmapErr) {
            setActiveRoadmap(null);
          }

        } else if (user.role === 'teacher') {
          // Fetch courses created
          const coursesRes = await api.get('/courses');
          setCourses(coursesRes.data);
        } else if (user.role === 'admin') {
          // Fetch admin platform statistics
          const statsRes = await api.get('/admin/stats');
          setAdminStats(statsRes.data.stats);
          setUsersList(statsRes.data.users);
        }
      } catch (err) {
        console.error('Error fetching dashboard details:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // --- RENDER STUDENT DASHBOARD ---
  if (user?.role === 'student') {
    return (
      <div className="space-y-8">
        {/* Welcome Section */}
        <div className="glass-panel p-6 rounded-2xl glass-panel-glow border-violet-500/10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl font-extrabold text-white tracking-tight">
              Hello, {user.name}! 👋
            </h2>
            <p className="text-slate-400 mt-2 max-w-xl">
              Ready to expand your skillset today? Your AI Tutor and study schedules are set to support your curriculum milestones.
            </p>
          </div>
          <div className="flex items-center gap-4 bg-slate-900/60 p-4 rounded-xl border border-slate-800 shrink-0">
            <Trophy className="w-10 h-10 text-yellow-500" />
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Score Rank</p>
              <p className="text-xl font-bold text-slate-200">
                {avgScore >= 85 ? 'Advanced Learner' : avgScore >= 60 ? 'Intermediate Learner' : 'Beginner Learner'}
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Consistency</span>
              <p className="text-2xl font-bold text-white mt-1">{studentStats.consistency_score} Streaks</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-500 border border-violet-500/20">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Minutes Spent</span>
              <p className="text-2xl font-bold text-white mt-1">{studentStats.study_time_minutes} mins</p>
            </div>
          </div>

          <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 border border-indigo-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Evaluations Done</span>
              <p className="text-2xl font-bold text-white mt-1">{studentStats.completed_quizzes} Quizzes</p>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Active Roadmap & Checklist */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-panel p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Compass className="w-5 h-5 text-violet-400" /> Active Learning Roadmap
                </h3>
                {activeRoadmap && (
                  <Link to="/roadmap" className="text-xs text-violet-400 hover:text-violet-300 font-semibold flex items-center gap-1">
                    View Full Path <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>

              {activeRoadmap ? (
                <div className="space-y-4">
                  <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Target Goal</p>
                    <h4 className="text-lg font-bold text-white mt-1">{activeRoadmap.career_goal}</h4>
                  </div>

                  <div className="space-y-3">
                    {activeRoadmap.roadmap_data && JSON.parse(JSON.stringify(activeRoadmap.roadmap_data)).slice(0, 2).map((phase: any, i: number) => (
                      <div key={i} className="flex gap-3 items-start p-3 bg-slate-900/30 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-violet-600/15 border border-violet-500/30 flex items-center justify-center text-xs font-bold text-violet-400 shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <div>
                          <h5 className="font-bold text-sm text-slate-200">{phase.phase}</h5>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {phase.topics && phase.topics.slice(0, 3).map((topic: string, tIdx: number) => (
                              <span key={tIdx} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                                {topic}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-10">
                  <p className="text-slate-400 text-sm mb-6">You haven't initialized an AI learning roadmap yet.</p>
                  <Link to="/roadmap" className="btn-primary inline-flex items-center gap-2 text-sm">
                    Generate Learning Roadmap
                  </Link>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
              <Link to="/tutor" className="glass-panel p-6 rounded-2xl hover:bg-slate-800/40 transition-colors flex flex-col justify-between h-32">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">AI Tutoring</span>
                <span className="font-bold text-white text-base">Ask questions & code explanations &rarr;</span>
              </Link>
              <Link to="/planner" className="glass-panel p-6 rounded-2xl hover:bg-slate-800/40 transition-colors flex flex-col justify-between h-32">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Study Timetable</span>
                <span className="font-bold text-white text-base">Generate daily study targets &rarr;</span>
              </Link>
            </div>
          </div>

          {/* Notifications / Alerts Sidebar */}
          <div className="space-y-6">
            <div className="glass-panel p-6 rounded-2xl h-full">
              <h3 className="font-bold text-lg text-white flex items-center gap-2 mb-6 border-b border-slate-800 pb-4">
                <Bell className="w-5 h-5 text-indigo-400" /> Notifications & Alerts
              </h3>
              <div className="space-y-4">
                {notifications.map((n) => (
                  <div key={n.id} className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs relative overflow-hidden">
                    {!n.is_read && <span className="absolute top-2 right-2 w-2 h-2 bg-violet-500 rounded-full animate-ping" />}
                    <h5 className="font-bold text-slate-200 mb-1">{n.title}</h5>
                    <p className="text-slate-400 leading-relaxed">{n.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER TEACHER DASHBOARD ---
  if (user?.role === 'teacher') {
    return (
      <div className="space-y-8">
        <div className="glass-panel p-6 rounded-2xl">
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Instructor Control Dashboard</h2>
          <p className="text-slate-400 mt-2">Manage student assignments, design learning materials, and view score completions.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="glass-panel p-6 rounded-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="font-bold text-lg text-white">Your Created Courses</h3>
              <Link to="/courses" className="btn-primary text-xs py-1.5 px-3">Manage</Link>
            </div>
            
            {courses.length > 0 ? (
              <div className="space-y-3">
                {courses.map((c) => (
                  <div key={c.id} className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div>
                      <h4 className="font-bold text-slate-100">{c.title}</h4>
                      <p className="text-slate-400 text-xs mt-1 truncate max-w-xs">{c.description}</p>
                    </div>
                    <BookOpen className="w-5 h-5 text-violet-400" />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-sm py-6 text-center">No courses created yet.</p>
            )}
          </div>

          <div className="glass-panel p-6 rounded-2xl flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-white border-b border-slate-800 pb-4">Quick Shortcuts</h3>
              <p className="text-slate-400 text-sm mt-3 leading-relaxed">
                As a teacher, you can build mock evaluation tests with predefined MCQ solutions. Students can attempt these evaluations and automatically get ranked using AI evaluation logs.
              </p>
            </div>
            <div className="space-y-3 mt-6">
              <Link to="/create-assessment" className="btn-primary w-full block text-center py-3">
                Create New Assessment Quiz
              </Link>
              <Link to="/courses" className="btn-secondary w-full block text-center py-3">
                Manage Course Syllabus
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER ADMIN DASHBOARD ---
  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl">
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Admin System Dashboard</h2>
        <p className="text-slate-400 mt-2">Monitor container deployments, user privileges, and AI API credit transactions.</p>
      </div>

      {/* Admin stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <Users className="w-8 h-8 text-violet-400" />
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Total Users</span>
            <span className="text-xl font-bold text-slate-200">{adminStats?.totalUsers || 0}</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <Activity className="w-8 h-8 text-indigo-400" />
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Active Users</span>
            <span className="text-xl font-bold text-slate-200">{adminStats?.activeUsers || 0}</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <BookOpen className="w-8 h-8 text-pink-400" />
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Courses Hosted</span>
            <span className="text-xl font-bold text-slate-200">{adminStats?.totalCourses || 0}</span>
          </div>
        </div>
        <div className="glass-panel p-6 rounded-2xl flex items-center gap-4">
          <Trophy className="w-8 h-8 text-yellow-500" />
          <div>
            <span className="text-xs text-slate-400 font-semibold block uppercase">Quiz Submissions</span>
            <span className="text-xl font-bold text-slate-200">{adminStats?.totalAttempts || 0}</span>
          </div>
        </div>
      </div>

      {/* Users table */}
      <div className="glass-panel p-6 rounded-2xl">
        <h3 className="font-bold text-lg text-white mb-6 border-b border-slate-800 pb-4">Manage Platform Users</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-400 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-200 font-semibold">
                <th className="py-3 px-4">User ID</th>
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Privilege Role</th>
                <th className="py-3 px-4">Joined Date</th>
              </tr>
            </thead>
            <tbody>
              {usersList.map((usr) => (
                <tr key={usr.id} className="border-b border-slate-800/40 hover:bg-slate-900/20">
                  <td className="py-3 px-4 text-violet-400 font-mono">#{usr.id}</td>
                  <td className="py-3 px-4 text-slate-200 font-semibold">{usr.name}</td>
                  <td className="py-3 px-4">{usr.email}</td>
                  <td className="py-3 px-4">
                    <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold capitalize ${
                      usr.role === 'admin' 
                        ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' 
                        : usr.role === 'teacher' 
                        ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' 
                        : 'bg-violet-500/10 text-violet-400 border border-violet-500/20'
                    }`}>
                      {usr.role}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs">{new Date(usr.created_at).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
