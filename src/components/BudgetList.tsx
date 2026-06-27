import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { BudgetStatus } from '../lib/analytics';
import { formatCurrency } from '../lib/format';

interface Props {
  statuses: BudgetStatus[];
  compact?: boolean;
}

export default function BudgetList({ statuses, compact }: Props) {
  const sorted = [...statuses].sort((a, b) => b.pct - a.pct);
  const items = compact ? sorted.slice(0, 4) : sorted;

  return (
    <div className="space-y-3">
      {items.map((b, i) => {
        const pctClamped = Math.min(b.pct, 1);
        const barColor = b.over ? '#fb7185' : b.pct > 0.85 ? '#fbbf24' : b.color;
        return (
          <motion.div
            key={b.category}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            className="group"
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                <span className="font-medium text-sm">{b.category}</span>
                {b.over ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                ) : b.pct > 0.85 ? (
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                ) : (
                  <CheckCircle2 className="w-3.5 h-3.5 text-mint-400" />
                )}
              </div>
              <span className="text-xs text-white/55 font-mono">
                {formatCurrency(b.spent)} <span className="text-white/30">/ {formatCurrency(b.limit)}</span>
              </span>
            </div>
            <div className="relative h-2.5 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pctClamped * 100}%` }}
                transition={{ delay: 0.2 + i * 0.05, duration: 0.8, ease: 'easeOut' }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                  boxShadow: `0 0 12px ${barColor}66`,
                }}
              />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[11px] text-white/40">
                {b.over
                  ? `Over by ${formatCurrency(b.spent - b.limit)}`
                  : `${formatCurrency(b.remaining)} left`}
              </span>
              <span className="text-[11px] text-white/40 font-mono">
                {(b.pct * 100).toFixed(0)}%
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
