import { motion } from 'framer-motion';
import { Menu, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { monthLabel } from '../lib/format';

interface Props {
  title: string;
  subtitle: string;
  selectedMonth: string;
  onPrevMonth: () => void;
  onNextMonth: () => void;
  onMenu: () => void;
  onAdd: () => void;
}

export default function TopBar({
  title,
  subtitle,
  selectedMonth,
  onPrevMonth,
  onNextMonth,
  onMenu,
  onAdd,
}: Props) {
  return (
    <header className="sticky top-0 z-30 px-4 sm:px-6 lg:px-8 pt-4 pb-3">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenu}
          className="lg:hidden w-11 h-11 grid place-items-center rounded-2xl glass text-white/80 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="flex-1 min-w-0">
          <motion.h2
            key={title}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-display font-extrabold text-2xl sm:text-3xl truncate"
          >
            {title}
          </motion.h2>
          <p className="text-sm text-white/45 truncate">{subtitle}</p>
        </div>

        <div className="hidden sm:flex items-center gap-1 glass rounded-2xl p-1">
          <button
            onClick={onPrevMonth}
            className="w-9 h-9 grid place-items-center rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-2 text-sm font-semibold min-w-[8.5rem] text-center">
            {monthLabel(selectedMonth)}
          </span>
          <button
            onClick={onNextMonth}
            className="w-9 h-9 grid place-items-center rounded-xl hover:bg-white/10 text-white/70 hover:text-white transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAdd}
          className="flex items-center gap-2 px-4 sm:px-5 h-11 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-shadow"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add</span>
        </motion.button>
      </div>

      {/* Mobile month switcher */}
      <div className="sm:hidden mt-3 flex items-center gap-1 glass rounded-2xl p-1">
        <button
          onClick={onPrevMonth}
          className="w-9 h-9 grid place-items-center rounded-xl hover:bg-white/10 text-white/70"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="flex-1 text-sm font-semibold text-center">
          {monthLabel(selectedMonth)}
        </span>
        <button
          onClick={onNextMonth}
          className="w-9 h-9 grid place-items-center rounded-xl hover:bg-white/10 text-white/70"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
