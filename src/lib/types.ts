export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  category: string;
  description: string;
  date: string; // ISO date
}

export interface Budget {
  category: string;
  limit: number;
  color: string;
}

export interface CategoryMeta {
  name: string;
  color: string;
  icon: string; // lucide icon name
}
