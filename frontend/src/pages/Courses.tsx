import React, { useEffect, useState } from 'react';
import api from '../utils/api';
import { BookOpen, Plus, Trash2, AlertCircle } from 'lucide-react';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor_name?: string;
  created_at: string;
}

export default function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/courses');
      setCourses(res.data);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to load courses.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;

    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await api.post('/courses', { title, description });
      setCourses([res.data, ...courses]);
      setTitle('');
      setDescription('');
      setShowForm(false);
      setSuccessMsg('Course registered successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to create course.');
    }
  };

  const handleDeleteCourse = async (cId: number) => {
    if (!window.confirm('Are you sure you want to delete this course and all associated lessons?')) {
      return;
    }
    
    try {
      setErrorMsg('');
      await api.delete(`/courses/${cId}`);
      setCourses(courses.filter((c) => c.id !== cId));
      setSuccessMsg('Course deleted successfully.');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err) {
      console.error(err);
      setErrorMsg('Failed to delete course.');
    }
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="glass-panel p-6 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-violet-500/10">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-violet-400" /> Syllabus Course Catalog
          </h2>
          <p className="text-slate-400 mt-2">
            Organize course subjects and add training curriculums for user enrollment.
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary text-xs py-2 px-4 flex items-center gap-1 shrink-0 self-start sm:self-center cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Course
        </button>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-500/15 border border-green-500/25 text-green-400 text-xs rounded-lg">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-red-500/15 border border-red-500/25 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Dynamic Course Form */}
      {showForm && (
        <div className="max-w-xl mx-auto glass-panel p-6 rounded-xl animate-fade-in">
          <h3 className="font-bold text-base text-white border-b border-slate-850 pb-3 mb-4">
            Add New Course Syllabus
          </h3>
          <form onSubmit={handleCreateCourse} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                Course Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Operating Systems Architecture"
                className="w-full text-xs py-1.5"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-355 uppercase tracking-wider mb-2">
                Course Description
              </label>
              <textarea
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Detail the modules, objectives, and course material..."
                className="w-full h-24 text-xs"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="btn-secondary text-xs py-1.5 px-3 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button type="submit" className="btn-primary text-xs py-1.5 px-4">
                Save Course
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {courses.map((c) => (
          <div key={c.id} className="glass-panel p-6 rounded-xl flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4 border-b border-slate-850 pb-2">
                <span className="text-[10px] text-slate-500 font-semibold uppercase">
                  Instructor: {c.instructor_name || 'System Admin'}
                </span>
                <button
                  onClick={() => handleDeleteCourse(c.id)}
                  className="text-slate-500 hover:text-red-400 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <h3 className="font-bold text-base text-slate-100">{c.title}</h3>
              <p className="text-slate-400 text-xs mt-3 leading-relaxed mb-6">{c.description}</p>
            </div>
            <div className="text-[10px] text-slate-550 italic">
              Registered on {new Date(c.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
