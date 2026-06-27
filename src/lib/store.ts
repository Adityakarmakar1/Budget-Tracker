import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Budget, CategoryMeta, Transaction } from './types';
import { DEFAULT_BUDGETS, categoryColor } from './seed';
import { monthKey } from './format';
import {
  loadUserData,
  createTransaction,
  deleteTransactionDb,
  upsertBudget,
  resetBudgetsDb,
  createCategory,
  deleteAllUserData,
} from './storage';

export interface FinanceState {
  transactions: Transaction[];
  budgets: Budget[];
  customCategories: CategoryMeta[];
  selectedMonth: string;
}

export function useFinanceStore(userId?: string) {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>(DEFAULT_BUDGETS);
  const [customCategories, setCustomCategories] = useState<CategoryMeta[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(monthKey(new Date()));

  const loadedRef = useRef<string | undefined>(undefined);

  // Load data from Supabase when user changes.
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    if (userId === loadedRef.current) return;
    loadedRef.current = userId;

    setLoading(true);
    loadUserData(userId)
      .then((data) => {
        setTransactions(data.transactions);
        setBudgets(data.budgets);
        setCustomCategories(data.customCategories);
        setSelectedMonth(monthKey(new Date()));
      })
      .catch((err) => {
        console.error('Failed to load user data:', err);
      })
      .finally(() => setLoading(false));
  }, [userId]);

  /* ------------------ Transactions ------------------ */

  const addTransaction = useCallback(
    (t: Omit<Transaction, 'id'>) => {
      if (!userId) return;
      const tempId = `temp-${Date.now()}`;
      const optimistic: Transaction = { ...t, id: tempId };
      setTransactions((prev) =>
        [optimistic, ...prev].sort((a, b) => (a.date < b.date ? 1 : -1)),
      );
      createTransaction(userId, t)
        .then((saved) => {
          setTransactions((prev) => prev.map((tx) => (tx.id === tempId ? saved : tx)));
        })
        .catch((err) => {
          setTransactions((prev) => prev.filter((tx) => tx.id !== tempId));
          console.error('Failed to save transaction:', err);
          alert('Failed to save transaction. Please try again.');
        });
    },
    [userId],
  );

  const deleteTransaction = useCallback(
    (id: string) => {
      setTransactions((prev) => prev.filter((t) => t.id !== id));
      if (id.startsWith('temp-')) return;
      deleteTransactionDb(id).catch((err) => {
        console.error('Failed to delete transaction:', err);
        alert('Failed to delete transaction.');
      });
    },
    [],
  );

  /* ------------------ Budgets ------------------ */

  const updateBudget = useCallback(
    (category: string, limit: number) => {
      if (!userId) return;
      const color = categoryColor(category, customCategories);
      setBudgets((prev) => {
        const existing = prev.find((b) => b.category === category);
        if (existing) return prev.map((b) => (b.category === category ? { ...b, limit } : b));
        return [...prev, { category, limit, color }];
      });
      upsertBudget(userId, category, limit, color).catch((err) => {
        console.error('Failed to save budget:', err);
        alert('Failed to save budget.');
      });
    },
    [userId, customCategories],
  );

  const resetBudgets = useCallback(() => {
    if (!userId) return;
    setBudgets([...DEFAULT_BUDGETS]);
    resetBudgetsDb(userId).catch((err) => {
      console.error('Failed to reset budgets:', err);
      alert('Failed to reset budgets.');
    });
  }, [userId]);

  /* ------------------ Custom categories ------------------ */

  const addCategory = useCallback(
    (meta: CategoryMeta) => {
      if (!userId) return;
      setCustomCategories((prev) =>
        prev.some((c) => c.name.toLowerCase() === meta.name.toLowerCase())
          ? prev
          : [...prev, meta],
      );
      createCategory(userId, meta).catch((err) => {
        console.error('Failed to save category:', err);
        setCustomCategories((prev) => prev.filter((c) => c.name !== meta.name));
        alert('Failed to save category.');
      });
    },
    [userId],
  );

  /* ------------------ Reset all ------------------ */

  const resetAll = useCallback(() => {
    if (!userId) return;
    setTransactions([]);
    setBudgets([...DEFAULT_BUDGETS]);
    setCustomCategories([]);
    setSelectedMonth(monthKey(new Date()));
    deleteAllUserData(userId).catch((err) => {
      console.error('Failed to reset data:', err);
      alert('Failed to reset data.');
    });
  }, [userId]);

  const state = useMemo<FinanceState>(
    () => ({ transactions, budgets, customCategories, selectedMonth }),
    [transactions, budgets, customCategories, selectedMonth],
  );

  return {
    state,
    loading,
    transactions,
    budgets,
    customCategories,
    selectedMonth,
    setSelectedMonth,
    addTransaction,
    deleteTransaction,
    updateBudget,
    addCategory,
    resetBudgets,
    resetAll,
  };
}
