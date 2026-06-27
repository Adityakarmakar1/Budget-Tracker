import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  LayoutDashboard,
  ArrowLeftRight,
  PiggyBank,
  Plus,
  Sun,
  Moon,
  ChevronRight,
  X,
  Check,
} from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  theme: 'dark' | 'light';
}

interface Step {
  icon: typeof Sparkles;
  title: string;
  description: string;
  accent: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'Welcome to Finflow! 🎉',
    description:
      'Your personal finance command center. Let\'s take a quick tour of everything you can do here. This takes less than a minute.',
    accent: '#818cf8',
  },
  {
    icon: LayoutDashboard,
    title: 'Dashboard',
    description:
      'Your home base. See your net balance, income vs expenses, savings rate, and beautiful charts showing where your money goes — all at a glance.',
    accent: '#6366f1',
  },
  {
    icon: ArrowLeftRight,
    title: 'Transactions',
    description:
      'Browse, search, and filter every transaction. Sort by date or amount, filter by type or category, and export to CSV or PDF for your records.',
    accent: '#06b6d4',
  },
  {
    icon: PiggyBank,
    title: 'Budgets',
    description:
      'Set spending limits per category and watch them fill up as you spend. Green means on track, amber means caution, and red means you\'ve gone over. Edit any limit anytime.',
    accent: '#10b981',
  },
  {
    icon: Plus,
    title: 'Add Transactions',
    description:
      'Click the "Add" button (top right) to record income or expenses. You can even create your own custom categories with a color of your choice.',
    accent: '#f59e0b',
  },
  {
    icon: Sun,
    title: 'Theme & Settings',
    description:
      'Toggle between dark and light mode with the sun/moon icon in the sidebar. You\'ll also find reset options and your account info there.',
    accent: '#22d3ee',
  },
  {
    icon: Check,
    title: 'You\'re all set! ✨',
    description:
      'That\'s it! Start by adding your first transaction with the "Add" button. Your data syncs across all your devices automatically. Happy tracking!',
    accent: '#34d399',
  },
];

export default function Walkthrough({ open, onClose, theme }: Props) {
  const [step, setStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const mountedRef = useRef(false);

  // Reset to first step whenever the walkthrough opens.
  useEffect(() => {
    if (open) {
      setStep(0);
      setProgress(0);
      mountedRef.current = true;
    }
  }, [open]);

  // Animate the progress bar.
  useEffect(() => {
    if (!open) return;
    setProgress(((step + 1) / STEPS.length) * 100);
  }, [step, open]);

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep((s) => s + 1);
    } else {
      onClose();
    }
  };

  const skip = () => onClose();

  const current = STEPS[step];
  const Icon = current.icon;
  const isLast = step === STEPS.length - 1;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] grid place-items-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ type: 'spring', stiffness: 280, damping: 26 }}
            className="glass-strong rounded-3xl w-full max-w-md p-7 relative overflow-hidden"
          >
            {/* Accent glow */}
            <div
              className="absolute -top-20 -right-20 w-48 h-48 rounded-full blur-3xl opacity-30 transition-colors duration-500"
              style={{ background: current.accent }}
            />

            {/* Skip button */}
            <button
              onClick={skip}
              className="absolute top-4 right-4 z-10 flex items-center gap-1 text-xs text-white/40 hover:text-white/70 transition-colors"
            >
              Skip tour
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Progress bar */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-white/5">
              <motion.div
                className="h-full rounded-r-full"
                style={{ background: `linear-gradient(90deg, ${current.accent}, ${current.accent}aa)` }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>

            {/* Step indicator */}
            <div className="flex items-center gap-1.5 mb-6 mt-2">
              {STEPS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setStep(i)}
                  className="h-1.5 rounded-full transition-all duration-300"
                  style={{
                    width: i === step ? '1.5rem' : '0.375rem',
                    background: i <= step ? current.accent : 'rgba(255,255,255,0.15)',
                  }}
                  aria-label={`Go to step ${i + 1}`}
                />
              ))}
            </div>

            {/* Icon */}
            <motion.div
              key={`icon-${step}`}
              initial={{ scale: 0, rotate: -30 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.1 }}
              className="w-16 h-16 rounded-2xl grid place-items-center mb-5 relative z-10"
              style={{ background: `${current.accent}1f`, color: current.accent }}
            >
              <Icon className="w-8 h-8" />
            </motion.div>

            {/* Content */}
            <motion.h2
              key={`title-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="font-display font-extrabold text-2xl mb-3 relative z-10"
            >
              {current.title}
            </motion.h2>

            <motion.p
              key={`desc-${step}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-sm text-white/60 leading-relaxed mb-7 relative z-10"
            >
              {current.description}
            </motion.p>

            {/* Actions */}
            <div className="flex items-center justify-between gap-3 relative z-10">
              <span className="text-xs text-white/35 font-mono">
                {step + 1} / {STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {step > 0 && (
                  <button
                    onClick={() => setStep((s) => s - 1)}
                    className="px-4 py-2.5 rounded-2xl text-sm font-medium text-white/55 hover:text-white hover:bg-white/8 transition-colors"
                  >
                    Back
                  </button>
                )}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={next}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-2xl text-sm font-semibold text-white shadow-lg transition-shadow"
                  style={{
                    background: `linear-gradient(135deg, ${current.accent}, ${current.accent}dd)`,
                    boxShadow: `0 8px 24px -8px ${current.accent}80`,
                  }}
                >
                  {isLast ? (
                    <>
                      <Check className="w-4 h-4" />
                      Get started
                    </>
                  ) : (
                    <>
                      Next
                      <ChevronRight className="w-4 h-4" />
                    </>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
