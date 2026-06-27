import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  PiggyBank,
  ArrowLeftRight,
  Sparkles,
  RotateCcw,
  Sun,
  Moon,
  Heart,
  LogOut,
  Download,
  Coins,
  Check,
} from 'lucide-react';
import type { SessionUser } from '../lib/auth';
import { CURRENCIES, useCurrency, setCurrency } from '../lib/currency';

export type View = 'dashboard' | 'transactions' | 'budgets';

const NAV: { id: View; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transactions', icon: ArrowLeftRight },
  { id: 'budgets', label: 'Budgets', icon: PiggyBank },
];

interface Props {
  view: View;
  onChange: (v: View) => void;
  open: boolean;
  onClose: () => void;
  onReset: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  user: SessionUser;
  onLogout: () => void;
  onInstall: () => void;
  isInstalled: boolean;
  onInsights: () => void;
}

function initials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function Sidebar({
  view,
  onChange,
  open,
  onClose,
  onReset,
  theme,
  onToggleTheme,
  user,
  onLogout,
  onInstall,
  isInstalled,
  onInsights,
}: Props) {
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [currencyOpen, setCurrencyOpen] = useState(false);
  const activeCurrency = useCurrency();
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
        />
      )}
      <aside
        className={`fixed z-50 top-0 left-0 h-full w-72 p-5 transition-transform duration-300 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="glass-strong h-full rounded-3xl flex flex-col p-5 min-h-0 overflow-hidden">
          <div className="flex items-center gap-3 px-2 py-3 shrink-0">
            <div className="relative">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center shadow-lg shadow-brand-500/30">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-mint-400 border-2 border-ink-900" />
            </div>
            <div className="flex-1">
              <h1 className="font-display font-extrabold text-lg leading-none">Finflow</h1>
              <p className="text-[11px] text-white/40 mt-1">Personal Finance</p>
            </div>
            <button
              onClick={onToggleTheme}
              className="w-10 h-10 grid place-items-center rounded-2xl glass text-white/70 hover:text-white hover:scale-105 transition-all"
              aria-label="Toggle theme"
              title={theme === 'dark' ? 'Switch to light' : 'Switch to dark'}
            >
              <motion.span
                key={theme}
                initial={{ rotate: -90, opacity: 0, scale: 0.5 }}
                animate={{ rotate: 0, opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 18 }}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </motion.span>
            </button>
          </div>

          <nav className="mt-8 flex flex-col gap-1.5 shrink-0">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = view === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChange(item.id);
                    onClose();
                  }}
                  className={`relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${
                    active ? 'text-white' : 'text-white/55 hover:text-white/85'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-brand-500/25 to-brand-500/5 border border-brand-400/30"
                      transition={{ type: 'spring', stiffness: 400, damping: 32 }}
                    />
                  )}
                  <Icon className="w-5 h-5 relative z-10" />
                  <span className="relative z-10">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Currency selector */}
          <div className="mt-6 relative shrink-0">
            <button
              onClick={() => setCurrencyOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl glass text-sm font-medium text-white/70 hover:text-white transition-colors"
            >
              <Coins className="w-4 h-4 text-brand-400" />
              <span className="flex-1 text-left">{activeCurrency.name}</span>
              <span className="font-mono text-brand-400 text-base">{activeCurrency.symbol}</span>
            </button>
            <AnimatePresence>
              {currencyOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setCurrencyOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.97 }}
                    transition={{ duration: 0.18 }}
                    className="absolute left-0 right-0 top-full mt-2 z-50 glass-strong rounded-2xl p-1.5 max-h-64 overflow-y-auto shadow-xl"
                  >
                    {CURRENCIES.map((c) => (
                      <button
                        key={c.code}
                        onClick={() => {
                          setCurrency(c.code, user.id);
                          setCurrencyOpen(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm transition-colors ${
                          c.code === activeCurrency.code
                            ? 'bg-brand-500/20 text-white'
                            : 'text-white/60 hover:text-white hover:bg-white/8'
                        }`}
                      >
                        <span className="font-mono text-base w-6 text-center shrink-0">{c.symbol}</span>
                        <span className="flex-1 text-left truncate">{c.name}</span>
                        <span className="text-xs text-white/35 font-mono">{c.code}</span>
                        {c.code === activeCurrency.code && (
                          <Check className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                        )}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="mt-auto space-y-3 overflow-y-auto min-h-0 pb-1">
            {/* User account card */}
            <div className="glass rounded-2xl p-3 relative overflow-hidden">
              <div className="absolute -top-6 -right-6 w-20 h-20 bg-brand-500/25 rounded-full blur-2xl" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center text-white font-bold text-sm shrink-0">
                  {initials(user.name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-white/40 truncate">{user.email}</p>
                </div>
              </div>
              <AnimatePresence mode="wait" initial={false}>
                {confirmLogout ? (
                  <motion.div
                    key="confirm"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="relative z-10 mt-3 flex items-center gap-2"
                  >
                    <button
                      onClick={() => {
                        onLogout();
                        setConfirmLogout(false);
                      }}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Log out
                    </button>
                    <button
                      onClick={() => setConfirmLogout(false)}
                      className="px-3 py-2 rounded-xl bg-white/5 text-white/60 text-xs font-semibold hover:bg-white/10 transition-colors"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <motion.button
                    key="idle"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={() => setConfirmLogout(true)}
                    className="relative z-10 w-full mt-2 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-medium text-white/55 hover:text-white hover:bg-white/8 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    Log out
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => {
                onInsights();
                onClose();
              }}
              className="w-full glass rounded-2xl p-4 relative overflow-hidden text-left group"
            >
              <div className="absolute -top-8 -right-8 w-24 h-24 bg-brand-500/30 rounded-full blur-2xl group-hover:bg-brand-500/40 transition-colors" />
              <div className="relative z-10 flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="text-xs font-semibold text-brand-400">AI Smart Insights</span>
              </div>
              <p className="text-xs text-white/55 leading-snug relative z-10">
                Let AI analyze your spending and give personalized advice.
              </p>
              <div className="flex items-center gap-1 mt-2 text-xs text-brand-400 font-medium relative z-10">
                Analyze now
                <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.2, repeat: Infinity }}>
                  →
                </motion.span>
              </div>
            </motion.button>

            {!isInstalled && (
              <button
                onClick={() => {
                  onInstall();
                  onClose();
                }}
                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/55 hover:text-brand-400 hover:bg-brand-400/10 border border-transparent hover:border-brand-400/20 transition-colors"
              >
                <Download className="w-4 h-4" />
                Install app
              </button>
            )}

            <button
              onClick={() => {
                onReset();
                onClose();
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-white/55 hover:text-rose-400 hover:bg-rose-400/10 border border-transparent hover:border-rose-400/20 transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset all data
            </button>

            {/* Footer credit */}
            <div className="flex items-center justify-center gap-1.5 pt-1 text-[11px] text-white/35">
              <span>Made with</span>
              <Heart className="w-3 h-3 text-rose-400 fill-rose-400" />
              <span>by Aditya Karmakar</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
