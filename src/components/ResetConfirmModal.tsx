import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Trash2 } from 'lucide-react';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export default function ResetConfirmModal({ open, onClose, onConfirm }: Props) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[110] grid place-items-center p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-3xl w-full max-w-sm p-6 relative"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-xl text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-14 h-14 rounded-2xl grid place-items-center bg-rose-400/15 text-rose-400 mb-4">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <h3 className="font-display font-extrabold text-xl">Reset all data?</h3>
            <p className="text-sm text-white/55 mt-2 leading-relaxed">
              This will permanently delete <span className="text-white/80 font-medium">all transactions</span> and
              restore budgets to their default limits. You'll start with a clean slate. This action cannot be undone.
            </p>

            <div className="flex gap-3 mt-6">
              <button
                onClick={onClose}
                className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-white/80 font-semibold text-sm hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-rose-500 to-rose-600 text-white font-semibold text-sm shadow-lg shadow-rose-500/30 hover:shadow-rose-500/50 transition-shadow"
              >
                <Trash2 className="w-4 h-4" />
                Reset everything
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
