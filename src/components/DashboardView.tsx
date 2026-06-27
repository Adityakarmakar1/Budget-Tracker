import { motion } from 'framer-motion';
import { Wallet, TrendingUp, TrendingDown, PiggyBank, Sparkles } from 'lucide-react';
import StatCard from './StatCard';
import SpendingTrendChart from './SpendingTrendChart';
import CategoryDonut from './CategoryDonut';
import BudgetList from './BudgetList';
import TransactionsList from './TransactionsList';
import type { Transaction } from '../lib/types';
import type { BudgetStatus, CategorySlice, TrendPoint } from '../lib/analytics';
import { formatCurrency } from '../lib/format';

interface Props {
  summary: { income: number; expense: number; net: number; savingsRate: number };
  prevSummary?: { income: number; expense: number; net: number; savingsRate: number };
  trend: TrendPoint[];
  slices: CategorySlice[];
  totalExpense: number;
  statuses: BudgetStatus[];
  monthTxns: Transaction[];
}

function pctDelta(curr: number, prev: number): number {
  if (!prev) return 0;
  return ((curr - prev) / prev) * 100;
}

export default function DashboardView({
  summary,
  prevSummary,
  trend,
  slices,
  totalExpense,
  statuses,
  monthTxns,
}: Props) {
  const netDelta = prevSummary ? pctDelta(summary.net, prevSummary.net) : undefined;
  const incDelta = prevSummary ? pctDelta(summary.income, prevSummary.income) : undefined;
  const expDelta = prevSummary ? pctDelta(summary.expense, prevSummary.expense) : undefined;

  return (
    <div className="space-y-5">
      {monthTxns.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-3xl p-5 sm:p-6 flex items-center gap-4 border border-brand-400/20"
        >
          <div className="w-12 h-12 rounded-2xl grid place-items-center bg-brand-500/15 text-brand-400 shrink-0">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="font-semibold">A fresh start! 🎉</p>
            <p className="text-sm text-white/55">
              No transactions yet for this month. Click <span className="text-white/80 font-medium">Add</span> to record your first one.
            </p>
          </div>
        </motion.div>
      )}

      {/* Hero balance card + stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 glass-strong rounded-3xl p-6 relative overflow-hidden"
        >
          <div className="absolute -top-16 -right-16 w-48 h-48 bg-brand-500/30 rounded-full blur-3xl" />
          <div className="absolute -bottom-16 -left-10 w-40 h-40 bg-cyan-400/20 rounded-full blur-3xl" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 text-white/55 text-sm">
              <Wallet className="w-4 h-4" />
              Net Balance
            </div>
            <motion.p
              key={summary.net}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 20 }}
              className={`font-display font-extrabold text-4xl sm:text-5xl mt-3 ${
                summary.net >= 0 ? 'text-gradient' : 'text-rose-400'
              }`}
            >
              {formatCurrency(summary.net, { sign: true })}
            </motion.p>
            <div className="flex items-center gap-4 mt-5">
              <div className="flex-1">
                <p className="text-xs text-white/45">Savings rate</p>
                <p className="font-mono font-semibold text-lg text-mint-400">
                  {(summary.savingsRate * 100).toFixed(0)}%
                </p>
              </div>
              <div className="h-10 w-px bg-white/10" />
              <div className="flex-1">
                <p className="text-xs text-white/45">This month</p>
                <p className="font-mono font-semibold text-sm">
                  {monthTxns.length} txns
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Income" value={summary.income} icon={TrendingUp} accent="#34d399" delta={incDelta} index={0} />
          <StatCard label="Expenses" value={summary.expense} icon={TrendingDown} accent="#fb7185" delta={expDelta} index={1} />
          <StatCard label="Saved" value={summary.net} icon={PiggyBank} accent="#818cf8" delta={netDelta} index={2} />
        </div>
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2">
          <SpendingTrendChart data={trend} />
        </div>
        <CategoryDonut data={slices} total={totalExpense} />
      </div>

      {/* Budgets + recent transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.12 }}
          className="glass rounded-3xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Budgets</h3>
            <span className="text-xs text-white/40">{statuses.filter((b) => !b.over).length}/{statuses.length} on track</span>
          </div>
          <BudgetList statuses={statuses} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="lg:col-span-2 glass rounded-3xl p-5 sm:p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-bold text-lg">Recent Activity</h3>
            <span className="text-xs text-white/40">Last 7</span>
          </div>
          <TransactionsList transactions={monthTxns} limit={7} />
        </motion.div>
      </div>
    </div>
  );
}
