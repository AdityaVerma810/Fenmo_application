export type Expense = {
  id: string;
  amount_paise: number;
  category: string;
  description: string;
  date: string; // YYYY-MM-DD
  created_at: string; // ISO datetime
  idempotency_key: string;
};

export type ExpensesFile = {
  expenses: Expense[];
};

