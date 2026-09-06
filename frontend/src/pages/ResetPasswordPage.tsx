import React, { useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';
import { useToast } from '../components/Toast';
import { PageTransition } from '../components/PageTransition';

export const ResetPasswordPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';
  const email = searchParams.get('email') || '';
  const { toast } = useToast();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !email) {
      toast("Invalid or missing password reset link parameters.", "error");
      return;
    }
    if (password.length < 8) {
      toast("Password must be at least 8 characters long.", "error");
      return;
    }
    if (password !== confirmPassword) {
      toast("Passwords do not match.", "error");
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.customerResetPassword({
        email,
        token,
        password,
        confirmPassword
      });
      if (res.success) {
        setSuccess(true);
        toast("Your password has been successfully updated.", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to reset password. The link may have expired.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (success) {
    return (
      <PageTransition>
        <div className="max-w-md mx-auto px-6 py-24 text-center flex flex-col items-center gap-6">
          <div className="w-16 h-16 rounded-full bg-green-500/10 text-green-500 flex items-center justify-center">
            <CheckCircle2 size={32} />
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-wider text-neutral-900 dark:text-white">
            Password Updated
          </h1>
          <p className="text-sm text-neutral-500">
            Your ARGYR customer password has been reset securely. You can now sign in with your new credentials.
          </p>
          <Link
            to="/shop"
            className="mt-4 px-8 py-3 bg-neutral-900 text-white dark:bg-white dark:text-neutral-950 text-xs font-bold uppercase tracking-widest hover:opacity-85 transition-opacity"
          >
            Continue to Shop
          </Link>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="max-w-md mx-auto px-6 py-24">
        <div className="bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
          <div className="text-center mb-8">
            <span className="text-xs uppercase tracking-[0.3em] font-editorial text-neutral-400 font-bold">
              ARGYR SECURITY
            </span>
            <h1 className="text-2xl font-bold uppercase tracking-wider mt-1 text-neutral-900 dark:text-white">
              Create New Password
            </h1>
            <p className="text-xs text-neutral-500 mt-2">
              Enter and confirm your new secure password below.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">New Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="Min 8 characters"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 pl-10 pr-4 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Confirm New Password</label>
              <div className="relative flex items-center">
                <Lock size={16} className="absolute left-3.5 text-neutral-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  placeholder="Repeat new password"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 pl-10 pr-4 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-4 w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <>
                  <span>Update Password</span>
                  <ArrowRight size={14} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </PageTransition>
  );
};
