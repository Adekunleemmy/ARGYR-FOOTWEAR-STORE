import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Loader2 } from 'lucide-react';
import { api } from '../../services/api';
import { useToast } from '../../components/Toast';

export const AdminLogin: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);

  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect to dashboard immediately if already authenticated
  useEffect(() => {
    const verifyAuth = async () => {
      try {
        const res = await api.adminMe();
        if (res.success) {
          navigate('/admin/dashboard', { replace: true });
        }
      } catch (err) {
        // Not authenticated, do nothing
      } finally {
        setCheckingSession(false);
      }
    };
    verifyAuth();
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast("Please fill in both email and password fields.", "error");
      return;
    }

    setLoading(true);
    try {
      const res = await api.adminLogin({ email, password });
      if (res.success) {
        toast("Welcome to ARGYR Console.", "success");
        navigate('/admin/dashboard', { replace: true });
      }
    } catch (err: any) {
      toast(err.message || "Invalid administrative credentials.", "error");
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="flex-1 flex items-center justify-center bg-neutral-100 dark:bg-neutral-950">
        <Loader2 className="animate-spin text-neutral-400" size={32} />
      </div>
    );
  }

  return (
    <div className="flex-1 flex items-center justify-center bg-neutral-100 dark:bg-neutral-950 px-6 py-24">
      <div className="w-full max-w-sm bg-white dark:bg-neutral-900 border-thin p-8 flex flex-col gap-6 shadow-sm">
        
        {/* Header */}
        <div className="flex flex-col items-center gap-2 text-center">
          <div className="w-10 h-10 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 flex items-center justify-center rounded-none">
            <Lock size={16} />
          </div>
          <h1 className="text-xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white mt-1">
            Sign In to Console
          </h1>
          <span className="text-[10px] text-neutral-400 uppercase tracking-widest">
            Authorized admin users only
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@argyr.com"
              className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] uppercase font-bold text-neutral-500">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="bg-transparent border-thin px-4 py-2.5 text-xs text-neutral-900 dark:text-white outline-none w-full"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold hover:opacity-85 transition-opacity flex items-center justify-center gap-2 cursor-pointer w-full"
          >
            {loading ? <Loader2 className="animate-spin" size={14} /> : null}
            <span>Verify Credentials</span>
          </button>
        </form>
      </div>
    </div>
  );
};
