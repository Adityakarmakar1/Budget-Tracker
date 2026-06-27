import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Sparkles,
  Brain,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Lightbulb,
  Target,
  PiggyBank,
  Activity,
  Loader2,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { Bar, BarChart, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, RadialBar, RadialBarChart, PolarAngleAxis } from 'recharts';
import type { AISummary } from '../lib/gemini';
import { analyzeFinances } from '../lib/gemini';
import type { BudgetStatus, CategorySlice, TrendPoint } from '../lib/analytics';
import type { Transaction } from '../lib/types';
import { formatCurrency, monthLabel } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  summary: { income: number; expense: number; net: number; savingsRate: number };
  prevSummary?: { income: number; expense: number; net: number; savingsRate: number };
  trend: TrendPoint[];
  slices: CategorySlice[];
  statuses: BudgetStatus[];
  transactions: Transaction[];
  selectedMonth: string;
}

type Phase = 'idle' | 'scanning' | 'analyzing' | 'generating' | 'done' | 'error';

const SEVERITY_CONFIG = {
  good: { icon: CheckCircle2, color: '#34d399', bg: 'rgba(52,211,153,0.1)', border: 'rgba(52,211,153,0.25)' },
  warning: { icon: AlertTriangle, color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)' },
  bad: { icon: TrendingDown, color: '#fb7185', bg: 'rgba(251,113,133,0.1)', border: 'rgba(251,113,133,0.25)' },
};

const PRIORITY_CONFIG = {
  high: { color: '#fb7185', label: 'High' },
  medium: { color: '#fbbf24', label: 'Medium' },
  low: { color: '#818cf8', label: 'Low' },
};

