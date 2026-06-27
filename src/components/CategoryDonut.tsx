import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { motion } from 'framer-motion';
import type { CategorySlice } from '../lib/analytics';
import { formatCurrency } from '../lib/format';

interface Props {
  data: CategorySlice[];
  total: number;
}

export default function CategoryDonut({ data, total }: Props) {
  const top = data.slice(0, 6);
  const rest = data.slice(6);
  const restValue = rest.reduce((a, b) => a + b.value, 0);
  const chartData =
    restValue > 0
      ? [...top, { category: 'Other', value: restValue, color: '#475569', share: restValue / (total || 1) }]
      : top;

  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.18, type: 'spring', stiffness: 200, damping: 24 }}
      className="glass rounded-3xl p-5 sm:p-6 h-full"
    >
      <h3 className="font-display font-bold text-lg">Spending Breakdown</h3>
      <p className="text-sm text-white/45 mb-2">Where your money goes</p>

      <div className="relative h-52">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Tooltip
              formatter={(value, _name, entry) => [
                formatCurrency(Number(value)),
                entry?.payload?.category ?? '',
              ]}
            />
            <Pie
              data={chartData}
              dataKey="value"
              nameKey="category"
              innerRadius="62%"
              outerRadius="88%"
              paddingAngle={3}
              stroke="none"
              animationDuration={900}
            >
              {chartData.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xs text-white/45">Total spent</span>
          <span className="font-display font-extrabold text-xl">{formatCurrency(total)}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-3 gap-y-2 mt-4">
        {chartData.map((c) => (
          <div key={c.category} className="flex items-center gap-2 text-xs">
            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: c.color }} />
            <span className="text-white/65 truncate flex-1">{c.category}</span>
            <span className="text-white/40">{(c.share * 100).toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
