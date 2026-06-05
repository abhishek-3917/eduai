import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { Compass, AlertCircle, Calendar, Link2, BookOpen, Send, Sparkles } from 'lucide-react';

interface RoadmapPhase {
  phase: string;
  topics: string[];
  resources: string[];
}

interface RoadmapData {
  id: number;
  career_goal: string;
  current_skills: string[];
  roadmap_data: RoadmapPhase[] | string;
}

export default function Roadmap() {
  const [roadmap, setRoadmap] = useState<RoadmapData | null>(null);
  
  // Generation input states
  const [careerGoal, setCareerGoal] = useState('Full Stack Developer');
  const [skillsText, setSkillsText] = useState('HTML, CSS, basic JavaScript');
  const [generating, setGenerating] = useState(false);
  
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchRoadmap();
  }, []);

  const fetchRoadmap = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/roadmap');
      setRoadmap(res.data);
    } catch (err: any) {
      // 404 is acceptable if not generated yet
      if (err.response?.status !== 404) {
        setErrorMsg('Error loading learning roadmap.');
      }
      setRoadmap(null);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!careerGoal.trim()) return;

    // Parse skills list
    const skillsArray = skillsText
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s.length > 0);

    try {
      setGenerating(true);
      setErrorMsg('');
      const res = await api.post('/roadmap/generate', {
        careerGoal,
        currentSkills: skillsArray
      });
      setRoadmap(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to generate personalized roadmap.');
    } finally {
      setGenerating(false);
    }
  };

  const clearRoadmap = () => {
    setRoadmap(null);
  };

  if (loading && !generating) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Parse roadmap phases
  let phases: RoadmapPhase[] = [];
  if (roadmap) {
    try {
      phases = typeof roadmap.roadmap_data === 'string' 
        ? JSON.parse(roadmap.roadmap_data) 
        : roadmap.roadmap_data;
    } catch (e) {
      console.error('Roadmap parsing error:', e);
    }
  }

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl border-violet-500/10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <Compass className="w-8 h-8 text-violet-400" /> Personalized Learning Roadmap
        </h2>
        <p className="text-slate-400 mt-2">
          Design curriculum pathways based on your career interests and current skills. AI compiles study directions month-by-month.
        </p>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {roadmap ? (
        // --- DISPLAY ROADMAP TIMELINE ---
        <div className="space-y-8">
          <div className="glass-panel p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-900/60 border border-slate-800">
            <div>
              <p className="text-xs font-semibold text-violet-400 uppercase tracking-wider">Active Curriculum</p>
              <h3 className="text-2xl font-bold text-white mt-1">{roadmap.career_goal}</h3>
              <p className="text-slate-400 text-xs mt-2">
                Starting Skills: {Array.isArray(roadmap.current_skills) ? roadmap.current_skills.join(', ') : roadmap.current_skills}
              </p>
            </div>
            <button
              onClick={clearRoadmap}
              className="btn-secondary text-xs py-2 px-4 shrink-0 hover:bg-slate-800"
            >
              Generate New Path
            </button>
          </div>

          {/* Timeline phases */}
          <div className="relative border-l-2 border-slate-800 ml-4 md:ml-8 pl-6 md:pl-10 space-y-12 py-4">
            {phases.map((p, idx) => (
              <div key={idx} className="relative">
                {/* Timeline node dot */}
                <div className="absolute left-[-31px] md:left-[-47px] top-1.5 w-5 h-5 rounded-full bg-violet-600 border-4 border-slate-900 shadow-md shadow-violet-500/20 flex items-center justify-center" />
                
                <div className="glass-panel p-6 rounded-2xl space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="px-2.5 py-1 rounded bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-bold uppercase">
                      Phase {idx + 1}
                    </div>
                    <h4 className="text-lg font-bold text-slate-100">{p.phase}</h4>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    {/* Topics */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Key Concepts & Topics</span>
                      <ul className="space-y-1.5">
                        {p.topics?.map((topic, tIdx) => (
                          <li key={tIdx} className="text-sm text-slate-355 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-violet-400 rounded-full shrink-0" />
                            <span>{topic}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Resources */}
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Recommended Learning Resources</span>
                      <div className="flex flex-col gap-2">
                        {p.resources?.map((res, rIdx) => (
                          <div key={rIdx} className="p-2.5 bg-slate-900/60 rounded border border-slate-800 text-xs flex items-center gap-2 text-slate-300">
                            <Link2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                            <span className="font-medium truncate">{res}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        // --- ROADMAP GENERATOR FORM ---
        <div className="max-w-xl mx-auto glass-panel p-8 rounded-2xl glass-panel-glow">
          <div className="flex items-center gap-2.5 text-violet-400 mb-6">
            <Sparkles className="w-5 h-5 animate-pulse" />
            <span className="font-bold text-sm uppercase tracking-wider">AI Path Assembler</span>
          </div>

          <form onSubmit={handleGenerate} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                What is your career goal?
              </label>
              <select
                value={careerGoal}
                onChange={(e) => setCareerGoal(e.target.value)}
                className="w-full"
              >
                <option value="Software Engineer">Software Engineer (Backend / OS Focus)</option>
                <option value="Full Stack Developer">Full Stack Developer (Web Application Specialist)</option>
                <option value="Data Scientist">Data Scientist (ML / Mathematical Analysis)</option>
                <option value="AI Engineer">AI Engineer (LLM Integration & Prompt Pipelines)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                List your current skills (comma separated)
              </label>
              <textarea
                value={skillsText}
                onChange={(e) => setSkillsText(e.target.value)}
                className="w-full h-24 text-sm"
                placeholder="Python, basic SQL, git, HTML, etc."
                required
              />
              <span className="text-[10px] text-slate-500 block mt-1">
                The AI will use these to skip fundamental courses and concentrate on topics you don't know.
              </span>
            </div>

            <button
              type="submit"
              disabled={generating}
              className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-sm font-semibold"
            >
              {generating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Generating Personalized Roadmap...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Assemble Learning Roadmap
                </>
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
