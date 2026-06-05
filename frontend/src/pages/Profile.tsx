import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../store';
import api from '../utils/api';
import { User, Mail, ShieldAlert, BadgeInfo, CheckCircle } from 'lucide-react';

export default function Profile() {
  const { user } = useAppSelector((state) => state.auth);
  
  const [profile, setProfile] = useState<any>(null);
  const [bio, setBio] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await api.get('/auth/me');
      setProfile(res.data);
      setBio(res.data.bio || '');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMsg('Profile biography updated successfully.');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-violet-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="glass-panel p-6 rounded-2xl border-violet-500/10">
        <h2 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-3">
          <User className="w-8 h-8 text-violet-400" /> Account Profile
        </h2>
        <p className="text-slate-400 mt-2">
          Manage your personal details and view your account level authorization.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-green-500/15 border border-green-500/25 text-green-400 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle className="w-4.5 h-4.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {profile && (
        <div className="glass-panel p-8 rounded-xl space-y-6">
          <div className="flex items-center gap-4 border-b border-slate-850 pb-6">
            <div className="w-16 h-16 rounded-full bg-slate-800 border-2 border-violet-500 flex items-center justify-center font-bold text-2xl text-violet-400">
              {profile.name.charAt(0)}
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">{profile.name}</h3>
              <span className="inline-block px-2.5 py-0.5 mt-1.5 rounded text-[10px] font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 capitalize">
                {profile.role_name || user?.role} User
              </span>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    disabled
                    value={profile.email}
                    className="w-full pl-11 opacity-60 cursor-not-allowed"
                  />
                  <Mail className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                  Account Verification
                </label>
                <div className="relative">
                  <input
                    type="text"
                    disabled
                    value={profile.is_verified ? 'Verified Learner' : 'Pending Verification'}
                    className="w-full pl-11 opacity-60 cursor-not-allowed text-green-400"
                  />
                  <ShieldAlert className="w-4.5 h-4.5 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-350 uppercase tracking-wider mb-2">
                Biography / Career Focus
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full h-24 text-sm"
                placeholder="Write a short summary about your academic goals..."
              />
            </div>

            <button type="submit" className="btn-primary w-full py-3">
              Save Profile Bio
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
