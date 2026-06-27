import type { Budget, CategoryMeta, Transaction } from './types';
import { toISO } from './format';

export const EXPENSE_CATEGORIES: CategoryMeta[] = [
  { name: 'Housing', color: '#6366f1', icon: 'Home' },
  { name: 'Food', color: '#f59e0b', icon: 'UtensilsCrossed' },
  { name: 'Transport', color: '#06b6d4', icon: 'Car' },
  { name: 'Shopping', color: '#ec4899', icon: 'ShoppingBag' },
  { name: 'Entertainment', color: '#8b5cf6', icon: 'Clapperboard' },
  { name: 'Health', color: '#10b981', icon: 'HeartPulse' },
  { name: 'Utilities', color: '#3b82f6', icon: 'Plug' },
  { name: 'Other', color: '#64748b', icon: 'Ellipsis' },
];

export const INCOME_CATEGORIES: CategoryMeta[] = [
  { name: 'Salary', color: '#22c55e', icon: 'Briefcase' },
  { name: 'Freelance', color: '#14b8a6', icon: 'Laptop' },
  { name: 'Investments', color: '#eab308', icon: 'TrendingUp' },
  { name: 'Gifts', color: '#f472b6', icon: 'Gift' },
  { name: 'Other Income', color: '#a3e635', icon: 'Plus' },
];

export const ALL_CATEGORIES = [...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES];

/** Palette users can pick from when creating a custom category. */
export const CATEGORY_PALETTE = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#eab308',
  '#22c55e', '#14b8a6', '#06b6d4', '#3b82f6', '#a855f7', '#64748b',
];

export function categoryColor(name: string, custom: CategoryMeta[] = []): string {
  const c = [...ALL_CATEGORIES, ...custom].find((x) => x.name === name);
  return c?.color ?? '#64748b';
}

/** Merge built-in + user categories for a given transaction type. */
export function categoriesForType(
  type: 'income' | 'expense',
  custom: CategoryMeta[] = [],
): CategoryMeta[] {
  const base = type === 'expense' ? EXPENSE_CATEGORIES : INCOME_CATEGORIES;
  return [...base, ...custom];
}

export const DEFAULT_BUDGETS: Budget[] = [
  { category: 'Housing', limit: 1800, color: '#6366f1' },
  { category: 'Food', limit: 700, color: '#f59e0b' },
  { category: 'Transport', limit: 350, color: '#06b6d4' },
  { category: 'Shopping', limit: 400, color: '#ec4899' },
  { category: 'Entertainment', limit: 250, color: '#8b5cf6' },
  { category: 'Health', limit: 300, color: '#10b981' },
  { category: 'Utilities', limit: 250, color: '#3b82f6' },
];

// Build ~5 months of realistic seed transactions.
function rand(min: number, max: number) {
  return Math.random() * (max - min) + min;
}
function round(n: number) {
  return Math.round(n * 100) / 100;
}

