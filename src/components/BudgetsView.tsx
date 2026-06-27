import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RotateCcw,
  AlertTriangle,
  Download,
  FileText,
  FileSpreadsheet,
  ChevronDown,
} from 'lucide-react';
import BudgetRow from './BudgetRow';
import type { BudgetStatus } from '../lib/analytics';
import { formatCurrency } from '../lib/format';
import { exportBudgetsCsv, exportBudgetsPdf } from '../lib/export';

interface Props {
  statuses: BudgetStatus[];
  onSave: (category: string, limit: number) => void;
  onResetBudgets: () => void;
  selectedMonth?: string;
}

export default function BudgetsView({ statuses, onSave, onResetBudgets, selectedMonth }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);

  const totalLimit = statuses.reduce((a, b) => a + b.limit, 0);
  const totalSpent = statuses.reduce((a, b) => a + b.spent, 0);
  const overCount = statuses.filter((b) => b.over).length;
  const overallPct = totalLimit > 0 ? totalSpent / totalLimit : 0;

  return (
    <div className="space-y-5">
      {/* Overview banner */}
      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-strong rounded-3xl p-6 relative overflow-hidden"
      >
        <div className="absolute -top-12 -right-8 w-44 h-44 bg-brand-500/25 rounded-full blur-3xl" />
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-end gap-6">
          <div className="flex-1">
            <p className="text-sm text-white/55">Total budgeted this month</p>
            <p className="font-display font-extrabold text-4xl mt-1">{formatCurrency(totalLimit)}</p>
            <p className="text-sm text-white/50 mt-1">
              <span className="text-white/80 font-mono">{formatCurrency(totalSpent)}</span> spent ·{' '}
              <span className={totalLimit - totalSpent >= 0 ? 'text-mint-400' : 'text-rose-400'}>
                {formatCurrency(totalLimit - totalSpent, { sign: true })} remaining
              </span>
            </p>
          </div>
          <div className="sm:w-56">
            <div className="flex items-center justify-between text-xs text-white/50 mb-1.5">
              <span>Overall usage</span>
              <span className="font-mono">{(overallPct * 100).toFixed(0)}%</span>
            </div>
            <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(overallPct, 1) * 100}%` }}
                transition={{ duration: 1, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-brand-400 to-cyan-400"
                style={{ boxShadow: '0 0 14px rgba(129,140,248,0.5)' }}
              />
            </div>
            <p className="text-xs text-white/45 mt-2">
              {overCount > 0 ? (
                <span className="text-rose-400">{overCount} budget{overCount > 1 ? 's' : ''} exceeded</span>
              ) : (
                <span className="text-mint-400">All budgets on track 🎉</span>
              )}
            </p>
          </div>
        </div>

        {/* Reset + Export controls */}
        <div className="relative z-10 mt-5 pt-4 border-t border-white/10 flex items-center justify-between gap-3 flex-wrap">
          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              disabled={statuses.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-brand-500/20 to-brand-600/20 border border-brand-400/30 text-xs font-medium text-brand-400 hover:from-brand-500/30 hover:to-brand-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className={`w-3 h-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {exportOpen && statuses.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-0 top-full mt-2 z-50 w-48 glass-strong rounded-2xl p-1.5 shadow-xl"
                  >
                    <button
                      onClick={() => {
                        exportBudgetsCsv(statuses, selectedMonth);
                        setExportOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-mint-400" />
                      Download CSV
                    </button>
                    <button
                      onClick={() => {
                        exportBudgetsPdf(statuses, selectedMonth);
                        setExportOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      Download PDF
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Reset budgets */}
          <AnimatePresence mode="wait" initial={false}>
            {confirming ? (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                className="flex items-center gap-2"
              >
                <span className="flex items-center gap-1.5 text-xs text-white/60 mr-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Restore all default limits?
                </span>
                <button
                  onClick={() => {
                    onResetBudgets();
                    setConfirming(false);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-400 text-xs font-semibold hover:bg-rose-500/30 transition-colors"
                >
                  Yes, reset
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="px-3 py-1.5 rounded-xl bg-white/5 text-white/60 text-xs font-semibold hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
              </motion.div>
            ) : (
              <motion.button
                key="idle"
                initial={{ opacity: 0, x: 8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 8 }}
                onClick={() => setConfirming(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-white/55 hover:text-brand-400 hover:bg-brand-400/10 border border-transparent hover:border-brand-400/20 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset budgets to defaults
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Budget cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {statuses.map((s) => (
          <BudgetRow key={s.category} status={s} onSave={onSave} />
        ))}
      </div>
    </div>
  );
}
