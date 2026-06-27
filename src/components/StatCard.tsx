import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { formatCurrency } from '../lib/format';

interface Props {
  label: string;
  value: number;
  icon: LucideIcon;
  accent: string;
  delta?: number; // percentage change vs previous
  index?: number;
  currency?: boolean;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  accent,
  delta,
  index = 0,
  currency = true,
}: Props) {
  const positive = (delta ?? 0) >= 0;
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, type: 'spring', stiffness: 220, damping: 24 }}
      whileHover={{ y: -4 }}
      className="glass rounded-3xl p-5 relative overflow-hidden group"
    >
      <div
        className="absolute -top-10 -right-10 w-32 h-32 rounded-full blur-2xl opacity-30 group-hover:opacity-50 transition-opacity"
        style={{ background: accent }}
      />
      <div className="flex items-center justify-between relative z-10">
        <div
          className="w-11 h-11 rounded-2xl grid place-items-center"
          style={{ background: `${accent}22`, color: accent }}
        >
          <Icon className="w-5 h-5" />
        </div>
        {delta !== undefined && (
          <span
            className={`text-xs font-semibold px-2 py-1 rounded-full ${
              positive ? 'bg-mint-400/15 text-mint-400' : 'bg-rose-400/15 text-rose-400'
            }`}
          >
            {positive ? '▲' : '▼'} {Math.abs(delta).toFixed(1)}%
          </span>
        )}
      </div>
      <p className="text-sm text-white/50 mt-4 relative z-10">{label}</p>
      <p className="font-display font-extrabold text-2xl sm:text-[1.7rem] mt-1 relative z-10">
        {currency ? formatCurrency(value) : value}
      </p>
    </motion.div>
  );
}
