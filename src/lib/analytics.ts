import type { Budget, CategoryMeta, Transaction } from './types';
import { monthKey } from './format';
import { categoryColor } from './seed';

export interface MonthSummary {
  income: number;
  expense: number;
  net: number;
  savingsRate: number;
}

export function monthTransactions(transactions: Transaction[], monthKeyStr: string): Transaction[] {
  return transactions.filter((t) => monthKey(new Date(t.date)) === monthKeyStr);
}

export function summarize(transactions: Transaction[]): MonthSummary {
  let income = 0;
  let expense = 0;
  for (const t of transactions) {
    if (t.type === 'income') income += t.amount;
    else expense += t.amount;
  }
  const net = income - expense;
  const savingsRate = income > 0 ? Math.max(0, Math.min(1, net / income)) : 0;
  return { income, expense, net, savingsRate };
}

export interface CategorySlice {
  category: string;
  value: number;
  color: string;
  share: number;
}

export function expenseByCategory(
  transactions: Transaction[],
  custom: CategoryMeta[] = [],
): CategorySlice[] {
  const map = new Map<string, number>();
  for (const t of transactions) {
    if (t.type !== 'expense') continue;
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  }
  const total = Array.from(map.values()).reduce((a, b) => a + b, 0);
  return Array.from(map.entries())
    .map(([category, value]) => ({
      category,
      value,
      color: categoryColor(category, custom),
      share: total > 0 ? value / total : 0,
    }))
    .sort((a, b) => b.value - a.value);
}

export interface BudgetStatus {
  category: string;
  limit: number;
  spent: number;
  remaining: number;
  pct: number; // 0..1+
  color: string;
  over: boolean;
}

export function budgetStatuses(budgets: Budget[], monthTxns: Transaction[]): BudgetStatus[] {
  const spent = new Map<string, number>();
  for (const t of monthTxns) {
    if (t.type !== 'expense') continue;
    spent.set(t.category, (spent.get(t.category) ?? 0) + t.amount);
  }
  return budgets.map((b) => {
    const s = spent.get(b.category) ?? 0;
    const pct = b.limit > 0 ? s / b.limit : 0;
    return {
      category: b.category,
      limit: b.limit,
      spent: s,
      remaining: b.limit - s,
      pct,
      color: b.color,
      over: s > b.limit,
    };
  });
}

export interface TrendPoint {
  monthKey: string;
  label: string;
  income: number;
  expense: number;
  net: number;
}

export function trend(transactions: Transaction[], months: string[]): TrendPoint[] {
  return months.map((mk) => {
    const txns = monthTransactions(transactions, mk);
    const s = summarize(txns);
    const [y, m] = mk.split('-').map(Number);
    const label = new Date(y, m - 1, 1).toLocaleDateString('en-US', { month: 'short' });
    return { monthKey: mk, label, income: s.income, expense: s.expense, net: s.net };
  });
}

export function lastNMonths(n: number): string[] {
  const today = new Date();
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    out.push(monthKey(d));
  }
  return out;
}