function buildSeed(): Transaction[] {
  const txns: Transaction[] = [];
  const today = new Date();
  let id = 0;

  for (let back = 5; back >= 0; back--) {
    const base = new Date(today.getFullYear(), today.getMonth() - back, 1);
    const daysInMonth = new Date(base.getFullYear(), base.getMonth() + 1, 0).getDate();

    // Salary on the 1st
    txns.push({
      id: `s${id++}`,
      type: 'income',
      amount: round(rand(5400, 6200)),
      category: 'Salary',
      description: 'Monthly salary',
      date: toISO(new Date(base.getFullYear(), base.getMonth(), 1)),
    });
    // Freelance mid month
    txns.push({
      id: `f${id++}`,
      type: 'income',
      amount: round(rand(800, 2200)),
      category: 'Freelance',
      description: 'Freelance project payout',
      date: toISO(new Date(base.getFullYear(), base.getMonth(), 15)),
    });
    // Investments occasional
    if (back % 2 === 0) {
      txns.push({
        id: `i${id++}`,
        type: 'income',
        amount: round(rand(150, 600)),
        category: 'Investments',
        description: 'Dividend payout',
        date: toISO(new Date(base.getFullYear(), base.getMonth(), 20)),
      });
    }

    // Housing rent on the 3rd
    txns.push({
      id: `h${id++}`,
      type: 'expense',
      amount: round(rand(1500, 1750)),
      category: 'Housing',
      description: 'Apartment rent',
      date: toISO(new Date(base.getFullYear(), base.getMonth(), 3)),
    });
    // Utilities
    txns.push({
      id: `u${id++}`,
      type: 'expense',
      amount: round(rand(120, 230)),
      category: 'Utilities',
      description: 'Electricity & water',
      date: toISO(new Date(base.getFullYear(), base.getMonth(), 8)),
    });
    txns.push({
      id: `u2${id++}`,
      type: 'expense',
      amount: round(rand(40, 90)),
      category: 'Utilities',
      description: 'Internet bill',
      date: toISO(new Date(base.getFullYear(), base.getMonth(), 12)),
    });

    // Food - several grocery trips
    const groceryCount = 4 + Math.floor(rand(0, 3));
    for (let g = 0; g < groceryCount; g++) {
      const day = 2 + Math.floor(rand(0, daysInMonth - 4));
      txns.push({
        id: `g${id++}`,
        type: 'expense',
        amount: round(rand(40, 160)),
        category: 'Food',
        description: g % 2 === 0 ? 'Grocery run' : 'Restaurant dinner',
        date: toISO(new Date(base.getFullYear(), base.getMonth(), Math.min(day, daysInMonth))),
      });
    }

    // Transport - fuel + rideshare
    const transportCount = 3 + Math.floor(rand(0, 3));
    for (let t = 0; t < transportCount; t++) {
      const day = 1 + Math.floor(rand(0, daysInMonth - 1));
      txns.push({
        id: `t${id++}`,
        type: 'expense',
        amount: round(rand(20, 95)),
        category: 'Transport',
        description: t % 2 === 0 ? 'Fuel refill' : 'Rideshare trip',
        date: toISO(new Date(base.getFullYear(), base.getMonth(), Math.min(day, daysInMonth))),
      });
    }

    // Shopping
    const shopCount = 1 + Math.floor(rand(0, 4));
    for (let s = 0; s < shopCount; s++) {
      const day = 1 + Math.floor(rand(0, daysInMonth - 1));
      txns.push({
        id: `sh${id++}`,
        type: 'expense',
        amount: round(rand(30, 350)),
        category: 'Shopping',
        description: ['Online order', 'Clothing', 'Home goods', 'Electronics'][s % 4],
        date: toISO(new Date(base.getFullYear(), base.getMonth(), Math.min(day, daysInMonth))),
      });
    }

    // Entertainment
    const entCount = 1 + Math.floor(rand(0, 4));
    for (let e = 0; e < entCount; e++) {
      const day = 1 + Math.floor(rand(0, daysInMonth - 1));
      txns.push({
        id: `e${id++}`,
        type: 'expense',
        amount: round(rand(12, 120)),
        category: 'Entertainment',
        description: ['Streaming sub', 'Movie night', 'Concert ticket', 'Game purchase'][e % 4],
        date: toISO(new Date(base.getFullYear(), base.getMonth(), Math.min(day, daysInMonth))),
      });
    }

    // Health occasional
    if (Math.random() > 0.4) {
      txns.push({
        id: `he${id++}`,
        type: 'expense',
        amount: round(rand(25, 220)),
        category: 'Health',
        description: 'Pharmacy & checkup',
        date: toISO(new Date(base.getFullYear(), base.getMonth(), 10 + Math.floor(rand(0, 15)))),
      });
    }
  }
  return txns.sort((a, b) => (a.date < b.date ? 1 : -1));
}

export const SEED_TRANSACTIONS = buildSeed();