export default function InsightsModal({
  open,
  onClose,
  summary,
  prevSummary,
  trend,
  slices,
  statuses,
  transactions,
  selectedMonth,
}: Props) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [result, setResult] = useState<AISummary | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [visibleCount, setVisibleCount] = useState(0);

  const runAnalysis = useCallback(async () => {
    setPhase('scanning');
    setResult(null);
    setErrorMsg('');
    setVisibleCount(0);

    // Stagger the loading phases for a cool effect.
    setTimeout(() => setPhase('analyzing'), 900);
    setTimeout(() => setPhase('generating'), 1800);

    try {
      const res = await analyzeFinances({
        summary,
        prevSummary,
        trend,
        slices,
        statuses,
        recentTransactions: transactions,
        monthLabel: monthLabel(selectedMonth),
      });
      setResult(res);
      setPhase('done');
      // Stagger reveal of cards
      let count = 0;
      const interval = setInterval(() => {
        count++;
        setVisibleCount(count);
        if (count >= 20) clearInterval(interval);
      }, 80);
    } catch (err: any) {
      setErrorMsg(err?.message ?? 'Failed to analyze. Please try again.');
      setPhase('error');
    }
  }, [summary, prevSummary, trend, slices, statuses, transactions, selectedMonth]);

  // Auto-run when opened.
  useEffect(() => {
    if (open && phase === 'idle') {
      runAnalysis();
    }
    if (!open) {
      // Reset after close animation
      setTimeout(() => {
        setPhase('idle');
        setResult(null);
      }, 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Health score color
  const scoreColor = result
    ? result.healthScore >= 75 ? '#34d399'
      : result.healthScore >= 50 ? '#fbbf24'
      : result.healthScore >= 25 ? '#fb923c'
      : '#fb7185'
    : '#818cf8';

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] bg-black/80 backdrop-blur-md overflow-y-auto"
        >
          <div className="min-h-screen flex items-start justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="glass-strong rounded-3xl w-full max-w-4xl my-4 relative overflow-hidden"
            >
              {/* Header */}
              <div className="sticky top-0 z-20 glass-strong border-b border-white/8 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center shadow-lg shadow-brand-500/30">
                    <Brain className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-display font-extrabold text-lg leading-none">AI Financial Insights</h2>
                    <p className="text-xs text-white/40 mt-1">
                      {monthLabel(selectedMonth)} · Powered by Gemini
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {phase === 'done' && (
                    <button
                      onClick={runAnalysis}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium text-white/55 hover:text-white hover:bg-white/8 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Re-analyze</span>
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-9 h-9 grid place-items-center rounded-xl text-white/50 hover:text-white hover:bg-white/10 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                {/* Loading states */}
                {(phase === 'scanning' || phase === 'analyzing' || phase === 'generating') && (
                  <LoadingAnimation phase={phase} summary={summary} slices={slices} />
                )}

                {/* Error state */}
                {phase === 'error' && (
                  <div className="py-16 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-rose-400/15 text-rose-400 grid place-items-center mx-auto mb-4">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <h3 className="font-display font-bold text-lg mb-2">Analysis failed</h3>
                    <p className="text-sm text-white/50 max-w-sm mx-auto mb-6">{errorMsg}</p>
                    <button
                      onClick={runAnalysis}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/30"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Try again
                    </button>
                  </div>
                )}

                {/* Results */}
                {phase === 'done' && result && (
                  <div className="space-y-6">
                    {/* Health Score + Summary */}
                    <motion.div
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 22 }}
                      className="grid grid-cols-1 sm:grid-cols-3 gap-4"
                    >
                      {/* Score gauge */}
                      <div className="glass rounded-2xl p-5 flex flex-col items-center justify-center relative overflow-hidden">
                        <div className="absolute -top-8 -right-8 w-24 h-24 rounded-full blur-2xl opacity-30" style={{ background: scoreColor }} />
                        <div className="relative z-10 w-32 h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <RadialBarChart
                              innerRadius="72%"
                              outerRadius="100%"
                              data={[{ value: result.healthScore, fill: scoreColor }]}
                              startAngle={90}
                              endAngle={-270}
                            >
                              <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                              <RadialBar background={{ fill: 'rgba(255,255,255,0.06)' }} dataKey="value" cornerRadius={20} />
                            </RadialBarChart>
                          </ResponsiveContainer>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.3 }}
                              className="font-display font-extrabold text-3xl"
                              style={{ color: scoreColor }}
                            >
                              {result.healthScore}
                            </motion.span>
                            <span className="text-[10px] text-white/40">/ 100</span>
                          </div>
                        </div>
                        <p className="text-xs font-semibold mt-2" style={{ color: scoreColor }}>
                          {result.healthLabel}
                        </p>
                      </div>

                      {/* Summary */}
                      <div className="sm:col-span-2 glass rounded-2xl p-5 flex flex-col justify-center">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="w-4 h-4 text-brand-400" />
                          <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">Overview</span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{result.summary}</p>
                        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-white/8">
                          <div>
                            <p className="text-[11px] text-white/40">Income</p>
                            <p className="font-mono font-semibold text-sm text-mint-400">{formatCurrency(summary.income)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-white/40">Expenses</p>
                            <p className="font-mono font-semibold text-sm text-rose-400">{formatCurrency(summary.expense)}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-white/40">Net</p>
                            <p className="font-mono font-semibold text-sm">{formatCurrency(summary.net, { sign: true })}</p>
                          </div>
                          <div>
                            <p className="text-[11px] text-white/40">Savings</p>
                            <p className="font-mono font-semibold text-sm text-brand-400">{(summary.savingsRate * 100).toFixed(0)}%</p>
                          </div>
                        </div>
                      </div>
                    </motion.div>

                    {/* Spending chart */}
                    {slices.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 22 }}
                        className="glass rounded-2xl p-5"
                      >
                        <div className="flex items-center gap-2 mb-4">
                          <Activity className="w-4 h-4 text-cyan-400" />
                          <h3 className="font-display font-bold text-sm">Spending Distribution</h3>
                        </div>
                        <div className="h-48">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={slices.slice(0, 8)} layout="vertical" margin={{ left: 10, right: 20 }}>
                              <XAxis type="number" hide />
                              <YAxis type="category" dataKey="category" axisLine={false} tickLine={false} width={80} tick={{ fill: '#8a8aa3', fontSize: 11 }} />
                              <Tooltip
                                formatter={(value: any) => [formatCurrency(Number(value)), 'Spent']}
                                cursor={{ fill: 'rgba(255,255,255,0.04)' }}
                              />
                              <Bar dataKey="value" radius={[0, 8, 8, 0]} animationDuration={1000}>
                                {slices.slice(0, 8).map((entry, i) => (
                                  <Cell key={i} fill={entry.color} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </motion.div>
                    )}

                    {/* Insights */}
                    {result.insights.length > 0 && (
                      <Section title="Key Insights" icon={Zap} accent="#818cf8" delay={0.15}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {result.insights.map((ins, i) => {
                            const cfg = SEVERITY_CONFIG[ins.severity] ?? SEVERITY_CONFIG.warning;
                            const Icon = cfg.icon;
                            return (
                              <AnimatedCard key={i} delay={i * 0.08} visible={visibleCount > i}>
                                <div
                                  className="glass rounded-2xl p-4 border h-full"
                                  style={{ borderColor: cfg.border }}
                                >
                                  <div className="flex items-start gap-3">
                                    <div
                                      className="w-9 h-9 rounded-xl grid place-items-center shrink-0"
                                      style={{ background: cfg.bg, color: cfg.color }}
                                    >
                                      <Icon className="w-4.5 h-4.5" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <p className="font-semibold text-sm">{ins.title}</p>
                                        {ins.metric && (
                                          <span className="text-xs font-mono shrink-0" style={{ color: cfg.color }}>
                                            {ins.metric}
                                          </span>
                                        )}
                                      </div>
                                      <p className="text-xs text-white/55 mt-1 leading-relaxed">{ins.description}</p>
                                    </div>
                                  </div>
                                </div>
                              </AnimatedCard>
                            );
                          })}
                        </div>
                      </Section>
                    )}

                    {/* Spending pattern */}
                    {result.spendingPattern && (
                      <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="glass rounded-2xl p-5 border-l-2 border-cyan-400/40"
                      >
                        <div className="flex items-center gap-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-cyan-400" />
                          <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wide">Spending Pattern</span>
                        </div>
                        <p className="text-sm text-white/70 leading-relaxed">{result.spendingPattern}</p>
                      </motion.div>
                    )}

                    {/* Category Analysis Table */}
                    {result.categoryAnalysis.length > 0 && (
                      <Section title="Category Analysis" icon={Target} accent="#06b6d4" delay={0.25}>
                        <div className="glass rounded-2xl overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/8">
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase tracking-wide">Category</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase tracking-wide hidden sm:table-cell">Observation</th>
                                <th className="text-left px-4 py-3 text-xs font-semibold text-white/45 uppercase tracking-wide">Suggestion</th>
                              </tr>
                            </thead>
                            <tbody>
                              {result.categoryAnalysis.map((cat, i) => (
                                <AnimatedRow key={i} delay={i * 0.06} visible={visibleCount > i + 4}>
                                  <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: slices.find(s => s.category === cat.category)?.color ?? '#64748b' }} />
                                      <span className="font-medium">{cat.category}</span>
                                    </div>
                                    <p className="text-xs text-white/45 mt-1 sm:hidden">{cat.observation}</p>
                                  </td>
                                  <td className="px-4 py-3 text-white/60 hidden sm:table-cell">{cat.observation}</td>
                                  <td className="px-4 py-3 text-white/60">{cat.suggestion}</td>
                                </AnimatedRow>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </Section>
                    )}

                    {/* Recommendations */}
                    {result.recommendations.length > 0 && (
                      <Section title="Recommendations" icon={Lightbulb} accent="#fbbf24" delay={0.3}>
                        <div className="space-y-2.5">
                          {result.recommendations.map((rec, i) => {
                            const cfg = PRIORITY_CONFIG[rec.priority] ?? PRIORITY_CONFIG.medium;
                            return (
                              <AnimatedCard key={i} delay={i * 0.08} visible={visibleCount > i + 6}>
                                <div className="glass rounded-2xl p-4 flex items-start gap-3">
                                  <div
                                    className="w-8 h-8 rounded-xl grid place-items-center shrink-0 text-xs font-bold"
                                    style={{ background: `${cfg.color}1f`, color: cfg.color }}
                                  >
                                    {i + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <p className="font-semibold text-sm">{rec.title}</p>
                                      <span
                                        className="text-[10px] font-bold px-1.5 py-0.5 rounded-full uppercase"
                                        style={{ background: `${cfg.color}1f`, color: cfg.color }}
                                      >
                                        {cfg.label}
                                      </span>
                                    </div>
                                    <p className="text-xs text-white/55 mt-1 leading-relaxed">{rec.description}</p>
                                  </div>
                                </div>
                              </AnimatedCard>
                            );
                          })}
                        </div>
                      </Section>
                    )}

                    {/* Savings Tips */}
                    {result.savingsTips.length > 0 && (
                      <Section title="Savings Tips" icon={PiggyBank} accent="#34d399" delay={0.35}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                          {result.savingsTips.map((tip, i) => (
                            <AnimatedCard key={i} delay={i * 0.06} visible={visibleCount > i + 8}>
                              <div className="glass rounded-2xl p-4 flex items-start gap-2.5">
                                <CheckCircle2 className="w-4 h-4 text-mint-400 shrink-0 mt-0.5" />
                                <p className="text-sm text-white/65 leading-relaxed">{tip}</p>
                              </div>
                            </AnimatedCard>
                          ))}
                        </div>
                      </Section>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ------------------------------------------------------------------ */
/*  Loading animation                                                  */
/* ------------------------------------------------------------------ */

function LoadingAnimation({ phase, summary, slices }: { phase: Phase; summary: any; slices: CategorySlice[] }) {
  const phaseText: Record<string, string> = {
    scanning: 'Scanning your transactions…',
    analyzing: 'Analyzing spending patterns…',
    generating: 'Generating AI insights…',
  };
  const currentText = phaseText[phase] ?? 'Working…';

  return (
    <div className="py-12">
      {/* Animated scanner */}
      <div className="relative h-48 mb-8 glass rounded-2xl overflow-hidden">
        <div className="absolute inset-0 flex items-end justify-around p-4 gap-1">
          {(slices.length > 0 ? slices.slice(0, 10) : [
            { category: '', value: 40, color: '#6366f1' },
            { category: '', value: 70, color: '#06b6d4' },
            { category: '', value: 50, color: '#f59e0b' },
            { category: '', value: 85, color: '#ec4899' },
            { category: '', value: 60, color: '#8b5cf6' },
            { category: '', value: 45, color: '#10b981' },
          ]).map((s, i) => (
            <motion.div
              key={i}
              className="flex-1 rounded-t-lg"
              style={{ background: s.color, maxWidth: '2rem' }}
              initial={{ height: '10%' }}
              animate={{ height: ['10%', `${20 + (s.value || 50)}%`, '10%'] }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                delay: i * 0.1,
                ease: 'easeInOut',
              }}
            />
          ))}
        </div>
        {/* Scan line */}
        <motion.div
          className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-brand-400 to-transparent"
          animate={{ top: ['0%', '100%', '0%'] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          style={{ boxShadow: '0 0 12px rgba(129,140,248,0.6)' }}
        />
      </div>

      {/* Pulsing brain icon */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.15, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
            className="absolute inset-0 rounded-2xl bg-brand-500/30 blur-xl"
          />
          <motion.div
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="relative w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-cyan-400 grid place-items-center shadow-lg shadow-brand-500/30"
          >
            <Brain className="w-7 h-7 text-white" />
          </motion.div>
        </div>

        <div className="text-center">
          <motion.p
            key={phase}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-bold text-lg"
          >
            {currentText}
          </motion.p>
          <div className="flex items-center gap-1.5 justify-center mt-2">
            {[0, 1, 2].map((i) => (
              <motion.span
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-brand-400"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */

function Section({ title, icon: Icon, accent, delay, children }: {
  title: string;
  icon: typeof Sparkles;
  accent: string;
  delay: number;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, type: 'spring', stiffness: 200, damping: 22 }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <h3 className="font-display font-bold text-sm">{title}</h3>
      </div>
      {children}
    </motion.div>
  );
}

function AnimatedCard({ delay, visible, children }: { delay: number; visible: boolean; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={visible ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 12, scale: 0.96 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 22 }}
    >
      {children}
    </motion.div>
  );
}

function AnimatedRow({ delay, visible, children }: { delay: number; visible: boolean; children: React.ReactNode }) {
  return (
    <motion.tr
      initial={{ opacity: 0, x: -12 }}
      animate={visible ? { opacity: 1, x: 0 } : { opacity: 0, x: -12 }}
      transition={{ delay, type: 'spring', stiffness: 220, damping: 22 }}
      className="border-b border-white/5 last:border-0"
    >
      {children}
    </motion.tr>
  );
}
