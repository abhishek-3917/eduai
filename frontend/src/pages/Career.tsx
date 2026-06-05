import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Briefcase, AlertCircle, Sparkles, Send, GraduationCap, DollarSign, TrendingUp } from 'lucide-react';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface CareerAdviceItem {
  career: string;
  description: string;
  similarity_score: number;
  salary_insights: Record<string, string>;
  growth_rate: string;
  required_skills: string[];
  missing_skills: string[];
  details: string;
}

export default function Career() {
  const [recommendations, setRecommendations] = useState<CareerAdviceItem[]>([]);
  const [skillsText, setSkillsText] = useState('Python, SQL, database normalization, basic git');
  const [interestsText, setInterestsText] = useState('Data structures, algorithms, building web endpoints');
  
  const [evaluating, setEvaluating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/career');
      // Set to state if there is history
      if (res.data.length > 0) {
        // Group raw records into CareerAdviceItem structure
        const formatted = res.data.map((r: any) => ({
          career: r.recommended_career,
          description: '',
          similarity_score: parseFloat(r.similarity_score),
          salary_insights: typeof r.salary_insights === 'string' ? JSON.parse(r.salary_insights) : r.salary_insights,
          growth_rate: 'High',
          required_skills: typeof r.required_skills === 'string' ? JSON.parse(r.required_skills) : r.required_skills,
          missing_skills: [],
          details: r.details
        }));
        setRecommendations(formatted);
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load career assessment history.');
    } finally {
      setLoading(false);
    }
  };

  const handleEvaluate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!skillsText.trim() || !interestsText.trim()) return;

    const skillsArray = skillsText.split(',').map((s) => s.trim()).filter((s) => s.length > 0);
    const interestsArray = interestsText.split(',').map((s) => s.trim()).filter((s) => s.length > 0);

    try {
      setEvaluating(true);
      setErrorMsg('');
      const res = await api.post('/career/evaluate', {
        skills: skillsArray,
        interests: interestsArray
      });
      setRecommendations(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to process career recommendations.');
    } finally {
      setEvaluating(false);
    }
  };

  const clearRecommendations = () => {
    setRecommendations([]);
  };

  if (loading && !evaluating) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Set up chart data
  const chartLabels = recommendations.map((r) => r.career);
  const chartScores = recommendations.map((r) => Math.round(r.similarity_score * 100));

  const chartData = {
    labels: chartLabels,
    datasets: [
      {
        label: 'Career Match Score (%)',
        data: chartScores,
        backgroundColor: 'rgba(139, 92, 246, 0.45)',
        borderColor: '#8B5CF6',
        borderWidth: 1,
        borderRadius: 6,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(255, 255, 255, 0.05)',
        },
        ticks: {
          color: '#94A3B8',
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#94A3B8',
        },
      },
    },
  };

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl border-violet-500/10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Briefcase className="w-8 h-8 text-violet-400" /> Career Guidance System
        </h2>
        <p className="text-slate-400 mt-2">
          Discover optimal tech careers. A TF-IDF similarity model checks your skills against developer profiles, and Gemini drafts career plans.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {recommendations.length > 0 ? (
        // --- DISPLAY RECOMMENDATIONS REPORT ---
        <div className="space-y-8 animate-fade-in">
          <div className="flex justify-between items-center bg-slate-900/40 p-4 rounded-xl border border-slate-800">
            <div>
              <span className="text-xs text-violet-400 font-semibold uppercase">Primary Profile Match</span>
              <h3 className="text-lg font-bold text-slate-100">{recommendations[0].career}</h3>
            </div>
            <button onClick={clearRecommendations} className="btn-secondary text-xs py-2 px-4 hover:bg-slate-800">
              Evaluate Again
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Recommendations detail list */}
            <div className="lg:col-span-2 space-y-6">
              <h3 className="font-bold text-lg text-white">Recommended Pathways</h3>
              
              <div className="space-y-6">
                {recommendations.map((rec, idx) => (
                  <div key={idx} className="glass-panel p-6 rounded-xl space-y-4">
                    <div className="flex justify-between items-start gap-4">
                      <div>
                        <h4 className="text-xl font-bold text-slate-150">{rec.career}</h4>
                        <p className="text-slate-405 text-xs mt-1 leading-relaxed">{rec.description}</p>
                      </div>
                      <span className="text-sm font-extrabold text-violet-400 bg-violet-500/10 px-3 py-1 rounded-lg border border-violet-500/20 shrink-0">
                        {Math.round(rec.similarity_score * 100)}% Match
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-900/60 rounded border border-slate-850 flex items-center gap-2.5">
                        <DollarSign className="w-4 h-4 text-violet-400" />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Avg Salary</span>
                          <span className="text-xs font-bold text-slate-200">{rec.salary_insights?.avg || '$110,000'}</span>
                        </div>
                      </div>
                      <div className="p-3 bg-slate-900/60 rounded border border-slate-850 flex items-center gap-2.5">
                        <TrendingUp className="w-4 h-4 text-violet-400" />
                        <div>
                          <span className="text-[10px] text-slate-500 block uppercase">Growth Rate</span>
                          <span className="text-xs font-bold text-slate-200">{rec.growth_rate || 'High'}</span>
                        </div>
                      </div>
                    </div>

                    {rec.missing_skills?.length > 0 && (
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-2">Skills to Acquire</span>
                        <div className="flex flex-wrap gap-1.5">
                          {rec.missing_skills.map((s) => (
                            <span key={s} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="p-4 rounded-xl bg-slate-900/40 border border-slate-800/80">
                      <span className="text-xs font-bold text-violet-400 flex items-center gap-1 mb-2">
                        <Sparkles className="w-4 h-4" /> AI Counselor Advice
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">{rec.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual matches graph */}
            <div className="space-y-6">
              <div className="glass-panel p-6 rounded-xl">
                <h3 className="font-bold text-lg text-white mb-6 border-b border-slate-850 pb-4">
                  Match Profile Visualizer
                </h3>
                
                <div className="h-64 relative">
                  <Bar data={chartData} options={chartOptions} />
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        // --- INPUT ASSESSMENT FORM ---
        <div className="max-w-xl mx-auto glass-panel p-8 rounded-2xl glass-panel-glow">
          <div className="flex items-center gap-2.5 text-violet-400 mb-6">
            <GraduationCap className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm uppercase tracking-wider">Profile Assessment Form</span>
          </div>

          <form onSubmit={handleEvaluate} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                What are your current programming/technical skills?
              </label>
              <textarea
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full h-24 text-sm"
                placeholder="Python, Git, SQL, C++, HTML, basic JavaScript, etc."
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                What are your academic/technical interests?
              </label>
              <textarea
                value={interestsText}
                onChange={(e) => setInterestsText(e.target.value)}
                className="w-full h-24 text-sm"
                placeholder="Machine learning, databases, process scheduling, interface design, web apps"
                required
              />
            </div>

            <button
              type="submit"
              disabled={evaluating}
              className="btn-primary w-full py-3.5 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {evaluating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Analyzing profile similarity...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Evaluate Career Alignment
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
