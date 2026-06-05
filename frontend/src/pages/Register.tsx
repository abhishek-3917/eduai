import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../store';
import { loginStart, loginSuccess, loginFailure } from '../store/authSlice';
import api from '../utils/api';
import { Mail, Lock, User as UserIcon, ShieldCheck } from 'lucide-react';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { loading } = useAppSelector((state) => state.auth);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    dispatch(loginStart());

    try {
      const res = await api.post('/auth/register', { name, email, password });
      dispatch(loginSuccess({
        user: res.data.user,
        token: res.data.token
      }));
      navigate('/dashboard');
    } catch (err: any) {
      dispatch(loginFailure());
      setErrorMsg(err.response?.data?.message || 'Registration failed. Try a different email.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background radial glows */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-violet-600/10 blur-[100px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-600/10 blur-[100px]" />

      <div className="w-full max-w-md glass-panel p-8 rounded-2xl glass-panel-glow relative z-10">
        {/* Brand */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-violet-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-violet-500/20 mb-3">
            E
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create Account</h2>
          <p className="text-slate-400 text-sm mt-1">Start your AI personalized learning path</p>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-500/15 border border-red-500/25 rounded-lg flex items-start gap-3 text-red-400 text-xs">
            <Lock className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-11"
                placeholder="John Doe"
              />
              <UserIcon className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-11"
                placeholder="you@domain.com"
              />
              <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-11"
                placeholder="Minimum 6 characters"
              />
              <Lock className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 rounded bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
            <ShieldCheck className="w-4.5 h-4.5 text-violet-400 shrink-0" />
            <span>Accounts are registered with the standard student learning role.</span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full py-3 mt-6 flex items-center justify-center gap-2"
          >
            {loading ? 'Creating Account...' : 'Register'}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-400">
          Already registered?{' '}
          <Link to="/login" className="text-violet-400 hover:text-violet-300 font-semibold transition-colors">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
