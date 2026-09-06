import React, { useState, useEffect } from 'react';
import { X, Lock, Mail, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { useCustomerAuth } from '../contexts/CustomerAuthContext';
import { useToast } from './Toast';

export const AuthModal: React.FC = () => {
  const {
    authModalOpen,
    closeAuthModal,
    authModalMode,
    setAuthModalMode,
    pendingEmail,
    setPendingEmail,
    login,
    register,
    verifyOtp,
    resendOtp
  } = useCustomerAuth();

  const { toast } = useToast();

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [otp, setOtp] = useState('');

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Sync email when pendingEmail changes
  useEffect(() => {
    if (pendingEmail) {
      setEmail(pendingEmail);
    }
  }, [pendingEmail]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (resendCountdown > 0) {
      const timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCountdown]);

  if (!authModalOpen) return null;

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await login({ email, password });
      if (res.requiresVerification) {
        setPendingEmail(email);
        setAuthModalMode('otp');
        setResendCountdown(45);
        toast("Please verify your email address. A code has been sent.", "info");
      } else {
        toast("Welcome back to ARGYR!", "success");
      }
    } catch (err: any) {
      toast(err.message || "Failed to sign in. Please verify your credentials.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast("Passwords do not match.", "error");
      return;
    }
    if (password.length < 8) {
      toast("Password must be at least 8 characters long.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await register({
        firstName,
        lastName,
        email,
        password,
        confirmPassword,
        phone: phone || null,
        marketingOptIn
      });
      setResendCountdown(45);
      toast("Verification code sent! Please check your inbox.", "success");
    } catch (err: any) {
      toast(err.message || "Registration failed. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast("Please enter the complete 6-digit verification code.", "error");
      return;
    }

    setSubmitting(true);
    try {
      await verifyOtp(otp.trim());
      toast("Email verified successfully! You are now logged in.", "success");
    } catch (err: any) {
      toast(err.message || "Invalid or expired verification code.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendCountdown > 0) return;
    try {
      await resendOtp();
      setResendCountdown(45);
      toast("A new verification code has been dispatched to your email.", "success");
    } catch (err: any) {
      toast(err.message || "Failed to resend code. Please try again later.", "error");
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { api } = await import('../services/api');
      await api.customerForgotPassword({ email });
      toast("If an account exists for this email, password reset instructions have been sent.", "success");
      setAuthModalMode('login');
    } catch (err: any) {
      toast(err.message || "Failed to request reset. Please try again.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-neutral-900 border-[0.5px] border-neutral-200 dark:border-neutral-800 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          onClick={closeAuthModal}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
          aria-label="Close modal"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="pt-8 pb-4 px-8 text-center border-b-[0.5px] border-neutral-100 dark:border-neutral-800/60">
          <span className="text-xs uppercase tracking-[0.3em] font-editorial text-neutral-400 font-bold">
            ARGYR FOOTWEAR
          </span>
          <h2 className="text-xl font-bold uppercase tracking-wider mt-1 text-neutral-900 dark:text-white">
            {authModalMode === 'login' && 'Sign In'}
            {authModalMode === 'register' && 'Create Account'}
            {authModalMode === 'otp' && 'Verify Email'}
            {authModalMode === 'forgot' && 'Reset Password'}
          </h2>
          <p className="text-xs text-neutral-500 mt-1">
            {authModalMode === 'login' && 'Access your orders, saved addresses and preferences.'}
            {authModalMode === 'register' && 'Join the ARGYR circle for seamless checkout and tracking.'}
            {authModalMode === 'otp' && `Enter the 6-digit code sent to ${pendingEmail || email}.`}
            {authModalMode === 'forgot' && 'Enter your registered email to receive reset instructions.'}
          </p>
        </div>

        {/* Mode Switch Tabs (Only for login and register) */}
        {(authModalMode === 'login' || authModalMode === 'register') && (
          <div className="flex border-b-[0.5px] border-neutral-200 dark:border-neutral-800 text-xs uppercase tracking-widest font-semibold">
            <button
              onClick={() => setAuthModalMode('login')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                authModalMode === 'login'
                  ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => setAuthModalMode('register')}
              className={`flex-1 py-3 text-center transition-colors border-b-2 ${
                authModalMode === 'register'
                  ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white'
                  : 'border-transparent text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-300'
              }`}
            >
              Register
            </button>
          </div>
        )}

        {/* BODY FORMS */}
        <div className="p-8">
          {/* 1. LOGIN FORM */}
          {authModalMode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Email Address</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@domain.com"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 pl-10 pr-4 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Password</label>
                  <button
                    type="button"
                    onClick={() => setAuthModalMode('forgot')}
                    className="text-[10px] uppercase tracking-wider text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
                  >
                    Forgot?
                  </button>
                </div>
                <div className="relative flex items-center">
                  <Lock size={16} className="absolute left-3.5 text-neutral-400" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 pl-10 pr-4 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTER FORM */}
          {authModalMode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="flex flex-col gap-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">First Name</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                    placeholder="e.g. David"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                    placeholder="e.g. Cole"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="name@domain.com"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Phone Number (Optional)</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+234..."
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="Min 8 chars"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Confirm</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    placeholder="Repeat password"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2 px-3 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 cursor-pointer mt-1">
                <input
                  type="checkbox"
                  checked={marketingOptIn}
                  onChange={(e) => setMarketingOptIn(e.target.checked)}
                  className="w-3.5 h-3.5 rounded-none accent-neutral-900 dark:accent-white"
                />
                <span className="text-[11px] text-neutral-500 leading-tight">
                  Receive private invitations, bespoke releases and editorial news.
                </span>
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </form>
          )}

          {/* 3. OTP VERIFICATION VIEW */}
          {authModalMode === 'otp' && (
            <form onSubmit={handleOtpSubmit} className="flex flex-col items-center gap-5">
              <div className="w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-900 dark:text-white">
                <KeyRound size={22} />
              </div>

              <div className="w-full flex flex-col gap-2">
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  placeholder="000000"
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border-2 border-neutral-300 dark:border-neutral-700 py-3 text-center text-2xl font-mono tracking-[0.4em] font-bold text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                />
                <span className="text-[11px] text-neutral-400 text-center">
                  Verification code expires in 15 minutes
                </span>
              </div>

              <button
                type="submit"
                disabled={submitting || otp.length !== 6}
                className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Verify & Sign In"}
              </button>

              <div className="flex items-center justify-between w-full text-xs text-neutral-500 pt-2 border-t-[0.5px] border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resendCountdown > 0}
                  className={`transition-colors font-medium ${
                    resendCountdown > 0
                      ? 'text-neutral-400 cursor-not-allowed'
                      : 'text-neutral-900 dark:text-white hover:underline'
                  }`}
                >
                  {resendCountdown > 0 ? `Resend code in ${resendCountdown}s` : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* 4. FORGOT PASSWORD VIEW */}
          {authModalMode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-neutral-500">Registered Email</label>
                <div className="relative flex items-center">
                  <Mail size={16} className="absolute left-3.5 text-neutral-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@domain.com"
                    className="w-full bg-neutral-50 dark:bg-neutral-950 border-[0.5px] border-neutral-300 dark:border-neutral-700 py-2.5 pl-10 pr-4 text-xs text-neutral-900 dark:text-white outline-none focus:border-neutral-900 dark:focus:border-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 w-full py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-xs uppercase tracking-widest font-bold transition-opacity flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {submitting ? <Loader2 size={16} className="animate-spin" /> : "Send Reset Link"}
              </button>

              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => setAuthModalMode('login')}
                  className="text-xs uppercase tracking-widest text-neutral-500 hover:text-neutral-900 dark:hover:text-white transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
