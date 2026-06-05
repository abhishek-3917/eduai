import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAppSelector, useAppDispatch } from '../store';
import { logout } from '../store/authSlice';
import { 
  LayoutDashboard, BookOpen, Compass, MessageSquare, 
  Calendar, Briefcase, FileText, BarChart3, Shield, 
  LogOut, Menu, X, User as UserIcon
} from 'lucide-react';

interface SidebarLink {
  name: string;
  path: string;
  icon: React.ComponentType<any>;
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user } = useAppSelector((state) => state.auth);
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    dispatch(logout());
    navigate('/login');
  };

  // Define links based on Role
  let links: SidebarLink[] = [];

  if (user.role === 'student') {
    links = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Assessments', path: '/assessments', icon: BookOpen },
      { name: 'Roadmap', path: '/roadmap', icon: Compass },
      { name: 'AI Tutor', path: '/tutor', icon: MessageSquare },
      { name: 'Study Planner', path: '/planner', icon: Calendar },
      { name: 'Career Guidance', path: '/career', icon: Briefcase },
      { name: 'AI Notes', path: '/notes', icon: FileText },
      { name: 'Analytics', path: '/analytics', icon: BarChart3 }
    ];
  } else if (user.role === 'teacher') {
    links = [
      { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
      { name: 'Manage Courses', path: '/courses', icon: BookOpen },
      { name: 'Create Assessments', path: '/create-assessment', icon: FileText },
    ];
  } else if (user.role === 'admin') {
    links = [
      { name: 'Admin Dashboard', path: '/dashboard', icon: Shield },
      { name: 'Manage Users', path: '/admin-users', icon: UserIcon },
    ];
  }

  // Common links
  links.push({ name: 'My Profile', path: '/profile', icon: UserIcon });

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-950/80 border-r border-slate-800 text-slate-200">
      {/* Title */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3">
        <div className="w-9 h-9 rounded-lg bg-violet-600 flex items-center justify-center font-bold text-lg text-white shadow-lg shadow-violet-500/25">
          E
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight text-white">EduAI</h1>
          <span className="text-[10px] text-violet-400 font-semibold uppercase tracking-wider">Learning Hub</span>
        </div>
      </div>

      {/* User profile segment */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3 bg-slate-900/40">
        <div className="w-10 h-10 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-semibold text-violet-400">
          {user.name.charAt(0)}
        </div>
        <div className="overflow-hidden">
          <p className="font-semibold text-sm truncate text-slate-100">{user.name}</p>
          <span className="inline-block px-2 py-0.5 mt-0.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
            {user.role}
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
        {links.map((link) => {
          const isActive = location.pathname === link.path;
          const Icon = link.icon;
          return (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive 
                  ? 'bg-violet-600 text-white shadow-md shadow-violet-500/15' 
                  : 'text-slate-400 hover:text-slate-100 hover:bg-slate-900/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {link.name}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-sm font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all duration-200 cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          Logout
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-950 text-slate-100">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 fixed h-full z-20">
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 md:pl-64 flex flex-col min-h-screen">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 bg-slate-900 border-b border-slate-800 sticky top-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-violet-600 flex items-center justify-center font-bold text-white">
              E
            </div>
            <h1 className="font-bold text-lg text-white">EduAI</h1>
          </div>
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 text-slate-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </header>

        {/* Mobile Sidebar overlay */}
        {mobileOpen && (
          <div className="md:hidden fixed inset-0 z-40 flex">
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
            <aside className="relative w-64 h-full flex flex-col z-50">
              <SidebarContent />
            </aside>
          </div>
        )}

        {/* Dynamic page content */}
        <main className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
