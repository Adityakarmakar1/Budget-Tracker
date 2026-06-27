import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Pencil } from 'lucide-react';
import type { BudgetStatus } from '../lib/analytics';
import { formatCurrency, currencySymbol } from '../lib/format';

interface Props {
  status: BudgetStatus;
  onSave: (category: string, limit: number) => void;
}

export default function BudgetRow({ status, onSave }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(status.limit));

  const pctClamped = Math.min(status.pct, 1);
  const barColor = status.over ? '#fb7185' : status.pct > 0.85 ? '#fbbf24' : status.color;

  const save = () => {
    const n = parseFloat(value);
    if (n && n > 0) onSave(status.category, Math.round(n));
    setEditing(false);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-2xl p-4"
    >
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="w-3 h-3 rounded-full" style={{ background: status.color }} />
          <span className="font-semibold">{status.category}</span>
        </div>
        {editing ? (
          <div className="flex items-center gap-1.5">
            <span className="text-white/40 text-sm">{currencySymbol()}</span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && save()}
              autoFocus
              className="w-24 bg-white/5 border border-white/10 rounded-lg px-2 py-1 text-sm font-mono focus:outline-none focus:border-brand-400/60"
            />
            <button
              onClick={save}
              className="w-8 h-8 grid place-items-center rounded-lg bg-mint-400/20 text-mint-400 hover:bg-mint-400/30"
            >
              <Check className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-sm font-mono text-white/70">
              {formatCurrency(status.limit)}
            </span>
            <button
              onClick={() => {
                setValue(String(status.limit));
                setEditing(true);
              }}
              className="w-8 h-8 grid place-items-center rounded-lg text-white/40 hover:text-white hover:bg-white/10"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      <div className="relative h-3 rounded-full bg-white/5 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pctClamped * 100}%` }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
            boxShadow: `0 0 14px ${barColor}66`,
          }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 text-xs">
        <span className="text-white/50">
          Spent <span className="text-white/80 font-mono">{formatCurrency(status.spent)}</span>
        </span>
        <span
          className={`font-medium ${
            status.over ? 'text-rose-400' : status.pct > 0.85 ? 'text-amber-400' : 'text-mint-400'
          }`}
        >
          {status.over
            ? `Over by ${formatCurrency(status.spent - status.limit)}`
            : `${formatCurrency(status.remaining)} left · ${(status.pct * 100).toFixed(0)}%`}
        </span>
      </div>
    </motion.div>
  );
}
