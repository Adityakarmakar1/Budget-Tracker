import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Mail,
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Wallet,
  PieChart,
  ShieldCheck,
} from 'lucide-react';
import { signIn, signUp, signInWithGoogle, type SessionUser } from '../lib/auth';

interface Props {
  onAuthed: (user: SessionUser) => void;
}

type Mode = 'login' | 'register';

export default function AuthScreen({ onAuthed }: Props) {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [stayLoggedIn, setStayLoggedIn] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const switchMode = (m: Mode) => {
    setMode(m);
    setError('');
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res =
        mode === 'register'
          ? await signUp(name, email, password)
          : await signIn(email, password, stayLoggedIn);
      if (!res.ok || !res.user) {
        setError(res.error ?? 'Something went wrong.');
      } else {
        onAuthed(res.user);
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setError('');
    setGoogleLoading(true);
    const res = await signInWithGoogle(stayLoggedIn);
    if (!res.ok) {
      setGoogleLoading(false);
      setError(res.error ?? 'Google sign-in failed.');
    }
    // If ok, the browser is redirecting to Google — no further action needed.
  };

  return (
    <div className="min-h-screen relative grid lg:grid-cols-2">
      <div className="aurora" />

      {/* Left: branding panel (desktop) */}
      <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center shadow-lg shadow-brand-500/30">
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-2xl">Finflow</h1>
              <p className="text-xs text-white/40">Personal Finance Tracker</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-8">
          <div>
            <h2 className="font-display font-extrabold text-4xl xl:text-5xl leading-tight">
              Master your money,
              <br />
              <span className="text-gradient">one transaction</span>
              <br />
              at a time.
            </h2>
            <p className="text-white/50 mt-4 text-lg max-w-md">
              Track income, expenses, and budgets with beautiful charts. Your account works everywhere.
            </p>
          </div>
          <div className="space-y-4 max-w-md">
            {[
              { icon: Wallet, title: 'Smart tracking', desc: 'Log every transaction with custom categories' },
              { icon: PieChart, title: 'Visual insights', desc: 'Beautiful charts show where your money goes' },
              { icon: ShieldCheck, title: 'Global & secure', desc: 'Supabase-powered accounts work on any device' },
            ].map((f) => (
              <div key={f.title} className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-2xl glass grid place-items-center text-brand-400 shrink-0">
                  <f.icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="font-semibold text-sm">{f.title}</p>
                  <p className="text-xs text-white/45">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 flex items-center gap-1.5 text-[11px] text-white/35">
          <span>Made with</span>
          <span className="text-rose-400">♥</span>
          <span>by Aditya Karmakar</span>
        </div>
      </div>

      {/* Right: auth form */}
      <div className="flex items-center justify-center p-6 sm:p-10 min-h-screen lg:min-h-0">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 200, damping: 24 }}
          className="w-full max-w-md"
        >
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center shadow-lg shadow-brand-500/30">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="font-display font-extrabold text-xl">Finflow</h1>
              <p className="text-[11px] text-white/40">Personal Finance</p>
            </div>
          </div>

          <div className="glass-strong rounded-3xl p-6 sm:p-8">
            {/* Mode toggle */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5 mb-6">
              {(['login', 'register'] as Mode[]).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`relative py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                    mode === m ? 'text-white' : 'text-white/50 hover:text-white/75'
                  }`}
                >
                  {mode === m && (
                    <motion.span
                      layoutId="auth-mode"
                      className="absolute inset-0 rounded-xl bg-gradient-to-r from-brand-500/30 to-brand-500/10 border border-brand-400/40"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{m === 'login' ? 'Sign In' : 'Sign Up'}</span>
                </button>
              ))}
            </div>

            <h2 className="font-display font-extrabold text-2xl mb-1">
              {mode === 'login' ? 'Welcome back' : 'Create your account'}
            </h2>
            <p className="text-sm text-white/45 mb-6">
              {mode === 'login'
                ? 'Enter your credentials to access your dashboard'
                : 'Start tracking your finances in seconds'}
            </p>

            {/* Google OAuth */}
            <button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-medium text-sm hover:bg-white/10 transition-colors disabled:opacity-60 mb-4"
            >
              {googleLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <GoogleIcon />
              )}
              Continue with Google
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/35">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'register' && (
                <Field
                  icon={UserIcon}
                  label="Full name"
                  type="text"
                  value={name}
                  onChange={setName}
                  placeholder="Aditya Karmakar"
                  autoComplete="name"
                />
              )}

              <Field
                icon={Mail}
                label="Email"
                type="email"
                value={email}
                onChange={setEmail}
                placeholder="you@example.com"
                autoComplete="email"
              />

              <div>
                <label className="text-xs text-white/50 font-medium">Password</label>
                <div className="relative mt-1.5">
                  <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={mode === 'register' ? 'At least 6 characters' : '••••••••'}
                    autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-11 py-3 text-sm focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 grid place-items-center rounded-lg text-white/40 hover:text-white/70 transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Stay logged in toggle */}
              <label className="flex items-center gap-2.5 cursor-pointer select-none group">
                <button
                  type="button"
                  onClick={() => setStayLoggedIn((s) => !s)}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    stayLoggedIn ? 'bg-brand-500' : 'bg-white/15'
                  }`}
                  aria-pressed={stayLoggedIn}
                >
                  <motion.span
                    layout
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md ${
                      stayLoggedIn ? 'left-[1.125rem]' : 'left-0.5'
                    }`}
                  />
                </button>
                <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  Stay logged in
                </span>
              </label>

              {/* Error message */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 px-4 py-3 rounded-2xl bg-rose-400/10 border border-rose-400/25 text-rose-400 text-sm"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    {error}
                  </motion.div>
                )}
              </AnimatePresence>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-shadow disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  mode === 'login' ? 'Sign In' : 'Create Account'
                )}
              </button>
            </form>

            <p className="text-center text-sm text-white/45 mt-5">
              {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button
                onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                className="text-brand-400 hover:text-brand-300 font-semibold transition-colors"
              >
                {mode === 'login' ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </div>

          <div className="flex lg:hidden items-center justify-center gap-1.5 mt-6 text-[11px] text-white/35">
            <span>Made with</span>
            <span className="text-rose-400">♥</span>
            <span>by Aditya Karmakar</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/>
    </svg>
  );
}

interface FieldProps {
  icon: typeof Mail;
  label: string;
  type: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  autoComplete?: string;
}

function Field({ icon: Icon, label, type, value, onChange, placeholder, autoComplete }: FieldProps) {
  return (
    <div>
      <label className="text-xs text-white/50 font-medium">{label}</label>
      <div className="relative mt-1.5">
        <Icon className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-white/40" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required
          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors"
        />
      </div>
    </div>
  );
}
