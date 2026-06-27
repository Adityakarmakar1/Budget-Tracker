import { getSupabase } from './supabase';
import type { Budget, CategoryMeta, Transaction } from './types';
import { DEFAULT_BUDGETS } from './seed';

export interface UserData {
  transactions: Transaction[];
  budgets: Budget[];
  customCategories: CategoryMeta[];
}

/* ------------------------------------------------------------------ */
/*  Load                                                              */
/* ------------------------------------------------------------------ */

export async function loadUserData(userId: string): Promise<UserData> {
  const supabase = getSupabase();

  const [txRes, budRes, catRes] = await Promise.all([
    supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false }),
    supabase.from('budgets').select('*').eq('user_id', userId),
    supabase.from('custom_categories').select('*').eq('user_id', userId),
  ]);

  const transactions: Transaction[] = (txRes.data ?? []).map((r: any) => ({
    id: r.id,
    type: r.type,
    amount: Number(r.amount),
    category: r.category,
    description: r.description ?? '',
    date: r.date,
  }));

  let budgets: Budget[] = (budRes.data ?? []).map((r: any) => ({
    category: r.category,
    limit: Number(r.limit),
    color: r.color,
  }));

  // Seed default budgets for new users.
  if (budgets.length === 0) {
    await Promise.all(
      DEFAULT_BUDGETS.map((b) =>
        supabase.from('budgets').insert({
          user_id: userId,
          category: b.category,
          limit: b.limit,
          color: b.color,
        }),
      ),
    );
    budgets = [...DEFAULT_BUDGETS];
  }

  const customCategories: CategoryMeta[] = (catRes.data ?? []).map((r: any) => ({
    name: r.name,
    color: r.color,
    icon: r.icon ?? 'Tag',
  }));

  return { transactions, budgets, customCategories };
}

/* ------------------------------------------------------------------ */
/*  Transactions                                                      */
/* ------------------------------------------------------------------ */

export async function createTransaction(
  userId: string,
  t: Omit<Transaction, 'id'>,
): Promise<Transaction> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('transactions')
    .insert({
      user_id: userId,
      type: t.type,
      amount: t.amount,
      category: t.category,
      description: t.description,
      date: t.date,
    })
    .select()
    .single();
  if (error || !data) throw new Error(error?.message ?? 'Insert failed');
  return {
    id: data.id,
    type: data.type,
    amount: Number(data.amount),
    category: data.category,
    description: data.description ?? '',
    date: data.date,
  };
}

export async function deleteTransactionDb(id: string): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('transactions').delete().eq('id', id);
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Budgets                                                           */
/* ------------------------------------------------------------------ */

export async function upsertBudget(
  userId: string,
  category: string,
  limit: number,
  color: string,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('budgets')
    .upsert(
      { user_id: userId, category, limit, color },
      { onConflict: 'user_id,category' },
    );
  if (error) throw new Error(error.message);
}

export async function resetBudgetsDb(userId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase.from('budgets').delete().eq('user_id', userId);
  await Promise.all(
    DEFAULT_BUDGETS.map((b) =>
      supabase.from('budgets').insert({
        user_id: userId,
        category: b.category,
        limit: b.limit,
        color: b.color,
      }),
    ),
  );
}

/* ------------------------------------------------------------------ */
/*  Custom categories                                                 */
/* ------------------------------------------------------------------ */

export async function createCategory(
  userId: string,
  meta: CategoryMeta,
): Promise<void> {
  const supabase = getSupabase();
  const { error } = await supabase.from('custom_categories').insert({
    user_id: userId,
    name: meta.name,
    color: meta.color,
    icon: meta.icon,
  });
  if (error) throw new Error(error.message);
}

/* ------------------------------------------------------------------ */
/*  Reset all                                                         */
/* ------------------------------------------------------------------ */

export async function deleteAllUserData(userId: string): Promise<void> {
  const supabase = getSupabase();
  await Promise.all([
    supabase.from('transactions').delete().eq('user_id', userId),
    supabase.from('custom_categories').delete().eq('user_id', userId),
  ]);
  // Restore default budgets
  await resetBudgetsDb(userId);
}
