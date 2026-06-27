import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Database, ExternalLink, Check, Loader2, ArrowRight } from 'lucide-react';
import { saveSupabaseConfig, getSupabaseConfig, getSupabase } from '../lib/supabase';

interface Props {
  onConfigured: () => void;
}

export default function SetupScreen({ onConfigured }: Props) {
  const existing = getSupabaseConfig();
  const [url, setUrl] = useState(existing?.url ?? '');
  const [anonKey, setAnonKey] = useState(existing?.anonKey ?? '');
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const cleanUrl = url.trim().replace(/\/$/, '');
    if (!cleanUrl || !anonKey.trim()) {
      setError('Please enter both your Project URL and anon key.');
      return;
    }
    if (!cleanUrl.startsWith('https://') || !cleanUrl.includes('.supabase.co')) {
      setError('The URL should look like https://xxxxx.supabase.co');
      return;
    }

    setTesting(true);
    try {
      // Save config, then verify by creating a client and fetching auth settings.
      saveSupabaseConfig(cleanUrl, anonKey.trim());
      const supabase = getSupabase();
      const { error: testError } = await supabase.auth.getSession();
      if (testError) throw testError;
      setTesting(false);
      onConfigured();
    } catch (err: any) {
      setTesting(false);
      setError('Could not connect to Supabase. Please double-check your URL and key.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative">
      <div className="aurora" />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="w-full max-w-lg"
      >
        <div className="flex items-center gap-3 mb-6 justify-center">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center shadow-lg shadow-brand-500/30">
            <Sparkles className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="font-display font-extrabold text-2xl">Finflow</h1>
            <p className="text-xs text-white/40">Personal Finance Tracker</p>
          </div>
        </div>

        <div className="glass-strong rounded-3xl p-6 sm:p-8">
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-brand-500/15 text-brand-400 grid place-items-center">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg">Connect your Supabase project</h2>
              <p className="text-sm text-white/45">Enables global accounts & Google login</p>
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-2.5 mb-5 text-sm text-white/55">
            <Step n={1}>
              Create a free project at{' '}
              <a href="https://supabase.com/dashboard" target="blank" rel="noopener" className="text-brand-400 hover:underline inline-flex items-center gap-0.5">
                supabase.com <ExternalLink className="w-3 h-3" />
              </a>
            </Step>
            <Step n={2}>
              Run the SQL schema (see <code className="text-brand-300 bg-white/5 px-1.5 py-0.5 rounded">supabase-schema.sql</code> in the project root) in the SQL Editor.
            </Step>
            <Step n={3}>
              Enable Google OAuth in <em>Authentication → Providers</em> (optional).
            </Step>
            <Step n={4}>
              Copy your <strong>Project URL</strong> and <strong>anon key</strong> from <em>Project Settings → API</em> and paste them below.
            </Step>
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="text-xs text-white/50 font-medium">Supabase Project URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://xxxxx.supabase.co"
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 font-medium">Anon / Publishable Key</label>
              <input
                type="text"
                value={anonKey}
                onChange={(e) => setAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors font-mono"
              />
            </div>

            {error && (
              <div className="px-4 py-3 rounded-2xl bg-rose-400/10 border border-rose-400/25 text-rose-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={testing}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-shadow disabled:opacity-60"
            >
              {testing ? (
                <><Loader2 className="w-5 h-5 animate-spin" /> Connecting…</>
              ) : (
                <><Check className="w-5 h-5" /> Connect & Continue <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          <p className="text-xs text-white/35 mt-4 text-center">
            Your keys are stored locally in this browser and used only to talk to your Supabase project.
          </p>
        </div>

        <div className="flex items-center justify-center gap-1.5 mt-6 text-[11px] text-white/35">
          <span>Made with</span>
          <span className="text-rose-400">♥</span>
          <span>by Aditya Karmakar</span>
        </div>
      </motion.div>
    </div>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-400 text-xs font-bold grid place-items-center shrink-0 mt-0.5">
        {n}
      </span>
      <span>{children}</span>
    </div>
  );
}
