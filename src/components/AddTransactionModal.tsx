import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Plus, Tag } from 'lucide-react';
import type { CategoryMeta, TransactionType } from '../lib/types';
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CATEGORY_PALETTE,
  categoriesForType,
} from '../lib/seed';
import { useCurrency } from '../lib/currency';
import { toISO } from '../lib/format';

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (t: {
    type: TransactionType;
    amount: number;
    category: string;
    description: string;
    date: string;
  }) => void;
  customCategories: CategoryMeta[];
  onAddCategory: (meta: CategoryMeta) => void;
}

export default function AddTransactionModal({
  open,
  onClose,
  onAdd,
  customCategories,
  onAddCategory,
}: Props) {
  const [type, setType] = useState<TransactionType>('expense');
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState(EXPENSE_CATEGORIES[1].name);
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(toISO(new Date()));
  const currency = useCurrency();

  // new-category creation state
  const [showNew, setShowNew] = useState(false);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(CATEGORY_PALETTE[0]);

  const cats = categoriesForType(type, customCategories);

  const reset = () => {
    setType('expense');
    setAmount('');
    setCategory(EXPENSE_CATEGORIES[1].name);
    setDescription('');
    setDate(toISO(new Date()));
    setShowNew(false);
    setNewName('');
    setNewColor(CATEGORY_PALETTE[0]);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    onAdd({
      type,
      amount: Math.round(amt * 100) / 100,
      category: cats.find((c) => c.name === category) ? category : cats[0].name,
      description: description.trim() || category,
      date,
    });
    reset();
    onClose();
  };

  const switchType = (t: TransactionType) => {
    setType(t);
    const list = categoriesForType(t, customCategories);
    setCategory(list[0].name);
    setShowNew(false);
  };

  const confirmNewCategory = () => {
    const name = newName.trim();
    if (!name) return;
    const meta: CategoryMeta = { name, color: newColor, icon: 'Tag' };
    onAddCategory(meta);
    setCategory(name);
    setNewName('');
    setShowNew(false);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] grid place-items-center p-4 bg-black/70 backdrop-blur-md"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 26 }}
            onClick={(e) => e.stopPropagation()}
            className="glass-strong rounded-3xl w-full max-w-md p-6 relative max-h-[92vh] overflow-y-auto"
          >
            <button
              onClick={onClose}
              className="absolute top-4 right-4 w-9 h-9 grid place-items-center rounded-xl text-white/50 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-display font-extrabold text-xl">Add Transaction</h3>
            <p className="text-sm text-white/45 mb-5">Record a new income or expense</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Type toggle */}
              <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-white/5">
                {(['expense', 'income'] as TransactionType[]).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => switchType(t)}
                    className={`relative py-2.5 rounded-xl text-sm font-semibold capitalize transition-colors ${
                      type === t ? 'text-white' : 'text-white/50'
                    }`}
                  >
                    {type === t && (
                      <motion.span
                        layoutId="type-toggle"
                        className={`absolute inset-0 rounded-xl ${
                          t === 'income'
                            ? 'bg-gradient-to-r from-mint-400/30 to-mint-400/10 border border-mint-400/40'
                            : 'bg-gradient-to-r from-rose-400/30 to-rose-400/10 border border-rose-400/40'
                        }`}
                        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{t}</span>
                  </button>
                ))}
              </div>

              {/* Amount */}
              <div>
                <label className="text-xs text-white/50 font-medium">Amount</label>
                <div className="relative mt-1.5">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-mono">{currency.symbol}</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    autoFocus
                    required
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-9 pr-4 py-3 text-lg font-mono font-semibold focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors"
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="text-xs text-white/50 font-medium">Category</label>
                  <button
                    type="button"
                    onClick={() => setShowNew((s) => !s)}
                    className="flex items-center gap-1 text-xs font-medium text-brand-400 hover:text-brand-300 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    New category
                  </button>
                </div>

                <AnimatePresence>
                  {showNew && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-2 glass rounded-2xl p-3 space-y-3">
                        <div className="flex items-center gap-2">
                          <Tag className="w-4 h-4 text-white/40 shrink-0" />
                          <input
                            type="text"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Category name (e.g. Pets)"
                            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), confirmNewCategory())}
                            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-brand-400/60"
                          />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {CATEGORY_PALETTE.map((c) => (
                            <button
                              key={c}
                              type="button"
                              onClick={() => setNewColor(c)}
                              className="w-6 h-6 rounded-full transition-transform hover:scale-110"
                              style={{
                                background: c,
                                boxShadow: newColor === c ? `0 0 0 2px var(--color-ink-900, #0b0b14), 0 0 0 4px ${c}` : 'none',
                              }}
                              aria-label={`Pick color ${c}`}
                            />
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={confirmNewCategory}
                          disabled={!newName.trim()}
                          className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-brand-500/20 text-brand-400 text-sm font-semibold hover:bg-brand-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        >
                          <Check className="w-4 h-4" />
                          Add category
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="grid grid-cols-3 gap-2 mt-1.5">
                  {cats.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setCategory(c.name)}
                      className={`py-2 px-2 rounded-xl text-xs font-medium border transition-all ${
                        category === c.name
                          ? 'border-white/30 text-white'
                          : 'border-white/8 text-white/50 hover:border-white/20'
                      }`}
                      style={
                        category === c.name
                          ? { background: `${c.color}22`, color: c.color, borderColor: `${c.color}55` }
                          : undefined
                      }
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs text-white/50 font-medium">Description</label>
                <input
                  type="text"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What was it for?"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors"
                />
              </div>

              {/* Date */}
              <div>
                <label className="text-xs text-white/50 font-medium">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm mt-1.5 focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors"
                />
              </div>

              <button
                type="submit"
                className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-r from-brand-500 to-brand-600 text-white font-semibold shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 transition-shadow"
              >
                <Check className="w-5 h-5" />
                Add Transaction
              </button>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
