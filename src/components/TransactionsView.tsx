import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Filter, ArrowDownUp, Download, FileText, FileSpreadsheet, ChevronDown } from 'lucide-react';
import TransactionsList from './TransactionsList';
import type { CategoryMeta, Transaction, TransactionType } from '../lib/types';
import { ALL_CATEGORIES } from '../lib/seed';
import { exportTransactionsCsv, exportTransactionsPdf } from '../lib/export';

interface Props {
  transactions: Transaction[];
  onDelete: (id: string) => void;
  customCategories?: CategoryMeta[];
  selectedMonth?: string;
}

type SortKey = 'date' | 'amount';

export default function TransactionsView({
  transactions,
  onDelete,
  customCategories = [],
  selectedMonth,
}: Props) {
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [catFilter, setCatFilter] = useState<string>('all');
  const [sort, setSort] = useState<SortKey>('date');
  const [exportOpen, setExportOpen] = useState(false);

  const filtered = useMemo(() => {
    let list = transactions.slice();
    if (typeFilter !== 'all') list = list.filter((t) => t.type === typeFilter);
    if (catFilter !== 'all') list = list.filter((t) => t.category === catFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (t) => t.description.toLowerCase().includes(q) || t.category.toLowerCase().includes(q),
      );
    }
    list.sort((a, b) => {
      if (sort === 'amount') return b.amount - a.amount;
      return a.date < b.date ? 1 : -1;
    });
    return list;
  }, [transactions, typeFilter, catFilter, query, sort]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl p-5 sm:p-6"
    >
      {/* Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search transactions…"
            className="w-full bg-white/5 border border-white/10 rounded-2xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-brand-400/60 focus:bg-white/[0.07] transition-colors"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <div className="flex items-center gap-1 p-1 rounded-2xl bg-white/5">
            {(['all', 'income', 'expense'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-colors ${
                  typeFilter === t ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white/75'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Category filter */}
          <div className="relative">
            <Filter className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40 pointer-events-none" />
            <select
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
              className="appearance-none bg-white/5 border border-white/10 rounded-2xl pl-8 pr-8 py-2.5 text-xs font-medium focus:outline-none focus:border-brand-400/60 cursor-pointer"
            >
              <option value="all">All categories</option>
              {[...ALL_CATEGORIES, ...customCategories].map((c) => (
                <option key={c.name} value={c.name}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Sort */}
          <button
            onClick={() => setSort((s) => (s === 'date' ? 'amount' : 'date'))}
            className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-white/5 border border-white/10 text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
          >
            <ArrowDownUp className="w-3.5 h-3.5" />
            {sort === 'date' ? 'Date' : 'Amount'}
          </button>

          {/* Export */}
          <div className="relative">
            <button
              onClick={() => setExportOpen((o) => !o)}
              disabled={filtered.length === 0}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-2xl bg-gradient-to-r from-brand-500/20 to-brand-600/20 border border-brand-400/30 text-xs font-medium text-brand-400 hover:from-brand-500/30 hover:to-brand-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Download className="w-3.5 h-3.5" />
              Export
              <ChevronDown className={`w-3 h-3 transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {exportOpen && filtered.length > 0 && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setExportOpen(false)} />
                  <motion.div
                    initial={{ opacity: 0, y: -6, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -6, scale: 0.96 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 top-full mt-2 z-50 w-48 glass-strong rounded-2xl p-1.5 shadow-xl"
                  >
                    <button
                      onClick={() => {
                        exportTransactionsCsv(filtered, selectedMonth);
                        setExportOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <FileSpreadsheet className="w-4 h-4 text-mint-400" />
                      Download CSV
                    </button>
                    <button
                      onClick={() => {
                        exportTransactionsPdf(filtered, selectedMonth);
                        setExportOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <FileText className="w-4 h-4 text-rose-400" />
                      Download PDF
                    </button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between mb-3 px-1">
        <span className="text-xs text-white/45">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${typeFilter}-${catFilter}-${sort}-${query}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          <TransactionsList transactions={filtered} onDelete={onDelete} />
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
