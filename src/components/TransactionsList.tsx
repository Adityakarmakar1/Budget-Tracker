import { motion, AnimatePresence } from 'framer-motion';
import { Trash2, TrendingDown, TrendingUp } from 'lucide-react';
import type { Transaction } from '../lib/types';
import { categoryColor } from '../lib/seed';
import { formatCurrency } from '../lib/format';

interface Props {
  transactions: Transaction[];
  onDelete?: (id: string) => void;
  limit?: number;
}

export default function TransactionsList({ transactions, onDelete, limit }: Props) {
  const items = limit ? transactions.slice(0, limit) : transactions;

  if (items.length === 0) {
    return (
      <div className="text-center py-12 text-white/40 text-sm">
        No transactions for this period yet.
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <AnimatePresence initial={false}>
        {items.map((t, i) => {
          const income = t.type === 'income';
          const color = categoryColor(t.category);
          const Icon = income ? TrendingUp : TrendingDown;
          return (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, x: -20, transition: { duration: 0.2 } }}
              transition={{ delay: Math.min(i * 0.03, 0.3) }}
              whileHover={{ x: 4 }}
              className="group flex items-center gap-3 p-3 rounded-2xl hover:bg-white/[0.04] transition-colors"
            >
              <div
                className="w-10 h-10 rounded-xl grid place-items-center shrink-0"
                style={{ background: `${color}1f`, color }}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-sm truncate">{t.description}</p>
                <p className="text-xs text-white/40">
                  {t.category} ·{' '}
                  {new Date(t.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </p>
              </div>
              <span
                className={`font-mono font-semibold text-sm whitespace-nowrap ${
                  income ? 'text-mint-400' : 'text-white/90'
                }`}
              >
                {income ? '+' : '−'}
                {formatCurrency(t.amount)}
              </span>
              {onDelete && (
                <button
                  onClick={() => onDelete(t.id)}
                  className="opacity-0 group-hover:opacity-100 w-8 h-8 grid place-items-center rounded-lg text-white/40 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
                  aria-label="Delete transaction"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
