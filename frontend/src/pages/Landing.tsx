import React from 'react';
import { Link } from 'react-router-dom';
import { 
  BrainCircuit, GraduationCap, Compass, 
  Sparkles, Calendar, BarChart3, ChevronRight 
} from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col overflow-hidden relative">
      {/* Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-600/10 blur-[120px]" />

      {/* Navbar */}
      <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between border-b border-slate-800/40 relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-violet-500/25">
            E
          </div>
          <span className="font-extrabold text-2xl tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
            EduAI
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login" className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-all duration-200">
            Sign In
          </Link>
          <Link to="/register" className="btn-primary px-5 py-2 text-sm font-semibold">
            Get Started
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 max-w-7xl mx-auto px-6 py-20 md:py-32 flex flex-col items-center justify-center text-center relative z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-xs font-semibold uppercase tracking-wider mb-6 animate-pulse-slow">
          <Sparkles className="w-3.5 h-3.5" /> Empowering Personalized Education
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Unlock Your Potential with{' '}
          <span className="bg-gradient-to-r from-violet-400 via-indigo-400 to-pink-400 bg-clip-text text-transparent">
            AI-Driven Learning
          </span>
        </h1>
        
        <p className="max-w-2xl text-slate-400 text-lg md:text-xl mb-10 leading-relaxed">
          EduAI analyzes your skills, crafts customized study roadmaps, provides instant tutoring, and evaluates career trajectories to design your optimal educational journey.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Link to="/register" className="btn-primary text-base px-8 py-3.5 flex items-center gap-2">
            Start Learning Free <ChevronRight className="w-5 h-5" />
          </Link>
          <Link to="/login" className="btn-secondary text-base px-8 py-3.5 hover:bg-slate-800/40">
            Sign In to Dashboard
          </Link>
        </div>

        {/* Feature Cards Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-24">
          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-violet-500/10 flex items-center justify-center text-violet-400 border border-violet-500/20 mb-6">
              <BrainCircuit className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Interactive AI Tutor</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Ask questions on complex Computer Science topics, debug programs, and generate code examples in real-time.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-400 border border-indigo-500/20 mb-6">
              <Compass className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Dynamic Roadmaps</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Input career pathways to assemble month-by-month curricula with targeted learning tasks and resources.
            </p>
          </div>

          <div className="glass-panel p-8 rounded-2xl flex flex-col items-center text-center hover:scale-[1.02] transition-transform duration-300">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 flex items-center justify-center text-pink-400 border border-pink-500/20 mb-6">
              <GraduationCap className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-white">Skill Gap Analysis</h3>
            <p className="text-slate-400 text-sm leading-relaxed">
              Take evaluations to auto-score performance, charting strengths, weaknesses, and direct steps to bridge gaps.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-8 text-center text-xs text-slate-500 border-t border-slate-800/40 relative z-10 bg-slate-950">
        &copy; {new Date().getFullYear()} EduAI Platform. Developed for personalized skill acquisition.
      </footer>
    </div>
  );
}
