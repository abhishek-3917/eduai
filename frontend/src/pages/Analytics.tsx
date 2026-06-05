import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BarChart3, AlertCircle, TrendingUp, Clock, Flame, Percent } from 'lucide-react';
import { 
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, 
  LineElement, BarElement, Title, Tooltip, Legend, Filler 
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

// Register components
ChartJS.register(
  CategoryScale, LinearScale, PointElement, LineElement, 
  BarElement, Title, Tooltip, Legend, Filler
);

interface AnalyticEntry {
  study_time_minutes: number;
  completion_rate: number;
  consistency_score: number;
  date: string;
}

export default function Analytics() {
  const [stats, setStats] = useState<AnalyticEntry[]>([]);
  const [summary, setSummary] = useState({
    totalStudyMinutes: 0,
    avgCompletionRate: 0,
    currentStreak: 0,
    completedQuizzes: 0
  });
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      
      const res = await api.get('/analytics');
      setStats(res.data.stats || []);
      setSummary(res.data.summary || {
        totalStudyMinutes: 0,
        avgCompletionRate: 0,
        currentStreak: 0,
        completedQuizzes: 0
      });
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to retrieve academic analytics.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Calculate quick metrics summaries from live backend values
  const totalStudyMinutes = summary.totalStudyMinutes;
  const avgCompletionRate = summary.avgCompletionRate;
  const currentStreak = summary.currentStreak;

  // Chart 1: Study Time Line Chart
  const lineChartData = {
    labels: stats.map(s => s.date),
    datasets: [
      {
        fill: true,
        label: 'Study Time (Minutes)',
        data: stats.map(s => s.study_time_minutes),
        borderColor: '#8B5CF6',
        backgroundColor: 'rgba(139, 92, 246, 0.08)',
        borderWidth: 2,
        tension: 0.35,
        pointBackgroundColor: '#8B5CF6'
      }
    ]
  };

  // Chart 2: Completion Rate Bar Chart
  const barChartData = {
    labels: stats.map(s => s.date),
    datasets: [
      {
        label: 'Quiz Scores (%)',
        data: stats.map(s => s.completion_rate),
        backgroundColor: 'rgba(99, 102, 241, 0.5)',
        borderColor: '#6366F1',
        borderWidth: 1,
        borderRadius: 4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false }
    },
    scales: {
      y: {
        grid: { color: 'rgba(255, 255, 255, 0.04)' },
        ticks: { color: '#94A3B8' }
      },
      x: {
        grid: { display: false },
        ticks: { color: '#94A3B8' }
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl border-violet-500/10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-violet-400" /> Learning Analytics
        </h2>
        <p className="text-slate-400 mt-2">
          Review metrics reflecting your study time allocation, average assessment percentages, and daily learning consistency.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Summary Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Total Weekly Study Time</span>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{totalStudyMinutes} minutes</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20">
            <Percent className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Average Quiz Score</span>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">{avgCompletionRate}%</p>
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/20">
            <Flame className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Streaks / Consistency</span>
            <p className="text-2xl font-bold text-slate-100 mt-0.5">Level {currentStreak}</p>
          </div>
        </div>
      </div>

      {/* Graphs row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <TrendingUp className="w-4 h-4 text-violet-400" /> Study Time Distribution (Daily)
          </h3>
          <div className="h-64 relative">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        <div className="glass-panel p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-slate-850 pb-3">
            <BarChart3 className="w-4 h-4 text-indigo-400" /> Quiz Scoring Performance
          </h3>
          <div className="h-64 relative">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}
